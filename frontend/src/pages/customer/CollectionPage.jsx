import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, Heart,
  Sparkles, Scissors, ShieldCheck, ChevronLeft, ChevronRight,
  Check, X, Calendar, LayoutGrid, Grid3X3, Filter
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { addToCart } from '../../services/cartService';
import { getWishlistIds, toggleWishlist, WISHLIST_EVENT } from '../../services/wishlistService';
import { getAllDresses, formatCurrencyVND } from '../../services/dressService';

import logoEmblemImg from '../../assets/logo_emblem.png';
import { DRESS_CATALOG } from '../../data/dressCatalog';

// Danh mục Phom Dáng chuẩn Haute Couture 5 dòng thiết kế chủ đạo
const SILHOUETTE_OPTIONS = [
  { id: 'all', label: 'Tất cả (All)' },
  { id: 'ballgown', label: 'Công Chúa Bồng Xòe (Ballgown)' },
  { id: 'mermaid', label: 'Đuôi Cá Điêu Khắc (Mermaid)' },
  { id: 'a-line', label: 'Chữ A Thanh Lịch (A-line)' },
  { id: 'silk-gown', label: 'Lụa Satin Tối Giản (Silk Gown)' },
  { id: 'princess', label: 'Váy Cưới Hoàng Gia (Princess)' },
  { id: 'traditional', label: 'Áo Dài Cưới Truyền Thống (Traditional)' },
];

// Danh mục Chất Liệu Thượng Hạng (Khớp với chất liệu thực tế của toàn bộ mẫu váy)
const MATERIAL_OPTIONS = [
  'Ren 3D / Ren Pháp',
  'Lụa Mikado Ý',
  'Satin Tơ Tằm Tự Nhiên',
  'Đính Pha Lê Swarovski',
  'Voan Tulle Thụy Sĩ',
  'Gấm & Dạ Cao Cấp',
];

// Danh mục Mức Giá Thuê chuẩn theo giá thực tế trong cơ sở dữ liệu (3.2tr - 8.9tr+)
const PRICE_RANGE_OPTIONS = [
  { id: 'under-5', label: 'Dưới 5 triệu' },
  { id: '5-7', label: '5 – 7 triệu' },
  { id: '7-9', label: '7 – 9 triệu' },
  { id: 'above-9', label: 'Trên 9 triệu (Haute Couture VIP)' },
];

// Helper: Kiểm tra phom dáng khớp linh hoạt với dữ liệu váy
const matchSilhouette = (dress, targetId) => {
  if (!targetId || targetId === 'all') return true;
  const target = targetId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cat = (dress.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const sil = (dress.silhouette || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const name = (dress.name || '').toLowerCase();

  if (cat.includes(target) || sil.includes(target)) return true;
  if (target === 'ballgown' && (sil.includes('ballgown') || cat.includes('ballgown') || name.includes('ballgown') || name.includes('bồng'))) return true;
  if (target === 'mermaid' && (sil.includes('mermaid') || cat.includes('mermaid') || name.includes('mermaid') || name.includes('đuôi cá'))) return true;
  if (target === 'aline' && (sil.includes('aline') || cat.includes('aline') || sil.includes('line') || name.includes('chữ a') || name.includes('a-line'))) return true;
  if (target === 'silkgown' && (sil.includes('silk') || sil.includes('sheath') || cat.includes('silk') || name.includes('lụa') || name.includes('silk'))) return true;
  if (target === 'princess' && (sil.includes('princess') || cat.includes('princess') || name.includes('princess') || name.includes('hoàng gia'))) return true;
  if (target === 'traditional' && (sil.includes('traditional') || sil.includes('aodai') || cat.includes('traditional') || name.includes('áo dài'))) return true;
  if (target === 'tuxedo' && (sil.includes('tuxedo') || sil.includes('vest') || cat.includes('tuxedo') || name.includes('vest') || name.includes('tuxedo'))) return true;
  return false;
};

// Helper: Kiểm tra chất liệu khớp theo từ khóa linh hoạt
const matchMaterial = (dressMaterial = '', selectedMaterials = []) => {
  if (!selectedMaterials || selectedMaterials.length === 0) return true;
  const dMat = (dressMaterial || '').toLowerCase();
  return selectedMaterials.some((selected) => {
    const s = selected.toLowerCase();
    if (s.includes('ren') && (dMat.includes('ren') || dMat.includes('lace') || dMat.includes('chantilly') || dMat.includes('guipure') || dMat.includes('3d'))) return true;
    if (s.includes('mikado') && (dMat.includes('mikado') || dMat.includes('lụa') || dMat.includes('silk') || dMat.includes('crepe'))) return true;
    if (s.includes('satin') && (dMat.includes('satin') || dMat.includes('tơ tằm') || dMat.includes('tơ sống'))) return true;
    if ((s.includes('pha lê') || s.includes('swarovski')) && (dMat.includes('pha lê') || dMat.includes('swarovski') || dMat.includes('kim tuyến') || dMat.includes('cườm') || dMat.includes('ánh kim') || dMat.includes('crystal'))) return true;
    if ((s.includes('voan') || s.includes('tulle')) && (dMat.includes('voan') || dMat.includes('tulle') || dMat.includes('organza'))) return true;
    if ((s.includes('gấm') || s.includes('dạ')) && (dMat.includes('gấm') || dMat.includes('dạ') || dMat.includes('tweed') || dMat.includes('len'))) return true;
    return dMat.includes(s);
  });
};

// Helper: Kiểm tra mức giá khớp theo số tiền thực tế (Realtime)
const matchPrice = (dress, selectedRanges = []) => {
  if (!selectedRanges || selectedRanges.length === 0) return true;
  const price = Number(dress.priceNumber || dress.price || dress.rentPrice) || 0;
  return selectedRanges.some((rangeId) => {
    switch (rangeId) {
      case 'under-5':
        return price < 5000000;
      case '5-7':
        return price >= 5000000 && price <= 7000000;
      case '7-9':
        return price > 7000000 && price <= 9000000;
      case 'above-9':
        return price > 9000000;
      // Khớp tương thích ngược với params cũ
      case '5-10':
        return price >= 5000000 && price <= 10000000;
      case '10-20':
        return price >= 7000000;
      case 'vip':
        return price >= 7500000;
      default:
        return true;
    }
  });
};

const ITEMS_PER_PAGE = 9;

export default function CollectionPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const gridTopRef = useRef(null);

  // State Bộ lọc từ URL hoặc mặc định
  const urlCategory = searchParams.get('category') || searchParams.get('silhouette') || 'all';
  const urlQuery = searchParams.get('q') || searchParams.get('search') || '';
  const urlPrice = searchParams.get('price');

  const [selectedSilhouette, setSelectedSilhouette] = useState(urlCategory);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState(urlPrice ? [urlPrice] : []);
  const [isFilterApplied, setIsFilterApplied] = useState(Boolean(urlPrice || (urlCategory && urlCategory !== 'all')));
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [appliedSearch, setAppliedSearch] = useState(urlQuery);
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [gridCols, setGridCols] = useState(3); // 2 or 3 columns
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // State tương tác: Giỏ hàng, Wishlist, Modal Thuê Váy, Toast Thông Báo
  const [wishlistIds, setWishlistIds] = useState(() => getWishlistIds());
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Danh mục sản phẩm (kết hợp dữ liệu chuẩn Figma 72 mẫu + backend API nếu có)
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getAllDresses()
      .then((res) => {
        if (!active) return;
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setCatalogItems(res.data);
          setError('');
        } else {
          setCatalogItems(DRESS_CATALOG);
          setError('');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setCatalogItems(DRESS_CATALOG);
        setError('');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Đồng bộ URL params khi user truy cập link có params
  useEffect(() => {
    if (urlCategory && urlCategory !== selectedSilhouette) {
      setSelectedSilhouette(urlCategory);
    }
    if (urlQuery && urlQuery !== appliedSearch) {
      setSearchQuery(urlQuery);
      setAppliedSearch(urlQuery);
    }
  }, [urlCategory, urlQuery]);

  // Đồng bộ Wishlist thời gian thực với toàn bộ hệ thống
  useEffect(() => {
    const refreshWishlist = () => setWishlistIds(getWishlistIds());
    window.addEventListener(WISHLIST_EVENT, refreshWishlist);
    window.addEventListener('storage', refreshWishlist);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, refreshWishlist);
      window.removeEventListener('storage', refreshWishlist);
    };
  }, []);

  // Hiển thị toast thông báo
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Toggle Wishlist
  const handleToggleWishlist = (id) => {
    const result = toggleWishlist(id);
    setWishlistIds(getWishlistIds());
    showToast(
      result.isAdded
        ? 'Đã thêm váy vào danh sách yêu thích ♥'
        : 'Đã xóa váy khỏi danh sách yêu thích'
    );
  };

  // Thêm vào giỏ thuê
  const handleAddToCart = (dress) => {
    const added = addToCart(dress);
    showToast(added ? `Đã thêm "${dress.name}" vào giỏ thuê váy!` : `"${dress.name}" đã có trong giỏ thuê váy.`);
  };

  // Thuê Ngay: Thêm vào đơn và chuyển thẳng tới trang Ký Hợp Đồng & Thanh Toán
  const handleRentNow = (dress) => {
    addToCart(dress);
    navigate(`/checkout?dressId=${dress.id}`);
  };

  // Đặt Lịch Thử Váy Riêng Tư
  const handleOpenFitting = (dress) => {
    navigate(dress?.id ? `/dat-lich?dressId=${dress.id}` : '/dat-lich');
  };

  // Xóa toàn bộ bộ lọc
  const handleClearFilters = () => {
    setSelectedSilhouette('all');
    setSelectedMaterials([]);
    setSelectedPriceRanges([]);
    setIsFilterApplied(false);
    setSearchQuery('');
    setAppliedSearch('');
    setCurrentPage(1);
    setSearchParams({});
    showToast('Đã đặt lại toàn bộ bộ lọc về mặc định');
  };

  // Xóa từng bộ lọc đơn lẻ
  const handleRemoveSilhouette = () => {
    setSelectedSilhouette('all');
    setCurrentPage(1);
  };

  const handleRemoveMaterial = (mat) => {
    setSelectedMaterials((prev) => prev.filter((m) => m !== mat));
    setCurrentPage(1);
  };

  const handleRemovePrice = (priceId) => {
    setSelectedPriceRanges((prev) => prev.filter((p) => p !== priceId));
    setCurrentPage(1);
  };

  const handleRemoveSearch = () => {
    setSearchQuery('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  // Chuyển trang & cuộn mượt lên đầu lưới sản phẩm
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toggle Material (Lọc Realtime)
  const handleToggleMaterial = (mat) => {
    setCurrentPage(1);
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  // Toggle Price Range (Lọc Realtime)
  const handleTogglePriceRange = (rangeId) => {
    setCurrentPage(1);
    setSelectedPriceRanges((prev) =>
      prev.includes(rangeId) ? prev.filter((r) => r !== rangeId) : [...prev, rangeId]
    );
  };

  // Xử lý Tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchQuery.trim());
    setCurrentPage(1);
  };

  // Lọc và Sắp xếp danh sách (Hoàn toàn REALTIME)
  const filteredProducts = useMemo(() => {
    return catalogItems.filter((dress) => {
      // 1. Lọc phom dáng
      if (!matchSilhouette(dress, selectedSilhouette)) {
        return false;
      }

      // 2. Lọc chất liệu
      if (!matchMaterial(dress.material, selectedMaterials)) {
        return false;
      }

      // 3. Lọc mức giá thuê (theo số tiền thực tế trong DB)
      if (!matchPrice(dress, selectedPriceRanges)) {
        return false;
      }

      // 4. Lọc từ khóa tìm kiếm
      if (appliedSearch) {
        const query = appliedSearch.toLowerCase().trim();
        const matchName = dress.name?.toLowerCase().includes(query);
        const matchCategory = dress.categoryName?.toLowerCase().includes(query) || dress.silhouette?.toLowerCase().includes(query);
        const matchMaterialName = dress.material?.toLowerCase().includes(query);
        const matchBadge = dress.badgeMain?.toLowerCase().includes(query) || (dress.badgeSub && dress.badgeSub.toLowerCase().includes(query));

        if (!matchName && !matchCategory && !matchMaterialName && !matchBadge) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const priceA = Number(a.priceNumber || a.price || a.rentPrice) || 0;
      const priceB = Number(b.priceNumber || b.price || b.rentPrice) || 0;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'rating') return parseFloat(b.rating || 5.0) - parseFloat(a.rating || 5.0);
      return 0; // popular / default
    });
  }, [catalogItems, selectedSilhouette, selectedMaterials, selectedPriceRanges, appliedSearch, sortBy]);

  // Tổng số trang
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  // Phân trang sản phẩm hiển thị trên trang hiện tại
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Số lượng bộ lọc đang hoạt động
  const activeFiltersCount = (selectedSilhouette !== 'all' ? 1 : 0) + selectedMaterials.length + selectedPriceRanges.length + (appliedSearch ? 1 : 0);

  return (
    <div className="relative min-h-screen bg-[#FDFBF7] text-[#2C2523] flex flex-col font-jakarta selection:bg-[#FCEEE9] selection:text-[#B8737D]">

      {/* 1. Header Navigation */}
      <Header onOpenBooking={() => navigate('/dat-lich')} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 bg-[#2C2523] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#E6DAC8]/40 animate-bounce text-[13px] font-medium">
          <Sparkles className="w-4 h-4 text-[#B8737D]" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white ml-2 bg-transparent border-0 cursor-pointer p-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Main Page Content */}
      <main className="flex-1 w-full pb-20">

        {/* HERO SECTION / BANNER GIỚI THIỆU */}
        <section className="pt-10 pb-8 px-6 sm:px-8 bg-gradient-to-b from-[#FFF5F2] via-[#FDF9F6] to-[#FDFBF7] border-b border-[#E6DAC8]/40">
          <div className="max-w-[960px] mx-auto text-center">

            {/* Pill Tag */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#F3D8D8] shadow-xs mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8737D]"></span>
              <span className="font-jakarta font-bold text-[10.5px] uppercase tracking-[1.4px] text-[#B8737D]">
                THUÊ VÁY CƯỚI CAO CẤP
              </span>
            </div>

            {/* Title */}
            <h1 className="font-playfair text-[36px] sm:text-[46px] md:text-[52px] font-normal leading-[1.2] text-[#2C2523] mb-4">
              Tuyển Tập Tuyệt Tác <span className="text-[#B8737D] italic font-serif">Váy Cưới 2026</span>
            </h1>

            {/* Subtext 2 lines */}
            <p className="font-jakarta text-[13.5px] sm:text-[14.5px] leading-[22px] text-[#514344] max-w-[760px] mx-auto mb-6">
              Hòa quyện giữa kỹ thuật corsetry siết eo quý tộc và chất liệu lụa Mikado tơ tằm thượng hạng Ý & Pháp.
              <br className="hidden sm:inline" />
              Mỗi thiết kế là một độc bản tôn vinh trọn vẹn đường nét thuần khiết, rạng ngời của nàng dâu trong ngày trọng đại nhất cuộc đời.
            </p>

            {/* 3 Feature Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E6DAC8]/80 text-[#514344] text-[12px] font-medium shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#B8737D]" />
                <span>Thiết kế độc bản</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E6DAC8]/80 text-[#514344] text-[12px] font-medium shadow-xs">
                <Scissors className="w-3.5 h-3.5 text-[#B8737D]" />
                <span>May đo theo kích thước riêng</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E6DAC8]/80 text-[#514344] text-[12px] font-medium shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B8737D]" />
                <span>Bảo đảm hoàn cọc tức thì</span>
              </div>
            </div>

          </div>
        </section>

        {/* CONTAINER NỘI DUNG CHÍNH (SEARCH + 2 CỘT) */}
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 mt-6">

          {/* SEARCH BAR */}
          <div className="mb-6">
            <form
              onSubmit={handleSearchSubmit}
              className="w-full bg-white rounded-2xl border border-[#E6DAC8] shadow-[0px_4px_20px_rgba(201,138,144,0.08)] p-2 sm:p-2.5 flex items-center gap-3 transition-all focus-within:border-[#B8737D] focus-within:shadow-[0px_4px_24px_rgba(201,138,144,0.16)]"
            >
              <div className="pl-3 text-[#B8737D] flex items-center">
                <Search className="w-5 h-5 stroke-[2]" />
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên thiết kế, phom dáng, chất liệu ren/lụa..."
                className="flex-1 bg-transparent border-0 outline-none font-jakarta text-[13.5px] sm:text-[14px] text-[#2C2523] placeholder:text-[#847374]/70 py-1"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setAppliedSearch('');
                  }}
                  className="p-1 rounded-full text-[#847374] hover:text-[#2C2523] bg-transparent border-0 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#B8737D] hover:bg-[#a6626c] text-white font-jakarta text-[13.5px] font-semibold tracking-wide transition-all shadow-xs cursor-pointer border-0 shrink-0"
              >
                Tìm kiếm
              </button>
            </form>
          </div>

          {/* ACTIVE FILTER CHIPS (Hiển thị các bộ lọc đang kích hoạt) */}
          {activeFiltersCount > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#FFF9F6] border border-[#EEDECF]/80">
              <span className="text-[12px] font-semibold text-[#847374] flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5 text-[#B8737D]" />
                Đang lọc:
              </span>

              {selectedSilhouette !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E6DAC8] text-[11.5px] font-medium text-[#2C2523] shadow-xs">
                  Phom dáng: {SILHOUETTE_OPTIONS.find((s) => s.id === selectedSilhouette)?.label.split('(')[0]}
                  <button
                    type="button"
                    onClick={handleRemoveSilhouette}
                    className="text-[#847374] hover:text-[#B8737D] cursor-pointer bg-transparent border-0 p-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedMaterials.map((mat) => (
                <span
                  key={mat}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E6DAC8] text-[11.5px] font-medium text-[#2C2523] shadow-xs"
                >
                  {mat}
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterial(mat)}
                    className="text-[#847374] hover:text-[#B8737D] cursor-pointer bg-transparent border-0 p-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {selectedPriceRanges.map((priceId) => {
                const opt = PRICE_RANGE_OPTIONS.find((p) => p.id === priceId);
                return (
                  <span
                    key={priceId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E6DAC8] text-[11.5px] font-medium text-[#2C2523] shadow-xs"
                  >
                    Giá: {opt?.label || priceId}
                    <button
                      type="button"
                      onClick={() => handleRemovePrice(priceId)}
                      className="text-[#847374] hover:text-[#B8737D] cursor-pointer bg-transparent border-0 p-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}

              {appliedSearch && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E6DAC8] text-[11.5px] font-medium text-[#2C2523] shadow-xs">
                  Từ khóa: &quot;{appliedSearch}&quot;
                  <button
                    type="button"
                    onClick={handleRemoveSearch}
                    className="text-[#847374] hover:text-[#B8737D] cursor-pointer bg-transparent border-0 p-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11.5px] text-[#B8737D] hover:underline font-semibold ml-auto cursor-pointer bg-transparent border-0 p-1"
              >
                Xóa tất cả
              </button>
            </div>
          )}

          {/* MOBILE FILTER TOGGLE BUTTON (< lg) */}
          <div className="lg:hidden mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white border border-[#EEDECF] flex items-center justify-center gap-2 text-[13px] font-medium text-[#2C2523] shadow-xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#B8737D]" />
              <span>{isMobileFilterOpen ? 'Đóng bộ lọc' : `Bộ lọc tuyển chọn ${activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}`}</span>
            </button>
          </div>

          {/* LAYOUT 2 CỘT: SIDEBAR BỘ LỌC + GRID SẢN PHẨM */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* SIDEBAR BỘ LỌC TUYỂN CHỌN */}
            <aside
              className={`lg:col-span-4 xl:col-span-3 bg-white rounded-[28px] border border-[#EEDECF] p-6 shadow-[0px_4px_24px_rgba(201,138,144,0.08)] lg:sticky lg:top-24 ${
                isMobileFilterOpen ? 'block mb-6' : 'hidden lg:block'
              }`}
            >
              {/* Header Sidebar */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E6DAC8]/60 mb-6">
                <div className="flex items-center gap-2">
                  <div className="text-[#B8737D]">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <h2 className="font-playfair text-[18px] font-bold text-[#2C2523] tracking-tight m-0">
                    Bộ Lọc Tuyển Chọn
                  </h2>
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-[11.5px] text-[#B8737D] hover:text-[#a6626c] font-medium bg-transparent border-0 cursor-pointer transition-colors p-0"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Nhóm 1: PHOM DÁNG */}
              <div className="mb-6">
                <h3 className="font-jakarta text-[11px] font-bold tracking-[1.5px] uppercase text-[#695C4E] mb-3">
                  PHOM DÁNG
                </h3>
                <div className="flex flex-col gap-2">
                  {SILHOUETTE_OPTIONS.map((opt) => {
                    const isSelected = selectedSilhouette === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedSilhouette(opt.id);
                          setCurrentPage(1);
                        }}
                        className={`w-full py-2.5 px-4 rounded-[14px] border flex items-center justify-between cursor-pointer transition-all text-left ${
                          isSelected
                            ? 'bg-[#FFF9F6] border-[#BA7A83] shadow-xs'
                            : 'bg-white border-[#EEDECF] hover:border-[#BA7A83] hover:bg-[#FFFDFC]'
                        }`}
                      >
                        <span
                          className={`font-jakarta text-[12.5px] transition-colors ${
                            isSelected ? 'text-[#804E55] font-semibold' : 'text-[#2C2523] font-normal'
                          }`}
                        >
                          {opt.label}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#BA7A83] stroke-[2.5] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nhóm 2: CHẤT LIỆU */}
              <div className="mb-6">
                <h3 className="font-jakarta text-[11px] font-bold tracking-[1.5px] uppercase text-[#695C4E] mb-3">
                  CHẤT LIỆU
                </h3>
                <div className="flex flex-wrap gap-2">
                  {MATERIAL_OPTIONS.map((mat) => {
                    const isSelected = selectedMaterials.includes(mat);
                    return (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => handleToggleMaterial(mat)}
                        className={`px-3.5 py-1.5 rounded-full font-jakarta text-[12px] transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#BA7A83] text-white border border-[#BA7A83] font-medium shadow-xs'
                            : 'bg-white text-[#2C2523] border border-[#EEDECF] hover:border-[#BA7A83] hover:text-[#BA7A83]'
                        }`}
                      >
                        <span>{mat}</span>
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nhóm 3: MỨC GIÁ THUÊ */}
              <div className="mb-6">
                <h3 className="font-jakarta text-[11px] font-bold tracking-[1.5px] uppercase text-[#695C4E] mb-3">
                  MỨC GIÁ THUÊ
                </h3>
                <div className="flex flex-col gap-2">
                  {PRICE_RANGE_OPTIONS.map((range) => {
                    const isChecked = selectedPriceRanges.includes(range.id);
                    return (
                      <button
                        key={range.id}
                        type="button"
                        onClick={() => handleTogglePriceRange(range.id)}
                        className={`w-full py-2.5 px-4 rounded-[14px] border flex items-center justify-between cursor-pointer transition-all select-none text-left ${
                          isChecked
                            ? 'bg-[#FFF9F6] border-[#BA7A83] shadow-xs'
                            : 'bg-white border-[#EEDECF] hover:border-[#BA7A83] hover:bg-[#FFFDFC]'
                        }`}
                      >
                        <span
                          className={`font-jakarta text-[12.5px] transition-colors ${
                            isChecked ? 'text-[#804E55] font-semibold' : 'text-[#2C2523] font-normal'
                          }`}
                        >
                          {range.label}
                        </span>
                        {isChecked && (
                          <Check className="w-4 h-4 text-[#BA7A83] stroke-[2.5] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BUTTONS: XEM KẾT QUẢ REALTIME & ĐẶT LẠI */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileFilterOpen(false);
                    if (gridTopRef.current) {
                      gridTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    showToast(`Tìm thấy ${filteredProducts.length} thiết kế phù hợp`);
                  }}
                  className="w-full py-3 rounded-[14px] bg-[#BA7A83] hover:bg-[#a86a73] text-white font-jakarta text-[12.5px] font-semibold tracking-[0.8px] uppercase flex items-center justify-center gap-2 transition-all shadow-[0px_4px_16px_rgba(186,122,131,0.25)] border-0 cursor-pointer active:scale-[0.98]"
                >
                  <div className="w-4 h-4 rounded-full border border-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3] text-white" />
                  </div>
                  <span>Xem {filteredProducts.length} Thiết Kế</span>
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="w-full py-2.5 rounded-[14px] bg-[#FFF5F2] hover:bg-[#FDECE6] text-[#B8737D] font-jakarta text-[12px] font-semibold transition-all border border-[#EEDECF] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Đặt lại tất cả ({activeFiltersCount})</span>
                  </button>
                )}
              </div>
            </aside>

            {/* CỘT CHÍNH: LƯỚI SẢN PHẨM & THANH SẮP XẾP */}
            <div ref={gridTopRef} className="lg:col-span-8 xl:col-span-9 flex flex-col scroll-mt-6">

              {/* TOP BAR: SỐ LƯỢNG + VIEW SWITCHER + SORT SELECT */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[#E6DAC8]/60">
                <div className="font-jakarta text-[13px] text-[#514344]">
                  Đang hiển thị: <strong className="text-[#2C2523] font-bold text-[14px]">{paginatedProducts.length}</strong> / {filteredProducts.length} thiết kế lộng lẫy
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {/* Grid View Mode Toggle */}
                  <div className="hidden sm:flex items-center gap-1 border border-[#E6DAC8] bg-white p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setGridCols(2)}
                      className={`p-1.5 rounded transition-all cursor-pointer border-0 ${
                        gridCols === 2 ? 'bg-[#FAF0EC] text-[#B8737D]' : 'bg-transparent text-[#847374] hover:text-[#2C2523]'
                      }`}
                      title="Xem ảnh lớn (2 cột)"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setGridCols(3)}
                      className={`p-1.5 rounded transition-all cursor-pointer border-0 ${
                        gridCols === 3 ? 'bg-[#FAF0EC] text-[#B8737D]' : 'bg-transparent text-[#847374] hover:text-[#2C2523]'
                      }`}
                      title="Xem lưới chuẩn (3 cột)"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="font-jakarta text-[12.5px] text-[#847374]">
                      Sắp xếp:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[#E6DAC8] bg-white text-[#2C2523] font-jakarta text-[12.5px] focus:outline-none focus:border-[#B8737D] cursor-pointer shadow-xs"
                    >
                      <option value="popular">Phổ biến nhất</option>
                      <option value="newest">Mới nhất 2026</option>
                      <option value="price-asc">Giá: Thấp đến cao</option>
                      <option value="price-desc">Giá: Cao đến thấp</option>
                      <option value="rating">Đánh giá cao nhất</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* GRID SẢN PHẨM VÁY CƯỚI */}
              {paginatedProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E6DAC8] p-12 text-center my-6">
                  <div className="w-16 h-16 rounded-full bg-[#FFF7F5] flex items-center justify-center text-[#B8737D] mx-auto mb-4">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="font-playfair text-[20px] font-semibold text-[#2C2523] mb-2">
                    Không tìm thấy thiết kế phù hợp
                  </h3>
                  <p className="font-jakarta text-[13px] text-[#514344] max-w-[420px] mx-auto mb-6">
                    Hãy thử nới lỏng bộ lọc hoặc xóa từ khóa tìm kiếm để khám phá toàn bộ bộ sưu tập váy cưới UniBridal.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-6 py-2.5 rounded-xl bg-[#B8737D] text-white font-jakarta text-[13px] font-medium border-0 cursor-pointer shadow-sm hover:bg-[#a6626c] transition-all"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              ) : (
                <div className={`grid grid-cols-1 ${gridCols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'} gap-6`}>
                  {paginatedProducts.map((dress) => {
                    const isWishlisted = Boolean(
                      Array.isArray(wishlistIds) &&
                      wishlistIds.some((w) => {
                        const wId = typeof w === 'object' && w !== null ? w?.id : w;
                        return String(wId) === String(dress.id) || (dress.code && String(wId) === String(dress.code));
                      })
                    );

                    return (
                      <div
                        key={dress.id}
                        onClick={() => navigate(`/dresses/${dress.id}`)}
                        className="bg-white border border-[#EEDECF] rounded-[24px] overflow-hidden shadow-[0px_4px_20px_rgba(201,138,144,0.06)] hover:shadow-[0px_12px_32px_rgba(184,115,125,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                      >
                        {/* Hình ảnh & Badges */}
                        <div className="relative w-full h-[380px] bg-[#FCEEE9] overflow-hidden rounded-t-[23px]">
                          <img
                            src={dress.image}
                            alt={dress.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Left Badges */}
                          <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
                            <span className="px-2.5 py-1 rounded-[6px] bg-white text-[#2C2523] font-jakarta font-bold text-[9px] tracking-[0.8px] shadow-xs">
                              {dress.badgeMain}
                            </span>
                            {dress.badgeSub && (
                              <span className="px-2.5 py-1 rounded-[6px] bg-[#BA7A83] text-white font-jakarta font-semibold text-[9px] tracking-wide shadow-xs">
                                {dress.badgeSub}
                              </span>
                            )}
                          </div>

                          {/* Right Heart Wishlist Button - Chỉ hiển thị khi đã đăng nhập */}
                          {isLoggedIn && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleWishlist(dress.id);
                              }}
                              className={`absolute top-3.5 right-3.5 w-[34px] h-[34px] rounded-[8px] bg-white flex items-center justify-center border shadow-[0px_2px_8px_rgba(0,0,0,0.06)] cursor-pointer z-10 transition-all duration-200 active:scale-90 p-0 ${
                                isWishlisted
                                  ? 'border-red-200 bg-red-50/70 text-red-500'
                                  : 'border-[#EEDECF] text-[#4A3E3F] hover:text-red-500 hover:border-red-200'
                              }`}
                              style={{ borderRadius: '8px' }}
                              title={isWishlisted ? 'Bỏ yêu thích' : 'Yêu thích'}
                            >
                              <Heart
                                className={`w-4 h-4 transition-all duration-200 ${
                                  isWishlisted ? 'fill-red-500 text-red-500 scale-110' : 'text-[#4A3E3F]'
                                }`}
                              />
                            </button>
                          )}

                          {/* Quick Fitting Button on Hover */}
                          <div className="absolute inset-x-4 bottom-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFitting(dress);
                              }}
                              className="px-4 py-2 rounded-xl bg-white/95 hover:bg-white text-[#733F49] font-jakarta text-[12px] font-bold tracking-wide shadow-lg border border-[#EEDECF] flex items-center gap-1.5 cursor-pointer backdrop-blur-sm transition-all"
                            >
                              <Calendar className="w-3.5 h-3.5 text-[#B8737D]" />
                              <span>Đặt lịch thử tại Showroom</span>
                            </button>
                          </div>

                          {/* Logo UniBridal cộp phóng watermark ở góc ảnh */}
                          <div
                            className="absolute bottom-3 right-3.5 z-10 pointer-events-none select-none transition-transform duration-300 group-hover:scale-110"
                            title="UniBridal Haute Couture"
                          >
                            <img
                              src={logoEmblemImg}
                              alt="UniBridal Emblem"
                              className="w-[42px] h-[42px] object-contain drop-shadow-[0px_2px_6px_rgba(0,0,0,0.35)]"
                            />
                          </div>
                        </div>

                        {/* Thông Tin Chi Tiết Thẻ */}
                        <div className="p-5 flex flex-col flex-1">
                          {/* Rating & Size Row */}
                          <div className="flex items-center justify-between text-[11.5px] font-jakarta mb-1">
                            <div className="flex items-center gap-1.5 text-[#2C2523]">
                              <span className="text-[#C68A4C] text-[13px] leading-none">★</span>
                              <span className="font-bold text-[12px]">{Number(dress.rating || 4.9).toFixed(1)}</span>
                              <span className="text-[#695C4E] font-medium text-[11.5px] ml-0.5">
                                ({dress.rentCount})
                              </span>
                            </div>

                            {dress.id === 6 ? (
                              <div className="text-right leading-tight text-[#514344] font-semibold text-[11px] tracking-wider uppercase">
                                <div>Size: Custom</div>
                                <div className="mt-0.5">Fit</div>
                              </div>
                            ) : (
                              <span className="text-[#514344] font-semibold uppercase tracking-wider text-[11px]">
                                {dress.size}
                              </span>
                            )}
                          </div>

                          {/* Tên Thiết Kế - Căn giữa tự nhiên giữa Size và Giá tiền khi tên chỉ có 1 dòng */}
                          <div className="min-h-[54px] flex items-center my-1.5">
                            <h3 className="font-playfair text-[21px] sm:text-[22px] font-semibold text-[#2C2523] group-hover:text-[#BA7A83] transition-colors leading-[1.25] tracking-tight line-clamp-2 m-0 text-left">
                              {dress.name}
                            </h3>
                          </div>

                          {/* Giá Thuê & Tiền Cọc - Đặt sát tự nhiên ngay dưới tên sản phẩm */}
                          <div className="mb-3.5">
                            <div className="flex items-baseline gap-1.5 mb-1">
                              <span className="font-playfair font-bold text-[26px] sm:text-[28px] leading-tight text-[#BA7A83] tracking-tight">
                                {formatCurrencyVND(dress.priceNumber || dress.price)}
                              </span>
                              <span className="font-jakarta text-[12px] font-medium text-[#695C4E] ml-1">
                                / 1 ngày
                              </span>
                            </div>

                            <p className="font-jakarta text-[11.5px] leading-[17px] text-[#695C4E] m-0">
                              Tiền cọc bảo lãnh: <strong className="font-semibold text-[#2C2523]">{formatCurrencyVND(dress.depositAmount)}</strong>
                              <br />
                              <span className="text-[#7A6B6C]">{dress.depositPolicy || '(Hoàn cọc tức thì)'}</span>
                            </p>
                          </div>

                          {/* Nút Bấm: Thêm Vào Giỏ & Thuê Ngay (Đẩy sát đáy card với mt-auto) */}
                          <div className="mt-auto pt-1">
                            {isLoggedIn ? (
                              <div className="grid grid-cols-2 gap-2.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(dress);
                                  }}
                                  className="w-full py-2.5 rounded-[10px] bg-white border border-[#BA7A83] text-[#BA7A83] font-jakarta text-[12.5px] font-semibold tracking-wide hover:bg-[#FFF9F6] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                                >
                                  Thêm Vào Giỏ
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRentNow(dress);
                                  }}
                                  className="w-full py-2.5 rounded-[10px] bg-[#804E55] hover:bg-[#6D3940] text-white font-jakarta text-[12.5px] font-semibold tracking-wide transition-all cursor-pointer border-0 shadow-xs active:scale-[0.98]"
                                >
                                  Thuê Ngay
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRentNow(dress);
                                  }}
                                  className="w-full py-2.5 rounded-[10px] bg-[#804E55] hover:bg-[#6D3940] text-white font-jakarta text-[12.5px] font-semibold tracking-wide transition-all cursor-pointer border-0 shadow-xs active:scale-[0.98]"
                                >
                                  Thuê Ngay
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              {/* PHÂN TRANG (PAGINATION) */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-1.5 sm:gap-2">
                  {/* Nút Trước (<) */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center border border-[#E6DAC8] bg-white text-[#2C2523] hover:border-[#BA7A83] hover:text-[#BA7A83] disabled:opacity-35 disabled:pointer-events-none transition-all cursor-pointer p-0 shadow-xs"
                    style={{ borderRadius: '10px' }}
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Nút Trang 1 */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(1)}
                    className={`w-[34px] h-[34px] rounded-[10px] font-jakarta text-[13px] flex items-center justify-center cursor-pointer transition-all ${
                      currentPage === 1
                        ? 'bg-[#BA7A83] text-white font-bold shadow-xs border-0'
                        : 'bg-white text-[#2C2523] font-medium border border-[#E6DAC8] hover:border-[#BA7A83] hover:text-[#BA7A83]'
                    }`}
                    style={{ borderRadius: '10px' }}
                  >
                    1
                  </button>

                  {/* Nút Trang 2 */}
                  {totalPages >= 2 && (
                    <button
                      type="button"
                      onClick={() => handlePageChange(2)}
                      className={`w-[34px] h-[34px] rounded-[10px] font-jakarta text-[13px] flex items-center justify-center cursor-pointer transition-all ${
                        currentPage === 2
                          ? 'bg-[#BA7A83] text-white font-bold shadow-xs border-0'
                          : 'bg-white text-[#2C2523] font-medium border border-[#E6DAC8] hover:border-[#BA7A83] hover:text-[#BA7A83]'
                      }`}
                      style={{ borderRadius: '10px' }}
                    >
                      2
                    </button>
                  )}

                  {/* Nút Trang 3 */}
                  {totalPages >= 3 && (
                    <button
                      type="button"
                      onClick={() => handlePageChange(3)}
                      className={`w-[34px] h-[34px] rounded-[10px] font-jakarta text-[13px] flex items-center justify-center cursor-pointer transition-all ${
                        currentPage === 3
                          ? 'bg-[#BA7A83] text-white font-bold shadow-xs border-0'
                          : 'bg-white text-[#2C2523] font-medium border border-[#E6DAC8] hover:border-[#BA7A83] hover:text-[#BA7A83]'
                      }`}
                      style={{ borderRadius: '10px' }}
                    >
                      3
                    </button>
                  )}

                  {/* Dynamic Pages ở giữa */}
                  {currentPage > 3 && currentPage < totalPages && (
                    <>
                      {currentPage > 4 && (
                        <span className="px-1 text-[#847374] font-jakarta text-[13px]">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage)}
                        className="w-[34px] h-[34px] rounded-[10px] font-jakarta text-[13px] flex items-center justify-center cursor-pointer transition-all bg-[#BA7A83] text-white font-bold shadow-xs border-0"
                        style={{ borderRadius: '10px' }}
                      >
                        {currentPage}
                      </button>
                      {currentPage < totalPages - 1 && (
                        <span className="px-1 text-[#847374] font-jakarta text-[13px]">...</span>
                      )}
                    </>
                  )}

                  {/* Dấu chấm lửng khi không ở giữa */}
                  {(currentPage <= 3 || currentPage === totalPages) && totalPages > 4 && (
                    <span className="px-1 text-[#847374] font-jakarta text-[13px]">...</span>
                  )}

                  {/* Nút Trang cuối */}
                  {totalPages > 3 && (
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      className={`w-[34px] h-[34px] rounded-[10px] font-jakarta text-[13px] flex items-center justify-center cursor-pointer transition-all ${
                        currentPage === totalPages
                          ? 'bg-[#BA7A83] text-white font-bold shadow-xs border-0'
                          : 'bg-white text-[#2C2523] font-medium border border-[#E6DAC8] hover:border-[#BA7A83] hover:text-[#BA7A83]'
                      }`}
                      style={{ borderRadius: '10px' }}
                    >
                      {totalPages}
                    </button>
                  )}

                  {/* Nút Tiếp Theo (>) */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-[34px] px-3.5 rounded-[10px] flex items-center gap-1.5 border border-[#E6DAC8] bg-white text-[#2C2523] hover:border-[#BA7A83] hover:text-[#BA7A83] disabled:opacity-35 disabled:pointer-events-none transition-all cursor-pointer font-jakarta text-[12.5px] font-medium shadow-xs"
                    style={{ borderRadius: '10px' }}
                    title="Trang tiếp theo"
                  >
                    <span>Tiếp theo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>

      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Booking Consultation Modal */}


    </div>
  );
}
