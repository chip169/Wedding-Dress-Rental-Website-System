import React, { useState, useMemo, useEffect } from 'react';
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
  Lock,
  CalendarPlus,
  Info,
  ChevronDown,
  Search,
  Eye,
  Heart,
  AlertCircle,
  Truck,
  Building,
  RotateCcw
} from 'lucide-react';
import { message } from 'antd';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { MOCK_DRESSES } from '../../services/dressService';
import { addToCart } from '../../services/cartService';
import { SHOWROOM_BRANCHES, TIME_SLOTS, createAppointment } from '../../services/appointmentService';
import { useAuth } from '../../contexts/AuthContext';

// Helper build Google Calendar Link
function buildGoogleCalendarUrl(info) {
  if (!info) return '#';
  try {
    const title = encodeURIComponent(`Lịch Thử Váy Cưới Private Suite — UniBridal Atelier (${info.requestId})`);
    const dateClean = (info.fittingDate || '').replace(/-/g, '');
    let startTime = '133000';
    let endTime = '150000';
    if (info.fittingTimeSlot && info.fittingTimeSlot.includes('—')) {
      const [start, end] = info.fittingTimeSlot.split('—').map((s) => s.trim().replace(':', ''));
      if (start) startTime = `${start}00`;
      if (end) endTime = `${end}00`;
    }
    const dates = `${dateClean}T${startTime}/${dateClean}T${endTime}`;
    const location = encodeURIComponent(`${info.branchName || ''} - ${info.branchAddress || ''}`);
    const details = encodeURIComponent(
      `Mã Check-in Guest: ${info.requestId}\nKhách quý: ${info.fullName}\nSĐT: ${info.phone}\nĐịa chỉ: ${info.branchAddress || ''}\nTrang phục quan tâm: ${info.dress?.name || 'Váy cưới Haute Couture'}\nTrân trọng đón tiếp nàng tại Private Suite UniBridal!`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&details=${details}`;
  } catch {
    return 'https://calendar.google.com';
  }
}

export default function GuestBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDressId = searchParams.get('dressId');
  const initialMode = searchParams.get('mode'); // 'fitting' | 'rent' | 'both'
  const { user, isLoggedIn } = useAuth();

  // Mode: 'both' (Thuê & Thử váy) | 'rent' (Chỉ thuê) | 'fitting' (Chỉ thử)
  const [serviceType, setServiceType] = useState(() => {
    if (initialMode === 'fitting' || initialMode === 'rent' || initialMode === 'both') {
      return initialMode;
    }
    return 'both';
  });

  // Selected dress
  const [selectedDressId, setSelectedDressId] = useState(initialDressId || '1');
  const [dressSearchText, setDressSearchText] = useState('');

  const activeDress = useMemo(() => {
    return MOCK_DRESSES.find((d) => String(d.id) === String(selectedDressId)) || MOCK_DRESSES[0];
  }, [selectedDressId]);

  // Guest personal information
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
  const [deliveryMethod, setDeliveryMethod] = useState('direct'); // 'direct' | 'delivery'

  // Measurements
  const [height, setHeight] = useState('165');
  const [weight, setWeight] = useState('48');
  const [waist, setWaist] = useState('64');
  const [bust, setBust] = useState('84');
  const [hips, setHips] = useState('92');
  const [heelHeight, setHeelHeight] = useState('7');

  // Notes & quick account
  const [notes, setNotes] = useState('');
  const [autoCreateAccount, setAutoCreateAccount] = useState(!isLoggedIn);

  // Submitted result state
  const [submissionResult, setSubmissionResult] = useState(null);

  // Rental duration calculations
  const rentalDays = useMemo(() => {
    if (!rentalStartDate || !rentalEndDate) return 4;
    const s = new Date(rentalStartDate);
    const e = new Date(rentalEndDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [rentalStartDate, rentalEndDate]);

  const pricing = useMemo(() => {
    const base = activeDress?.price || 5200000;
    const deposit = activeDress?.depositAmount || 15000000;
    let fee = base;
    if (rentalDays > 4) {
      fee = base + (rentalDays - 4) * (base * 0.2);
    }
    return {
      fee,
      deposit,
      bookingDeposit: Math.round(fee * 0.5), // Cọc giữ lịch 50%
      total: fee + deposit
    };
  }, [activeDress, rentalDays]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      message.error('Vui lòng điền đầy đủ Họ và tên, Số điện thoại và Email liên hệ.');
      return;
    }

    const cleanPhone = phone.replace(/[\s.-]/g, '');
    if (!/^[0-9]{9,11}$/.test(cleanPhone)) {
      message.warning('Số điện thoại không hợp lệ (từ 9 đến 11 chữ số).');
      return;
    }

    const requestId = `UB-GUEST-${Math.floor(1000 + Math.random() * 9000)}`;
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
        notes: `Khách vãng lai (Guest Booking). CCCD: ${cccd || 'Chưa cung cấp'}. Địa chỉ: ${address || 'Tại showroom'}. ${notes}`,
      });
    }

    // If rental is included, add to cart
    if (serviceType === 'both' || serviceType === 'rent') {
      addToCart({
        ...activeDress,
        size: selectedSize,
        rentalDays: rentalDays,
        startDate: rentalStartDate,
        endDate: rentalEndDate,
      });
    }

    setSubmissionResult({
      requestId,
      serviceType,
      dress: activeDress,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      cccd: cccd.trim(),
      address: address.trim(),
      branchName: selectedBranchObj.name,
      branchAddress: selectedBranchObj.address,
      fittingDate,
      fittingTimeSlot,
      guestsCount,
      rentalStartDate,
      weddingDate,
      rentalEndDate,
      rentalDays,
      selectedSize,
      deliveryMethod,
      pricing,
      autoCreateAccount,
      measurements: { height, weight, waist, bust, hips, heelHeight }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    message.success('Ghi nhận thông tin đăng ký của nàng thành công!');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2523] flex flex-col font-jakarta selection:bg-[#FCEEE9] selection:text-[#B8737D]">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-1 max-w-[1040px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12.5px] text-[#847374] mb-6 print:hidden">
          <Link to="/" className="hover:text-[#B8737D] transition-colors no-underline text-[#847374]">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to="/collection" className="hover:text-[#B8737D] transition-colors no-underline text-[#847374]">
            Bộ sưu tập
          </Link>
          <span>/</span>
          <span className="text-[#2C2523] font-medium">Phiếu Đăng Ký Thuê & Thử Váy (Dành Cho Guest)</span>
        </nav>

        {submissionResult ? (
          /* ================= SUCCESS SUBMISSION VIEW ================= */
          <div className="bg-white rounded-3xl border border-[#EEDECF] shadow-[0_16px_50px_rgba(115,63,73,0.08)] p-6 sm:p-10 space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11.5px] font-bold uppercase tracking-[2px] text-[#B8737D] block mb-1">
                TIẾP NHẬN YÊU CẦU GUEST THÀNH CÔNG
              </span>
              <h1 className="font-playfair text-[28px] sm:text-[36px] font-bold text-[#2C2523] m-0 mb-2">
                Hân Hạnh Đón Tiếp Nàng {submissionResult.fullName}
              </h1>
              <p className="text-[14px] text-[#6B5C5D] max-w-[580px] mx-auto m-0 leading-relaxed">
                Hồ sơ yêu cầu của nàng đã được chuyển tiếp tới Giám đốc Atelier UniBridal. Chuyên viên sẽ gọi điện tư vấn và xác nhận qua số <strong>{submissionResult.phone}</strong> trong vòng 15 phút.
              </p>
            </div>

            {/* Confirmation Ticket */}
            <div className="bg-[#FAF4EE] p-6 rounded-2xl border border-[#EEDECF] text-left space-y-4 max-w-[700px] mx-auto relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#C5A880]/20 to-transparent pointer-events-none rounded-bl-full" />
              
              <div className="flex items-center justify-between pb-3 border-b border-[#EEDECF]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#847374] block">
                    MÃ HỒ SƠ KHÁCH VÃNG LAI (GUEST ID):
                  </span>
                  <strong className="font-mono text-[#733F49] text-[16px]">{submissionResult.requestId}</strong>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-[#EEDECF] text-[11.5px] font-semibold text-[#2E7D32]">
                  <Check className="w-3.5 h-3.5" />
                  Đã khóa lịch ưu tiên
                </div>
              </div>

              {/* Dress info */}
              <div className="flex items-center gap-4 py-1">
                <img
                  src={submissionResult.dress.images?.[0] || submissionResult.dress.image}
                  alt={submissionResult.dress.name}
                  className="w-18 h-24 object-cover rounded-xl border border-[#EEDECF] shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-playfair font-bold text-[18px] text-[#2C2523]">
                    {submissionResult.dress.name}
                  </div>
                  <div className="text-[12.5px] text-[#847374] mt-0.5">
                    Mã sản phẩm: <strong className="font-mono text-[#2C2523]">{submissionResult.dress.code || 'UB-HC-2026'}</strong> • Size đăng ký: <strong className="text-[#733F49]">{submissionResult.selectedSize}</strong>
                  </div>
                  <div className="text-[13px] font-bold text-[#733F49] mt-1">
                    Giá niêm yết: {Number(submissionResult.dress.price).toLocaleString('vi-VN')}₫ (Gói {submissionResult.rentalDays} ngày)
                  </div>
                </div>
              </div>

              {/* Fitting Box if selected */}
              {(submissionResult.serviceType === 'both' || submissionResult.serviceType === 'fitting') && (
                <div className="p-4 rounded-xl bg-white border border-[#EEDECF] text-[12.5px] space-y-1.5">
                  <div className="font-bold text-[#2E7D32] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      LỊCH HẸN THỬ VÁY PRIVATE SUITE (90 PHÚT TRỌN VẸN):
                    </span>
                    <a
                      href={buildGoogleCalendarUrl(submissionResult)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11.5px] text-[#733F49] hover:underline font-semibold"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Thêm vào Google Calendar
                    </a>
                  </div>
                  <div className="text-[#2C2523] font-semibold text-[13.5px]">
                    {submissionResult.fittingTimeSlot} • Ngày: {submissionResult.fittingDate}
                  </div>
                  <div className="text-[#6B5C5D] text-[12px]">
                    Địa điểm: <strong>{submissionResult.branchName}</strong> ({submissionResult.branchAddress})
                  </div>
                  <div className="text-[11.5px] text-[#847374] italic">
                    Trà hoa thượng hạng, hoa tươi & chuyên viên may đo riêng phục vụ {submissionResult.guestsCount} khách.
                  </div>
                </div>
              )}

              {/* Rental Box if selected */}
              {(submissionResult.serviceType === 'both' || submissionResult.serviceType === 'rent') && (
                <div className="p-4 rounded-xl bg-white border border-[#EEDECF] text-[12.5px] space-y-2">
                  <div className="font-bold text-[#733F49] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>LỊCH TRÌNH THUÊ VÁY & ĐẶT CỌC GIỮ LỊCH:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[#2C2523] bg-[#FAF7F5] p-2.5 rounded-lg border border-[#F2E8E2]">
                    <div>
                      <span className="text-[11px] text-[#847374] block">Ngày nhận váy:</span>
                      <strong>{submissionResult.rentalStartDate}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#847374] block">Ngày hôn lễ chính:</span>
                      <strong className="text-[#B8737D]">{submissionResult.weddingDate}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#847374] block">Ngày hoàn trả:</span>
                      <strong>{submissionResult.rentalEndDate}</strong>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[#2C2523] pt-1">
                    <span>Tiền cọc giữ lịch 50% hôm nay:</span>
                    <strong className="text-[15px] font-bold text-[#733F49]">
                      {submissionResult.pricing.bookingDeposit.toLocaleString('vi-VN')}₫
                    </strong>
                  </div>
                  <div className="text-[11px] text-[#847374]">
                    Tiền cọc bảo chứng tài sản ({submissionResult.pricing.deposit.toLocaleString('vi-VN')}₫) sẽ hoàn trả 100% trong vòng 2h sau khi trao trả váy nguyên vẹn.
                  </div>
                </div>
              )}

              {/* Contact info recap */}
              <div className="text-[12px] text-[#6B5C5D] pt-2 border-t border-[#EEDECF] flex flex-wrap items-center justify-between gap-2">
                <span>Liên hệ: <strong>{submissionResult.phone}</strong> • {submissionResult.email}</span>
                {submissionResult.cccd && <span>CCCD: <strong>{submissionResult.cccd}</strong></span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              {(submissionResult.serviceType === 'both' || submissionResult.serviceType === 'rent') && (
                <button
                  type="button"
                  onClick={() => navigate(`/checkout?dressId=${activeDress.id}&size=${selectedSize}&startDate=${rentalStartDate}&endDate=${rentalEndDate}`)}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#733F49] to-[#8E535E] hover:brightness-105 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border-0 shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  <span>Tiến Hành Ký Hợp Đồng & Thanh Toán Cọc Giữ Váy</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white border border-[#EEDECF] text-[#2C2523] text-[13px] font-bold hover:bg-[#FAF0EC] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#847374]" />
                In Phiếu Tiếp Nhận
              </button>

              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#FAF4EE] border border-[#EEDECF] text-[#2C2523] text-[13px] font-bold hover:bg-[#F2ECE4] transition-colors no-underline text-center"
              >
                Về Trang Chủ
              </Link>
            </div>

          </div>
        ) : (
          /* ================= MAIN GUEST BOOKING FORM ================= */
          <div className="space-y-8 animate-fade-in">
            
            {/* Banner Header */}
            <div className="bg-gradient-to-r from-[#2C2523] via-[#3E3230] to-[#4F3C38] text-white p-7 sm:p-9 rounded-3xl shadow-xl relative overflow-hidden border border-[#4F3C38]">
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-radial from-[#C5A880]/20 to-transparent pointer-events-none rounded-full" />
              
              <div className="relative z-10 max-w-[720px]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#EEDECF] text-[11px] font-bold tracking-wider uppercase border border-white/15 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>DÀNH RIÊNG CHO KHÁCH CHƯA ĐĂNG KÝ / ĐĂNG NHẬP • KHÔNG RÀNG BUỘC TÀI KHOẢN</span>
                </div>
                <h1 className="font-playfair text-[28px] sm:text-[38px] font-bold text-[#FAF4EE] m-0 mb-2 leading-tight">
                  Phiếu Đăng Ký Thuê Váy & Lịch Thử
                </h1>
                <p className="text-[13.5px] sm:text-[14.5px] text-[#D8C7B8] leading-relaxed m-0 font-normal">
                  Nàng không cần đăng nhập hay đăng ký tài khoản. Chỉ mất 1 phút hoàn tất thông tin để chuyên viên may đo Haute Couture chuẩn bị sẵn trang phục theo đúng số đo của nàng và khóa ưu đãi giữ váy.
                </p>

                {!isLoggedIn && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[12.5px] text-[#E0D0C4]">
                    <span>Nàng đã có tài khoản UniBridal?</span>
                    <Link to="/login" className="text-[#D4AF37] hover:underline font-bold inline-flex items-center gap-1">
                      Đăng nhập ngay
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#F0E5DC] shadow-[0_8px_32px_rgba(44,37,35,0.04)] p-6 sm:p-9 space-y-8">
              
              {/* 1. Chọn Nhu Cầu */}
              <div>
                <label className="block font-jakarta text-[11.5px] font-bold uppercase tracking-wider text-[#733F49] mb-3">
                  1. CHỌN NHU CẦU CỦA NÀNG TRONG HÔN LỄ *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {[
                    {
                      id: 'both',
                      title: 'Thử Váy & Đặt Thuê',
                      sub: 'Trải nghiệm suite thử váy rồi khóa lịch thuê',
                      tag: 'Khuyên Dùng'
                    },
                    {
                      id: 'rent',
                      title: 'Chỉ Đặt Thuê Váy',
                      sub: 'Giao tận nơi hoặc nhận tại Atelier',
                      tag: 'Thuận Tiện'
                    },
                    {
                      id: 'fitting',
                      title: 'Chỉ Thử Tại Showroom',
                      sub: 'Phòng Suite riêng tư 90 phút miễn phí',
                      tag: 'Trải Nghiệm'
                    },
                  ].map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => setServiceType(tab.id)}
                      className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                        serviceType === tab.id
                          ? 'border-[#733F49] bg-[#FAF3F0] ring-2 ring-[#733F49]/20 shadow-xs'
                          : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white'
                      }`}
                    >
                      <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#733F49]/10 text-[#733F49]">
                        {tab.tag}
                      </span>
                      <div className="font-bold text-[14.5px] text-[#2C2523] mt-0.5">{tab.title}</div>
                      <div className="text-[11.5px] text-[#847374] mt-1 leading-snug">{tab.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Chọn Mẫu Váy Cưới */}
              <div className="bg-[#FAF4EE] p-5 sm:p-6 rounded-2xl border border-[#EEDECF] space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block font-jakarta text-[11.5px] font-bold uppercase tracking-wider text-[#733F49]">
                    2. MẪU VÁY CƯỚI NÀNG MUỐN THUÊ / THỬ *
                  </label>
                  <span className="text-[11.5px] text-[#847374]">
                    Có thể đổi mẫu khác trước ngày cưới 15 ngày
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8">
                    <select
                      value={selectedDressId}
                      onChange={(e) => setSelectedDressId(e.target.value)}
                      className="w-full bg-white border border-[#EEDECF] rounded-xl px-4 py-3 text-[14px] font-medium text-[#2C2523] focus:outline-none focus:border-[#733F49] shadow-2xs"
                    >
                      {MOCK_DRESSES.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.price.toLocaleString('vi-VN')}₫ (Mã: {d.code || `UB-HC-${d.id}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4 flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-[12px] text-[#6B5C5D] font-medium">Size váy:</span>
                    <div className="flex items-center gap-1.5">
                      {['XS', 'S', 'M', 'L', 'Custom'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors cursor-pointer ${
                            selectedSize === sz
                              ? 'bg-[#733F49] text-white border-[#733F49] shadow-2xs'
                              : 'bg-white text-[#2C2523] border-[#EEDECF] hover:bg-[#FAF0EC]'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selected Dress Card Detail */}
                {activeDress && (
                  <div className="bg-white p-4 rounded-xl border border-[#EEDECF] flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <img
                      src={activeDress.images?.[0] || activeDress.image}
                      alt={activeDress.name}
                      className="w-20 h-28 object-cover rounded-xl border border-[#EEDECF] shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="font-playfair text-[17px] text-[#2C2523]">
                          {activeDress.name}
                        </strong>
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF4EE] text-[#733F49]">
                          {activeDress.silhouette || 'Haute Couture'}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#847374] line-clamp-1 m-0">
                        {activeDress.description || 'Chất liệu lụa Mikado, ren Chantilly Pháp thêu tay tinh xảo và corset siết eo hoàng gia.'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-[12.5px]">
                        <span className="text-[#733F49] font-bold">
                          Giá thuê niêm yết: {activeDress.price.toLocaleString('vi-VN')}₫
                        </span>
                        <span className="text-[#847374]">
                          Cọc bảo lãnh hoàn lại: <strong>{activeDress.depositAmount?.toLocaleString('vi-VN')}₫</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Thông Tin Khách Hàng (Guest Info) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block font-jakarta text-[11.5px] font-bold uppercase tracking-wider text-[#733F49]">
                    3. THÔNG TIN KHÁCH HÀNG (GUEST CONTACT) *
                  </label>
                  <span className="text-[11.5px] text-[#847374] flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-[#2E7D32]" />
                    Cam kết bảo mật 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#847374] uppercase mb-1.5">
                      HỌ VÀ TÊN CÔ DÂU (HOẶC CHÚ RỂ) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#A8988B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="VD: Lê Nguyễn Thảo My"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FCF9F6] border border-[#EEDECF] rounded-xl text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#847374] uppercase mb-1.5">
                      SỐ ĐIỆN THOẠI / ZALO NHẬN XÁC NHẬN *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#A8988B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="VD: 0938 128 899"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FCF9F6] border border-[#EEDECF] rounded-xl text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#847374] uppercase mb-1.5">
                      EMAIL NHẬN HỢP ĐỒNG & HÓA ĐƠN *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#A8988B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="VD: thaomy.bride@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FCF9F6] border border-[#EEDECF] rounded-xl text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#847374] uppercase mb-1.5">
                      SỐ CCCD / CMND (LẬP HỒ SƠ BẢO CHỨNG THUÊ)
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-[#A8988B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={cccd}
                        onChange={(e) => setCccd(e.target.value)}
                        placeholder="079201019888 (Có thể cung cấp khi nhận váy)"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FCF9F6] border border-[#EEDECF] rounded-xl text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#847374] uppercase mb-1.5">
                    ĐỊA CHỈ THƯỜNG TRÚ HOẶC ĐỊA CHỈ GIAO VÁY TẬN NƠI
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#A8988B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FCF9F6] border border-[#EEDECF] rounded-xl text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Lịch Hẹn Thử Váy Tại Showroom (Nếu chọn fitting hoặc both) */}
              {(serviceType === 'both' || serviceType === 'fitting') && (
                <div className="bg-[#FAF4EE] p-5 sm:p-6 rounded-2xl border border-[#EEDECF] space-y-4">
                  <div className="flex items-center gap-2 font-bold text-[12.5px] text-[#733F49] uppercase">
                    <Calendar className="w-4 h-4 text-[#B8737D]" />
                    <span>LỊCH HẸN THỬ VÁY TẠI SHOWROOM ATELIER (PHÒNG PRIVATE SUITE)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="text-[11px] font-bold text-[#847374] block mb-1">CHI NHÁNH SHOWROOM</label>
                      <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
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
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#847374] block mb-1">KHUNG GIỜ VÀNG</label>
                      <select
                        value={fittingTimeSlot}
                        onChange={(e) => setFittingTimeSlot(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      >
                        <option value="09:00 — 10:30">09:00 — 10:30 (Sáng riêng tư)</option>
                        <option value="11:00 — 12:30">11:00 — 12:30 (Trưa)</option>
                        <option value="13:30 — 15:00">13:30 — 15:00 (Khuyên dùng)</option>
                        <option value="15:30 — 17:00">15:30 — 17:00 (Chiều)</option>
                        <option value="18:30 — 20:00">18:30 — 20:00 (Tối VIP)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[12px] text-[#847374]">
                    <span>Số lượng người đi cùng thử váy (Tối đa 3 người thân):</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setGuestsCount(num)}
                          className={`w-8 h-8 rounded-lg font-bold border transition-colors cursor-pointer ${
                            guestsCount === num
                              ? 'bg-[#733F49] text-white border-[#733F49]'
                              : 'bg-white text-[#2C2523] border-[#EEDECF]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Lịch Trình Đặt Thuê (Nếu chọn rent hoặc both) */}
              {(serviceType === 'both' || serviceType === 'rent') && (
                <div className="bg-[#FAF4EE] p-5 sm:p-6 rounded-2xl border border-[#EEDECF] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-[12.5px] text-[#733F49] uppercase">
                      <ShieldCheck className="w-4 h-4 text-[#B8737D]" />
                      <span>LỊCH TRÌNH THUÊ VÁY & BÀN GIAO</span>
                    </div>
                    <span className="text-[12px] text-[#847374]">
                      Gói tiêu chuẩn: <strong>{rentalDays} ngày</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="text-[11px] font-bold text-[#847374] block mb-1">NGÀY BẮT ĐẦU NHẬN</label>
                      <input
                        type="date"
                        value={rentalStartDate}
                        onChange={(e) => setRentalStartDate(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#733F49] block mb-1">NGÀY HÔN LỄ CHÍNH</label>
                      <input
                        type="date"
                        value={weddingDate}
                        onChange={(e) => setWeddingDate(e.target.value)}
                        className="w-full bg-white border border-[#F2D8D4] rounded-xl px-3 py-2.5 text-[13px] text-[#733F49] font-bold focus:outline-none focus:border-[#733F49]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#847374] block mb-1">NGÀY HOÀN TRẢ VÁY</label>
                      <input
                        type="date"
                        value={rentalEndDate}
                        onChange={(e) => setRentalEndDate(e.target.value)}
                        className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2.5 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49]"
                      />
                    </div>
                  </div>

                  {/* Delivery method */}
                  <div className="pt-2 border-t border-[#EEDECF]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[12px] text-[#6B5C5D] font-medium">Hình thức nhận váy cưới:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('direct')}
                        className={`px-3.5 py-2 rounded-xl text-[12px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          deliveryMethod === 'direct'
                            ? 'bg-[#733F49] text-white border-[#733F49]'
                            : 'bg-white text-[#2C2523] border-[#EEDECF]'
                        }`}
                      >
                        <Building className="w-3.5 h-3.5" />
                        Nhận trực tiếp tại Atelier
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('delivery')}
                        className={`px-3.5 py-2 rounded-xl text-[12px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          deliveryMethod === 'delivery'
                            ? 'bg-[#733F49] text-white border-[#733F49]'
                            : 'bg-white text-[#2C2523] border-[#EEDECF]'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Giao tận nơi (White-glove)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Số Đo Ước Tính (Measurements) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block font-jakarta text-[11.5px] font-bold uppercase tracking-wider text-[#733F49]">
                    4. SỐ ĐO ƯỚC TÍNH (ĐỂ CHUYÊN VIÊN FITTING ĐIỀU CHỈNH FORM)
                  </label>
                  <span className="text-[11.5px] text-[#847374]">
                    Sẽ được đo trực tiếp lại trong buổi thử váy
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-3">
                  <div>
                    <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">CHIỀU CAO (CM)</label>
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-2 py-2 text-[13px] text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">CÂN NẶNG (KG)</label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-2 py-2 text-[13px] text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">VÒNG 1 (NGỰC)</label>
                    <input
                      type="text"
                      value={bust}
                      onChange={(e) => setBust(e.target.value)}
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-2 py-2 text-[13px] text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] text-[#733F49] block mb-1 font-bold">VÒNG 2 (EO CORSET)</label>
                    <input
                      type="text"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full bg-[#FAF0EC] border border-[#F2D8D4] rounded-xl px-2 py-2 text-[13px] text-center font-bold text-[#733F49]"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">VÒNG 3 (MÔNG)</label>
                    <input
                      type="text"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-2 py-2 text-[13px] text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] text-[#847374] block mb-1 font-bold">GIÀY CƯỚI (CM)</label>
                    <input
                      type="text"
                      value={heelHeight}
                      onChange={(e) => setHeelHeight(e.target.value)}
                      className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-2 py-2 text-[13px] text-center font-bold"
                    />
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm cho chuyên viên Atelier (yêu cầu thêm lúp voan dài, phong cách tiệc ngoài trời, tư vấn kèm vest chú rể...)"
                  className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-4 py-2.5 text-[13px] text-[#2C2523] focus:outline-none focus:border-[#733F49] resize-none"
                />
              </div>

              {/* 7. Tiện ích tạo tài khoản nhanh */}
              {!isLoggedIn && (
                <div className="p-4 bg-[#FDFBF7] rounded-2xl border border-[#EEDECF] flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="autoCreateAccount"
                    checked={autoCreateAccount}
                    onChange={(e) => setAutoCreateAccount(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-[#733F49] cursor-pointer"
                  />
                  <label htmlFor="autoCreateAccount" className="text-[12.5px] text-[#594B43] cursor-pointer select-none">
                    <strong>Đồng thời kích hoạt tài khoản thành viên UniBridal với SĐT này:</strong> Nàng sẽ nhận mã kích hoạt nhanh qua SMS/Zalo để tiện theo dõi tiến độ chỉnh sửa số đo, quản lý hợp đồng điện tử và nhận điểm tích lũy thành viên VIP Diamond.
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 border-t border-[#F0E5DC] space-y-3">
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#733F49] to-[#8E535E] hover:brightness-105 text-white font-jakarta text-[14px] font-bold tracking-wider uppercase transition-all shadow-[0_4px_16px_rgba(115,63,73,0.3)] hover:shadow-[0_6px_22px_rgba(115,63,73,0.4)] cursor-pointer border-0 flex items-center justify-center gap-2.5 active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>XÁC NHẬN GỬI YÊU CẦU THUÊ & ĐẶT LỊCH GUEST</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-[12px] text-[#847374] m-0">
                  ✦ Hoàn toàn không bắt buộc đăng ký tài khoản • Tiếp nhận xử lý trong 15 phút
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
