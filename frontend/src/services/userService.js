import axiosClient from '../api/axiosClient';

/**
 * Service Quản Lý Người Dùng / Tài Khoản Hệ Thống (Admin User Management)
 */

// Module-level in-memory cache for users
const usersCache = new Map();
const USERS_CACHE_TTL = 15000; // 15s cache

export function clearUsersCache() {
  usersCache.clear();
}

export function getCachedUsers(params = {}) {
  const key = JSON.stringify(params);
  const entry = usersCache.get(key);
  if (entry && (Date.now() - entry.timestamp < USERS_CACHE_TTL)) {
    return entry.data;
  }
  return null;
}

/**
 * Lấy danh sách tài khoản theo bộ lọc và phân trang (Có Memory Cache)
 * @param {Object} params - { role, status, search, page, limit }
 * @param {boolean} forceRefresh - Buộc làm mới dữ liệu
 */
export async function getAllUsers(params = {}, forceRefresh = false) {
  const key = JSON.stringify(params);
  if (!forceRefresh) {
    const cached = usersCache.get(key);
    if (cached && (Date.now() - cached.timestamp < USERS_CACHE_TTL)) {
      return cached.data;
    }
  }

  try {
    const res = await axiosClient.get('/users', { params });
    const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : res.data?.data || []);
    const total = res.pagination?.total ?? res.total ?? list.length;
    const page = res.pagination?.page ?? res.page ?? 1;
    const totalPages = res.pagination?.totalPages ?? res.totalPages ?? 1;
    const stats = res.stats || null;

    const result = {
      users: list,
      total,
      page,
      totalPages,
      stats,
    };
    usersCache.set(key, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return {
      users: [],
      total: 0,
      page: 1,
      totalPages: 1,
      stats: null,
      error: error.message || 'Không thể tải danh sách tài khoản',
    };
  }
}

/**
 * Lấy danh sách các vai trò (ADMIN, STAFF, CUSTOMER)
 */
export async function getUserRoles() {
  try {
    const res = await axiosClient.get('/users/roles');
    return Array.isArray(res.data) ? res.data : (res?.data?.data || []);
  } catch (error) {
    return [
      { code: 'ADMIN', name: 'Quản trị viên', description: 'Toàn quyền quản trị hệ thống' },
      { code: 'STAFF', name: 'Nhân viên Showroom', description: 'Tiếp nhận đơn, thử váy và kiểm định' },
      { code: 'CUSTOMER', name: 'Khách hàng', description: 'Khách hàng thuê váy và đặt lịch' },
    ];
  }
}

/**
 * Tạo tài khoản mới (Admin tạo cho Staff / Customer / Admin)
 * @param {Object} userData - { fullName, email, phone, password, roleCode, idCard }
 */
export async function createUser(userData) {
  clearUsersCache();
  try {
    const res = await axiosClient.post('/users', userData);
    return res.data?.data || res.data || res;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Không thể tạo tài khoản.');
  }
}

/**
 * Cập nhật thông tin tài khoản
 * @param {string} id
 * @param {Object} updateData - { fullName, phone, roleCode, idCard, isActive }
 */
export async function updateUser(id, updateData) {
  clearUsersCache();
  try {
    const res = await axiosClient.put(`/users/${id}`, updateData);
    return res.data?.data || res.data || res;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Không thể cập nhật tài khoản.');
  }
}

/**
 * Khóa hoặc Mở khóa tài khoản
 * @param {string} id
 */
export async function toggleUserStatus(id) {
  clearUsersCache();
  try {
    const res = await axiosClient.patch(`/users/${id}/status`);
    return res.data?.data || res.data || res;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Không thể đổi trạng thái tài khoản.');
  }
}

/**
 * Xóa tài khoản khỏi hệ thống
 * @param {string} id
 */
export async function deleteUser(id) {
  clearUsersCache();
  try {
    const res = await axiosClient.delete(`/users/${id}`);
    return res.data || res;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Không thể xóa tài khoản.');
  }
}

