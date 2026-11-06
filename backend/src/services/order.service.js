import Order from '../models/Order.model.js';
import ReturnInspection from '../models/ReturnInspection.model.js';
import Contract from '../models/Contract.model.js';
import ContractTemplate from '../models/ContractTemplate.model.js';
import User from '../models/User.model.js';
import {
  sendInspectionNotificationEmail,
  sendRefundConfirmationEmail,
  sendDepositSuccessEmail,
} from '../utils/sendEmail.js';

/**
 * Service xử lý nghiệp vụ Đơn Thuê Váy & Hợp Đồng (Orders)
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
  let resolvedItems = [];
  if (Array.isArray(items) && items.length > 0) {
    resolvedItems = items.map((item) => ({
      dressId: item.dressId || item.id || 'dress_custom',
      name: item.name || 'Váy cưới Haute Couture',
      size: item.size || 'S',
      rentPrice: Number(item.rentPrice || item.price || 0),
      depositAmount: Number(item.depositAmount || item.deposit || 0),
      image: item.image || item.images?.[0] || '',
    }));
  } else if (dress) {
    resolvedItems = [
      {
        dressId: dress.id || dress._id || 'dress_custom',
        name: dress.name || 'Váy cưới Haute Couture',
        size: orderData.selectedSize || dress.size || 'S',
        rentPrice: Number(dress.price || 0),
        depositAmount: Number(dress.depositAmount || dress.deposit || 0),
        image: dress.image || dress.images?.[0] || '',
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
    status: 'deposit_paid',
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
      dressInfo: {
        dressId: firstItem.dressId || null,
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
  const inspections = await ReturnInspection.find({ orderId: { $in: orderIds } }).lean();
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
  } else if (filters.status) {
    query.status = filters.status;
  }
  if (filters.search) {
    const rawSearch = String(filters.search).trim();
    const cleanSearch = rawSearch.replace(/^[#\s]+/, ''); // Loại bỏ ký tự # nếu người dùng nhập "#UB-2026-0012"
    query.$or = [
      { orderCode: { $regex: cleanSearch, $options: 'i' } },
      { customerName: { $regex: rawSearch, $options: 'i' } },
      { customerPhone: { $regex: cleanSearch, $options: 'i' } },
      { 'items.name': { $regex: rawSearch, $options: 'i' } },
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const orderIds = orders.map((o) => o._id);
  const [inspections, contracts] = await Promise.all([
    ReturnInspection.find({ orderId: { $in: orderIds } }).lean(),
    Contract.find({ orderId: { $in: orderIds } }).lean(),
  ]);
  const inspectionMap = new Map(inspections.map((i) => [String(i.orderId), i]));
  const contractMap = new Map(contracts.map((c) => [String(c.orderId), c]));

  const enrichedOrders = orders.map((o) => {
    const hasAccount = Boolean(o.customerId && String(o.customerId).trim() !== '');
    const insp = inspectionMap.get(String(o._id)) || null;
    const contract = contractMap.get(String(o._id)) || null;
    let status = o.status;
    const isCustomerApproved = insp?.customerStatus === 'approved' || insp?.customerConfirmed;
    if (isCustomerApproved && status !== 'completed' && status !== 'complete') {
      status = 'completed';
      Order.updateOne({ _id: o._id }, { $set: { status: 'completed' } }).catch(() => {});
    }
    return {
      ...o,
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
    Order.updateOne({ _id: order._id }, { $set: { status: 'completed' } }).catch(() => {});
  }
  return {
    ...order,
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
  await order.save();

  if (status === 'completed' || status === 'complete') {
    await ReturnInspection.findOneAndUpdate(
      { orderId: order._id },
      { isRefunded: true, refundedAt: new Date(), customerStatus: 'approved', customerConfirmedAt: new Date() }
    );
    // Tự động đồng bộ hợp đồng pháp lý sang trạng thái hoàn thành
    await Contract.findOneAndUpdate(
      { $or: [{ orderId: order._id }, { contractCode: order.contractCode }] },
      { status: 'completed' }
    ).catch(() => {});
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
  const query = {
    status: { $nin: ['CANCELLED', 'RETURNED'] },
  };
  if (dressId) {
    query['items.dressId'] = dressId;
  }
  const orders = await Order.find(query).select('orderCode rentalStartDate rentalEndDate');
  return orders.map((o) => ({
    orderCode: o.orderCode,
    startDate: o.rentalStartDate,
    endDate: o.rentalEndDate,
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

  // Tính số ngày trễ
  const today = new Date();
  const dueDate = new Date(order.rentalEndDate);
  const lateDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
  const latePenaltyFee = lateDays * Math.round(order.totalRentPrice * 0.05); // 5% mỗi ngày trễ

  // Tổng khấu trừ từ hư hỏng
  const maxAllowed = order.totalDeposit || order.totalRentPrice || 0;
  const itemsCondition = (data.itemsCondition || []).map((item) => {
    const fee = Number(item.repairFee ?? item.compensation ?? 0);
    if (fee > maxAllowed && maxAllowed > 0) {
      throw new Error(`Số tiền bồi thường không được lớn hơn giá trị của váy (Tối đa: ${maxAllowed.toLocaleString('vi-VN')} đ)`);
    }
    return {
      dressId: item.dressId || item.id || null,
      condition: item.condition || 'good',
      note: item.note || item.damageNotes || '',
      repairFee: Math.max(0, fee),
    };
  });
  const damageTotal = itemsCondition.reduce((sum, i) => sum + i.repairFee, 0);

  const totalDeduction = latePenaltyFee + damageTotal;
  const finalRefundAmount = Math.max(0, order.totalDeposit - totalDeduction);
  const evidencePhotos = Array.isArray(data.evidencePhotos) ? data.evidencePhotos : [];

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
    inspection.customerStatus = 'pending'; // Đưa về chờ khách duyệt
    inspection.disputeReason = '';
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
      isRefunded: false,
      customerStatus: 'pending',
    });
    await inspection.save();
  }

  // Cập nhật trạng thái đơn
  order.status = 'returned';
  order.actualReturnDate = new Date();
  await order.save();

  // Tự động gửi email thông báo biên bản kiểm định đến khách hàng
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
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      sendInspectionNotificationEmail({
        to: customerEmail,
        fullName: customerName,
        orderCode: order.orderCode,
        inspectorName: staffUser?.fullName || 'Chuyên Viên Atelier UniBridal',
        inspectionDate: inspection.returnedAt,
        totalDeposit: order.totalDeposit,
        totalDeduction: inspection.totalDeduction,
        finalRefundAmount: inspection.finalRefundAmount,
        returnUrl: `${clientUrl}/profile/orders`,
      }).catch((err) => console.error('[EMAIL INSPECTION SEND ERROR]', err.message));
    }
  } catch (err) {
    console.error('[EMAIL NOTIFICATION ERROR]', err.message);
  }

  return { order, inspection };
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

