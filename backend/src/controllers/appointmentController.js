import * as appointmentService from '../services/appointmentService.js';

export const getSlotAvailability = async (req, res, next) => {
  try {
    const { date, branch } = req.query;
    const slots = await appointmentService.getSlotAvailability({ date, branch });
    res.status(200).json({
      success: true,
      message: 'Lấy số chỗ trống khả dụng theo khung giờ thành công',
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Đặt lịch hẹn thử váy VIP thành công!',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await appointmentService.getMyAppointments(req.user);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch hẹn cá nhân thành công',
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAppointments = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    // Phân quyền chi nhánh: Nhân viên chỉ xem lịch của chi nhánh mình
    if (req.user?.role === 'staff' && req.user.branch && req.user.branch !== 'all') {
      filters.branch = req.user.branch;
    }
    const result = await appointmentService.getAllAppointments(filters);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch hẹn hệ thống thành công',
      data: result.appointments,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const appointment = await appointmentService.updateAppointmentStatus(
      req.params.id,
      status,
      req.user?._id,
      req.user
    );
    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái lịch hẹn thành "${status}" thành công!`,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

