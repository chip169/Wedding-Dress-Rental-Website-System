import express from 'express';
import chatController from '../controllers/chat.controller.js';
import { authenticate, optionalAuthenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Lấy hoặc khởi tạo hội thoại cho khách hiện tại (Khách hàng đăng nhập hoặc khách vãng lai)
router.get('/my', optionalAuthenticate, chatController.getMyConversation);

// Lấy danh sách hội thoại cho Admin / Staff
router.get('/', optionalAuthenticate, chatController.getConversations);

// Lấy chi tiết một cuộc hội thoại
router.get('/:id', optionalAuthenticate, chatController.getConversationById);

// Lấy danh sách tin nhắn của một cuộc hội thoại
router.get('/:id/messages', optionalAuthenticate, chatController.getMessages);

// Đánh dấu hội thoại đã đọc
router.patch('/:id/read', optionalAuthenticate, chatController.markAsRead);

// Ghim / Bỏ ghim hội thoại (Staff & Admin)
router.patch('/:id/pin', authenticate, authorize('ADMIN', 'STAFF'), chatController.togglePin);

export default router;
