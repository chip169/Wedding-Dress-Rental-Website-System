import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// 1. Tạo đơn thuê mới (Hỗ trợ cả khách đăng nhập lẫn guest checkout)
router.post('/', optionalAuthenticate, orderController.createOrder);

// 2. Khách hàng xem lịch sử đơn thuê cá nhân
router.get('/my', authenticate, orderController.getMyOrders);

// 3. Nhân viên / Quản trị viên xem tất cả đơn thuê
router.get('/', authenticate, authorize('STAFF', 'ADMIN'), orderController.getAllOrders);

// 4. Xem chi tiết đơn thuê theo ID hoặc Mã Đơn
router.get('/:id', optionalAuthenticate, orderController.getOrderById);

// 5. Cập nhật trạng thái đơn thuê (Admin / Staff)
router.patch('/:id/status', authenticate, authorize('STAFF', 'ADMIN'), orderController.updateOrderStatus);

export default router;
