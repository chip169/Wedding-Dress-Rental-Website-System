import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

const getRoleMeta = (roleStr) => {
  const r = (roleStr || 'customer').toLowerCase();
  if (r === 'admin') return { code: 'ADMIN', name: 'Quản trị viên' };
  if (r === 'staff') return { code: 'STAFF', name: 'Nhân viên' };
  return { code: 'CUSTOMER', name: 'Khách hàng' };
};

/**
 * Service Quản Lý Tài Khoản và Người Dùng Hệ Thống (Admin User Management)
 */

export const getAllUsers = async (filters = {}) => {
  const query = {};

  // 1. Lọc theo vai trò (Role: ADMIN | STAFF | CUSTOMER)
  if (filters.role && filters.role !== 'all') {
    query.role = filters.role.toLowerCase();
  }

  // 2. Lọc theo trạng thái hoạt động (active | blocked)
  if (filters.status && filters.status !== 'all') {
    query.isActive = filters.status === 'active';
  }

  // 3. Tìm kiếm theo tên, email, số điện thoại
  if (filters.search && filters.search.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { fullName: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
    ];
  }

  const page = parseInt(filters.page, 10) || 1;
  const limit = parseInt(filters.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [totalAll, adminCount, staffCount, customerCount, blockedCount, totalFiltered, users] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'staff' }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ isActive: false }),
      User.countDocuments(query),
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

  return {
    users: users.map((u) => {
      const meta = getRoleMeta(u.role);
      return {
        ...u,
        role: (u.role || 'customer').toLowerCase(),
        roleCode: meta.code,
        roleName: meta.name,
      };
    }),
    total: totalFiltered,
    page,
    totalPages: Math.ceil(totalFiltered / limit),
    stats: {
      total: totalAll,
      admin: adminCount,
      staff: staffCount,
      customer: customerCount,
      active: Math.max(0, totalAll - blockedCount),
      blocked: blockedCount,
    },
  };
};

export const getUserRoles = async () => [
  { code: 'CUSTOMER', name: 'Khách hàng', description: 'Khách hàng thuê váy và đặt lịch' },
  { code: 'STAFF', name: 'Nhân viên Showroom', description: 'Nhân viên tư vấn, thử váy, kiểm định' },
  { code: 'ADMIN', name: 'Quản trị viên', description: 'Toàn quyền quản trị hệ thống' },
];

export const getUserById = async (id) => {
  const user = await User.findById(id).lean();
  if (!user) throw new Error('Không tìm thấy tài khoản người dùng.');
  const meta = getRoleMeta(user.role);
  return {
    ...user,
    role: (user.role || 'customer').toLowerCase(),
    roleCode: meta.code,
    roleName: meta.name,
  };
};

export const createUser = async (userData) => {
  const { fullName, email, phone, password, roleCode, role, idCard, address } = userData;

  if (!fullName?.trim()) throw new Error('Họ và tên không được để trống.');
  if (fullName.trim().length < 2) throw new Error('Họ và tên phải có ít nhất 2 ký tự.');
  if (/\d/.test(fullName.trim())) throw new Error('Họ và tên không được chứa chữ số.');
  if (!/^[\p{L}\s'-]+$/u.test(fullName.trim())) throw new Error('Họ và tên chỉ được chứa chữ cái và khoảng trắng.');
  if (!email?.trim()) throw new Error('Email không được để trống.');
  if (!phone?.trim()) throw new Error('Số điện thoại không được để trống.');
  if (!password || password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');

  const cleanEmail = email.trim().toLowerCase();
  const exists = await User.findOne({ email: cleanEmail });
  if (exists) throw new Error('Địa chỉ email này đã được sử dụng trong hệ thống.');

  const cleanRole = (role || roleCode || 'customer').toLowerCase();
  const user = await User.create({
    fullName: fullName.trim(),
    email: cleanEmail,
    phone: phone.trim(),
    password,
    role: cleanRole,
    idCard: idCard?.trim() || '',
    address: address || {},
    isActive: true,
    isEmailVerified: true,
    createdByAdmin: true,
  });

  const created = await User.findById(user._id).lean();
  const meta = getRoleMeta(created.role);
  return {
    ...created,
    role: created.role,
    roleCode: meta.code,
    roleName: meta.name,
  };
};

export const updateUser = async (id, updateData) => {
  const user = await User.findById(id);
  if (!user) throw new Error('Không tìm thấy tài khoản cần cập nhật.');

  if (updateData.fullName) {
    const cleanName = updateData.fullName.trim();
    if (cleanName.length < 2) throw new Error('Họ và tên phải có ít nhất 2 ký tự.');
    if (/\d/.test(cleanName)) throw new Error('Họ và tên không được chứa chữ số.');
    if (!/^[\p{L}\s'-]+$/u.test(cleanName)) throw new Error('Họ và tên chỉ được chứa chữ cái và khoảng trắng.');
    user.fullName = cleanName;
  }
  if (updateData.phone) user.phone = updateData.phone.trim();
  if (updateData.idCard !== undefined) user.idCard = updateData.idCard.trim();
  if (updateData.address) user.address = updateData.address;

  if (updateData.role) {
    user.role = updateData.role.toLowerCase();
  } else if (updateData.roleCode) {
    user.role = updateData.roleCode.toLowerCase();
  }

  if (updateData.isActive !== undefined) {
    user.isActive = Boolean(updateData.isActive);
  }

  await user.save();

  const updated = await User.findById(user._id).lean();
  const meta = getRoleMeta(updated.role);
  return {
    ...updated,
    role: updated.role,
    roleCode: meta.code,
    roleName: meta.name,
  };
};

export const toggleUserStatus = async (id, currentUserId) => {
  if (String(id) === String(currentUserId)) {
    throw new Error('Bạn không thể tự khóa tài khoản quản trị của chính mình.');
  }

  const user = await User.findById(id);
  if (!user) throw new Error('Không tìm thấy tài khoản.');

  user.isActive = !user.isActive;
  await user.save();

  return {
    id: user._id,
    isActive: user.isActive,
    message: user.isActive ? 'Đã mở khóa tài khoản thành công.' : 'Đã tạm khóa tài khoản.',
  };
};

export const resetUserPassword = async (id, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
  }

  const user = await User.findById(id);
  if (!user) throw new Error('Không tìm thấy tài khoản.');

  user.password = newPassword;
  await user.save();

  return { success: true, message: 'Đã đặt lại mật khẩu cho tài khoản thành công.' };
};

export const deleteUser = async (id, currentUserId) => {
  if (String(id) === String(currentUserId)) {
    throw new Error('Bạn không thể xóa tài khoản quản trị đang đăng nhập.');
  }

  const user = await User.findById(id);
  if (!user) throw new Error('Không tìm thấy tài khoản cần xóa.');

  if (user.email === 'admin@unibridal.com') {
    throw new Error('Không thể xóa tài khoản Quản Trị Viên gốc (Root Admin) của hệ thống.');
  }

  await User.findByIdAndDelete(id);
  return { success: true, message: 'Đã xóa tài khoản khỏi hệ thống thành công.' };
};

