import express from 'express';
import * as templateController from '../controllers/contractTemplate.controller.js';
import { optionalAuthenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Lấy danh sách mẫu hợp đồng
router.get('/', templateController.getTemplates);

// Lấy mẫu hợp đồng mặc định (Haute Couture)
router.get('/default', templateController.getDefaultTemplate);

// Xem / In ấn trực tiếp văn bản PDF của mẫu hợp đồng (chuẩn A4)
router.get('/:id/pdf', templateController.renderTemplatePdf);

// Lấy chi tiết mẫu hợp đồng theo ID hoặc Mã Code
router.get('/:id', templateController.getTemplateById);

// Thêm mới mẫu hợp đồng (kết nối MongoDB)
router.post('/', optionalAuthenticate, templateController.createTemplate);

// Cập nhật mẫu hợp đồng
router.put('/:id', optionalAuthenticate, templateController.updateTemplate);

// Xóa mẫu hợp đồng
router.delete('/:id', optionalAuthenticate, templateController.deleteTemplate);

// Nhân bản mẫu hợp đồng
router.post('/:id/duplicate', optionalAuthenticate, templateController.duplicateTemplate);

export default router;
