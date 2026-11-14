import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

// Toàn bộ route quản lý tài khoản người dùng yêu cầu quyền Quản trị viên (ADMIN)
router.use(authenticate, authorize('ADMIN'));

router.get('/', userController.getAllUsers);
router.get('/roles', userController.getUserRoles);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id/status', userController.toggleUserStatus);
router.patch('/:id/reset-password', userController.resetUserPassword);
router.delete('/:id', userController.deleteUser);

export default router;

