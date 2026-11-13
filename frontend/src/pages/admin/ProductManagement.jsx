import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Search,
  ChevronDown,
  PlusCircle,
  Gem,
  Store,
  Crown,
  ClipboardList,
  AlertTriangle,
  Eye,
  SlidersHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Tag,
  Package,
  Layers,
  UploadCloud,
  FileEdit,
  Trash2,
  ExternalLink } from 'lucide-react';

// Images
import card1Elysian from '../../assets/card1_elysian.jpg';
import card2Celeste from '../../assets/card2_celeste.jpg';
import card3Lumiere from '../../assets/card3_lumiere.jpg';
import card4Monet from '../../assets/card4_monet.jpg';
import card5Aurora from '../../assets/card5_aurora.jpg';
import card6Seraphina from '../../assets/card6_seraphina.jpg';
import card7Vivienne from '../../assets/card7_vivienne.jpg';
import card8LaceDream from '../../assets/card8_lace_dream.jpg';

// Initial products matching the design exactly
const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Elysian Rose Ballgown',
    code: '#UB-GOWN-001',
    collection: 'Bộ sưu tập Lễ Phục Hoàng Gia',
    silhouette: 'Ballgown Xòe Bồng',
    material: 'Tulle Ý VÀ Ren Chantilly Pháp',
    price: 48000000,
    deposit: 15000000,
    stockText: '5 chiếc',
    sizes: [
      { label: '2 Size S' },
      { label: '2 Size M' },
      { label: '1 Size L' }
    ],
    status: 'Hiển thị', // 'Hiển thị' | 'Ẩn'
    isBespoke: false,
    image: card1Elysian,
    categoryType: 'in_stock'
  },
  {
    id: 2,
    name: 'Celeste Royal Mermaid',
    code: '#UB-GOWN-002',
    collection: 'Bộ sưu tập Tôn Dáng Hoàng Gia',
    silhouette: 'Mermaid Đuôi Cá',
    material: 'Ren Alençon và Hạt Pha Lê',
    price: 62000000,
    deposit: 20000000,
    stockText: '2 chiếc',
    sizes: [
      { label: '1 Size S' },
      { label: '1 Size M' }
    ],
    status: 'Hiển thị',
    isBespoke: false,
    image: card2Celeste,
    categoryType: 'in_stock'
  },
  {
    id: 3,
    name: 'Lumière Minimal Silk',
    code: '#UB-GOWN-003',
    collection: 'Bộ sưu tập Tối Giản Vượt Thời Gian',
    silhouette: 'Minimal Mikado Silk',
    material: 'Lụa Mikado Nhật Bản',
    price: 35000000,
    deposit: 10000000,
    stockText: '4 chiếc',
    sizes: [
      { label: '1 Size XS' },
      { label: '2 Size S' },
      { label: '1 Size M' }
    ],
    status: 'Hiển thị',
    isBespoke: false,
    image: card3Lumiere,
    categoryType: 'in_stock'
  },
  {
    id: 4,
    name: 'Monet 3D Floral Couture',
    code: '#UB-GOWN-004',
    collection: 'Nghệ thuật thêu đính thủ công',
    silhouette: 'A-Line Thanh Nhã',
    material: 'Voan Tơ Tằm Organza 3D',
    price: 78000000,
    deposit: 25000000,
    stockText: '1 chiếc độc bản',
    sizes: [
      { label: 'Size S' }
    ],
    status: 'Ẩn',
    isBespoke: true,
    image: card4Monet,
    categoryType: 'bespoke'
  },
  {
    id: 5,
    name: 'Aurora Pearl Sheath',
    code: '#UB-GOWN-005',
    collection: 'Sang trọng và Quyến rũ hiện đại',
    silhouette: 'Sheath Ôm Dáng',
    material: 'Crepe Lụa Dệt Tay và Ngọc Trai',
    price: 42000000,
    deposit: 12000000,
    stockText: '3 chiếc',
    sizes: [
      { label: '2 Size M' },
      { label: '1 Size L' }
    ],
    status: 'Ẩn',
    isBespoke: false,
    image: card5Aurora,
    categoryType: 'low_stock'
  },
  {
    id: 6,
    name: 'Seraphina Crystal Princess',
    code: '#UB-GOWN-006',
    collection: 'Kiệt tác Lễ Phục Thượng Hạng',
    silhouette: 'Ballgown Xòe Bồng',
    material: 'Pha Lê Swarovski và Tulle Pháp',
    price: 89000000,
    deposit: 30000000,
    stockText: 'Tạm hết hàng',
    sizes: [],
    status: 'Ẩn',
    isBespoke: false,
    image: card6Seraphina,
    categoryType: 'out_of_stock'
  }
];

export default function ProductManagement() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, in_stock, bespoke, out_of_stock, visible, hidden
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    collection: 'Bộ sưu tập Lễ Phục Hoàng Gia',
    silhouette: 'Ballgown Xòe Bồng',
    material: '',
    price: '',
    deposit: '',
    sizeS: 1,
    sizeM: 1,
    sizeL: 0,
    status: 'Hiển thị',
    image: card1Elysian
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchQuery =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.collection.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.silhouette.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQuery) return false;

      if (statusFilter === 'visible') return item.status === 'Hiển thị';
      if (statusFilter === 'hidden') return item.status === 'Ẩn';
      if (statusFilter === 'in_stock') return item.stockText !== 'Tạm hết hàng';
      if (statusFilter === 'bespoke') return item.isBespoke;
      if (statusFilter === 'out_of_stock') return item.stockText === 'Tạm hết hàng';

      return true;
    });
  }, [products, searchQuery, statusFilter]);

  // Toggle Status
  const handleToggleStatus = (id) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'Hiển thị' ? 'Ẩn' : 'Hiển thị';
          showToast(`Đã chuyển trạng thái váy ${item.code} sang "${nextStatus}"`);
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
    setActiveMenuId(null);
  };

  // Delete product
  const handleDeleteProduct = (id) => {
    const itemToDelete = products.find((p) => p.id === id);
    if (itemToDelete?.status === 'renting') {
      showToast(`Không thể xóa mẫu váy "${itemToDelete?.name}" vì đang có đơn thuê!`);
      setActiveMenuId(null);
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa mẫu váy "${itemToDelete?.name}"?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast(`Đã xóa thành công mẫu váy ${itemToDelete?.code}`);
    }
    setActiveMenuId(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      collection: product.collection,
      silhouette: product.silhouette,
      material: product.material,
      price: product.price,
      deposit: product.deposit,
      sizeS: 1,
      sizeM: 1,
      sizeL: 1,
      status: product.status,
      image: product.image
    });
    setIsAddModalOpen(true);
    setActiveMenuId(null);
  };

  // Submit Add / Edit
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.price) {
      alert('Vui lòng nhập đầy đủ Tên thiết kế, Mã váy và Giá bán!');
      return;
    }

    if (editingProduct) {
      // Update
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formData.name,
                code: formData.code,
                collection: formData.collection,
                silhouette: formData.silhouette,
                material: formData.material,
                price: Number(formData.price),
                deposit: Number(formData.deposit) || Math.round(Number(formData.price) * 0.3),
                status: formData.status,
                image: formData.image
              }
            : p
        )
      );
      showToast(`Đã cập nhật thông tin thiết kế ${formData.code}`);
    } else {
      // Add new
      const newId = Date.now();
      const totalUnits = Number(formData.sizeS) + Number(formData.sizeM) + Number(formData.sizeL);
      const newSizes = [];
      if (formData.sizeS > 0) newSizes.push({ label: `${formData.sizeS} Size S` });
      if (formData.sizeM > 0) newSizes.push({ label: `${formData.sizeM} Size M` });
      if (formData.sizeL > 0) newSizes.push({ label: `${formData.sizeL} Size L` });

      const newProduct = {
        id: newId,
        name: formData.name,
        code: formData.code.startsWith('#') ? formData.code : `#${formData.code}`,
        collection: formData.collection,
        silhouette: formData.silhouette,
        material: formData.material || 'Tulle và Ren Pháp cao cấp',
        price: Number(formData.price),
        deposit: Number(formData.deposit) || Math.round(Number(formData.price) * 0.3),
        stockText: totalUnits > 0 ? `${totalUnits} chiếc` : 'Tạm hết hàng',
        sizes: newSizes,
        status: formData.status,
        isBespoke: false,
        image: formData.image,
        categoryType: 'in_stock'
      };

      setProducts((prev) => [newProduct, ...prev]);
      showToast(`Đã thêm thành công mẫu váy mới ${newProduct.code}!`);
    }

    setIsAddModalOpen(false);
    setEditingProduct(null);
  };

  // Format currency
  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num) + '₫';
  };

  return (
    <AdminLayout activeMenu="products">
      <div className="font-jakarta pb-12">
        {/* ===================== 1. TOP HEADER VÀ TITLE ===================== */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-[32px] sm:text-[38px] font-normal text-[#5F2B36] tracking-tight leading-tight mb-2">
              Quản Lý Sản Phẩm
            </h1>
            <p className="text-[14px] text-[#7A6B6C] font-normal max-w-3xl leading-relaxed">
              Danh mục thiết kế váy cưới Haute Couture và Lễ phục cao cấp, quản lý bảng giá niêm yết bán độc bản, số lượng tồn kho theo size và quy trình kiểm duyệt chất liệu.
            </p>
          </div>

          {/* Action Button: Thêm Mẫu Váy Mới */}
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                name: '',
                code: `#UB-GOWN-00${products.length + 1}`,
                collection: 'Bộ sưu tập Lễ Phục Hoàng Gia',
                silhouette: 'Ballgown Xòe Bồng',
                material: 'Tulle Ý VÀ Ren Chantilly Pháp',
                price: 45000000,
                deposit: 15000000,
                sizeS: 2,
                sizeM: 2,
                sizeL: 1,
                status: 'Hiển thị',
                image: card1Elysian
              });
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#733F49] to-[#8C4654] hover:from-[#5A2D35] hover:to-[#733F49] text-white text-xs font-bold transition-all cursor-pointer shadow-md border-0 shrink-0 self-start sm:self-auto"
          >
            <PlusCircle size={16} />
            <span>Thêm Mẫu Váy Mới</span>
          </button>
        </div>

        {/* ===================== 2. FOUR KPI SUMMARY CARDS ===================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Tổng mẫu bản và độc bản */}
          <div className="bg-white rounded-2xl border border-[#F0E6E2] p-5 shadow-[0_2px_12px_rgba(115,63,73,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-[10px] sm:text-[10.5px] font-bold tracking-[1.2px] text-[#8C7A7B] uppercase leading-snug">
                TỔNG MẪU BẢN VÀ ĐỘC BẢN
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F6ECE8] flex items-center justify-center text-[#733F49] shrink-0">
                <Gem size={17} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline">
              <span className="font-playfair text-[28px] sm:text-[32px] font-bold text-[#2C2523] leading-none">
                128
              </span>
              <span className="text-[13px] text-[#733F49] font-medium ml-1.5">
                thiết kế
              </span>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#F7EFEA] text-[11.5px] text-[#8C7A7B] flex items-center gap-1.5">
              <span className="text-[#733F49] font-bold">+</span>
              <span>6 thiết kế mới BST Dạ Tiệc và Cưới 2025</span>
            </div>
          </div>

          {/* Card 2: Đang mở bán sẵn */}
          <div className="bg-white rounded-2xl border border-[#F0E6E2] p-5 shadow-[0_2px_12px_rgba(115,63,73,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-[10px] sm:text-[10.5px] font-bold tracking-[1.2px] text-[#8C7A7B] uppercase leading-snug">
                ĐANG MỞ BÁN SẴN
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32] shrink-0">
                <Store size={17} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline">
              <span className="font-playfair text-[28px] sm:text-[32px] font-bold text-[#1E4620] leading-none">
                94
              </span>
              <span className="text-[13px] text-[#2E7D32] font-medium ml-1.5">
                chiếc
              </span>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#F7EFEA]">
              <div className="flex items-center justify-between text-[11.5px] leading-none mb-1.5">
                <span className="text-[#6D5D5E]">Tỷ lệ hàng sẵn có</span>
                <span className="font-bold text-[#2C2523]">73.4%</span>
              </div>
              <div className="w-full bg-[#EAE3DE] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#2E7D32] h-full rounded-full transition-all duration-500" style={{ width: '73.4%' }} />
              </div>
            </div>
          </div>

          {/* Card 3: Độc bản may đo Bespoke */}
          <div className="bg-white rounded-2xl border border-[#F0E6E2] p-5 shadow-[0_2px_12px_rgba(115,63,73,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-[10px] sm:text-[10.5px] font-bold tracking-[1.2px] text-[#8C7A7B] uppercase leading-snug">
                ĐỘC BẢN MAY ĐO BESPOKE
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FFF3E0] flex items-center justify-center text-[#E65100] shrink-0">
                <Crown size={17} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline">
              <span className="font-playfair text-[28px] sm:text-[32px] font-bold text-[#5F333B] leading-none">
                18
              </span>
              <span className="text-[13px] text-[#733F49] font-medium ml-1.5">
                mẫu
              </span>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#F7EFEA] text-[11.5px] text-[#8C7A7B] flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-3.5 rounded-full border border-[#D7CCC8] flex items-center justify-center text-[9px] text-[#8C7A7B]">✦</span>
              <span>Chỉ thực hiện độc quyền 1 bản duy nhất</span>
            </div>
          </div>

          {/* Card 4: Cần bổ sung tồn kho */}
          <div className="bg-white rounded-2xl border border-[#F0E6E2] p-5 shadow-[0_2px_12px_rgba(115,63,73,0.03)] hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <span className="text-[10px] sm:text-[10.5px] font-bold tracking-[1.2px] text-[#8C7A7B] uppercase leading-snug">
                CẦN BỔ SUNG TỒN KHO
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FDECEE] flex items-center justify-center text-[#C93B3B] shrink-0">
                <ClipboardList size={17} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline">
              <span className="font-playfair text-[28px] sm:text-[32px] font-bold text-[#C93B3B] leading-none">
                7
              </span>
              <span className="text-[13px] text-[#C93B3B] font-medium ml-1.5">
                mẫu
              </span>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-[#F7EFEA] text-[11.5px] text-[#8C7A7B] flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-[#C93B3B] shrink-0" />
              <span>3 mẫu đã hết hàng, 4 mẫu còn 1 chiếc</span>
            </div>
          </div>
        </div>

        {/* ===================== 3. MAIN TABLE CARD ===================== */}
        <div className="bg-white rounded-2xl border border-[#F0E6E2] p-5 sm:p-6 shadow-[0_2px_14px_rgba(115,63,73,0.04)]">
          {/* Search Bar và Filter Dropdown */}
          <div className="mb-5">
            <div className="relative w-full">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A39192]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã váy, tên thiết kế, chất liệu,..."
                className="w-full bg-[#FAF5F2] hover:bg-[#F6ECE8] focus:bg-white text-[13.5px] text-[#2C2523] placeholder:text-[#A39192] rounded-xl pl-11 pr-4 py-3 border border-[#EFE5E0] focus:border-[#733F49] outline-none transition-all"
              />
            </div>

            {/* Filter Dropdown right-aligned */}
            <div className="flex justify-end items-center mt-3 relative">
              <button
                type="button"
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className="inline-flex items-center gap-2 bg-white border border-[#EFE5E0] hover:border-[#733F49] text-[12.5px] font-medium text-[#2C2523] px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>
                  {statusFilter === 'all' && 'Tất Cả Tình Trạng'}
                  {statusFilter === 'in_stock' && 'Đang mở bán sẵn'}
                  {statusFilter === 'bespoke' && 'Độc bản Bespoke'}
                  {statusFilter === 'out_of_stock' && 'Tạm hết hàng'}
                  {statusFilter === 'visible' && 'Đang Hiển thị'}
                  {statusFilter === 'hidden' && 'Đang Ẩn'}
                </span>
                <ChevronDown size={14} className="text-[#8A797A]" />
              </button>

              {/* Dropdown Menu */}
              {filterDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-[#EFE5E0] py-1.5 z-30">
                  {[
                    { key: 'all', label: 'Tất Cả Tình Trạng' },
                    { key: 'in_stock', label: 'Đang mở bán sẵn' },
                    { key: 'bespoke', label: 'Độc bản Bespoke' },
                    { key: 'out_of_stock', label: 'Tạm hết hàng' },
                    { key: 'visible', label: 'Đang Hiển thị' },
                    { key: 'hidden', label: 'Đang Ẩn' }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.key);
                        setFilterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-[12.5px] transition-colors flex items-center justify-between ${
                        statusFilter === opt.key
                          ? 'bg-[#F6ECE8] text-[#733F49] font-bold'
                          : 'text-[#2C2523] hover:bg-[#FAF5F2]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {statusFilter === opt.key && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#FAF4F0] text-[#8C7A7B] text-[11px] font-bold tracking-[1.1px] uppercase">
                  <th className="py-3 px-4 rounded-l-xl font-bold">SẢN PHẨM</th>
                  <th className="py-3 px-3 font-bold text-center">PHOM DÁNG</th>
                  <th className="py-3 px-4 font-bold">CHẤT LIỆU</th>
                  <th className="py-3 px-4 font-bold">GIÁ BÁN</th>
                  <th className="py-3 px-4 font-bold">TỒN KHO</th>
                  <th className="py-3 px-3 font-bold text-center">TRẠNG THÁI</th>
                  <th className="py-3 px-3 rounded-r-xl font-bold text-center">THAO TÁC</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F6ECE8]">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[#8C7A7B] text-[14px]">
                      Không tìm thấy thiết kế váy cưới nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#FAF7F5] transition-colors group"
                    >
                      {/* Cột 1: SẢN PHẨM */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-xl object-cover border border-[#EFE5E0] shadow-xs shrink-0"
                          />
                          <div>
                            <div className="font-playfair text-[15px] sm:text-[16px] font-bold text-[#2C2523] leading-snug group-hover:text-[#733F49] transition-colors">
                              {item.name}
                            </div>
                            <div className="inline-block font-mono text-[10.5px] font-bold text-[#733F49] bg-[#F6ECE8] px-2 py-0.5 rounded-sm mt-1 leading-none">
                              {item.code}
                            </div>
                            <div className="text-[12px] text-[#8C7A7B] mt-1 leading-tight">
                              {item.collection}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: PHOM DÁNG */}
                      <td className="py-4 px-3 align-middle text-center">
                        <span className="inline-block bg-[#F6EAE4] text-[#5F333B] text-[12px] font-semibold px-3 py-1.5 rounded-xl leading-tight text-center max-w-[120px]">
                          {item.silhouette}
                        </span>
                      </td>

                      {/* Cột 3: CHẤT LIỆU */}
                      <td className="py-4 px-4 align-middle">
                        <div className="text-[12.5px] text-[#2C2523] font-medium leading-relaxed max-w-[170px]">
                          {item.material}
                        </div>
                      </td>

                      {/* Cột 4: GIÁ BÁN */}
                      <td className="py-4 px-4 align-middle">
                        <div className="font-playfair text-[15px] font-bold text-[#943C4B] leading-snug tracking-tight">
                          {formatVND(item.price)}
                        </div>
                        <div className="text-[11.5px] text-[#8C7A7B] mt-0.5 leading-tight">
                          Cọc giữ mẫu: {formatVND(item.deposit)}
                        </div>
                      </td>

                      {/* Cột 5: TỒN KHO */}
                      <td className="py-4 px-4 align-middle">
                        {item.stockText === 'Tạm hết hàng' ? (
                          <span className="font-semibold text-[12.5px] text-[#C93B3B]">
                            Tạm hết hàng
                          </span>
                        ) : (
                          <div>
                            <div className="font-bold text-[13px] text-[#2C2523] leading-snug">
                              {item.stockText}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.sizes.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block bg-[#F6ECE8] text-[#5F333B] text-[11px] font-medium px-2 py-0.5 rounded-md leading-none"
                                >
                                  {s.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Cột 6: TRẠNG THÁI */}
                      <td className="py-4 px-3 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item.id)}
                          className={`inline-block px-3 py-1 rounded-xl text-[12px] font-bold transition-all cursor-pointer border-0 ${
                            item.status === 'Hiển thị'
                              ? 'bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#D4EDDA]'
                              : 'bg-[#F6ECE8] text-[#8C7A7B] hover:bg-[#EDE0DA]'
                          }`}
                          title="Bấm để chuyển đổi trạng thái"
                        >
                          {item.status}
                        </button>
                      </td>

                      {/* Cột 7: THAO TÁC */}
                      <td className="py-4 px-3 align-middle text-center relative">
                        <div className="flex items-center justify-center gap-1.5 text-[#8C7A7B]">
                          {/* Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => setViewingProduct(item)}
                            className="p-1.5 hover:text-[#733F49] hover:bg-[#F6ECE8] rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                            title="Xem chi tiết"
                          >
                            <Eye size={17} />
                          </button>

                          {/* Sửa thông tin */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 hover:text-[#733F49] hover:bg-[#F6ECE8] rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                            title="Chỉnh sửa mẫu váy"
                          >
                            <SlidersHorizontal size={16} />
                          </button>

                          {/* Thao tác khác Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(activeMenuId === item.id ? null : item.id)
                              }
                              className="p-1.5 hover:text-[#733F49] hover:bg-[#F6ECE8] rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                              title="Thêm thao tác"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenuId === item.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-[#EFE5E0] py-1.5 z-30 text-left">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(item.id)}
                                  className="w-full px-3.5 py-2 text-[12.5px] text-[#2C2523] hover:bg-[#FAF5F2] flex items-center gap-2"
                                >
                                  <Layers size={14} className="text-[#8C7A7B]" />
                                  <span>
                                    {item.status === 'Hiển thị' ? 'Chuyển sang Ẩn' : 'Bật Hiển Thị'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(item.code);
                                    showToast(`Đã sao chép mã váy: ${item.code}`);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-[12.5px] text-[#2C2523] hover:bg-[#FAF5F2] flex items-center gap-2"
                                >
                                  <Tag size={14} className="text-[#8C7A7B]" />
                                  <span>Sao chép mã váy</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(item)}
                                  className="w-full px-3.5 py-2 text-[12.5px] text-[#2C2523] hover:bg-[#FAF5F2] flex items-center gap-2"
                                >
                                  <FileEdit size={14} className="text-[#8C7A7B]" />
                                  <span>Chỉnh sửa thông số</span>
                                </button>

                                <div className="h-px bg-[#F6ECE8] my-1" />

                                <button
                                  type="button"
                                  disabled={item.status === 'renting'}
                                  onClick={() => item.status !== 'renting' && handleDeleteProduct(item.id)}
                                  title={item.status === 'renting' ? `Mẫu váy "${item.name}" đang có đơn thuê, không thể xóa` : 'Xóa mẫu váy'}
                                  className={`w-full px-3.5 py-2 text-[12.5px] flex items-center gap-2 font-medium transition-colors ${
                                    item.status === 'renting'
                                      ? 'opacity-35 cursor-not-allowed bg-gray-50 text-gray-400 select-none'
                                      : 'text-[#C93B3B] hover:bg-[#FDECEE] cursor-pointer'
                                  }`}
                                >
                                  <Trash2 size={14} />
                                  <span>Xóa mẫu váy</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ===================== 4. FOOTER VÀ PAGINATION ===================== */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-[#F6ECE8] text-[12.5px] text-[#8C7A7B]">
            <div>
              Hiển thị <strong className="text-[#2C2523] font-bold">1 - 6</strong> trong tổng số{' '}
              <strong className="text-[#2C2523] font-bold">128</strong> mẫu váy cưới Haute Couture và Lễ Phục Bán Sẵn
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5 select-none">
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C7A7B] hover:text-[#733F49] hover:bg-[#F6ECE8] transition-colors border-0 bg-transparent cursor-pointer disabled:opacity-40"
                disabled
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-[#733F49] text-white font-bold flex items-center justify-center shadow-xs cursor-pointer border-0 text-[12.5px]"
              >
                1
              </button>

              <button
                type="button"
                onClick={() => showToast('Chuyển trang 2')}
                className="w-8 h-8 rounded-lg text-[#2C2523] hover:bg-[#F6ECE8] font-medium flex items-center justify-center transition-colors cursor-pointer border-0 bg-transparent text-[12.5px]"
              >
                2
              </button>

              <button
                type="button"
                onClick={() => showToast('Chuyển trang 3')}
                className="w-8 h-8 rounded-lg text-[#2C2523] hover:bg-[#F6ECE8] font-medium flex items-center justify-center transition-colors cursor-pointer border-0 bg-transparent text-[12.5px]"
              >
                3
              </button>

              <span className="px-1 text-[#A39192]">...</span>

              <button
                type="button"
                onClick={() => showToast('Chuyển trang 15')}
                className="w-8 h-8 rounded-lg text-[#2C2523] hover:bg-[#F6ECE8] font-medium flex items-center justify-center transition-colors cursor-pointer border-0 bg-transparent text-[12.5px]"
              >
                15
              </button>

              <button
                type="button"
                onClick={() => showToast('Chuyển trang kế tiếp')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C7A7B] hover:text-[#733F49] hover:bg-[#F6ECE8] transition-colors border-0 bg-transparent cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ===================== 5. MODAL: THÊM / SỬA MẪU VÁY MỚI ===================== */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#F0E6E2] my-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-[#F6ECE8]">
                <div>
                  <h3 className="font-playfair text-[22px] font-bold text-[#45272F] m-0">
                    {editingProduct ? 'Chỉnh Sửa Mẫu Váy Cưới' : 'Thêm Mẫu Váy Cưới Mới'}
                  </h3>
                  <p className="text-[12px] text-[#8C7A7B] m-0 mt-0.5">
                    Thiết lập thông số kỹ thuật, bảng giá niêm yết và tồn kho theo size
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-[#F6ECE8] text-[#8C7A7B] hover:text-[#733F49] transition-colors border-0 bg-transparent cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="mt-5 space-y-4">
                {/* Tên và Mã Váy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-bold text-[#5F333B] mb-1 uppercase tracking-wider">
                      Tên Thiết Kế *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Juliette Royal Ballgown"
                      className="w-full bg-[#FAF5F2] focus:bg-white text-[13px] text-[#2C2523] px-3.5 py-2.5 rounded-xl border border-[#EFE5E0] focus:border-[#733F49] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#5F333B] mb-1 uppercase tracking-wider">
                      Mã Váy Niêm Yết *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="#UB-GOWN-007"
                      className="w-full bg-[#FAF5F2] focus:bg-white text-[13px] font-mono text-[#2C2523] px-3.5 py-2.5 rounded-xl border border-[#EFE5E0] focus:border-[#733F49] outline-none"
                    />
                  </div>
                </div>

                {/* Bộ sưu tập và Phom dáng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-bold text-[#5F333B] mb-1 uppercase tracking-wider">
                      Bộ Sưu Tập
                    </label>
                    <select
                      value={formData.collection}
                      onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                      className="w-full bg-[#FAF5F2] focus:bg-white text-[13px] text-[#2C2523] px-3.5 py-2.5 rounded-xl border border-[#EFE5E0] focus:border-[#733F49] outline-none"
                    >
                      <option value="Bộ sưu tập Lễ Phục Hoàng Gia">Bộ sưu tập Lễ Phục Hoàng Gia</option>
                      <option value="Bộ sưu tập Tôn Dáng Hoàng Gia">Bộ sưu tập Tôn Dáng Hoàng Gia</option>
                      <option value="Bộ sưu tập Tối Giản Vượt Thời Gian">Bộ sưu tập Tối Giản Vượt Thời Gian</option>
                      <option value="Nghệ thuật thêu đính thủ công">Nghệ thuật thêu đính thủ công</option>
                      <option value="Sang trọng và Quyến rũ hiện đại">Sang trọng và Quyến rũ hiện đại</option>
                      <option value="Kiệt tác Lễ Phục Thượng Hạng">Kiệt tác Lễ Phục Thượng Hạng</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#5F333B] mb-1 uppercase tracking-wider">
                      Phom Dáng
                    </label>
                    <select
                      value={formData.silhouette}
                      onChange={(e) => setFormData({ ...formData, silhouette: e.target.value })}
                      className="w-full bg-[#FAF5F2] focus:bg-white text-[13px] text-[#2C2523] px-3.5 py-2.5 rounded-xl border border-[#EFE5E0] focus:border-[#733F49] outline-none"
                    >
                      <option value="Ballgown Xòe Bồng">Ballgown Xòe Bồng</option>
                      <option value="Mermaid Đuôi Cá">Mermaid Đuôi Cá</option>
                      <option value="A-Line Thanh Nhã">A-Line Thanh Nhã</option>
                      <option value="Minimal Mikado Silk">Minimal Mikado Silk</option>
                      <option value="Sheath Ôm Dáng">Sheath Ôm Dáng</option>
                    </select>
                  </div>
                </div>

                {/* Chất liệu */}
                <div>
                  <label className="block text-[12px] font-bold text-[#5F333B] mb-1 uppercase tracking-wider">
                    Chất Liệu và Quy Trình Dệt
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="VD: Tulle Ý VÀ Ren Chantilly Pháp kết pha lê Swarovski"
                    className="w-full bg-[#FAF5F2] focus:bg-white text-[13px] text-[#2C2523] px-3.5 py-2.5 rounded-xl border border-[#EFE5E0] focus:border-[#733F49] outline-none"
                  />
                </div>

                {/* Giá bán và Tiền cọc */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12px] font-bold text-[#5F333B] mb-1 uppercase tracking-wider">
                      Giá Bán Niêm Yết (VNĐ) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="48000000"
                      className="w-full bg-[#FAF5F2] focus:bg-white text-[13px] font-semibold text-[#943C4B] px-3.5 py-2.5 rounded-xl border border-[#EFE5E0] focus:border-[#733F49] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#5F333B] mb-1 uppercase tracking-wider">
                      Cọc Giữ Mẫu (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                      placeholder="15000000"
                      className="w-full bg-[#FAF5F2] focus:bg-white text-[13px] text-[#2C2523] px-3.5 py-2.5 rounded-xl border border-[#EFE5E0] focus:border-[#733F49] outline-none"
                    />
                  </div>
                </div>

                {/* Số lượng tồn kho theo Size */}
                <div>
                  <label className="block text-[12px] font-bold text-[#5F333B] mb-1.5 uppercase tracking-wider">
                    Số Lượng Tồn Kho Theo Size
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 bg-[#FAF5F2] p-3 rounded-xl border border-[#EFE5E0]">
                    <div>
                      <span className="text-[11px] font-semibold text-[#8C7A7B] block mb-1">Size S</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.sizeS}
                        onChange={(e) => setFormData({ ...formData, sizeS: e.target.value })}
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-[#EFE5E0] text-[13px] text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#8C7A7B] block mb-1">Size M</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.sizeM}
                        onChange={(e) => setFormData({ ...formData, sizeM: e.target.value })}
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-[#EFE5E0] text-[13px] text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#8C7A7B] block mb-1">Size L</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.sizeL}
                        onChange={(e) => setFormData({ ...formData, sizeL: e.target.value })}
                        className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-[#EFE5E0] text-[13px] text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Chọn ảnh đại diện thiết kế */}
                <div>
                  <label className="block text-[12px] font-bold text-[#5F333B] mb-1.5 uppercase tracking-wider">
                    Chọn Ảnh Mẫu Thiết Kế Haute Couture
                  </label>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {[
                      { img: card1Elysian, label: 'Elysian' },
                      { img: card2Celeste, label: 'Celeste' },
                      { img: card3Lumiere, label: 'Lumière' },
                      { img: card4Monet, label: 'Monet' },
                      { img: card5Aurora, label: 'Aurora' },
                      { img: card6Seraphina, label: 'Seraphina' },
                      { img: card7Vivienne, label: 'Vivienne' }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, image: item.img })}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 p-0.5 shrink-0 transition-transform active:scale-95 ${
                          formData.image === item.img
                            ? 'border-[#733F49] ring-2 ring-[#733F49]/20 scale-105'
                            : 'border-[#EFE5E0] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={item.img} alt={item.label} className="w-full h-full object-cover rounded-lg" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trạng thái */}
                <div>
                  <label className="block text-[12px] font-bold text-[#5F333B] mb-1 uppercase tracking-wider">
                    Trạng Thái Đăng Ký
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#2C2523]">
                      <input
                        type="radio"
                        name="status"
                        value="Hiển thị"
                        checked={formData.status === 'Hiển thị'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="accent-[#733F49]"
                      />
                      <span className="font-semibold text-[#2E7D32]">Hiển thị công khai</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#2C2523]">
                      <input
                        type="radio"
                        name="status"
                        value="Ẩn"
                        checked={formData.status === 'Ẩn'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="accent-[#733F49]"
                      />
                      <span className="font-semibold text-[#8C7A7B]">Ẩn tạm thời</span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F6ECE8]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-[#EFE5E0] text-[13px] font-semibold text-[#6D5D5E] hover:bg-[#FAF5F2] transition-colors cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5E323B] text-white text-[13px] font-bold tracking-wide transition-all shadow-md cursor-pointer border-0"
                  >
                    {editingProduct ? 'Cập Nhật Thiết Kế' : 'Lưu và Đăng Mẫu Váy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================== 6. MODAL: XEM CHI TIẾT SẢN PHẨM ===================== */}
        {viewingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#F0E6E2] my-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between pb-4 border-b border-[#F6ECE8]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[12px] font-bold text-[#733F49] bg-[#F6ECE8] px-2.5 py-1 rounded-md">
                    {viewingProduct.code}
                  </span>
                  <span
                    className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                      viewingProduct.status === 'Hiển thị'
                        ? 'bg-[#E8F5E9] text-[#2E7D32]'
                        : 'bg-[#F6ECE8] text-[#8C7A7B]'
                    }`}
                  >
                    {viewingProduct.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="p-1.5 rounded-xl hover:bg-[#F6ECE8] text-[#8C7A7B] hover:text-[#733F49] transition-colors border-0 bg-transparent cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <img
                    src={viewingProduct.image}
                    alt={viewingProduct.name}
                    className="w-full h-[320px] rounded-2xl object-cover border border-[#EFE5E0] shadow-sm"
                  />
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <h2 className="font-playfair text-[24px] font-bold text-[#2C2523] leading-snug m-0">
                      {viewingProduct.name}
                    </h2>
                    <p className="text-[12.5px] text-[#8C7A7B] mt-1 m-0">
                      {viewingProduct.collection}
                    </p>

                    <div className="mt-4 space-y-2.5 text-[13px]">
                      <div>
                        <span className="text-[#8C7A7B] block text-[11px] uppercase font-bold tracking-wider">
                          Phom Dáng Thiết Kế
                        </span>
                        <span className="font-semibold text-[#5F333B]">{viewingProduct.silhouette}</span>
                      </div>

                      <div>
                        <span className="text-[#8C7A7B] block text-[11px] uppercase font-bold tracking-wider">
                          Chất Liệu Thượng Hạng
                        </span>
                        <span className="font-medium text-[#2C2523]">{viewingProduct.material}</span>
                      </div>

                      <div>
                        <span className="text-[#8C7A7B] block text-[11px] uppercase font-bold tracking-wider">
                          Bảng Giá Niêm Yết và Cọc Giữ Mẫu
                        </span>
                        <div className="font-playfair text-[20px] font-bold text-[#943C4B]">
                          {formatVND(viewingProduct.price)}
                        </div>
                        <div className="text-[12px] text-[#8C7A7B]">
                          Tiền cọc bảo lãnh: {formatVND(viewingProduct.deposit)}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#8C7A7B] block text-[11px] uppercase font-bold tracking-wider">
                          Hiện Trạng Tồn Kho
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {viewingProduct.sizes.length > 0 ? (
                            viewingProduct.sizes.map((s, idx) => (
                              <span
                                key={idx}
                                className="bg-[#F6ECE8] text-[#5F333B] text-[11.5px] font-bold px-2.5 py-1 rounded-lg"
                              >
                                {s.label}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#C93B3B] font-semibold text-[13px]">
                              Tạm hết hàng trong kho showroom
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenEdit(viewingProduct);
                        setViewingProduct(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5E323B] text-white text-[12.5px] font-bold transition-all border-0 cursor-pointer text-center"
                    >
                      Chỉnh Sửa Mẫu Váy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleStatus(viewingProduct.id);
                        setViewingProduct(null);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-[#EFE5E0] text-[12.5px] font-semibold text-[#5F333B] hover:bg-[#FAF5F2] transition-colors cursor-pointer"
                    >
                      Đổi Trạng Thái
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TOAST NOTIFICATION ===================== */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#2C2523] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-[13px] font-medium border border-white/10 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="w-6 h-6 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center shrink-0">
              <Check size={14} className="stroke-[3]" />
            </div>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
