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
  const phone = String(data.phone ?? '').trim().replace(/[\s.-]/g, '');

  // Validate không cho phép sửa email đã đăng ký
  if (data.email && user.email && email !== user.email.toLowerCase()) {
    fail(400, 'Không được phép thay đổi địa chỉ email đã đăng ký với tài khoản.');
  }

  if (!name || !phone) {
    fail(400, 'Họ tên và số điện thoại là thông tin bắt buộc.');
  }
  if (!/^0[35789]\d{8}$/.test(phone)) {
    fail(400, 'Số điện thoại cần gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.');
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

const ACTIVE_RENTAL_STATUSES = [
  'deposit_paid',
  'active',
  'confirmed',
  'preparing',
  'delivered',
  'renting',
  'returned',
  'waiting_refund',
  'disputed',
];

const MAINTENANCE_STATUSES = [
  'returned',
  'waiting_refund',
  'disputed',
  'inspecting',
  'maintenance',
];

function cleanMatchStr(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Tự động tính toán số lượng tồn kho khả dụng thực tế của từng size
 * sau khi trừ đi các đơn thuê đang hoạt động, đơn đã cọc hoặc trong chu trình bảo dưỡng/kiểm định.
 */
export async function attachAvailabilityToDresses(dresses) {
  if (!dresses || dresses.length === 0) return dresses;

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeOrders = await Order.find({
      $or: [
        { status: { $in: ACTIVE_RENTAL_STATUSES } },
        {
          status: { $in: ['completed', 'complete'] },
          $or: [
            { updatedAt: { $gte: oneDayAgo } },
            { actualReturnDate: { $gte: oneDayAgo } },
            { completedAt: { $gte: oneDayAgo } },
          ],
        },
      ],
    }).select('items status updatedAt actualReturnDate completedAt').lean();

    return dresses.map((d) => {
      const dressId = String(d._id || d.id || '');
      const dressCode = cleanMatchStr(d.code);
      const dressName = cleanMatchStr(d.name);

      const maintBySize = {};
      const rentedBySize = {};
      const bookedBySize = {};

      activeOrders.forEach((o) => {
        const st = String(o.status || '').toLowerCase();
        const isMaintenance =
          MAINTENANCE_STATUSES.includes(st) ||
          (['completed', 'complete'].includes(st) && (
            (o.updatedAt && new Date(o.updatedAt) >= oneDayAgo) ||
            (o.actualReturnDate && new Date(o.actualReturnDate) >= oneDayAgo) ||
            (o.completedAt && new Date(o.completedAt) >= oneDayAgo)
          ));
        const isRenting = ['renting', 'delivered'].includes(st);
        const isBooked = ['deposit_paid', 'active', 'confirmed', 'preparing'].includes(st);

        (o.items || []).forEach((it) => {
          const itId = String(it.dressId?._id || it.dressId || it.id || it._id || '');
          const itCode = cleanMatchStr(it.code);
          const itName = cleanMatchStr(it.name);

          const idMatch = itId && (itId === dressId);
          const codeMatch = itCode && dressCode && (itCode === dressCode);
          const nameMatch = itName && dressName && (itName === dressName && dressName.length >= 2);

          if (idMatch || codeMatch || nameMatch) {
            const rawSize = String(it.size || '').replace(/^size\s*/i, '').trim().toUpperCase();
            const qty = Number(it.quantity || 1);
            if (isMaintenance) {
              maintBySize[rawSize] = (maintBySize[rawSize] || 0) + qty;
            } else if (isRenting) {
              rentedBySize[rawSize] = (rentedBySize[rawSize] || 0) + qty;
            } else if (isBooked) {
              bookedBySize[rawSize] = (bookedBySize[rawSize] || 0) + qty;
            } else {
              rentedBySize[rawSize] = (rentedBySize[rawSize] || 0) + qty;
            }
          }
        });
      });

      let totalAvailable = 0;
      let totalInitialStock = 0;
      let totalMaint = 0;
      let totalRented = 0;
      let totalBooked = 0;

      const updatedSizes = (d.sizes || []).map((s) => {
        const sName = typeof s === 'string' ? s : s?.size || s?.label || '';
        const cleanSName = String(sName).replace(/^size\s*/i, '').trim().toUpperCase();
        const originalQty = typeof s === 'object' && s?.quantity !== undefined ? Math.max(1, Number(s.quantity)) : 1;
        totalInitialStock += originalQty;

        const rawMaint = maintBySize[cleanSName] || 0;
        const sMaint = Math.min(originalQty, rawMaint);

        const rawRented = rentedBySize[cleanSName] || 0;
        const sRented = Math.min(Math.max(0, originalQty - sMaint), rawRented);

        const rawBooked = bookedBySize[cleanSName] || 0;
        const sBooked = Math.min(Math.max(0, originalQty - sMaint - sRented), rawBooked);

        const available = Math.max(0, originalQty - sMaint - sRented - sBooked);
        totalAvailable += available;
        totalMaint += sMaint;
        totalRented += sRented;
        totalBooked += sBooked;

        const isMaintenance = sMaint > 0 && available === 0;

        if (typeof s === 'object' && s !== null) {
          return {
            ...s,
            size: sName,
            quantity: available,
            available,
            availableQuantity: available,
            totalQuantity: originalQty,
            maintenance: sMaint,
            rented: sRented,
            booked: sBooked,
            isMaintenance,
          };
        }
        return {
          size: sName,
          quantity: available,
          available,
          availableQuantity: available,
          totalQuantity: originalQty,
          maintenance: sMaint,
          rented: sRented,
          booked: sBooked,
          isMaintenance,
        };
      });

      return {
        ...d,
        sizes: updatedSizes,
        availableStock: totalAvailable,
        totalStock: totalInitialStock,
        maintenanceStock: totalMaint,
        rentedStock: totalRented,
        bookedStock: totalBooked,
        isOutOfStock: totalAvailable === 0,
      };
    });
  } catch (err) {
    console.error('Lỗi khi tính toán số lượng khả dụng cho váy:', err);
    return dresses;
  }
}

export async function listDresses() {
  const dresses = await Dress.find({ status: { $ne: 'retired' } })
    .populate('categoryId', 'name slug')
    .sort({ code: 1 })
    .lean();

  return attachAvailabilityToDresses(dresses);
}

export async function getDressDetail(idOrSlug) {
  const filter = mongoose.isValidObjectId(idOrSlug)
    ? { _id: idOrSlug }
    : { $or: [{ slug: String(idOrSlug).toLowerCase() }, { code: String(idOrSlug).toUpperCase() }] };

  const dress = await Dress.findOne(filter)
    .populate('categoryId', 'name slug')
    .lean();

  if (!dress) fail(404, 'Không tìm thấy thông tin sản phẩm yêu cầu.');

  const [enriched] = await attachAvailabilityToDresses([dress]);
  return enriched;
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

function normalizeDressSizes(rawSizes) {
  if (!Array.isArray(rawSizes) || rawSizes.length === 0) {
    return [
      { size: 'S', quantity: 1 },
      { size: 'M', quantity: 1 },
    ];
  }
  return rawSizes
    .map((s) => {
      if (typeof s === 'string') {
        const clean = s.replace(/^size\s*/i, '').trim().toUpperCase();
        return clean ? { size: clean, quantity: 1 } : null;
      }
      if (typeof s === 'object' && s && (s.size || s.label)) {
        const clean = String(s.size || s.label).replace(/^size\s*/i, '').trim().toUpperCase();
        const qty = Math.max(0, Number(s.quantity ?? 1));
        return clean ? { size: clean, quantity: qty } : null;
      }
      return null;
    })
    .filter((s) => s && s.quantity > 0);
}

export async function createDress(data) {
  if (!data?.name?.trim()) fail(400, 'Tên váy cưới không được để trống.');
  if (!data?.rentPrice || Number(data.rentPrice) <= 0) fail(400, 'Đơn giá thuê váy cưới không được để trống và phải lớn hơn 0.');
  if (!data?.depositAmount || Number(data.depositAmount) <= 0) fail(400, 'Tiền đặt cọc váy cưới không được để trống và phải lớn hơn 0.');
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

  const dress = await Dress.create({
    code,
    name: data.name,
    slug,
    categoryId,
    silhouette,
    material: data.material || 'Lụa Mikado Ý',
    sizes: normalizeDressSizes(data.sizes),
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

  // Xóa bỏ các trường color / colorOptions nếu có gửi lên
  delete updateData.color;
  delete updateData.colorOptions;
  delete updateData.colors;

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

  // 2. Chuẩn hóa sizes thành mảng Object { size, quantity }
  if (Array.isArray(updateData.sizes)) {
    updateData.sizes = normalizeDressSizes(updateData.sizes);
  }

  // 4. Cho phép tìm theo cả _id ObjectId hoặc mã SKU (UB-012) hoặc slug
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
