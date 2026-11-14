import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { message, Modal } from 'antd';
import { UserCheck,
  ShieldCheck,
  Crown,
  Search,
  Filter,
  Plus,
  Trash2,
  Lock,
  Unlock,
  ChevronDown,
  X,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Shield,
  CreditCard,
  User,
  ChevronLeft,
  ChevronRight } from 'lucide-react';
import {
  getAllUsers,
  getCachedUsers,
  getUserRoles,
  createUser,
  toggleUserStatus,
  deleteUser,
} from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

const DEFAULT_PAGE_SIZE = 10;

const ROLE_CONFIG = {
  ADMIN: {
    label: 'Quản Trị Viên',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: ShieldCheck,
  },
  STAFF: {
    label: 'Nhân Viên Showroom',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: UserCheck,
  },
  CUSTOMER: {
    label: 'Khách Hàng',
    bg: 'bg-[#FAF0EC] text-[#733F49] border-[#F2D8D4]',
    icon: Crown,
  },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

export default function AccountManagement() {
  const { user: currentUser } = useAuth();
  const initialCached = useMemo(() => {
    return getCachedUsers({ page: 1, limit: DEFAULT_PAGE_SIZE });
  }, []);

  const [users, setUsers] = useState(() => initialCached?.users || []);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(() => !initialCached);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(() => initialCached?.total || 0);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Bộ lọc và tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  // Form states cho Create User
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    roleCode: 'STAFF',
    idCard: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Load dữ liệu tài khoản từ API ──────────────────────────────────────────
  const loadUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = {
        page: activePage,
        limit: pageSize,
      };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const [usersRes, rolesRes] = await Promise.all([
        getAllUsers(params),
        getUserRoles(),
      ]);

      setUsers(usersRes.users || []);
      setTotal(usersRes.total || 0);
      setRoles(rolesRes || []);
      setError('');
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      if (!isSilent) {
        setError('Không thể kết nối đến máy chủ để tải danh sách tài khoản.');
      }
    } finally {
      setLoading(false);
    }
  }, [activePage, pageSize, roleFilter, statusFilter, searchTerm]);

  useEffect(() => {
    loadUsers(Boolean(initialCached));
  }, [loadUsers]);

  // ── Xử lý tạo mới tài khoản ────────────────────────────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.phone.trim() || !createForm.password) {
      message.error('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
      return;
    }
    if (/\d/.test(createForm.fullName.trim())) {
      message.error('Họ và tên không được chứa chữ số.');
      return;
    }
    if (createForm.password.length < 6) {
      message.error('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }

    setCreateLoading(true);
    try {
      await createUser(createForm);
      message.success(`Đã khởi tạo tài khoản "${createForm.fullName}" thành công!`);
      setIsCreateModalOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        roleCode: 'STAFF',
        idCard: '',
      });
      loadUsers();
    } catch (err) {
      message.error(err.message || 'Không thể tạo tài khoản.');
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Xử lý Khóa / Mở khóa tài khoản ────────────────────────────────────────
  const handleToggleStatus = async (u) => {
    try {
      const res = await toggleUserStatus(u._id);
      message.success(res.message || 'Đã cập nhật trạng thái tài khoản.');
      loadUsers();
    } catch (err) {
      message.error(err.message || 'Lỗi khi thay đổi trạng thái.');
    }
  };

  // ── Xử lý Xóa tài khoản ───────────────────────────────────────────────────
  const handleDeleteSubmit = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deletingUser._id);
      message.success(`Đã xóa tài khoản "${deletingUser.fullName}" khỏi hệ thống.`);
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      message.error(err.message || 'Không thể xóa tài khoản.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ── Pagination Helper ───────────────────────────────────────────────────────
  const pageNumbers = useMemo(() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (activePage < 3) {
      return [1, 2, 3, '...', totalPages - 1, totalPages];
    }
    if (activePage >= totalPages - 2) {
      return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', activePage - 1, activePage, activePage + 1, '...', totalPages];
  }, [totalPages, activePage]);

  return (
    <AdminLayout activeMenu="accounts">
      <div className="font-jakarta text-[#2C2523] pb-12">
        {/* Header và Page Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-[32px] sm:text-[38px] font-normal text-[#5F2B36] tracking-tight leading-tight mb-2">
              Quản Lý Tài Khoản
            </h1>
            <p className="text-[14px] text-[#7A6B6C] font-normal max-w-3xl leading-relaxed">
              Quản lý danh sách nhân viên showroom, tài khoản khách hàng và phân quyền truy cập hệ thống UniBridal.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#733F49] to-[#8C4654] hover:from-[#5A2D35] hover:to-[#733F49] text-white text-xs font-bold transition-all cursor-pointer shadow-md border-0 shrink-0 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Thêm Tài Khoản Mới</span>
          </button>
        </div>

        {/* Thanh Tìm Kiếm và Bộ Lọc */}
        <div className="bg-white rounded-2xl border border-[#EFE5E1] p-4 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A8B8C]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setActivePage(1); }}
                placeholder="Tìm theo họ tên, email, số điện thoại..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#FFF6F3] border border-[#F4E8E3] focus:border-[#B8737D] focus:bg-white text-[13px] text-[#2C2523] placeholder-[#A39293] outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); setActivePage(1); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A39293] hover:text-[#5F333B] cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {/* Lọc theo Vai trò */}
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setActivePage(1); }}
                className="px-3.5 py-2.5 rounded-xl bg-[#FAF2EE] border border-[#EFE2DC] text-[12.5px] text-[#554748] font-medium outline-none cursor-pointer"
              >
                <option value="all">Tất Cả Vai Trò</option>
                <option value="ADMIN">Quản Trị Viên (Admin)</option>
                <option value="STAFF">Nhân Viên (Staff)</option>
                <option value="CUSTOMER">Khách Hàng (Customer)</option>
              </select>

              {/* Lọc theo Trạng thái */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setActivePage(1); }}
                className="px-3.5 py-2.5 rounded-xl bg-[#FAF2EE] border border-[#EFE2DC] text-[12.5px] text-[#554748] font-medium outline-none cursor-pointer"
              >
                <option value="all">Tất Cả Trạng Thái</option>
                <option value="active">Đang Hoạt Động</option>
                <option value="blocked">Đã Tạm Khóa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bảng Danh Sách Tài Khoản */}
        <div className="bg-white rounded-2xl border border-[#EFE5E1] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F0E5DC] bg-[#FAF5F2]">
                  <th className="py-4 px-5 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase">
                    HỌ VÀ TÊN
                  </th>
                  <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase">
                    THÔNG TIN LIÊN HỆ
                  </th>
                  <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center">
                    VAI TRÒ HỆ THỐNG
                  </th>
                  <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center">
                    TRẠNG THÁI
                  </th>
                  <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center">
                    NGÀY TẠO
                  </th>
                  <th className="py-4 px-5 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-right">
                    THAO TÁC
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6EDE9]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <RefreshCw size={24} className="animate-spin text-[#B8737D] mx-auto mb-2" />
                      <p className="text-[13px] text-[#8C7D7E]">Đang tải danh sách tài khoản...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-[#8C7D7E] text-sm">
                      Không tìm thấy tài khoản nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const roleCfg = ROLE_CONFIG[u.roleCode] || ROLE_CONFIG.CUSTOMER;
                    const isSelf = String(u._id) === String(currentUser?._id);

                    return (
                      <tr key={u._id} className="hover:bg-[#FCF9F7] transition-colors">
                        {/* Cột 1: Họ tên và Avatar */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-full bg-[#FAF0EC] text-[#733F49] font-bold flex items-center justify-center border border-[#EFE2DC] uppercase text-[14px] shrink-0">
                              {u.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-[#2C2523] text-[13.5px] leading-tight flex items-center gap-1.5">
                                <span>{u.fullName}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FAF0EC] text-[#733F49]">
                                    (Bạn)
                                  </span>
                                )}
                              </div>
                              {u.idCard && (
                                <div className="text-[11px] text-[#8C7D7E] mt-0.5 font-mono">
                                  CCCD: {u.idCard}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cột 2: Email và SĐT */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-[12.5px] text-[#4A3B3D] font-medium">
                            <Mail size={13} className="text-[#8C7D7E]" />
                            <span>{u.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11.5px] text-[#7A6B6C] mt-1 font-mono">
                            <Phone size={13} className="text-[#8C7D7E]" />
                            <span>{u.phone}</span>
                          </div>
                        </td>

                        {/* Cột 3: Vai trò */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${roleCfg.bg}`}
                          >
                            <roleCfg.icon size={13} />
                            <span>{roleCfg.label}</span>
                          </span>
                        </td>

                        {/* Cột 4: Trạng thái */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>Hoạt Động</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <Lock size={12} className="text-red-600" />
                              <span>Đã Khóa</span>
                            </span>
                          )}
                        </td>

                        {/* Cột 5: Ngày tạo */}
                        <td className="py-4 px-4 text-center whitespace-nowrap text-[12px] text-[#7A6B6C]">
                          {fmtDate(u.createdAt)}
                        </td>

                        {/* Cột 6: Thao tác */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Khóa / Mở khóa */}
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(u)}
                                title={u.isActive ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 ${
                                  u.isActive
                                    ? 'text-[#7A6B6C] hover:text-rose-700 hover:bg-rose-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {u.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                              </button>
                            )}

                            {/* Nút Xóa */}
                            {!isSelf && u.email !== 'admin@unibridal.com' && (
                              <button
                                type="button"
                                onClick={() => setDeletingUser(u)}
                                title="Xóa tài khoản"
                                className="p-1.5 rounded-lg text-[#7A6B6C] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer border-0"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang chuẩn UniBridal */}
          <div className="p-4 border-t border-[#F0E5DC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A6B6C] bg-[#FFFBF9]">
            <div className="flex items-center gap-3">
              <span>
                {total === 0
                  ? 'Chưa có tài khoản nào'
                  : `Hiển thị ${(activePage - 1) * pageSize + 1} – ${Math.min(activePage * pageSize, total)} trong tổng số ${total} tài khoản`}
              </span>
              <div className="flex items-center gap-1.5 border-l border-[#F0E5DC] pl-3">
                <span className="text-[11.5px] text-[#8C7D7E]">Dòng/trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setActivePage(1);
                  }}
                  className="py-1 px-2 rounded-lg bg-white border border-[#EFE5E1] text-xs font-semibold text-[#2C2523] outline-none cursor-pointer focus:border-[#733F49]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={activePage === 1}
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#7A6B6C] hover:bg-[#F5ECE8] disabled:opacity-40 transition-colors cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers.map((p, idx) => {
                  if (p === '...') {
                    return (
                      <button
                        key={`ellipsis-${idx}`}
                        type="button"
                        title={idx === 0 || p < activePage ? 'Về các trang trước' : 'Đến các trang sau'}
                        onClick={() => {
                          if (idx === 0 || p < activePage) setActivePage((prev) => Math.max(1, prev - 3));
                          else setActivePage((prev) => Math.min(totalPages, prev + 3));
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#8C7D7E] text-xs font-bold hover:bg-[#F5ECE8] hover:text-[#733F49] transition-colors cursor-pointer"
                      >
                        ...
                      </button>
                    );
                  }
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setActivePage(p)}
                      className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors cursor-pointer text-xs ${
                        activePage === p
                          ? 'bg-[#733F49] text-white shadow-xs'
                          : 'bg-white border border-[#EFE5E1] shadow-2xs text-[#4A3B3D] hover:bg-[#F5ECE8]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={activePage >= totalPages}
                  onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#7A6B6C] hover:bg-[#F5ECE8] disabled:opacity-40 transition-colors cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Thêm Tài Khoản Mới ───────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-jakarta">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#F2E5E0] animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E5DC] mb-4">
              <div>
                <span className="text-[11px] font-bold text-[#8C7D7E] uppercase tracking-wider">
                  Khởi Tạo Tài Khoản
                </span>
                <h3 className="font-playfair text-[20px] font-bold text-[#5F2B36] leading-tight">
                  Thêm Tài Khoản Mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF5F2] hover:bg-[#F2E8E4] flex items-center justify-center text-[#7A696B] transition-colors cursor-pointer border-0"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Ví dụ: Lê Thị Ngọc Anh"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE2DC] text-[13px] text-[#2C2523] outline-none focus:border-[#B8737D]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                  Địa chỉ Email (Đăng nhập) *
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="ngocanh@unibridal.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE2DC] text-[13px] text-[#2C2523] outline-none focus:border-[#B8737D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="0912345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE2DC] text-[13px] text-[#2C2523] outline-none focus:border-[#B8737D]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                    Số CCCD / CMND
                  </label>
                  <input
                    type="text"
                    value={createForm.idCard}
                    onChange={(e) => setCreateForm({ ...createForm, idCard: e.target.value })}
                    placeholder="00120000xxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE2DC] text-[13px] text-[#2C2523] outline-none focus:border-[#B8737D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                  Mật khẩu khởi tạo *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE2DC] text-[13px] text-[#2C2523] outline-none focus:border-[#B8737D]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                  Vai trò hệ thống *
                </label>
                <select
                  value={createForm.roleCode}
                  onChange={(e) => setCreateForm({ ...createForm, roleCode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE2DC] text-[13px] text-[#2C2523] outline-none cursor-pointer focus:border-[#B8737D]"
                >
                  <option value="STAFF">Nhân Viên Showroom (Staff)</option>
                  <option value="CUSTOMER">Khách Hàng (Customer)</option>
                  <option value="ADMIN">Quản Trị Viên (Admin)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11.5px] flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Tài khoản do Admin lập sẽ được kích hoạt tự động, đăng nhập ngay không cần mã OTP.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D5C7C2] text-[#4A3B3D] text-xs font-bold hover:bg-[#F5ECE8] transition-colors cursor-pointer bg-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5A2D35] text-white text-xs font-bold transition-all cursor-pointer border-0 disabled:opacity-50 flex items-center gap-2"
                >
                  {createLoading && <RefreshCw size={13} className="animate-spin" />}
                  <span>Tạo Tài Khoản</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Xác Nhận Xóa Tài Khoản ──────────────────────────────────── */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-jakarta">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-[#F2E5E0] animate-scaleUp">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="font-playfair text-[20px] font-bold text-[#2C2523] leading-tight">
                  Xóa Tài Khoản
                </h3>
                <p className="text-xs text-[#8C7D7E] mt-0.5">
                  Thao tác sẽ xóa vĩnh viễn tài khoản người dùng
                </p>
              </div>
            </div>

            <div className="bg-[#FFF9F8] border border-[#FDE2DF] rounded-2xl p-4 mb-5 text-xs text-[#4A3B3D] space-y-1.5">
              <div>Họ tên: <strong>{deletingUser.fullName}</strong></div>
              <div>Email: <strong>{deletingUser.email}</strong></div>
              <div>Vai trò: <strong>{deletingUser.roleName}</strong></div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl border border-[#D5C7C2] text-[#4A3B3D] text-xs font-bold hover:bg-[#F5ECE8] transition-colors cursor-pointer bg-white"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer border-0 disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading && <RefreshCw size={13} className="animate-spin" />}
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

