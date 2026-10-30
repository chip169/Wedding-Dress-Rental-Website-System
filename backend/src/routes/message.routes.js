import express from 'express';
import chatController from '../controllers/chat.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Gửi tin nhắn mới (cho cả khách hàng, khách vãng lai và admin/staff)
router.post('/', optionalAuthenticate, chatController.sendMessage);

export default router;
