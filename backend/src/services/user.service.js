import User from '../models/User.model.js';
import Role from '../models/Role.model.js';
import bcrypt from 'bcryptjs';

/**
 * Service Quản Lý Tài Khoản & Người Dùng Hệ Thống (Admin User Management)
 */

export const getAllUsers = async (filters = {}) => {
  const query = {};

  // 1. Lọc theo vai trò (Role: ADMIN | STAFF | CUSTOMER)
  if (filters.role && filters.role !== 'all') {
    const roleDoc = await Role.findOne({ code: filters.role.toUpperCase() });
    if (roleDoc) {
      query.roleId = roleDoc._id;
    }
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

  // Lấy các vai trò để tính thống kê
  const [adminRole, staffRole, customerRole] = await Promise.all([
    Role.findOne({ code: 'ADMIN' }).select('_id'),
    Role.findOne({ code: 'STAFF' }).select('_id'),
    Role.findOne({ code: 'CUSTOMER' }).select('_id'),
  ]);

  const [totalAll, adminCount, staffCount, customerCount, blockedCount, totalFiltered, users] =
    await Promise.all([
      User.countDocuments({}),
      adminRole ? User.countDocuments({ roleId: adminRole._id }) : 0,
      staffRole ? User.countDocuments({ roleId: staffRole._id }) : 0,
      customerRole ? User.countDocuments({ roleId: customerRole._id }) : 0,
      User.countDocuments({ isActive: false }),
      User.countDocuments(query),
      User.find(query)
        .populate('roleId', 'code name description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

  return {
    users: users.map((u) => ({
      ...u,
      role: u.roleId?.code?.toLowerCase() || 'customer',
      roleCode: u.roleId?.code || 'CUSTOMER',
      roleName: u.roleId?.name || 'Khách hàng',
    })),
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

export const getUserRoles = async () => {
  return Role.find({}).sort({ code: 1 }).lean();
};

export const getUserById = async (id) => {
  const user = await User.findById(id).populate('roleId', 'code name description').lean();
  if (!user) throw new Error('Không tìm thấy tài khoản người dùng.');
  return {
    ...user,
    role: user.roleId?.code?.toLowerCase() || 'customer',
    roleCode: user.roleId?.code || 'CUSTOMER',
    roleName: user.roleId?.name || 'Khách hàng',
  };
};

export const createUser = async (userData) => {
  const { fullName, email, phone, password, roleCode, roleId, idCard, address } = userData;

  if (!fullName?.trim()) throw new Error('Họ và tên không được để trống.');
  if (!email?.trim()) throw new Error('Email không được để trống.');
  if (!phone?.trim()) throw new Error('Số điện thoại không được để trống.');
  if (!password || password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');

  const cleanEmail = email.trim().toLowerCase();
  const exists = await User.findOne({ email: cleanEmail });
  if (exists) throw new Error('Địa chỉ email này đã được sử dụng trong hệ thống.');

  // Tìm roleId phù hợp
  let targetRoleId = roleId;
  if (!targetRoleId && roleCode) {
    const roleDoc = await Role.findOne({ code: roleCode.toUpperCase() });
    if (roleDoc) targetRoleId = roleDoc._id;
  }
  if (!targetRoleId) {
    const defaultRole = await Role.findOne({ code: 'CUSTOMER' });
    targetRoleId = defaultRole?._id;
  }

  const user = await User.create({
    fullName: fullName.trim(),
    email: cleanEmail,
    phone: phone.trim(),
    password,
    roleId: targetRoleId,
    idCard: idCard?.trim() || '',
    address: address || {},
    isActive: true,
    isEmailVerified: true, // Tài khoản do admin lập trực tiếp không cần mã OTP kích hoạt
    createdByAdmin: true,
  });

  const populated = await User.findById(user._id).populate('roleId', 'code name description').lean();
  return {
    ...populated,
    role: populated.roleId?.code?.toLowerCase() || 'customer',
    roleCode: populated.roleId?.code || 'CUSTOMER',
    roleName: populated.roleId?.name || 'Khách hàng',
  };
};

export const updateUser = async (id, updateData) => {
  const user = await User.findById(id);
  if (!user) throw new Error('Không tìm thấy tài khoản cần cập nhật.');

  if (updateData.fullName) user.fullName = updateData.fullName.trim();
  if (updateData.phone) user.phone = updateData.phone.trim();
  if (updateData.idCard !== undefined) user.idCard = updateData.idCard.trim();
  if (updateData.address) user.address = updateData.address;

  if (updateData.roleCode) {
    const roleDoc = await Role.findOne({ code: updateData.roleCode.toUpperCase() });
    if (roleDoc) user.roleId = roleDoc._id;
  } else if (updateData.roleId) {
    user.roleId = updateData.roleId;
  }

  if (updateData.isActive !== undefined) {
    user.isActive = Boolean(updateData.isActive);
  }

  await user.save();

  const populated = await User.findById(user._id).populate('roleId', 'code name description').lean();
  return {
    ...populated,
    role: populated.roleId?.code?.toLowerCase() || 'customer',
    roleCode: populated.roleId?.code || 'CUSTOMER',
    roleName: populated.roleId?.name || 'Khách hàng',
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

