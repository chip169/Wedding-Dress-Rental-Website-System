import * as account from '../services/accountService.js';

const ok = (res, message, data, status = 200) => res.status(status).json({ success: true, message, data });
export const login = async (req, res) => ok(res, 'Đăng nhập thành công.', await account.login(req.body.email, req.body.password));
export const register = async (req, res) => ok(res, 'Đăng ký thành công.', await account.register(req.body), 201);
export const profile = async (req, res) => ok(res, 'Lấy hồ sơ thành công.', account.getProfile(req.user));
export const updateProfile = async (req, res) => ok(res, 'Cập nhật hồ sơ thành công.', await account.updateProfile(req.user, req.body));
export const changePassword = async (req, res) => ok(res, 'Đổi mật khẩu thành công.', await account.changePassword(req.user, req.body));
export const orders = async (req, res) => ok(res, 'Lấy đơn hàng thành công.', await account.getOrders(req.user._id));
export const order = async (req, res) => ok(res, 'Lấy chi tiết đơn hàng thành công.', await account.getOrder(req.user._id, req.params.id));
export const dresses = async (req, res) => ok(res, 'Lấy sản phẩm thành công.', await account.listDresses());
