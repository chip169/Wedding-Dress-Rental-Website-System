import mongoose from 'mongoose';
import Appointment from '../models/appointmentModel.js';
import Dress from '../models/dressModel.js';
import { sendAppointmentSuccessEmail } from '../utils/sendEmail.js';

const HANOI_SHOWROOM = {
  name: 'UniBridal Heritage Mansion — Hoàn Kiếm, Hà Nội',
  location: 'Hoàn Kiếm, Hà Nội',
  address: '26 Lý Thường Kiệt, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
  phone: '024 3936 8998',
  mapUrl: 'https://maps.google.com/?q=26+Ly+Thuong+Kiet+Hoan+Kiem+Ha+Noi',
};

const BRANCH_DETAILS = {
  'hn-hoankiem': HANOI_SHOWROOM,
  'hn-hk': HANOI_SHOWROOM,
  'hcm-q1': HANOI_SHOWROOM,
};

/**
 * Service xử lý nghiệp vụ Lịch Hẹn Thử Váy (Appointments)
 */

function parseDateSafe(val, fallbackDate = null) {
  if (!val) return fallbackDate;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? fallbackDate : val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
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

export const createAppointment = async (appointmentData, currentUser = null) => {
  const {
    customerName,
    fullName,
    customerPhone,
    phone,
    customerEmail,
    email,
    branch,
    branchId,
    appointmentDate,
    date,
    timeSlot,
    guestsCount,
    interestedDresses,
    selectedDresses,
    vipServices,
    notes,
    weddingDate,
  } = appointmentData;

  const resolvedName = customerName || fullName;
  const resolvedPhone = customerPhone || phone;
  const resolvedDate = appointmentDate || date;

  if (!resolvedName || !resolvedPhone || !resolvedDate || !timeSlot) {
    throw new Error('Vui lòng cung cấp đầy đủ: Tên khách hàng, Số điện thoại, Ngày hẹn và Khung giờ.');
  }

  if (/\d/.test(resolvedName.trim())) {
    throw new Error('Họ và tên khách hàng không được chứa chữ số.');
  }

  const cleanPhone = resolvedPhone.replace(/[\s.-]/g, '');
  if (!/^\d{10}$/.test(cleanPhone)) {
    throw new Error('Số điện thoại liên hệ phải gồm đúng 10 chữ số.');
  }
  if (!/^(0[2|3|5|7|8|9])[0-9]{8}$/.test(cleanPhone)) {
    throw new Error('Số điện thoại không hợp lệ (phải bắt đầu bằng các đầu số 03, 05, 07, 08, 09, 02).');
  }

  const parsedAppointmentDate = parseDateSafe(resolvedDate, new Date());
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (parsedAppointmentDate < todayStart) {
    throw new Error('Ngày hẹn thử váy không thể là ngày trong quá khứ.');
  }

  // Kiểm tra sức chứa thực tế của ca thử váy (tối đa 3 khách / ca 90 phút tại Flagship Showroom Hà Nội)
  const startOfDay = new Date(parsedAppointmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(parsedAppointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const normalizeSlot = (str) => (str || '').replace(/\s+/g, '').replace(/[—–-]/g, '-');
  const targetSlotNorm = normalizeSlot(timeSlot);

  const existingInSlot = await Appointment.find({
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['cancelled'] },
  }).lean();

  const bookedCountInSlot = existingInSlot.filter((a) => normalizeSlot(a.timeSlot) === targetSlotNorm).length;
  if (bookedCountInSlot >= 3) {
    throw new Error(`Khung giờ "${timeSlot}" vào ngày này đã kín lịch (tối đa 3 khách/ca). Vui lòng chọn khung giờ khác.`);
  }

  const randomCode = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Kiểm tra tình trạng tồn kho của mẫu váy đăng ký thử (Nếu là khách đã đặt thuê đơn thành công thì cho phép thử mẫu váy của đơn đó)
  const hasLinkedOrder = Boolean(appointmentData?.orderCode || (notes && /UB-2026-\d+/i.test(notes)));
  const dressListToCheck = interestedDresses || selectedDresses || [];
  if (!hasLinkedOrder) {
    for (const item of dressListToCheck) {
      const dressId = item.id || item._id || item.dressId;
      let dressDoc = null;
      if (dressId && mongoose.Types.ObjectId.isValid(dressId)) {
        dressDoc = await Dress.findById(dressId);
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
          throw new Error(`Mẫu váy "${dressDoc.name}" hiện đã hết hàng trong kho, không thể đặt lịch thử.`);
        }
      }
    }
  }

  const newAppointment = new Appointment({
    appointmentCode: randomCode,
    customerId: currentUser?._id || null,
    customerName: resolvedName.trim(),
    customerPhone: cleanPhone,
    customerEmail: (customerEmail || email || '').trim(),
    branch: 'hn-hoankiem',
    appointmentDate: parsedAppointmentDate,
    weddingDate: parseDateSafe(weddingDate, null),
    timeSlot: timeSlot.trim(),
    guestsCount: Number(guestsCount) || 1,
    interestedDresses: interestedDresses || selectedDresses || [],
    vipServices: vipServices || [],
    notes: (notes || '').trim(),
    status: 'confirmed',
  });

  await newAppointment.save();

  // Tự động gửi email giấy mời danh dự thử váy Private Suite
  try {
    const targetEmail = newAppointment.customerEmail || currentUser?.email;
    if (targetEmail) {
      const branchInfo = BRANCH_DETAILS['hn-hoankiem'];
      sendAppointmentSuccessEmail({
        to: targetEmail,
        fullName: newAppointment.customerName,
        appointmentCode: newAppointment.appointmentCode,
        appointmentDate: newAppointment.appointmentDate,
        timeSlot: newAppointment.timeSlot,
        branchName: branchInfo.name,
        branchAddress: branchInfo.address,
        branchPhone: branchInfo.phone,
        guestsCount: newAppointment.guestsCount,
        interestedDresses: newAppointment.interestedDresses,
        vipServices: newAppointment.vipServices,
        stylistName: 'Chuyên Viên Stylist UniBridal',
        notes: newAppointment.notes,
      }).catch((err) => console.error('[EMAIL APPOINTMENT SEND ERROR]', err.message));
    }
  } catch (err) {
    console.error('[TRIGGER APPOINTMENT EMAIL ERROR]', err.message);
  }

  const branchInfo = BRANCH_DETAILS['hn-hoankiem'];

  const responseObj = newAppointment.toObject();
  responseObj.id = newAppointment.appointmentCode;
  responseObj.branch = 'hn-hoankiem';
  responseObj.branchName = branchInfo.name;
  responseObj.branchAddress = branchInfo.address;
  responseObj.branchPhone = branchInfo.phone;
  responseObj.branchMapUrl = branchInfo.mapUrl;
  responseObj.stylistName = 'Chuyên Viên Stylist UniBridal';

  return responseObj;
};

export const getMyAppointments = async (user) => {
  const userId = user?._id || user?.id || user;
  const conditions = [];
  if (userId) conditions.push({ customerId: userId });
  if (user && typeof user === 'object') {
    if (user.email) {
      conditions.push({ customerEmail: String(user.email).trim().toLowerCase() });
    }
    if (user.phone) {
      const cleanPhone = String(user.phone).replace(/[\s.-]/g, '');
      if (cleanPhone) conditions.push({ customerPhone: cleanPhone });
    }
  }

  const query = conditions.length > 0 ? { $or: conditions } : { customerId: userId };
  return await Appointment.find(query).sort({ appointmentDate: -1, createdAt: -1 });
};

export const getAllAppointments = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.branch) query.branch = filters.branch;
  if (filters.search) {
    query.$or = [
      { customerName: { $regex: filters.search, $options: 'i' } },
      { customerPhone: { $regex: filters.search, $options: 'i' } },
      { appointmentCode: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const total = await Appointment.countDocuments(query);
  const appointments = await Appointment.find(query)
    .sort({ appointmentDate: 1, createdAt: 1 })
    .skip(skip)
    .limit(limit);

  const getTimeMinutes = (timeSlot) => {
    if (!timeSlot) return 9999;
    const parts = String(timeSlot).split(/[\u2014\u2013-]/);
    const start = (parts[0] || '').trim();
    const match = start.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 9999;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  };

  appointments.sort((a, b) => {
    const dateA = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
    const dateB = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    return getTimeMinutes(a.timeSlot) - getTimeMinutes(b.timeSlot);
  });

  return {
    appointments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const updateAppointmentStatus = async (id, status, staffId = null) => {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new Error('Không tìm thấy lịch hẹn.');
  }

  // Ràng buộc nghiệp vụ: Chưa đến ngày hẹn thì không được đánh dấu hoàn tất
  if (status === 'completed' && appointment.appointmentDate) {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    if (new Date(appointment.appointmentDate) > todayEnd) {
      throw new Error('Chưa đến ngày hẹn thử váy, không thể đánh dấu hoàn tất.');
    }
  }

  appointment.status = status;
  if (staffId) appointment.staffId = staffId;
  await appointment.save();

  return appointment;
};

/**
 * Tính số chỗ trống khả dụng thực tế của từng ca thử váy theo ngày và chi nhánh
 * Dựa trên số lượng lịch hẹn thực tế trong database (Sức chứa chuẩn 3 Private Suite/ca)
 */
export const getSlotAvailability = async ({ date }) => {
  const targetDate = parseDateSafe(date, new Date());

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['cancelled'] },
  }).lean();

  const normalizeSlot = (str) =>
    (str || '')
      .replace(/\s+/g, '')
      .replace(/[—–-]/g, '-');

  const bookedCounts = {};
  for (const appt of appointments) {
    const key = normalizeSlot(appt.timeSlot);
    bookedCounts[key] = (bookedCounts[key] || 0) + 1;
  }

  const standardSlots = [
    { id: 't1', time: '09:00 — 10:30', period: 'Sáng', capacity: 3, label: 'Thanh bình và Ánh sáng tự nhiên' },
    { id: 't2', time: '10:30 — 12:00', period: 'Sáng', capacity: 3, label: 'Thích hợp thử kỹ phom dáng' },
    { id: 't3', time: '13:30 — 15:00', period: 'Chiều', capacity: 3, label: 'Khung giờ vàng tư vấn NTK' },
    { id: 't4', time: '15:00 — 16:30', period: 'Chiều', capacity: 3, label: 'Thư thái cùng tiệc trà chiều' },
    { id: 't5', time: '16:30 — 18:00', period: 'Chiều', capacity: 3, label: 'Khung giờ đón hoàng hôn' },
    { id: 't6', time: '18:30 — 20:00', period: 'Tối', capacity: 3, label: 'Trải nghiệm ánh sáng tiệc cưới' },
    { id: 't7', time: '20:00 — 21:30', period: 'Tối', capacity: 3, label: 'Buổi thử riêng tư cuối ngày' },
  ];

  return standardSlots.map((slot) => {
    const key = normalizeSlot(slot.time);
    const booked = bookedCounts[key] || 0;
    const available = Math.max(0, slot.capacity - booked);
    return {
      ...slot,
      booked,
      available,
      disabled: available === 0,
      label: available === 0 ? 'Đã kín lịch' : slot.label,
    };
  });
};

