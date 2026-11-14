import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Ruler, Calendar, ArrowRight, X, ShieldCheck, HeartHandshake } from 'lucide-react';

export default function OnboardingWelcomeModal({ isOpen, onClose, userName }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoToProfile = () => {
    onClose();
    navigate('/profile#measurements');
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[560px] bg-[#FCFAF7] rounded-3xl border border-[#EADCCF] shadow-[0_24px_60px_rgba(44,37,35,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-[#FAF0EC] text-[#7A6B6A] hover:text-[#733F49] flex items-center justify-center transition-colors border border-[#EEDECF] cursor-pointer z-10"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-[#733F49] via-[#8E525E] to-[#B8737D] px-6 sm:px-8 pt-7 pb-6 text-white text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold tracking-[1.5px] uppercase text-[#FDEEE9] mb-3">
            <Crown className="w-3.5 h-3.5 text-[#FAD2C0]" />
            ĐẶC QUYỀN THÀNH VIÊN ATELIER
          </div>
          <h2 className="font-playfair text-[24px] sm:text-[27px] font-semibold leading-snug m-0 text-white">
            Chào Mừng Nàng Đến UniBridal!
          </h2>
          <p className="font-jakarta text-[13px] text-white/85 mt-2 mb-0 max-w-[420px] mx-auto font-normal leading-relaxed">
            {userName ? `Thân gửi ${userName}, ` : ''}Tài khoản của nàng đã kích hoạt hoàn tất. Hãy cùng UniBridal chuẩn bị chu đáo nhất cho ngày trọng đại nhé!
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-7 space-y-5">
          <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#F0E5DC] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2.5 text-[#733F49] font-playfair font-semibold text-[15px] sm:text-[16px] mb-2">
              <Ruler className="w-4 h-4 text-[#B8737D]" />
              <span>Nàng có muốn cập nhật số đo vóc dáng ngay?</span>
            </div>
            <p className="font-jakarta text-[12.5px] text-[#695C4E] leading-relaxed m-0">
              Cung cấp chiều cao, ngày cưới và số đo 3 vòng giúp chuyên viên tư vấn phom váy chuẩn tỷ lệ, căn chỉnh may đo miễn phí và tự động lập hợp đồng nhanh chóng.
            </p>
          </div>

          {/* 3 Lợi ích nổi bật */}
          <div className="space-y-2.5 text-[12.5px] text-[#4A3D3B] font-jakarta">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#FAF0EC] text-[#B8737D] flex items-center justify-center shrink-0 mt-0.5">
                <Crown className="w-3 h-3" />
              </div>
              <span><strong>Gợi ý phom váy thông minh</strong>: Tự động đề xuất thiết kế tôn dáng nhất.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#FAF0EC] text-[#B8737D] flex items-center justify-center shrink-0 mt-0.5">
                <HeartHandshake className="w-3 h-3" />
              </div>
              <span><strong>Tiết kiệm thời gian thử váy</strong>: Showroom chuẩn bị sẵn váy đúng size tại phòng VIP.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#FAF0EC] text-[#B8737D] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3 h-3" />
              </div>
              <span><strong>Tự động điền đơn thuê</strong>: Không cần nhập lại thông số khi ký hợp đồng điện tử.</span>
            </div>
          </div>

          {/* Actions Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleGoToProfile}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#733F49] hover:bg-[#5D323A] text-white font-jakarta text-[13.5px] font-semibold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer border-0 active:scale-[0.98]"
            >
              <Ruler className="w-4 h-4 text-[#FCEEE9]" />
              <span>Cập Nhật Số Đo Ngay</span>
              <ArrowRight className="w-4 h-4 text-[#FCEEE9]" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white hover:bg-[#FAF0EC] text-[#7A6B6A] hover:text-[#733F49] font-jakarta text-[13px] font-semibold transition-colors border border-[#EEDECF] cursor-pointer active:scale-[0.98]"
            >
              Để Sau, Khám Phá Váy Trước
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

