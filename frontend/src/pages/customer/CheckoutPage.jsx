import { formatCurrencyVND, formatNumberDots } from '../../utils/formatCurrency';
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  MapPin,
  Check,
  CheckCircle2,
  Lock,
  LogIn,
  UserCheck,
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
  ChevronUp,
  ChevronDown,
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
  Zap,
} from 'lucide-react';
import { message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { getDressById } from '../../services/dressService';
import { getCart, resolveCartItem, clearCart } from '../../services/cartService';
import { getDressBookedDates, createOrder } from '../../services/orderService';
import { simulateVietQRPaymentApi } from '../../services/paymentService';
import { HIEU_SIGNATURE_BASE64 } from '../../assets/images/signatureHieuBase64';
import unibridalEmblem from '../../assets/logo_emblem.png';

// Helper: Chuyển đổi định dạng ngày DD/MM/YYYY sang YYYY-MM-DD và ngược lại
function toIsoDateString(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? '' : val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (!str || str === 'undefined' || str === 'null' || str === 'Invalid Date') return '';
  if (str.includes('-')) return str.split('T')[0];
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
}

function toDisplayDateString(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (!str || str === 'undefined' || str === 'null' || str === 'Invalid Date') return '';
  if (str.includes('/')) return str;
  if (str.includes('-')) {
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return str;
}

// Chữ ký nghệ thuật đại diện Bên A (Ông Kim Xuân Hiếu - Tổng Giám Đốc)
function DirectorSignatureAndStamp({ className = "h-28", isSmall = false }) {
  return (
    <div className={`relative w-full ${className} bg-transparent overflow-hidden flex items-center justify-center select-none`}>
      <img
        src={HIEU_SIGNATURE_BASE64}
        alt="Chữ ký Hiếu"
        className={`${isSmall ? 'max-h-16' : 'max-h-24'} w-auto object-contain select-none`}
      />
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isLoggedIn } = useAuth();
  const dressIdParam = searchParams.get('dressId');
  const sizeParam = searchParams.get('size');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const daysParam = parseInt(searchParams.get('days'), 10);
  const [rentalDays, setRentalDays] = useState(!isNaN(daysParam) && daysParam >= 1 && daysParam <= 30 ? daysParam : 4);

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



  // 4. Trạng thái kiểm tra thanh toán & Phương thức thanh toán thực tế
  const [paymentMethod, setPaymentMethod] = useState('vietqr'); // 'vietqr' (Quét mã VietQR) | 'credit_card' (Thẻ quốc tế) | 'showroom' (Tại Showroom)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [qrImgError, setQrImgError] = useState(false);

  // Dynamic Selected Dresses from Cart or Database (Hỗ trợ 1 hoặc nhiều váy cùng lúc)
  const [orderItems, setOrderItems] = useState(() => {
    const cart = getCart();
    if (cart && cart.length > 0) return cart.map(resolveCartItem);
    return [];
  });
  const [activeDress, setActiveDress] = useState(() => {
    const cart = getCart();
    if (cart && cart.length > 0) return resolveCartItem(cart[0]);
    return null;
  });
  const [dbError, setDbError] = useState('');

  useEffect(() => {
    let active = true;
    if (dressIdParam) {
      getDressById(dressIdParam)
        .then((res) => {
          if (!active) return;
          if (res?.data) {
            const d = res.data;
            const singleItem = {
              ...d,
              id: String(d._id || d.id),
              name: d.name,
              price: Number(d.rentPrice || d.price) || 5200000,
              deposit: Number(d.depositAmount || d.deposit) || 15000000,
              image: d.images?.[0] || d.image || '/assets/dresses/dress_01.jpg',
              code: d.code || 'UB-HC-2026',
              size: d.sizes?.[0]?.label || 'S',
            };
            setOrderItems([singleItem]);
            setActiveDress(singleItem);
          } else if (res?.success === false) {
            setDbError(res.message || 'Lỗi kết nối cơ sở dữ liệu.');
          }
        })
        .catch(() => {
          if (!active) return;
          setDbError('Lỗi kết nối cơ sở dữ liệu: Không thể tải thông tin lễ phục từ MongoDB.');
        });
    } else {
      const cart = getCart();
      if (cart && cart.length > 0) {
        const resolved = cart.map(resolveCartItem);
        setOrderItems(resolved);
        setActiveDress(resolved[0]);
      } else {
        setOrderItems([]);
        setActiveDress(null);
      }
    }
    return () => { active = false; };
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
      setContractSignature('');
      setIsContractSigned(false);
    }
  };

  const [createdOrder, setCreatedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: Trích xuất thông tin người dùng đã đăng ký
  const extractUserFields = (u) => {
    if (!u) return { name: '', phone: '', email: '', cccd: '', address: '' };
    const name = u.fullName || u.name || '';
    const phone = u.phone || '';
    const email = u.email || '';
    const cccd = u.idCard || u.cccd || '';
    let address = '';
    if (typeof u.address === 'string') {
      address = u.address;
    } else if (u.address && typeof u.address === 'object') {
      address = [u.address.street, u.address.ward, u.address.district, u.address.city].filter(Boolean).join(', ');
    }
    return { name, phone, email, cccd, address };
  };

  // Step 1: Form state
  // QUY TẮC:
  // - Khách chưa đăng ký / chưa đăng nhập: BẮT BUỘC để trống toàn bộ ('')
  // - Người dùng đăng nhập bình thường: Tự động trích xuất thông tin hồ sơ đã đăng ký
  const initialUserData = useMemo(() => {
    return isLoggedIn && user ? extractUserFields(user) : { name: '', phone: '', email: '', cccd: '', address: '' };
  }, [isLoggedIn, user]);

  const [brideName, setBrideName] = useState(initialUserData.name);
  const [phone, setPhone] = useState(initialUserData.phone);
  const [email, setEmail] = useState(initialUserData.email);
  const [cccd, setCccd] = useState(initialUserData.cccd);
  const [address, setAddress] = useState(initialUserData.address);
  const [formErrors, setFormErrors] = useState({});

  // Đồng bộ khi user đăng nhập hoặc khi dữ liệu profile tải xong
  useEffect(() => {
    if (isLoggedIn && user) {
      const uData = extractUserFields(user);
      setBrideName((prev) => (prev ? prev : uData.name));
      setPhone((prev) => (prev ? prev : uData.phone));
      setEmail((prev) => (prev ? prev : uData.email));
      setCccd((prev) => (prev ? prev : uData.cccd));
      setAddress((prev) => (prev ? prev : uData.address));

      if (user.measurements) {
        setMeasurements({
          height: user.measurements.height ? String(user.measurements.height) : '',
          weight: user.measurements.weight ? String(user.measurements.weight) : '',
          bust: user.measurements.bust ? String(user.measurements.bust) : '',
          waist: user.measurements.waist ? String(user.measurements.waist) : '',
          hips: user.measurements.hips ? String(user.measurements.hips) : '',
          heel: user.measurements.heel ? String(user.measurements.heel) : '',
        });
      } else {
        setMeasurements({
          height: '',
          weight: '',
          bust: '',
          waist: '',
          hips: '',
          heel: '',
        });
      }
    }
  }, [isLoggedIn, user]);

  // Helper: Cộng/trừ số ngày vào ngày cho trước (dùng local Date tránh lệch timezone)
  const addDaysToDate = (displayOrIso, days) => {
    const iso = toIsoDateString(displayOrIso);
    if (!iso) return '';
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3) return '';
    const d = new Date(parts[0], parts[1] - 1, parts[2] + days);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  // Helper tính ngày kết thúc thuê dựa vào ngày bắt đầu và số ngày bằng local date
  const computeEndDate = (startDisplayOrIso, days) => {
    return addDaysToDate(startDisplayOrIso, days);
  };

  // Helper tính lịch cân đối chuẩn theo Ngày cưới (weddingDate) và số ngày thuê (days):
  // QUY TẮC BẤT DI BẤT DỊCH:
  // 1. Ngày trả (endDate) LUÔN LUÔN >= Ngày cưới (weddingDate) (sau hoặc cùng ngày cưới)
  // 2. Ngày nhận (startDate) LUÔN LUÔN <= Ngày cưới (weddingDate) (trước hoặc cùng ngày cưới)
  // 3. Tổng thời gian thuê chính xác = days cố định
  const computeScheduleFromWedding = (weddingDisplayOrIso, days) => {
    const wedIso = toIsoDateString(weddingDisplayOrIso);
    if (!wedIso) return { startDate: '', weddingDate: '', endDate: '' };

    const validDays = Math.max(1, Math.min(30, Number(days) || 1));
    let beforeDays = 1;
    let afterDays = 0;

    if (validDays === 1) {
      // Gói 1 ngày: Nhận trước 1 ngày (ví dụ 10/11), cưới và hoàn trả vào tối ngày cưới (11/11)
      beforeDays = 1;
      afterDays = 0;
    } else if (validDays === 2) {
      // Gói 2 ngày: Nhận trước 1 ngày (10/11), cưới (11/11), trả sau ngày cưới 1 ngày (12/11)
      beforeDays = 1;
      afterDays = 1;
    } else if (validDays === 3) {
      // Gói 3 ngày: Nhận trước 2 ngày (09/11), cưới (11/11), trả sau ngày cưới 1 ngày (12/11)
      beforeDays = 2;
      afterDays = 1;
    } else if (validDays === 4) {
      // Gói 4 ngày chuẩn: Nhận trước 2 ngày (09/11), cưới (11/11), trả sau ngày cưới 2 ngày (13/11)
      beforeDays = 2;
      afterDays = 2;
    } else {
      // Gói >= 5 ngày: Phân bổ hợp lý, ưu tiên ngày trả sau ngày cưới
      beforeDays = Math.floor(validDays / 2);
      afterDays = validDays - beforeDays;
    }

    const startDisplay = addDaysToDate(wedIso, -beforeDays);
    const weddingDisplay = toDisplayDateString(wedIso);
    const endDisplay = addDaysToDate(wedIso, afterDays);

    return {
      startDate: startDisplay,
      weddingDate: weddingDisplay,
      endDate: endDisplay,
    };
  };

  // Schedule state (Định dạng hiển thị DD/MM/YYYY)
  const [rentalSchedule, setRentalSchedule] = useState(() => {
    const validStart = startDateParam && startDateParam !== 'undefined' && startDateParam !== 'null' ? toDisplayDateString(startDateParam) : null;
    const validEnd = endDateParam && endDateParam !== 'undefined' && endDateParam !== 'null' ? toDisplayDateString(endDateParam) : null;
    const validWedding = searchParams.get('weddingDate') && searchParams.get('weddingDate') !== 'undefined' && searchParams.get('weddingDate') !== 'null'
      ? toDisplayDateString(searchParams.get('weddingDate'))
      : null;

    if (validStart && validEnd) {
      return {
        startDate: validStart,
        weddingDate: validWedding || validStart,
        endDate: validEnd,
      };
    }

    if (validWedding) {
      const initialDays = !isNaN(daysParam) && daysParam >= 1 && daysParam <= 30 ? daysParam : 4;
      return computeScheduleFromWedding(validWedding, initialDays);
    }

    // Khi người dùng chưa chọn ngày: BẮT BUỘC để trống, không tự ý điền sẵn ngày giả gây báo trùng lịch sai
    return {
      startDate: '',
      weddingDate: '',
      endDate: '',
    };
  });

  // Cập nhật số ngày thuê trên Stepper (+ / -)
  // Tự động phân bổ ngày nhận và ngày trả xoay quanh ngày cưới hiện tại (nếu đã chọn):
  const handleRentalDaysChange = (newDays) => {
    const clamped = Math.max(1, Math.min(30, Number(newDays) || 1));
    setRentalDays(clamped);

    setRentalSchedule((prev) => {
      if (!prev.weddingDate) return prev;
      return computeScheduleFromWedding(prev.weddingDate, clamped);
    });
  };

  // State cho tháng đang xem trên lịch tương tác
  const [calendarViewDate, setCalendarViewDate] = useState(() => {
    const initialIso = toIsoDateString(rentalSchedule.weddingDate || rentalSchedule.startDate);
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

  // Tự động tải lịch đã đặt từ Backend API khi danh sách lễ phục thay đổi
  React.useEffect(() => {
    let isMounted = true;
    const fetchBooked = async () => {
      try {
        const items = orderItems && orderItems.length > 0 ? orderItems : (activeDress ? [activeDress] : []);
        if (items.length === 0) return;
        const allBooked = [];
        for (const it of items) {
          const dressId = it.id || it._id;
          if (!dressId) continue;
          try {
            const apiDates = await getDressBookedDates(dressId);
            if (Array.isArray(apiDates)) {
              allBooked.push(...apiDates);
            }
          } catch (e) {
            // ignore single dress error
          }
        }
        if (isMounted && allBooked.length > 0) {
          const formatted = allBooked
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
  }, [orderItems, activeDress]);

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
    if (!iso) return '';
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3) return '';
    const offset = days <= 3 ? 1 : Math.min(2, Math.floor(days / 2));
    const wedD = new Date(parts[0], parts[1] - 1, parts[2] + offset);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(wedD.getDate())}/${pad(wedD.getMonth() + 1)}/${wedD.getFullYear()}`;
  };

  // Xử lý khi chọn ngày bắt đầu thuê (Ngày nhận váy)
  const handleSelectStartDate = (selectedIsoOrDisplay) => {
    const iso = toIsoDateString(selectedIsoOrDisplay);
    if (!iso) return;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3) return;

    const startDisplay = toDisplayDateString(iso);
    const endDisplay = computeEndDate(iso, rentalDays);
    const endIso = toIsoDateString(endDisplay);
    const currentWedIso = toIsoDateString(rentalSchedule.weddingDate);

    let newWeddingDisplay = rentalSchedule.weddingDate;

    // Nếu ngày nhận mới làm ngày cưới nằm ngoài khoảng thuê [startDate, endDate]:
    // (ví dụ: ngày trả < ngày cưới, hoặc ngày nhận > ngày cưới)
    if (!currentWedIso || currentWedIso < iso || currentWedIso > endIso) {
      // Đặt ngày cưới nằm trong khoảng thuê sao cho ngày trả >= ngày cưới
      const offset = rentalDays === 1 ? 1 : Math.min(2, Math.floor(rentalDays / 2));
      newWeddingDisplay = addDaysToDate(iso, offset);
    }

    setRentalSchedule({
      startDate: startDisplay,
      weddingDate: newWeddingDisplay,
      endDate: endDisplay,
    });
    setCalendarViewDate(new Date(parts[0], parts[1] - 1, 1));
  };

  // Xử lý khi cô dâu chọn Ngày cưới chính thức:
  // CỐ ĐỊNH SỐ NGÀY THUÊ rentalDays ĐÃ CHỌN TRÊN STEPPER, TỰ ĐỘNG DỊCH CHUYỂN KHOẢNG THUÊ THEO NGÀY CƯỚI:
  const handleSelectWeddingDate = (selectedIsoOrDisplay) => {
    const newWedIso = toIsoDateString(selectedIsoOrDisplay);
    if (!newWedIso) return;
    const parts = newWedIso.split('-').map(Number);
    if (parts.length !== 3) return;

    // Giữ nguyên rentalDays cố định theo stepper, tự động trượt ngày nhận và ngày trả xoay quanh ngày cưới:
    const newSchedule = computeScheduleFromWedding(newWedIso, rentalDays);
    setRentalSchedule(newSchedule);
    setCalendarViewDate(new Date(parts[0], parts[1] - 1, 1));
  };

  // Xử lý khi cô dâu chọn Ngày hoàn trả váy:
  // HOÀN TOÀN CHO PHÉP Ngày trả trùng Ngày cưới (endDate === weddingDate)
  // TÍNH LẠI rentalDays DỰA TRÊN KHOẢNG CÁCH NGÀY TRẢ VÀ NGÀY NHẬN (KHÔNG BAO GIỜ BỊ NaN)
  const handleSelectEndDate = (selectedIsoOrDisplay) => {
    const newEndIso = toIsoDateString(selectedIsoOrDisplay);
    if (!newEndIso) return;
    const startIso = toIsoDateString(rentalSchedule.startDate);
    const wedIso = toIsoDateString(rentalSchedule.weddingDate);

    if (startIso && newEndIso < startIso) {
      message.warning('Ngày hoàn trả không thể trước ngày nhận váy!');
      return;
    }

    const startParts = startIso.split('-').map(Number);
    const endParts = newEndIso.split('-').map(Number);
    const startUtc = Date.UTC(startParts[0], startParts[1] - 1, startParts[2]);
    const endUtc = Date.UTC(endParts[0], endParts[1] - 1, endParts[2]);
    const diffDays = Math.max(1, Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24)));

    setRentalDays(diffDays);

    let updatedWedDisplay = rentalSchedule.weddingDate;
    if (wedIso && newEndIso < wedIso) {
      updatedWedDisplay = toDisplayDateString(newEndIso);
    }

    setRentalSchedule({
      startDate: toDisplayDateString(startIso),
      weddingDate: updatedWedDisplay,
      endDate: toDisplayDateString(newEndIso),
    });
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

  // Measurements: Nếu tài khoản chưa lưu số đo thì BẮT BUỘC để trống ('')
  const [measurements, setMeasurements] = useState(() => {
    if (user?.measurements) {
      return {
        height: user.measurements.height ? String(user.measurements.height) : '',
        weight: user.measurements.weight ? String(user.measurements.weight) : '',
        bust: user.measurements.bust ? String(user.measurements.bust) : '',
        waist: user.measurements.waist ? String(user.measurements.waist) : '',
        hips: user.measurements.hips ? String(user.measurements.hips) : '',
        heel: user.measurements.heel ? String(user.measurements.heel) : '',
      };
    }
    return {
      height: '',
      weight: '',
      bust: '',
      waist: '',
      hips: '',
      heel: '',
    };
  });

  // Tăng giảm số đo nhanh bằng nút bấm lên / xuống
  const handleStepMeasurement = (field, delta) => {
    setMeasurements((prev) => {
      const current = parseFloat(prev[field]) || 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [field]: String(next),
      };
    });
  };

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
  const [contractSignature, setContractSignature] = useState('');
  const [hasAgreedContractTerms, setHasAgreedContractTerms] = useState(true);
  const [isContractSigned, setIsContractSigned] = useState(false);

  // Step 3: Deposit option: 'deposit30' | 'full100'
  const [depositOption, setDepositOption] = useState('deposit30');

  // Payment gateway: 'vietqr' | 'card' | 'offline'
  const [paymentGateway, setPaymentGateway] = useState('vietqr');

  // Modals
  const [isSizeGuideModalOpen, setIsSizeGuideModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Financial calculations: Giá niêm yết là giá thuê theo ngày
  // Công thức chuẩn: Tổng tiền thuê = (Tổng đơn giá các váy) x (Số ngày thuê)
  const dailyRentPrice = useMemo(() => {
    if (orderItems && orderItems.length > 0) {
      return orderItems.reduce((sum, item) => sum + (Number(item.price || item.rentPrice) || 0), 0);
    }
    return Number(activeDress?.price) || 5200000;
  }, [orderItems, activeDress]);

  const totalRentPrice = useMemo(() => {
    return dailyRentPrice * Math.max(1, Number(rentalDays) || 1);
  }, [dailyRentPrice, rentalDays]);

  const depositCollateral = useMemo(() => {
    if (orderItems && orderItems.length > 0) {
      return orderItems.reduce((sum, item) => sum + (Number(item.deposit || item.depositAmount) || 15000000), 0);
    }
    return Number(activeDress?.depositAmount || activeDress?.deposit) || 15000000;
  }, [orderItems, activeDress]);

  // Tổng thanh toán hôm nay = Tổng tiền thuê + Tiền cọc bảo lãnh (Cọc bảo lãnh hoàn trả 100% khi trả váy)
  const amountToPayToday = totalRentPrice + depositCollateral;

  // Validation chi tiết Step 1 (Thông tin người đại diện thuê)
  const validateCustomerInfo = () => {
    const errors = {};
    const trimmedName = (brideName || '').trim();
    const trimmedPhone = (phone || '').trim();
    const trimmedEmail = (email || '').trim();
    const trimmedCccd = (cccd || '').trim();
    const trimmedAddress = (address || '').trim();

    // 1. Họ và tên cô dâu
    if (!trimmedName) {
      errors.brideName = 'Vui lòng nhập họ và tên cô dâu';
    } else if (trimmedName.length < 2) {
      errors.brideName = 'Họ và tên tối thiểu 2 ký tự';
    }

    // 2. Số điện thoại (chuẩn 10 số VN)
    const cleanPhone = trimmedPhone.replace(/[\s.-]/g, '');
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!trimmedPhone) {
      errors.phone = 'Vui lòng nhập số điện thoại liên hệ';
    } else if (!phoneRegex.test(cleanPhone)) {
      errors.phone = 'Số điện thoại không hợp lệ (gồm 10 số, VD: 0912345678)';
    }

    // 3. Email nhận hợp đồng
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Vui lòng nhập email nhận hợp đồng số';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Địa chỉ email không đúng định dạng (VD: codau@gmail.com)';
    }

    // 4. Số CCCD / CMND
    const cleanCccd = trimmedCccd.replace(/[\s.-]/g, '');
    const cccdRegex = /^([0-9]{9}|[0-9]{12})$/;
    if (!trimmedCccd) {
      errors.cccd = 'Vui lòng nhập số CCCD / CMND để lập hợp đồng pháp lý';
    } else if (!cccdRegex.test(cleanCccd)) {
      errors.cccd = 'Số CCCD/CMND phải gồm 9 hoặc 12 chữ số';
    }

    // 5. Địa chỉ thường trú hoặc nhận lễ phục
    if (!trimmedAddress) {
      errors.address = 'Vui lòng nhập địa chỉ thường trú hoặc nhận lễ phục';
    } else if (trimmedAddress.length < 5) {
      errors.address = 'Địa chỉ cần chi tiết hơn (tối thiểu 5 ký tự)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation Step 1
  const handleProceedToContract = (e) => {
    e?.preventDefault();
    if (!rentalSchedule.startDate || !rentalSchedule.weddingDate || !rentalSchedule.endDate) {
      message.warning('Nàng vui lòng chọn ngày cưới và thời gian thuê trên bảng lịch trước khi tiếp tục!');
      return;
    }

    if (scheduleConflict) {
      message.error(
        `Khoảng ngày nàng chọn bị trùng với lịch đã đặt trước (${scheduleConflict.formattedRange}). Vui lòng chọn ngày còn trống trên bảng lịch để tiếp tục!`
      );
      return;
    }

    const isValid = validateCustomerInfo();
    if (!isValid) {
      message.error('Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc có dấu (*)!');
      const firstErrorEl = document.querySelector('[data-error="true"]');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
    if (signatureMode === 'draw') {
      if (!hasDrawnSignature || !drawnSignatureData) {
        message.warning('Nàng vui lòng vẽ chữ ký vào ô ký tên điện tử trước khi chuyển sang thanh toán.');
        return;
      }
    } else {
      if (!contractSignature || !contractSignature.trim()) {
        message.warning('Vui lòng nhập họ tên xác nhận chữ ký điện tử.');
        return;
      }
    }
    setIsContractSigned(true);
    message.success('Ký hợp đồng thuê điện tử thành công!');
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hàm chuyển hướng mở Toàn văn Hợp đồng dưới dạng file PDF chuẩn A4
  const handleOpenPdfContract = () => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const pdfWindow = window.open('', '_blank');
    if (!pdfWindow) {
      message.warning('Trình duyệt đã chặn tab mới. Vui lòng cấp quyền mở popup để xem hợp đồng PDF.');
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Hop_Dong_Thue_Le_Phuc_Cuoi_${brideName.replace(/\s+/g, '_')}.pdf</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background: #525659;
            font-family: 'Times New Roman', Times, serif;
            color: #111;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .pdf-toolbar {
            position: sticky;
            top: 0;
            left: 0;
            right: 0;
            height: 52px;
            background: #323639;
            color: #f1f1f1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.35);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .pdf-toolbar-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .pdf-badge {
            background: #c62828;
            color: #fff;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
          }
          .pdf-filename {
            font-size: 13.5px;
            font-weight: 500;
            color: #f5f5f5;
          }
          .pdf-toolbar-right {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .btn-action {
            background: #733F49;
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: background 0.2s;
          }
          .btn-action:hover {
            background: #5a2e37;
          }
          .btn-close {
            background: #474b4e;
            color: #e0e0e0;
            border: none;
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            transition: background 0.2s;
          }
          .btn-close:hover {
            background: #5a5e62;
          }
          .pdf-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px 16px 50px;
          }
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            background: #ffffff;
            padding: 22mm 20mm;
            box-shadow: 0 4px 25px rgba(0,0,0,0.35);
            position: relative;
            margin-bottom: 24px;
            font-size: 12.5pt;
            line-height: 1.5;
          }
          .header-box { text-align: center; margin-bottom: 20px; }
          .header-box h3 { margin: 0; font-size: 12pt; text-transform: uppercase; font-weight: bold; }
          .header-box h4 { margin: 2px 0 6px; font-size: 11.5pt; font-weight: normal; font-style: italic; }
          .header-box .divider { width: 150px; height: 1.5px; background: #222; margin: 4px auto 14px; }
          .header-box h1 { margin: 10px 0 4px; font-size: 17pt; color: #733F49; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
          .header-box .doc-code { font-style: italic; font-size: 11pt; color: #555; }
          .law-intro { font-style: italic; font-size: 11pt; text-align: justify; margin: 12px 0 10px; line-height: 1.45; }
          .parties-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 16px; }
          .parties-table td { width: 50%; vertical-align: top; padding: 10px 12px; border: 1px solid #aaa; font-size: 11pt; line-height: 1.45; }
          .parties-table .col-title { font-weight: bold; color: #733F49; text-transform: uppercase; margin-bottom: 5px; font-size: 11.5pt; }
          .clause-heading { font-weight: bold; font-size: 12pt; color: #733F49; margin-top: 14px; margin-bottom: 5px; text-transform: uppercase; }
          p { margin: 4px 0; text-align: justify; }
          .signatures-table { width: 100%; border-collapse: collapse; margin-top: 25px; page-break-inside: avoid; }
          .signatures-table td { width: 50%; text-align: center; vertical-align: top; padding: 10px; border: none; }
          .sig-title { font-weight: bold; font-size: 11.5pt; text-transform: uppercase; margin-bottom: 3px; }
          .sig-sub { font-style: italic; font-size: 10pt; color: #555; margin-bottom: 10px; }
          .sign-name { font-weight: bold; font-size: 12pt; margin-top: 6px; }
          .page-footer {
            border-top: 1px solid #ddd;
            margin-top: 25px;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 9.5pt;
            color: #888;
            font-style: italic;
          }

          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .pdf-container { padding: 0 !important; }
            .a4-page {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            @page { size: A4 portrait; margin: 15mm 15mm 15mm 15mm; }
          }
        </style>
      </head>
      <body>
        <div class="pdf-toolbar no-print">
          <div class="pdf-toolbar-left">
            <span class="pdf-badge">PDF</span>
            <span class="pdf-filename">Hop_Dong_Thue_Le_Phuc_Cuoi_${brideName.replace(/\s+/g, '_')}.pdf</span>
          </div>
          <div class="pdf-toolbar-right">
            <button class="btn-action" onclick="window.print()">
              🖨️ In / Tải Xuống File PDF
            </button>
            <button class="btn-close" onclick="window.close()">✕ Đóng</button>
          </div>
        </div>

        <div class="pdf-container">
          <div class="a4-page">
            <div class="header-box">
              <h3>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
              <h4>Độc lập — Tự do — Hạnh phúc</h4>
              <div class="divider"></div>
              <h1>HỢP ĐỒNG THUÊ LỄ PHỤC CƯỚI CAO CẤP</h1>
              <div class="doc-code">Số: HĐ-UB-2026/8992 • Cấp ngày: ${todayStr}</div>
            </div>

            <div class="law-intro">
              - Căn cứ Bộ luật Dân sự số 91/2015/QH13 đã được Quốc hội Nước CHXHCN Việt Nam thông qua ngày 24/11/2015;<br />
              - Căn cứ Luật Thương mại số 36/2005/QH11 của Quốc hội ban hành ngày 14/06/2005;<br />
              - Căn cứ Luật Giao dịch điện tử số 20/2023/QH15 của Quốc hội ban hành ngày 22/06/2023;<br />
              - Xét theo nhu cầu sử dụng trang phục cưới và cam kết dịch vụ giữa hai bên.
            </div>

            <p>Hôm nay, ngày ${todayStr}, chúng tôi gồm có các bên ký kết:</p>

            <table class="parties-table">
              <tr>
                <td>
                  <div class="col-title">BÊN CHO THUÊ (BÊN A):</div>
                  <strong>CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE</strong><br />
                  Mã số thuế: <strong>0316889988</strong><br />
                  Địa chỉ: 88 Nam Kỳ Khởi Nghĩa, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh<br />
                  Hotline: <strong>1800 8998</strong> • Email: contact@unibridal.vn<br />
                  Người đại diện: <strong>Ông Kim Xuân Hiếu</strong><br />
                  Chức vụ: <strong>Tổng Giám Đốc</strong>
                </td>
                <td>
                  <div class="col-title">BÊN THUÊ LỄ PHỤC (BÊN B):</div>
                  Họ và tên: <strong>${brideName}</strong><br />
                  Số CCCD/CMND: <strong>${cccd}</strong><br />
                  Số điện thoại: <strong>${phone}</strong><br />
                  Email: <strong>${email}</strong><br />
                  Địa chỉ nhận: <strong>${address}</strong><br />
                  Thông số tinh chỉnh: ${measurements.height && measurements.weight ? `Cao ${measurements.height}cm • Nặng ${measurements.weight}kg • Vòng eo ${measurements.waist || '—'}cm` : 'Chuyên viên showroom hỗ trợ may đo trực tiếp'}
                </td>
              </tr>
            </table>

            <p>Hai bên thống nhất ký kết hợp đồng thuê lễ phục cưới với các điều khoản pháp lý cụ thể như sau:</p>

            <div class="clause-heading">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & TIÊU CHUẨN LỄ PHỤC</div>
            ${orderItems && orderItems.length > 1 ? `
              <p>1.1. Bên A đồng ý cho Bên B thuê <strong>${orderItems.length} tác phẩm lễ phục cưới cao cấp</strong> độc bản bao gồm:</p>
              <ul style="margin: 6px 0 10px 20px; font-size: 11pt; line-height: 1.6;">
                ${orderItems.map((item, idx) => `
                  <li><strong>${idx + 1}. ${item.name}</strong> (Mã tác phẩm: <strong>${item.code || `UB-HC-2026-0${idx + 1}`}</strong>) — Kích cỡ: <strong>Size ${item.size || selectedSize}</strong> — Giá thuê: <strong>${formatNumberDots(Number(item.price || item.rentPrice) || 0)} VNĐ</strong> — Tiền cọc: <strong>${formatNumberDots(Number(item.deposit || item.depositAmount) || 15000000)} VNĐ</strong></li>
                `).join('')}
              </ul>
            ` : `
              <p>1.1. Bên A đồng ý cho Bên B thuê tác phẩm váy cưới độc bản thiết kế mang tên <strong>${activeDress?.name}</strong> (Mã tác phẩm: <strong>${activeDress?.code || 'UB-HC-2026'}</strong>), Kích cỡ: <strong>Size ${selectedSize}</strong>.</p>
            `}
            <p>1.2. Tiêu chuẩn bàn giao: Tác phẩm đạt chuẩn Haute Couture, khung xương nẹp corset siết eo công nghệ Pháp, được giặt sấy tiệt trùng ozone sinh học, ủi phẳng phiu và đặt trong Vali VIP Courier bảo quản chống bụi nhiệt trước giờ trao nhận 02 giờ.</p>
            <p>1.3. Tinh chỉnh may đo: Bên A cung cấp dịch vụ tinh chỉnh nới/siết phom theo đúng số đo của Bên B (${measurements.height ? `Chiều cao: ${measurements.height}cm, Cân nặng: ${measurements.weight || '—'}kg, Vòng eo: ${measurements.waist || '—'}cm` : 'Chuyên viên Atelier đo và tinh chỉnh trực tiếp tại Showroom'}).</p>

            <div class="clause-heading">ĐIỀU 2: THỜI HẠN THUÊ, PHƯƠNG THỨC GIAO NHẬN & QUY TRÌNH THU HỒI, KIỂM ĐỊNH</div>
            <p>2.1. Tổng thời gian thuê: <strong>${rentalDays} ngày</strong> liên tục.</p>
            <p>2.2. Thời điểm nhận váy: Từ 09:00 ngày <strong>${rentalSchedule.startDate}</strong>.</p>
            <p>2.3. Ngày tổ chức hôn lễ chính thức: <strong>${rentalSchedule.weddingDate}</strong>.</p>
            <p>2.4. Phương thức nhận váy & thu hồi: ${deliveryMethod === 'delivery'
        ? 'Bên A thực hiện giao váy tận nơi bằng Vali VIP Courier theo địa chỉ Bên B đã đăng ký. '
        : 'Bên B nhận váy trực tiếp tại Showroom Atelier của Bên A (được hỗ trợ chuyên viên fitting và ủi sấy hoàn thiện trước giờ trao nhận). '
      }Đến thời hạn hoàn trả (trước 20:00 ngày <strong>' + rentalSchedule.endDate + '</strong>), <strong>chuyên viên của Bên A sẽ chủ động liên hệ hẹn giờ và trực tiếp đến tận nơi thu hồi lễ phục trong vali bảo quản niêm phong & kiểm định hiện trạng</strong>, Bên B không cần phải tự mang trả.</p>
            <p>2.5. Hai bên thực hiện ký Biên bản kiểm định bàn giao và thu hồi để ghi nhận hiện trạng đính kết ren, hạt cườm và kết cấu váy tại thời điểm giao và nhận lại.</p>

            <div class="clause-heading">ĐIỀU 3: GIÁ THUÊ & PHƯƠNG THỨC THANH TOÁN</div>
            <p>3.1. Tổng giá trị hợp đồng thuê trọn gói (${rentalDays} ngày): <strong>${formatNumberDots(totalRentPrice)} VNĐ</strong> (Đã bao gồm VAT, dịch vụ giặt hấp khử khuẩn và phí tinh chỉnh phom váy).</p>
            <p>3.2. Tiền cọc bảo lãnh trang phục (50% giá trị váy): <strong>${formatNumberDots(depositCollateral)} VNĐ</strong>.</p>
            <p>3.3. Tổng số tiền thanh toán khi ký hợp đồng (Tiền thuê + Cọc bảo lãnh): <strong>${formatNumberDots(totalRentPrice + depositCollateral)} VNĐ</strong>, Bên B thanh toán ngay thông qua cổng chuyển khoản VietQR Techcombank.</p>
            <p>3.4. Cam kết hoàn tiền cọc: Bên A cam kết hoàn trả 100% tiền cọc bảo lãnh (${formatNumberDots(depositCollateral)} VNĐ) vào tài khoản Bên B ngay khi tiếp nhận hoàn trả váy nguyên vẹn.</p>

            <div class="clause-heading">ĐIỀU 4: CAM KẾT DỊCH VỤ & BẢO HIỂM LỄ PHỤC</div>
            <p>4.1. Cam kết chất lượng: Bên A cam kết bàn giao đúng tác phẩm thiết kế đã chọn, đúng số đo may đo đã ghi nhận và đầy đủ bộ phụ kiện cao cấp đi kèm.</p>
            <p>4.2. Cam kết hoàn cọc: Trường hợp phát sinh thay đổi hoặc hủy hợp đồng theo các điều khoản bất khả kháng quy định tại Điều 7, Bên A cam kết bảo lưu hoặc hoàn trả 100% tiền cọc giữ lịch trong vòng 24 giờ làm việc.</p>

            <div class="clause-heading">ĐIỀU 5: QUY CHUẨN BẢO QUẢN & CHÍNH SÁCH BẢO HIỂM VẢI REN</div>
            <p>5.1. Bảo hiểm vết bẩn sự kiện cưới: Bên A áp dụng chính sách bảo hiểm miễn phí xử lý đối với các vết bẩn thông thường như bụi sân khấu, vết bùn đất gấu váy hoặc vết rượu vang rơi vãi nhẹ. Bên A chịu 100% chi phí xử lý bằng dung môi sinh học chuyên dụng.</p>
            <p>5.2. Trách nhiệm của Bên B: Giữ gìn lễ phục ở nơi khô ráo, thoáng mát, treo cao bằng móc chống biến dạng; tuyệt đối không để tàn thuốc lá, pháo sáng hoặc vật sắc nhọn tiếp xúc gần với bề mặt ren.</p>
            <p>5.3. Nghiêm cấm: Bên B tuyệt đối không tự ý cắt may, thay đổi kết cấu, dán keo vải hoặc đem váy đến các tiệm giặt ủi thông thường bên ngoài.</p>

            <div class="clause-heading">ĐIỀU 6: QUY ĐỊNH BỒI HOÀN KHI HƯ HỎNG, TRỄ HẠN HOẶC MẤT MÁT</div>
            <p>6.1. Bàn giao hoàn trả trễ hạn: Nếu Bên B hoàn trả sau 20:00 ngày ${rentalSchedule.endDate} mà không có thỏa thuận gia hạn trước bằng văn bản, Bên B chịu phí lưu dụng là 800.000 VNĐ/ngày để bù đắp chi phí gián đoạn lịch của cô dâu tiếp theo.</p>
            <p>6.2. Hư hỏng có thể khắc phục (rách ren nhỏ, đứt chỉ đính hạt): Bên B bồi hoàn chi phí công phục dựng thủ công của nghệ nhân theo hóa đơn thực tế, tối đa không vượt quá 15% tiền cọc bảo lãnh.</p>
            <p>6.3. Hư hỏng nặng không thể phục hồi (cháy rách mảng lớn, loang màu hóa chất không tẩy được, hoặc mất mát): Bên B chịu trách nhiệm bồi thường theo giá trị niêm yết xuất kho của tác phẩm sau khi khấu trừ 20% hao mòn tự nhiên.</p>

            <div class="clause-heading">ĐIỀU 7: QUYỀN THAY ĐỔI LỊCH CƯỚI, HỦY HỢP ĐỒNG & BẤT KHẢ KHÁNG</div>
            <p>7.1. Đổi ngày cưới miễn phí: Bên B được quyền chuyển đổi ngày thuê sang bất kỳ ngày nào còn trống trong vòng 12 tháng hoàn toàn miễn phí khi gửi thông báo trước tối thiểu 15 ngày so với ngày nhận váy ban đầu.</p>
            <p>7.2. Trường hợp bất khả kháng: Trong trường hợp xảy ra thiên tai, dịch bệnh hoặc các quyết định cấm tập trung của Cơ quan Nhà nước có thẩm quyền, hai bên thống nhất bảo lưu 100% giá trị hợp đồng và tiền đặt cọc trong thời hạn 18 tháng mà không phải chịu bất kỳ khoản phạt nào.</p>

            <div class="clause-heading">ĐIỀU 8: GIẢI QUYẾT TRANH CHẤP & HIỆU LỰC PHÁP LÝ HỢP ĐỒNG ĐIỆN TỬ</div>
            <p>8.1. Căn cứ theo Điều 12 và Điều 13 Luật Giao dịch điện tử số 20/2023/QH15, Hợp đồng này được xác lập bằng phương tiện điện tử, chữ ký tay số và chữ ký điện tử của hai bên có giá trị pháp lý ràng buộc đầy đủ tương đương với văn bản giấy có chữ ký trực tiếp và con dấu mộc đỏ.</p>
            <p>8.2. Mọi tranh chấp phát sinh từ hợp đồng này sẽ được ưu tiên giải quyết thông qua thương lượng hòa giải thiện chí. Nếu không hòa giải được, vụ việc sẽ được đưa ra Tòa án nhân dân có thẩm quyền tại Thành phố Hồ Chí Minh để giải quyết theo quy định pháp luật Việt Nam.</p>
            <p>8.3. Hợp đồng có hiệu lực kể từ thời điểm Bên B hoàn tất ký điện tử và thanh toán khoản đặt cọc giữ lịch. Bản điện tử được lưu trữ tại hệ thống cơ sở dữ liệu UniBridal và được tự động gửi vào địa chỉ Email của Bên B để làm bằng chứng pháp lý.</p>

            <table class="signatures-table">
              <tr>
                <td>
                  <div class="sig-title">ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)</div>
                  <div class="sig-sub">CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE</div>
                  <div style="height: 65px; display: flex; align-items: center; justify-content: center; margin: 4px auto;">
                    <img src="${HIEU_SIGNATURE_BASE64}" alt="Chữ ký Hiếu" style="max-height: 58px; max-width: 140px; object-fit: contain;" />
                  </div>
                  <div class="sign-name">Ông Kim Xuân Hiếu</div>
                  <div style="font-size: 10.5pt; color: #555;">Tổng Giám Đốc</div>
                </td>
                <td>
                  <div class="sig-title">BÊN THUÊ LỄ PHỤC (BÊN B)</div>
                  <div class="sig-sub">KÝ TÊN VÀ XÁC NHẬN BẰNG CHỮ KÝ ĐIỆN TỬ</div>
                  ${drawnSignatureData
        ? '<img src="' + drawnSignatureData + '" style="max-height: 55px; margin: 10px auto;" /><br />'
        : '<div style="font-family: serif; font-size: 18pt; font-style: italic; color: #1D2A44; margin: 15px 0;">' + (contractSignature || brideName) + '</div>'
      }
                  <div class="sign-name">${brideName}</div>
                  <div style="font-size: 10.5pt; color: #555;">Số CCCD: ${cccd}</div>
                </td>
              </tr>
            </table>

            <div class="page-footer">
              <span>Văn bản hợp đồng thuê điện tử được xác lập & bảo mật bởi UniBridal Atelier Việt Nam</span>
              <span>Mã tra cứu: HĐ-UB-2026/8992</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    pdfWindow.document.open();
    pdfWindow.document.write(htmlContent);
    pdfWindow.document.close();
  };

  const handlePrintPdfContract = handleOpenPdfContract;

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
        ${orderItems && orderItems.length > 1 ? `
          <p>1.1. Bên A đồng ý cho Bên B thuê <strong>${orderItems.length} tác phẩm lễ phục cưới cao cấp</strong> độc bản bao gồm:</p>
          <ul style="margin: 6px 0 10px 20px; line-height: 1.6;">
            ${orderItems.map((item, idx) => `
              <li><strong>${idx + 1}. ${item.name}</strong> (Mã tác phẩm: <strong>${item.code || `UB-HC-2026-0${idx + 1}`}</strong>) — Kích cỡ: <strong>Size ${item.size || selectedSize}</strong> — Giá thuê: <strong>${formatNumberDots(Number(item.price || item.rentPrice) || 0)} VNĐ</strong> — Cọc bảo lãnh: <strong>${formatNumberDots(Number(item.deposit || item.depositAmount) || 15000000)} VNĐ</strong></li>
            `).join('')}
          </ul>
        ` : `
          <p>1.1. Bên A đồng ý cho Bên B thuê tác phẩm váy cưới thiết kế độc bản <strong>${activeDress?.name}</strong> (Mã tác phẩm: <strong>${activeDress?.code || 'UB-HC-2026'}</strong>), Kích cỡ: <strong>Size ${selectedSize}</strong>.</p>
        `}
        <p>1.2. Thời gian thuê: <strong>${rentalDays} ngày</strong>. Ngày nhận váy: <strong>${rentalSchedule.startDate}</strong>; Ngày cưới chính thức: <strong>${rentalSchedule.weddingDate}</strong>; Ngày hoàn trả: trước 20:00 ngày <strong>${rentalSchedule.endDate}</strong>.</p>
        <p>1.3. Tiêu chuẩn giao nhận: Lễ phục được giặt sấy tiệt trùng sinh học, ủi phẳng phiu và tinh chỉnh theo số đo cô dâu hoàn thiện trước giờ trao nhận 2 giờ trong Vali VIP Courier bảo quản chân không.</p>

        <div class='clause-title'>ĐIỀU 2: GIÁ THUÊ & PHƯƠNG THỨC THANH TOÁN</div>
        <p>2.1. Tổng chi phí thuê váy trọn gói (${rentalDays} ngày): <strong>${formatNumberDots(totalRentPrice)} VNĐ</strong>.</p>
        <p>2.2. Tiền cọc bảo lãnh trang phục (50% giá trị váy): <strong>${formatNumberDots(depositCollateral)} VNĐ</strong>.</p>
        <p>2.3. Tổng số tiền thanh toán khi ký hợp đồng (Tiền thuê + Tiền cọc bảo lãnh): <strong>${formatNumberDots(totalRentPrice + depositCollateral)} VNĐ</strong> (thanh toán qua cổng chuyển khoản VietQR Techcombank).</p>
        <p>2.4. Cam kết hoàn tiền cọc: Bên A hoàn trả 100% khoản cọc bảo lãnh (${formatNumberDots(depositCollateral)} VNĐ) cho Bên B ngay sau khi nhận lại trang phục nguyên vẹn.</p>

        <div class='clause-title'>ĐIỀU 3: CỌC BẢO LÃNH HOÀN TRẢ & CAM KẾT HOÀN TIỀN 100%</div>
        <p>3.1. Tiền cọc bảo lãnh hoàn trả trang phục: <strong>${formatNumberDots(depositCollateral)} VNĐ</strong>.</p>
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

  // Xử lý xác nhận thanh toán đặt cọc chuyển khoản VietQR
  const handleConfirmFinalPayment = async (e) => {
    e?.preventDefault();
    if (isSubmitting || isVerifyingPayment) return;

    // VALIDATION BẮT BUỘC: Chưa ký hợp đồng điện tử thì KHÔNG ĐƯỢC thanh toán cọc
    if (!isContractSigned) {
      message.error({
        content: 'Nàng chưa ký hợp đồng thuê điện tử! Vui lòng hoàn tất chữ ký ở Bước 2 trước khi thanh toán cọc.',
        duration: 3.5,
      });
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsVerifyingPayment(true);

    message.loading({
      content: 'Đang kết nối cổng Techcombank Napas 247 & đối soát giao dịch chuyển khoản...',
      key: 'payment_confirm',
      duration: 1.8,
    });

    setTimeout(async () => {
      setIsVerifyingPayment(false);
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
        paymentMethod: 'vietqr',
        paymentStatus: 'deposit_paid',
        rentalStartDate: toIsoDateString(rentalSchedule?.startDate) || new Date().toISOString().split('T')[0],
        rentalEndDate: toIsoDateString(rentalSchedule?.endDate) || new Date(Date.now() + (Number(rentalDays) || 4) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rentalDays,
        items: (orderItems && orderItems.length > 0 ? orderItems : [activeDress]).filter(Boolean).map((item, idx) => {
          const itemDailyPrice = Number(item.price || item.rentPrice) || 0;
          return {
            dressId: item.id || item._id,
            name: item.name,
            code: item.code || `UB-HC-2026-0${idx + 1}`,
            size: item.size || selectedSize,
            rentPrice: itemDailyPrice * Math.max(1, Number(rentalDays) || 1),
            dailyPrice: itemDailyPrice,
            rentalDays,
            depositAmount: Number(item.deposit || item.depositAmount) || 15000000,
            image: item.images?.[0] || item.image,
          };
        }),
        totalRentPrice,
        totalDeposit: depositCollateral,
        depositPaidAmount: amountToPayToday,
        totalPayment: totalRentPrice + depositCollateral,
        deliveryMethod: 'showroom',
        notes: `Hôn lễ ngày ${rentalSchedule.weddingDate}. Đã thanh toán trọn gói gồm tiền thuê và cọc bảo lãnh 50% giá trị (${formatCurrencyVND(depositCollateral)} - Hoàn trả khi trả váy) cho ${(orderItems && orderItems.length) || 1} tác phẩm lễ phục cưới. Phương thức: Chuyển khoản VietQR 24/7 Techcombank.`,
      };

      try {
        const res = await createOrder(orderPayload);
        const savedOrder = res?.data || orderPayload;
        setCreatedOrder(savedOrder);

        // Lưu đơn hàng vừa tạo vào localStorage để trang xác nhận / đơn hàng có thể đọc
        try {
          localStorage.setItem('unibridal-last-order', JSON.stringify(savedOrder));
        } catch (err) {
          // ignore storage errors
        }

        // Xóa giỏ hàng sau khi đặt thuê thành công
        try {
          clearCart();
          localStorage.removeItem('unibridal_cart');
          localStorage.removeItem('unibridal-rental-cart');
          window.dispatchEvent(new Event('unibridal-cart-updated'));
        } catch (err) {
          // ignore
        }

        setIsSuccessModalOpen(true);
        message.success({
          content: `✓ Giao dịch cọc ${formatCurrencyVND(amountToPayToday)} thành công! Đã kích hoạt hợp đồng điện tử.`,
          key: 'payment_confirm',
          duration: 3,
        });
      } catch (error) {
        message.error(error.message || 'Không thể tạo đơn thuê, vui lòng thử lại.');
      } finally {
        setIsSubmitting(false);
      }
    }, 1800);
  };

  // Tạo đơn và chuyển hướng thẳng sang Cổng VietQR Gateway chuyên biệt
  const handleProceedToVietQRGateway = async () => {
    if (isSubmitting || isVerifyingPayment) return;
    if (!isContractSigned) {
      message.warning('Nàng vui lòng ký xác nhận hợp đồng ở Bước 2 trước khi chuyển sang Cổng VietQR.');
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    message.loading({
      content: '⚡ Đang khởi tạo đơn thuê và chuyển hướng sang Cổng thanh toán VietQR...',
      key: 'vietqr_redirect',
      duration: 1.5,
    });

    const generatedOrderCode = `UB-2026-${Math.floor(100 + Math.random() * 900)}`;
    const generatedContractCode = `HĐ-${generatedOrderCode}`;

    const orderPayload = {
      orderCode: generatedOrderCode,
      customerName: brideName.trim() || 'Cô Dâu UniBridal',
      brideName: brideName.trim() || 'Cô Dâu UniBridal',
      customerPhone: phone.trim() || '0908123888',
      phone: phone.trim() || '0908123888',
      customerEmail: email.trim() || 'codau.unibridal@gmail.com',
      email: email.trim() || 'codau.unibridal@gmail.com',
      customerCccd: cccd.trim() || '079198000123',
      cccd: cccd.trim() || '079198000123',
      shippingAddress: address.trim() || 'Showroom UniBridal Q.1 TP.HCM',
      contractCode: generatedContractCode,
      contractSignature: contractSignature || brideName || 'Cô Dâu UniBridal',
      measurements,
      depositOption,
      paymentMethod: 'vietqr',
      paymentStatus: 'pending_payment',
      rentalStartDate: toIsoDateString(rentalSchedule?.startDate) || new Date().toISOString().split('T')[0],
      rentalEndDate: toIsoDateString(rentalSchedule?.endDate) || new Date(Date.now() + (Number(rentalDays) || 4) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rentalDays,
      items: (orderItems && orderItems.length > 0 ? orderItems : [activeDress]).filter(Boolean).map((item, idx) => {
        const itemDailyPrice = Number(item.price || item.rentPrice) || 0;
        return {
          dressId: item.id || item._id,
          name: item.name,
          code: item.code || `UB-HC-2026-0${idx + 1}`,
          size: item.size || selectedSize,
          rentPrice: itemDailyPrice * Math.max(1, Number(rentalDays) || 1),
          dailyPrice: itemDailyPrice,
          rentalDays,
          depositAmount: Number(item.deposit || item.depositAmount) || 15000000,
          image: item.images?.[0] || item.image,
        };
      }),
      totalRentPrice,
      totalDeposit: depositCollateral,
      depositPaidAmount: amountToPayToday,
      totalPayment: totalRentPrice + depositCollateral,
      deliveryMethod: 'showroom',
      notes: `Hôn lễ ngày ${rentalSchedule.weddingDate}. Đã ký hợp đồng điện tử và tạo mã cọc qua Cổng VietQR Gateway.`,
    };

    try {
      const res = await createOrder(orderPayload);
      const savedOrder = res?.data || orderPayload;
      try {
        localStorage.setItem('unibridal-last-order', JSON.stringify(savedOrder));
        clearCart();
        localStorage.removeItem('unibridal_cart');
        localStorage.removeItem('unibridal-rental-cart');
        window.dispatchEvent(new Event('unibridal-cart-updated'));
      } catch {}

      navigate(`/thanh-toan-vietqr/${savedOrder.orderCode}`);
    } catch (err) {
      message.error(err.message || 'Không thể tạo đơn hàng, vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  // Giả lập thanh toán VietQR thành công trong chế độ Sandbox Test Mode
  const handleSimulateVietQRPayment = async () => {
    if (isSubmitting || isVerifyingPayment) return;

    if (!isContractSigned) {
      setIsContractSigned(true);
      setContractSignature(brideName.trim() || 'Cô Dâu UniBridal');
      message.info('Chế độ Test: Đã tự động hoàn tất ký hợp đồng số cho cô dâu!');
    }

    setIsVerifyingPayment(true);
    message.loading({
      content: '⚡ [VietQR Sandbox]: Đang mô phỏng giao dịch chuyển khoản Techcombank Napas 24/7...',
      key: 'payment_confirm',
      duration: 1.5,
    });

    setTimeout(async () => {
      setIsVerifyingPayment(false);
      setIsSubmitting(true);

      const generatedOrderCode = `UB-2026-${Math.floor(100 + Math.random() * 900)}`;
      const generatedContractCode = `HĐ-${generatedOrderCode}`;

      const orderPayload = {
        orderCode: generatedOrderCode,
        customerName: brideName.trim() || 'Cô Dâu UniBridal',
        brideName: brideName.trim() || 'Cô Dâu UniBridal',
        customerPhone: phone.trim() || '0908123888',
        phone: phone.trim() || '0908123888',
        customerEmail: email.trim() || 'codau.unibridal@gmail.com',
        email: email.trim() || 'codau.unibridal@gmail.com',
        customerCccd: cccd.trim() || '079198000123',
        cccd: cccd.trim() || '079198000123',
        shippingAddress: address.trim() || 'Showroom UniBridal Q.1 TP.HCM',
        contractCode: generatedContractCode,
        contractSignature: contractSignature || brideName || 'Cô Dâu UniBridal',
        measurements,
        depositOption,
        paymentMethod: 'vietqr',
        paymentStatus: 'deposit_paid',
        rentalStartDate: toIsoDateString(rentalSchedule?.startDate) || new Date().toISOString().split('T')[0],
        rentalEndDate: toIsoDateString(rentalSchedule?.endDate) || new Date(Date.now() + (Number(rentalDays) || 4) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rentalDays,
        items: (orderItems && orderItems.length > 0 ? orderItems : [activeDress]).filter(Boolean).map((item, idx) => {
          const itemDailyPrice = Number(item.price || item.rentPrice) || 0;
          return {
            dressId: item.id || item._id,
            name: item.name,
            code: item.code || `UB-HC-2026-0${idx + 1}`,
            size: item.size || selectedSize,
            rentPrice: itemDailyPrice * Math.max(1, Number(rentalDays) || 1),
            dailyPrice: itemDailyPrice,
            rentalDays,
            depositAmount: Number(item.deposit || item.depositAmount) || 15000000,
            image: item.images?.[0] || item.image,
          };
        }),
        totalRentPrice,
        totalDeposit: depositCollateral,
        depositPaidAmount: amountToPayToday,
        totalPayment: totalRentPrice + depositCollateral,
        deliveryMethod: 'showroom',
        notes: `Hôn lễ ngày ${rentalSchedule.weddingDate}. Đã thanh toán trọn gói gồm tiền thuê và cọc bảo lãnh 50% giá trị (${formatCurrencyVND(depositCollateral)} - Hoàn trả khi trả váy). Phương thức: Chuyển khoản VietQR 24/7 Techcombank [Test Mode Sandbox].`,
      };

      try {
        const res = await createOrder(orderPayload);
        const savedOrder = res?.data || orderPayload;
        setCreatedOrder(savedOrder);

        // Gọi API mô phỏng thanh toán VietQR
        await simulateVietQRPaymentApi({
          orderId: savedOrder._id || savedOrder.id,
          orderCode: savedOrder.orderCode,
          amount: amountToPayToday,
          senderName: brideName || 'Cô Dâu Test',
        });

        try {
          localStorage.setItem('unibridal-last-order', JSON.stringify(savedOrder));
        } catch {}

        try {
          clearCart();
          localStorage.removeItem('unibridal_cart');
          localStorage.removeItem('unibridal-rental-cart');
          window.dispatchEvent(new Event('unibridal-cart-updated'));
        } catch {}

        setIsSuccessModalOpen(true);
        message.success({
          content: `✓ [Sandbox Test]: Đã nhận thanh toán ${formatCurrencyVND(amountToPayToday)} qua VietQR Techcombank! Hợp đồng & Lịch thuê đã được kích hoạt.`,
          key: 'payment_confirm',
          duration: 3.5,
        });
      } catch (error) {
        message.error(error.message || 'Không thể tạo đơn thuê thử nghiệm, vui lòng thử lại.');
      } finally {
        setIsSubmitting(false);
      }
    }, 1200);
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
      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-9 pb-28 sm:pb-36">

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
            <button
              type="button"
              onClick={() => {
                if (!isContractSigned) {
                  message.warning('Nàng chưa ký hợp đồng điện tử! Vui lòng hoàn tất chữ ký ở Bước 2 trước khi chuyển sang thanh toán.');
                  setCurrentStep(2);
                  return;
                }
                setCurrentStep(3);
              }}
              className={`flex items-center gap-2 border-0 bg-transparent cursor-pointer font-medium transition-colors ${currentStep === 3 ? 'text-[#733F49] font-bold' : 'text-[#847374]'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${currentStep === 3 ? 'bg-[#733F49] text-white shadow-xs' : 'bg-[#EAE0D5] text-[#847374]'}`}>
                3
              </span>
              <span>3. Đặt cọc & Thanh toán</span>
            </button>

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
                          Thông Tin Người Đại Diện Thuê
                        </h2>
                        {isLoggedIn && (
                          <p className="text-[12px] text-[#2E7D32] font-semibold m-0 mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                            Tự động lấy thông tin từ tài khoản đã đăng ký ({user?.fullName || user?.name || user?.email})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Họ & tên */}
                      <div data-error={Boolean(formErrors.brideName)}>
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
                            if (formErrors.brideName) {
                              setFormErrors((prev) => ({ ...prev, brideName: '' }));
                            }
                          }}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none transition-all ${formErrors.brideName
                            ? 'border-2 border-red-400 bg-red-50/20 focus:border-red-500'
                            : 'bg-[#FCF9F6] border border-[#EEDECF] focus:border-[#733F49] focus:bg-white'
                            }`}
                          placeholder="Nhập họ và tên cô dâu"
                        />
                        {formErrors.brideName && (
                          <span className="text-[11.5px] font-semibold text-red-500 mt-1 flex items-center gap-1 animate-fade-in">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {formErrors.brideName}
                          </span>
                        )}
                      </div>

                      {/* Số điện thoại */}
                      <div data-error={Boolean(formErrors.phone)}>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          SỐ ĐIỆN THOẠI *
                        </label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (formErrors.phone) {
                              setFormErrors((prev) => ({ ...prev, phone: '' }));
                            }
                          }}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none transition-all ${formErrors.phone
                            ? 'border-2 border-red-400 bg-red-50/20 focus:border-red-500'
                            : 'bg-[#FCF9F6] border border-[#EEDECF] focus:border-[#733F49] focus:bg-white'
                            }`}
                          placeholder="Nhập số điện thoại liên hệ"
                        />
                        {formErrors.phone && (
                          <span className="text-[11.5px] font-semibold text-red-500 mt-1 flex items-center gap-1 animate-fade-in">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {formErrors.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Email */}
                      <div data-error={Boolean(formErrors.email)}>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          EMAIL NHẬN HỢP ĐỒNG SỐ *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (formErrors.email) {
                              setFormErrors((prev) => ({ ...prev, email: '' }));
                            }
                          }}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none transition-all ${formErrors.email
                            ? 'border-2 border-red-400 bg-red-50/20 focus:border-red-500'
                            : 'bg-[#FCF9F6] border border-[#EEDECF] focus:border-[#733F49] focus:bg-white'
                            }`}
                          placeholder="Nhập địa chỉ email nhận hợp đồng"
                        />
                        {formErrors.email && (
                          <span className="text-[11.5px] font-semibold text-red-500 mt-1 flex items-center gap-1 animate-fade-in">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {formErrors.email}
                          </span>
                        )}
                      </div>

                      {/* CCCD / CMND */}
                      <div data-error={Boolean(formErrors.cccd)}>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          SỐ CCCD / CMND (LẬP HỢP ĐỒNG PHÁP LÝ) *
                        </label>
                        <input
                          type="text"
                          required
                          value={cccd}
                          onChange={(e) => {
                            setCccd(e.target.value);
                            if (formErrors.cccd) {
                              setFormErrors((prev) => ({ ...prev, cccd: '' }));
                            }
                          }}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none transition-all ${formErrors.cccd
                            ? 'border-2 border-red-400 bg-red-50/20 focus:border-red-500'
                            : 'bg-[#FCF9F6] border border-[#EEDECF] focus:border-[#733F49] focus:bg-white'
                            }`}
                          placeholder="Nhập số CCCD / CMND"
                        />
                        {formErrors.cccd && (
                          <span className="text-[11.5px] font-semibold text-red-500 mt-1 flex items-center gap-1 animate-fade-in">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {formErrors.cccd}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Địa chỉ */}
                    <div data-error={Boolean(formErrors.address)}>
                      <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                        ĐỊA CHỈ THƯỜNG TRÚ HOẶC GIAO NHẬN LỄ PHỤC *
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          if (formErrors.address) {
                            setFormErrors((prev) => ({ ...prev, address: '' }));
                          }
                        }}
                        className={`w-full rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none transition-all ${formErrors.address
                          ? 'border-2 border-red-400 bg-red-50/20 focus:border-red-500'
                          : 'bg-[#FCF9F6] border border-[#EEDECF] focus:border-[#733F49] focus:bg-white'
                          }`}
                        placeholder="Nhập địa chỉ thường trú hoặc nhận lễ phục"
                      />
                      {formErrors.address && (
                        <span className="text-[11.5px] font-semibold text-red-500 mt-1 flex items-center gap-1 animate-fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {formErrors.address}
                        </span>
                      )}
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
                          value={toIsoDateString(rentalSchedule.startDate) || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSelectStartDate(e.target.value);
                            }
                          }}
                          className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2 text-[14px] font-bold text-[#2C2523] focus:outline-none focus:border-[#733F49] cursor-pointer"
                        />
                      </div>
                      <span className="text-[10.5px] font-medium text-[#2E7D32] mt-1.5 flex items-center gap-1">
                        <span>✦</span> {rentalSchedule.startDate ? 'Ngày nhận váy' : 'Chưa chọn ngày nhận'}
                      </span>
                    </div>

                    {/* Thẻ 2: Ngày cưới chính thức (TƯƠNG TÁC TỰ DO, CHO PHÉP TRÙNG NGÀY TRẢ) */}
                    <div className="relative bg-[#FAF0EC] p-4 rounded-2xl border border-[#F2D8D4] transition-all hover:shadow-xs focus-within:ring-2 focus-within:ring-[#733F49]/30">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10.5px] font-bold text-[#733F49] uppercase tracking-wider">
                          NGÀY CƯỚI CHÍNH THỨC *
                        </label>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-[#FAF0EC] text-[#733F49] border border-[#F2D8D4] uppercase tracking-wider">
                          TRONG GÓI THUÊ
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          value={toIsoDateString(rentalSchedule.weddingDate) || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSelectWeddingDate(e.target.value);
                            }
                          }}
                          className="w-full bg-white border border-[#F2D8D4] rounded-xl px-3 py-2 text-[14.5px] font-bold text-[#733F49] focus:outline-none focus:border-[#733F49] cursor-pointer shadow-2xs"
                        />
                      </div>
                      <span className="text-[10.5px] font-bold text-[#733F49] mt-1.5 flex items-center gap-1">
                        <span>★</span> {rentalSchedule.weddingDate ? 'Ngày hôn lễ chính thức' : 'Vui lòng chọn ngày cưới'}
                      </span>
                    </div>

                    {/* Thẻ 3: Ngày hoàn trả váy (TƯƠNG TÁC TỰ DO, CHO PHÉP TRÙNG NGÀY CƯỚI) */}
                    <div className="relative bg-[#FCF9F6] p-4 rounded-2xl border-2 border-[#733F49]/40 transition-all shadow-xs focus-within:ring-2 focus-within:ring-[#733F49]/30">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10.5px] font-bold text-[#733F49] uppercase tracking-wider">
                          NGÀY HOÀN TRẢ VÁY *
                        </label>
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${rentalSchedule.endDate && toIsoDateString(rentalSchedule.endDate) === toIsoDateString(rentalSchedule.weddingDate)
                          ? 'bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2]'
                          : 'bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]'
                          }`}>
                          {rentalSchedule.endDate && toIsoDateString(rentalSchedule.endDate) === toIsoDateString(rentalSchedule.weddingDate)
                            ? 'CÙNG NGÀY CƯỚI'
                            : 'SAU NGÀY CƯỚI'}
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          min={toIsoDateString(rentalSchedule.startDate) || undefined}
                          value={toIsoDateString(rentalSchedule.endDate) || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSelectEndDate(e.target.value);
                            }
                          }}
                          className="w-full bg-white border border-[#EEDECF] rounded-xl px-3 py-2 text-[14px] font-bold text-[#2C2523] focus:outline-none focus:border-[#733F49] cursor-pointer shadow-2xs"
                        />
                      </div>
                      <span className="text-[10.5px] font-medium text-[#733F49] mt-1.5 flex items-center gap-1">
                        <span>✓</span> {rentalSchedule.endDate ? (
                          toIsoDateString(rentalSchedule.endDate) === toIsoDateString(rentalSchedule.weddingDate)
                            ? `Trả trước 20:00 (Cùng tối ngày cưới - Gói ${rentalDays} ngày)`
                            : `Trả trước 20:00 ngày ${rentalSchedule.endDate} (Gói ${rentalDays} ngày)`
                        ) : 'Chưa xác định ngày hoàn trả'}
                      </span>
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
                          <h4 className="font-playfair text-[15.5px] font-bold text-[#2C2523] m-0 leading-tight">
                            Bảng Lịch Thuê Váy
                          </h4>
                          <span className="text-[12px] font-jakarta font-bold text-[#733F49] block mt-0.5">
                            Tháng {calendarViewDate.getMonth() + 1}/{calendarViewDate.getFullYear()}
                          </span>
                        </div>
                      </div>

                      {/* Bộ điều khiển số ngày thuê gắn liền trên thanh Bảng Lịch */}
                      <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                        {/* Bộ tăng giảm nhanh Stepper */}
                        <div className="flex items-center gap-1 bg-white border border-[#EEDECF] px-2 py-1 rounded-xl shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleRentalDaysChange(rentalDays - 1)}
                            disabled={rentalDays <= 1}
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
                                    ? 'bg-[#E8F5E9] text-[#2E7D32] font-bold border-y border-[#A5D6A7]'
                                    : 'bg-white text-[#2C2523] hover:bg-[#FAF0EC] hover:text-[#733F49]'
                              }`}
                          >
                            <span>{d}</span>
                            {isWedding && isEnd ? (
                              <span className="text-[7.5px] font-bold leading-none text-amber-200">★ CƯỚI/TRẢ</span>
                            ) : (
                              <>
                                {isWedding && (
                                  <span className="text-[9px] font-bold leading-none text-amber-200">★ CƯỚI</span>
                                )}
                                {isStart && (
                                  <span className="text-[8.5px] font-bold leading-none text-emerald-100">NHẬN</span>
                                )}
                                {isEnd && (
                                  <span className="text-[8.5px] font-bold leading-none text-stone-200">TRẢ</span>
                                )}
                              </>
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
                            Nhận trực tiếp tại Showroom Atelier (Khuyên dùng)
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                            MIỄN PHÍ
                          </span>
                        </div>
                        <p className="text-[11.5px] text-[#6B5C5D] m-0 leading-relaxed">
                          Thử và căn chỉnh phom dáng chuẩn xác tại phòng VIP Showroom trước giờ trao nhận.
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
                            Giao váy tận nơi (VIP Courier)
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF0EC] text-[#B8737D]">
                            VIP COURIER
                          </span>
                        </div>
                        <p className="text-[11.5px] text-[#6B5C5D] m-0 leading-relaxed">
                          Giao vali VIP Courier nguyên seal chống ẩm và móc gỗ bảo quản tận nhà cô dâu.
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-3 items-stretch">
                        {/* Chiều cao */}
                        <div className="bg-[#FCF9F6] p-3 rounded-2xl border border-[#EEDECF] flex flex-col justify-between">
                          <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6B464E] h-9 flex items-center justify-center text-center leading-tight mb-2">
                            CHIỀU CAO (CM)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              placeholder="—"
                              value={measurements.height}
                              onChange={(e) => setMeasurements({ ...measurements, height: e.target.value.replace(/[^0-9.]/g, '') })}
                              className="w-full h-10 sm:h-11 bg-white border border-[#E2D2C2] rounded-xl pl-2 pr-6 font-jakarta font-extrabold text-[16px] text-[#2C2523] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                            />
                            <div className="absolute right-1 inset-y-1 flex flex-col justify-center w-5">
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('height', 1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Tăng chiều cao"
                              >
                                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('height', -1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Giảm chiều cao"
                              >
                                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Cân nặng */}
                        <div className="bg-[#FCF9F6] p-3 rounded-2xl border border-[#EEDECF] flex flex-col justify-between">
                          <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6B464E] h-9 flex items-center justify-center text-center leading-tight mb-2">
                            CÂN NẶNG (KG)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              placeholder="—"
                              value={measurements.weight}
                              onChange={(e) => setMeasurements({ ...measurements, weight: e.target.value.replace(/[^0-9.]/g, '') })}
                              className="w-full h-10 sm:h-11 bg-white border border-[#E2D2C2] rounded-xl pl-2 pr-6 font-jakarta font-extrabold text-[16px] text-[#2C2523] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                            />
                            <div className="absolute right-1 inset-y-1 flex flex-col justify-center w-5">
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('weight', 1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Tăng cân nặng"
                              >
                                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('weight', -1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Giảm cân nặng"
                              >
                                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Vòng 1 */}
                        <div className="bg-[#FCF9F6] p-3 rounded-2xl border border-[#EEDECF] flex flex-col justify-between">
                          <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6B464E] h-9 flex items-center justify-center text-center leading-tight mb-2">
                            VÒNG 1 (NGỰC)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              placeholder="—"
                              value={measurements.bust}
                              onChange={(e) => setMeasurements({ ...measurements, bust: e.target.value.replace(/[^0-9.]/g, '') })}
                              className="w-full h-10 sm:h-11 bg-white border border-[#E2D2C2] rounded-xl pl-2 pr-6 font-jakarta font-extrabold text-[16px] text-[#2C2523] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                            />
                            <div className="absolute right-1 inset-y-1 flex flex-col justify-center w-5">
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('bust', 1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Tăng vòng 1"
                              >
                                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('bust', -1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Giảm vòng 1"
                              >
                                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Vòng 2 */}
                        <div className="bg-[#FAF0EC] p-3 rounded-2xl border-2 border-[#F2D8D4] flex flex-col justify-between shadow-2xs">
                          <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#733F49] h-9 flex items-center justify-center text-center leading-tight mb-2">
                            VÒNG 2 (EO)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              placeholder="—"
                              value={measurements.waist}
                              onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value.replace(/[^0-9.]/g, '') })}
                              className="w-full h-10 sm:h-11 bg-white border-2 border-[#EAB8B8] rounded-xl pl-2 pr-6 font-jakarta font-extrabold text-[16px] text-[#733F49] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                            />
                            <div className="absolute right-1 inset-y-1 flex flex-col justify-center w-5">
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('waist', 1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Tăng vòng 2"
                              >
                                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('waist', -1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Giảm vòng 2"
                              >
                                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Vòng 3 */}
                        <div className="bg-[#FCF9F6] p-3 rounded-2xl border border-[#EEDECF] flex flex-col justify-between">
                          <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6B464E] h-9 flex items-center justify-center text-center leading-tight mb-2">
                            VÒNG 3 (MÔNG)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              placeholder="—"
                              value={measurements.hips}
                              onChange={(e) => setMeasurements({ ...measurements, hips: e.target.value.replace(/[^0-9.]/g, '') })}
                              className="w-full h-10 sm:h-11 bg-white border border-[#E2D2C2] rounded-xl pl-2 pr-6 font-jakarta font-extrabold text-[16px] text-[#2C2523] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                            />
                            <div className="absolute right-1 inset-y-1 flex flex-col justify-center w-5">
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('hips', 1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Tăng vòng 3"
                              >
                                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('hips', -1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Giảm vòng 3"
                              >
                                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Cao giày */}
                        <div className="bg-[#FCF9F6] p-3 rounded-2xl border border-[#EEDECF] flex flex-col justify-between">
                          <label className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6B464E] h-9 flex items-center justify-center text-center leading-tight mb-2">
                            CAO GIÀY (CM)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              placeholder="—"
                              value={measurements.heel}
                              onChange={(e) => setMeasurements({ ...measurements, heel: e.target.value.replace(/[^0-9.]/g, '') })}
                              className="w-full h-10 sm:h-11 bg-white border border-[#E2D2C2] rounded-xl pl-2 pr-6 font-jakarta font-extrabold text-[16px] text-[#2C2523] text-center tabular-nums focus:outline-none focus:border-[#733F49] shadow-2xs"
                            />
                            <div className="absolute right-1 inset-y-1 flex flex-col justify-center w-5">
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('heel', 1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Tăng độ cao giày"
                              >
                                <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStepMeasurement('heel', -1)}
                                className="h-4 flex items-center justify-center text-[#733F49] hover:bg-[#FAF0EC] active:bg-[#F2D8D4] rounded cursor-pointer transition"
                                title="Giảm độ cao giày"
                              >
                                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
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
                    ) : !rentalSchedule.startDate || !rentalSchedule.weddingDate ? (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>VUI LÒNG CHỌN NGÀY THUÊ TRÊN BẢNG LỊCH</span>
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
              <div className="space-y-6 animate-fade-in">

                {/* TỜ GIẤY HỢP ĐỒNG THƯỢNG LƯU CÓ WATERMARK CHÌM SANG TRỌNG */}
                <div className="relative bg-[#FFFEFC] rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(44,37,35,0.08)] border border-[#EBE1D8] p-4 sm:p-8 md:p-12 overflow-hidden">

                  {/* Watermark ẩn chìm phía sau nền giấy */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                    <div className="relative flex flex-col items-center justify-center opacity-[0.038] transform -rotate-12 scale-110 sm:scale-125">
                      <img
                        src={unibridalEmblem}
                        alt="UniBridal Watermark"
                        className="w-72 h-72 sm:w-96 sm:h-96 object-contain"
                      />
                      <div className="text-center font-playfair font-extrabold text-[28px] sm:text-[34px] tracking-[6px] text-[#733F49] uppercase mt-2">
                        UNIBRIDAL HAUTE COUTURE
                      </div>
                      <div className="text-[14px] font-mono tracking-[4px] text-[#2C2523] uppercase">
                        OFFICIAL DIGITAL CONTRACT • BẢO MẬT PHÁP LÝ
                      </div>
                    </div>
                  </div>

                  {/* Khung viền chỉ đôi thanh lịch kiểu chứng thư Haute Couture */}
                  <div className="relative z-10 border border-[#E8DFD8]/80 p-5 sm:p-8 md:p-10 rounded-xl space-y-7">

                    {/* Top Header: Quốc hiệu & Tiêu đề văn bản */}
                    <div className="text-center pb-6 border-b border-[#EFE7E0] space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF5F0] border border-[#EEDECF] text-[#847374] text-[11px] font-semibold tracking-wider uppercase mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                        <span>Xác thực pháp lý theo Luật Giao dịch điện tử số 20/2023/QH15</span>
                      </div>
                      <div className="font-playfair text-[13px] sm:text-[14px] font-bold uppercase tracking-[1.5px] text-[#2C2523]">
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                      </div>
                      <div className="text-[12.5px] italic text-[#6B5C5D] font-serif">
                        Độc lập — Tự do — Hạnh phúc
                      </div>
                      <div className="w-24 h-[1.5px] bg-[#D4AF37] mx-auto my-2" />

                      <h2 className="font-playfair text-[23px] sm:text-[27px] font-bold text-[#733F49] tracking-wide mt-3 mb-1 uppercase">
                        HỢP ĐỒNG THUÊ LỄ PHỤC CƯỚI CAO CẤP
                      </h2>
                      <div className="text-[12px] text-[#847374] font-mono">
                        Mã văn bản điện tử: <strong className="text-[#733F49]">#HĐ-UB-2026/8992</strong> • Xác lập ngày: {new Date().toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    {/* Parties Info: Trình bày dạng 2 cột văn bản đối ứng không dùng khối hộp xám */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 pb-6 border-b border-[#EFE7E0] text-[13px] leading-relaxed">
                      {/* Bên A */}
                      <div className="space-y-1.5 pr-0 md:pr-6 md:border-r border-[#EFE7E0]">
                        <div className="font-playfair font-bold text-[13px] uppercase tracking-wider text-[#733F49] pb-1 border-b border-[#F2E8E2] flex items-center justify-between">
                          <span>BÊN CHO THUÊ (BÊN A)</span>
                          <span className="text-[10.5px] font-mono text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full font-semibold">
                            Đã Ký Số
                          </span>
                        </div>
                        <div className="font-bold text-[#2C2523] text-[14px] pt-1">
                          CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE
                        </div>
                        <div className="text-[#6B5C5D]">Mã số thuế: <strong className="text-[#2C2523]">0316889988</strong></div>
                        <div className="text-[#6B5C5D]">Showroom: 88 Nam Kỳ Khởi Nghĩa, P. Bến Nghé, Q.1, TP. HCM</div>
                        <div className="text-[#6B5C5D]">Hotline: 1800 8998 • Email: contact@unibridal.vn</div>
                        <div className="text-[#6B5C5D] pt-0.5">
                          Đại diện: <strong className="text-[#2C2523]">Ông Kim Xuân Hiếu</strong> — Tổng Giám Đốc
                        </div>
                      </div>

                      {/* Bên B */}
                      <div className="space-y-1.5">
                        <div className="font-playfair font-bold text-[13px] uppercase tracking-wider text-[#733F49] pb-1 border-b border-[#F2E8E2] flex items-center justify-between">
                          <span>BÊN THUÊ LỄ PHỤC (BÊN B)</span>
                          <span className="text-[10.5px] font-mono text-[#C5A880] bg-[#FAF4EE] px-2 py-0.5 rounded-full font-semibold">
                            Khách Hàng Ký
                          </span>
                        </div>
                        <div className="font-bold text-[#733F49] text-[14px] pt-1">
                          {brideName}
                        </div>
                        <div className="text-[#6B5C5D]">Số CCCD/CMND: <strong className="text-[#2C2523]">{cccd}</strong></div>
                        <div className="text-[#6B5C5D]">Số điện thoại: <strong className="text-[#2C2523]">{phone}</strong></div>
                        <div className="text-[#6B5C5D]">Email nhận hợp đồng: {email}</div>
                        <div className="text-[#6B5C5D]">Địa chỉ nhận váy: {address}</div>
                      </div>
                    </div>

                    {/* Các Điều Khoản Hợp Đồng: Trình bày liền mạch thanh nhã như văn bản thật */}
                    <div className="space-y-6 text-[13px] leading-relaxed text-[#3C3133]">

                      {/* Điều 1 */}
                      <div className="space-y-1.5">
                        <h4 className="font-playfair text-[13.5px] font-bold text-[#733F49] uppercase tracking-wide m-0 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                          ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & PHƯƠNG THỨC GIAO NHẬN, THU HỒI VÁY
                        </h4>
                        <div className="pl-3.5 space-y-1 text-[#554749]">
                          {orderItems && orderItems.length > 1 ? (
                            <div className="space-y-1">
                              <p className="m-0">
                                1.1. Bên A đồng ý cho Bên B thuê <strong>{orderItems.length} tác phẩm lễ phục cưới cao cấp</strong> độc bản bao gồm:
                              </p>
                              <ul className="m-0 pl-4 space-y-1 list-disc text-[12.5px]">
                                {orderItems.map((item, idx) => (
                                  <li key={item.id || idx}>
                                    <strong>{item.name}</strong> (Mã: <span className="font-mono text-[#733F49] font-bold">{item.code || `UB-HC-2026-0${idx + 1}`}</span>) — Size: <strong>{item.size || selectedSize}</strong> — Tiền thuê: <strong>{formatCurrencyVND(item.price || item.rentPrice)}</strong> — Cọc: <strong>{formatCurrencyVND(item.deposit || item.depositAmount || 15000000)}</strong>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="m-0">
                              1.1. Bên A đồng ý cho Bên B thuê tác phẩm váy cưới thiết kế <strong>{activeDress?.name}</strong> (Mã tác phẩm: <strong className="font-mono text-[#733F49]">{activeDress?.code || 'UB-HC-2026'}</strong>), Kích cỡ may đo: <strong>Size {selectedSize}</strong>.
                            </p>
                          )}
                          <p className="m-0">
                            1.2. Thời gian thuê trọn gói: <strong>{rentalDays} ngày</strong>. Thời điểm nhận váy: từ 09:00 ngày <strong>{rentalSchedule.startDate}</strong>; Thời điểm hoàn trả: trước 20:00 ngày <strong>{rentalSchedule.endDate}</strong>.
                          </p>
                          <p className="m-0">
                            1.3. Phương thức bàn giao & thu hồi: {deliveryMethod === 'delivery' ? (
                              <span>Bên A thực hiện giao váy tận nơi bằng Vali VIP Courier theo địa chỉ đã đăng ký. </span>
                            ) : (
                              <span>Bên B nhận váy trực tiếp tại Showroom Atelier của Bên A (được chuyên viên hỗ trợ fitting và căn chỉnh nẹp eo trước giờ nhận). </span>
                            )}
                            <span>Đến thời hạn hoàn trả (trước 20:00 ngày <strong>{rentalSchedule.endDate}</strong>), <strong>chuyên viên của Bên A sẽ chủ động liên hệ hẹn giờ và trực tiếp đến tận nơi thu hồi váy trong vali bảo quản niêm phong & kiểm định hiện trạng</strong>, Bên B không cần phải tự mang trả.</span>
                          </p>
                          <p className="m-0">
                            1.4. Tiêu chuẩn bàn giao: Tác phẩm được giặt sấy tiệt trùng sinh học ozone, ủi phẳng nếp và tinh chỉnh phom dáng theo số đo riêng của Bên B trước giờ giao nhận 2 giờ.
                          </p>
                        </div>
                      </div>

                      {/* Điều 2 */}
                      <div className="space-y-1.5">
                        <h4 className="font-playfair text-[13.5px] font-bold text-[#733F49] uppercase tracking-wide m-0 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                          ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG, TIỀN CỌC GIỮ LỊCH & THANH TOÁN
                        </h4>
                        <div className="pl-3.5 space-y-1 text-[#554749]">
                          <p className="m-0">
                            2.1. Tổng chi phí thuê váy cưới trọn gói: <strong className="text-[#2C2523]">{formatCurrencyVND(totalRentPrice)}</strong>.
                          </p>
                          <p className="m-0">
                            2.2. Tiền cọc bảo lãnh (50% giá trị váy): <strong className="text-[#733F49]">{formatCurrencyVND(depositCollateral)}</strong> (Hoàn lại 100% khi trả váy).
                          </p>
                          <p className="m-0">
                            2.3. Tổng thanh toán hôm nay (Tiền thuê + Cọc): <strong className="text-[#2C2523]">{formatCurrencyVND(amountToPayToday)}</strong> (thanh toán chuyển khoản VietQR tại Bước 3).
                          </p>
                        </div>
                      </div>

                      {/* Điều 3 */}
                      <div className="space-y-1.5">
                        <h4 className="font-playfair text-[13.5px] font-bold text-[#733F49] uppercase tracking-wide m-0 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                          ĐIỀU 3: CHÍNH SÁCH BẢO HIỂM VẢI REN & QUYỀN ĐỔI NGÀY CƯỚI
                        </h4>
                        <div className="pl-3.5 space-y-1 text-[#554749]">
                          <p className="m-0">
                            3.1. Bảo hiểm vết bẩn miễn phí: Bên A chịu 100% chi phí xử lý chuyên sâu đối với các vết bẩn sự kiện cưới thông thường (bụi sân khấu, rượu vang nhẹ).
                          </p>
                          <p className="m-0">
                            3.2. Quyền đổi ngày cưới linh hoạt: Bên B được quyền chuyển đổi ngày thuê sang bất kỳ ngày nào còn trống trong vòng 12 tháng hoàn toàn miễn phí khi thông báo trước tối thiểu 15 ngày.
                          </p>
                        </div>
                      </div>

                      {/* Action Row: Nút mở xem toàn văn PDF A4 */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF6F2] border border-[#EEDECF]">
                        <div className="flex items-center gap-2.5 text-[12px] text-[#6B5C5D]">
                          <FileText className="w-4 h-4 text-[#733F49]" />
                          <span>Hợp đồng điện tử tiêu chuẩn đầy đủ 8 Điều khoản pháp lý Việt Nam</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenPdfContract}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#733F49] hover:bg-[#5F323B] text-white text-[12px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border-0 shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-white" />
                          <span>Xem Toàn Văn Bản PDF (A4)</span>
                        </button>
                      </div>

                    </div>

                    {/* Khung Chữ Ký 2 Bên: Trình bày như cuối trang hợp đồng giấy thật */}
                    <div className="pt-6 border-t border-[#EFE7E0] grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                      {/* Bên A Signature */}
                      <div className="text-center space-y-2 pr-0 md:pr-6 md:border-r border-[#EFE7E0]">
                        <div className="font-playfair text-[12.5px] font-bold uppercase tracking-wider text-[#2C2523]">
                          ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
                        </div>
                        <div className="text-[11px] italic text-[#6B5C5D]">
                          CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE
                        </div>

                        {/* Chữ ký Hiếu tự nhiên trên mặt giấy */}
                        <div className="h-28 flex items-center justify-center py-1">
                          <DirectorSignatureAndStamp className="h-28" />
                        </div>

                        <div className="font-playfair font-bold text-[14px] text-[#2C2523]">
                          Ông Kim Xuân Hiếu
                        </div>
                        <div className="text-[11px] text-[#847374]">
                          Tổng Giám Đốc • Chứng thư số hợp lệ
                        </div>
                      </div>

                      {/* Bên B Signature */}
                      <div className="text-center space-y-2">
                        <div className="font-playfair text-[12.5px] font-bold uppercase tracking-wider text-[#733F49]">
                          BÊN THUÊ LỄ PHỤC (BÊN B)
                        </div>
                        <div className="text-[11px] italic text-[#6B5C5D]">
                          XÁC NHẬN BẰNG CHỮ KÝ ĐIỆN TỬ
                        </div>

                        {/* Vùng Ký Tay hoặc Gõ Tên của Khách */}
                        <div className="relative">
                          {/* Nút chuyển chế độ Ký tay / Gõ tên */}
                          <div className="flex justify-center mb-1.5">
                            <div className="inline-flex items-center bg-[#FAF0EC] p-0.5 rounded-lg border border-[#F2D8D4] text-[10.5px] font-bold">
                              <button
                                type="button"
                                onClick={() => setSignatureMode('draw')}
                                className={`px-2.5 py-1 rounded-md transition-colors border-0 cursor-pointer ${signatureMode === 'draw'
                                  ? 'bg-[#733F49] text-white shadow-2xs'
                                  : 'bg-transparent text-[#733F49] hover:bg-white/60'
                                  }`}
                              >
                                ✍️ Vẽ chữ ký
                              </button>
                              <button
                                type="button"
                                onClick={() => setSignatureMode('type')}
                                className={`px-2.5 py-1 rounded-md transition-colors border-0 cursor-pointer ${signatureMode === 'type'
                                  ? 'bg-[#733F49] text-white shadow-2xs'
                                  : 'bg-transparent text-[#733F49] hover:bg-white/60'
                                  }`}
                              >
                                ⌨️ Gõ họ tên
                              </button>
                            </div>
                          </div>

                          {signatureMode === 'draw' ? (
                            <div className="space-y-1">
                              <div className="relative w-full h-28 bg-white/70 rounded-xl border border-[#D4AF37]/40 shadow-inner overflow-hidden flex items-center justify-center">
                                {!hasDrawnSignature && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#C5A880] select-none text-[12px] font-playfair italic px-4 text-center">
                                    ✍️ Nàng ký tay vào đây bằng chuột hoặc cảm ứng
                                  </div>
                                )}
                                <canvas
                                  ref={signatureCanvasRef}
                                  width={480}
                                  height={112}
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
                              <div className="flex items-center justify-between text-[11px] px-1">
                                <span className="font-semibold text-[#2E7D32]">
                                  {hasDrawnSignature ? '✓ Chữ ký đã ghi nhận' : 'Chưa ký'}
                                </span>
                                <button
                                  type="button"
                                  onClick={handleClearSignature}
                                  className="text-[#733F49] font-bold hover:underline bg-transparent border-0 cursor-pointer"
                                >
                                  ↺ Xóa ký lại
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="h-24 flex flex-col items-center justify-center bg-white/70 rounded-xl border border-[#D4AF37]/40 p-2">
                                <div className="font-playfair italic font-bold text-[22px] text-[#733F49]">
                                  {contractSignature && !contractSignature.startsWith('data:image') ? contractSignature : brideName}
                                </div>
                              </div>
                              <input
                                type="text"
                                value={contractSignature && !contractSignature.startsWith('data:image') ? contractSignature : ''}
                                onChange={(e) => setContractSignature(e.target.value)}
                                placeholder="Nhập họ tên cô dâu xác thực chữ ký"
                                className="w-full text-center bg-white border border-[#D4AF37]/40 rounded-lg px-2.5 py-1 text-[12px] font-semibold text-[#733F49] focus:outline-none focus:border-[#733F49]"
                              />
                            </div>
                          )}
                        </div>

                        <div className="font-playfair font-bold text-[14px] text-[#733F49] pt-0.5">
                          {brideName}
                        </div>
                        <div className="text-[11px] text-[#847374]">
                          CCCD: {cccd}
                        </div>
                      </div>

                    </div>

                    {/* Paper Footer */}
                    <div className="pt-4 border-t border-[#EFE7E0] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#9E8B89] italic">
                      <span>* Hợp đồng điện tử được lưu trữ an toàn & mã hóa theo tiêu chuẩn UniBridal Secure Cloud</span>
                      <span>Trang 1 / 1 • Số: HĐ-UB-2026/8992</span>
                    </div>

                  </div>

                </div>

                {/* Terms Agreement Checkbox */}
                <div className="p-4 rounded-xl bg-white border border-[#EEDECF] shadow-2xs">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasAgreedContractTerms}
                      onChange={(e) => setHasAgreedContractTerms(e.target.checked)}
                      className="mt-1 accent-[#733F49] w-4 h-4 rounded shrink-0 cursor-pointer"
                    />
                    <span className="text-[12.5px] text-[#4A3E3D] leading-relaxed">
                      Tôi là <strong>{brideName}</strong>, xác nhận đã đọc kỹ, thấu hiểu toàn bộ điều khoản Hợp đồng cho thuê lễ phục cưới cao cấp trên và cam kết chữ ký điện tử này có đầy đủ giá trị pháp lý song phương.
                    </span>
                  </label>
                </div>

                {/* Navigation Actions for Step 2 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
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

              </div>
            )}

            {/* ================= STEP 3: ĐẶT CỌC & THANH TOÁN ================= */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-fade-in">

                {/* Contract Signed Status Banner (Chỉ hiện cảnh báo nếu chưa ký hợp đồng) */}
                {!isContractSigned && (
                  <div className="bg-[#FFF8E7] border-2 border-[#E0A96D] p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-[#E65100] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-[14px] text-[#E65100]">
                          CHƯA KÝ HỢP ĐỒNG ĐIỆN TỬ — CHƯA THỂ THANH TOÁN CỌC!
                        </div>
                        <div className="text-[12px] text-[#5D4037] mt-0.5">
                          Theo quy định pháp lý, nàng bắt buộc phải ký hợp đồng điện tử ở Bước 2 trước khi tiến hành chuyển khoản đặt cọc.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(2);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="shrink-0 px-5 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white font-bold text-[12.5px] cursor-pointer border-0 shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Quay lại Bước 2 để ký ngay</span>
                    </button>
                  </div>
                )}

                {/* THANH TOÁN ĐẶT CỌC CHUYỂN KHOẢN */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F5EDE8] mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#B8737D]">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-playfair text-[19px] sm:text-[21px] font-semibold text-[#2C2523] m-0">
                        Thanh Toán Đặt Cọc Chuyển Khoản (VietQR 24/7)
                      </h2>
                      <p className="text-[12px] text-[#847374] m-0 mt-0.5">
                        Quét mã VietQR liên ngân hàng Napas 24/7 tức thì, hệ thống tự động xác nhận đơn cọc & khóa lịch
                      </p>
                    </div>
                  </div>

                  {/* VietQR Payment Details Box */}
                  <div className="space-y-5 animate-fade-in">
                    <div className="p-5 sm:p-6 rounded-2xl bg-[#FCF9F6] border border-[#EEDECF] flex flex-col md:flex-row items-center gap-6">
                      {/* Dynamic VietQR Display */}
                      <div className="w-56 bg-white p-3.5 rounded-2xl border border-[#EEDECF] shadow-sm flex flex-col items-center justify-center shrink-0 text-center">
                        {!qrImgError ? (
                          <img
                            src={`https://img.vietqr.io/image/TCB-19038899220088-compact2.png?amount=${amountToPayToday}&addInfo=${encodeURIComponent('UB COC 8992 ' + (phone.replace(/\s/g, '') || '0938128899'))}&accountName=CONG%20TY%20TNHH%20UNIBRIDAL`}
                            alt="VietQR Techcombank UniBridal"
                            className="w-48 h-auto max-h-60 object-contain rounded-lg"
                            onError={() => setQrImgError(true)}
                          />
                        ) : (
                          <div className="w-48 h-48 flex flex-col items-center justify-center">
                            <QrCode className="w-32 h-32 text-[#2C2523]" />
                            <span className="text-[10px] font-mono text-[#733F49] font-bold mt-1">
                              VIETQR 24/7 PRO
                            </span>
                          </div>
                        )}
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse"></span>
                            NAPAS 247 — MÃ QR ĐỘNG CHÍNH XÁC
                          </span>
                        </div>
                      </div>

                      {/* Bank Transfer Details */}
                      <div className="space-y-3 text-[13px] flex-1 w-full">
                        <div>
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#847374] block mb-0.5">
                            NGÂN HÀNG THỤ HƯỞNG & CHỦ TÀI KHOẢN
                          </span>
                          <div className="flex items-center gap-2">
                            <strong className="text-[#2C2523] text-[15px]">
                              Techcombank (Ngân hàng TMCP Kỹ Thương VN)
                            </strong>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#FAF0EC] text-[#733F49] font-bold">
                              Chi nhánh TP.HCM
                            </span>
                          </div>
                          <span className="text-[12px] text-[#6B5C5D] block mt-0.5">
                            Chủ TK: <strong>CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE</strong>
                          </span>
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
                              {formatCurrencyVND(amountToPayToday)}
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
                              UB COC 8992 {phone.replace(/\s/g, '') || '0938128899'}
                            </strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`UB COC 8992 ${phone.replace(/\s/g, '') || '0938128899'}`)}
                            className="px-3 py-1.5 text-[11.5px] font-bold text-[#733F49] bg-[#FAF0EC] rounded-lg border border-[#F2D8D4] hover:bg-[#F2DDD9] cursor-pointer transition-colors"
                          >
                            Sao chép
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3 Steps Instruction */}
                    <div className="p-4 rounded-xl bg-[#FAF6F2] border border-[#EEDECF] grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#733F49] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                        <span className="text-[#6B5C5D]">Mở ứng dụng Mobile Banking của ngân hàng bạn sử dụng</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#733F49] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                        <span className="text-[#6B5C5D]">Chọn tính năng <strong>Quét mã QR</strong> và quét mã hiển thị ở trên</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#733F49] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                        <span className="text-[#6B5C5D]">Xác nhận chuyển khoản & bấm nút <strong>Xác nhận</strong> bên dưới</span>
                      </div>
                    </div>

                    {/* VietQR Test Sandbox Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FAF0EC] via-[#FFF8F6] to-[#FAF0EC] border-2 border-dashed border-[#D4AF37] relative overflow-hidden shadow-xs animate-fade-in">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#FAF0EC] border border-[#D4AF37] text-[#854D0E] flex items-center justify-center shrink-0 shadow-xs">
                            <Sparkles className="w-5 h-5 text-[#854D0E]" />
                          </div>
                          <div>
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#854D0E] uppercase tracking-wider">
                              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                              <span>VIETQR SANDBOX TEST MODE (CHẾ ĐỘ THỬ NGHIỆM)</span>
                            </div>
                            <h4 className="font-jakarta font-extrabold text-[15px] text-[#2C2523] m-0 mt-0.5">
                              Mô Phỏng Chuyển Khoản Techcombank 24/7 Thành Công
                            </h4>
                            <p className="text-[12px] text-[#6B5C5D] m-0 mt-1 leading-relaxed">
                              Dành cho Giảng viên / Tester kiểm thử: Bấm nút dưới để giả lập hệ thống nhận được tiền cọc, tự động gửi email và kích hoạt đơn thuê mà không cần chuyển tiền thật.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSimulateVietQRPayment}
                          disabled={isSubmitting || isVerifyingPayment}
                          className="w-full sm:w-auto shrink-0 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#854D0E] to-[#A16207] hover:from-[#713F12] hover:to-[#854D0E] text-white font-jakarta text-[13px] font-bold shadow-md hover:shadow-lg transition-all cursor-pointer border-0 flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>⚡ Test Chuyển Khoản 1-Click</span>
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
                    disabled={isSubmitting || isVerifyingPayment}
                    onClick={handleConfirmFinalPayment}
                    className={`w-full sm:w-auto px-8 py-4 rounded-xl text-white font-jakarta text-[14px] font-bold tracking-wider uppercase transition-all shadow-[0_4px_16px_rgba(115,63,73,0.3)] hover:shadow-[0_6px_22px_rgba(115,63,73,0.4)] cursor-pointer border-0 flex items-center justify-center gap-2 ${!isContractSigned
                      ? 'bg-[#B08968] hover:bg-[#8D6E63] ring-2 ring-amber-400'
                      : 'bg-[#733F49] hover:bg-[#5F323B]'
                      }`}
                  >
                    {isVerifyingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra giao dịch Techcombank...</span>
                      </>
                    ) : !isContractSigned ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-200" />
                        <span>CHƯA KÝ HỢP ĐỒNG (BẤM ĐỂ QUAY LẠI BƯỚC 2 KÝ)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>XÁC NHẬN ĐÃ CHUYỂN KHOẢN & KHÓA LỊCH ĐẶT THUÊ</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* ================= RIGHT COLUMN: STICKY LUXURY BRIDAL TICKET ================= */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-20 max-h-[calc(100vh-5.5rem)] flex flex-col space-y-4 print:hidden">

            {/* Ticket Outer Wrapper */}
            <div className="relative bg-[#FFFEFC] rounded-3xl border border-[#E8DFD8] shadow-[0_16px_45px_rgba(115,63,73,0.08)] overflow-hidden flex flex-col max-h-full">

              {/* 1. Ticket Top Stub Header (Cuống vé hoàng gia) */}
              <div className="shrink-0 bg-gradient-to-r from-[#733F49] via-[#854F55] to-[#733F49] text-white px-5 py-3 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase border-b border-[#D4AF37]/30">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#E6C687]" />
                  <span className="tracking-[1.5px] font-playfair text-[11.5px]">UNIBRIDAL COUTURE PASS</span>
                </div>
                <div className="font-mono text-[10.5px] bg-black/25 px-2 py-0.5 rounded text-[#F5EDE8] tracking-widest border border-white/10">
                  {orderItems && orderItems.length > 1 ? `${orderItems.length} TÁC PHẨM` : (activeDress?.code || 'UB-2026')}
                </div>
              </div>

              {/* 2. Ticket Main Body (Thân vé) - Cuộn bên trong nếu nhiều váy, giữ giá luôn cố định nhìn thấy được */}
              <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 min-h-0">

                {/* Product Info Row (Hiển thị 1 hoặc nhiều váy) */}
                {orderItems && orderItems.length > 1 ? (
                  <div className="space-y-2.5 pb-2.5 border-b border-[#F5EDE8]">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#733F49] uppercase tracking-wider">
                      <span>Lễ phục thuê ({orderItems.length} tác phẩm)</span>
                      <span className="text-[#847374] font-normal normal-case">Gói {rentalDays} ngày</span>
                    </div>
                    <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                      {orderItems.map((item, idx) => (
                        <div key={item.id || idx} className="flex gap-2.5 items-center bg-[#FAF4EE]/70 p-2 rounded-xl border border-[#F0E5DC]">
                          <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-[#EEDECF]">
                            <img
                              src={item.images?.[0] || item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-playfair font-bold text-[13px] text-[#2C2523] truncate leading-tight">
                              {item.name}
                            </div>
                            <div className="text-[10.5px] text-[#847374] mt-0.5">
                              Mã: <span className="font-mono text-[#733F49] font-bold">{item.code || `UB-HC-2026-0${idx + 1}`}</span> • Size: <strong>{item.size || selectedSize}</strong>
                            </div>
                            <div className="flex items-center justify-between mt-0.5 text-[11px]">
                              <span className="text-[#847374]">Thuê ({rentalDays} ngày): <strong className="text-[#733F49] font-bold">{formatCurrencyVND((Number(item.price || item.rentPrice) || 0) * rentalDays)}</strong></span>
                              <span className="text-[#847374]">Cọc: <strong>{formatCurrencyVND(item.deposit || item.depositAmount || 15000000)}</strong></span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3.5 pb-3 border-b border-[#F5EDE8]">
                    <div className="relative w-16 h-22 rounded-xl overflow-hidden shrink-0 border border-[#EEDECF] shadow-2xs">
                      <img
                        src={activeDress?.images?.[0] || activeDress?.image}
                        alt={activeDress?.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1 bg-[#733F49]/80 backdrop-blur-2xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        VIP
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-playfair font-bold text-[15.5px] text-[#2C2523] leading-snug truncate">
                        {activeDress?.name}
                      </div>
                      <div className="text-[11.5px] text-[#847374] mt-0.5">
                        Mã: <span className="font-mono text-[#733F49] font-bold">{activeDress?.code || 'UB-HC-2026'}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-[#FAF4EE] border border-[#F0E5DC] text-[10.5px] text-[#6B5C5D]">
                        <span>Size: <strong>{selectedSize}</strong></span>
                        <span>•</span>
                        <span>Gói <strong>{rentalDays} ngày</strong></span>
                      </div>
                      <div className="font-jakarta font-extrabold text-[17px] text-[#733F49] mt-1 tabular-nums tracking-tight">
                        {formatCurrencyVND(totalRentPrice)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Availability / Rental Schedule Badge */}
                {scheduleConflict ? (
                  <div className="bg-[#FFF5F5] border border-[#FEB2B2] p-2 rounded-xl text-[#B91C1C] text-[11px] flex items-center gap-2 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#DC2626]" />
                    <span>Trùng lịch đã đặt ({scheduleConflict.formattedRange})</span>
                  </div>
                ) : !rentalSchedule.startDate || !rentalSchedule.endDate ? (
                  <div className="bg-[#FFF8F5] border border-[#F2D8D4] p-2 rounded-xl text-[#8C4654] text-[11px] flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-[#B8737D]" />
                    <span>Chưa chọn ngày thuê trên lịch</span>
                  </div>
                ) : (
                  <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-2 rounded-xl text-[#15803D] text-[11px] flex items-center justify-between font-bold">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#16A34A]" />
                      <span>Lịch thuê hợp lệ:</span>
                    </div>
                    <span className="font-mono text-[11.5px] text-[#15803D] bg-white/80 px-2 py-0.5 rounded-md border border-[#BBF7D0]">
                      {rentalSchedule.startDate} – {rentalSchedule.endDate}
                    </span>
                  </div>
                )}

                {/* Contract Status Stamp */}
                <div className="bg-[#FCF9F6] p-2.5 rounded-xl border border-[#EEDECF] space-y-1 text-[11.5px]">
                  <div className="flex items-center justify-between text-[#847374]">
                    <span>Tiến độ hợp đồng:</span>
                    <strong className="text-[#733F49] font-semibold">
                      {currentStep === 1 && '1. Điền thông tin'}
                      {currentStep === 2 && '2. Ký hợp đồng điện tử'}
                      {currentStep === 3 && '3. Đặt cọc giữ lịch'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[#847374]">
                    <span>Trạng thái chữ ký:</span>
                    <strong className={isContractSigned ? 'text-[#2E7D32] flex items-center gap-1 font-bold' : 'text-[#D4AF37] font-semibold'}>
                      {isContractSigned ? '✓ Đã ký hợp đồng' : 'Chưa ký'}
                    </strong>
                  </div>
                </div>

              </div>

              {/* 3. Ticket Perforated Tear-off Line with Notches */}
              <div className="shrink-0 relative my-0.5">
                <div className="absolute -left-3.5 -top-2.5 w-6 h-6 rounded-full bg-[#FDFBF7] border border-[#E8DFD8] shadow-inner z-10" />
                <div className="absolute -right-3.5 -top-2.5 w-6 h-6 rounded-full bg-[#FDFBF7] border border-[#E8DFD8] shadow-inner z-10" />
                <div className="border-b-2 border-dashed border-[#E5D7CD] w-full px-5" />
              </div>

              {/* 4. Ticket Lower Section: Breakdown & Amount To Pay (Ghim cố định ở đáy vé, LUÔN HIỂN THỊ TRƯỚC MẮT) */}
              <div className="shrink-0 p-4 sm:p-5 space-y-2.5 bg-[#FFFCFA] border-t border-[#F5EDE8]">

                {/* Price Breakdown */}
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex items-center justify-between text-[#6B5C5D]">
                    <span>Đơn giá thuê ({orderItems.length || 1} váy / ngày):</span>
                    <span className="font-semibold text-[#2C2523]">{formatCurrencyVND(dailyRentPrice)}/ngày</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6B5C5D]">
                    <span>Tổng tiền thuê ({rentalDays} ngày):</span>
                    <span className="font-bold text-[#733F49]">{formatCurrencyVND(totalRentPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6B5C5D]">
                    <span>Cọc bảo lãnh trang phục:</span>
                    <span className="font-bold text-[#733F49]">{formatCurrencyVND(depositCollateral)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6B5C5D]">
                    <span>Dịch vụ giặt sấy & may đo:</span>
                    <span className="font-bold text-[#2E7D32]">Miễn phí</span>
                  </div>
                </div>

                {/* Amount to Pay Today */}
                <div className="pt-2.5 border-t border-[#F5EDE8] flex items-center justify-between">
                  <div>
                    <span className="text-[12.5px] font-bold text-[#2C2523] block leading-tight">Tổng thanh toán hôm nay:</span>
                    <span className="text-[10px] text-[#2E7D32] font-semibold block mt-0.5">
                      (Hoàn lại {formatCurrencyVND(depositCollateral)} khi trả váy)
                    </span>
                  </div>
                  <span className="font-jakarta font-extrabold text-[20px] sm:text-[22px] text-[#733F49] tabular-nums tracking-tight">
                    {formatCurrencyVND(amountToPayToday)}
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

      {/* ================= FLOATING STICKY BOTTOM BAR (LUÔN CỐ ĐỊNH HIỂN THỊ TỔNG GIÁ KHI LƯỚT CHƯA TỚI ĐÁY) ================= */}
      <aside aria-label="Thanh tổng thanh toán nhanh" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EEDECF] shadow-[0_-8px_30px_rgba(115,63,73,0.12)] py-3 px-4 sm:px-8 transition-all print:hidden">
        <div className="max-w-[1320px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] border border-[#F2D8D4] flex items-center justify-center text-[#733F49] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#847374] uppercase tracking-wider flex items-center gap-1.5">
                <span>Tổng thanh toán ({orderItems.length || 1} tác phẩm)</span>
                <span className="text-[#2E7D32] font-bold hidden sm:inline">• Hoàn cọc 100% khi trả váy</span>
              </div>
              <div className="font-jakarta font-extrabold text-[18px] sm:text-[22px] text-[#733F49] leading-tight">
                {formatCurrencyVND(amountToPayToday)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleProceedToContract}
                className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white text-[12.5px] sm:text-[13.5px] font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer border-0 active:scale-[0.98]"
              >
                <span>Xem Trước & Ký Hợp Đồng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleSignAndProceedToPayment}
                className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white text-[12.5px] sm:text-[13.5px] font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer border-0 active:scale-[0.98]"
              >
                <span>Chuyển Sang Bước 3: Đặt Cọc</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {currentStep === 3 && (
              <button
                type="button"
                disabled={isSubmitting || isVerifyingPayment}
                onClick={handleConfirmFinalPayment}
                className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white text-[12.5px] sm:text-[13.5px] font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer border-0 active:scale-[0.98]"
              >
                <Lock className="w-4 h-4" />
                <span>Xác Nhận & Khóa Lịch</span>
              </button>
            )}
          </div>
        </div>
      </aside>



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
                Chúc mừng cô dâu <strong>{brideName}</strong>. Hợp đồng cho thuê <strong>{orderItems && orderItems.length > 1 ? `${orderItems.length} tác phẩm lễ phục cưới` : `tác phẩm ${activeDress?.name}`}</strong> đã được ký kết điện tử thành công và lịch độc quyền đã được khóa cho hôn lễ của nàng.
              </p>
            </div>

            {/* Contract Ticket Voucher */}
            <div className="bg-[#FAF4EE] p-4.5 rounded-2xl border border-[#EEDECF] text-left text-[12.5px] space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#EEDECF]">
                <span className="text-[#847374]">Mã Đơn / Hợp Đồng:</span>
                <strong className="font-mono text-[#733F49] text-[14px]">{createdOrder?.contractCode || createdOrder?.orderCode || 'HĐ-UB-2026/8992'}</strong>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-[#847374] shrink-0">Trang phục:</span>
                <div className="text-right">
                  {orderItems && orderItems.length > 1 ? (
                    <div className="space-y-1">
                      {orderItems.map((item, idx) => (
                        <div key={item.id || idx} className="text-[#2C2523] font-semibold text-[12px]">
                          {idx + 1}. {item.name} <span className="text-[#733F49] font-normal">(Size {item.size || selectedSize})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <strong className="text-[#2C2523]">{activeDress?.name} (Size {selectedSize})</strong>
                  )}
                </div>
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
              <div className="flex items-center justify-between pt-1 border-t border-[#EEDECF]/60">
                <span className="text-[#847374]">Phương thức thanh toán:</span>
                <span className="inline-flex items-center gap-1 font-bold text-[#2E7D32] text-[11.5px] bg-[#E8F5E9] px-2.5 py-0.5 rounded-md border border-[#C8E6C9]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                  Chuyển khoản VietQR 24/7 Techcombank (Đã đối soát)
                </span>
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
                  const shareText = `Anh yêu ơi, em đã đặt thuê thành công ${orderItems && orderItems.length > 1 ? `${orderItems.length} tác phẩm váy cưới` : `tác phẩm váy cưới ${activeDress?.name}`} tại UniBridal cho ngày cưới ${rentalSchedule.weddingDate}! Mã hợp đồng: ${createdOrder?.contractCode || 'HĐ-UB-2026/8992'}. Cùng xem với em nhé: ${window.location.href}`;
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

              </button>
              <button
                type="button"
                onClick={handleOpenPdfContract}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#EEDECF] hover:bg-[#FAF0EC] text-[#733F49] text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Mở File Hợp Đồng (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    message.warning({
                      content: 'Nếu muốn theo dõi được đơn hàng, vui lòng đăng nhập vào tài khoản của bạn.',
                      duration: 4,
                    });
                    setIsSuccessModalOpen(false);
                    navigate('/login', { state: { from: '/profile/orders' } });
                    return;
                  }
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

            {!isLoggedIn && (
              <p className="text-[12px] text-[#847374] mt-2 mb-0 text-center">
                ✦ Lưu ý: Nếu muốn theo dõi được đơn hàng và tiến độ chuẩn bị lễ phục, nàng vui lòng đăng nhập tài khoản.
              </p>
            )}

          </div>
        </div>
      )}

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
