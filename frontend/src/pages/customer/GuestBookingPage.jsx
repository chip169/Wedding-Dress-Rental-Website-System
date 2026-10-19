import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
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
  Crown,
} from 'lucide-react';
import { message } from 'antd';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { MOCK_DRESSES } from '../../services/dressService';
import { addToCart } from '../../services/cartService';
import { SHOWROOM_BRANCHES, TIME_SLOTS, createAppointment } from '../../services/appointmentService';

export default function GuestBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDressId = searchParams.get('dressId');

  // Mode: 'both' (Thuê & Thử váy) | 'rent' (Chỉ thuê) | 'fitting' (Chỉ thử)
  const [serviceType, setServiceType] = useState('both');

  // Selected dress
  const [selectedDressId, setSelectedDressId] = useState(initialDressId || '1');

  const activeDress = useMemo(() => {
    return MOCK_DRESSES.find((d) => String(d.id) === String(selectedDressId)) || MOCK_DRESSES[0];
  }, [selectedDressId]);

  // Guest information
  const [fullName, setFullName] = useState('Lê Nguyễn Thảo My');
  const [phone, setPhone] = useState('0938 128 899');
  const [email, setEmail] = useState('thaomy.bride@gmail.com');
  const [cccd, setCccd] = useState('079201019888');
  const [address, setAddress] = useState('120/4 Lê Lai, Phường Bến Thành, Quận 1, TP. HCM');

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

  // Measurements
  const [height, setHeight] = useState('165');
  const [weight, setWeight] = useState('48');
  const [waist, setWaist] = useState('64');
  const [bust, setBust] = useState('84');

  // Notes
  const [notes, setNotes] = useState('');

  // Submitted result state
  const [submissionResult, setSubmissionResult] = useState(null);

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

    window.scrollTo({ top: 0, behavior: 'smooth' });
    message.success('Đã ghi nhận yêu cầu của nàng thành công!');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2523] flex flex-col font-jakarta selection:bg-[#FCEEE9] selection:text-[#B8737D]">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-1 max-w-[1000px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12.5px] text-[#847374] mb-6 print:hidden">
          <Link to="/" className="hover:text-[#B8737D] transition-colors no-underline text-[#847374]">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[#2C2523] font-medium">Đăng Ký Thuê & Thử Váy Cho Khách (Guest)</span>
        </nav>

        {submissionResult ? (
          /* ================= SUCCESS SUBMISSION VIEW ================= */
          <div className="bg-white rounded-3xl border border-[#EEDECF] shadow-[0_16px_50px_rgba(115,63,73,0.1)] p-6 sm:p-10 space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11.5px] font-bold uppercase tracking-[2px] text-[#B8737D] block mb-1">
                TIẾP NHẬN YÊU CẦU THÀNH CÔNG
              </span>
              <h1 className="font-playfair text-[28px] sm:text-[36px] font-bold text-[#2C2523] m-0 mb-2">
                Hân Hạnh Đón Tiếp Nàng {submissionResult.fullName}
              </h1>
              <p className="text-[14px] text-[#6B5C5D] max-w-[560px] mx-auto m-0 leading-relaxed">
                Đơn đăng ký của nàng đã được gửi tới Giám đốc Atelier. Chuyên viên sẽ gọi điện xác nhận qua số <strong>{submissionResult.phone}</strong> trong vòng 15 phút.
              </p>
            </div>

            {/* Confirmation Ticket */}
            <div className="bg-[#FAF4EE] p-6 rounded-2xl border border-[#EEDECF] text-left space-y-4 max-w-[680px] mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#EEDECF]">
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#847374]">
                  MÃ HỒ SƠ GUEST:
                </span>
                <strong className="font-mono text-[#733F49] text-[15px]">{submissionResult.requestId}</strong>
              </div>

              <div className="flex items-center gap-4 py-1">
                <img
                  src={submissionResult.dress.images?.[0] || submissionResult.dress.image}
                  alt={submissionResult.dress.name}
                  className="w-16 h-22 object-cover rounded-xl border border-[#EEDECF] shadow-xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-playfair font-bold text-[17px] text-[#2C2523]">
                    {submissionResult.dress.name}
                  </div>
                  <div className="text-[12px] text-[#847374] mt-0.5">
                    Mã: {submissionResult.dress.code || 'UB-HC-2026'} • Size: <strong>{submissionResult.selectedSize}</strong>
                  </div>
                  <div className="text-[13px] font-bold text-[#733F49] mt-1">
                    Giá niêm yết: {Number(submissionResult.dress.price).toLocaleString('vi-VN')}₫ / gói 4 ngày
                  </div>
                </div>
              </div>

              {(submissionResult.serviceType === 'both' || submissionResult.serviceType === 'fitting') && (
                <div className="p-3.5 rounded-xl bg-white border border-[#EEDECF] text-[12.5px] space-y-1">
                  <div className="font-bold text-[#2E7D32] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>LỊCH HẸN THỬ VÁY PRIVATE SUITE (90 PHÚT TRỌN VẸN):</span>
                  </div>
                  <div className="text-[#2C2523] font-semibold">
                    {submissionResult.fittingTimeSlot} • Ngày: {submissionResult.fittingDate}
                  </div>
                  <div className="text-[#6B5C5D] text-[12px]">
                    Địa điểm: {submissionResult.branchName} ({submissionResult.branchAddress})
                  </div>
                </div>
              )}

              {(submissionResult.serviceType === 'both' || submissionResult.serviceType === 'rent') && (
                <div className="p-3.5 rounded-xl bg-white border border-[#EEDECF] text-[12.5px] space-y-1">
                  <div className="font-bold text-[#733F49] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>ĐẶT CỌC GIỮ LỊCH THUÊ:</span>
                  </div>
                  <div className="text-[#2C2523]">
                    Số tiền cọc giữ lịch 50%: <strong>{submissionResult.depositAmount.toLocaleString('vi-VN')}₫</strong> (Thanh toán qua quét mã VietQR Techcombank).
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              {(submissionResult.serviceType === 'both' || submissionResult.serviceType === 'rent') && (
                <button
                  type="button"
                  onClick={() => navigate(`/checkout?dressId=${activeDress.id}&size=${selectedSize}&startDate=${rentalStartDate}&endDate=${rentalEndDate}`)}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-0 shadow-md"
                >
                  <span>Tiến Hành Ký Hợp Đồng & Thanh Toán Cọc</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-[#EEDECF] text-[#2C2523] text-[13px] font-bold hover:bg-[#FAF0EC] transition-colors no-underline text-center shadow-xs"
              >
                Về Trang Chủ
              </Link>
            </div>

          </div>
        ) : (
          /* ================= MAIN GUEST BOOKING FORM ================= */
          <div className="space-y-8 animate-fade-in">
            
            {/* Banner Header */}
            <div className="bg-gradient-to-r from-[#2C2523] via-[#3D302E] to-[#4A3A37] text-white p-7 sm:p-9 rounded-3xl shadow-xl relative overflow-hidden border border-[#4A3A37]">
              <div className="relative z-10 max-w-[680px]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#EEDECF] text-[11px] font-bold tracking-wider uppercase border border-white/15 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>DÀNH RIÊNG CHO KHÁCH VÃNG LAI (GUEST) • KHÔNG CẦN ĐĂNG KÝ TÀI KHOẢN</span>
                </div>
                <h1 className="font-playfair text-[28px] sm:text-[36px] font-bold text-[#FAF4EE] m-0 mb-2 leading-tight">
                  Phiếu Đăng Ký Thuê Váy & Lịch Thử
                </h1>
                <p className="text-[13.5px] sm:text-[14.5px] text-[#D8C7B8] leading-relaxed m-0 font-normal">
                  Chỉ cần 1 phút điền thông tin để chuyên viên may đo Haute Couture chuẩn bị sẵn trang phục theo đúng số đo của nàng và khóa lịch ưu đãi.
                </p>
              </div>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#F0E5DC] shadow-[0_8px_32px_rgba(44,37,35,0.04)] p-6 sm:p-9 space-y-7">
              
              {/* 1. Chọn Nhu Cầu */}
              <div>
                <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-2.5">
                  1. CHỌN NHU CẦU CỦA NÀNG *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'both', title: 'Thuê Váy & Thử Váy', sub: 'Khuyên dùng cho cô dâu' },
                    { id: 'rent', title: 'Chỉ Đặt Thuê Váy', sub: 'Giao tận nơi / Nhận tiệm' },
                    { id: 'fitting', title: 'Chỉ Thử Tại Showroom', sub: 'Phòng Suite riêng 90p' },
                  ].map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => setServiceType(tab.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all text-center ${
                        serviceType === tab.id
                          ? 'border-[#733F49] bg-[#FAF3F0] ring-2 ring-[#733F49]/20 shadow-xs'
                          : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-[14px] text-[#2C2523]">{tab.title}</div>
                      <div className="text-[11px] text-[#847374] mt-0.5">{tab.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Chọn Mẫu Váy */}
              <div className="bg-[#FAF4EE] p-5 rounded-2xl border border-[#EEDECF] space-y-3">
                <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49]">
                  2. MẪU VÁY CƯỚI NÀNG MUỐN THUÊ / THỬ *
                </label>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8">
                    <select
                      value={selectedDressId}
                      onChange={(e) => setSelectedDressId(e.target.value)}
                      className="w-full bg-white border border-[#EEDECF] rounded-xl px-4 py-2.5 text-[14px] font-medium text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                    >
                      {MOCK_DRESSES.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.price.toLocaleString('vi-VN')}₫ (Mã: {d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4 flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-[12px] text-[#6B5C5D] font-medium">Size:</span>
                    <div className="flex items-center gap-1">
                      {['XS', 'S', 'M', 'L'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors cursor-pointer ${
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

                {activeDress && (
                  <div className="flex items-center gap-3.5 pt-3 border-t border-[#EEDECF]/60">
                    <img
                      src={activeDress.images?.[0] || activeDress.image}
                      alt={activeDress.name}
                      className="w-14 h-18 object-cover rounded-xl border border-[#EEDECF] shadow-2xs shrink-0"
                    />
                    <div className="min-w-0">
                      <strong className="font-playfair text-[15px] text-[#2C2523] block leading-snug">
                        {activeDress.name}
                      </strong>
                      <div className="text-[12px] text-[#733F49] font-medium mt-0.5">
                        Giá thuê niêm yết: {activeDress.price.toLocaleString('vi-VN')}₫ • Tiền cọc bảo lãnh: {activeDress.depositAmount?.toLocaleString('vi-VN')}₫
                      </div>
                      <div className="text-[11px] text-[#847374] mt-0.5">
                        Chất liệu: {activeDress.material} • Dáng váy: {activeDress.silhouette}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Thông Tin Khách Hàng */}
              <div className="space-y-4">
                <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49]">
                  3. THÔNG TIN KHÁCH HÀNG (GUEST INFO) *
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#847374] uppercase mb-1">HỌ VÀ TÊN CÔ DÂU *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Lê Nguyễn Thảo My"
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#847374] uppercase mb-1">SỐ ĐIỆN THOẠI / ZALO *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0938 128 899"
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#847374] uppercase mb-1">EMAIL NHẬN XÁC NHẬN *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="thaomy.bride@gmail.com"
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#847374] uppercase mb-1">SỐ CCCD (LẬP HỢP ĐỒNG BẢO LÃNH)</label>
                    <input
                      type="text"
                      value={cccd}
                      onChange={(e) => setCccd(e.target.value)}
                      placeholder="079201019888"
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#847374] uppercase mb-1">ĐỊA CHỈ GIAO NHẬN HOẶC THƯỜNG TRÚ</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white"
                  />
                </div>
              </div>

              {/* 4. Lịch Hẹn Thử Váy Tại Showroom */}
              {(serviceType === 'both' || serviceType === 'fitting') && (
                <div className="bg-[#FCF9F6] p-5 rounded-2xl border border-[#EEDECF] space-y-3.5">
                  <div className="flex items-center gap-1.5 font-bold text-[12px] text-[#733F49] uppercase">
                    <Calendar className="w-4 h-4 text-[#B8737D]" />
                    <span>LỊCH HẸN THỬ VÁY TẠI SHOWROOM ATELIER</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#847374] block mb-1">CHI NHÁNH SHOWROOM</label>
                      <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      >
                        {SHOWROOM_BRANCHES.map((b) => (
                          <option key={b.id} value={b.id}>{b.name.split('—')[1] || b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#847374] block mb-1">NGÀY HẸN THỬ</label>
                      <input
                        type="date"
                        value={fittingDate}
                        onChange={(e) => setFittingDate(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#847374] block mb-1">KHUNG GIỜ VÀNG</label>
                      <select
                        value={fittingTimeSlot}
                        onChange={(e) => setFittingTimeSlot(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      >
                        <option value="09:00 — 10:30">09:00 — 10:30 (Sáng riêng tư)</option>
                        <option value="11:00 — 12:30">11:00 — 12:30 (Trưa)</option>
                        <option value="13:30 — 15:00">13:30 — 15:00 (Khuyên dùng)</option>
                        <option value="15:30 — 17:00">15:30 — 17:00 (Chiều)</option>
                        <option value="18:30 — 20:00">18:30 — 20:00 (Tối VIP)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Lịch Trình Đặt Thuê */}
              {(serviceType === 'both' || serviceType === 'rent') && (
                <div className="bg-[#FCF9F6] p-5 rounded-2xl border border-[#EEDECF] space-y-3.5">
                  <div className="flex items-center gap-1.5 font-bold text-[12px] text-[#733F49] uppercase">
                    <ShieldCheck className="w-4 h-4 text-[#B8737D]" />
                    <span>LỊCH TRÌNH THUÊ VÁY HÔN LỄ</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#847374] block mb-1">NGÀY BẮT ĐẦU NHẬN</label>
                      <input
                        type="date"
                        value={rentalStartDate}
                        onChange={(e) => setRentalStartDate(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#733F49] block mb-1">NGÀY HÔN LỄ CHÍNH</label>
                      <input
                        type="date"
                        value={weddingDate}
                        onChange={(e) => setWeddingDate(e.target.value)}
                        className="w-full bg-white border border-[#F2D8D4] rounded-xl px-3 py-2 text-[13px] text-[#733F49] font-bold focus:outline-none focus:border-[#733F49]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#847374] block mb-1">NGÀY HOÀN TRẢ VÁY</label>
                      <input
                        type="date"
                        value={rentalEndDate}
                        onChange={(e) => setRentalEndDate(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Số đo ước tính */}
              <div>
                <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-2">
                  4. SỐ ĐO ƯỚC TÍNH & GHI CHÚ
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">CHIỀU CAO (CM)</label>
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3 py-2 text-[13px] text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">CÂN NẶNG (KG)</label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3 py-2 text-[13px] text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">VÒNG 1 (NGỰC)</label>
                    <input
                      type="text"
                      value={bust}
                      onChange={(e) => setBust(e.target.value)}
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3 py-2 text-[13px] text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] text-[#733F49] block mb-1 font-bold">VÒNG 2 (EO CORSET)</label>
                    <input
                      type="text"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full bg-[#FAF0EC] border border-[#F2D8D4] rounded-xl px-3 py-2 text-[13px] text-center font-bold text-[#733F49]"
                    />
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm cho chuyên viên Atelier (yêu cầu lúp voan, phong cách tiệc ngoài trời, thử vest chú rể...)"
                  className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-4 py-2.5 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49] resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-[#F0E5DC]">
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white font-jakarta text-[14px] font-bold tracking-wider uppercase transition-all shadow-[0_4px_16px_rgba(115,63,73,0.3)] hover:shadow-[0_6px_22px_rgba(115,63,73,0.4)] cursor-pointer border-0 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>XÁC NHẬN GỬI YÊU CẦU THUÊ & ĐẶT LỊCH GUEST</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-[11.5px] text-[#847374] mt-2 mb-0">
                  ✦ Hoàn toàn không bắt buộc tạo tài khoản • Cam kết bảo mật thông tin tuyệt đối
                </p>
              </div>

            </form>

          </div>
        )}

      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
