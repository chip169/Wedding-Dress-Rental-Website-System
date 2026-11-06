import Appointment from '../models/Appointment.model.js';
import { sendAppointmentSuccessEmail } from '../utils/sendEmail.js';

const BRANCH_DETAILS = {
  'hcm-q1': {
    name: 'UniBridal Flagship Showroom Q.1 TP.HCM',
    address: '128 Đồng Khởi, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '1800 8998',
  },
  'hn-hk': {
    name: 'UniBridal Heritage Showroom Hoàn Kiếm Hà Nội',
    address: '45 Tràng Tiền, P. Tràng Tiền, Q. Hoàn Kiếm, Hà Nội',
    phone: '1800 8999',
  },
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

  const randomCode = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newAppointment = new Appointment({
    appointmentCode: randomCode,
    customerId: currentUser?._id || null,
    customerName: resolvedName.trim(),
    customerPhone: resolvedPhone.trim(),
    customerEmail: (customerEmail || email || '').trim(),
    branch: branch || branchId || 'hcm-q1',
    appointmentDate: parseDateSafe(resolvedDate, new Date()),
    weddingDate: parseDateSafe(weddingDate, null),
    timeSlot: timeSlot.trim(),
    guestsCount: Number(guestsCount) || 2,
    interestedDresses: interestedDresses || selectedDresses || [],
    vipServices: vipServices || [],
    notes: (notes || '').trim(),
    status: 'pending',
  });

  await newAppointment.save();

  // Tự động gửi email giấy mời danh dự thử váy Private Suite
  try {
    const targetEmail = newAppointment.customerEmail || currentUser?.email;
    if (targetEmail) {
      const branchInfo = BRANCH_DETAILS[newAppointment.branch] || BRANCH_DETAILS['hcm-q1'];
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

  return newAppointment;
};

export const getMyAppointments = async (userId) => {
  return await Appointment.find({ customerId: userId }).sort({ createdAt: -1 });
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
    .sort({ appointmentDate: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

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

  appointment.status = status;
  if (staffId) appointment.staffId = staffId;
  await appointment.save();

  return appointment;
};

