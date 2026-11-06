import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  Table,
  Modal,
  Tag,
  Switch,
  message,
  Popconfirm,
  Tooltip,
  Empty,
  Spin,
} from 'antd';
import {
  FolderTree,
  Plus,
  Search,
  Edit3,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Shirt,
  Info,
} from 'lucide-react';
import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  toggleCategoryStatusApi,
  deleteCategoryApi,
} from '../../services/categoryService';

// Thư viện ảnh mẫu có sẵn tại showroom để admin dễ dàng chọn nhanh
const PRESET_IMAGES = [
  { label: 'Ballgown Công Chúa', url: '/assets/dresses/dress_01.jpg' },
  { label: 'Mermaid Đuôi Cá', url: '/assets/dresses/dress_02.jpg' },
  { label: 'A-Line Chữ A', url: '/assets/dresses/dress_03.jpg' },
  { label: 'Silk Gown Lụa Tối Giản', url: '/assets/dresses/dress_04.jpg' },
  { label: 'Princess Hoàng Gia', url: '/assets/dresses/dress_05.jpg' },
  { label: 'Traditional Áo Dài', url: '/assets/dresses/dress_06.jpg' },
];

// Helper tự động tạo slug từ tên tiếng Việt
function generateSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('/assets/dresses/dress_01.jpg');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  // Tải danh sách danh mục
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategoriesApi({ includeInactive: true });
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
      message.error('Không thể tải danh sách danh mục từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reset form khi mở Modal
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    setFormImage('/assets/dresses/dress_01.jpg');
    setFormIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormName(cat.name || '');
    setFormSlug(cat.slug || '');
    setFormDesc(cat.description || '');
    setFormImage(cat.image || '/assets/dresses/dress_01.jpg');
    setFormIsActive(cat.isActive !== false);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Tự động gợi ý slug khi người dùng gõ tên danh mục (chỉ khi tạo mới hoặc chưa sửa slug thủ công)
  const handleNameChange = (val) => {
    setFormName(val);
    if (!editingCategory) {
      setFormSlug(generateSlug(val));
    }
    if (formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  // Lưu danh mục (Tạo mới hoặc Sửa)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formName.trim()) errors.name = 'Vui lòng nhập tên danh mục';
    if (!formSlug.trim()) errors.slug = 'Vui lòng nhập đường dẫn (slug)';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim(),
        description: formDesc.trim(),
        image: formImage.trim() || '/assets/dresses/dress_01.jpg',
        isActive: formIsActive,
      };

      if (editingCategory) {
        const id = editingCategory._id || editingCategory.id;
        await updateCategoryApi(id, payload);
        message.success(`Đã cập nhật danh mục "${payload.name}" thành công!`);
      } else {
        await createCategoryApi(payload);
        message.success(`Đã tạo mới danh mục "${payload.name}" thành công!`);
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      message.error(err.message || 'Thao tác thất bại. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  // Bật / Tắt trạng thái kích hoạt danh mục
  const handleToggleStatus = async (cat) => {
    const id = cat._id || cat.id;
    try {
      await toggleCategoryStatusApi(id);
      const nextStatus = !cat.isActive;
      message.success(
        `Đã ${nextStatus ? 'kích hoạt' : 'tạm ẩn'} danh mục "${cat.name}".`
      );
      setCategories((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id ? { ...item, isActive: nextStatus } : item
        )
      );
    } catch (err) {
      message.error('Không thể cập nhật trạng thái danh mục.');
    }
  };

  // Xóa danh mục
  const handleDeleteCategory = async (cat) => {
    const id = cat._id || cat.id;
    if (cat.dressCount > 0) {
      message.warning(
        `Không thể xóa: Danh mục đang có ${cat.dressCount} mẫu váy cưới liên kết!`
      );
      return;
    }
    try {
      await deleteCategoryApi(id);
      message.success(`Đã xóa danh mục "${cat.name}" khỏi hệ thống.`);
      fetchCategories();
    } catch (err) {
      message.error(err.message || 'Xóa danh mục thất bại.');
    }
  };

  // Danh sách đã lọc theo tìm kiếm và trạng thái
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const name = (cat.name || '').toLowerCase();
      const slug = (cat.slug || '').toLowerCase();
      const desc = (cat.description || '').toLowerCase();
      const search = searchTerm.trim().toLowerCase();

      const matchSearch =
        !search ||
        name.includes(search) ||
        slug.includes(search) ||
        desc.includes(search);

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && cat.isActive) ||
        (statusFilter === 'inactive' && !cat.isActive);

      return matchSearch && matchStatus;
    });
  }, [categories, searchTerm, statusFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.isActive).length;
    const inactive = total - active;
    const totalDresses = categories.reduce(
      (sum, c) => sum + (Number(c.dressCount) || 0),
      0
    );

    return { total, active, inactive, totalDresses };
  }, [categories]);

  // Cấu hình bảng Ant Design
  const columns = [
    {
      title: 'DANH MỤC & PHOM DÁNG',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (name, record) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-12 h-14 rounded-xl overflow-hidden shrink-0 border border-gray-200 bg-gray-50 shadow-2xs">
            <img
              src={record.image || '/assets/dresses/dress_01.jpg'}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/assets/dresses/dress_01.jpg';
              }}
            />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm hover:text-[#733F49] transition cursor-pointer" onClick={() => openEditModal(record)}>
              {name}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                slug: {record.slug}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'MÔ TẢ ĐẶC TRƯNG HAUTE COUTURE',
      dataIndex: 'description',
      key: 'description',
      render: (desc) => (
        <p className="text-xs text-gray-600 line-clamp-2 max-w-md m-0 leading-relaxed">
          {desc || <span className="text-gray-400 italic">Chưa có mô tả chi tiết.</span>}
        </p>
      ),
    },
    {
      title: 'SỐ MẪU VÁY LIÊN KẾT',
      dataIndex: 'dressCount',
      key: 'dressCount',
      width: 170,
      align: 'center',
      render: (count) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF0EC] text-[#733F49] border border-[#F2D8D4]">
          <Shirt size={13} />
          <span>{count || 0} tác phẩm</span>
        </span>
      ),
    },
    {
      title: 'TRẠNG THÁI HIỂN THỊ',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 170,
      align: 'center',
      render: (isActive, record) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={Boolean(isActive)}
            onChange={() => handleToggleStatus(record)}
            size="small"
            className={isActive ? 'bg-[#733F49]' : 'bg-gray-300'}
          />
          <Tag
            color={isActive ? 'green' : 'default'}
            className="uppercase font-bold text-[10px] m-0"
          >
            {isActive ? 'Hoạt động' : 'Tạm ẩn'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'THAO TÁC',
      key: 'actions',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1.5">
          <Tooltip title="Chỉnh sửa danh mục">
            <button
              type="button"
              onClick={() => openEditModal(record)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-[#FAF0EC] hover:text-[#733F49] text-gray-600 transition cursor-pointer"
            >
              <Edit3 size={14} />
            </button>
          </Tooltip>

          <Popconfirm
            title="Xóa danh mục này?"
            description={
              record.dressCount > 0
                ? `Danh mục đang chứa ${record.dressCount} váy cưới. Bạn không thể xóa khi còn sản phẩm liên kết.`
                : 'Bạn có chắc chắn muốn xóa danh mục này vĩnh viễn không?'
            }
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, disabled: record.dressCount > 0 }}
            onConfirm={() => handleDeleteCategory(record)}
          >
            <Tooltip title={record.dressCount > 0 ? 'Có váy cưới đang liên kết' : 'Xóa danh mục'}>
              <button
                type="button"
                disabled={record.dressCount > 0}
                className="p-2 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout activeMenu="categories">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header & Tiêu đề trang */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EFE5E1] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0EC] text-[#733F49] text-[11px] font-bold tracking-wider uppercase border border-[#F2D8D4]">
                Phân Loại Sản Phẩm
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 font-medium">Atelier Haute Couture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-playfair flex items-center gap-2.5 mt-1">
              <FolderTree className="w-7 h-7 text-[#733F49]" />
              Quản Lý Danh Mục & Phom Dáng
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý các phân loại phom dáng váy cưới độc quyền (Ballgown, Mermaid, A-Line, Silk Gown...) và kiểm soát hiển thị trên toàn hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchCategories}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5a3239] text-white text-xs font-bold transition shadow-md shadow-[#733F49]/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Danh Mục Mới</span>
            </button>
          </div>
        </div>

        {/* 4 Thẻ KPI Thông Số */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#EFE5E1] p-5 shadow-xs">
            <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              TỔNG SỐ PHOM DÁNG
            </span>
            <div className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">Phân loại váy cưới chuẩn</div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs bg-radial from-emerald-50/60 to-transparent">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
                ĐANG HIỂN THỊ
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-3xl font-bold text-emerald-700 mt-1">{stats.active}</div>
            <div className="text-xs text-emerald-800 mt-1">Hiển thị trong bộ lọc khách hàng</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs bg-gray-50/40">
            <span className="text-[11px] font-bold tracking-wider text-gray-500 uppercase">
              TẠM ẨN
            </span>
            <div className="text-3xl font-bold text-gray-600 mt-1">{stats.inactive}</div>
            <div className="text-xs text-gray-500 mt-1">Không xuất hiện trên trang chủ</div>
          </div>

          <div className="bg-white rounded-2xl border border-[#F2D8D4] p-5 shadow-xs bg-radial from-[#FAF0EC] to-transparent">
            <span className="text-[11px] font-bold tracking-wider text-[#733F49] uppercase">
              LỄ PHỤC LIÊN KẾT
            </span>
            <div className="text-3xl font-bold text-[#733F49] mt-1">{stats.totalDresses}</div>
            <div className="text-xs text-[#733F49]/80 mt-1">Tổng mẫu váy trong cơ sở dữ liệu</div>
          </div>
        </div>

        {/* Thanh Tìm Kiếm & Chuyển Chế Độ Xem */}
        <div className="bg-white rounded-2xl border border-[#EFE5E1] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên danh mục, slug, mô tả..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 outline-none focus:border-[#733F49] focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Lọc trạng thái */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-medium outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động (Active)</option>
              <option value="inactive">Tạm ẩn (Inactive)</option>
            </select>

            {/* Chuyển đổi View Table / Grid */}
            <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Dạng Bảng"
              >
                <TableIcon size={14} />
                <span className="hidden sm:inline">Bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Dạng Thẻ Ảnh"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Thẻ ảnh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Nội dung danh sách: Dạng Bảng hoặc Dạng Thẻ */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#EFE5E1] p-16 flex items-center justify-center">
            <Spin tip="Đang tải danh mục lễ phục cưới..." />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EFE5E1] p-16 text-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không tìm thấy danh mục phom dáng nào phù hợp với bộ lọc."
            />
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-[#EFE5E1] shadow-xs overflow-hidden">
            <Table
              dataSource={filteredCategories}
              columns={columns}
              rowKey={(r) => r._id || r.id || r.slug}
              pagination={{ pageSize: 10, showTotal: (total) => `Tổng cộng ${total} danh mục` }}
              className="unibridal-admin-table"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((cat) => {
              const id = cat._id || cat.id;
              return (
                <div
                  key={id}
                  className="bg-white rounded-2xl border border-[#EFE5E1] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={cat.image || '/assets/dresses/dress_01.jpg'}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = '/assets/dresses/dress_01.jpg';
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-black/60 text-white backdrop-blur-md">
                        {cat.slug}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Tag
                        color={cat.isActive ? 'green' : 'default'}
                        className="font-bold text-[10px] m-0 backdrop-blur-md shadow-xs uppercase"
                      >
                        {cat.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                      </Tag>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#733F49] transition m-0">
                          {cat.name}
                        </h3>
                        <span className="text-xs font-semibold text-[#733F49] bg-[#FAF0EC] px-2 py-0.5 rounded-full border border-[#F2D8D4] shrink-0">
                          {cat.dressCount || 0} váy
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                        {cat.description || 'Chưa có mô tả đặc trưng cho phom dáng này.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cat.isActive}
                          onChange={() => handleToggleStatus(cat)}
                          size="small"
                          className={cat.isActive ? 'bg-[#733F49]' : 'bg-gray-300'}
                        />
                        <span className="text-[11px] text-gray-500 font-medium">
                          {cat.isActive ? 'Bật' : 'Tắt'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-[#FAF0EC] hover:text-[#733F49] text-xs font-bold text-gray-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 size={13} />
                          <span>Sửa</span>
                        </button>
                        <Popconfirm
                          title="Xóa danh mục này?"
                          description={
                            cat.dressCount > 0
                              ? `Danh mục đang chứa ${cat.dressCount} váy cưới.`
                              : 'Bạn có chắc chắn muốn xóa không?'
                          }
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true, disabled: cat.dressCount > 0 }}
                          onConfirm={() => handleDeleteCategory(cat)}
                        >
                          <button
                            type="button"
                            disabled={cat.dressCount > 0}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Xóa danh mục"
                          >
                            <Trash2 size={14} />
                          </button>
                        </Popconfirm>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL THÊM / CHỈNH SỬA DANH MỤC */}
        {/* ========================================================= */}
        <Modal
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          destroyOnClose
          title={
            <div className="flex items-center gap-2 text-base font-bold text-gray-900 font-playfair pb-2 border-b border-gray-100">
              <FolderTree className="w-5 h-5 text-[#733F49]" />
              <span>{editingCategory ? 'Chỉnh Sửa Phom Dáng / Danh Mục' : 'Thêm Danh Mục Phom Dáng Mới'}</span>
            </div>
          }
        >
          <form onSubmit={handleSaveCategory} className="space-y-4 py-2 text-xs sm:text-sm">
            {/* Tên danh mục */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tên danh mục phom dáng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Công Chúa Bồng Xòe (Ballgown)"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-gray-50 text-xs text-gray-900 outline-none focus:bg-white focus:border-[#733F49] transition ${
                  formErrors.name ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                }`}
              />
              {formErrors.name && (
                <div className="text-[11px] text-red-500 mt-1">{formErrors.name}</div>
              )}
            </div>

            {/* Slug URL */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Slug nhận diện đường dẫn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => {
                  setFormSlug(e.target.value);
                  if (formErrors.slug) setFormErrors((p) => ({ ...p, slug: '' }));
                }}
                placeholder="Ví dụ: ballgown"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-gray-50 text-xs text-gray-900 font-mono outline-none focus:bg-white focus:border-[#733F49] transition ${
                  formErrors.slug ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                }`}
              />
              {formErrors.slug && (
                <div className="text-[11px] text-red-500 mt-1">{formErrors.slug}</div>
              )}
              <p className="text-[11px] text-gray-400 mt-1">
                Dùng trong bộ lọc URL và liên kết danh mục váy cưới (chữ thường, không dấu, nối bằng dấu gạch ngang).
              </p>
            </div>

            {/* Hình ảnh đại diện */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Hình ảnh đại diện phom dáng
              </label>
              <input
                type="text"
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                placeholder="Nhập đường dẫn ảnh hoặc chọn ảnh mẫu bên dưới"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900 outline-none focus:bg-white focus:border-[#733F49] transition"
              />

              {/* Preset ảnh mẫu chọn nhanh */}
              <div className="mt-2">
                <span className="text-[11px] text-gray-500 font-medium">Chọn nhanh ảnh mẫu Haute Couture:</span>
                <div className="grid grid-cols-6 gap-2 mt-1.5">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormImage(preset.url)}
                      className={`h-14 rounded-lg overflow-hidden border-2 transition relative group cursor-pointer ${
                        formImage === preset.url ? 'border-[#733F49] ring-2 ring-[#733F49]/20' : 'border-transparent hover:border-gray-300'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mô tả đặc trưng */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Mô tả đặc trưng & chất liệu
              </label>
              <textarea
                rows={3}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Mô tả phom dáng, phong cách thiết kế, chất liệu voan Tulle, lụa Mikado, ren 3D..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-900 outline-none focus:bg-white focus:border-[#733F49] transition"
              />
            </div>

            {/* Trạng thái hoạt động */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-xs">Kích hoạt hiển thị</div>
                <div className="text-[11px] text-gray-500">Cho phép cô dâu lọc theo danh mục này trên website</div>
              </div>
              <Switch
                checked={formIsActive}
                onChange={setFormIsActive}
                className={formIsActive ? 'bg-[#733F49]' : 'bg-gray-300'}
              />
            </div>

            {/* Nút hành động */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5a3239] text-white text-xs font-bold transition shadow-md shadow-[#733F49]/20 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : editingCategory ? 'Lưu Thay Đổi' : 'Tạo Danh Mục Mới'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

