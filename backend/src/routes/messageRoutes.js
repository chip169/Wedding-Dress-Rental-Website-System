import express from 'express';
import chatController from '../controllers/chatController.js';
import { optionalAuthenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Gửi tin nhắn mới (cho cả khách hàng, khách vãng lai và admin/staff)
router.post('/', optionalAuthenticate, chatController.sendMessage);

// Thu hồi tin nhắn
router.patch('/:id/recall', optionalAuthenticate, chatController.recallMessage);

export default router;
