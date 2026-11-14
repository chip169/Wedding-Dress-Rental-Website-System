import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { optionalAuthenticate } from '../middlewares/authMiddleware.js';

const router = Router();

// Public / Authenticated endpoints
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryDetail);

// Admin endpoints (Dùng optionalAuthenticate để tương thích cả khi chạy Demo/Offline)
router.post('/', optionalAuthenticate, categoryController.createCategory);
router.put('/:id', optionalAuthenticate, categoryController.updateCategory);
router.patch('/:id/toggle-status', optionalAuthenticate, categoryController.toggleCategoryStatus);
router.delete('/:id', optionalAuthenticate, categoryController.deleteCategory);

export default router;

