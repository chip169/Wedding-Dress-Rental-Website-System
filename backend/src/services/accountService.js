import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Order from '../models/orderModel.js';
import Dress from '../models/dressModel.js';

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
  role: user.role || 'customer',
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
  if (name.length < 2) {
    fail(400, 'Họ và tên phải có tối thiểu 2 ký tự.');
  }
  if (/\d/.test(name)) {
    fail(400, 'Họ và tên không được chứa chữ số.');
  }
  if (!/^[\p{L}\s'-]+$/u.test(name)) {
    fail(400, 'Họ và tên chỉ được chứa chữ cái và khoảng trắng.');
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
  const account = await User.findById(user._id).select('+password');
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

const normalizeSilhouette = (sil = '') => {
  const s = String(sil).toLowerCase();
  if (s.includes('ballgown') || s.includes('bồng')) return 'Ballgown';
  if (s.includes('mermaid') || s.includes('đuôi cá')) return 'Mermaid';
  if (s.includes('a-line') || s.includes('chữ a') || s.includes('aline')) return 'A-Line';
  if (s.includes('silk') || s.includes('lụa')) return 'Silk Gown';
  if (s.includes('princess') || s.includes('hoàng gia')) return 'Princess';
  return 'Other';
};

const COLOR_PALETTE = {
  'trắng tinh khôi': { hex: '#FFFFFF', border: '#D9D9D9' },
  'trắng ngọc tinh khôi': { hex: '#FFFFFF', border: '#D9D9D9' },
  'trắng kem (ivory)': { hex: '#FDFBF7', border: '#E7DEC8' },
  'trắng kem ivory': { hex: '#FDFBF7', border: '#E7DEC8' },
  'trắng kem': { hex: '#FDFBF7', border: '#E7DEC8' },
  'champagne': { hex: '#F7E7CE', border: '#DEC8A6' },
  'hồng pastel': { hex: '#F5D6D8', border: '#E8B6BC' },
  'hồng nude': { hex: '#EED9D1', border: '#D8BCB2' },
  'đỏ ruby': { hex: '#9B111E', border: '#780B15' },
  'xanh khói (dusty blue)': { hex: '#8CA4B8', border: '#6E8B9E' },
  'xanh khói': { hex: '#8CA4B8', border: '#6E8B9E' },
};

export async function createDress(data) {
  if (!data?.name?.trim()) fail(400, 'Tên váy cưới không được để trống.');
  if (!data?.rentPrice || Number(data.rentPrice) <= 0) fail(400, 'Đơn giá thuê váy cưới không được để trống và phải lớn hơn 0.');
  if (!data?.depositAmount || Number(data.depositAmount) <= 0) fail(400, 'Tiền đặt cọc váy cưới không được để trống và phải lớn hơn 0.');
  if (!data?.color?.trim()) fail(400, 'Màu sắc váy cưới không được để trống.');
  if (!Array.isArray(data?.images) || data.images.length === 0) fail(400, 'Váy cưới bắt buộc phải có ít nhất một hình ảnh sản phẩm.');
  const count = await Dress.countDocuments();
  const code = data.code || `UB-${(count + 1).toString().padStart(3, '0')}`;
  const slug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

  const Category = mongoose.model('Category');
  let categoryId = data.categoryId;
  if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
    if (data.category || data.categoryName || data.silhouette) {
      const catQuery = data.category || data.categoryName || data.silhouette;
      const foundCat = await Category.findOne({
        $or: [
          { name: new RegExp(catQuery, 'i') },
          { slug: String(catQuery).toLowerCase().replace(/[^a-z0-9]+/g, '-') }
        ]
      });
      if (foundCat) categoryId = foundCat._id;
    }
  }

  if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
    let defaultCat = await Category.findOne();
    if (!defaultCat) {
      defaultCat = await Category.create({ name: 'Váy Cưới Cao Cấp', slug: 'vay-cuoi-cao-cap' });
    }
    categoryId = defaultCat._id;
  }

  const silhouette = data.silhouette ? normalizeSilhouette(data.silhouette) : 'Ballgown';

  let colorOptions = [];
  if (typeof data.color === 'string' && data.color.trim()) {
    const colorNames = data.color.split(',').map((c) => c.trim()).filter(Boolean);
    colorOptions = colorNames.map((cName) => {
      const key = cName.toLowerCase();
      const matched = COLOR_PALETTE[key];
      return {
        name: cName,
        hex: matched ? matched.hex : '#FDFBF7',
        border: matched ? matched.border : '#E7DEC8',
      };
    });
  }

  const dress = await Dress.create({
    code,
    name: data.name,
    slug,
    categoryId,
    silhouette,
    material: data.material || 'Lụa Mikado Ý',
    color: data.color || 'Trắng Tinh Khôi',
    colorOptions: colorOptions.length > 0 ? colorOptions : undefined,
    sizes: Array.isArray(data.sizes) && data.sizes.length > 0 ? data.sizes : ['XS', 'S', 'M', 'L'],
    rentPrice: Number(data.rentPrice || data.price || 5000000),
    depositAmount: Number(data.depositAmount || 15000000),
    originalPrice: Number(data.originalPrice || (Number(data.rentPrice || 5000000) * 5)),
    description: data.description || 'Lễ phục cưới cao cấp bảo quản tiêu chuẩn vi khí hậu.',
    images: Array.isArray(data.images) && data.images.length > 0
      ? data.images
      : [data.image || '/assets/dresses/dress_01.jpg'],
    status: data.status || 'available',
    collectionTag: data.collectionTag || 'ATELIER COUTURE 2026',
  });
  return dress;
}

export async function updateDress(id, data) {
  const updateData = { ...data };

  // 1. Chuẩn hóa silhouette nếu có (khớp enum schema)
  if (updateData.silhouette || updateData.category) {
    updateData.silhouette = normalizeSilhouette(updateData.silhouette || updateData.category);
  }
  if (updateData.category) {
    delete updateData.category;
  }
  if (updateData.categoryId && !mongoose.isValidObjectId(updateData.categoryId)) {
    delete updateData.categoryId;
  }

  // 2. Tự động cập nhật colorOptions đồng bộ khi thay đổi color
  if (typeof updateData.color === 'string' && updateData.color.trim()) {
    const colorNames = updateData.color.split(',').map((c) => c.trim()).filter(Boolean);
    updateData.colorOptions = colorNames.map((cName) => {
      const key = cName.toLowerCase();
      const matched = COLOR_PALETTE[key];
      return {
        name: cName,
        hex: matched ? matched.hex : '#FDFBF7',
        border: matched ? matched.border : '#E7DEC8',
      };
    });
  }

  // 3. Cho phép tìm theo cả _id ObjectId hoặc mã SKU (UB-012) hoặc slug
  const filter = mongoose.isValidObjectId(id)
    ? { _id: id }
    : { $or: [{ code: String(id).toUpperCase() }, { slug: String(id).toLowerCase() }] };

  const dress = await Dress.findOneAndUpdate(filter, { $set: updateData }, { returnDocument: 'after', runValidators: true });
  if (!dress) fail(404, 'Không tìm thấy mẫu váy cưới cần cập nhật.');
  return dress;
}

export async function deleteDress(id) {
  const dress = await Dress.findById(id).lean();
  if (!dress) fail(404, 'Không tìm thấy mẫu váy cưới.');

  // 1. Kiểm tra trạng thái trực tiếp của váy
  if (dress.status === 'renting') {
    fail(400, `Không thể xóa mẫu váy "${dress.name}" (${dress.code}) vì đang trong trạng thái "Đang cho thuê".`);
  }

  // 2. Kiểm tra các đơn hàng đang thuê chưa hoàn tất liên quan đến mẫu váy này
  const dressIdsToCheck = [
    id,
    String(id),
    dress._id,
    String(dress._id),
    mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null,
  ].filter(Boolean);

  const activeOrder = await Order.findOne({
    $or: [
      { 'items.dressId': { $in: dressIdsToCheck } },
      { 'items.code': dress.code },
    ],
    status: { $nin: ['completed', 'complete', 'cancelled'] },
  }).lean();

  if (activeOrder) {
    fail(400, `Không thể xóa mẫu váy "${dress.name}" (${dress.code}) vì đang có đơn thuê #${activeOrder.orderCode} chưa hoàn tất.`);
  }

  const updated = await Dress.findByIdAndUpdate(id, { $set: { status: 'retired' } }, { new: true });
  return updated;
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
