import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';

const BookingModal = ({ isOpen, onClose, preselectedProduct }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    branch: 'hcm',
    date: '2026-10-15',
    timeSlot: '14:00 - 15:30',
    notes: preselectedProduct ? `Quan tâm mẫu: ${preselectedProduct.name}` : '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-[540px] bg-white rounded-2xl shadow-2xl border border-[#E6DAC8] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#FFF7F5] to-[#FCEEE9] border-b border-[#E6DAC8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#B8737D]" />
            <h3 className="font-playfair text-[20px] font-semibold text-[#2C2523] m-0">
              Đặt Lịch Thử Váy Private Suite
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#514344] hover:bg-white/80 transition-colors border-0 bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#FCEEE9] flex items-center justify-center text-[#B8737D] mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-playfair text-[24px] font-bold text-[#2C2523] mb-2">
              Đăng Ký Thành Công!
            </h4>
            <p className="font-jakarta text-[14px] text-[#514344] leading-relaxed max-w-[420px] mb-6">
              Cảm ơn nàng dâu <strong className="text-[#B8737D]">{formData.fullName}</strong>. Chuyên viên tư vấn Private Suite của UniBridal sẽ liên hệ với nàng qua số <strong>{formData.phone}</strong> trong vòng 15 phút để xác nhận khung giờ thử váy riêng tư.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="px-8 py-3 rounded-xl bg-[#B8737D] text-white font-jakarta text-[13px] font-semibold tracking-wider uppercase border-0 cursor-pointer shadow-md hover:bg-[#a6626c] transition-all"
            >
              Hoàn Tất
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {preselectedProduct && (
              <div className="p-3 rounded-xl bg-[#FFF7F5] border border-[#E6DAC8] flex items-center gap-3">
                <img
                  src={preselectedProduct.image}
                  alt={preselectedProduct.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <span className="font-jakarta text-[11px] uppercase tracking-wider text-[#B8737D] font-bold block">
                    Mẫu đã chọn thử
                  </span>
                  <span className="font-playfair text-[15px] font-semibold text-[#2C2523]">
                    {preselectedProduct.name} ({preselectedProduct.price})
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block font-jakarta text-[12px] font-semibold uppercase tracking-wider text-[#2C2523] mb-1.5">
                Họ và tên cô dâu *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Ví dụ: Nguyễn Phương Thảo"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E6DAC8] bg-[#FDFBF7] text-[#2C2523] font-jakarta text-[14px] focus:outline-none focus:border-[#B8737D]"
              />
            </div>

            <div>
              <label className="block font-jakarta text-[12px] font-semibold uppercase tracking-wider text-[#2C2523] mb-1.5">
                Số điện thoại liên hệ *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ví dụ: 0912 345 678"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E6DAC8] bg-[#FDFBF7] text-[#2C2523] font-jakarta text-[14px] focus:outline-none focus:border-[#B8737D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-jakarta text-[12px] font-semibold uppercase tracking-wider text-[#2C2523] mb-1.5">
                  Salon thử váy *
                </label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E6DAC8] bg-[#FDFBF7] text-[#2C2523] font-jakarta text-[13px] focus:outline-none focus:border-[#B8737D]"
                >
                  <option value="hcm">TP. HCM - Quận 1</option>
                  <option value="hn">Hà Nội - Hoàn Kiếm</option>
                </select>
              </div>

              <div>
                <label className="block font-jakarta text-[12px] font-semibold uppercase tracking-wider text-[#2C2523] mb-1.5">
                  Ngày dự kiến thử *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E6DAC8] bg-[#FDFBF7] text-[#2C2523] font-jakarta text-[13px] focus:outline-none focus:border-[#B8737D]"
                />
              </div>
            </div>

            <div>
              <label className="block font-jakarta text-[12px] font-semibold uppercase tracking-wider text-[#2C2523] mb-1.5">
                Khung giờ mong muốn
              </label>
              <select
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E6DAC8] bg-[#FDFBF7] text-[#2C2523] font-jakarta text-[13px] focus:outline-none focus:border-[#B8737D]"
              >
                <option value="09:00 - 10:30">09:00 - 10:30 (Sáng riêng tư)</option>
                <option value="11:00 - 12:30">11:00 - 12:30</option>
                <option value="14:00 - 15:30">14:00 - 15:30 (Khuyên dùng)</option>
                <option value="16:00 - 17:30">16:00 - 17:30</option>
                <option value="18:30 - 20:00">18:30 - 20:00 (Buổi tối VIP)</option>
              </select>
            </div>

            <div>
              <label className="block font-jakarta text-[12px] font-semibold uppercase tracking-wider text-[#2C2523] mb-1.5">
                Ghi chú thêm cho Stylist
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ví dụ: Nàng dâu cần tư vấn thêm phụ kiện lúp cưới, phong cách tiệc ngoài trời..."
                className="w-full px-4 py-2 rounded-xl border border-[#E6DAC8] bg-[#FDFBF7] text-[#2C2523] font-jakarta text-[13px] focus:outline-none focus:border-[#B8737D]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#B8737D] text-white font-jakarta font-bold text-[13px] tracking-wider uppercase shadow-[0px_8px_24px_rgba(201,138,144,0.35)] hover:bg-[#a6626c] transition-all cursor-pointer border-0"
              >
                Xác Nhận Đặt Lịch Thử Váy
              </button>
              <p className="text-center font-jakarta text-[11px] text-[#847374] mt-2 mb-0">
                Miễn phí trải nghiệm phòng thử đồ riêng tư & trà chiều cao cấp.
              </p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default BookingModal;
