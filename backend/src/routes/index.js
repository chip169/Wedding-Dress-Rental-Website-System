import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as account from '../controllers/accountController.js';
import * as report from '../controllers/reportController.js';

const router = Router();
const handle = (action) => (req, res, next) => Promise.resolve(action(req, res)).catch(next);

router.post('/auth/login', handle(account.login));
router.post('/auth/register', handle(account.register));
router.get('/dresses', handle(account.dresses));
router.get('/profile', authenticate, handle(account.profile));
router.put('/profile', authenticate, handle(account.updateProfile));
router.patch('/profile/password', authenticate, handle(account.changePassword));
router.get('/orders/my', authenticate, handle(account.orders));
router.get('/orders/my/:id', authenticate, handle(account.order));
router.get('/staff/dashboard', authenticate, authorize('STAFF'), handle(report.staffDashboard));
router.get('/admin/dashboard', authenticate, authorize('ADMIN'), handle(report.adminDashboard));
router.get('/admin/revenue', authenticate, authorize('ADMIN'), handle(report.revenue));

export default router;
