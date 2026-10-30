import express from 'express';
import * as templateController from '../controllers/contractTemplate.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Lấy danh sách mẫu hợp đồng
router.get('/', templateController.getTemplates);

// Lấy mẫu hợp đồng mặc định (Haute Couture)
router.get('/default', templateController.getDefaultTemplate);

// Xem / In ấn trực tiếp văn bản PDF của mẫu hợp đồng (chuẩn A4)
router.get('/:id/pdf', templateController.renderTemplatePdf);

// Lấy chi tiết mẫu hợp đồng theo ID hoặc Mã Code
router.get('/:id', templateController.getTemplateById);

// Thêm mới mẫu hợp đồng (Yêu cầu đăng nhập quản trị)
router.post('/', authenticate, templateController.createTemplate);

// Cập nhật mẫu hợp đồng
router.put('/:id', authenticate, templateController.updateTemplate);

export default router;
