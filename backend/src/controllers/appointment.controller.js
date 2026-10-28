import * as appointmentService from '../services/appointment.service.js';

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
    const appointments = await appointmentService.getMyAppointments(req.user._id);
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
    const result = await appointmentService.getAllAppointments(req.query);
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
      req.user?._id
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

