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
  Share2,
  RefreshCw,
  Info,
  Plus,
  Minus,
} from 'lucide-react';
import { message } from 'antd';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { MOCK_DRESSES } from '../../services/dressService';
import { getCart } from '../../services/cartService';
import { getDressBookedDates } from '../../services/orderService';

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

  // 1. Đếm ngược tạm giữ váy 5 phút (Hold Timer: 300s) - Tự động ngắt ngay khi thoát khỏi hệ thống
  const [holdSeconds, setHoldSeconds] = useState(5 * 60);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setHoldSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Ngắt ngay lập tức khi người dùng thoát hoặc chuyển trang
    const handleExit = () => {
      clearInterval(timer);
    };

    window.addEventListener('beforeunload', handleExit);
    window.addEventListener('pagehide', handleExit);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', handleExit);
      window.removeEventListener('pagehide', handleExit);
    };
  }, []);

  const formatHoldTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 2. Chế độ cung cấp số đo: 'input' (tự điền) | 'showroom' (chuyên viên đo tại showroom / video call)
  const [measurementMode, setMeasurementMode] = useState('input');



  // 4. Trạng thái kiểm tra thanh toán VietQR giả lập
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

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

  // Helper tính ngày kết thúc thuê dựa vào ngày bắt đầu và số ngày bằng local date
  const computeEndDate = (startDisplayOrIso, days) => {
    const iso = toIsoDateString(startDisplayOrIso);
    if (!iso) return '21/11/2026';
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3) return '21/11/2026';
    const endD = new Date(parts[0], parts[1] - 1, parts[2] + (days - 1));
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(endD.getDate())}/${pad(endD.getMonth() + 1)}/${endD.getFullYear()}`;
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

  // Cập nhật số ngày thuê và tự động dời ngày hoàn trả trên cả bảng lịch và form
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
    if (initialIso) {
      const parts = initialIso.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, 1);
    }
    return new Date(2026, 10, 1);
  });
  const [showFullCalendar, setShowFullCalendar] = useState(true);

  // Danh sách các khoảng ngày đã kín lịch của chiếc váy này
  const [bookedIntervals, setBookedIntervals] = useState([
    { startDate: '2026-11-05', endDate: '2026-11-08', bride: 'Cô dâu Khánh Linh' },
    { startDate: '2026-11-25', endDate: '2026-11-28', bride: 'Cô dâu Mai Anh' },
  ]);

  // Tự động tải lịch đã đặt từ Backend API khi chiếc váy thay đổi
  React.useEffect(() => {
    let isMounted = true;
    const fetchBooked = async () => {
      try {
        const dressId = activeDress?.id || activeDress?._id;
        if (!dressId) return;
        const apiDates = await getDressBookedDates(dressId);
        if (isMounted && Array.isArray(apiDates) && apiDates.length > 0) {
          const formatted = apiDates
            .map((item) => ({
              startDate: toIsoDateString(item.startDate),
              endDate: toIsoDateString(item.endDate),
              orderCode: item.orderCode,
            }))
            .filter((item) => item.startDate && item.endDate);
          if (formatted.length > 0) {
            setBookedIntervals((prev) => {
              const combined = [...formatted];
              prev.forEach((p) => {
                if (!combined.some((c) => c.startDate === p.startDate)) {
                  combined.push(p);
                }
              });
              return combined;
            });
          }
        }
      } catch (err) {
        console.warn('Lấy lịch kín từ API lỗi, dùng lịch mẫu:', err);
      }
    };
    fetchBooked();
    return () => {
      isMounted = false;
    };
  }, [activeDress]);

  // Kiểm tra 1 ngày cụ thể (YYYY-MM-DD) có bị kín lịch hay không
  const getBookedInfoForDate = (dateStr) => {
    if (!dateStr) return null;
    return bookedIntervals.find((interval) => {
      const s = toIsoDateString(interval.startDate);
      const e = toIsoDateString(interval.endDate);
      return dateStr >= s && dateStr <= e;
    });
  };

  // Kiểm tra dải ngày thuê đang chọn [startDate -> endDate] có bị trùng lịch đã đặt không
  const scheduleConflict = useMemo(() => {
    const userStart = toIsoDateString(rentalSchedule.startDate);
    const userEnd = toIsoDateString(rentalSchedule.endDate);
    if (!userStart || !userEnd) return null;

    for (const interval of bookedIntervals) {
      const bStart = toIsoDateString(interval.startDate);
      const bEnd = toIsoDateString(interval.endDate);
      if (!bStart || !bEnd) continue;

      // Hai dải thời gian giao nhau nếu userStart <= bEnd và userEnd >= bStart
      if (userStart <= bEnd && userEnd >= bStart) {
        return {
          conflict: true,
          interval,
          formattedRange: `${toDisplayDateString(bStart)} – ${toDisplayDateString(bEnd)}`,
        };
      }
    }
    return null;
  }, [rentalSchedule.startDate, rentalSchedule.endDate, bookedIntervals]);

  // Helper tính ngày cưới mặc định nằm trong khoảng thuê
  const computeWeddingDate = (startDisplayOrIso, days) => {
    const iso = toIsoDateString(startDisplayOrIso);
    if (!iso) return '20/11/2026';
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3) return '20/11/2026';
    const offset = days <= 3 ? 1 : Math.min(2, Math.floor(days / 2));
    const wedD = new Date(parts[0], parts[1] - 1, parts[2] + offset);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(wedD.getDate())}/${pad(wedD.getMonth() + 1)}/${wedD.getFullYear()}`;
  };

  // Xử lý khi chọn ngày bắt đầu thuê (Ngày nhận váy)
  // Ngày hoàn trả (endDate) TỰ ĐỘNG TÍNH TOÁN theo số ngày thuê (rentalDays), KHÔNG cho chọn ngày trả
  const handleSelectStartDate = (selectedIsoOrDisplay) => {
    const iso = toIsoDateString(selectedIsoOrDisplay);
    if (!iso) return;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3) return;

    const startDisplay = toDisplayDateString(iso);
    const endDisplay = computeEndDate(iso, rentalDays);
    const weddingDisplay = computeWeddingDate(iso, rentalDays);

    setRentalSchedule({
      startDate: startDisplay,
      weddingDate: weddingDisplay,
      endDate: endDisplay,
    });
    setCalendarViewDate(new Date(parts[0], parts[1] - 1, 1));
  };

  // Xử lý khi người dùng click vào ô ngày trên bảng lịch:
  // CHỈ CHO PHÉP CHỌN NGÀY THUÊ (Ngày nhận váy), ngày trả sẽ tự tính theo số ngày thuê
  const handleCalendarCellClick = (dateStr) => {
    const booked = getBookedInfoForDate(dateStr);
    if (booked) {
      message.warning(
        `Váy cưới đã kín lịch từ ${toDisplayDateString(booked.startDate)} đến ${toDisplayDateString(booked.endDate)}. Nàng vui lòng chọn ngày khác trên lịch nhé!`
      );
      return;
    }

    handleSelectStartDate(dateStr);
    const endStr = computeEndDate(dateStr, rentalDays);
    message.success(
      `Đã chọn ngày bắt đầu thuê: ${toDisplayDateString(dateStr)} (Tự động hoàn trả ngày ${endStr} - Gói ${rentalDays} ngày)`
    );
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

  // Gợi ý Size thông minh theo Chiều cao & Cân nặng
  const smartSuggestedSize = useMemo(() => {
    const h = parseFloat(measurements.height);
    const w = parseFloat(measurements.weight);
    if (isNaN(h) || isNaN(w)) return null;
    if (w < 46) return { size: 'XS', note: 'Vóc dáng thanh mảnh, phom chữ A hoặc tùng nhẹ rất tôn eo' };
    if (w <= 53) return { size: 'S', note: 'Khung xương chuẩn, đan dây corsetry Pháp ôm khít vòng eo' };
    if (w <= 61) return { size: 'M', note: 'Phom dáng đầy đặn quyến rũ, cúp ngực nâng đỡ êm ái' };
    return { size: 'L', note: 'Atelier tinh chỉnh nới tùng váy theo phom người' };
  }, [measurements.height, measurements.weight]);

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
    if (scheduleConflict) {
      message.error(
        `Khoảng ngày nàng chọn bị trùng với lịch đã đặt trước (${scheduleConflict.formattedRange}). Vui lòng chọn ngày còn trống trên bảng lịch để tiếp tục!`
      );
      return;
    }
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

  // Hàm xuất và tải file Word (.doc) hợp đồng thuê váy cưới chi tiết
  const handleDownloadWordContract = () => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Hop_Dong_Thue_Le_Phuc_Cuoi_UniBridal</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #111; margin: 40px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 17pt; font-weight: bold; color: #733F49; text-transform: uppercase; margin-top: 15px; margin-bottom: 5px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
          .table td, .table th { border: 1px solid #999; padding: 7px 10px; font-size: 12pt; }
          .table th { background-color: #f7ede8; color: #733F49; }
          .clause-title { font-weight: bold; color: #733F49; margin-top: 14px; margin-bottom: 4px; }
          .seal-box { border: 2px dashed #b80000; padding: 8px 12px; color: #b80000; font-weight: bold; display: inline-block; border-radius: 4px; }
        </style>
      </head>
      <body>
        <p class='center' style='font-size: 11pt; line-height: 1.3;'>
          <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
          <em>Độc lập – Tự do – Hạnh phúc</em><br>
          ---------------------------------------
        </p>

        <h2 class='center title'>HỢP ĐỒNG THUÊ LỄ PHỤC CƯỚI CAO CẤP</h2>
        <p class='center' style='font-style: italic; font-size: 11pt; margin-top: 0;'>
          Số: HĐ-UB-2026/8992 • Xác lập ngày: ${todayStr}
        </p>

        <p>Căn cứ Bộ luật Dân sự số 91/2015/QH13 và Luật Giao dịch điện tử số 20/2023/QH15 của Quốc hội Nước CHXHCN Việt Nam;</p>
        <p>Hôm nay, ngày ${todayStr}, chúng tôi gồm các bên dưới đây thống nhất ký kết Hợp đồng thuê lễ phục:</p>

        <table style='width: 100%; margin-top: 10px; margin-bottom: 15px;'>
          <tr>
            <td style='width: 50%; vertical-align: top; padding-right: 15px;'>
              <strong>BÊN CHO THUÊ (BÊN A):</strong><br>
              <strong>CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE</strong><br>
              Mã số thuế: 0316889988<br>
              Địa chỉ: 88 Nam Kỳ Khởi Nghĩa, Phường Bến Nghé, Quận 1, TP. HCM<br>
              Hotline: 1800 8998 • Email: contact@unibridal.vn<br>
              Đại diện: <strong>Ông Kim Xuân Hiếu</strong><br>
              Chức vụ: <strong>Tổng Giám Đốc</strong>
            </td>
            <td style='width: 50%; vertical-align: top; padding-left: 15px;'>
              <strong>BÊN THUÊ LỄ PHỤC (BÊN B):</strong><br>
              Họ và tên: <strong>${brideName}</strong><br>
              Số CCCD/CMND: <strong>${cccd}</strong><br>
              Số điện thoại: <strong>${phone}</strong><br>
              Email: <strong>${email}</strong><br>
              Địa chỉ: <strong>${address}</strong>
            </td>
          </tr>
        </table>

        <div class='clause-title'>ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & THỜI HẠN THUÊ</div>
        <p>1.1. Bên A đồng ý cho Bên B thuê tác phẩm váy cưới thiết kế độc bản <strong>${activeDress?.name}</strong> (Mã tác phẩm: <strong>${activeDress?.code || 'UB-HC-2026'}</strong>), Kích cỡ: <strong>Size ${selectedSize}</strong>.</p>
        <p>1.2. Thời gian thuê: <strong>${rentalDays} ngày</strong>. Ngày nhận váy: <strong>${rentalSchedule.startDate}</strong>; Ngày cưới chính thức: <strong>${rentalSchedule.weddingDate}</strong>; Ngày hoàn trả: trước 20:00 ngày <strong>${rentalSchedule.endDate}</strong>.</p>
        <p>1.3. Tiêu chuẩn giao nhận: Lễ phục được giặt sấy tiệt trùng sinh học, ủi phẳng phiu và tinh chỉnh theo số đo cô dâu hoàn thiện trước giờ trao nhận 2 giờ trong Vali VIP Courier bảo quản chân không.</p>

        <div class='clause-title'>ĐIỀU 2: GIÁ THUÊ & PHƯƠNG THỨC THANH TOÁN</div>
        <p>2.1. Tổng chi phí thuê váy trọn gói (${rentalDays} ngày): <strong>${totalRentPrice.toLocaleString('vi-VN')} VNĐ</strong>.</p>
        <p>2.2. Số tiền đặt cọc giữ lịch độc quyền: <strong>${amountToPayToday.toLocaleString('vi-VN')} VNĐ</strong> (thanh toán qua cổng chuyển khoản VietQR Techcombank).</p>
        <p>2.3. Số tiền còn lại (nếu chọn cọc 50%) sẽ được thanh toán khi nhận bàn giao váy cưới.</p>

        <div class='clause-title'>ĐIỀU 3: CỌC BẢO LÃNH HOÀN TRẢ & CAM KẾT HOÀN TIỀN 100%</div>
        <p>3.1. Tiền cọc bảo lãnh hoàn trả trang phục: <strong>${depositCollateral.toLocaleString('vi-VN')} VNĐ</strong>.</p>
        <p>3.2. Bên A cam kết hoàn trả 100% khoản cọc bảo lãnh tự động vào tài khoản ngân hàng của Bên B trong vòng 24 giờ sau khi tiếp nhận lại trang phục nguyên vẹn.</p>

        <div class='clause-title'>ĐIỀU 4: BẢO HIỂM VẢI REN & QUY ĐỊNH BẢO QUẢN</div>
        <p>4.1. Bên A tài trợ gói bảo hiểm làm sạch sinh học cao cấp: Miễn trừ trách nhiệm bồi thường đối với các vết bẩn bùn đất thông thường, vết rượu vang hay bụi sân khấu tiệc cưới.</p>
        <p>4.2. Bên B cam kết không tự ý đem lễ phục tới tiệm giặt ủi thông thường hoặc can thiệp cắt xén form dáng nguyên bản.</p>

        <div class='clause-title'>ĐIỀU 5: CHÍNH SÁCH ĐỔI NGÀY CƯỚI & DỜI LỊCH</div>
        <p>5.1. Bên B được quyền thay đổi ngày thuê váy hoàn toàn miễn phí nếu thông báo cho Bên A trước tối thiểu 15 ngày so với ngày nhận dự kiến.</p>

        <div class='clause-title'>ĐIỀU 6: HIỆU LỰC PHÁP LÝ CHỮ KÝ SỐ</div>
        <p>6.1. Hợp đồng này được lập dưới dạng điện tử, có giá trị pháp lý đầy đủ và ràng buộc trách nhiệm song phương theo Luật Giao dịch điện tử số 20/2023/QH15.</p>

        <table style='width: 100%; margin-top: 35px;'>
          <tr>
            <td style='width: 50%; text-align: center; vertical-align: top;'>
              <strong>ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)</strong><br>
              <em>(Đã ký điện tử & đóng dấu mộc số)</em><br><br>
              <div class='seal-box'>
                ★ UNIBRIDAL HAUTE COUTURE ★<br>
                ĐÃ XÁC THỰC KÝ SỐ HỢP LỆ<br>
                Ngày: ${todayStr}
              </div><br><br>
              <strong>Ông Kim Xuân Hiếu</strong><br>
              Tổng Giám Đốc UniBridal
            </td>
            <td style='width: 50%; text-align: center; vertical-align: top;'>
              <strong>ĐẠI DIỆN BÊN THUÊ (BÊN B)</strong><br>
              <em>(Ký tên và ghi rõ họ tên)</em><br><br><br><br>
              <strong>${brideName}</strong>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hop_Dong_Thue_Vay_${activeDress?.name ? activeDress.name.replace(/\s+/g, '_') : 'UniBridal'}_HD-UB-2026.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('Đã tải xuống file Word (.doc) Hợp Đồng Thuê Váy Cưới!');
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
        <nav className="flex items-center gap-2 text-[12.5px] text-[#847374] mb-4 print:hidden">
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

        {/* 1. Thanh Tạm Giữ Độc Quyền Váy 15 Phút (Hold Timer Banner) */}
        <div className="mb-6 bg-gradient-to-r from-[#FAF0EC] via-[#FFF9F6] to-[#FAF0EC] border border-[#F2D8D4] rounded-2xl p-4 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs print:hidden animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#733F49] text-white flex items-center justify-center shrink-0 shadow-xs ring-4 ring-[#FAF0EC]">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-extrabold uppercase tracking-wider text-[#733F49]">
                  LỄ PHỤC ĐANG ĐƯỢC TẠM GIỮ ĐỘC QUYỀN CHO NÀNG
                </span>
                <span className="hidden md:inline-block w-2 h-2 rounded-full bg-[#2E7D32] animate-ping" />
              </div>
              <p className="text-[12px] text-[#6B5C5D] m-0 mt-0.5">
                UniBridal tạm khóa lịch tác phẩm <strong>{activeDress?.name}</strong> để bảo đảm nàng hoàn tất ký hợp đồng và cọc lịch.
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shrink-0 shadow-2xs transition-all ${holdSeconds <= 60 && holdSeconds > 0
            ? 'bg-[#FFF5F5] border-[#FEB2B2] animate-pulse'
            : holdSeconds === 0
              ? 'bg-[#FDF2F0] border-[#E57373]'
              : 'bg-white border-[#F2D8D4]'
            }`}>
            <Clock className={`w-4 h-4 ${holdSeconds <= 60 ? 'text-[#DC2626]' : 'text-[#733F49]'}`} />
            <span className="text-[11px] font-bold text-[#847374] uppercase tracking-wider">Thời gian giữ:</span>
            <span className={`font-jakarta font-extrabold text-[17px] tabular-nums tracking-wide ${holdSeconds <= 60 ? 'text-[#DC2626]' : 'text-[#733F49]'
              }`}>
              {holdSeconds > 0 ? formatHoldTimer(holdSeconds) : '00:00'}
            </span>
            {holdSeconds === 0 && (
              <button
                type="button"
                onClick={() => {
                  setHoldSeconds(5 * 60);
                  message.info('Đã gia hạn thêm 5 phút tạm giữ váy cho nàng!');
                }}
                className="ml-1 px-2 py-0.5 text-[10px] font-bold text-[#733F49] bg-[#FAF0EC] hover:bg-[#F2D8D4] rounded-md border border-[#F2D8D4] cursor-pointer"
              >
                Gia hạn
              </button>
            )}
          </div>
        </div>

        {/* Stepper Bar (3 Clear Steps) */}
        <div className="w-full max-w-[820px] mx-auto mb-6 sm:mb-8 print:hidden">
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
              <span className={currentStep === 1 ? 'font-bold text-[#733F49]' : ''}>1. Thông tin khách hàng</span>
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
                  {/* 3 Thẻ Chọn Ngày Tương Tác Kèm DatePicker */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

                    {/* Thẻ 1: Ngày bắt đầu nhận váy */}
                    <div className="relative bg-[#FCF9F6] p-4 rounded-2xl border-2 border-[#733F49]/40 transition-all shadow-xs focus-within:ring-2 focus-within:ring-[#733F49]/30">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10.5px] font-bold text-[#733F49] uppercase tracking-wider">
                          NGÀY BẮT ĐẦU THUÊ (NHẬN VÁY) *
                        </label>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-[#2E7D32] text-white uppercase tracking-wider">
                          CHỌN NGÀY THUÊ
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          value={toIsoDateString(rentalSchedule.startDate)}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSelectStartDate(e.target.value);
                            }
                          }}
                          className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2 text-[14px] font-bold text-[#2C2523] focus:outline-none focus:border-[#733F49] cursor-pointer"
                        />
                      </div>
                      <span className="text-[10.5px] font-medium text-[#2E7D32] mt-1.5 flex items-center gap-1">
                        <span>✦</span> Ngày nhận váy
                      </span>
                    </div>

                    {/* Thẻ 2: Ngày cưới chính thức */}
                    <div className="relative bg-[#FAF0EC] p-4 rounded-2xl border border-[#F2D8D4] transition-all hover:shadow-xs focus-within:ring-2 focus-within:ring-[#733F49]/30">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10.5px] font-bold text-[#733F49] uppercase tracking-wider">
                          NGÀY CƯỚI CHÍNH THỨC
                        </label>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-[#FAF0EC] text-[#733F49] border border-[#F2D8D4] uppercase tracking-wider">
                          TRONG GÓI THUÊ
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          value={toIsoDateString(rentalSchedule.weddingDate)}
                          onChange={(e) => {
                            if (e.target.value) {
                              setRentalSchedule((prev) => ({
                                ...prev,
                                weddingDate: toDisplayDateString(e.target.value),
                              }));
                            }
                          }}
                          className="w-full bg-white border border-[#F2D8D4] rounded-xl px-3 py-2 text-[14.5px] font-bold text-[#733F49] focus:outline-none focus:border-[#733F49] cursor-pointer shadow-2xs"
                        />
                      </div>
                      <span className="text-[10.5px] font-bold text-[#733F49] mt-1.5 flex items-center gap-1">
                        <span>★</span> Ngày hôn lễ chính thức
                      </span>
                    </div>

                    {/* Thẻ 3: Ngày hoàn trả váy (TỰ ĐỘNG TÍNH TOÁN, KHÔNG CHO PHÉP CHỌN) */}
                    <div className="relative bg-[#F9F7F5] p-4 rounded-2xl border border-[#E8DFD8] transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10.5px] font-bold text-[#847374] uppercase tracking-wider">
                          NGÀY HOÀN TRẢ VÁY
                        </label>

                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          readOnly
                          disabled
                          value={toIsoDateString(rentalSchedule.endDate)}
                          className="w-full bg-[#EFECE8] border border-[#DDD4CC] rounded-xl px-3 py-2 text-[14px] font-bold text-[#6B5C5D] cursor-not-allowed select-none"
                        />
                      </div>

                    </div>

                  </div>

                  {/* Bảng Lịch Trực Quan Tháng Tự Động Co Giãn Theo Số Ngày Thuê */}
                  <div className="bg-[#FCF9F6] rounded-2xl border border-[#EEDECF] p-4 sm:p-5 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3.5 border-b border-[#EEDECF] mb-3.5 gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF0EC] text-[#733F49] flex items-center justify-center font-bold">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-playfair text-[15.5px] font-bold text-[#2C2523] m-0">
                            Bảng Lịch Thuê Váy:    Tháng {calendarViewDate.getMonth() + 1}/{calendarViewDate.getFullYear()}
                          </h4>

                        </div>
                      </div>

                      {/* Bộ điều khiển số ngày thuê gắn liền trên thanh Bảng Lịch */}
                      <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                        {/* 4 Nút chọn nhanh số ngày */}
                        <div className="flex items-center bg-white p-1 rounded-xl border border-[#EEDECF] text-[11px] font-bold shadow-2xs">
                          {[3, 4, 5, 7].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => handleRentalDaysChange(d)}
                              className={`px-2.5 py-1 rounded-lg border-0 cursor-pointer transition-all ${rentalDays === d
                                ? 'bg-[#733F49] text-white shadow-xs'
                                : 'bg-transparent text-[#6B5C5D] hover:text-[#733F49] hover:bg-[#FAF0EC]'
                                }`}
                            >
                              {d} Ngày
                            </button>
                          ))}
                        </div>

                        {/* Bộ tăng giảm nhanh Stepper */}
                        <div className="flex items-center gap-1 bg-white border border-[#EEDECF] px-2 py-1 rounded-xl shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleRentalDaysChange(rentalDays - 1)}
                            disabled={rentalDays <= 2}
                            aria-label="Giảm ngày thuê"
                            className="w-6 h-6 rounded-md border border-[#EEDECF] bg-white text-[#733F49] flex items-center justify-center hover:bg-[#FAF0EC] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-jakarta font-extrabold text-[13px] text-[#733F49] px-1 tabular-nums min-w-[48px] text-center">
                            {rentalDays} Ngày
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRentalDaysChange(rentalDays + 1)}
                            disabled={rentalDays >= 14}
                            aria-label="Tăng ngày thuê"
                            className="w-6 h-6 rounded-md border border-[#EEDECF] bg-white text-[#733F49] flex items-center justify-center hover:bg-[#FAF0EC] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Chuyển tháng */}
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
                              const weddingIso = toIsoDateString(rentalSchedule.weddingDate);
                              if (weddingIso) {
                                const parts = weddingIso.split('-').map(Number);
                                setCalendarViewDate(new Date(parts[0], parts[1] - 1, 1));
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
                        const bookedInfo = getBookedInfoForDate(dateStr);
                        const isBooked = Boolean(bookedInfo);
                        const isStart = dateStr === startIso;
                        const isWedding = dateStr === weddingIso;
                        const isEnd = dateStr === endIso;
                        const isInRange = startIso && endIso && dateStr >= startIso && dateStr <= endIso;

                        if (isBooked) {
                          cells.push(
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => handleCalendarCellClick(dateStr)}
                              title={`Ngày đã có cô dâu đặt thuê: ${bookedInfo.bride || 'Kín lịch'}`}
                              className="relative h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-[12px] sm:text-[13px] font-bold transition-all border border-[#F8D7DA] bg-[#FDF2F0] text-[#B91C1C] cursor-not-allowed opacity-85 hover:opacity-100"
                            >
                              <span className="line-through decoration-[#B91C1C]/60">{d}</span>
                              <span className="text-[7.5px] font-extrabold leading-none text-[#B91C1C] tracking-tight uppercase">
                                KÍN LỊCH
                              </span>
                            </button>
                          );
                          continue;
                        }

                        cells.push(
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => handleCalendarCellClick(dateStr)}
                            className={`relative h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-[12px] sm:text-[13px] font-semibold transition-all border-0 cursor-pointer ${isWedding
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
                          Ngày hoàn trả ({rentalSchedule.endDate})
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#B91C1C] font-semibold">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]" />
                          Đã có người đặt (Kín lịch)
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

                {/* 3. SỐ ĐO CƠ THỂ MAY ĐO & TÙY CHỌN CONCIERGE */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#F5EDE8] mb-6 gap-3">
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

                    {/* Chuyển đổi chế độ điền số đo */}
                    <div className="flex items-center bg-[#FAF0EC] p-1 rounded-xl border border-[#F2D8D4] self-start sm:self-auto text-[11.5px] font-bold">
                      <button
                        type="button"
                        onClick={() => setMeasurementMode('input')}
                        className={`px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-all ${measurementMode === 'input'
                          ? 'bg-white text-[#733F49] shadow-xs'
                          : 'bg-transparent text-[#847374] hover:text-[#733F49]'
                          }`}
                      >
                        Tự điền số đo
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeasurementMode('showroom')}
                        className={`px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-all flex items-center gap-1 ${measurementMode === 'showroom'
                          ? 'bg-[#733F49] text-white shadow-xs'
                          : 'bg-transparent text-[#847374] hover:text-[#733F49]'
                          }`}
                      >
                        <span>✦ Hẹn đo tại Showroom</span>
                      </button>
                    </div>
                  </div>

                  {measurementMode === 'showroom' ? (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FAF3F0] to-[#FAF8F5] border border-[#F2D8D4] text-[13px] text-[#6B5C5D] space-y-2 mb-4 animate-fade-in">
                      <div className="flex items-center gap-2 font-bold text-[#733F49]">
                        <Sparkles className="w-4 h-4" />
                        <span>Dịch vụ May Đo VIP Concierge Miễn Phí Tại Showroom</span>
                      </div>
                      <p className="m-0 leading-relaxed">
                        Nàng không cần tự đo tại nhà! Chuyên viên may đo cao cấp của UniBridal sẽ liên hệ đặt lịch đón tiếp nàng tại phòng thử VIP của Showroom (hoặc qua Video Call riêng tư) để lấy số đo chuẩn xác từng milimet và căn chỉnh phom váy trước ngày cưới.
                      </p>
                      <div className="pt-1 flex items-center gap-2 text-[11.5px] font-semibold text-[#2E7D32]">
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã lưu yêu cầu đo trực tiếp vào hồ sơ đặt thuê của nàng.</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-3">
                        <div className="bg-[#FCF9F6] p-3 rounded-xl border border-[#EEDECF]">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B464E] block mb-1.5">CHIỀU CAO (CM)</label>
                          <input
                            type="text"
                            value={measurements.height}
                            onChange={(e) => setMeasurements({ ...measurements, height: e.target.value })}
                            className="w-full bg-white border border-[#E2D2C2] rounded-xl px-2 py-2 font-jakarta font-extrabold text-[16px] text-[#2C2523] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                          />
                        </div>
                        <div className="bg-[#FCF9F6] p-3 rounded-xl border border-[#EEDECF]">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B464E] block mb-1.5">CÂN NẶNG (KG)</label>
                          <input
                            type="text"
                            value={measurements.weight}
                            onChange={(e) => setMeasurements({ ...measurements, weight: e.target.value })}
                            className="w-full bg-white border border-[#E2D2C2] rounded-xl px-2 py-2 font-jakarta font-extrabold text-[16px] text-[#2C2523] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                          />
                        </div>
                        <div className="bg-[#FCF9F6] p-3 rounded-xl border border-[#EEDECF]">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B464E] block mb-1.5">VÒNG 1 (NGỰC)</label>
                          <input
                            type="text"
                            value={measurements.bust}
                            onChange={(e) => setMeasurements({ ...measurements, bust: e.target.value })}
                            className="w-full bg-white border border-[#E2D2C2] rounded-xl px-2 py-2 font-jakarta font-extrabold text-[16px] text-[#2C2523] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                          />
                        </div>
                        <div className="bg-[#FAF0EC] p-3 rounded-xl border border-[#F2D8D4]">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#733F49] block mb-1.5">VÒNG 2 (EO * CHÍNH)</label>
                          <input
                            type="text"
                            value={measurements.waist}
                            onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })}
                            className="w-full bg-white border-2 border-[#EAB8B8] rounded-xl px-2 py-2 font-jakarta font-extrabold text-[16px] text-[#733F49] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                          />
                        </div>
                        <div className="bg-[#FCF9F6] p-3 rounded-xl border border-[#EEDECF]">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B464E] block mb-1.5">VÒNG 3 (MÔNG)</label>
                          <input
                            type="text"
                            value={measurements.hips}
                            onChange={(e) => setMeasurements({ ...measurements, hips: e.target.value })}
                            className="w-full bg-white border border-[#E2D2C2] rounded-xl px-2 py-2 font-jakarta font-extrabold text-[16px] text-[#2C2523] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                          />
                        </div>
                        <div className="bg-[#FCF9F6] p-3 rounded-xl border border-[#EEDECF]">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B464E] block mb-1.5">CAO GIÀY CƯỚI</label>
                          <input
                            type="text"
                            value={measurements.heel}
                            onChange={(e) => setMeasurements({ ...measurements, heel: e.target.value })}
                            className="w-full bg-white border border-[#E2D2C2] rounded-xl px-2 py-2 font-jakarta font-extrabold text-[16px] text-[#2C2523] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Gợi ý Size thông minh theo Chiều cao & Cân nặng */}
                      {smartSuggestedSize && (
                        <div className="mb-4 p-3 rounded-xl bg-[#FAF0EC] border border-[#F2D8D4] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] animate-fade-in">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#733F49] shrink-0" />
                            <span className="text-[#6B5C5D]">
                              Gợi ý theo vóc dáng ({measurements.height}cm, {measurements.weight}kg):
                            </span>
                            <strong className="text-[#733F49] font-jakarta font-bold text-[13.5px]">
                              Size {smartSuggestedSize.size}
                            </strong>
                            <span className="text-[#847374] hidden md:inline">• {smartSuggestedSize.note}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSize(smartSuggestedSize.size);
                              message.success(`Đã chọn Size ${smartSuggestedSize.size} theo gợi ý vóc dáng!`);
                            }}
                            className="px-3 py-1 text-[11px] font-bold text-[#733F49] bg-white rounded-lg border border-[#F2D8D4] hover:bg-[#733F49] hover:text-white transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                          >
                            Áp dụng Size {smartSuggestedSize.size}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  <div className="text-[11.5px] text-[#6B5C5D] italic">
                    ✦ Nếu nàng chưa đo chính xác, chuyên viên Atelier sẽ gọi video hướng dẫn hoặc đo trực tiếp tại buổi thử váy.
                  </div>
                </section>

                {/* Continue Button to Step 2 */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProceedToContract}
                    disabled={Boolean(scheduleConflict)}
                    className={`w-full py-4 rounded-xl font-jakarta text-[14px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 border-0 ${scheduleConflict
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                      : 'bg-[#733F49] hover:bg-[#5F323B] text-white shadow-[0_4px_16px_rgba(115,63,73,0.3)] hover:shadow-[0_6px_22px_rgba(115,63,73,0.4)] cursor-pointer active:scale-[0.99]'
                      }`}
                  >
                    {scheduleConflict ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-stone-500" />
                        <span>LỊCH BỊ TRÙNG — VUI LÒNG ĐỔI NGÀY TRÊN BẢNG LỊCH</span>
                      </>
                    ) : (
                      <>
                        <span>TIẾP TỤC: XEM & KÝ HỢP ĐỒNG ĐIỆN TỬ (BƯỚC 2)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
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

                  {/* TÓM TẮT CÁC ĐIỀU KHOẢN CỐT LÕI (SÚC TÍCH) */}
                  <div className="space-y-3 text-[12.5px] leading-relaxed text-[#4A3B3D]">

                    {/* Điều 1 tóm tắt */}
                    <div className="p-3.5 rounded-xl bg-[#FAF4EE] border border-[#EEDECF] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <strong className="text-[#733F49] block text-[13px] mb-0.5">
                          1. THỜI GIAN NHẬN TRẢ & TÁC PHẨM VÁY CƯỚI
                        </strong>
                        <span className="text-[#6B5C5D] block">
                          Thuê váy <strong>{activeDress?.name}</strong> (Size <strong>{selectedSize}</strong>) trọn gói <strong>{rentalDays} ngày</strong>. Nhận từ <strong>{rentalSchedule.startDate}</strong> ➔ Trả trước 20:00 ngày <strong>{rentalSchedule.endDate}</strong>.
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#EEDECF] text-[#733F49] uppercase tracking-wider shrink-0 self-start sm:self-auto">
                        GÓI {rentalDays} NGÀY
                      </span>
                    </div>

                    {/* Điều 2 tóm tắt */}
                    <div className="p-3.5 rounded-xl bg-[#FAF4EE] border border-[#EEDECF] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <strong className="text-[#733F49] block text-[13px] mb-0.5">
                          2. GIÁ THUÊ & CAM KẾT HOÀN TRẢ CỌC 100%
                        </strong>
                        <span className="text-[#6B5C5D] block">
                          Giá thuê: <strong>{totalRentPrice.toLocaleString('vi-VN')}₫</strong> • Cọc giữ lịch hôm nay: <strong className="text-[#2E7D32]">{amountToPayToday.toLocaleString('vi-VN')}₫</strong>. Cọc bảo lãnh {depositCollateral.toLocaleString('vi-VN')}₫ cam kết <strong>hoàn tiền 100%</strong> trong vòng 24h sau khi nhận lại lễ phục.
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] uppercase tracking-wider shrink-0 self-start sm:self-auto">
                        HOÀN CỌC 100%
                      </span>
                    </div>

                    {/* Điều 3 tóm tắt */}
                    <div className="p-3.5 rounded-xl bg-[#FAF4EE] border border-[#EEDECF] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <strong className="text-[#733F49] block text-[13px] mb-0.5">
                          3. BẢO HIỂM VẢI REN & QUYỀN ĐỔI NGÀY CƯỚI MIỄN PHÍ
                        </strong>
                        <span className="text-[#6B5C5D] block">
                          Miễn phí xử lý các vết bẩn bùn đất/rượu vang thông thường. Cô dâu được <strong>đổi ngày thuê váy miễn phí</strong> khi thông báo trước 15 ngày.
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#EEDECF] text-[#733F49] uppercase tracking-wider shrink-0 self-start sm:self-auto">
                        ĐỔI LỊCH FREE
                      </span>
                    </div>

                    {/* THẺ ĐÍNH KÈM VĂN BẢN WORD (.DOC) & NÚT XEM CHI TIẾT */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF3F0] via-[#FCF9F6] to-[#FAF8F5] border border-[#F2D8D4] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12.5px] shadow-2xs">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0 shadow-2xs font-bold text-[14px]">
                          W
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-[#2C2523] text-[13.5px]">Toàn văn Điều lệ Hợp đồng thuê đầy đủ (8 Điều)</strong>
                            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-[#E8F0FE] text-[#1A73E8] uppercase tracking-wider">
                              FILE WORD .DOC
                            </span>
                          </div>
                          <p className="text-[#6B5C5D] text-[11.5px] m-0 mt-0.5">
                            Bao gồm phụ lục bồi hoàn chi tiết, quy chuẩn bảo quản vali và chứng thư bảo lãnh.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsContractModalOpen(true)}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white border border-[#EEDECF] hover:bg-[#FAF0EC] text-[#733F49] text-[12px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-4 h-4 text-[#733F49]" />
                          <span>Xem Chi Tiết</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadWordContract}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[12px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Download className="w-4 h-4 text-white" />
                          <span>Tải File Word (.doc)</span>
                        </button>
                      </div>
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
                            className={`px-2 py-0.5 rounded-md transition-colors border-0 cursor-pointer ${signatureMode === 'draw'
                              ? 'bg-[#733F49] text-white'
                              : 'bg-transparent text-[#733F49] hover:bg-[#FAF0EC]'
                              }`}
                          >
                            ✍️ Ký tay
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignatureMode('type')}
                            className={`px-2 py-0.5 rounded-md transition-colors border-0 cursor-pointer ${signatureMode === 'type'
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
                      <div className="font-jakarta font-extrabold text-[22px] text-[#733F49] mb-1 tabular-nums tracking-tight">
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
                      <div className="font-jakarta font-extrabold text-[22px] text-[#733F49] mb-1 tabular-nums tracking-tight">
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
                    <div className="font-jakarta font-extrabold text-[19px] text-[#733F49] mt-1.5 tabular-nums tracking-tight">
                      {totalRentPrice.toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                </div>

                {/* Live Availability Status in Summary Card */}
                {scheduleConflict ? (
                  <div className="bg-[#FFF5F5] border border-[#FEB2B2] p-2.5 rounded-xl text-[#B91C1C] text-[11.5px] flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                    <span>Trùng lịch đã đặt ({scheduleConflict.formattedRange})</span>
                  </div>
                ) : (
                  <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-2.5 rounded-xl text-[#15803D] text-[11.5px] flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
                    <span>Lịch còn trống: {rentalSchedule.startDate} – {rentalSchedule.endDate}</span>
                  </div>
                )}

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
                    <span className="font-jakarta font-extrabold text-[24px] sm:text-[26px] text-[#733F49] tabular-nums tracking-tight">
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

      {/* ================= CONTRACT FULL DETAILS MODAL (POPUP TOÀN VĂN HỢP ĐỒNG CHI TIẾT) ================= */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="relative w-full max-w-[760px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-[#EEDECF] overflow-hidden flex flex-col">

            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#FAF4EE] border-b border-[#EEDECF] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold text-[13px]">
                  W
                </div>
                <div>
                  <h3 className="font-playfair text-[17px] font-bold text-[#733F49] m-0">
                    Toàn Văn Quy Chế & Điều Lệ Hợp Đồng Thuê
                  </h3>
                  <span className="text-[11px] text-[#847374] block">
                    Văn bản pháp lý số #HĐ-UB-2026/8992 • Cấp ngày: {new Date().toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadWordContract}
                  className="px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[11.5px] font-bold border-0 cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Tải file Word (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white border border-[#EEDECF] text-[#847374] hover:text-[#2C2523] flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Contract Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-[12.5px] leading-relaxed text-[#4A3B3D] flex-1">
              <div className="text-center pb-3 border-b border-[#F0E5DC]">
                <div className="font-bold uppercase tracking-wider text-[#2C2523] text-[11.5px]">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[11px] italic text-[#6B5C5D]">Độc lập — Tự do — Hạnh phúc</div>
                <h4 className="font-playfair text-[18px] font-bold text-[#733F49] mt-2 mb-0.5 uppercase">
                  HỢP ĐỒNG THUÊ LỄ PHỤC CƯỚI CAO CẤP
                </h4>
                <span className="text-[11px] text-[#847374]">Mã số: HĐ-UB-2026/8992</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FCF9F6] border border-[#EEDECF] space-y-1 text-[12px]">
                <div><strong>BÊN A (CHO THUÊ):</strong> CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE • Đại diện: <strong>Ông Kim Xuân Hiếu (Tổng Giám Đốc)</strong></div>
                <div><strong>BÊN B (THUÊ VÁY):</strong> {brideName} • Số CCCD: {cccd} • SĐT: {phone} • Địa chỉ: {address}</div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EEDECF]">
                  <strong className="text-[#733F49] block mb-1">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & BÀN GIAO LỄ PHỤC</strong>
                  <p className="m-0 text-[#6B5C5D]">
                    1.1. Bên A bàn giao tác phẩm váy cưới thiết kế <strong>{activeDress?.name}</strong> (Mã: <strong>{activeDress?.code || 'UB-HC-2026'}</strong>), Size: <strong>{selectedSize}</strong> cho Bên B.<br />
                    1.2. Thời gian thuê: <strong>{rentalDays} ngày</strong>. Nhận từ ngày <strong>{rentalSchedule.startDate}</strong> đến 20:00 ngày <strong>{rentalSchedule.endDate}</strong>.<br />
                    1.3. Váy được tiệt trùng sinh học, ủi phẳng phiu và đặt trong Vali giữ nhiệt chuyên dụng.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EEDECF]">
                  <strong className="text-[#733F49] block mb-1">ĐIỀU 2: GIÁ THUÊ & PHƯƠNG THỨC THANH TOÁN</strong>
                  <p className="m-0 text-[#6B5C5D]">
                    2.1. Tổng giá trị gói thuê: <strong>{totalRentPrice.toLocaleString('vi-VN')}₫</strong>.<br />
                    2.2. Khoản cọc đặt giữ lịch: <strong>{amountToPayToday.toLocaleString('vi-VN')}₫</strong> (thanh toán qua VietQR Techcombank).<br />
                    2.3. Khoản còn lại thanh toán đủ khi nhận bàn giao lễ phục.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EEDECF]">
                  <strong className="text-[#733F49] block mb-1">ĐIỀU 3: TIỀN CỌC BẢO LÃNH & CAM KẾT HOÀN CỌC 100%</strong>
                  <p className="m-0 text-[#6B5C5D]">
                    3.1. Tiền cọc bảo lãnh: <strong>{depositCollateral.toLocaleString('vi-VN')}₫</strong>.<br />
                    3.2. UniBridal cam kết hoàn trả 100% số tiền cọc bảo lãnh vào tài khoản ngân hàng của cô dâu trong vòng 24 giờ sau khi kiểm tra váy hoàn trả nguyên vẹn.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EEDECF]">
                  <strong className="text-[#733F49] block mb-1">ĐIỀU 4: BẢO HIỂM LÀM SẠCH & QUY ĐỊNH BẢO QUẢN</strong>
                  <p className="m-0 text-[#6B5C5D]">
                    4.1. Miễn phí xử lý vết bẩn sinh học: Bụi sân khấu, vết bùn đất, vết rượu vang thông thường đều được UniBridal hỗ trợ làm sạch công nghệ cao miễn phí.<br />
                    4.2. Khách hàng không tự ý tẩy nhuộm hay mang váy tới tiệm giặt sấy bên ngoài.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EEDECF]">
                  <strong className="text-[#733F49] block mb-1">ĐIỀU 5: QUYỀN ĐỔI NGÀY CƯỚI & DỜI LỊCH THUÊ</strong>
                  <p className="m-0 text-[#6B5C5D]">
                    5.1. Cô dâu được chuyển đổi ngày thuê váy hoàn toàn miễn phí khi thông báo trước tối thiểu 15 ngày.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EEDECF]">
                  <strong className="text-[#733F49] block mb-1">ĐIỀU 6: HIỆU LỰC CHỮ KÝ ĐIỆN TỬ</strong>
                  <p className="m-0 text-[#6B5C5D]">
                    6.1. Hợp đồng điện tử này có giá trị pháp lý đầy đủ theo Luật Giao dịch điện tử số 20/2023/QH15.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#FAF4EE] border-t border-[#EEDECF] flex items-center justify-between">
              <span className="text-[11.5px] text-[#6B5C5D]">
                ✦ Nàng có thể tải bản Word (.doc) về máy để chỉnh sửa hoặc in ấn lưu trữ.
              </span>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white text-[12.5px] font-bold border-0 cursor-pointer transition-colors shadow-xs"
              >
                Tôi Đã Hiểu & Đóng
              </button>
            </div>

          </div>
        </div>
      )}

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

            {/* LỘ TRÌNH CHĂM SÓC LỄ PHỤC (POST-BOOKING JOURNEY TIMELINE) */}
            <div className="bg-[#FCF9F6] p-4.5 rounded-2xl border border-[#EEDECF] text-left">
              <span className="text-[11px] font-bold text-[#733F49] uppercase tracking-wider block mb-3">
                ✦ LỘ TRÌNH CHĂM SÓC LỄ PHỤC CỦA NÀNG (4 GIAI ĐOẠN)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-[11.5px]">
                <div className="bg-white p-2.5 rounded-xl border border-[#E8F5E9] shadow-2xs">
                  <span className="text-[10px] font-bold text-[#2E7D32] block mb-1">GIAI ĐOẠN 1: HÔM NAY</span>
                  <strong className="text-[#2C2523] block mb-0.5">Khóa Lịch Độc Quyền</strong>
                  <span className="text-[#847374] block leading-tight">Hợp đồng điện tử đã ký có hiệu lực pháp lý</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#F2D8D4] shadow-2xs">
                  <span className="text-[10px] font-bold text-[#733F49] block mb-1">TRƯỚC CƯỚI 7 NGÀY</span>
                  <strong className="text-[#2C2523] block mb-0.5">Thử Vừa Lần Cuối</strong>
                  <span className="text-[#847374] block leading-tight">Chuyên viên ủi sấy sinh học & chỉnh eo</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#EEDECF] shadow-2xs">
                  <span className="text-[10px] font-bold text-[#847374] block mb-1">{rentalSchedule.startDate}</span>
                  <strong className="text-[#2C2523] block mb-0.5">Bàn Giao Vali VIP</strong>
                  <span className="text-[#847374] block leading-tight">Nguyên seal chống ẩm & quà tặng găng tay</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#EEDECF] shadow-2xs">
                  <span className="text-[10px] font-bold text-[#847374] block mb-1">{rentalSchedule.endDate}</span>
                  <strong className="text-[#2C2523] block mb-0.5">Hoàn Trả & Giải Ngân</strong>
                  <span className="text-[#847374] block leading-tight">Hoàn cọc 100% qua tài khoản trong 2h</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const shareText = `Anh yêu ơi, em đã đặt thuê thành công tác phẩm váy cưới ${activeDress?.name} tại UniBridal cho ngày cưới ${rentalSchedule.weddingDate}! Mã hợp đồng: ${createdOrder?.contractCode || 'HĐ-UB-2026/8992'}. Cùng xem với em nhé: ${window.location.href}`;
                  if (navigator.share) {
                    navigator.share({
                      title: 'Hợp Đồng Thuê Váy Cưới UniBridal',
                      text: shareText,
                      url: window.location.href,
                    }).catch(() => { });
                  } else {
                    navigator.clipboard.writeText(shareText);
                    message.success('Đã sao chép tin nhắn gửi Chú Rể vào bộ nhớ tạm!');
                  }
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#FAF0EC] border border-[#F2D8D4] hover:bg-[#F2DDD9] text-[#733F49] text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Gửi Chú Rể (Zalo/SMS)</span>
              </button>
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
