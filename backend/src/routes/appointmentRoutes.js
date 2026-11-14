import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// 0. Lấy số chỗ trống khả dụng theo ngày và chi nhánh (công khai cho khách hàng)
router.get('/availability', appointmentController.getSlotAvailability);

// 1. Khách hàng (cả Guest lẫn Đã đăng nhập) gửi yêu cầu đặt lịch
router.post('/', optionalAuthenticate, appointmentController.createAppointment);

// 2. Khách hàng xem lịch hẹn cá nhân (yêu cầu đăng nhập)
router.get('/my', authenticate, appointmentController.getMyAppointments);

// 3. Nhân viên / Quản trị viên xem tất cả lịch hẹn (yêu cầu quyền STAFF hoặc ADMIN)
router.get('/', authenticate, authorize('STAFF', 'ADMIN'), appointmentController.getAllAppointments);

// 4. Nhân viên / Quản trị viên cập nhật trạng thái lịch hẹn
router.patch('/:id/status', authenticate, authorize('STAFF', 'ADMIN'), appointmentController.updateAppointmentStatus);

export default router;
