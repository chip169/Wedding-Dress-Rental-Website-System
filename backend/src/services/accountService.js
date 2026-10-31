import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Role from '../models/Role.model.js';
import Order from '../models/Order.model.js';
import Dress from '../models/Dress.model.js';

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const emailPattern = /^\S+@\S+\.\S+$/;
const publicUser = (user) => ({
  id: String(user._id), name: user.fullName, email: user.email, phone: user.phone,
  avatar: user.avatar || '',
  role: user.roleId?.code?.toLowerCase() || 'customer',
});
const tokenFor = (user) => jwt.sign(
  { id: String(user._id) },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
);

export async function login(email, password) {
  if (!email || !password) fail(400, 'Vui lòng nhập email và mật khẩu.');
  const identity = String(email).trim().toLowerCase();
  const user = await User.findOne({ $or: [{ email: identity }, { phone: identity }] }).select('+password').populate('roleId');
  if (!user || !(await user.comparePassword(password))) fail(401, 'Email hoặc mật khẩu không đúng.');
  if (!user.isActive) fail(403, 'Tài khoản đã bị khóa.');
  return { user: publicUser(user), token: tokenFor(user) };
}

export async function register({ name, email, phone, password }) {
  if (!name?.trim() || !emailPattern.test(email || '') || !phone?.trim() || !password || password.length < 8) {
    fail(400, 'Vui lòng nhập họ tên, email, số điện thoại và mật khẩu từ 8 ký tự.');
  }
  const role = await Role.findOne({ code: 'CUSTOMER' });
  if (!role) fail(503, 'Vai trò khách hàng chưa được cấu hình.');
  if (await User.exists({ email: email.trim().toLowerCase() })) fail(400, 'Email đã được sử dụng.');
  const user = await User.create({ fullName: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password, roleId: role._id });
  user.roleId = role;
  return { user: publicUser(user), token: tokenFor(user) };
}

export function getProfile(user) { return publicUser(user); }

export async function updateProfile(user, data) {
  const name = String(data.name ?? '').trim();
  const email = String(data.email ?? '').trim().toLowerCase();
  const phone = String(data.phone ?? '').trim();
  if (!name || !emailPattern.test(email) || !phone) fail(400, 'Họ tên, email và số điện thoại là bắt buộc.');
  if (email !== user.email && await User.exists({ email, _id: { $ne: user._id } })) fail(400, 'Email đã được sử dụng.');
  if (data.avatar && (!/^data:image\/(png|jpeg|webp);base64,/.test(data.avatar) || data.avatar.length > 7_000_000)) fail(400, 'Ảnh đại diện không hợp lệ hoặc quá lớn.');
  Object.assign(user, { fullName: name, email, phone, avatar: data.avatar || '' });
  await user.save();
  return publicUser(user);
}

export async function changePassword(user, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) fail(400, 'Mật khẩu mới cần ít nhất 8 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt.');
  const account = await User.findById(user._id).select('+password').populate('roleId');
  if (!(await account.comparePassword(currentPassword))) fail(400, 'Mật khẩu hiện tại không đúng.');
  if (await account.comparePassword(newPassword)) fail(400, 'Mật khẩu mới phải khác mật khẩu hiện tại.');
  account.password = newPassword;
  await account.save();
  return { token: tokenFor(account) };
}

export async function getOrders(customerId) {
  return Order.find({ customerId }).sort({ createdAt: -1 }).populate('items.dressId', 'images code silhouette').lean();
}

export async function getOrder(customerId, identifier) {
  const filter = mongoose.isValidObjectId(identifier) ? { _id: identifier, customerId } : { orderCode: String(identifier).toUpperCase(), customerId };
  const order = await Order.findOne(filter).populate('items.dressId', 'images code silhouette').lean();
  if (!order) fail(404, 'Không tìm thấy đơn hàng.');
  return order;
}

export async function listDresses() {
  return Dress.find({ status: { $ne: 'retired' } }).select('code name images rentPrice depositAmount status sizes collectionTag').sort({ code: 1 }).lean();
}

