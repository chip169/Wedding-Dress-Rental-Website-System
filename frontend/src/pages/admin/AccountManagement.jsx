import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { message, Modal } from 'antd';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
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
} from 'lucide-react';
import {
  getAllUsers,
  getUserRoles,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
} from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_SIZE = 10;

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
    icon: Sparkles,
  },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

export default function AccountManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [activePage, setActivePage] = useState(1);

  // Thống kê toàn hệ thống
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    staff: 0,
    customer: 0,
    active: 0,
    blocked: 0,
  });

  // Bộ lọc & tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
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

  // Form states cho Edit User
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    roleCode: 'CUSTOMER',
    idCard: '',
    isActive: true,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Form states cho Reset Password
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Load dữ liệu tài khoản từ API ──────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: activePage,
        limit: PAGE_SIZE,
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
      if (usersRes.stats) {
        setStats(usersRes.stats);
      }
      setRoles(rolesRes || []);
      setError('');
    } catch (err) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      setError('Không thể kết nối đến máy chủ để tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  }, [activePage, roleFilter, statusFilter, searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Xử lý tạo mới tài khoản ────────────────────────────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.phone.trim() || !createForm.password) {
      message.error('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
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

  // ── Xử lý cập nhật thông tin tài khoản ────────────────────────────────────
  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      fullName: u.fullName || '',
      phone: u.phone || '',
      roleCode: u.roleCode || 'CUSTOMER',
      idCard: u.idCard || '',
      isActive: u.isActive !== false,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditLoading(true);
    try {
      await updateUser(editingUser._id, editForm);
      message.success(`Cập nhật thông tin tài khoản "${editForm.fullName}" thành công!`);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      message.error(err.message || 'Không thể cập nhật tài khoản.');
    } finally {
      setEditLoading(false);
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

  // ── Xử lý Đặt lại mật khẩu ────────────────────────────────────────────────
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordUser || !newPassword) return;
    if (newPassword.length < 6) {
      message.error('Mật khẩu mới phải từ 6 ký tự trở lên.');
      return;
    }

    setPasswordLoading(true);
    try {
      await resetUserPassword(passwordUser._id, newPassword);
      message.success(`Đã đặt lại mật khẩu mới cho tài khoản "${passwordUser.fullName}"!`);
      setPasswordUser(null);
      setNewPassword('');
    } catch (err) {
      message.error(err.message || 'Lỗi khi đặt lại mật khẩu.');
    } finally {
      setPasswordLoading(false);
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminLayout activeMenu="accounts">
      <div className="font-jakarta text-[#2C2523] pb-12">
        {/* Header & Page Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#B8737D] mb-3" />
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

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {/* Card 1: Tổng tài khoản */}
          <div
            onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
            className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FDE8EC_0%,_transparent_70%)] rounded-2xl border border-[#FAD2DA] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-[1.2px] text-[#733F49] uppercase">
                  TỔNG TÀI KHOẢN
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#733F49]">
                  <Users size={18} />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-[32px] font-bold text-[#2C2523] leading-none">
                  {stats.total}
                </span>
                <span className="text-[12px] font-medium text-[#8C7D7E] ml-2">thành viên</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11.5px] text-[#733F49] font-medium">
              <span>{stats.active} đang hoạt động • {stats.blocked} bị khóa</span>
            </div>
          </div>

          {/* Card 2: Quản trị viên */}
          <div
            onClick={() => { setRoleFilter('ADMIN'); setActivePage(1); }}
            className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#F3E8FF_0%,_transparent_70%)] rounded-2xl border border-[#E9D5FF] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-[1.2px] text-purple-800 uppercase">
                  QUẢN TRỊ VIÊN
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-[32px] font-bold text-purple-950 leading-none">
                  {stats.admin}
                </span>
                <span className="text-[12px] font-medium text-purple-600 ml-2">tài khoản</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11.5px] text-purple-700 font-medium">
              <span>Toàn quyền cấu hình &amp; tài chính</span>
            </div>
          </div>

          {/* Card 3: Nhân viên Showroom */}
          <div
            onClick={() => { setRoleFilter('STAFF'); setActivePage(1); }}
            className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#EFF6FF_0%,_transparent_70%)] rounded-2xl border border-[#BFDBFE] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-[1.2px] text-[#1D4ED8] uppercase">
                  NHÂN VIÊN SHOWROOM
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8]">
                  <UserCheck size={18} />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-[32px] font-bold text-[#1E3A8A] leading-none">
                  {stats.staff}
                </span>
                <span className="text-[12px] font-medium text-[#60A5FA] ml-2">chuyên viên</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11.5px] text-[#1D4ED8] font-medium">
              <span>Bàn giao, kiểm định &amp; thử váy</span>
            </div>
          </div>

          {/* Card 4: Khách hàng */}
          <div
            onClick={() => { setRoleFilter('CUSTOMER'); setActivePage(1); }}
            className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FEF3C7_0%,_transparent_70%)] rounded-2xl border border-[#FDE68A] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-[1.2px] text-[#92400E] uppercase">
                  CÔ DÂU &amp; KHÁCH HÀNG
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#FEF2E6] flex items-center justify-center text-[#D97706]">
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="text-[32px] font-bold text-[#78350F] leading-none">
                  {stats.customer}
                </span>
                <span className="text-[12px] font-medium text-[#D97706] ml-2">khách hàng</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11.5px] text-[#B45309] font-medium">
              <span>Hợp đồng điện tử &amp; cọc bảo lãnh</span>
            </div>
          </div>
        </div>

        {/* Thanh Tìm Kiếm & Bộ Lọc */}
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
                        {/* Cột 1: Họ tên & Avatar */}
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

                        {/* Cột 2: Email & SĐT */}
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
                            {/* Nút sửa */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              title="Chỉnh sửa thông tin & vai trò"
                              className="p-1.5 rounded-lg text-[#7A6B6C] hover:text-[#733F49] hover:bg-[#FAF0EC] transition-colors cursor-pointer border-0"
                            >
                              <Edit2 size={15} />
                            </button>

                            {/* Nút đổi mật khẩu */}
                            <button
                              type="button"
                              onClick={() => setPasswordUser(u)}
                              title="Đặt lại mật khẩu"
                              className="p-1.5 rounded-lg text-[#7A6B6C] hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer border-0"
                            >
                              <KeyRound size={15} />
                            </button>

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

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#F0E5DC] flex items-center justify-between text-xs text-[#7A6B6C]">
              <span>Hiển thị trang {activePage} trên tổng số {totalPages} trang ({total} tài khoản)</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={activePage <= 1}
                  onClick={() => setActivePage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#EFE2DC] bg-[#FAF5F2] hover:bg-[#F2E8E4] disabled:opacity-50 cursor-pointer"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActivePage(p)}
                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                      activePage === p
                        ? 'bg-[#733F49] text-white'
                        : 'border border-[#EFE2DC] bg-white text-[#554748] hover:bg-[#FAF5F2]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={activePage >= totalPages}
                  onClick={() => setActivePage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#EFE2DC] bg-[#FAF5F2] hover:bg-[#F2E8E4] disabled:opacity-50 cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
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

      {/* ── Modal Chỉnh Sửa Tài Khoản ─────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-jakarta">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#F2E5E0] animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E5DC] mb-4">
              <div>
                <span className="text-[11px] font-bold text-[#8C7D7E] uppercase tracking-wider">
                  Chỉnh Sửa Thông Tin
                </span>
                <h3 className="font-playfair text-[20px] font-bold text-[#5F2B36] leading-tight">
                  Tài Khoản: {editingUser.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-[#FAF5F2] hover:bg-[#F2E8E4] flex items-center justify-center text-[#7A696B] transition-colors cursor-pointer border-0"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                  Email (Cố định)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
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
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE2DC] text-[13px] text-[#2C2523] outline-none focus:border-[#B8737D]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                    Số CCCD
                  </label>
                  <input
                    type="text"
                    value={editForm.idCard}
                    onChange={(e) => setEditForm({ ...editForm, idCard: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE2DC] text-[13px] text-[#2C2523] outline-none focus:border-[#B8737D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                  Vai trò hệ thống *
                </label>
                <select
                  value={editForm.roleCode}
                  onChange={(e) => setEditForm({ ...editForm, roleCode: e.target.value })}
                  disabled={editingUser.email === 'admin@unibridal.com'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE2DC] text-[13px] text-[#2C2523] outline-none cursor-pointer focus:border-[#B8737D] disabled:opacity-50"
                >
                  <option value="ADMIN">Quản Trị Viên (Admin)</option>
                  <option value="STAFF">Nhân Viên Showroom (Staff)</option>
                  <option value="CUSTOMER">Khách Hàng (Customer)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                  Trạng thái tài khoản
                </label>
                <select
                  value={editForm.isActive ? 'active' : 'blocked'}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                  disabled={String(editingUser._id) === String(currentUser?._id)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE2DC] text-[13px] text-[#2C2523] outline-none cursor-pointer focus:border-[#B8737D] disabled:opacity-50"
                >
                  <option value="active">Đang Hoạt Động (Active)</option>
                  <option value="blocked">Tạm Khóa (Blocked)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#D5C7C2] text-[#4A3B3D] text-xs font-bold hover:bg-[#F5ECE8] transition-colors cursor-pointer bg-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5A2D35] text-white text-xs font-bold transition-all cursor-pointer border-0 disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading && <RefreshCw size={13} className="animate-spin" />}
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Đặt Lại Mật Khẩu ────────────────────────────────────────── */}
      {passwordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-jakarta">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-[#F2E5E0] animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E5DC] mb-4">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Bảo Mật Tài Khoản
                </span>
                <h3 className="font-playfair text-[20px] font-bold text-[#5F2B36] leading-tight">
                  Đặt Lại Mật Khẩu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordUser(null)}
                className="w-8 h-8 rounded-full bg-[#FAF5F2] hover:bg-[#F2E8E4] flex items-center justify-center text-[#7A696B] transition-colors cursor-pointer border-0"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#7A6B6C] mb-3">
              Cài đặt mật khẩu mới cho tài khoản: <strong>{passwordUser.fullName}</strong> ({passwordUser.email})
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11.5px] font-bold text-[#554748] mb-1">
                  Mật khẩu mới *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập ít nhất 6 ký tự"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE2DC] text-[13px] text-[#2C2523] outline-none focus:border-[#B8737D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordUser(null)}
                  className="px-4 py-2 rounded-xl border border-[#D5C7C2] text-[#4A3B3D] text-xs font-bold hover:bg-[#F5ECE8] transition-colors cursor-pointer bg-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all cursor-pointer border-0 disabled:opacity-50 flex items-center gap-2"
                >
                  {passwordLoading && <RefreshCw size={13} className="animate-spin" />}
                  <span>Xác Nhận Mật Khẩu</span>
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

