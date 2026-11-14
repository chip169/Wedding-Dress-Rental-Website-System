import express from 'express';
import chatController from '../controllers/chatController.js';
import { authenticate, optionalAuthenticate, authorize } from '../middlewares/authMiddleware.js';

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

// Ghim / Bỏ ghim hội thoại (Staff và Admin)
router.patch('/:id/pin', authenticate, authorize('ADMIN', 'STAFF'), chatController.togglePin);

// Ghim / Bỏ ghim một tin nhắn cụ thể trong cuộc hội thoại
router.patch('/:conversationId/messages/:messageId/pin', optionalAuthenticate, chatController.togglePinMessage);

// Bỏ ghim tin nhắn của hội thoại
router.patch('/:conversationId/unpin-message', optionalAuthenticate, chatController.unpinMessage);

// Xóa cuộc hội thoại và toàn bộ tin nhắn bên trong (Admin / Staff)
router.delete('/:id', optionalAuthenticate, chatController.deleteConversation);

export default router;
