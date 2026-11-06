import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Role from '../models/Role.model.js';
import Order from '../models/Order.model.js';
import Dress from '../models/Dress.model.js';

const fail = (status, message) => {
  throw Object.assign(new Error(message), { status, statusCode: status });
};

const emailPattern = /^\S+@\S+\.\S+$/;

const publicUser = (user) => ({
  id: String(user._id),
  name: user.fullName,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar || '',
  role: user.roleId?.code?.toLowerCase() || user.role || 'customer',
  wishlist: (user.wishlist || []).filter(Boolean).map((d) => String(d._id || d)),
  fullName: user.fullName,
  measurements: user.measurements || {},
  address: user.address || {},
  idCard: user.idCard || '',
  gender: user.gender || 'unspecified',
  birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
  weddingDate: user.weddingDate ? new Date(user.weddingDate).toISOString().split('T')[0] : '',
});

const tokenFor = (user) => jwt.sign(
  { id: String(user._id) },
  process.env.JWT_SECRET || 'unibridal_jwt_secret_key_2026_wdp301',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
);

export async function login(email, password) {
  if (!email || !password) fail(400, 'Vui lòng nhập đầy đủ email và mật khẩu.');
  const identity = String(email).trim().toLowerCase();
  const user = await User.findOne({ $or: [{ email: identity }, { phone: identity }] })
    .select('+password')
    .populate('roleId');

  if (!user || !(await user.comparePassword(password))) {
    fail(401, 'Email hoặc mật khẩu không chính xác.');
  }
  if (!user.isActive) {
    fail(403, 'Tài khoản của bạn hiện đang bị tạm khóa. Vui lòng liên hệ quản trị viên.');
  }
  return { user: publicUser(user), token: tokenFor(user) };
}

export async function register({ name, email, phone, password }) {
  if (!name?.trim() || !emailPattern.test(email || '') || !phone?.trim() || !password || password.length < 6) {
    fail(400, 'Vui lòng nhập đầy đủ họ tên, email hợp lệ, số điện thoại và mật khẩu từ 6 ký tự.');
  }
  const cleanEmail = email.trim().toLowerCase();
  const role = await Role.findOne({ code: 'CUSTOMER' });
  if (!role) fail(503, 'Cấu hình vai trò khách hàng (CUSTOMER) chưa sẵn sàng trên hệ thống.');
  if (await User.exists({ email: cleanEmail })) {
    fail(400, 'Địa chỉ email này đã được đăng ký trong hệ thống.');
  }

  const user = await User.create({
    fullName: name.trim(),
    email: cleanEmail,
    phone: phone.trim(),
    password,
    roleId: role._id,
    isActive: true,
  });
  user.roleId = role;
  return { user: publicUser(user), token: tokenFor(user) };
}

export function getProfile(user) {
  return publicUser(user);
}

export async function updateProfile(user, data) {
  const name = String(data.name ?? '').trim();
  const email = String(data.email ?? user.email ?? '').trim().toLowerCase();
  const phone = String(data.phone ?? '').trim();

  // Validate không cho phép sửa email đã đăng ký
  if (data.email && user.email && email !== user.email.toLowerCase()) {
    fail(400, 'Không được phép thay đổi địa chỉ email đã đăng ký với tài khoản.');
  }

  if (!name || !phone) {
    fail(400, 'Họ tên và số điện thoại là thông tin bắt buộc.');
  }
  if (data.avatar && (!/^data:image\/(png|jpeg|webp);base64,/.test(data.avatar) || data.avatar.length > 7_000_000)) {
    fail(400, 'Ảnh đại diện không đúng định dạng (PNG/JPEG/WEBP) hoặc dung lượng vượt quá 5MB.');
  }

  Object.assign(user, { fullName: name, phone, avatar: data.avatar || user.avatar || '' });
  if (data.idCard !== undefined) {
    const idCard = String(data.idCard).trim();
    if (idCard && !/^(\d{9}|\d{12})$/.test(idCard)) fail(400, 'CCCD/CMND cần gồm 9 hoặc 12 chữ số.');
    user.idCard = idCard;
  }
  if (data.gender !== undefined) {
    user.gender = ['female', 'male', 'unspecified'].includes(data.gender) ? data.gender : 'unspecified';
  }
  if (data.birthday !== undefined) {
    user.birthday = data.birthday ? new Date(data.birthday) : null;
  }
  if (data.weddingDate !== undefined) {
    user.weddingDate = data.weddingDate ? new Date(data.weddingDate) : null;
  }
  if (data.address !== undefined) {
    const address = typeof data.address === 'string' ? { street: data.address } : data.address;
    if (!address || typeof address !== 'object' || Array.isArray(address)) fail(400, 'Địa chỉ không hợp lệ.');
    user.address = Object.fromEntries(['street', 'ward', 'district', 'city'].map((key) => [key, String(address[key] ?? '').trim()]));
  }
  if (data.measurements !== undefined) {
    const measurements = {};
    for (const key of ['height', 'weight', 'bust', 'waist', 'hips', 'heel']) {
      const value = data.measurements?.[key];
      measurements[key] = value === '' || value == null ? null : Number(value);
      if (measurements[key] !== null && (!Number.isFinite(measurements[key]) || measurements[key] < 0 || measurements[key] > 500)) {
        fail(400, 'Số đo cần là số hợp lệ, không vượt quá 500.');
      }
    }
    user.measurements = measurements;
  }
  await user.save();
  return publicUser(user);
}

export async function changePassword(user, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    fail(400, 'Mật khẩu mới cần tối thiểu 6 ký tự.');
  }
  const account = await User.findById(user._id).select('+password').populate('roleId');
  if (!(await account.comparePassword(currentPassword))) {
    fail(400, 'Mật khẩu hiện tại không chính xác.');
  }
  if (await account.comparePassword(newPassword)) {
    fail(400, 'Mật khẩu mới phải khác với mật khẩu đang sử dụng.');
  }
  account.password = newPassword;
  await account.save();
  return { token: tokenFor(account) };
}

export async function getOrders(customerId) {
  return Order.find({ customerId })
    .sort({ createdAt: -1 })
    .populate('items.dressId', 'images code silhouette')
    .lean();
}

export async function getOrder(customerId, identifier) {
  const filter = mongoose.isValidObjectId(identifier)
    ? { _id: identifier, customerId }
    : { orderCode: String(identifier).toUpperCase(), customerId };

  const order = await Order.findOne(filter)
    .populate('items.dressId', 'images code silhouette')
    .lean();

  if (!order) fail(404, 'Không tìm thấy thông tin đơn hàng yêu cầu.');
  return order;
}

export async function listDresses() {
  return Dress.find({ status: { $ne: 'retired' } })
    .populate('categoryId', 'name slug')
    .sort({ code: 1 })
    .lean();
}

export async function getDressDetail(idOrSlug) {
  const filter = mongoose.isValidObjectId(idOrSlug)
    ? { _id: idOrSlug }
    : { $or: [{ slug: String(idOrSlug).toLowerCase() }, { code: String(idOrSlug).toUpperCase() }] };

  const dress = await Dress.findOne(filter)
    .populate('categoryId', 'name slug')
    .lean();

  if (!dress) fail(404, 'Không tìm thấy thông tin sản phẩm yêu cầu.');
  return dress;
}

export async function createDress(data) {
  if (!data?.name) fail(400, 'Tên váy cưới không được để trống.');
  const count = await Dress.countDocuments();
  const code = data.code || `UB-${(count + 1).toString().padStart(3, '0')}`;
  const slug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

  let categoryId = data.categoryId;
  if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
    const Category = mongoose.model('Category');
    let defaultCat = await Category.findOne();
    if (!defaultCat) {
      defaultCat = await Category.create({ name: 'Váy Cưới Cao Cấp', slug: 'vay-cuoi-cao-cap' });
    }
    categoryId = defaultCat._id;
  }

  const dress = await Dress.create({
    code,
    name: data.name,
    slug,
    categoryId,
    silhouette: data.silhouette || 'Ballgown',
    material: data.material || 'Lụa tơ tằm Ý & Ren Pháp',
    sizes: data.sizes || ['S', 'M'],
    rentPrice: Number(data.rentPrice || data.price || 5000000),
    depositAmount: Number(data.depositAmount || 15000000),
    originalPrice: Number(data.originalPrice || 30000000),
    description: data.description || '',
    images: data.images || [data.image || '/assets/dresses/dress_01.jpg'],
    status: data.status || 'available',
    collectionTag: data.collectionTag || 'ATELIER COUTURE 2026',
  });
  return dress;
}

export async function updateDress(id, data) {
  const dress = await Dress.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!dress) fail(404, 'Không tìm thấy mẫu váy cưới cần cập nhật.');
  return dress;
}

export async function deleteDress(id) {
  const dress = await Dress.findByIdAndUpdate(id, { $set: { status: 'retired' } }, { new: true });
  if (!dress) fail(404, 'Không tìm thấy mẫu váy cưới.');
  return dress;
}

export async function getWishlist(user) {
  const account = await User.findById(user._id).lean();
  return (account?.wishlist || []).filter(Boolean).map((d) => String(d._id || d));
}

export async function updateWishlist(user, { dressIds }) {
  if (!Array.isArray(dressIds)) fail(400, 'dressIds phải là một mảng danh sách ID.');
  const validObjectIds = dressIds
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const account = await User.findByIdAndUpdate(
    user._id,
    { wishlist: validObjectIds },
    { new: true }
  ).lean();
  return (account?.wishlist || []).filter(Boolean).map((d) => String(d._id || d));
}
