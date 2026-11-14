import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Dress from '../models/dressModel.js';
import ReturnInspection from '../models/returnInspectionModel.js';
import Contract from '../models/contractModel.js';
import ContractTemplate from '../models/contractTemplateModel.js';
import User from '../models/userModel.js';
import {
  CLOSED_ORDER_STATUSES, CLOSED_ORDER_STATUS_FILTER, RETURN_REVIEW_STATUSES, returnError, getDepositPayments,
  inspectionRefundState, completeReturnedOrder, refundBankDetails, confirmDepositRefund, validateRefundPayment,
} from './returnRefundService.js';
import {
  sendInspectionNotificationEmail,
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

  // Kiểm tra tình trạng tồn kho của từng sản phẩm trong đơn thuê
  for (const item of resolvedItems) {
    let dressDoc = null;
    if (mongoose.Types.ObjectId.isValid(item.dressId)) {
      dressDoc = await Dress.findById(item.dressId);
    } else if (item.code) {
      dressDoc = await Dress.findOne({ code: String(item.code).toUpperCase() });
    }
    if (dressDoc) {
      const isOutOfStock =
        dressDoc.status === 'out_of_stock' ||
        dressDoc.status === 'retired' ||
        dressDoc.status === 'unavailable' ||
        (Array.isArray(dressDoc.sizes) &&
          dressDoc.sizes.reduce((s, sz) => s + (sz.quantity || 0), 0) === 0);
      if (isOutOfStock) {
        throw new Error(`Sản phẩm "${dressDoc.name}" hiện đã hết hàng trong kho, không thể đặt lịch thuê.`);
      }
    }
  }

  // Tính toán chi phí
  const totalRentPrice = resolvedItems.reduce((sum, item) => sum + item.rentPrice, 0);
  const totalDeposit = resolvedItems.reduce((sum, item) => sum + item.depositAmount, 0);
  const shippingFee = Number(orderData.shippingFee || 0);
  const discountAmount = Number(orderData.discountAmount || 0);

  // Đặt cọc chuyển khoản 100% toàn bộ tiền thuê và tiền cọc bảo lãnh
  const totalPayment = totalRentPrice + totalDeposit + shippingFee - discountAmount;
  const depositPaidAmount = totalPayment;

  // Tạo mã đơn ngẫu nhiên chuẩn UniBridal
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const orderCode = `UB-2026-${randomSuffix}`;

  const resolvedStartDate = parseDateSafe(rentalStartDate, new Date());
  const resolvedEndDate = parseDateSafe(rentalEndDate, new Date(Date.now() + 4 * 24 * 60 * 60 * 1000));

  // Kiểm tra không được đặt ngày trong quá khứ hoặc ngày hôm nay (cần tối thiểu 24h chuẩn bị)
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  if (resolvedStartDate <= todayEnd) {
    throw new Error('Không thể đặt thuê cho ngày hôm nay! Ngày bắt đầu thuê phải từ ngày mai trở đi (Atelier cần tối thiểu 24h để chuẩn bị và khử khuẩn lễ phục).');
  }

  if (resolvedEndDate < resolvedStartDate) {
    throw new Error('Ngày hoàn trả không thể trước ngày bắt đầu thuê.');
  }

  // Kiểm tra trùng lịch thuê váy (Overlap conflict check)
  const bookedStatuses = [
    'pending_payment',
    'deposit_paid',
    'active',
    'confirmed',
    'preparing',
    'delivered',
    'renting',
    'returned',
    'waiting_refund',
    'completed',
    'complete',
  ];
  for (const item of resolvedItems) {
    if (!item.dressId) continue;
    const dressIdStr = String(item.dressId).trim();
    const dressConditions = [
      { 'items.dressId': dressIdStr },
      { 'items.code': dressIdStr },
    ];
    if (mongoose.Types.ObjectId.isValid(dressIdStr)) {
      dressConditions.push({ 'items.dressId': new mongoose.Types.ObjectId(dressIdStr) });
    }
    const num = Number(dressIdStr);
    if (!isNaN(num)) {
      dressConditions.push({ 'items.dressId': num });
    }
    if (item.code) {
      dressConditions.push({ 'items.code': item.code });
    }
    if (item.name) {
      dressConditions.push({ 'items.name': item.name });
    }

    try {
      const dressDoc = await Dress.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(dressIdStr) ? [{ _id: dressIdStr }] : []),
          { code: dressIdStr },
          { name: item.name || dressIdStr },
        ],
      });
      if (dressDoc) {
        dressConditions.push({ 'items.dressId': dressDoc._id });
        dressConditions.push({ 'items.dressId': String(dressDoc._id) });
        if (dressDoc.code) {
          dressConditions.push({ 'items.code': dressDoc.code });
          dressConditions.push({ 'items.dressId': dressDoc.code });
        }
        if (dressDoc.name) {
          dressConditions.push({ 'items.name': dressDoc.name });
        }
      }
    } catch {
      // ignore
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

  // Tự động gửi email xác nhận đặt cọc thành công (chỉ gửi 1 lần duy nhất)
  try {
    const targetEmail = newOrder.customerEmail || currentUser?.email;
    if (targetEmail && newOrder.status === 'deposit_paid' && !newOrder.depositEmailSent) {
      newOrder.depositEmailSent = true;
      await newOrder.save();

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
        depositPaidAmount: newOrder.depositPaidAmount || newOrder.totalPayment,
        remainingAmount: 0,
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
  if (['returned', 'waiting_refund'].includes(filters.status)) {
    const inspections = await ReturnInspection.find({
      $or: [{ customerStatus: 'approved' }, { customerStatus: null, customerConfirmed: true }],
      finalRefundAmount: { $gte: 0 },
    }).select('orderId initialDeposit finalRefundAmount customerStatus customerConfirmed').lean();
    const ids = inspections.map(({ orderId }) => orderId);
    const [orders, deposits] = await Promise.all([
      Order.find({ _id: { $in: ids }, status: { $in: ['returned', 'waiting_refund', ...CLOSED_ORDER_STATUS_FILTER] } })
        .select('status totalDeposit').lean(),
      getDepositPayments(ids),
    ]);
    const byOrder = new Map(inspections.map((inspection) => [String(inspection.orderId), inspection]));
    query._id = { $in: orders.filter((order) => {
      const key = String(order._id);
      const state = inspectionRefundState(order, byOrder.get(key), deposits.get(key));
      return state.canConfirmRefund || state.refundConflict;
    }).map(({ _id }) => _id) };
  } else if (filters.status === 'disputed') {
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
      query.status = { $nin: [...CLOSED_ORDER_STATUS_FILTER, 'cancelled'] };
    } else if (filters.viewMode === 'archived') {
      query.status = { $in: [...CLOSED_ORDER_STATUS_FILTER, 'cancelled'] };
    }
  }
  if (filters.search) {
    const rawSearch = String(filters.search).trim();
    const escapeSearch = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cleanSearch = escapeSearch(rawSearch.replace(/^[#\s]+/, ''));
    const textSearch = escapeSearch(rawSearch);
    const search = { $or: [
      { orderCode: { $regex: cleanSearch, $options: 'i' } },
      { customerName: { $regex: textSearch, $options: 'i' } },
      { customerPhone: { $regex: cleanSearch, $options: 'i' } },
      { 'items.name': { $regex: textSearch, $options: 'i' } },
      { 'items.code': { $regex: cleanSearch, $options: 'i' } },
    ] };
    query.$and = [search];
  }

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Lấy tổng quan số liệu toàn hệ thống showroom (không bị phụ thuộc vào từ khóa tìm kiếm)
  const [totalAll, rentingCount, completedCount, cancelledCount, total, orders] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ status: 'renting' }),
    Order.countDocuments({ status: { $in: CLOSED_ORDER_STATUS_FILTER } }),
    Order.countDocuments({ status: 'cancelled' }),
    Order.countDocuments(query),
    Order.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const orderIds = orders.map((o) => o._id);
  const [inspections, contracts, refunds] = await Promise.all([
    ReturnInspection.find({ orderId: { $in: orderIds } }).select('-evidencePhotos').lean(),
    Contract.find({ orderId: { $in: orderIds } }).select('orderId contractCode status packageType').lean(),
    getDepositPayments(orderIds),
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
      hasAccount,
      isGuest: !hasAccount,
      inspection: inspectionRefundState(o, insp, refunds.get(String(o._id))),
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
  const [inspection, refunds] = await Promise.all([
    ReturnInspection.findOne({ orderId: order._id }).lean(),
    getDepositPayments([order._id]),
  ]);
  const items = (order.items || []).map((it) => ({
    ...it,
    color: it.color || it.fabric || order.color || 'Trắng Sữa',
  }));
  return {
    ...order,
    items,
    inspection: inspectionRefundState(order, inspection, refunds.get(String(order._id))),
  };
};

export const updateOrderStatus = async (idOrCode, status) => {
  const isObjectId = idOrCode.match(/^[0-9a-fA-F]{24}$/);
  const query = isObjectId ? { _id: idOrCode } : { orderCode: idOrCode.toUpperCase() };
  const order = await Order.findOne(query);
  if (!order) throw new Error('Không tìm thấy đơn hàng.');

  if (CLOSED_ORDER_STATUSES.includes(status)) {
    throw returnError(409, 'Hãy xác nhận hoàn cọc trong biên bản để hoàn tất đơn trả váy.');
  }
  if (['returned', 'waiting_refund', 'disputed', ...CLOSED_ORDER_STATUSES].some((value) => value === order.status || value === status)) {
    throw returnError(409, 'Đơn đang hoặc đã xử lý trả váy. Vui lòng dùng thao tác trong biên bản.');
  }
  const next = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: { status } },
    { returnDocument: 'after', runValidators: true },
  );
  if (!next) throw returnError(409, 'Trạng thái đơn đã thay đổi. Vui lòng tải lại.');

  if (status === 'cancelled') {
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

  return next;
};

export const getDressBookedDates = async (dressId) => {
  // Quét toàn bộ các đơn thuê của chiếc váy đang ở các trạng thái hợp lệ (chỉ trừ đơn đã hủy 'cancelled')
  const bookedStatuses = [
    'pending_payment',
    'deposit_paid',
    'active',
    'confirmed',
    'preparing',
    'delivered',
    'renting',
    'returned',
    'waiting_refund',
    'completed',
    'complete',
  ];
  const query = {
    status: { $in: bookedStatuses },
  };

  if (dressId) {
    const dressIdStr = String(dressId).trim();
    const conditions = [
      { 'items.dressId': dressIdStr },
      { 'items.code': dressIdStr },
    ];
    if (mongoose.Types.ObjectId.isValid(dressIdStr)) {
      conditions.push({ 'items.dressId': new mongoose.Types.ObjectId(dressIdStr) });
    }
    const num = Number(dressIdStr);
    if (!isNaN(num)) {
      conditions.push({ 'items.dressId': num });
    }

    try {
      const dressDoc = await Dress.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(dressIdStr) ? [{ _id: dressIdStr }] : []),
          { code: dressIdStr },
          { name: dressIdStr },
        ],
      });
      if (dressDoc) {
        conditions.push({ 'items.dressId': dressDoc._id });
        conditions.push({ 'items.dressId': String(dressDoc._id) });
        if (dressDoc.code) {
          conditions.push({ 'items.code': dressDoc.code });
          conditions.push({ 'items.dressId': dressDoc.code });
        }
        if (dressDoc.name) {
          conditions.push({ 'items.name': dressDoc.name });
        }
      }
    } catch {
      // ignore
    }

    query.$or = conditions;
  }

  const orders = await Order.find(query).select('orderCode rentalStartDate rentalEndDate customerName items status');
  return orders
    .filter((o) => o.rentalStartDate && o.rentalEndDate)
    .map((o) => {
      const formatYMD = (d) => {
        if (!d) return null;
        if (d instanceof Date) {
          return d.toISOString().split('T')[0];
        }
        const str = String(d).trim();
        return str.includes('T') ? str.split('T')[0] : str.slice(0, 10);
      };

      return {
        orderCode: o.orderCode,
        startDate: formatYMD(o.rentalStartDate),
        endDate: formatYMD(o.rentalEndDate),
        bride: o.customerName || 'Nàng dâu UniBridal',
        status: o.status,
      };
    });
};

const createReturnInspection = async (order, data, staffUser) => {
  // Tính số ngày trễ và phí phạt trễ hạn: 50% tiền thuê mỗi ngày, quá 5 ngày chưa trả tịch thu 100% tiền cọc
  const receivedAt = order.actualReturnDate || new Date();
  const dueDate = new Date(order.rentalEndDate);
  if (!order.rentalEndDate || Number.isNaN(dueDate.getTime())) throw returnError(409, 'Đơn chưa có ngày hẹn trả hợp lệ.');
  const dateKey = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const lateDays = Math.max(0, (Date.parse(dateKey.format(receivedAt)) - Date.parse(dateKey.format(dueDate))) / 86_400_000);
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
  if (!Array.isArray(data.itemsCondition) || data.itemsCondition.length !== order.items.length || !order.items.length) {
    throw returnError(400, 'Kiểm định đầy đủ tất cả váy trong đơn trước khi lưu.');
  }
  const itemsCondition = data.itemsCondition.map((item, index) => {
    const orderedDress = order.items[index].dressId;
    const dressId = item.dressId || item.id || null;
    if (orderedDress && String(orderedDress) !== String(dressId)) {
      throw returnError(400, 'Danh sách váy kiểm định không khớp với đơn thuê.');
    }
    const fee = Number(item.repairFee ?? item.compensation ?? 0);
    if (!Number.isSafeInteger(fee) || fee < 0) throw returnError(400, 'Số tiền bồi thường không hợp lệ.');
    if (fee > maxAllowed && maxAllowed > 0) {
      throw returnError(400, `Số tiền bồi thường không được vượt quá ${maxAllowed.toLocaleString('vi-VN')} đ.`);
    }
    const conditions = Array.isArray(item.conditions) && item.conditions.length > 0
      ? item.conditions
      : (item.condition ? [item.condition] : ['good']);

    return {
      dressId,
      condition: item.condition || 'good',
      conditions,
      damages: Array.isArray(item.damages) ? item.damages : [],
      damageName: item.damageName || '',
      feeLabel: item.feeLabel || '',
      note: item.note || item.damageNotes || '',
      repairFee: Math.max(0, fee),
      compensation: Math.max(0, fee),
    };
  });
  const damageTotal = itemsCondition.reduce((sum, i) => sum + i.repairFee, 0);
  if (totalDeposit > 0 && damageTotal > totalDeposit) {
    throw returnError(400, 'Tổng tiền bồi thường không được vượt quá tiền cọc.');
  }
  const evidencePhotos = Array.isArray(data.evidencePhotos)
    ? data.evidencePhotos.filter((photo) => typeof photo === 'string' && photo.trim())
    : [];

  // BẮT BUỘC CHỤP ẢNH LỖI ĐẦY ĐỦ nếu có ghi nhận tình trạng váy bị bẩn, rách hoặc có phí bồi thường
  const hasDamage = itemsCondition.some((it) => {
    const hasSingle = it.condition !== 'good' && it.condition !== 'normal_wear';
    const hasMultiple = Array.isArray(it.conditions) && it.conditions.some((c) => c !== 'good' && c !== 'normal_wear');
    return hasSingle || hasMultiple || it.repairFee > 0;
  });
  if (hasDamage && evidencePhotos.length === 0) {
    throw returnError(400, 'Cần ít nhất một ảnh bằng chứng hư hại trước khi lưu biên bản.');
  }

  const totalDeduction = Math.min(totalDeposit, latePenaltyFee + damageTotal);
  const finalRefundAmount = Math.max(0, totalDeposit - totalDeduction);
  const holdForAdmin = Boolean(data.holdForAdmin || data.customerAgreed === false
    || itemsCondition.some(({ condition, conditions }) => condition === 'total_damage' || conditions.includes('total_damage')));
  const confirmOnSite = !holdForAdmin && Boolean(data.confirmOnSite);
  const bankDetails = data.refundBankDetails?.accountNumber
    ? refundBankDetails(data.refundBankDetails, false)
    : (confirmOnSite ? refundBankDetails(data.refundBankDetails, finalRefundAmount > 0) : null);

  const now = new Date();
  try {
    return await ReturnInspection.create({
      orderId: order._id,
      staffId: staffUser?._id,
      returnedAt: receivedAt,
      lateDays,
      latePenaltyFee,
      itemsCondition,
      evidencePhotos,
      totalDeduction,
      initialDeposit: totalDeposit,
      finalRefundAmount,
      customerStatus: holdForAdmin ? 'disputed' : confirmOnSite ? 'approved' : 'pending',
      customerConfirmedAt: confirmOnSite ? now : null,
      disputeReason: holdForAdmin ? (data.disputeReason || 'Showroom chuyển Admin rà soát biên bản') : '',
      disputeCreatedAt: holdForAdmin ? now : null,
      refundBankDetails: bankDetails || undefined,
    });
  } catch (error) {
    if (error.code === 11000) throw returnError(409, 'Biên bản vừa được lưu. Vui lòng tải lại.');
    throw error;
  }
};

/** Lưu biên bản kiểm định và ghi nhận đơn đã trả váy. */
export const submitReturnInspection = async (orderId, data = {}, staffUser) => {
  const order = await Order.findById(orderId);
  if (!order) throw returnError(404, 'Không tìm thấy đơn thuê.');
  if (!['renting', 'delivered', 'returned'].includes(order.status)) {
    throw returnError(409, 'Đơn thuê hiện không đủ điều kiện lập biên bản kiểm định.');
  }

  const existing = await ReturnInspection.findOne({ orderId: order._id });
  if (existing && order.status === 'returned') {
    throw returnError(409, 'Biên bản kiểm định đã được lưu. Vui lòng mở lại để xem.');
  }
  if (existing && data.refundBankDetails?.accountNumber) {
    existing.refundBankDetails = refundBankDetails(data.refundBankDetails, false);
    await existing.save();
  }
  const inspection = existing ?? await createReturnInspection(order, data, staffUser);

  const inspectionStatus = inspection.customerStatus;
  const status = inspectionStatus === 'disputed' ? 'disputed'
    : inspectionStatus === 'approved' ? 'waiting_refund' : 'returned';
  const returnedOrder = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: { status, actualReturnDate: inspection.returnedAt || order.actualReturnDate || new Date() } },
    { returnDocument: 'after' },
  );
  if (!returnedOrder) throw returnError(409, 'Trạng thái đơn đã thay đổi. Vui lòng tải lại.');
  const currentOrder = inspectionStatus === 'approved' && inspection.finalRefundAmount === 0
    ? await completeReturnedOrder(returnedOrder) : returnedOrder;

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
      const hasAccount = Boolean(order.customerId && String(order.customerId).trim() !== '');
      const isGuest = !hasAccount;

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
        returnUrl: isGuest ? null : `${clientUrl}/profile/orders`,
        isGuest,
        customerStatus: inspection.customerStatus,
      }).catch((err) => console.error('[EMAIL INSPECTION SEND ERROR]', err.message));

      console.log(`[INSPECTION EMAIL SENT] Đã gửi biên bản kiểm định đơn #${order.orderCode} tới email: ${customerEmail}`);
    }
  } catch (err) {
    console.error('[EMAIL NOTIFICATION ERROR]', err.message);
  }

  const payments = (await getDepositPayments([order._id])).get(String(order._id));
  return { order: currentOrder, inspection: inspectionRefundState(currentOrder, inspection.toObject(), payments), heldForAdmin: inspectionStatus === 'disputed' };
};

/**
 * Lấy biên bản kiểm định của một đơn thuê
 * @param {string} orderId
 */
export const getReturnInspection = async (orderId) => {
  const identity = mongoose.isValidObjectId(orderId) ? { _id: orderId } : { orderCode: orderId.toUpperCase() };
  const order = await Order.findOne(identity).select('status totalDeposit').lean();
  if (!order) throw returnError(404, 'Không tìm thấy đơn thuê.');
  const [inspection, refunds] = await Promise.all([
    ReturnInspection.findOne({ orderId: order._id }).lean(),
    getDepositPayments([order._id]),
  ]);
  return inspectionRefundState(order, inspection, refunds.get(String(order._id)));
};

/** Lưu mức khấu trừ đã thống nhất và ghi nhận khoản thực tế đã hoàn. */
export const settleInspectionAdmin = async (orderId, data = {}, adminUser) => {
  if (String(adminUser?.role).toLowerCase() !== 'admin') throw returnError(403, 'Chỉ Admin được chốt đàm phán.');
  const order = await Order.findById(orderId);
  if (!order) throw returnError(404, 'Không tìm thấy đơn hàng.');
  const inspection = await ReturnInspection.findOne({ orderId: order._id }).lean();
  if (!inspection) throw returnError(404, 'Chưa có biên bản kiểm định cho đơn hàng này.');

  if (inspection.negotiatedByAdmin && inspection.customerStatus === 'approved'
      && ['disputed', ...RETURN_REVIEW_STATUSES].includes(order.status)) {
    // Tiếp tục ghi nhận nếu lần trước đã lưu biên bản nhưng chưa lưu xong giao dịch.
    if (order.status === 'disputed') {
      await Order.updateOne({ _id: order._id, status: 'disputed' }, { $set: { status: 'waiting_refund' } });
    }
    return confirmDepositRefund(orderId, data, adminUser);
  }
  if (inspection.customerStatus !== 'disputed' || !['disputed', 'returned', 'waiting_refund'].includes(order.status)) {
    throw returnError(409, 'Đơn hiện không chờ Admin xử lý.');
  }

  const totalDeposit = Number(inspection.initialDeposit ?? order.totalDeposit);
  const agreedPenalty = Number(data.agreedPenalty ?? data.agreedPenaltyFee);
  if (!Number.isSafeInteger(totalDeposit) || !Number.isSafeInteger(agreedPenalty) || agreedPenalty < 0 || agreedPenalty > totalDeposit) {
    throw returnError(400, 'Mức khấu trừ phải từ 0 đến số tiền cọc.');
  }
  const finalRefundAmount = Math.max(0, totalDeposit - agreedPenalty);
  const payments = (await getDepositPayments([order._id])).get(String(order._id));
  const hasTxCode = Boolean(data.transactionCode && String(data.transactionCode).trim());
  const bankDetails = data.refundBankDetails?.accountNumber
    ? refundBankDetails(data.refundBankDetails, false)
    : (inspection.refundBankDetails || null);
  const now = new Date();

  const result = await ReturnInspection.updateOne(
    { _id: inspection._id },
    { $set: {
      totalDeduction: agreedPenalty,
      agreedPenaltyFee: agreedPenalty,
      finalRefundAmount,
      customerStatus: 'approved',
      customerConfirmedAt: now,
      isRefunded: false,
      refundedAt: null,
      negotiatedByAdmin: true,
      adminNegotiatorId: adminUser._id,
      adminNegotiatorName: adminUser.fullName || 'Quản Trị Viên UniBridal',
      adminNegotiationNotes: String(data.negotiationNotes ?? '').trim(),
      adminSettledAt: now,
      ...(bankDetails ? { refundBankDetails: bankDetails } : {}),
    } },
  );
  if (!result.matchedCount) throw returnError(409, 'Biên bản vừa thay đổi. Vui lòng tải lại.');

  // Nếu Admin nhập mã giao dịch ngay tại modal đàm phán thì quyết toán luôn
  if (hasTxCode) {
    return confirmDepositRefund(orderId, data, adminUser);
  }

  // Đơn chuyển sang trạng thái 'waiting_refund' (Chờ hoàn cọc) nếu còn tiền hoàn, hoặc 'completed' nếu miễn hoàn
  const nextStatus = finalRefundAmount > 0 ? 'waiting_refund' : 'completed';
  const updatedOrder = await Order.findByIdAndUpdate(
    order._id,
    { $set: { status: nextStatus } },
    { new: true }
  );

  if (nextStatus === 'completed') {
    await completeReturnedOrder(updatedOrder, now);
  }

  const updatedInspection = await ReturnInspection.findById(inspection._id).lean();
  return {
    order: updatedOrder,
    inspection: inspectionRefundState(updatedOrder, updatedInspection, payments),
  };
};
