import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { optionalAuthenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Tạo link ảnh mã VietQR động chuẩn NAPAS 24/7
router.post('/vietqr/generate', paymentController.generateVietQR);

// 2. Mô phỏng thanh toán thử nghiệm VietQR (Sandbox Test Mode)
router.post('/vietqr/simulate', optionalAuthenticate, paymentController.simulatePayment);

// 3. Kiểm tra trạng thái thanh toán thời gian thực
router.get('/check-status/:orderCode', paymentController.checkPaymentStatus);

export default router;

