import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  MapPin,
  Check,
  CheckCircle2,
  Lock,
  Phone,
  QrCode,
  CreditCard,
  Building2,
  FileText,
  Sparkles,
  Scissors,
  Briefcase,
  HelpCircle,
  X,
  Download,
  Printer,
  ChevronRight,
  ArrowRight,
  Clock,
  ExternalLink,
  Award,
  Crown,
  FileCheck,
  PenTool,
  CheckSquare,
  AlertCircle,
  ArrowLeft,
  Copy,
  Plus,
  Minus,
} from 'lucide-react';
import { message } from 'antd';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { MOCK_DRESSES } from '../../services/dressService';
import { getCart } from '../../services/cartService';

// Helper: Chuyển đổi định dạng ngày DD/MM/YYYY sang YYYY-MM-DD và ngược lại
function toIsoDateString(val) {
  if (!val) return '';
  if (val.includes('-')) return val.split('T')[0];
  if (val.includes('/')) {
    const parts = val.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
}

function toDisplayDateString(val) {
  if (!val) return '';
  if (val.includes('/')) return val;
  if (val.includes('-')) {
    const parts = val.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return val;
}

import { createOrder } from '../../services/orderService';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dressIdParam = searchParams.get('dressId');
  const sizeParam = searchParams.get('size');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const daysParam = parseInt(searchParams.get('days'), 10);
  const [rentalDays, setRentalDays] = useState(!isNaN(daysParam) && daysParam >= 2 && daysParam <= 30 ? daysParam : 4);

  // Dynamic Selected Dress
  const activeDress = useMemo(() => {
    if (dressIdParam) {
      const found = MOCK_DRESSES.find((d) => String(d.id) === String(dressIdParam));
      if (found) return found;
    }
    const cart = getCart();
    if (cart && cart.length > 0) {
      const first = cart[0];
      const found = MOCK_DRESSES.find((d) => String(d.id) === String(first.id));
      if (found) return found;
    }
    return MOCK_DRESSES[0];
  }, [dressIdParam]);

  // Current Active Wizard Step: 1 = Thông Tin & Số Đo, 2 = Ký Hợp Đồng Điện Tử, 3 = Đặt Cọc & Thanh Toán
  const [currentStep, setCurrentStep] = useState(1);
  // Chữ ký tay điện tử (Digital Signature Pad)
  const signatureCanvasRef = React.useRef(null);
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' (vẽ tay) | 'type' (gõ phím)
  const [isCanvasDrawing, setIsCanvasDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [drawnSignatureData, setDrawnSignatureData] = useState('');

  const getCanvasCoords = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleStartDraw = (e) => {
    e.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1D2A44'; // Mực xanh đen bút ký cao cấp
    setIsCanvasDrawing(true);
  };

  const handleMoveDraw = (e) => {
    if (!isCanvasDrawing) return;
    e.preventDefault();
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawnSignature(true);
  };

  const handleEndDraw = () => {
    if (isCanvasDrawing) {
      setIsCanvasDrawing(false);
      const canvas = signatureCanvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        setDrawnSignatureData(dataUrl);
        setContractSignature(dataUrl);
      }
    }
  };

  const handleClearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawnSignature(false);
      setDrawnSignatureData('');
      setContractSignature(brideName);
    }
  };

  const [createdOrder, setCreatedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Form state
  const [brideName, setBrideName] = useState('Lê Nguyễn Thảo My');
  const [phone, setPhone] = useState('0938 128 899');
  const [email, setEmail] = useState('thaomy.bride@gmail.com');
  const [cccd, setCccd] = useState('079201019888');
  const [address, setAddress] = useState('120/4 Lê Lai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh');

  // Helper tính ngày kết thúc thuê dựa vào ngày bắt đầu và số ngày
  const computeEndDate = (startDisplayOrIso, days) => {
    const iso = toIsoDateString(startDisplayOrIso);
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '21/11/2026';
    const endD = new Date(d);
    endD.setDate(endD.getDate() + (days - 1));
    return toDisplayDateString(endD.toISOString().split('T')[0]);
  };

  // Schedule state (Định dạng hiển thị DD/MM/YYYY)
  const [rentalSchedule, setRentalSchedule] = useState(() => {
    const start = startDateParam ? toDisplayDateString(startDateParam) : '18/11/2026';
    const initialDays = !isNaN(daysParam) && daysParam >= 2 && daysParam <= 30 ? daysParam : 4;
    const end = endDateParam ? toDisplayDateString(endDateParam) : computeEndDate(start, initialDays);
    return {
      startDate: start,
      weddingDate: '20/11/2026',
      endDate: end,
    };
  });

  // Cập nhật số ngày thuê và tự động dời ngày hoàn trả
  const handleRentalDaysChange = (newDays) => {
    const clamped = Math.max(2, Math.min(30, newDays));
    setRentalDays(clamped);
    const newEnd = computeEndDate(rentalSchedule.startDate, clamped);
    setRentalSchedule((prev) => ({
      ...prev,
      endDate: newEnd,
    }));
  };

  // State cho tháng đang xem trên lịch tương tác
  const [calendarViewDate, setCalendarViewDate] = useState(() => {
    const initialIso = toIsoDateString(rentalSchedule.weddingDate || '20/11/2026');
    const d = new Date(initialIso || Date.now());
    return isNaN(d.getTime()) ? new Date(2026, 10, 1) : new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [showFullCalendar, setShowFullCalendar] = useState(true);

  // Xử lý khi người dùng chọn ngày cưới chính thức (Tự động lùi 2 ngày nhận váy và tính ngày trả theo rentalDays)
  const handleSelectWeddingDate = (selectedIsoOrDisplay) => {
    const iso = toIsoDateString(selectedIsoOrDisplay);
    const d = new Date(iso);
    if (isNaN(d.getTime())) return;

    const startObj = new Date(d);
    startObj.setDate(startObj.getDate() - 2);

    const endObj = new Date(startObj);
    endObj.setDate(endObj.getDate() + (rentalDays - 1));

    setRentalSchedule({
      startDate: toDisplayDateString(startObj.toISOString().split('T')[0]),
      weddingDate: toDisplayDateString(iso),
      endDate: toDisplayDateString(endObj.toISOString().split('T')[0]),
    });
    setCalendarViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };


  // Selected dress size
  const [selectedSize, setSelectedSize] = useState(sizeParam || 'S');

  // Measurements
  const [measurements, setMeasurements] = useState({
    height: '165',
    weight: '48',
    bust: '84',
    waist: '64',
    hips: '92',
    heel: '9',
  });

  // Delivery method: 'direct' | 'delivery'
  const [deliveryMethod, setDeliveryMethod] = useState('direct');

  // Step 2: Contract signing state
  const [contractSignature, setContractSignature] = useState('Lê Nguyễn Thảo My');
  const [hasAgreedContractTerms, setHasAgreedContractTerms] = useState(true);
  const [isContractSigned, setIsContractSigned] = useState(false);

  // Step 3: Deposit option: 'deposit30' | 'full100'
  const [depositOption, setDepositOption] = useState('deposit30');

  // Payment gateway: 'vietqr' | 'card' | 'offline'
  const [paymentGateway, setPaymentGateway] = useState('vietqr');

  // Modals
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isSizeGuideModalOpen, setIsSizeGuideModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Financial calculations
  const baseRentPrice = activeDress?.price || 5200000;
  const extraDayRate = 800000;
  const extraDaysCount = Math.max(0, rentalDays - 4);
  const extraDayFee = extraDaysCount * extraDayRate;
  const totalRentPrice = baseRentPrice + extraDayFee;
  const depositCollateral = activeDress?.depositAmount || 15000000;

  // Amount to pay today based on depositOption (30% or 100%)
  const amountToPayToday = depositOption === 'deposit30' ? Math.round(totalRentPrice * 0.5) : totalRentPrice;

  // Validation Step 1
  const handleProceedToContract = (e) => {
    e?.preventDefault();
    if (!brideName.trim() || !phone.trim() || !email.trim()) {
      message.error('Vui lòng điền đầy đủ họ tên, số điện thoại và email của cô dâu.');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Validation Step 2 (Sign contract)
  const handleSignAndProceedToPayment = () => {
    if (!hasAgreedContractTerms) {
      message.warning('Nàng vui lòng tích chọn đồng ý với các điều khoản của Hợp đồng thuê.');
      return;
    }
    if (!contractSignature.trim()) {
      message.warning('Vui lòng nhập họ tên xác nhận chữ ký điện tử.');
      return;
    }
    setIsContractSigned(true);
    message.success('Ký hợp đồng thuê điện tử thành công!');
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Confirm final booking & payment
  const handleConfirmFinalPayment = async (e) => {
    e?.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const generatedOrderCode = `UB-2026-${Math.floor(100 + Math.random() * 900)}`;
    const generatedContractCode = `HĐ-${generatedOrderCode}`;

    const orderPayload = {
      orderCode: generatedOrderCode,
      customerName: brideName.trim(),
      brideName: brideName.trim(),
      customerPhone: phone.trim(),
      phone: phone.trim(),
      customerEmail: email.trim(),
      email: email.trim(),
      customerCccd: cccd.trim(),
      cccd: cccd.trim(),
      shippingAddress: address.trim(),
      contractCode: generatedContractCode,
      contractSignature: contractSignature || brideName,
      measurements,
      depositOption,
      rentalStartDate: rentalSchedule.startDate,
      rentalEndDate: rentalSchedule.endDate,
      rentalDays,
      items: [
        {
          dressId: activeDress.id || activeDress._id,
          name: activeDress.name,
          size: selectedSize,
          rentPrice: totalRentPrice,
          depositAmount: depositCollateral,
          image: activeDress.images?.[0] || activeDress.image,
        },
      ],
      totalRentPrice,
      totalDeposit: depositCollateral,
      depositPaidAmount: amountToPayToday,
      totalPayment: totalRentPrice + depositCollateral,
      deliveryMethod: 'showroom',
      notes: `Hôn lễ ngày ${rentalSchedule.weddingDate}. Đặt cọc ${depositOption === 'deposit30' ? '50%' : '100%'}.`,
    };

    try {
      const res = await createOrder(orderPayload);
      const savedOrder = res?.data || orderPayload;
      setCreatedOrder(savedOrder);

      // Xóa giỏ hàng sau khi đặt thuê thành công
      try {
        localStorage.removeItem('unibridal_cart');
        window.dispatchEvent(new Event('unibridal-cart-updated'));
      } catch (err) {
        // ignore
      }

      setIsSuccessModalOpen(true);
      message.success('Xác nhận đặt thuê & thanh toán cọc thành công!');
    } catch (error) {
      message.error(error.message || 'Không thể tạo đơn thuê, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Đã sao chép vào bộ nhớ tạm!');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2523] flex flex-col font-jakarta selection:bg-[#FCEEE9] selection:text-[#B8737D]">
      <div className="print:hidden">
        <Header />
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9">

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
          <span className="text-[#2C2523] font-medium">Đặt Thuê, Ký Hợp Đồng & Thanh Toán</span>
        </nav>

        {/* Header Title Section */}
        <div className="mb-8 print:hidden">

          <h1 className="font-playfair text-[28px] sm:text-[38px] lg:text-[42px] font-medium text-[#2C2523] leading-tight mb-2.5">
            {currentStep === 1 && 'Thông Tin Đặt Thuê & Số Đo May Đo'}
            {currentStep === 2 && 'Xem & Ký Hợp Đồng Thuê Điện Tử'}
            {currentStep === 3 && 'Đặt Cọc Giữ Lịch & Thanh Toán'}
          </h1>
          <p className="text-[13.5px] sm:text-[14.5px] text-[#6B5C5D] font-normal leading-relaxed m-0 max-w-[850px]">
            {currentStep === 1 && 'Cung cấp số đo cơ thể chuẩn xác để đội ngũ nghệ nhân Haute Couture may đo, chỉnh sửa vừa khít vóc dáng.'}
            {currentStep === 2 && 'Văn bản hợp đồng bảo hộ pháp lý song phương, cam kết hoàn cọc 100% và bảo quản trang phục nguyên bản.'}
            {currentStep === 3 && 'Ký hợp đồng thành công! Tiến hành đặt cọc để Atelier khóa lịch độc quyền cho hôn lễ của nàng.'}
          </p>
        </div>

        {/* Stepper Bar (3 Clear Steps) */}
        <div className="w-full max-w-[820px] mx-auto mb-10 print:hidden">
          <div className="bg-white rounded-full border border-[#EEDECF]/80 shadow-[0_2px_12px_rgba(44,37,35,0.04)] px-4 sm:px-8 py-3 flex items-center justify-between text-[12px] sm:text-[13.5px]">

            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 border-0 bg-transparent cursor-pointer font-medium transition-colors ${currentStep >= 1 ? 'text-[#733F49]' : 'text-[#847374]'
                }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${currentStep > 1 ? 'bg-[#2E7D32] text-white' : 'bg-[#733F49] text-white shadow-xs'
                }`}>
                {currentStep > 1 ? '✓' : '1'}
              </span>
              <span className={currentStep === 1 ? 'font-bold text-[#733F49]' : ''}>1. Thông tin & Số đo</span>
            </button>

            {/* Line 1 */}
            <div className={`flex-1 h-[2px] mx-2 sm:mx-4 transition-colors ${currentStep >= 2 ? 'bg-[#733F49]' : 'bg-[#EEDECF]'
              }`} />

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => {
                if (brideName && phone) setCurrentStep(2);
              }}
              className={`flex items-center gap-2 border-0 bg-transparent cursor-pointer font-medium transition-colors ${currentStep >= 2 ? 'text-[#733F49]' : 'text-[#847374]'
                }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${currentStep > 2 ? 'bg-[#2E7D32] text-white' : currentStep === 2 ? 'bg-[#733F49] text-white shadow-xs' : 'bg-[#EAE0D5] text-[#847374]'
                }`}>
                {currentStep > 2 ? '✓' : '2'}
              </span>
              <span className={currentStep === 2 ? 'font-bold text-[#733F49]' : ''}>2. Ký hợp đồng số</span>
            </button>

            {/* Line 2 */}
            <div className={`flex-1 h-[2px] mx-2 sm:mx-4 transition-colors ${currentStep >= 3 ? 'bg-[#733F49]' : 'bg-[#EEDECF]'
              }`} />

            {/* Step 3 */}
            <div className={`flex items-center gap-2 font-medium ${currentStep === 3 ? 'text-[#733F49] font-bold' : 'text-[#847374]'
              }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${currentStep === 3 ? 'bg-[#733F49] text-white shadow-xs' : 'bg-[#EAE0D5] text-[#847374]'
                }`}>
                3
              </span>
              <span>3. Đặt cọc & Thanh toán</span>
            </div>

          </div>
        </div>

        {/* Two-Column Grid: Form Left & Sticky Order Summary Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">

            {/* ================= STEP 1: THÔNG TIN & SỐ ĐO ================= */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-fade-in">

                {/* 1. THÔNG TIN NGƯỜI THUÊ */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex items-center justify-between pb-5 border-b border-[#F5EDE8] mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#B8737D]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-playfair text-[19px] sm:text-[21px] font-semibold text-[#2C2523] m-0">
                          Thông Tin Cô Dâu & Người Đại Diện Thuê
                        </h2>
                        <p className="text-[12px] text-[#847374] m-0 mt-0.5">
                          Thông tin chính xác để ghi nhận vào Hợp đồng bảo hộ pháp lý
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-[#FDF2F0] border border-[#F7D8D4] text-[#B8737D] font-bold text-[10.5px]">
                      BẢO MẬT 100%
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          HỌ & TÊN CÔ DÂU *
                        </label>
                        <input
                          type="text"
                          required
                          value={brideName}
                          onChange={(e) => {
                            setBrideName(e.target.value);
                            setContractSignature(e.target.value);
                          }}
                          className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white"
                          placeholder="Lê Nguyễn Thảo My"
                        />
                      </div>

                      <div>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          SỐ ĐIỆN THOẠI (ZALO) *
                        </label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white"
                          placeholder="09xx xxx xxx"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          EMAIL NHẬN HỢP ĐỒNG SỐ *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white"
                          placeholder="thaomy.bride@gmail.com"
                        />
                      </div>

                      <div>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          SỐ CCCD / CMND (LẬP HỢP ĐỒNG PHÁP LÝ) *
                        </label>
                        <input
                          type="text"
                          required
                          value={cccd}
                          onChange={(e) => setCccd(e.target.value)}
                          className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white"
                          placeholder="079201019888"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                        ĐỊA CHỈ THƯỜNG TRÚ HOẶC GIAO NHẬN LỄ PHỤC *
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white"
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      />
                    </div>
                  </div>
                </section>

                {/* 2. LỊCH TRÌNH THUÊ & PHƯƠNG THỨC BÀN GIAO */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex items-center justify-between pb-5 border-b border-[#F5EDE8] mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#B8737D]">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-playfair text-[19px] sm:text-[21px] font-semibold text-[#2C2523] m-0">
                          Lịch Trình Đặt Thuê & Bàn Giao
                        </h2>
                        <p className="text-[12px] text-[#847374] m-0 mt-0.5">
                          Thời gian thuê: <strong className="text-[#733F49]">{rentalDays} ngày</strong> • Nhận từ {rentalSchedule.startDate} đến {rentalSchedule.endDate}
                        </p>
                      </div>
                    </div>

                    {/* Bộ tăng giảm nhanh số ngày */}
                    <div className="flex items-center gap-2 bg-[#FCF9F6] border border-[#EEDECF] px-3.5 py-2 rounded-xl self-start sm:self-auto shadow-2xs">
                      <span className="text-[11px] font-bold text-[#847374] uppercase tracking-wider">Số ngày thuê:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRentalDaysChange(rentalDays - 1)}
                          disabled={rentalDays <= 2}
                          aria-label="Giảm ngày thuê"
                          className="w-7 h-7 rounded-lg border border-[#EEDECF] bg-white text-[#733F49] flex items-center justify-center hover:bg-[#FAF0EC] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-playfair font-bold text-[15px] text-[#733F49] min-w-[55px] text-center">
                          {rentalDays} Ngày
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRentalDaysChange(rentalDays + 1)}
                          disabled={rentalDays >= 14}
                          aria-label="Tăng ngày thuê"
                          className="w-7 h-7 rounded-lg border border-[#EEDECF] bg-white text-[#733F49] flex items-center justify-center hover:bg-[#FAF0EC] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* KHỐI CHỌN GÓI SỐ NGÀY THUÊ LINH HOẠT */}
                  <div className="mb-6 bg-[#FCF9F6] p-4.5 rounded-2xl border border-[#EEDECF]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#733F49]" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#733F49]">
                          CHỌN GÓI THỜI GIAN THUÊ LỄ PHỤC
                        </span>
                      </div>
                      <span className="text-[11.5px] font-medium text-[#733F49]">
                        {rentalDays === 4 ? (
                          <span className="text-[#2E7D32] font-semibold">✓ Gói chuẩn 4 ngày (Giá niêm yết chuẩn)</span>
                        ) : rentalDays > 4 ? (
                          <span className="text-[#733F49] font-bold">
                            +{(extraDaysCount * 800000).toLocaleString('vi-VN')}₫ phụ phí ({extraDaysCount} ngày gia hạn x 800k)
                          </span>
                        ) : (
                          <span className="text-[#6B5C5D]">Gói tinh gọn {rentalDays} ngày</span>
                        )}
                      </span>
                    </div>

                    {/* 4 Thẻ Gói Ngày Thuê */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { days: 3, title: '3 Ngày', desc: 'Studio / Tiệc Gọn', note: 'Tinh gọn' },
                        { days: 4, title: '4 Ngày', desc: 'Chuẩn Hôn Lễ', tag: 'Khuyên Dùng' },
                        { days: 5, title: '5 Ngày', desc: 'Đãi Tiệc Ngoại Ô', note: '+800.000₫' },
                        { days: 7, title: '7 Ngày', desc: 'Tuần Lễ Cưới 2 Nhà', note: '+2.400.000₫' },
                      ].map((pkg) => {
                        const isSelected = rentalDays === pkg.days;
                        return (
                          <button
                            key={pkg.days}
                            type="button"
                            onClick={() => handleRentalDaysChange(pkg.days)}
                            className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#733F49] bg-white ring-2 ring-[#733F49]/20 shadow-xs'
                                : 'border-[#EEDECF] bg-[#FAF8F5] hover:bg-white hover:border-[#D5C2B5]'
                            }`}
                          >
                            {pkg.tag && (
                              <span className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#733F49] text-white uppercase tracking-wider shadow-2xs">
                                {pkg.tag}
                              </span>
                            )}
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-playfair font-bold text-[15px] ${
                                  isSelected ? 'text-[#733F49]' : 'text-[#2C2523]'
                                }`}
                              >
                                {pkg.title}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#733F49]" />}
                            </div>
                            <p className="text-[11px] text-[#6B5C5D] m-0 mt-0.5 font-medium">{pkg.desc}</p>
                            {pkg.note && (
                              <span className="text-[10px] text-[#847374] block mt-0.5">{pkg.note}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3 Thẻ Chọn Ngày Tương Tác Kèm DatePicker */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    
                    {/* Thẻ 1: Ngày bắt đầu nhận váy */}
                    <div className="relative bg-[#FCF9F6] p-4 rounded-2xl border border-[#EEDECF] transition-all hover:shadow-xs focus-within:ring-2 focus-within:ring-[#733F49]/20">
                      <label className="block text-[10.5px] font-bold text-[#847374] uppercase tracking-wider mb-1">
                        NGÀY BẮT ĐẦU NHẬN VÁY
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          value={toIsoDateString(rentalSchedule.startDate)}
                          onChange={(e) => {
                            if (e.target.value) {
                              setRentalSchedule({
                                ...rentalSchedule,
                                startDate: toDisplayDateString(e.target.value),
                                endDate: computeEndDate(e.target.value, rentalDays),
                              });
                            }
                          }}
                          className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2 text-[14px] font-bold text-[#2C2523] focus:outline-none focus:border-[#733F49] cursor-pointer"
                        />
                      </div>
                      <span className="text-[10.5px] font-medium text-[#2E7D32] mt-1.5 flex items-center gap-1">
                        <span>✦</span> Thử vừa vặn lần cuối
                      </span>
                    </div>

                    {/* Thẻ 2: Ngày cưới chính thức (Tiêu điểm) */}
                    <div className="relative bg-[#FAF0EC] p-4 rounded-2xl border-2 border-[#F2D8D4] transition-all shadow-xs focus-within:ring-2 focus-within:ring-[#733F49]/30">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10.5px] font-bold text-[#733F49] uppercase tracking-wider">
                          NGÀY CƯỚI CHÍNH THỨC
                        </label>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-[#733F49] text-white uppercase tracking-wider">
                          TỰ ĐỘNG CÂN CHỈNH
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          value={toIsoDateString(rentalSchedule.weddingDate)}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSelectWeddingDate(e.target.value);
                            }
                          }}
                          className="w-full bg-white border border-[#F2D8D4] rounded-xl px-3 py-2 text-[14.5px] font-bold text-[#733F49] focus:outline-none focus:border-[#733F49] cursor-pointer shadow-2xs"
                        />
                      </div>
                      <span className="text-[10.5px] font-bold text-[#733F49] mt-1.5 flex items-center gap-1">
                        <span>★</span> Ngày trọng đại nhất (Click để chọn lịch)
                      </span>
                    </div>

                    {/* Thẻ 3: Ngày hoàn trả váy */}
                    <div className="relative bg-[#FCF9F6] p-4 rounded-2xl border border-[#EEDECF] transition-all hover:shadow-xs focus-within:ring-2 focus-within:ring-[#733F49]/20">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10.5px] font-bold text-[#847374] uppercase tracking-wider">
                          NGÀY HOÀN TRẢ VÁY
                        </label>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-[#FAF0EC] text-[#733F49] border border-[#F2D8D4]">
                          {rentalDays} NGÀY THUÊ
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          value={toIsoDateString(rentalSchedule.endDate)}
                          onChange={(e) => {
                            if (e.target.value) {
                              const newEndIso = e.target.value;
                              const startIso = toIsoDateString(rentalSchedule.startDate);
                              const sD = new Date(startIso);
                              const eD = new Date(newEndIso);
                              if (!isNaN(sD.getTime()) && !isNaN(eD.getTime())) {
                                const diffTime = eD.getTime() - sD.getTime();
                                const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
                                if (diffDays >= 2 && diffDays <= 30) {
                                  setRentalDays(diffDays);
                                }
                              }
                              setRentalSchedule({
                                ...rentalSchedule,
                                endDate: toDisplayDateString(newEndIso),
                              });
                            }
                          }}
                          className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2 text-[14px] font-bold text-[#2C2523] focus:outline-none focus:border-[#733F49] cursor-pointer"
                        />
                      </div>
                      <span className="text-[10.5px] font-medium text-[#6B5C5D] mt-1.5 flex items-center gap-1">
                        <span>✦</span> Hoàn cọc ngay khi nhận
                      </span>
                    </div>

                  </div>

                  {/* Bảng Lịch Trực Quan Tháng (Interactive Calendar Visual Picker) */}
                  <div className="bg-[#FCF9F6] rounded-2xl border border-[#EEDECF] p-4 sm:p-5 mb-6">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EEDECF] mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#FAF0EC] text-[#733F49] flex items-center justify-center font-bold">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-playfair text-[15px] font-bold text-[#2C2523] m-0">
                            Bảng Lịch Thuê & Ngày Hôn Lễ: Tháng {calendarViewDate.getMonth() + 1}/{calendarViewDate.getFullYear()}
                          </h4>
                          <span className="text-[11px] text-[#847374]">
                            Nhấp vào ngày bất kỳ để đổi ngày cưới, hệ thống sẽ tự động cập nhật dải ngày thuê
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const prev = new Date(calendarViewDate);
                            prev.setMonth(prev.getMonth() - 1);
                            setCalendarViewDate(prev);
                          }}
                          className="w-7 h-7 rounded-lg border border-[#EEDECF] bg-white hover:bg-[#FAF0EC] text-[#733F49] flex items-center justify-center cursor-pointer transition-colors"
                          title="Tháng trước"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const weddingD = new Date(toIsoDateString(rentalSchedule.weddingDate));
                            if (!isNaN(weddingD.getTime())) {
                              setCalendarViewDate(new Date(weddingD.getFullYear(), weddingD.getMonth(), 1));
                            }
                          }}
                          className="px-2 py-1 text-[11px] font-bold text-[#733F49] bg-white border border-[#EEDECF] rounded-lg hover:bg-[#FAF0EC] cursor-pointer"
                        >
                          Về tháng cưới
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Date(calendarViewDate);
                            next.setMonth(next.getMonth() + 1);
                            setCalendarViewDate(next);
                          }}
                          className="w-7 h-7 rounded-lg border border-[#EEDECF] bg-white hover:bg-[#FAF0EC] text-[#733F49] flex items-center justify-center cursor-pointer transition-colors"
                          title="Tháng sau"
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    {/* Calendar Day Grid */}
                    {(() => {
                      const year = calendarViewDate.getFullYear();
                      const month = calendarViewDate.getMonth();
                      const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
                      // Adjust so Monday is 0
                      const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
                      const daysInMonth = new Date(year, month + 1, 0).getDate();

                      const startIso = toIsoDateString(rentalSchedule.startDate);
                      const weddingIso = toIsoDateString(rentalSchedule.weddingDate);
                      const endIso = toIsoDateString(rentalSchedule.endDate);

                      const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
                      const cells = [];

                      for (let i = 0; i < startOffset; i++) {
                        cells.push(<div key={`empty-${i}`} className="h-10 sm:h-12" />);
                      }

                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const isStart = dateStr === startIso;
                        const isWedding = dateStr === weddingIso;
                        const isEnd = dateStr === endIso;
                        const isInRange = startIso && endIso && dateStr >= startIso && dateStr <= endIso;

                        cells.push(
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => handleSelectWeddingDate(dateStr)}
                            className={`relative h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-[12px] sm:text-[13px] font-semibold transition-all border-0 cursor-pointer ${
                              isWedding
                                ? 'bg-[#733F49] text-white shadow-md ring-2 ring-[#D4AF37] z-10 scale-105'
                                : isStart
                                ? 'bg-[#2E7D32] text-white shadow-xs z-10'
                                : isEnd
                                ? 'bg-[#847374] text-white shadow-xs z-10'
                                : isInRange
                                ? 'bg-[#FAF0EC] text-[#733F49] font-bold border-y border-[#F2D8D4]'
                                : 'bg-white text-[#2C2523] hover:bg-[#FAF0EC] hover:text-[#733F49]'
                            }`}
                          >
                            <span>{d}</span>
                            {isWedding && (
                              <span className="text-[9px] font-bold leading-none text-amber-200">★ CƯỚI</span>
                            )}
                            {isStart && (
                              <span className="text-[8.5px] font-bold leading-none text-emerald-100">NHẬN</span>
                            )}
                            {isEnd && (
                              <span className="text-[8.5px] font-bold leading-none text-stone-200">TRẢ</span>
                            )}
                          </button>
                        );
                      }

                      return (
                        <div>
                          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[11px] font-bold text-[#847374] mb-1.5">
                            {dayNames.map((n) => (
                              <div key={n} className="py-1">
                                {n}
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">{cells}</div>
                        </div>
                      );
                    })()}

                    {/* Timeline Legend Footer */}
                    <div className="mt-3.5 pt-3 border-t border-[#EEDECF] flex flex-wrap items-center justify-between gap-2.5 text-[11.5px]">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 text-[#2E7D32] font-semibold">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
                          Ngày nhận váy ({rentalSchedule.startDate})
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#733F49] font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#733F49] ring-2 ring-[#D4AF37]" />
                          Ngày cưới chính thức ({rentalSchedule.weddingDate})
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#847374] font-semibold">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#847374]" />
                          Ngày hoàn trả váy ({rentalSchedule.endDate})
                        </span>
                      </div>
                      <div className="font-bold text-[#733F49] bg-[#FAF0EC] px-2.5 py-1 rounded-lg border border-[#F2D8D4]">
                        ✓ Trọn gói thuê {rentalDays} ngày cao cấp
                      </div>
                    </div>
                  </div>

                  {/* Delivery Mode */}
                  <div>
                    <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-2.5">
                      PHƯƠNG THỨC BÀN GIAO LỄ PHỤC
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div
                        onClick={() => setDeliveryMethod('direct')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${deliveryMethod === 'direct'
                            ? 'border-[#733F49] bg-[#FAF3F0] ring-1 ring-[#733F49]'
                            : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[13.5px] text-[#2C2523]">
                            Nhận tại Showroom Atelier (Khuyên dùng)
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                            MIỄN PHÍ
                          </span>
                        </div>
                        <p className="text-[11.5px] text-[#6B5C5D] m-0">
                          Chuyên viên may đo hỗ trợ mặc thử, căn chỉnh phom dáng trực tiếp trên sân khấu catwalk trước khi mang về.
                        </p>
                      </div>

                      <div
                        onClick={() => setDeliveryMethod('delivery')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${deliveryMethod === 'delivery'
                            ? 'border-[#733F49] bg-[#FAF3F0] ring-1 ring-[#733F49]'
                            : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[13.5px] text-[#2C2523]">
                            Giao tận nơi bằng Vali Chuyên Dụng
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF0EC] text-[#B8737D]">
                            VIP COURIER
                          </span>
                        </div>
                        <p className="text-[11.5px] text-[#6B5C5D] m-0">
                          Vali giữ nhiệt chống ẩm, móc treo gỗ tơ tằm bảo vệ phom váy tuyệt đối, giao đúng giờ hẹn.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. SỐ ĐO CƠ THỂ MAY ĐO */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex items-center justify-between pb-5 border-b border-[#F5EDE8] mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#B8737D]">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-playfair text-[19px] sm:text-[21px] font-semibold text-[#2C2523] m-0">
                          Số Đo May Đo & Tinh Chỉnh Phom Váy
                        </h2>
                        <p className="text-[12px] text-[#847374] m-0 mt-0.5">
                          Hệ thống đan dây corsetry Pháp cho phép tùy chỉnh nới/siết linh hoạt từ 2 - 4cm
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                    <div className="bg-[#FCF9F6] p-3 rounded-xl border border-[#EEDECF]">
                      <label className="text-[10px] font-bold uppercase text-[#847374] block mb-1">CHIỀU CAO (CM)</label>
                      <input
                        type="text"
                        value={measurements.height}
                        onChange={(e) => setMeasurements({ ...measurements, height: e.target.value })}
                        className="w-full bg-white border border-[#EEDECF] rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-[#2C2523] text-center"
                      />
                    </div>
                    <div className="bg-[#FCF9F6] p-3 rounded-xl border border-[#EEDECF]">
                      <label className="text-[10px] font-bold uppercase text-[#847374] block mb-1">CÂN NẶNG (KG)</label>
                      <input
                        type="text"
                        value={measurements.weight}
                        onChange={(e) => setMeasurements({ ...measurements, weight: e.target.value })}
                        className="w-full bg-white border border-[#EEDECF] rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-[#2C2523] text-center"
                      />
                    </div>
                    <div className="bg-[#FCF9F6] p-3 rounded-xl border border-[#EEDECF]">
                      <label className="text-[10px] font-bold uppercase text-[#847374] block mb-1">VÒNG 1 (NGỰC)</label>
                      <input
                        type="text"
                        value={measurements.bust}
                        onChange={(e) => setMeasurements({ ...measurements, bust: e.target.value })}
                        className="w-full bg-white border border-[#EEDECF] rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-[#2C2523] text-center"
                      />
                    </div>
                    <div className="bg-[#FAF0EC] p-3 rounded-xl border border-[#F2D8D4]">
                      <label className="text-[10px] font-bold uppercase text-[#733F49] block mb-1">VÒNG 2 (EO * QUAN TRỌNG)</label>
                      <input
                        type="text"
                        value={measurements.waist}
                        onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })}
                        className="w-full bg-white border border-[#F2D8D4] rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-[#733F49] text-center"
                      />
                    </div>
                    <div className="bg-[#FCF9F6] p-3 rounded-xl border border-[#EEDECF]">
                      <label className="text-[10px] font-bold uppercase text-[#847374] block mb-1">VÒNG 3 (MÔNG)</label>
                      <input
                        type="text"
                        value={measurements.hips}
                        onChange={(e) => setMeasurements({ ...measurements, hips: e.target.value })}
                        className="w-full bg-white border border-[#EEDECF] rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-[#2C2523] text-center"
                      />
                    </div>
                    <div className="bg-[#FCF9F6] p-3 rounded-xl border border-[#EEDECF]">
                      <label className="text-[10px] font-bold uppercase text-[#847374] block mb-1">CAO GIÀY CƯỚI</label>
                      <input
                        type="text"
                        value={measurements.heel}
                        onChange={(e) => setMeasurements({ ...measurements, heel: e.target.value })}
                        className="w-full bg-white border border-[#EEDECF] rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-[#2C2523] text-center"
                      />
                    </div>
                  </div>

                  <div className="text-[11.5px] text-[#6B5C5D] italic">
                    ✦ Nếu nàng chưa đo chính xác, chuyên viên Atelier sẽ gọi video hướng dẫn hoặc đo trực tiếp tại buổi thử váy.
                  </div>
                </section>

                {/* Continue Button to Step 2 */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProceedToContract}
                    className="w-full py-4 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white font-jakarta text-[14px] font-bold tracking-wider uppercase transition-all shadow-[0_4px_16px_rgba(115,63,73,0.3)] hover:shadow-[0_6px_22px_rgba(115,63,73,0.4)] cursor-pointer border-0 flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <span>TIẾP TỤC: XEM & KÝ HỢP ĐỒNG ĐIỆN TỬ (BƯỚC 2)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* ================= STEP 2: XEM & KÝ HỢP ĐỒNG ĐIỆN TỬ ================= */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in">

                {/* Contract Paper Box */}
                <section className="bg-white rounded-3xl border-2 border-[#D4AF37]/40 shadow-[0_12px_45px_rgba(115,63,73,0.08)] p-6 sm:p-10 space-y-6">

                  {/* National Emblem & Title */}
                  <div className="text-center pb-6 border-b border-[#F0E5DC] space-y-1.5">
                    <div className="font-playfair text-[12.5px] font-bold uppercase tracking-wider text-[#2C2523]">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </div>
                    <div className="text-[12px] italic text-[#6B5C5D]">
                      Độc lập — Tự do — Hạnh phúc
                    </div>
                    <div className="w-16 h-[1.5px] bg-[#D4AF37] mx-auto my-2" />
                    <h2 className="font-playfair text-[22px] sm:text-[26px] font-bold text-[#733F49] mt-3 mb-1">
                      HỢP ĐỒNG THUÊ LỄ PHỤC CƯỚI CAO CẤP
                    </h2>
                    <span className="font-mono text-[12px] text-[#847374] block">
                      Số: HĐ-UB-2026/8992 • Cấp ngày: {new Date().toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Parties Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12.5px] bg-[#FCF9F6] p-4.5 rounded-2xl border border-[#EEDECF]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#847374] block mb-1">
                        BÊN CHO THUÊ (BÊN A):
                      </span>
                      <strong className="text-[#2C2523] block text-[13.5px]">CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE</strong>
                      <span className="text-[#6B5C5D] block mt-0.5">Mã số thuế: 0316889988</span>
                      <span className="text-[#6B5C5D] block">Showroom Flagship: 88 Nam Kỳ Khởi Nghĩa, Q.1, TP. HCM</span>
                      <span className="text-[#6B5C5D] block">Đại diện: <strong>Ông Kim Xuân Hiếu</strong> (Tổng Giám Đốc UniBridal)</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#733F49] block mb-1">
                        BÊN THUÊ LỄ PHỤC (BÊN B):
                      </span>
                      <strong className="text-[#733F49] block text-[13.5px]">{brideName}</strong>
                      <span className="text-[#6B5C5D] block mt-0.5">Số CCCD / CMND: <strong>{cccd}</strong></span>
                      <span className="text-[#6B5C5D] block">Số điện thoại: {phone} • Email: {email}</span>
                      <span className="text-[#6B5C5D] block truncate">Địa chỉ: {address}</span>
                    </div>
                  </div>

                  {/* Contract Clauses */}
                  <div className="space-y-4 text-[12.5px] leading-relaxed text-[#4A3B3D]">

                    <div className="p-3.5 rounded-xl bg-[#FAF4EE] border border-[#EEDECF]">
                      <strong className="text-[#733F49] block mb-1">
                        ĐIỀU 1: THÔNG TIN TRANG PHỤC & THỜI HẠN THUÊ
                      </strong>
                      <p className="m-0 text-[#6B5C5D]">
                        1.1. Bên A đồng ý cho Bên B thuê tác phẩm váy cưới <strong>{activeDress?.name}</strong> (Mã: <strong>{activeDress?.code || 'UB-HC-2026'}</strong>), Size: <strong>{selectedSize}</strong>.<br />
                        1.2. Thời gian thuê: <strong>{rentalDays} ngày</strong>, nhận váy từ ngày <strong>{rentalSchedule.startDate}</strong> và hoàn trả trước 20:00 ngày <strong>{rentalSchedule.endDate}</strong>.<br />
                        1.3. Lễ phục được giặt sấy tiệt trùng sinh học, ủi phẳng phiu và tinh chỉnh số đo hoàn thiện trước giờ trao nhận 2 giờ.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF4EE] border border-[#EEDECF]">
                      <strong className="text-[#733F49] block mb-1">
                        ĐIỀU 2: GIÁ THUÊ, TIỀN CỌC GIỮ LỊCH & CỌC BẢO LÃNH HOÀN TRẢ
                      </strong>
                      <p className="m-0 text-[#6B5C5D]">
                        2.1. Tổng chi phí thuê váy: <strong>{totalRentPrice.toLocaleString('vi-VN')}₫</strong>.<br />
                        2.2. Tiền đặt cọc giữ lịch: <strong>{amountToPayToday.toLocaleString('vi-VN')}₫</strong> (thanh toán tại Bước 3).<br />
                        2.3. Tiền cọc bảo lãnh hoàn trả: <strong>{depositCollateral.toLocaleString('vi-VN')}₫</strong>. Bên A cam kết <strong>hoàn trả 100%</strong> tự động qua tài khoản ngân hàng của Bên B trong vòng 24 giờ sau khi kiểm tra váy nguyên vẹn khi hoàn trả.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF4EE] border border-[#EEDECF]">
                      <strong className="text-[#733F49] block mb-1">
                        ĐIỀU 3: QUY ĐỊNH BẢO QUẢN & BỒI THƯỜNG
                      </strong>
                      <p className="m-0 text-[#6B5C5D]">
                        3.1. Bên B có trách nhiệm bảo quản lễ phục trong suốt thời gian tổ chức hôn lễ.<br />
                        3.2. Tuyệt đối không tự ý cắt may, tẩy nhuộm hoặc đem váy tới tiệm giặt ủi thông thường.<br />
                        3.3. Trường hợp làm bẩn bùn đất/rượu vang thông thường, UniBridal hỗ trợ xử lý sinh học miễn phí. Nếu phát sinh rách lớn hoặc hư hại hạt pha lê do bất cẩn, chi phí phục hồi sẽ được khấu trừ minh bạch theo phụ lục hợp đồng.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF4EE] border border-[#EEDECF]">
                      <strong className="text-[#733F49] block mb-1">
                        ĐIỀU 4: CHÍNH SÁCH ĐỔI NGÀY CƯỚI & GIÁ TRỊ PHÁP LÝ CHỮ KÝ SỐ
                      </strong>
                      <p className="m-0 text-[#6B5C5D]">
                        4.1. Bên B được quyền dời ngày thuê miễn phí nếu thông báo trước tối thiểu 15 ngày.<br />
                        4.2. Hợp đồng này được xác lập dưới dạng điện tử, có giá trị pháp lý tương đương bản ký tay theo Luật Giao dịch điện tử số 20/2023/QH15.
                      </p>
                    </div>

                  </div>

                  {/* Digital Signature Box */}
                  <div className="pt-4 border-t border-[#F0E5DC] grid grid-cols-1 sm:grid-cols-2 gap-6">

                    {/* Bên A Signature */}
                    <div className="p-4 rounded-2xl bg-[#FCF9F6] border border-[#EEDECF] text-center space-y-2">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#847374] block">
                        ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
                      </span>
                      <div className="h-16 flex items-center justify-center">
                        <div className="border-2 border-[#D4AF37] px-4 py-1.5 rounded-xl bg-[#FFFDF9] text-[#733F49] shadow-xs">
                          <div className="font-playfair font-bold text-[13px] tracking-wide text-[#733F49]">
                            UNIBRIDAL ATELIER
                          </div>
                          <span className="text-[9px] uppercase tracking-wider text-[#2E7D32] font-mono block">
                            ✓ E-SIGNED & TIMESTAMPED
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-[12.5px] text-[#2C2523] block">
                        Ông Kim Xuân Hiếu (Tổng Giám Đốc)
                      </span>
                    </div>

                    {/* Bên B Signature Pad (Ký Điện Tử Tự Tay) */}
                    <div className="p-4 rounded-2xl bg-[#FAF0EC] border-2 border-[#F2D8D4] space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#F2D8D4]">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#733F49] block">
                          ĐẠI DIỆN BÊN THUÊ (BÊN B - CÔ DÂU KÝ TAY)
                        </span>
                        
                        {/* Chuyển chế độ Ký tay / Ký gõ tên */}
                        <div className="flex items-center bg-white/80 p-0.5 rounded-lg border border-[#F2D8D4] text-[10.5px] font-bold">
                          <button
                            type="button"
                            onClick={() => setSignatureMode('draw')}
                            className={`px-2 py-0.5 rounded-md transition-colors border-0 cursor-pointer ${
                              signatureMode === 'draw'
                                ? 'bg-[#733F49] text-white'
                                : 'bg-transparent text-[#733F49] hover:bg-[#FAF0EC]'
                            }`}
                          >
                            ✍️ Ký tay
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignatureMode('type')}
                            className={`px-2 py-0.5 rounded-md transition-colors border-0 cursor-pointer ${
                              signatureMode === 'type'
                                ? 'bg-[#733F49] text-white'
                                : 'bg-transparent text-[#733F49] hover:bg-[#FAF0EC]'
                            }`}
                          >
                            ⌨️ Gõ họ tên
                          </button>
                        </div>
                      </div>

                      {signatureMode === 'draw' ? (
                        /* BẢNG KÝ TAY CANVAS ĐIỆN TỬ */
                        <div className="space-y-2">
                          <div className="relative w-full h-32 bg-[#FFFDFB] rounded-xl border-2 border-dashed border-[#EEDECF] overflow-hidden flex items-center justify-center shadow-inner">
                            {!hasDrawnSignature && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-[#A39284] select-none text-[11.5px] space-y-1">
                                <span className="font-playfair italic text-[15px] text-[#C5A880]">
                                  ✍️ Dùng chuột, ngón tay hoặc bút cảm ứng để vẽ chữ ký của nàng tại đây
                                </span>
                                <span className="text-[10px] text-[#A39284] font-mono">
                                  Hỗ trợ ký cảm ứng đa điểm trên điện thoại, máy tính bảng & máy tính
                                </span>
                              </div>
                            )}
                            <canvas
                              ref={signatureCanvasRef}
                              width={480}
                              height={130}
                              onMouseDown={handleStartDraw}
                              onMouseMove={handleMoveDraw}
                              onMouseUp={handleEndDraw}
                              onMouseLeave={handleEndDraw}
                              onTouchStart={handleStartDraw}
                              onTouchMove={handleMoveDraw}
                              onTouchEnd={handleEndDraw}
                              className="w-full h-full cursor-crosshair touch-none"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="font-semibold text-[#2E7D32] flex items-center gap-1">
                              {hasDrawnSignature ? '✓ Chữ ký điện tử đã được ghi nhận' : 'Vui lòng ký vào ô phía trên'}
                            </span>
                            <button
                              type="button"
                              onClick={handleClearSignature}
                              className="text-[#733F49] font-bold hover:underline bg-transparent border-0 cursor-pointer flex items-center gap-1"
                            >
                              <span>↺</span> Xóa ký lại
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* CHẾ ĐỘ GÕ HỌ TÊN */
                        <div className="space-y-2 py-1">
                          <div className="h-20 flex flex-col items-center justify-center bg-[#FFFDFB] rounded-xl border border-[#F2D8D4] p-2">
                            <div className="font-playfair italic font-bold text-[24px] text-[#733F49] tracking-wider select-none">
                              {contractSignature && !contractSignature.startsWith('data:image') ? contractSignature : brideName}
                            </div>
                            <span className="text-[9.5px] font-mono text-[#2E7D32] font-semibold mt-1">
                              ✓ XÁC THỰC CHỮ KÝ ĐIỆN TỬ THEO TÊN CÔ DÂU
                            </span>
                          </div>
                          <input
                            type="text"
                            value={contractSignature && !contractSignature.startsWith('data:image') ? contractSignature : ''}
                            onChange={(e) => setContractSignature(e.target.value)}
                            placeholder="Nhập họ tên cô dâu để xác thực chữ ký"
                            className="w-full text-center bg-white border border-[#F2D8D4] rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-[#733F49] focus:outline-none focus:border-[#733F49]"
                          />
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasAgreedContractTerms}
                        onChange={(e) => setHasAgreedContractTerms(e.target.checked)}
                        className="mt-1 accent-[#733F49] w-4 h-4 rounded shrink-0"
                      />
                      <span className="text-[12.5px] text-[#4A3E3D] leading-relaxed">
                        Tôi là <strong>{brideName}</strong>, xác nhận đã đọc kỹ, thấu hiểu toàn bộ điều khoản Hợp đồng cho thuê lễ phục cao cấp và cam kết chữ ký điện tử này có đầy đủ giá trị pháp lý song phương.
                      </span>
                    </label>
                  </div>

                  {/* Actions for Step 2 */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#F0E5DC]">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#EEDECF] text-[#2C2523] text-[13px] font-bold hover:bg-[#FAF0EC] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Quay lại Bước 1: Sửa thông tin</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSignAndProceedToPayment}
                      className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white font-jakarta text-[13.5px] font-bold tracking-wider uppercase transition-all shadow-[0_4px_16px_rgba(115,63,73,0.3)] hover:shadow-[0_6px_22px_rgba(115,63,73,0.4)] cursor-pointer border-0 flex items-center justify-center gap-2"
                    >
                      <span>KÝ HỢP ĐỒNG & CHUYỂN SANG THANH TOÁN (BƯỚC 3)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </section>

              </div>
            )}

            {/* ================= STEP 3: ĐẶT CỌC & THANH TOÁN ================= */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-fade-in">

                {/* Contract Signed Success Banner */}
                <div className="bg-[#E8F5E9] border border-[#C8E6C9] p-4.5 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2E7D32] text-white flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-bold text-[13.5px] text-[#2E7D32]">
                        Hợp Đồng Thuê #HĐ-UB-2026/8992 Đã Ký Điện Tử Thành Công!
                      </div>
                      <div className="text-[11.5px] text-[#6B5C5D]">
                        Bản hợp đồng pháp lý đã gắn mã số bảo mật và sẵn sàng tải về sau khi cọc giữ lịch.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[12px] font-bold text-[#733F49] hover:underline bg-transparent border-0 cursor-pointer shrink-0"
                  >
                    Xem lại hợp đồng
                  </button>
                </div>

                {/* 1. CHỌN HÌNH THỨC ĐẶT CỌC */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F5EDE8] mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#B8737D]">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-playfair text-[19px] sm:text-[21px] font-semibold text-[#2C2523] m-0">
                        Chọn Phương Án Đặt Cọc Giữ Lịch
                      </h2>
                      <p className="text-[12px] text-[#847374] m-0 mt-0.5">
                        Thanh toán cọc ngay để khóa lịch váy độc quyền không nhận thêm lịch khác
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option 1: 50% deposit */}
                    <div
                      onClick={() => setDepositOption('deposit30')}
                      className={`rounded-2xl p-5 border cursor-pointer transition-all relative ${depositOption === 'deposit30'
                          ? 'border-[#733F49] bg-[#FAF3F0] ring-2 ring-[#733F49]/20 shadow-xs'
                          : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-jakarta font-bold text-[14px] text-[#2C2523]">
                          Đặt cọc giữ lịch 50%
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF0EC] text-[#733F49]">
                          PHỔ BIẾN NHẤT
                        </span>
                      </div>
                      <div className="font-playfair font-bold text-[24px] text-[#733F49] mb-1">
                        {Math.round(totalRentPrice * 0.5).toLocaleString('vi-VN')}₫
                      </div>
                      <p className="text-[11.5px] text-[#6B5C5D] m-0 leading-relaxed">
                        Thanh toán 50% hôm nay để giữ lịch. Phần còn lại {Math.round(totalRentPrice * 0.5).toLocaleString('vi-VN')}₫ thanh toán khi nhận bàn giao váy.
                      </p>
                    </div>

                    {/* Option 2: 100% full pay */}
                    <div
                      onClick={() => setDepositOption('full100')}
                      className={`rounded-2xl p-5 border cursor-pointer transition-all relative ${depositOption === 'full100'
                          ? 'border-[#733F49] bg-[#FAF3F0] ring-2 ring-[#733F49]/20 shadow-xs'
                          : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-jakarta font-bold text-[14px] text-[#2C2523]">
                          Thanh toán 100% trọn gói
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                          TẶNG VOAN REN CAO CẤP
                        </span>
                      </div>
                      <div className="font-playfair font-bold text-[24px] text-[#733F49] mb-1">
                        {totalRentPrice.toLocaleString('vi-VN')}₫
                      </div>
                      <p className="text-[11.5px] text-[#6B5C5D] m-0 leading-relaxed">
                        Thanh toán toàn bộ phí thuê váy hôm nay. Tặng miễn phí mượn bộ voan cài đầu ren Pháp đồng bộ trị giá 1.500.000₫.
                      </p>
                    </div>
                  </div>
                </section>

                {/* 2. THANH TOÁN BẰNG QUÉT MÃ VIETQR */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F5EDE8] mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#B8737D]">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-playfair text-[19px] sm:text-[21px] font-semibold text-[#2C2523] m-0">
                        Thanh Toán Đặt Cọc Bằng Quét Mã VietQR
                      </h2>
                      <p className="text-[12px] text-[#847374] m-0 mt-0.5">
                        Chuyển khoản 24/7 tức thì qua mã VietQR liên ngân hàng, tự động xác nhận đơn cọc
                      </p>
                    </div>
                  </div>

                  {/* VietQR Payment Details Box */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-[#FCF9F6] border border-[#EEDECF] flex flex-col md:flex-row items-center gap-6">
                    {/* QR Box */}
                    <div className="w-48 h-52 bg-white p-3 rounded-2xl border border-[#EEDECF] shadow-sm flex flex-col items-center justify-center shrink-0">
                      <QrCode className="w-36 h-36 text-[#2C2523]" />
                      <span className="text-[10.5px] font-mono text-[#733F49] font-bold mt-1.5 tracking-wider">
                        VIETQR 24/7 PRO
                      </span>
                    </div>

                    {/* Bank Transfer Details */}
                    <div className="space-y-3 text-[13px] flex-1 w-full">
                      <div>
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#847374] block mb-0.5">
                          NGÂN HÀNG THỤ HƯỞNG
                        </span>
                        <strong className="text-[#2C2523] text-[15px]">
                          Techcombank — Chi nhánh TP. Hồ Chí Minh
                        </strong>
                      </div>

                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#EEDECF]">
                        <div>
                          <span className="text-[10px] text-[#847374] block uppercase font-bold">SỐ TÀI KHOẢN:</span>
                          <strong className="font-mono text-[16px] text-[#733F49] tracking-wider">
                            1903 8899 2200 88
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('19038899220088')}
                          className="px-3 py-1.5 text-[11.5px] font-bold text-[#733F49] bg-[#FAF0EC] rounded-lg border border-[#F2D8D4] hover:bg-[#F2DDD9] cursor-pointer transition-colors"
                        >
                          Sao chép
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#EEDECF]">
                        <div>
                          <span className="text-[10px] text-[#847374] block uppercase font-bold">SỐ TIỀN CỌC HÔM NAY:</span>
                          <strong className="font-mono text-[16px] text-[#2E7D32]">
                            {amountToPayToday.toLocaleString('vi-VN')}₫
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(String(amountToPayToday))}
                          className="px-3 py-1.5 text-[11.5px] font-bold text-[#733F49] bg-[#FAF0EC] rounded-lg border border-[#F2D8D4] hover:bg-[#F2DDD9] cursor-pointer transition-colors"
                        >
                          Sao chép
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#EEDECF]">
                        <div>
                          <span className="text-[10px] text-[#847374] block uppercase font-bold">NỘI DUNG CHUYỂN KHOẢN:</span>
                          <strong className="font-mono text-[14px] text-[#733F49]">
                            UB COC 8992 {phone.replace(/\s/g, '')}
                          </strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`UB COC 8992 ${phone.replace(/\s/g, '')}`)}
                          className="px-3 py-1.5 text-[11.5px] font-bold text-[#733F49] bg-[#FAF0EC] rounded-lg border border-[#F2D8D4] hover:bg-[#F2DDD9] cursor-pointer transition-colors"
                        >
                          Sao chép
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Confirm Final Payment Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#EEDECF] text-[#2C2523] text-[13px] font-bold hover:bg-[#FAF0EC] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại Bước 2: Xem Hợp đồng</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmFinalPayment}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white font-jakarta text-[14px] font-bold tracking-wider uppercase transition-all shadow-[0_4px_16px_rgba(115,63,73,0.3)] hover:shadow-[0_6px_22px_rgba(115,63,73,0.4)] cursor-pointer border-0 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>XÁC NHẬN THANH TOÁN & KHÓA LỊCH ĐẶT THUÊ</span>
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* ================= RIGHT COLUMN: STICKY SUMMARY CARD ================= */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-4 print:hidden">

            <div className="bg-white rounded-3xl border border-[#F0E5DC] shadow-[0_8px_32px_rgba(44,37,35,0.06)] overflow-hidden">

              {/* Card Header Bar */}
              <div className="bg-[#FAF4EE] px-5 py-3.5 border-b border-[#EEDECF] flex items-center justify-between gap-2 text-[12px]">
                <div className="truncate">
                  <span className="font-bold text-[#733F49] uppercase tracking-wide text-[11px]">
                    LỄ PHỤC THUÊ ĐỘC BẢN
                  </span>
                  <span className="text-[#847374] ml-1.5 hidden sm:inline">
                    • {activeDress?.silhouette || 'Ballgown'}
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-[10.5px] font-bold text-[#B8737D] bg-white px-2 py-0.5 rounded-full border border-[#F2D8D4]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Cọc bảo lãnh: {depositCollateral.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 space-y-5">

                {/* Product Info Row */}
                <div className="flex gap-4 pb-5 border-b border-[#F5EDE8]">
                  <div className="relative w-20 h-26 rounded-xl overflow-hidden shrink-0 border border-[#EEDECF]">
                    <img
                      src={activeDress?.images?.[0] || activeDress?.image}
                      alt={activeDress?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-playfair font-bold text-[16px] text-[#2C2523] leading-snug truncate">
                      {activeDress?.name}
                    </div>
                    <div className="text-[12px] text-[#847374] mt-0.5">
                      Mã: <span className="font-mono text-[#733F49] font-bold">{activeDress?.code || 'UB-HC-2026'}</span>
                    </div>
                    <div className="text-[11.5px] text-[#6B5C5D] mt-1">
                      Size: <strong>{selectedSize}</strong> • Gói {rentalDays} ngày
                    </div>
                    <div className="font-playfair font-bold text-[17px] text-[#733F49] mt-2">
                      {totalRentPrice.toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                </div>

                {/* Progress / Step Overview Badge */}
                <div className="bg-[#FCF9F6] p-3 rounded-xl border border-[#EEDECF] space-y-1 text-[12px]">
                  <div className="flex items-center justify-between text-[#847374]">
                    <span>Tiến độ hợp đồng:</span>
                    <strong className="text-[#733F49]">
                      {currentStep === 1 && 'Bước 1: Điền thông tin'}
                      {currentStep === 2 && 'Bước 2: Ký hợp đồng điện tử'}
                      {currentStep === 3 && 'Bước 3: Đặt cọc giữ lịch'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[#847374]">
                    <span>Trạng thái chữ ký:</span>
                    <strong className={isContractSigned ? 'text-[#2E7D32]' : 'text-[#D4AF37]'}>
                      {isContractSigned ? '✓ Đã ký hợp đồng' : 'Chưa ký'}
                    </strong>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-[13px]">
                  <div className="flex items-center justify-between text-[#6B5C5D]">
                    <span>Giá thuê lễ phục ({rentalDays} ngày):</span>
                    <span className="font-bold text-[#2C2523]">{totalRentPrice.toLocaleString('vi-VN')}₫</span>
                  </div>
                  {rentalDays > 4 && (
                    <div className="flex items-center justify-between text-[11px] text-[#847374] pl-2 border-l-2 border-[#EEDECF]">
                      <span>Bao gồm {rentalDays - 4} ngày gia hạn (+800k/ngày):</span>
                      <span className="font-semibold text-[#733F49]">+{((rentalDays - 4) * 800000).toLocaleString('vi-VN')}₫</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[#6B5C5D]">
                    <span>Dịch vụ giặt sấy tiệt trùng:</span>
                    <span className="font-bold text-[#2E7D32]">0₫ (Miễn Phí)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6B5C5D]">
                    <span>May đo & chỉnh phom theo số đo:</span>
                    <span className="font-bold text-[#2E7D32]">0₫ (Miễn Phí)</span>
                  </div>

                  <div className="pt-3 border-t border-[#F5EDE8] flex items-center justify-between">
                    <div>
                      <span className="text-[13.5px] font-bold text-[#2C2523] block">Số tiền cọc hôm nay:</span>
                      <span className="text-[11px] text-[#847374]">
                        {depositOption === 'deposit30' ? '(Tạm ứng cọc giữ lịch 50%)' : '(Thanh toán 100% trọn gói)'}
                      </span>
                    </div>
                    <span className="font-playfair font-bold text-[22px] text-[#733F49]">
                      {amountToPayToday.toLocaleString('vi-VN')}₫
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#E8F5E9]/50 border border-[#C8E6C9] text-[11px] text-[#2E7D32] space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>CAM KẾT HOÀN CỌC 100%:</span>
                    </div>
                    <p className="m-0 text-[#6B5C5D]">
                      Khoản tiền cọc bảo lãnh {depositCollateral.toLocaleString('vi-VN')}₫ sẽ được hoàn trả tự động vào tài khoản nàng trong vòng 24h sau khi nhận lại lễ phục nguyên vẹn.
                    </p>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

      {/* ================= SUCCESS MODAL (HOÀN TẤT ĐẶT THUÊ & HỢP ĐỒNG ĐÃ KÝ) ================= */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-[620px] bg-white rounded-3xl shadow-2xl border border-[#EEDECF] overflow-hidden p-6 sm:p-8 text-center space-y-5">

            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-[2px] text-[#D4AF37] block mb-1">
                ★ HỢP ĐỒNG SỐ #HĐ-UB-2026/8992 ĐÃ KÍCH HOẠT ★
              </span>
              <h2 className="font-playfair text-[24px] sm:text-[30px] font-bold text-[#2C2523] m-0 mb-2">
                Khóa Lịch Đặt Thuê Thành Công!
              </h2>
              <p className="text-[13.5px] text-[#6B5C5D] leading-relaxed max-w-[500px] mx-auto m-0">
                Chúc mừng cô dâu <strong>{brideName}</strong>. Hợp đồng cho thuê tác phẩm <strong>{activeDress?.name}</strong> đã được ký kết điện tử thành công và lịch độc quyền đã được khóa cho hôn lễ của nàng.
              </p>
            </div>

            {/* Contract Ticket Voucher */}
            <div className="bg-[#FAF4EE] p-4.5 rounded-2xl border border-[#EEDECF] text-left text-[12.5px] space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#EEDECF]">
                <span className="text-[#847374]">Mã Đơn / Hợp Đồng:</span>
                <strong className="font-mono text-[#733F49] text-[14px]">{createdOrder?.contractCode || createdOrder?.orderCode || 'HĐ-UB-2026/8992'}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#847374]">Trang phục:</span>
                <strong className="text-[#2C2523]">{activeDress?.name} (Size {selectedSize})</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#847374]">Thời gian nhận:</span>
                <strong className="text-[#2C2523]">{rentalSchedule.startDate} — {rentalSchedule.endDate}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#847374]">Chữ ký số bên B:</span>
                {contractSignature && contractSignature.startsWith('data:image') ? (
                  <div className="flex items-center gap-2">
                    <img src={contractSignature} alt="Chữ ký cô dâu" className="h-8 object-contain bg-white px-2 rounded border border-[#EEDECF]" />
                    <span className="text-[#2E7D32] text-[11px] font-bold">✓ Ký tay hợp lệ</span>
                  </div>
                ) : (
                  <strong className="text-[#2E7D32]">✓ Đã ký bởi {brideName}</strong>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#847374]">Đại diện Bên A:</span>
                <strong className="text-[#2C2523]">Ông Kim Xuân Hiếu (Tổng Giám Đốc)</strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#EEDECF] hover:bg-[#FAF0EC] text-[#733F49] text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Hợp Đồng (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  navigate('/profile/orders');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white text-[13px] font-bold transition-all cursor-pointer border-0 shadow-md"
              >
                Xem Đơn Hàng Của Tôi
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  navigate('/');
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#2C2523] text-[13px] font-semibold transition-all cursor-pointer border-0"
              >
                Về Trang Chủ
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
