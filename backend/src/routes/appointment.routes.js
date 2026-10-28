import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller.js';
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// 1. Khách hàng (cả Guest lẫn Đã đăng nhập) gửi yêu cầu đặt lịch
router.post('/', optionalAuthenticate, appointmentController.createAppointment);

// 2. Khách hàng xem lịch hẹn cá nhân
router.get('/my', authenticate, appointmentController.getMyAppointments);

// 3. Nhân viên / Quản trị viên xem tất cả lịch hẹn
router.get('/', authenticate, authorize('STAFF', 'ADMIN'), appointmentController.getAllAppointments);

// 4. Nhân viên / Quản trị viên cập nhật trạng thái lịch hẹn
router.patch('/:id/status', authenticate, authorize('STAFF', 'ADMIN'), appointmentController.updateAppointmentStatus);

export default router;
