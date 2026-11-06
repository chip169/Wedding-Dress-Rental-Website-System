import { Router } from 'express';
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.middleware.js';
import * as account from '../controllers/accountController.js';
import * as report from '../controllers/reportController.js';

const router = Router();
const handle = (action) => (req, res, next) => Promise.resolve(action(req, res)).catch(next);

router.post('/auth/login', handle(account.login));
router.post('/auth/register', handle(account.register));
router.get('/dresses', handle(account.dresses));
router.get('/dresses/:id', handle(account.dressDetail));
router.post('/dresses', optionalAuthenticate, handle(account.createDress));
router.put('/dresses/:id', optionalAuthenticate, handle(account.updateDress));
router.patch('/dresses/:id', optionalAuthenticate, handle(account.updateDress));
router.delete('/dresses/:id', optionalAuthenticate, handle(account.deleteDress));
router.get('/profile/wishlist', authenticate, handle(account.getWishlist));
router.put('/profile/wishlist', authenticate, handle(account.updateWishlist));
router.get('/profile', authenticate, handle(account.profile));
router.put('/profile', authenticate, handle(account.updateProfile));
router.patch('/profile/password', authenticate, handle(account.changePassword));
router.get('/orders/my', authenticate, handle(account.orders));
router.get('/orders/my/:id', authenticate, handle(account.order));
router.post('/orders/my/:id/cancel', authenticate, handle(account.cancelOrder));
router.get('/orders/my/:id/inspection', authenticate, handle(account.inspection));
router.post('/orders/my/:id/inspection/approve', authenticate, handle(account.confirmInspection));
router.post('/orders/my/:id/inspection/dispute', authenticate, handle(account.disputeInspection));
router.get('/account/orders', authenticate, handle(account.orders));
router.get('/account/orders/:id', authenticate, handle(account.order));
router.post('/account/orders/:id/cancel', authenticate, handle(account.cancelOrder));
router.get('/account/orders/:id/inspection', authenticate, handle(account.inspection));
router.post('/account/orders/:id/inspection/approve', authenticate, handle(account.confirmInspection));
router.post('/account/orders/:id/inspection/dispute', authenticate, handle(account.disputeInspection));
router.get('/staff/dashboard', authenticate, authorize('STAFF', 'ADMIN'), handle(report.staffDashboard));
router.get('/staff/dashboard/appointments', authenticate, authorize('STAFF', 'ADMIN'), handle(report.staffAppointments));
router.get('/admin/dashboard', authenticate, authorize('ADMIN'), handle(report.adminDashboard));
router.get('/admin/revenue', authenticate, authorize('ADMIN'), handle(report.revenue));

export default router;
