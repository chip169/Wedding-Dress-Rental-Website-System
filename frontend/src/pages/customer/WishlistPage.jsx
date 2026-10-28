import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, ShoppingBag, ArrowRight, Sparkles, X, ChevronRight, Check, Trash2
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import BookingModal from '../../components/common/BookingModal';
import {
  getWishlistDresses,
  getWishlistIds,
  removeFromWishlist,
  clearWishlist,
  toggleWishlist,
  WISHLIST_EVENT,
  RECOMMENDED_DRESSES,
} from '../../services/wishlistService';
import { addToCart } from '../../services/cartService';

export default function WishlistPage() {
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState(() => getWishlistDresses());
  const [wishlistIds, setWishlistIds] = useState(() => getWishlistIds());
  const [toastMessage, setToastMessage] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Lắng nghe sự kiện thay đổi Wishlist từ các trang khác hoặc cùng trang
  useEffect(() => {
    const handleWishlistChange = () => {
      setWishlistItems(getWishlistDresses());
      setWishlistIds(getWishlistIds());
    };

    window.addEventListener(WISHLIST_EVENT, handleWishlistChange);
    window.addEventListener('storage', handleWishlistChange);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, handleWishlistChange);
      window.removeEventListener('storage', handleWishlistChange);
    };
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Xóa khỏi danh sách yêu thích
  const handleRemoveItem = (id, name) => {
    removeFromWishlist(id);
    showToast(`Đã xóa "${name}" khỏi tủ đồ trong mơ`);
  };

  // Thêm / gỡ yêu thích cho các sản phẩm gợi ý
  const handleToggleRecommended = (item) => {
    const result = toggleWishlist(item.id);
    if (result.isAdded) {
      showToast(`Đã thêm "${item.name}" vào tủ đồ trong mơ ♥`);
    } else {
      showToast(`Đã xóa "${item.name}" khỏi tủ đồ trong mơ`);
    }
  };

  // Thêm vào giỏ thuê
  const handleAddToCart = (dress) => {
    const added = addToCart(dress);
    showToast(
      added
        ? `Đã thêm "${dress.name}" vào giỏ thuê váy thành công!`
        : `"${dress.name}" đã có trong giỏ thuê váy.`
    );
  };

  // Thuê ngay -> Chuyển đến checkout
  const handleRentNow = (dress) => {
    addToCart(dress);
    navigate(`/checkout?dressId=${dress.id}`);
  };

  // Thêm tất cả sản phẩm trong Wishlist vào giỏ thuê hàng
  const handleAddAllToCart = () => {
    if (!wishlistItems || wishlistItems.length === 0) return;
    let addedCount = 0;
    wishlistItems.forEach((dress) => {
      const added = addToCart(dress);
      if (added) addedCount++;
    });
    if (addedCount > 0) {
      showToast(`Đã thêm ${addedCount} tuyệt tác vào giỏ thuê thành công!`);
    } else {
      showToast('Tất cả sản phẩm yêu thích đã có trong giỏ thuê váy.');
    }
  };

  // Xóa toàn bộ sản phẩm khỏi Wishlist
  const handleClearAll = () => {
    if (!wishlistItems || wishlistItems.length === 0) return;
    clearWishlist();
    showToast('Đã xóa tất cả sản phẩm khỏi danh sách yêu thích');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#2C2523] flex flex-col font-jakarta selection:bg-[#FCEEE9] selection:text-[#B8737D]">
      {/* 1. Header */}
      <Header
        wishlistCount={wishlistItems.length}
        onOpenBooking={() => setIsBookingOpen(true)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 bg-[#2C2523] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-[#B8737D]/40 animate-bounce text-[13px] font-medium max-w-[420px]">
          <Sparkles className="w-4 h-4 text-[#E8B6BC] shrink-0" />
          <span className="flex-1">{toastMessage}</span>
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
      <main className="flex-1 w-full pb-24">
        {/* HERO SECTION / BANNER TỦ ĐỒ TRONG MƠ */}
        <section className="pt-10 pb-6 px-6 sm:px-8 border-b border-[#EAE0DC]/60">
          <div className="max-w-[1280px] mx-auto">
            {/* Tag Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#F3D8D8] shadow-xs mb-3.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8737D]"></span>
              <span className="font-jakarta font-bold text-[10.5px] uppercase tracking-[1.4px] text-[#B8737D]">
                THE DREAM CLOSET WISHLIST
              </span>
            </div>

            {/* Title & Stats Pill Row */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6">
              <div>
                <h1 className="font-playfair text-[36px] sm:text-[44px] md:text-[50px] font-normal leading-[1.15] text-[#2C2523] m-0 mb-3">
                  Tủ Đồ Trong Mơ <span className="text-[#B8737D] italic font-serif">Của Nàng Dâu</span>
                </h1>
                <p className="font-jakarta text-[13.5px] sm:text-[14.5px] leading-[22px] text-[#514344] max-w-[680px] m-0">
                  Nơi nàng lưu lại hội tụ những tuyệt tác váy cưới độc bản nàng đã chọn lựa.
                  <br className="hidden sm:inline" />
                  Từng đường kim, lớp voan lụa đều sẵn sàng tỏa sáng cùng nàng bước vào khoảnh khắc thiêng liêng nhất.
                </p>
              </div>

              {/* Nhóm nút bên phải: Badge trạng thái + Thêm tất cả vào giỏ hàng + Xóa tất cả */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
                {/* Pill badge: Đang lưu {count} tuyệt tác */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#804E55] text-white font-jakarta text-[12.5px] font-medium shadow-sm">
                  <Heart className="w-4 h-4 fill-white text-white" />
                  <span>
                    {wishlistItems.length > 0 ? (
                      <>
                        Đang lưu <strong className="font-bold">{wishlistItems.length}</strong> tuyệt tác đắt giá
                      </>
                    ) : (
                      <span>Không có sản phẩm yêu thích nào</span>
                    )}
                  </span>
                </div>

                {wishlistItems.length > 0 && (
                  <>
                    {/* Nút 1: Thêm tất cả vào giỏ hàng */}
                    <button
                      type="button"
                      onClick={handleAddAllToCart}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#FFF7F5] border border-[#804E55]/30 text-[#804E55] font-jakarta text-[12.5px] font-semibold tracking-wide transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Thêm tất cả sản phẩm vào giỏ thuê"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Thêm tất cả vào giỏ hàng</span>
                    </button>

                    {/* Nút 2: Xóa tất cả */}
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#FFF0F0] border border-[#E0BCBC] text-[#B84E59] hover:text-[#963740] font-jakarta text-[12.5px] font-semibold tracking-wide transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Xóa tất cả sản phẩm khỏi yêu thích"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa tất cả</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Sub-filter tab */}
            <div className="flex items-center gap-3 pt-2">
              <div className="px-4 py-1.5 rounded-full bg-white border border-[#E6DAC8] text-[#2C2523] font-jakarta text-[12.5px] font-medium shadow-xs flex items-center gap-2">
                <span>Tất cả mẫu yêu thích</span>
                <span className="w-5 h-5 rounded-full bg-[#FCEEE9] text-[#B8737D] text-[11px] font-bold flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CONTAINER CHÍNH */}
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 mt-8">
          {/* TRƯỜNG HỢP: DANH SÁCH RỖNG */}
          {wishlistItems.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-[#EEDECF] p-12 sm:p-16 text-center my-8 shadow-xs">
              <div className="w-20 h-20 rounded-full bg-[#FFF5F3] flex items-center justify-center text-[#B8737D] mx-auto mb-5 border border-[#F4DDD8]">
                <Heart className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="font-playfair text-[24px] sm:text-[28px] font-semibold text-[#2C2523] mb-3">
                Không có sản phẩm yêu thích nào
              </h3>
              <p className="font-jakarta text-[14px] text-[#695C4E] max-w-[480px] mx-auto mb-8 leading-relaxed">
                Nàng chưa lưu mẫu thiết kế nào vào danh sách yêu thích. Hãy khám phá bộ sưu tập và chọn những chiếc váy cưới ưng ý nhất cho ngày trọng đại!
              </p>
              <Link
                to="/collection"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#804E55] hover:bg-[#6D3940] text-white font-jakarta text-[13.5px] font-semibold tracking-wide no-underline transition-all shadow-md active:scale-95"
              >
                <span>Khám Phá Bộ Sưu Tập</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* LƯỚI 3 CỘT: CÁC MẪU VÁY ĐÃ LƯU TRONG WISHLIST (Chuẩn 100% Screenshot) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {wishlistItems.map((dress) => (
                <div
                  key={dress.id}
                  onClick={() => navigate(`/dresses/${dress.id}`)}
                  className="bg-white border border-[#EEDECF] rounded-[24px] overflow-hidden shadow-[0px_4px_20px_rgba(201,138,144,0.06)] hover:shadow-[0px_12px_32px_rgba(184,115,125,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  {/* Ảnh Váy Cưới & Nút Trái Tim Xóa Yêu Thích */}
                  <div className="relative w-full h-[390px] bg-[#FCEEE9] overflow-hidden rounded-t-[23px]">
                    <img
                      src={dress.image}
                      alt={dress.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Nút Trái Tim Bo Góc 10px (Squircle) - Filled Đỏ/Burgundy */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(dress.id, dress.name);
                      }}
                      className="absolute top-3.5 right-3.5 w-[36px] h-[36px] rounded-[10px] bg-white flex items-center justify-center border border-[#EEDECF] shadow-[0px_2px_8px_rgba(0,0,0,0.08)] cursor-pointer z-10 transition-transform active:scale-90 p-0"
                      title="Bỏ yêu thích"
                    >
                      <Heart className="w-4 h-4 fill-[#804E55] text-[#804E55]" />
                    </button>
                  </div>

                  {/* Thông Tin Chi Tiết Thẻ */}
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Dòng Category & Size */}
                      <div className="text-[10.5px] font-jakarta font-semibold tracking-wider text-[#8A7978] uppercase mb-1.5 flex items-center justify-between">
                        <span className="truncate max-w-[200px]">
                          {dress.categoryBadge || dress.categoryName || 'VÁY CƯỚI CAO CẤP'}
                        </span>
                        <span>•</span>
                        <span className="shrink-0">{dress.size || 'SIZE S / M'}</span>
                      </div>

                      {/* Tên Thiết Kế */}
                      <h3 className="font-playfair text-[21px] sm:text-[22px] font-semibold text-[#2C2523] group-hover:text-[#BA7A83] transition-colors leading-[1.25] tracking-tight mb-2 min-h-[54px] flex items-center">
                        {dress.name}
                      </h3>

                      {/* Giá Thuê */}
                      <div className="flex items-baseline gap-1.5 mb-4">
                        <span className="font-playfair font-bold text-[24px] sm:text-[26px] leading-tight text-[#804E55] tracking-tight">
                          {dress.priceFormatted || dress.price}
                        </span>
                        <span className="font-jakarta text-[12px] font-medium text-[#8A7978]">
                          / ngày
                        </span>
                      </div>
                    </div>

                    {/* 2 Nút Bấm: Thêm Vào Giỏ & Thuê Ngay */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(dress);
                        }}
                        className="w-full py-2.5 rounded-[10px] bg-white border border-[#804E55]/60 text-[#804E55] font-jakarta text-[12px] font-semibold tracking-wide hover:bg-[#FFF9F6] transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Thêm Vào Giỏ</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRentNow(dress);
                        }}
                        className="w-full py-2.5 rounded-[10px] bg-[#804E55] hover:bg-[#6D3940] text-white font-jakarta text-[12px] font-semibold tracking-wide transition-all cursor-pointer border-0 shadow-xs active:scale-[0.98]"
                      >
                        Thuê Ngay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= SECTION: CÓ THỂ NÀNG CŨNG YÊU THÍCH (RECOMMENDED FOR YOU) ================= */}
          <section className="mt-20 pt-14 border-t border-[#EAE0DC]">
            {/* Header gợi ý */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="font-jakarta font-bold text-[10.5px] tracking-[2px] uppercase text-[#B8737D] block mb-1">
                  RECOMMENDED FOR YOU
                </span>
                <h2 className="font-playfair text-[28px] sm:text-[34px] leading-tight font-semibold text-[#2C2523] m-0 mb-1.5">
                  Có Thể Nàng Cũng Yêu Thích
                </h2>
                <p className="font-jakarta text-[13.5px] text-[#695C4E] m-0">
                  Những tuyệt tác váy cưới phù hợp với gu thẩm mỹ và phong cách tiệc cưới trong mơ của nàng
                </p>
              </div>

              <Link
                to="/bo-suu-tap"
                className="font-jakarta text-[11.5px] font-bold tracking-[1.5px] uppercase text-[#804E55] hover:text-[#B8737D] no-underline inline-flex items-center gap-1 self-start sm:self-auto transition-colors"
              >
                <span>KHÁM PHÁ THÊM</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Lưới 3 cột gợi ý */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {RECOMMENDED_DRESSES.map((recDress) => {
                const isSaved = wishlistIds.some(
                  (id) => Number(id) === recDress.id || String(id) === String(recDress.id)
                );

                return (
                  <div
                    key={recDress.id}
                    onClick={() => navigate(`/dresses/${recDress.id}`)}
                    className="bg-white border border-[#EEDECF] rounded-[24px] overflow-hidden shadow-[0px_4px_20px_rgba(201,138,144,0.06)] hover:shadow-[0px_12px_32px_rgba(184,115,125,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                  >
                    {/* Hình ảnh & Nút Trái Tim */}
                    <div className="relative w-full h-[390px] bg-[#FCEEE9] overflow-hidden rounded-t-[23px]">
                      <img
                        src={recDress.image}
                        alt={recDress.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Nút Trái Tim: Outline nếu chưa thêm, Filled nếu đã thêm */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRecommended(recDress);
                        }}
                        className="absolute top-3.5 right-3.5 w-[36px] h-[36px] rounded-[10px] bg-white flex items-center justify-center border border-[#EEDECF] shadow-[0px_2px_8px_rgba(0,0,0,0.08)] cursor-pointer z-10 transition-transform active:scale-90 p-0"
                        title={isSaved ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            isSaved
                              ? 'fill-[#804E55] text-[#804E55]'
                              : 'text-[#4A3E3F] hover:text-[#804E55]'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Chi Tiết */}
                    <div className="p-5 flex flex-col flex-1 justify-between">
                      <div>
                        {/* Dòng Category & Size */}
                        <div className="text-[10.5px] font-jakarta font-semibold tracking-wider text-[#8A7978] uppercase mb-1.5 flex items-center justify-between">
                          <span>{recDress.categoryBadge}</span>
                          <span>•</span>
                          <span>{recDress.size}</span>
                        </div>

                        {/* Tên Váy */}
                        <h3 className="font-playfair text-[21px] sm:text-[22px] font-semibold text-[#2C2523] group-hover:text-[#BA7A83] transition-colors leading-[1.25] tracking-tight mb-2 min-h-[54px] flex items-center">
                          {recDress.name}
                        </h3>

                        {/* Mô tả ngắn */}
                        <p className="font-jakarta text-[12px] leading-[18px] text-[#695C4E] mb-3 line-clamp-2">
                          {recDress.description}
                        </p>

                        {/* Giá Thuê */}
                        <div className="flex items-baseline gap-1.5 mb-4">
                          <span className="font-playfair font-bold text-[24px] sm:text-[26px] leading-tight text-[#804E55] tracking-tight">
                            {recDress.priceFormatted}
                          </span>
                          <span className="font-jakarta text-[12px] font-medium text-[#8A7978]">
                            / ngày
                          </span>
                        </div>
                      </div>

                      {/* 2 Nút Bấm */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(recDress);
                          }}
                          className="w-full py-2.5 rounded-[10px] bg-white border border-[#804E55]/60 text-[#804E55] font-jakarta text-[12px] font-semibold tracking-wide hover:bg-[#FFF9F6] transition-all cursor-pointer shadow-xs active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Thêm Vào Giỏ</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRentNow(recDress);
                          }}
                          className="w-full py-2.5 rounded-[10px] bg-[#804E55] hover:bg-[#6D3940] text-white font-jakarta text-[12px] font-semibold tracking-wide transition-all cursor-pointer border-0 shadow-xs active:scale-[0.98]"
                        >
                          Thuê Ngay
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* 3. Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
