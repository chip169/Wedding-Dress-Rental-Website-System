import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Dress from '../models/dressModel.js';
import ReturnInspection from '../models/returnInspectionModel.js';
import Contract from '../models/contractModel.js';
import ContractTemplate from '../models/contractTemplateModel.js';
import User from '../models/userModel.js';
import {
  sendInspectionNotificationEmail,
  sendRefundConfirmationEmail,
  sendDepositSuccessEmail,
} from '../utils/sendEmail.js';

/**
 * Service xử lý nghiệp vụ Đơn Thuê Váy và Hợp Đồng (Orders)
 */

/**
 * Hàm hỗ trợ parse ngày an toàn từ định dạng ISO YYYY-MM-DD hoặc DD/MM/YYYY
 */
function parseDateSafe(val, fallbackDate = new Date()) {
  if (!val) return fallbackDate;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? fallbackDate : val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed === 'Invalid Date' || trimmed === 'NaN') {
      return fallbackDate;
    }
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        if (!isNaN(dt.getTime())) return dt;
      }
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return fallbackDate;
}

export const createOrder = async (orderData, currentUser = null) => {
  const {
    items,
    dress,
    rentalStartDate,
    rentalEndDate,
    rentalDays,
    shippingAddress,
    deliveryMethod,
    customerName,
    brideName,
    customerPhone,
    phone,
    customerEmail,
    email,
    customerCccd,
    cccd,
    contractCode,
    contractSignature,
    measurements,
    depositOption,
    notes,
  } = orderData;

  // Chuẩn hóa danh sách sản phẩm thuê
  const sanitizeImage = (img) => {
    if (typeof img === 'string' && img.length > 50000) {
      return 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=80';
    }
    return img || '';
  };

  let resolvedItems = [];
  if (Array.isArray(items) && items.length > 0) {
    resolvedItems = items.map((item) => ({
      dressId: item.dressId || item.id || 'dress_custom',
      code: item.code || item.dressCode || '',
      name: item.name || 'Váy cưới Haute Couture',
      size: item.size || 'S',
      color: item.color || item.selectedColor?.name || item.fabric || orderData.color || orderData.selectedColor || 'Trắng Sữa',
      rentPrice: Number(item.rentPrice || item.price || 0),
      depositAmount: Number(item.depositAmount || item.deposit || 0),
      image: sanitizeImage(item.image || item.images?.[0]),
    }));
  } else if (dress) {
    resolvedItems = [
      {
        dressId: dress.id || dress._id || 'dress_custom',
        code: dress.code || '',
        name: dress.name || 'Váy cưới Haute Couture',
        size: orderData.selectedSize || dress.size || 'S',
        color: orderData.selectedColor || orderData.color || dress.color || 'Trắng Sữa',
        rentPrice: Number(dress.price || 0),
        depositAmount: Number(dress.depositAmount || dress.deposit || 0),
        image: sanitizeImage(dress.image || dress.images?.[0]),
      },
    ];
  }

  if (resolvedItems.length === 0) {
    throw new Error('Đơn thuê cần ít nhất 1 sản phẩm váy cưới.');
  }

  // Tính toán chi phí
  const totalRentPrice = resolvedItems.reduce((sum, item) => sum + item.rentPrice, 0);
  const totalDeposit = resolvedItems.reduce((sum, item) => sum + item.depositAmount, 0);
  const shippingFee = Number(orderData.shippingFee || 0);
  const discountAmount = Number(orderData.discountAmount || 0);

  // Số tiền cọc cần thanh toán ban đầu (50% hoặc 100%)
  const is50Percent = depositOption === 'deposit30'; // deposit30 đại diện cho cọc 50%
  const depositPaidAmount = is50Percent ? Math.round(totalRentPrice * 0.5) : totalRentPrice;
  const totalPayment = totalRentPrice + totalDeposit + shippingFee - discountAmount;

  // Tạo mã đơn ngẫu nhiên chuẩn UniBridal
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const orderCode = `UB-2026-${randomSuffix}`;

  const resolvedStartDate = parseDateSafe(rentalStartDate, new Date());
  const resolvedEndDate = parseDateSafe(rentalEndDate, new Date(Date.now() + 4 * 24 * 60 * 60 * 1000));

  // Kiểm tra không được đặt ngày trong quá khứ
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (resolvedStartDate < todayStart) {
    throw new Error('Ngày bắt đầu thuê không thể là ngày trong quá khứ.');
  }

  if (resolvedEndDate < resolvedStartDate) {
    throw new Error('Ngày hoàn trả không thể trước ngày bắt đầu thuê.');
  }

  // Kiểm tra trùng lịch thuê váy (Overlap conflict check)
  const bookedStatuses = ['deposit_paid', 'active', 'confirmed', 'preparing', 'delivered', 'renting'];
  for (const item of resolvedItems) {
    if (!item.dressId) continue;
    const dressIdStr = String(item.dressId);
    const dressConditions = [{ 'items.dressId': dressIdStr }];
    if (mongoose.Types.ObjectId.isValid(dressIdStr)) {
      dressConditions.push({ 'items.dressId': new mongoose.Types.ObjectId(dressIdStr) });
    }
    const num = Number(dressIdStr);
    if (!isNaN(num)) {
      dressConditions.push({ 'items.dressId': num });
    }

    const overlappingOrder = await Order.findOne({
      status: { $in: bookedStatuses },
      $or: dressConditions,
      rentalStartDate: { $lte: resolvedEndDate },
      rentalEndDate: { $gte: resolvedStartDate },
    });

    if (overlappingOrder) {
      const s = overlappingOrder.rentalStartDate ? new Date(overlappingOrder.rentalStartDate).toLocaleDateString('vi-VN') : '';
      const e = overlappingOrder.rentalEndDate ? new Date(overlappingOrder.rentalEndDate).toLocaleDateString('vi-VN') : '';
      throw new Error(
        `Váy "${item.name}" đã có nàng dâu khác cọc thuê kín lịch trong khoảng từ ${s} đến ${e}. Vui lòng chọn khoảng ngày khác!`
      );
    }
  }

  const newOrder = new Order({
    orderCode,
    customerId: currentUser?._id || null,
    customerName: customerName || brideName || currentUser?.fullName || '',
    customerPhone: customerPhone || phone || currentUser?.phone || '',
    customerEmail: customerEmail || email || currentUser?.email || '',
    customerCccd: customerCccd || cccd || '',
    contractCode: contractCode || `HĐ-${orderCode}`,
    contractSignature: contractSignature || customerName || brideName || '',
    measurements: measurements || {},
    items: resolvedItems,
    rentalStartDate: resolvedStartDate,
    rentalEndDate: resolvedEndDate,
    rentalDays: Number(rentalDays || 4),
    totalRentPrice,
    totalDeposit,
    depositPaidAmount,
    shippingFee,
    discountAmount,
    totalPayment,
    status: orderData.status || 'deposit_paid',
    shippingAddress: shippingAddress || 'Nhận trực tiếp tại Showroom UniBridal',
    deliveryMethod: deliveryMethod || 'showroom',
    rentalAgreementAccepted: true,
    notes: notes || '',
  });

  await newOrder.save();

  // Tự động khởi tạo hợp đồng điện tử có hiệu lực pháp lý
  try {
    const defaultTemplate = await ContractTemplate.findOne({
      $or: [{ code: 'TPL-HC-01' }, { isDefault: true }],
    }).lean();

    const firstItem = newOrder.items[0] || {};
    await Contract.create({
      contractCode: newOrder.contractCode,
      orderId: newOrder._id,
      customerId: newOrder.customerId || null,
      templateId: defaultTemplate?._id || null,
      templateName: defaultTemplate?.name || 'Hợp Đồng Thuê Lễ Phục Cưới Cao Cấp (Haute Couture)',
      customerName: newOrder.customerName || 'Cô Dâu UniBridal',
      phone: newOrder.customerPhone || '0908123888',
      idCard: newOrder.customerCccd || '',
      items: (newOrder.items || []).map((it) => ({
        dressId: it.dressId || null,
        name: it.name || '',
        code: it.code || '',
        size: it.size || 'S',
        color: it.color || 'Trắng Sữa',
        rentPrice: it.rentPrice || 0,
        depositAmount: it.depositAmount || 0,
        image: it.image || '',
      })),
      dressInfo: {
        dressId: (firstItem.dressId && mongoose.Types.ObjectId.isValid(firstItem.dressId)) ? firstItem.dressId : null,
        name: firstItem.name || 'Váy Cưới Haute Couture',
        code: firstItem.code || 'UB-HC-2026',
        size: firstItem.size || 'S',
        image: firstItem.image || '',
      },
      startDate: newOrder.rentalStartDate,
      endDate: newOrder.rentalEndDate,
      rentalPrice: newOrder.totalRentPrice,
      depositAmount: newOrder.totalDeposit,
      totalValue: newOrder.totalPayment,
      status: 'active',
      signedAt: new Date(),
      signedMethod: 'Chữ ký điện tử trực tuyến',
      contractSignature: newOrder.contractSignature || newOrder.customerName || '',
      packageType: `Gói ${newOrder.rentalDays} Ngày Tiêu Chuẩn`,
      clauses: defaultTemplate?.clauses || [],
    });
  } catch (contractErr) {
    console.error('[AUTO CREATE CONTRACT ERROR]:', contractErr.message);
  }

  // Tự động gửi email xác nhận đặt cọc thành công
  try {
    const targetEmail = newOrder.customerEmail || currentUser?.email;
    if (targetEmail) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      sendDepositSuccessEmail({
        to: targetEmail,
        fullName: newOrder.customerName || 'Quý khách',
        orderCode: newOrder.orderCode,
        contractCode: newOrder.contractCode,
        items: newOrder.items,
        rentalStartDate: newOrder.rentalStartDate,
        rentalEndDate: newOrder.rentalEndDate,
        weddingDate: orderData.weddingDate,
        rentalDays: newOrder.rentalDays,
        totalRentPrice: newOrder.totalRentPrice,
        totalDeposit: newOrder.totalDeposit,
        depositPaidAmount: newOrder.depositPaidAmount,
        remainingAmount: Math.max(0, newOrder.totalPayment - newOrder.depositPaidAmount),
        deliveryMethod: newOrder.deliveryMethod,
        shippingAddress: newOrder.shippingAddress,
        orderDetailUrl: `${clientUrl}/profile/orders`,
      }).catch((err) => console.error('[EMAIL DEPOSIT SEND ERROR]', err.message));
    }
  } catch (err) {
    console.error('[TRIGGER DEPOSIT EMAIL ERROR]', err.message);
  }

  return newOrder;
};

export const getMyOrders = async (userId) => {
  if (!userId) return [];
  const user = await User.findById(userId).lean();
  const conditions = [{ customerId: userId }];
  if (user?.email) {
    conditions.push({ customerEmail: user.email });
    conditions.push({ email: user.email });
  }
  if (user?.phone) {
    conditions.push({ customerPhone: user.phone });
    conditions.push({ phone: user.phone });
  }
  const orders = await Order.find({ $or: conditions }).sort({ createdAt: -1 }).lean();
  const orderIds = orders.map((o) => o._id);
  const inspections = await ReturnInspection.find({ orderId: { $in: orderIds } }).select('-evidencePhotos').lean();
  const inspectionMap = new Map(inspections.map((i) => [String(i.orderId), i]));
  return orders.map((o) => ({
    ...o,
    inspection: inspectionMap.get(String(o._id)) || null,
  }));
};

export const getAllOrders = async (filters = {}) => {
  const query = {};
  if (filters.status === 'disputed') {
    const disputedInspections = await ReturnInspection.find({ customerStatus: 'disputed' }).select('orderId').lean();
    const disputedOrderIds = disputedInspections.map((i) => i.orderId);
    query.$or = [
      { _id: { $in: disputedOrderIds } },
      { status: 'disputed' }
    ];
  } else if (filters.status && filters.status !== 'all') {
    query.status = filters.status;
  } else if (!filters.search) {
    if (filters.viewMode === 'active') {
      query.status = { $nin: ['completed', 'complete', 'cancelled'] };
    } else if (filters.viewMode === 'archived') {
      query.status = { $in: ['completed', 'complete', 'cancelled'] };
    }
  }
  if (filters.search) {
    const rawSearch = String(filters.search).trim();
    const cleanSearch = rawSearch.replace(/^[#\s]+/, ''); // Loại bỏ ký tự # nếu người dùng nhập "#UB-2026-0012"
    query.$or = [
      { orderCode: { $regex: cleanSearch, $options: 'i' } },
      { customerName: { $regex: rawSearch, $options: 'i' } },
      { customerPhone: { $regex: cleanSearch, $options: 'i' } },
      { 'items.name': { $regex: rawSearch, $options: 'i' } },
      { 'items.code': { $regex: cleanSearch, $options: 'i' } },
    ];
  }

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Lấy tổng quan số liệu toàn hệ thống showroom (không bị phụ thuộc vào từ khóa tìm kiếm)
  const [totalAll, rentingCount, completedCount, cancelledCount, total, orders] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ status: 'renting' }),
    Order.countDocuments({ status: { $in: ['completed', 'complete'] } }),
    Order.countDocuments({ status: 'cancelled' }),
    Order.countDocuments(query),
    Order.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const orderIds = orders.map((o) => o._id);
  const [inspections, contracts] = await Promise.all([
    ReturnInspection.find({ orderId: { $in: orderIds } }).select('-evidencePhotos').lean(),
    Contract.find({ orderId: { $in: orderIds } }).select('orderId contractCode status packageType').lean(),
  ]);
  const inspectionMap = new Map(inspections.map((i) => [String(i.orderId), i]));
  const contractMap = new Map(contracts.map((c) => [String(c.orderId), c]));

  // Lấy thông tin mã sản phẩm (SKU) cho các items trong đơn nếu chưa có sẵn
  const dressNames = [];
  const dressIds = [];
  orders.forEach((o) => {
    (o.items || []).forEach((it) => {
      if (!it.code) {
        if (it.name) dressNames.push(it.name);
        if (it.dressId) dressIds.push(it.dressId);
      }
    });
  });

  const dressCodeMap = new Map();
  if (dressNames.length > 0 || dressIds.length > 0) {
    try {
      const validObjectIds = dressIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      const orClauses = [];
      if (dressNames.length > 0) orClauses.push({ name: { $in: dressNames } });
      if (validObjectIds.length > 0) orClauses.push({ _id: { $in: validObjectIds } });

      if (orClauses.length > 0) {
        const foundDresses = await Dress.find({ $or: orClauses }).select('name code _id').lean();
        foundDresses.forEach((d) => {
          if (d.name) dressCodeMap.set(d.name.trim().toLowerCase(), d.code);
          if (d._id) dressCodeMap.set(String(d._id), d.code);
        });
      }
    } catch {
      // Bỏ qua lỗi truy vấn phụ nếu có
    }
  }

  const enrichedOrders = orders.map((o) => {
    const hasAccount = Boolean(o.customerId && String(o.customerId).trim() !== '');
    const insp = inspectionMap.get(String(o._id)) || null;
    const contract = contractMap.get(String(o._id)) || null;
    let status = o.status;
    const isCustomerApproved = insp?.customerStatus === 'approved' || insp?.customerConfirmed;
    if (isCustomerApproved && status !== 'completed' && status !== 'complete') {
      status = 'completed';
      Order.updateOne(
        { _id: o._id },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            maintenanceUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        }
      ).catch(() => {});
    }

    const items = (o.items || []).map((it) => {
      const code =
        it.code ||
        dressCodeMap.get(it.name?.trim().toLowerCase()) ||
        dressCodeMap.get(String(it.dressId)) ||
        '';
      return {
        ...it,
        code,
        color: it.color || it.fabric || o.color || 'Trắng Sữa',
      };
    });

    return {
      ...o,
      items,
      status,
      hasAccount,
      isGuest: !hasAccount,
      inspection: insp,
      contract: contract || o.contract || null,
    };
  });

  return {
    orders: enrichedOrders,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      total: totalAll,
      renting: rentingCount,
      completed: completedCount,
      cancelled: cancelledCount,
      active: Math.max(0, totalAll - completedCount - cancelledCount),
    },
  };
};

export const getOrderByIdOrCode = async (idOrCode) => {
  const isObjectId = idOrCode.match(/^[0-9a-fA-F]{24}$/);
  const query = isObjectId ? { _id: idOrCode } : { orderCode: idOrCode.toUpperCase() };

  const order = await Order.findOne(query).lean();
  if (!order) {
    throw new Error('Không tìm thấy thông tin đơn thuê.');
  }
  const inspection = await ReturnInspection.findOne({ orderId: order._id }).lean();
  let status = order.status;
  const isCustomerApproved = inspection?.customerStatus === 'approved' || inspection?.customerConfirmed;
  if (isCustomerApproved && status !== 'completed' && status !== 'complete') {
    status = 'completed';
    Order.updateOne(
      { _id: order._id },
      {
        $set: {
          status: 'completed',
          completedAt: new Date(),
          maintenanceUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }
    ).catch(() => {});
  }
  const items = (order.items || []).map((it) => ({
    ...it,
    color: it.color || it.fabric || order.color || 'Trắng Sữa',
  }));
  return {
    ...order,
    items,
    status,
    inspection: inspection || null,
  };
};

export const updateOrderStatus = async (idOrCode, status) => {
  const isObjectId = idOrCode.match(/^[0-9a-fA-F]{24}$/);
  const query = isObjectId ? { _id: idOrCode } : { orderCode: idOrCode.toUpperCase() };
  const order = await Order.findOne(query);
  if (!order) throw new Error('Không tìm thấy đơn hàng.');

  order.status = status;
  if (status === 'completed' || status === 'complete') {
    order.completedAt = order.completedAt || new Date();
    order.maintenanceUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  await order.save();

  if (status === 'completed' || status === 'complete') {
    const insp = await ReturnInspection.findOneAndUpdate(
      { orderId: order._id },
      { isRefunded: true, refundedAt: new Date(), customerStatus: 'approved', customerConfirmedAt: new Date() },
      { new: true }
    );
    // Tự động đồng bộ hợp đồng pháp lý sang trạng thái hoàn thành
    await Contract.findOneAndUpdate(
      { $or: [{ orderId: order._id }, { contractCode: order.contractCode }] },
      { status: 'completed' }
    ).catch(() => {});

    // Gửi email biên lai hoàn cọc khi hoàn cọc thành công
    if (insp) {
      try {
        let customerEmail = order.customerEmail || order.email;
        let customerName = order.customerName || order.brideName || 'Quý khách';
        if (!customerEmail && order.customerId) {
          const customer = await User.findById(order.customerId).lean();
          if (customer) {
            customerEmail = customer.email;
            customerName = customer.fullName || customerName;
          }
        }
        if (customerEmail) {
          sendRefundConfirmationEmail({
            to: customerEmail,
            fullName: customerName,
            orderCode: order.orderCode,
            finalRefundAmount: insp.finalRefundAmount,
            bankDetails: insp.refundBankDetails,
          }).catch((err) => console.error('[EMAIL REFUND SEND ERROR]', err.message));
        }
      } catch (err) {
        console.error('[EMAIL REFUND NOTIFICATION ERROR]', err.message);
      }
    }
  } else if (status === 'cancelled') {
    await Contract.findOneAndUpdate(
      { $or: [{ orderId: order._id }, { contractCode: order.contractCode }] },
      { status: 'cancelled' }
    ).catch(() => {});
  } else if (['deposit_paid', 'active', 'delivered', 'renting'].includes(status)) {
    await Contract.findOneAndUpdate(
      { $or: [{ orderId: order._id }, { contractCode: order.contractCode }] },
      { status: 'active' }
    ).catch(() => {});
  }

  return order;
};

export const getDressBookedDates = async (dressId) => {
  // Quét toàn bộ các đơn thuê của chiếc váy đang ở các trạng thái đã cọc/đang chuẩn bị/đang thuê
  const bookedStatuses = ['deposit_paid', 'active', 'confirmed', 'preparing', 'delivered', 'renting'];
  const query = {
    status: { $in: bookedStatuses },
  };

  if (dressId) {
    const dressIdStr = String(dressId);
    const conditions = [{ 'items.dressId': dressIdStr }];
    if (mongoose.Types.ObjectId.isValid(dressIdStr)) {
      conditions.push({ 'items.dressId': new mongoose.Types.ObjectId(dressIdStr) });
    }
    const num = Number(dressIdStr);
    if (!isNaN(num)) {
      conditions.push({ 'items.dressId': num });
    }
    query.$or = conditions;
  }

  const orders = await Order.find(query).select('orderCode rentalStartDate rentalEndDate customerName');
  return orders.map((o) => ({
    orderCode: o.orderCode,
    startDate: o.rentalStartDate,
    endDate: o.rentalEndDate,
    bride: o.customerName || 'Nàng dâu UniBridal',
  }));
};

/**
 * Lập biên bản kiểm định tình trạng váy khi khách trả
 * @param {string} orderId - ID đơn thuê
 * @param {Object} data - { itemsCondition,
    evidencePhotos: data.evidencePhotos || [], lateDays, staffId }
 * @param {Object} staffUser - user object của nhân viên
 */
export const submitReturnInspection = async (orderId, data, staffUser) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Không tìm thấy đơn thuê.');

  if (!['renting', 'delivered', 'returned'].includes(order.status)) {
    throw new Error('Đơn thuê chưa ở trạng thái có thể kiểm định. Vui lòng xác nhận khách đã nhận váy trước.');
  }

  // Tính số ngày trễ và phí phạt trễ hạn: 50% tiền thuê mỗi ngày, quá 5 ngày chưa trả tịch thu 100% tiền cọc
  const today = new Date();
  const dueDate = new Date(order.rentalEndDate);
  const lateDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
  const totalDeposit = Number(order.totalDeposit || 0);
  const totalRentPrice = Number(order.totalRentPrice || 0);

  let latePenaltyFee = 0;
  if (lateDays > 5) {
    // Quá 5 ngày chưa trả: tịch thu 100% tiền cọc
    latePenaltyFee = totalDeposit;
  } else if (lateDays > 0) {
    // Trễ hạn 1 - 5 ngày: phạt 50% giá phí thuê mỗi ngày
    latePenaltyFee = Math.min(totalDeposit, lateDays * Math.round(totalRentPrice * 0.5));
  }

  // Tổng khấu trừ từ hư hỏng
  const maxAllowed = totalDeposit || totalRentPrice || 0;
  const itemsCondition = (data.itemsCondition || []).map((item) => {
    const fee = Number(item.repairFee ?? item.compensation ?? 0);
    if (fee > maxAllowed && maxAllowed > 0) {
      throw new Error(`Số tiền bồi thường không được lớn hơn giá trị của váy (Tối đa: ${maxAllowed.toLocaleString('vi-VN')} đ)`);
    }
    return {
      dressId: item.dressId || item.id || null,
      condition: item.condition || 'good',
      damageName: item.damageName || '',
      feeLabel: item.feeLabel || '',
      note: item.note || item.damageNotes || '',
      repairFee: Math.max(0, fee),
    };
  });
  const damageTotal = itemsCondition.reduce((sum, i) => sum + i.repairFee, 0);
  const evidencePhotos = Array.isArray(data.evidencePhotos) ? data.evidencePhotos : [];

  // BẮT BUỘC CHỤP ẢNH LỖI ĐẦY ĐỦ nếu có ghi nhận tình trạng váy bị bẩn, rách hoặc có phí bồi thường
  const hasDamage = itemsCondition.some((it) => it.condition !== 'good' && it.condition !== 'normal_wear' || it.repairFee > 0);
  if (hasDamage && evidencePhotos.length === 0) {
    throw new Error('Bắt buộc chụp hoặc tải ít nhất 1 ảnh bằng chứng lỗi hư hại của váy trước khi lập biên bản kiểm định!');
  }

  const totalDeduction = Math.min(totalDeposit, latePenaltyFee + damageTotal);
  const finalRefundAmount = Math.max(0, totalDeposit - totalDeduction);
  const holdForAdmin = Boolean(data.holdForAdmin || data.customerAgreed === false);
  const confirmOnSite = !holdForAdmin && Boolean(data.confirmOnSite);
  const refundMethod = data.refundMethod || 'bank_transfer';
  const refundBankDetails = (!holdForAdmin && confirmOnSite) ? (data.refundBankDetails || {
    bankName: data.bankName || 'Chuyển khoản ngân hàng',
    accountNumber: data.accountNumber || '',
    accountHolder: order.customerName || order.brideName || 'Khách hàng',
    notes: 'Showroom chuyển khoản trực tiếp cho khách qua STK',
  }) : null;

  // Upsert: nếu đã có biên bản kiểm định thì cập nhật lại biên bản và số tiền trừ
  let inspection = await ReturnInspection.findOne({ orderId });
  if (inspection) {
    if (inspection.customerStatus === 'approved' || inspection.customerConfirmed) {
      const err = new Error('Khách hàng đã duyệt biên bản kiểm định, không thể chỉnh sửa.');
      err.statusCode = 400;
      throw err;
    }
    inspection.staffId = staffUser?._id || inspection.staffId;
    inspection.returnedAt = new Date();
    inspection.lateDays = lateDays;
    inspection.latePenaltyFee = latePenaltyFee;
    inspection.itemsCondition = itemsCondition;
    inspection.evidencePhotos = evidencePhotos.length > 0 ? evidencePhotos : inspection.evidencePhotos;
    inspection.totalDeduction = totalDeduction;
    inspection.initialDeposit = order.totalDeposit;
    inspection.finalRefundAmount = finalRefundAmount;
    inspection.customerStatus = holdForAdmin ? 'disputed' : (confirmOnSite ? 'approved' : 'pending');
    inspection.isRefunded = confirmOnSite;
    inspection.refundedAt = confirmOnSite ? new Date() : null;
    inspection.customerConfirmedAt = confirmOnSite ? new Date() : null;
    inspection.disputeReason = holdForAdmin ? (data.disputeReason || 'Khách hàng không đồng ý với mức phạt/biên bản kiểm định tại chỗ') : '';
    inspection.disputeCreatedAt = holdForAdmin ? new Date() : null;
    if (confirmOnSite && refundBankDetails) {
      inspection.refundBankDetails = refundBankDetails;
    }
    await inspection.save();
  } else {
    inspection = new ReturnInspection({
      orderId: order._id,
      staffId: staffUser?._id,
      returnedAt: new Date(),
      lateDays,
      latePenaltyFee,
      itemsCondition,
      evidencePhotos,
      totalDeduction,
      initialDeposit: order.totalDeposit,
      finalRefundAmount,
      isRefunded: confirmOnSite,
      refundedAt: confirmOnSite ? new Date() : null,
      customerStatus: holdForAdmin ? 'disputed' : (confirmOnSite ? 'approved' : 'pending'),
      customerConfirmedAt: confirmOnSite ? new Date() : null,
      disputeReason: holdForAdmin ? (data.disputeReason || 'Khách hàng không đồng ý với mức phạt/biên bản kiểm định tại chỗ') : '',
      disputeCreatedAt: holdForAdmin ? new Date() : null,
      refundBankDetails: confirmOnSite && refundBankDetails ? refundBankDetails : undefined,
    });
    await inspection.save();
  }

  // Cập nhật trạng thái đơn
  order.actualReturnDate = new Date();
  if (holdForAdmin) {
    // TRƯỜNG HỢP 2: Giữ đơn chuyển Admin đàm phán
    order.status = 'disputed';
    await order.save();
  } else {
    // Hoàn tất kiểm định -> Tự động chuyển sang trạng thái "Chờ hoàn cọc"
    // Chỉ khi hệ thống/nhân viên hoàn cọc thành công thì đơn hàng mới chuyển sang "Hoàn tất"
    order.status = 'waiting_refund';
    await order.save();
  }

  // Tự động gửi email biên bản kiểm định lễ phục tới khách hàng ngay khi hoàn tất kiểm tra
  try {
    let customerEmail = order.customerEmail || order.email || data.customerEmail;
    let customerName = order.customerName || order.brideName || 'Quý khách';

    if (!customerEmail && order.customerId) {
      const customer = await User.findById(order.customerId).lean();
      if (customer) {
        customerEmail = customer.email;
        customerName = customer.fullName || customerName;
      }
    }

    if (!customerEmail) {
      const contract = await Contract.findOne({
        $or: [{ orderId: order._id }, { contractCode: order.contractCode }],
      }).lean();
      if (contract?.customerInfo?.email) {
        customerEmail = contract.customerInfo.email;
        customerName = contract.customerInfo.fullName || customerName;
      }
    }

    if (customerEmail) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const inspectionItems = (inspection.itemsCondition || []).map((it) => ({
        name: `${it.damageName || 'Váy cưới'} (${it.note || it.condition || 'Hiện trạng'})`,
        status: it.repairFee > 0 ? `Khấu trừ ${it.repairFee.toLocaleString('vi-VN')} đ` : '✓ Nguyên vẹn',
        passed: !(it.repairFee > 0),
      }));

      sendInspectionNotificationEmail({
        to: customerEmail,
        fullName: customerName,
        orderCode: order.orderCode,
        inspectorName: staffUser?.fullName || 'Chuyên Viên Atelier UniBridal',
        inspectionDate: inspection.returnedAt,
        totalDeposit: order.totalDeposit,
        totalDeduction: inspection.totalDeduction,
        finalRefundAmount: inspection.finalRefundAmount,
        inspectionItems,
        bankDetails: inspection.refundBankDetails,
        returnUrl: `${clientUrl}/profile/orders`,
      }).catch((err) => console.error('[EMAIL INSPECTION SEND ERROR]', err.message));

      console.log(`[INSPECTION EMAIL SENT] Đã gửi biên bản kiểm định đơn #${order.orderCode} tới email: ${customerEmail}`);
    }
  } catch (err) {
    console.error('[EMAIL NOTIFICATION ERROR]', err.message);
  }

  return { order, inspection, heldForAdmin: holdForAdmin };
};

/**
 * Lấy biên bản kiểm định của một đơn thuê
 * @param {string} orderId
 */
export const getReturnInspection = async (orderId) => {
  const inspection = await ReturnInspection.findOne({ orderId }).lean();
  if (!inspection) return null;
  return inspection;
};

/**
 * Khách hàng đồng ý biên bản kiểm định -> Hệ thống tự động hoàn cọc và hoàn tất đơn hàng
 * @param {string} orderId
 * @param {Object} bankData - { bankName, accountNumber, accountHolder, notes }
 * @param {Object} customerUser
 */
export const approveReturnInspection = async (orderId, bankData = {}, customerUser) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Không tìm thấy đơn hàng.');

  const inspection = await ReturnInspection.findOne({ orderId });
  if (!inspection) throw new Error('Chưa có biên bản kiểm định cho đơn hàng này.');

  if (inspection.customerStatus === 'approved') {
    return { order, inspection, message: 'Biên bản đã được xác nhận trước đó.' };
  }

  const { bankName, accountNumber, accountHolder, notes } = bankData || {};

  inspection.customerStatus = 'approved';
  inspection.customerConfirmedAt = new Date();
  inspection.isRefunded = true;
  inspection.refundedAt = new Date();
  if (bankName || accountNumber || accountHolder) {
    inspection.refundBankDetails = {
      bankName: bankName ? String(bankName).trim() : '',
      accountNumber: accountNumber ? String(accountNumber).trim() : '',
      accountHolder: accountHolder ? String(accountHolder).trim().toUpperCase() : '',
      notes: notes ? String(notes).trim() : '',
    };
  }
  await inspection.save();

  order.status = 'completed';
  order.completedAt = order.completedAt || new Date();
  order.maintenanceUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await order.save();

  // Tự động gửi email xác nhận hoàn cọc thành công
  try {
    let customerEmail = order.customerEmail || order.email;
    let customerName = order.customerName || order.brideName || 'Quý khách';

    if (!customerEmail && order.customerId) {
      const customer = await User.findById(order.customerId).lean();
      if (customer) {
        customerEmail = customer.email;
        customerName = customer.fullName || customerName;
      }
    }

    if (customerEmail) {
      sendRefundConfirmationEmail({
        to: customerEmail,
        fullName: customerName,
        orderCode: order.orderCode,
        finalRefundAmount: inspection.finalRefundAmount,
        bankDetails: inspection.refundBankDetails,
      }).catch((err) => console.error('[EMAIL REFUND SEND ERROR]', err.message));
    }
  } catch (err) {
    console.error('[EMAIL REFUND NOTIFICATION ERROR]', err.message);
  }

  return { order, inspection };
};

/**
 * Khách hàng không đồng ý và gửi khiếu nại biên bản kiểm định
 * @param {string} orderId
 * @param {Object} param1 - { reason }
 * @param {Object} customerUser
 */
export const disputeReturnInspection = async (orderId, { reason }, customerUser) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Không tìm thấy đơn hàng.');

  const inspection = await ReturnInspection.findOne({ orderId });
  if (!inspection) throw new Error('Chưa có biên bản kiểm định cho đơn hàng này.');

  if (!reason || !reason.trim()) {
    throw new Error('Vui lòng nhập lý do khiếu nại biên bản.');
  }

  inspection.customerStatus = 'disputed';
  inspection.disputeReason = reason.trim();
  inspection.disputeCreatedAt = new Date();
  await inspection.save();

  return { order, inspection };
};

/**
 * Admin vào cuộc xử lý đàm phán mức phạt chung hợp lý và duyệt hoàn tất đơn
 * @param {string} orderId
 * @param {Object} data - { agreedPenalty, refundMethod, refundBankDetails, negotiationNotes }
 * @param {Object} adminUser
 */
export const settleInspectionAdmin = async (orderId, data, adminUser) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Không tìm thấy đơn hàng.');

  let inspection = await ReturnInspection.findOne({ orderId: order._id });
  if (!inspection) throw new Error('Chưa có biên bản kiểm định cho đơn hàng này.');

  const totalDeposit = Number(order.totalDeposit || 0);
  const agreedPenalty = Math.max(0, Math.min(totalDeposit, Number(data.agreedPenalty ?? data.agreedPenaltyFee ?? 0)));
  const finalRefund = Math.max(0, totalDeposit - agreedPenalty);
  const refundMethod = data.refundMethod || 'bank_transfer';
  const refundBankDetails = data.refundBankDetails || {
    bankName: data.bankName || 'Chuyển khoản ngân hàng',
    accountNumber: data.accountNumber || '',
    accountHolder: data.accountHolder || order.customerName || '',
    notes: data.negotiationNotes || 'Admin đã đàm phán và chuyển khoản hoàn tiền cho khách',
  };

  inspection.totalDeduction = agreedPenalty;
  inspection.agreedPenaltyFee = agreedPenalty;
  inspection.finalRefundAmount = finalRefund;
  inspection.customerStatus = 'approved';
  inspection.isRefunded = true;
  inspection.refundedAt = new Date();
  inspection.negotiatedByAdmin = true;
  inspection.adminNegotiatorId = adminUser?._id || null;
  inspection.adminNegotiatorName = adminUser?.fullName || 'Quản Trị Viên UniBridal';
  inspection.adminNegotiationNotes = data.negotiationNotes || 'Hai bên đã đàm phán và thống nhất mức phạt chung hợp lý.';
  inspection.adminSettledAt = new Date();
  inspection.refundBankDetails = refundBankDetails;
  await inspection.save();

  order.status = 'completed';
  order.completedAt = new Date();
  order.maintenanceUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await order.save();

  await Contract.findOneAndUpdate(
    { $or: [{ orderId: order._id }, { contractCode: order.contractCode }] },
    { status: 'completed' }
  ).catch(() => {});

  // Gửi email cảm ơn kèm biên lai hoàn cọc đã đàm phán
  try {
    let customerEmail = order.customerEmail || order.email;
    let customerName = order.customerName || order.brideName || 'Quý khách';
    if (!customerEmail && order.customerId) {
      const customer = await User.findById(order.customerId).lean();
      if (customer) {
        customerEmail = customer.email;
        customerName = customer.fullName || customerName;
      }
    }
    if (customerEmail) {
      sendRefundConfirmationEmail({
        to: customerEmail,
        fullName: customerName,
        orderCode: order.orderCode,
        finalRefundAmount: finalRefund,
        bankDetails: refundBankDetails,
        negotiationNote: inspection.adminNegotiationNotes,
      }).catch((err) => console.error('[EMAIL REFUND SEND ERROR]', err.message));
    }
  } catch (err) {
    console.error('[EMAIL REFUND NOTIFICATION ERROR]', err.message);
  }

  return { order, inspection };
};

