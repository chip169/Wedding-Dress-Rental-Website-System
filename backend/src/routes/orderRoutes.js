import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Tạo đơn thuê mới (Hỗ trợ cả khách đăng nhập lẫn guest checkout)
router.post('/', optionalAuthenticate, orderController.createOrder);

// 2. Khách hàng xem lịch sử đơn thuê cá nhân (Yêu cầu đăng nhập tài khoản)
router.get('/my', authenticate, orderController.getMyOrders);

// 3. Nhân viên / Quản trị viên xem tất cả đơn thuê (kết nối trực tiếp MongoDB)
router.get('/', authenticate, authorize('STAFF', 'ADMIN'), orderController.getAllOrders);

// 3.1. Lấy danh sách các ngày đã kín lịch của váy (Hỗ trợ cả path params /dress/:id/booked-dates và query params)
router.get('/dress/:id/booked-dates', orderController.getDressBookedDates);
router.get('/booked-dates', orderController.getDressBookedDates);

// 4. Xem chi tiết đơn thuê theo ID hoặc Mã Đơn
router.get('/:id', authenticate, orderController.getOrderById);

// 5. Cập nhật trạng thái đơn thuê (Admin / Staff)
router.patch('/:id/status', authenticate, authorize('STAFF', 'ADMIN'), orderController.updateOrderStatus);

// 6. Nhân viên lập biên bản kiểm định tình trạng váy khi khách trả
router.post('/:id/inspection', authenticate, authorize('STAFF', 'ADMIN'), orderController.submitReturnInspection);

// 7. Lấy biên bản kiểm định của đơn thuê
router.get('/:id/inspection', authenticate, orderController.getReturnInspection);

// 8. Khách hàng đồng ý biên bản kiểm định -> Tự động hoàn cọc
router.post('/:id/inspection/approve', authenticate, orderController.approveReturnInspection);

// 9. Khách hàng gửi khiếu nại biên bản kiểm định
router.post('/:id/inspection/dispute', authenticate, orderController.disputeReturnInspection);

// 10. Admin duyệt đàm phán mức phạt và hoàn tất đơn (Trường hợp 2)
router.post('/:id/inspection/admin-settle', authenticate, authorize('ADMIN', 'STAFF'), orderController.settleInspectionAdmin);

export default router;
