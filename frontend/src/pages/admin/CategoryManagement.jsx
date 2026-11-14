import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { Plus,
  RefreshCw,
  Search,
  Edit3,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  X,
  Eye,
  Layers,
  Crown,
  LayoutGrid,
  Table as TableIcon,
  Shirt,
  Info,
  Upload } from 'lucide-react';
import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  toggleCategoryStatusApi,
  deleteCategoryApi,
} from '../../services/categoryService';


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
  const [formImage, setFormImage] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);

  // Xử lý upload ảnh từ máy tính của admin
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn đúng tệp định dạng hình ảnh (JPG, PNG, WEBP)!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setFormImage(canvas.toDataURL('image/jpeg', 0.8));
        message.success(`Đã tải ảnh "${file.name}" lên thành công!`);
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      message.error('Có lỗi xảy ra khi đọc tệp ảnh.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
    setFormImage('');
    setFormIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormName(cat.name || '');
    setFormSlug(cat.slug || '');
    setFormDesc(cat.description || '');
    setFormImage(cat.image || '');
    setFormIsActive(cat.isActive !== false);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Cập nhật tên danh mục (không tự động gõ theo vào ô slug để người dùng tự do nhập)
  const handleNameChange = (val) => {
    setFormName(val);
    if (formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  // Lưu danh mục (Tạo mới hoặc Sửa)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formName.trim()) errors.name = 'Vui lòng nhập tên danh mục';

    let finalSlug = formSlug.trim();
    if (!finalSlug && formName.trim()) {
      finalSlug = generateSlug(formName.trim());
    }
    if (!finalSlug) errors.slug = 'Vui lòng nhập đường dẫn (slug)';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        slug: finalSlug,
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
      title: 'DANH MỤC / PHOM DÁNG',
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
      {/* Stylesheet đồng bộ typography và bảng chuẩn Quản Lý Tài Khoản */}
      <style>{`
        .unibridal-admin-table .ant-table {
          background: transparent !important;
          font-family: inherit !important;
        }
        .unibridal-admin-table .ant-table-thead > tr > th {
          background-color: #FAF5F2 !important;
          border-bottom: 1px solid #F0E5DC !important;
          color: #7A696B !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 1px !important;
          text-transform: uppercase !important;
          font-family: inherit !important;
          padding: 16px 20px !important;
        }
        .unibridal-admin-table .ant-table-thead > tr > th::before {
          display: none !important;
        }
        .unibridal-admin-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #F6EDE9 !important;
          padding: 14px 20px !important;
          font-family: inherit !important;
        }
        .unibridal-admin-table .ant-table-tbody > tr:hover > td {
          background-color: #FCF9F7 !important;
        }
      `}</style>

      <div className="space-y-5">
        {/* Header và Tiêu đề trang */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-[32px] sm:text-[38px] font-normal text-[#5F2B36] tracking-tight leading-tight mb-2">
              Quản Lý Danh Mục
            </h1>
            <p className="text-[14px] text-[#7A6B6C] font-normal max-w-3xl leading-relaxed">
              Quản lý các phân loại phom dáng váy cưới độc quyền (Ballgown, Mermaid, A-Line, Silk Gown...) và kiểm soát hiển thị trên toàn hệ thống UniBridal.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={fetchCategories}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E8DDD8] bg-white text-[#5F2B36] hover:bg-[#FAF0EC] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#733F49] to-[#8C4654] hover:from-[#5A2D35] hover:to-[#733F49] text-white text-xs font-bold transition-all cursor-pointer shadow-md border-0 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Thêm Danh Mục Mới</span>
            </button>
          </div>
        </div>

        {/* 4 Thẻ KPI Thông Số */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-xs bg-radial from-indigo-50/60 to-transparent">
            <span className="text-[11px] font-bold tracking-wider text-indigo-900 uppercase">
              TỔNG SỐ PHOM DÁNG
            </span>
            <div className="text-3xl font-bold text-indigo-700 mt-1">{stats.total}</div>
            <div className="text-xs text-indigo-800/80 mt-1">Phân loại váy cưới chuẩn</div>
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

          <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs bg-radial from-amber-50/60 to-transparent">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-amber-900 uppercase">
                TẠM ẨN
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            </div>
            <div className="text-3xl font-bold text-amber-700 mt-1">{stats.inactive}</div>
            <div className="text-xs text-amber-800/80 mt-1">Không xuất hiện trên trang chủ</div>
          </div>

          <div className="bg-white rounded-2xl border border-[#F2D8D4] p-5 shadow-xs bg-radial from-[#FAF0EC] to-transparent">
            <span className="text-[11px] font-bold tracking-wider text-[#733F49] uppercase">
              LỄ PHỤC LIÊN KẾT
            </span>
            <div className="text-3xl font-bold text-[#733F49] mt-1">{stats.totalDresses}</div>
            <div className="text-xs text-[#733F49]/80 mt-1">Tổng mẫu váy trong cơ sở dữ liệu</div>
          </div>
        </div>

        {/* Thanh Tìm Kiếm và Chuyển Chế Độ Xem */}
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
            <div className="text-base font-bold text-gray-900 font-playfair pb-2 border-b border-gray-100">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Slug nhận diện đường dẫn <span className="text-red-500">*</span>
                </label>
                {formName && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormSlug(generateSlug(formName));
                      if (formErrors.slug) setFormErrors((p) => ({ ...p, slug: '' }));
                    }}
                    className="text-[11px] text-[#733F49] hover:underline font-semibold cursor-pointer"
                    title="Tự động tạo slug chuẩn từ tên danh mục"
                  >
                    Gợi ý từ tên
                  </button>
                )}
              </div>
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

            {/* Mô tả */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Mô tả đặc trưng phom dáng
              </label>
              <textarea
                rows={2}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Mô tả phom dáng, phong cách thiết kế, chất liệu voan Tulle, lụa Mikado, ren 3D..."
                className="w-full px-3.5 py-2.5 rounded-xl border bg-gray-50 text-xs text-gray-900 outline-none focus:bg-white focus:border-[#733F49] transition resize-none border-gray-200"
              />
            </div>

            {/* Trạng thái hoạt động */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-800 text-xs">Kích hoạt hiển thị</div>
                <div className="text-[11px] text-gray-500">Cho phép cô dâu lọc theo danh mục này trên website</div>
              </div>
              <Switch
                checked={formIsActive}
                onChange={setFormIsActive}
                className={formIsActive ? 'bg-[#733F49]' : 'bg-gray-300'}
              />
            </div>

            {/* Hình ảnh đại diện */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Hình ảnh đại diện phom dáng</span>
                {formImage && (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Đã có ảnh
                  </span>
                )}
              </label>

              {/* Input file ẩn tải ảnh từ máy */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {formImage ? (
                <div className="relative group rounded-2xl overflow-hidden border-2 border-[#EFE2DC] bg-[#FAF5F2] p-2.5 flex items-center gap-4">
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-[#EFE2DC] shrink-0 bg-white shadow-xs">
                    <img
                      src={formImage}
                      alt="Ảnh đại diện"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/assets/dresses/dress_01.jpg'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="text-xs font-bold text-gray-800 truncate mb-1">
                      Ảnh đại diện phom dáng
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-2.5">
                      Ảnh đã được tải lên từ máy tính của bạn và sẽ hiển thị trên trang chủ và bộ sưu tập.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-[#733F49] text-[#733F49] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Upload size={13} />
                        <span>Tải ảnh khác</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImage('')}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-[#733F49] bg-gray-50 hover:bg-[#FAF5F2] rounded-2xl p-6 text-center cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-[#733F49] flex items-center justify-center mx-auto mb-2.5 shadow-2xs group-hover:scale-105 transition">
                    <Upload size={20} />
                  </div>
                  <div className="text-xs font-bold text-gray-800">
                    Bấm để tải ảnh lên từ máy tính
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 5MB)
                  </p>
                </div>
              )}
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

