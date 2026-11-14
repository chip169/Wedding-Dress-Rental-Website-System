import * as account from '../services/accountService.js';
import * as customer from '../services/customerAccountService.js';

const ok = (res, message, data, status = 200) => res.status(status).json({ success: true, message, data });

export const profile = async (req, res) => ok(res, 'Lấy thông tin hồ sơ thành công.', account.getProfile(req.user));
export const updateProfile = async (req, res) => ok(res, 'Cập nhật thông tin hồ sơ thành công.', await account.updateProfile(req.user, req.body));
export const changePassword = async (req, res) => ok(res, 'Đổi mật khẩu thành công.', await account.changePassword(req.user, req.body));
export const orders = async (req, res) => ok(res, 'Lấy danh sách đơn hàng thành công.', await customer.listOrders(req.user._id));
export const order = async (req, res) => ok(res, 'Lấy chi tiết đơn hàng thành công.', await customer.orderDetail(req.user, req.params.id));
export const cancelOrder = async (req, res) => ok(res, 'Đã hủy đơn thuê. Việc hoàn tiền (nếu có) cần showroom đối soát riêng.', await customer.cancelOrder(req.user, req.params.id));
export const inspection = async (req, res) => ok(res, 'Lấy biên bản kiểm định thành công.', await customer.getInspection(req.user, req.params.id));
export const confirmInspection = async (req, res) => ok(res, 'Đã xác nhận biên bản và gửi thông tin nhận hoàn cọc cho showroom.', await customer.confirmInspection(req.user, req.params.id, req.body));
export const disputeInspection = async (req, res) => ok(res, 'Đã gửi khiếu nại biên bản.', await customer.disputeInspection(req.user, req.params.id, req.body.reason));
export const dresses = async (req, res) => ok(res, 'Lấy danh sách sản phẩm thành công.', await account.listDresses());
export const dressDetail = async (req, res) => ok(res, 'Lấy chi tiết sản phẩm thành công.', await account.getDressDetail(req.params.id));
export const createDress = async (req, res) => ok(res, 'Thêm mới mẫu váy cưới thành công.', await account.createDress(req.body), 201);
export const updateDress = async (req, res) => ok(res, 'Cập nhật mẫu váy cưới thành công.', await account.updateDress(req.params.id, req.body));
export const deleteDress = async (req, res) => ok(res, 'Xóa/ẩn mẫu váy cưới thành công.', await account.deleteDress(req.params.id));
export const getWishlist = async (req, res) => ok(res, 'Lấy danh sách yêu thích thành công.', await account.getWishlist(req.user));
export const updateWishlist = async (req, res) => ok(res, 'Cập nhật danh sách yêu thích thành công.', await account.updateWishlist(req.user, req.body));
