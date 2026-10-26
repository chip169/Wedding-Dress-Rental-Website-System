import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  Check,
  ShoppingBag,
  Scissors,
  FileText,
  Phone,
  Mail,
  User,
  ShieldCheck,
  QrCode,
  Printer,
  Download,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Crown,
} from 'lucide-react';
import { message } from 'antd';
import { MOCK_DRESSES } from '../../services/dressService';
import { addToCart } from '../../services/cartService';
import { SHOWROOM_BRANCHES, TIME_SLOTS, createAppointment } from '../../services/appointmentService';
import { useAuth } from '../../contexts/AuthContext';

export default function BookingModal({ isOpen, onClose, preselectedProduct, initialMode = 'both' }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mode: 'both' (Thuê & Thử váy) | 'rent' (Chỉ thuê) | 'fitting' (Chỉ thử)
  const [serviceType, setServiceType] = useState(initialMode);

  // Selected dress
  const [selectedDressId, setSelectedDressId] = useState(() => {
    if (preselectedProduct?.id) return String(preselectedProduct.id);
    return '1';
  });

  const activeDress = useMemo(() => {
    if (preselectedProduct) return preselectedProduct;
    return MOCK_DRESSES.find((d) => String(d.id) === String(selectedDressId)) || MOCK_DRESSES[0];
  }, [preselectedProduct, selectedDressId]);

  // Guest information
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [cccd, setCccd] = useState('');
  const [address, setAddress] = useState('');

  // Fitting options
  const [branchId, setBranchId] = useState('hcm-q1');
  const [fittingDate, setFittingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [fittingTimeSlot, setFittingTimeSlot] = useState('13:30 — 15:00');
  const [guestsCount, setGuestsCount] = useState(2);

  // Rental options
  const [rentalStartDate, setRentalStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [weddingDate, setWeddingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 9);
    return d.toISOString().split('T')[0];
  });
  const [rentalEndDate, setRentalEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 11);
    return d.toISOString().split('T')[0];
  });
  const [selectedSize, setSelectedSize] = useState('S');
  const [deliveryMethod, setDeliveryMethod] = useState('direct');

  // Measurements
  const [height, setHeight] = useState('165');
  const [weight, setWeight] = useState('48');
  const [waist, setWaist] = useState('64');
  const [bust, setBust] = useState('84');

  // Notes
  const [notes, setNotes] = useState('');

  // Submitted state
  const [submissionResult, setSubmissionResult] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      message.error('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Email.');
      return;
    }

    const cleanPhone = phone.replace(/[\s.-]/g, '');
    if (!/^[0-9]{9,11}$/.test(cleanPhone)) {
      message.warning('Số điện thoại không hợp lệ (từ 9 đến 11 chữ số).');
      return;
    }

    const requestId = `UB-GUEST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const selectedBranchObj = SHOWROOM_BRANCHES.find((b) => b.id === branchId) || SHOWROOM_BRANCHES[0];

    // If fitting is included, save appointment
    if (serviceType === 'both' || serviceType === 'fitting') {
      createAppointment({
        id: `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        branchId: selectedBranchObj.id,
        branchName: selectedBranchObj.name,
        branchAddress: selectedBranchObj.address,
        branchPhone: selectedBranchObj.phone,
        date: fittingDate,
        timeSlot: fittingTimeSlot,
        guestsCount: Number(guestsCount),
        selectedDresses: [
          {
            id: activeDress.id,
            name: activeDress.name,
            code: activeDress.code || 'UB-HC-2026',
            image: activeDress.images?.[0] || activeDress.image,
          },
        ],
        notes: `Khách vãng lai (Guest). ${notes}`,
      });
    }

    // If rental is included, add to cart
    if (serviceType === 'both' || serviceType === 'rent') {
      addToCart({
        ...activeDress,
        size: selectedSize,
        rentalDays: 4,
        startDate: rentalStartDate,
        endDate: rentalEndDate,
      });
    }

    setSubmissionResult({
      requestId,
      serviceType,
      dress: activeDress,
      fullName,
      phone,
      email,
      branchName: selectedBranchObj.name,
      branchAddress: selectedBranchObj.address,
      fittingDate,
      fittingTimeSlot,
      rentalStartDate,
      rentalEndDate,
      selectedSize,
      depositAmount: Math.round((activeDress.price || 5200000) * 0.5),
    });

    message.success('Đã ghi nhận yêu cầu của nàng thành công!');
  };

  const handleReset = () => {
    setSubmissionResult(null);
    onClose();
  };

  const handleDirectCheckout = () => {
    onClose();
    navigate(`/checkout?dressId=${activeDress.id}&size=${selectedSize}&startDate=${rentalStartDate}&endDate=${rentalEndDate}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-[680px] bg-white rounded-3xl shadow-2xl border border-[#EEDECF] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Top Accent Stripe */}
        <div className="h-2.5 bg-gradient-to-r from-[#733F49] via-[#D4AF37] to-[#B8737D]" />

        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#FAF4EE] border-b border-[#EEDECF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF0EC] flex items-center justify-center text-[#733F49]">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="font-playfair text-[18px] sm:text-[20px] font-bold text-[#2C2523] m-0 leading-tight">
                Phiếu Đăng Ký Thuê & Thử Váy Cho Khách
              </h3>
              <span className="text-[11.5px] text-[#847374] block">
                Dành cho khách chưa có tài khoản • Đặt thuê & Giữ lịch nhanh trong 1 phút
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#514344] hover:bg-white transition-colors border-0 bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[13px]">
          
          {submissionResult ? (
            /* ================= SUBMISSION SUCCESS SCREEN ================= */
            <div className="text-center py-4 space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#B8737D] block mb-1">
                  XÁC NHẬN YÊU CẦU GUEST THÀNH CÔNG
                </span>
                <h4 className="font-playfair text-[24px] sm:text-[28px] font-bold text-[#2C2523] m-0 mb-1">
                  Cảm Ơn Nàng {submissionResult.fullName}!
                </h4>
                <p className="text-[13px] text-[#6B5C5D] max-w-[480px] mx-auto m-0 leading-relaxed">
                  Hệ thống UniBridal đã tiếp nhận thông tin đăng ký của nàng. Chuyên viên sẽ gọi qua số <strong>{submissionResult.phone}</strong> trong vòng 15 phút để hỗ trợ chu đáo.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-[#FAF4EE] p-5 rounded-2xl border border-[#EEDECF] text-left space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#EEDECF]">
                  <span className="text-[#847374] text-[12px]">MÃ YÊU CẦU GUEST:</span>
                  <strong className="font-mono text-[#733F49] text-[14px]">{submissionResult.requestId}</strong>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <img
                    src={submissionResult.dress.images?.[0] || submissionResult.dress.image}
                    alt={submissionResult.dress.name}
                    className="w-14 h-18 object-cover rounded-xl border border-[#EEDECF]"
                  />
                  <div>
                    <div className="font-playfair font-bold text-[15px] text-[#2C2523]">
                      {submissionResult.dress.name}
                    </div>
                    <div className="text-[11.5px] text-[#847374]">
                      Mã: {submissionResult.dress.code || 'UB-HC-2026'} • Size: {submissionResult.selectedSize}
                    </div>
                    <div className="text-[12px] font-bold text-[#733F49] mt-0.5">
                      Giá thuê: {Number(submissionResult.dress.price).toLocaleString('vi-VN')}₫ / gói 4 ngày
                    </div>
                  </div>
                </div>

                {(submissionResult.serviceType === 'both' || submissionResult.serviceType === 'fitting') && (
                  <div className="p-3 rounded-xl bg-white border border-[#EEDECF] text-[12px] space-y-1">
                    <div className="font-bold text-[#2E7D32] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>LỊCH HẸN THỬ VÁY TẠI SHOWROOM:</span>
                    </div>
                    <div className="text-[#2C2523] font-medium">
                      {submissionResult.fittingTimeSlot} • Ngày: {submissionResult.fittingDate}
                    </div>
                    <div className="text-[#6B5C5D] text-[11px]">
                      {submissionResult.branchName} ({submissionResult.branchAddress})
                    </div>
                  </div>
                )}

                {(submissionResult.serviceType === 'both' || submissionResult.serviceType === 'rent') && (
                  <div className="p-3 rounded-xl bg-white border border-[#EEDECF] text-[12px] space-y-1">
                    <div className="font-bold text-[#733F49] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ĐẶT CỌC GIỮ LỊCH THUÊ:</span>
                    </div>
                    <div className="text-[#2C2523]">
                      Tiền cọc giữ lịch 50%: <strong>{submissionResult.depositAmount.toLocaleString('vi-VN')}₫</strong> (Quét mã VietQR Techcombank)
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {(submissionResult.serviceType === 'both' || submissionResult.serviceType === 'rent') && (
                  <button
                    type="button"
                    onClick={handleDirectCheckout}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-0 shadow-xs"
                  >
                    <span>Ký Hợp Đồng & Thanh Toán Cọc Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#EEDECF] text-[#2C2523] text-[12.5px] font-bold hover:bg-[#FAF0EC] transition-colors cursor-pointer"
                >
                  Hoàn Tất & Đóng
                </button>
              </div>

            </div>
          ) : (
            /* ================= GUEST FORM INPUTS ================= */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* 1. Chọn Nhu Cầu Của Guest */}
              <div>
                <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-2">
                  1. CHỌN NHU CẦU CỦA NÀNG *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'both', title: 'Thuê & Thử Váy', sub: 'Khuyên dùng cho cô dâu' },
                    { id: 'rent', title: 'Chỉ Đặt Thuê Váy', sub: 'Giao tận nơi / Lấy tiệm' },
                    { id: 'fitting', title: 'Chỉ Thử Tại Tiệm', sub: 'Suite riêng 90 phút' },
                  ].map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => setServiceType(tab.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all text-center ${
                        serviceType === tab.id
                          ? 'border-[#733F49] bg-[#FAF3F0] ring-1 ring-[#733F49] shadow-2xs'
                          : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-[13px] text-[#2C2523]">{tab.title}</div>
                      <div className="text-[10.5px] text-[#847374] mt-0.5">{tab.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Mẫu Váy Quan Tâm */}
              <div className="bg-[#FAF4EE] p-3.5 rounded-2xl border border-[#EEDECF]">
                <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-2">
                  2. MẪU VÁY CƯỚI NÀNG QUAN TÂM *
                </label>
                
                {preselectedProduct ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={preselectedProduct.images?.[0] || preselectedProduct.image}
                      alt={preselectedProduct.name}
                      className="w-12 h-16 object-cover rounded-xl border border-[#EEDECF] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-playfair font-bold text-[15px] text-[#2C2523] truncate">
                        {preselectedProduct.name}
                      </div>
                      <div className="text-[11.5px] text-[#733F49] font-medium">
                        Giá thuê: {Number(preselectedProduct.price).toLocaleString('vi-VN')}₫ • Cọc: {Number(preselectedProduct.depositAmount || 15000000).toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedDressId}
                    onChange={(e) => setSelectedDressId(e.target.value)}
                    className="w-full bg-white border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                  >
                    {MOCK_DRESSES.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.price.toLocaleString('vi-VN')}₫ (Mã: {d.code})
                      </option>
                    ))}
                  </select>
                )}

                <div className="mt-3 flex items-center justify-between gap-3 pt-2.5 border-t border-[#EEDECF]/60">
                  <span className="text-[11.5px] text-[#6B5C5D]">Size váy mong muốn:</span>
                  <div className="flex items-center gap-1.5">
                    {['XS', 'S', 'M', 'L'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`px-3 py-1 rounded-lg text-[11.5px] font-bold border transition-colors cursor-pointer ${
                          selectedSize === sz
                            ? 'bg-[#733F49] text-white border-[#733F49]'
                            : 'bg-white text-[#2C2523] border-[#EEDECF] hover:bg-[#FAF0EC]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Thông Tin Khách Hàng (Guest) */}
              <div>
                <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-2">
                  3. THÔNG TIN KHÁCH HÀNG (GUEST INFO) *
                </label>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Họ và tên cô dâu *"
                        className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-[#2C2523] focus:outline-none focus:border-[#733F49] focus:bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Số điện thoại / Zalo *"
                        className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-[#2C2523] focus:outline-none focus:border-[#733F49] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email nhận xác nhận & hợp đồng *"
                        className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-[#2C2523] focus:outline-none focus:border-[#733F49] focus:bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={cccd}
                        onChange={(e) => setCccd(e.target.value)}
                        placeholder="Số CCCD (Lập hợp đồng thuê bảo lãnh)"
                        className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-[#2C2523] focus:outline-none focus:border-[#733F49] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Địa chỉ giao nhận váy hoặc địa chỉ thường trú"
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-[#2C2523] focus:outline-none focus:border-[#733F49] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Lịch Hẹn Thử Váy (Nếu có) */}
              {(serviceType === 'both' || serviceType === 'fitting') && (
                <div className="bg-[#FCF9F6] p-4 rounded-2xl border border-[#EEDECF] space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-[12px] text-[#733F49] uppercase">
                    <Calendar className="w-3.5 h-3.5 text-[#B8737D]" />
                    <span>LỊCH HẸN THỬ VÁY TẠI SHOWROOM</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">CHI NHÁNH SHOWROOM</label>
                      <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-2.5 py-2 text-[12.5px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      >
                        {SHOWROOM_BRANCHES.map((b) => (
                          <option key={b.id} value={b.id}>{b.name.split('—')[1] || b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">NGÀY HẸN THỬ</label>
                      <input
                        type="date"
                        value={fittingDate}
                        onChange={(e) => setFittingDate(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-2.5 py-2 text-[12.5px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">KHUNG GIỜ</label>
                      <select
                        value={fittingTimeSlot}
                        onChange={(e) => setFittingTimeSlot(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-2.5 py-2 text-[12.5px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      >
                        <option value="09:00 — 10:30">09:00 — 10:30 (Sáng)</option>
                        <option value="11:00 — 12:30">11:00 — 12:30 (Trưa)</option>
                        <option value="13:30 — 15:00">13:30 — 15:00 (Khuyên dùng)</option>
                        <option value="15:30 — 17:00">15:30 — 17:00 (Chiều)</option>
                        <option value="18:30 — 20:00">18:30 — 20:00 (Tối VIP)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Lịch Trình Đặt Thuê (Nếu có) */}
              {(serviceType === 'both' || serviceType === 'rent') && (
                <div className="bg-[#FCF9F6] p-4 rounded-2xl border border-[#EEDECF] space-y-3">
                  <div className="flex items-center gap-1.5 font-bold text-[12px] text-[#733F49] uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B8737D]" />
                    <span>LỊCH TRÌNH THUÊ VÁY HÔN LỄ</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">NGÀY BẮT ĐẦU NHẬN</label>
                      <input
                        type="date"
                        value={rentalStartDate}
                        onChange={(e) => setRentalStartDate(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-2.5 py-2 text-[12.5px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] text-[#733F49] block mb-1 font-bold">NGÀY HÔN LỄ CHÍNH</label>
                      <input
                        type="date"
                        value={weddingDate}
                        onChange={(e) => setWeddingDate(e.target.value)}
                        className="w-full bg-white border border-[#F2D8D4] rounded-xl px-2.5 py-2 text-[12.5px] text-[#733F49] font-bold focus:outline-none focus:border-[#733F49]"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">NGÀY HOÀN TRẢ VÁY</label>
                      <input
                        type="date"
                        value={rentalEndDate}
                        onChange={(e) => setRentalEndDate(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-2.5 py-2 text-[12.5px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Số đo ước tính & Ghi chú */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10.5px] text-[#847374] block mb-1">CHIỀU CAO (CM)</label>
                  <input
                    type="text"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-lg px-2.5 py-1.5 text-[12.5px] text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] text-[#847374] block mb-1">CÂN NẶNG (KG)</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-lg px-2.5 py-1.5 text-[12.5px] text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] text-[#847374] block mb-1">VÒNG 1 (NGỰC)</label>
                  <input
                    type="text"
                    value={bust}
                    onChange={(e) => setBust(e.target.value)}
                    className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-lg px-2.5 py-1.5 text-[12.5px] text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] text-[#733F49] block mb-1 font-bold">VÒNG 2 (EO CORSET)</label>
                  <input
                    type="text"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    className="w-full bg-[#FAF0EC] border border-[#F2D8D4] rounded-lg px-2.5 py-1.5 text-[12.5px] text-center font-bold text-[#733F49]"
                  />
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm cho chuyên viên Atelier (yêu cầu lúp voan, mượn trang sức, chỉnh eo...)"
                  className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2 text-[12.5px] text-[#2C2523] focus:outline-none focus:border-[#733F49] resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white font-jakarta font-bold text-[13px] tracking-wider uppercase transition-all shadow-[0_4px_16px_rgba(115,63,73,0.3)] hover:shadow-[0_6px_22px_rgba(115,63,73,0.4)] cursor-pointer border-0 flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>XÁC NHẬN GỬI YÊU CẦU CHO GUEST</span>
                </button>
                <div className="text-center text-[11px] text-[#847374] mt-2">
                  ✦ Không bắt buộc tài khoản • Cam kết bảo mật thông tin 100%
                </div>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
