import Appointment from '../models/Appointment.model.js';

/**
 * Service xử lý nghiệp vụ Lịch Hẹn Thử Váy (Appointments)
 */

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
    appointmentDate: new Date(resolvedDate),
    weddingDate: weddingDate ? new Date(weddingDate) : null,
    timeSlot: timeSlot.trim(),
    guestsCount: Number(guestsCount) || 2,
    interestedDresses: interestedDresses || selectedDresses || [],
    vipServices: vipServices || [],
    notes: (notes || '').trim(),
    status: 'pending',
  });

  await newAppointment.save();
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
