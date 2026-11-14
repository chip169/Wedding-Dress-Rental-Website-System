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
  User,
  UserCheck,
  Phone,
  QrCode,
  CreditCard,
  Building2,
  FileText,
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
  Sparkles,
  Zap
} from 'lucide-react';
import { message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { getDressById, isDressOutOfStock } from '../../services/dressService';
import { getCart, resolveCartItem, clearCart } from '../../services/cartService';
import { getDressBookedDates, createOrder } from '../../services/orderService';
import { simulateVietQRPaymentApi } from '../../services/paymentService';
import { HIEU_SIGNATURE_BASE64 } from '../../assets/images/signatureHieuBase64';
import unibridalEmblem from '../../assets/logo_emblem.png';
import SignedContractModal, { STANDARD_HAUTE_COUTURE_CLAUSES } from '../../components/common/SignedContractModal';
import { DAMAGE_PRICE_CATALOG } from '../../data/damagePriceCatalog';

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
      if (parts[0].length === 4) { // YYYY/MM/DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      if (Number(parts[1]) > 12 && Number(parts[0]) <= 12) { // MM/DD/YYYY
        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
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
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) { // YYYY/MM/DD
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      if (Number(parts[1]) > 12 && Number(parts[0]) <= 12) { // MM/DD/YYYY -> DD/MM/YYYY
        return `${parts[1].padStart(2, '0')}/${parts[0].padStart(2, '0')}/${parts[2]}`;
      }
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
  }
  if (str.includes('-')) {
    const parts = str.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }
  return str;
}

// Helper: Lấy ngày hiện tại chuẩn YYYY-MM-DD theo giờ địa phương
function getTodayIsoString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helper: Lấy ngày mai chuẩn YYYY-MM-DD theo giờ địa phương (Sớm nhất có thể đặt thuê váy)
function getTomorrowIsoString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helper: Tính ngày hẹn thử váy hợp lý trước ngày nhận váy 3 ngày (tối thiểu từ ngày mai)
function calculateSuggestedFittingDate(rentalStartDate) {
  const iso = toIsoDateString(rentalStartDate);
  if (!iso) return '';
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3) return '';
  const d = new Date(parts[0], parts[1] - 1, parts[2] - 3);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const finalDate = d < tomorrow ? tomorrow : d;
  const y = finalDate.getFullYear();
  const m = String(finalDate.getMonth() + 1).padStart(2, '0');
  const day = String(finalDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helper: Kiểm tra một size cụ thể của mẫu váy có bị hết hàng hay không
function checkIsSizeOutOfStock(sz, dress) {
  const sClean = String(typeof sz === 'string' ? sz : sz?.size || sz?.label || sz?.id || '')
    .replace(/^size\s*/i, '')
    .trim()
    .toUpperCase();

  // 1. Kiểm tra trạng thái chung của váy
  const status = String(dress?.status || dress?.statusType || '').toLowerCase();
  if (['out_of_stock', 'retired', 'unavailable', 'drying'].includes(status)) {
    return true;
  }

  // 2. Kiểm tra trong kho override (localStorage)
  try {
    const rawOverrides = localStorage.getItem('unibridal_inventory_overrides');
    if (rawOverrides) {
      const overrides = JSON.parse(rawOverrides);
      const dressId = String(dress?._id || dress?.id || '');
      const dressCode = String(dress?.code || '').toUpperCase();
      const ov =
        overrides[dressId] ||
        overrides[dressCode] ||
        Object.values(overrides).find(
          (o) =>
            (o?.code && o.code.toUpperCase() === dressCode) ||
            (o?.id && String(o.id) === dressId)
        );

      if (ov?.statusType === 'out_of_stock' || ov?.statusType === 'drying') {
        return true;
      }

      // Kiểm tra bảo dưỡng thủ công theo size
      const manualMaint = Number(ov?.maintenanceSizes?.[sClean] ?? 0);
      if (manualMaint > 0) {
        let totalSizeQty = 1;
        if (Array.isArray(dress?.sizes)) {
          const matchDress = dress.sizes.find((s) => {
            const val = String(typeof s === 'string' ? s : s?.size || s?.label || s?.id || '')
              .replace(/^size\s*/i, '')
              .trim()
              .toUpperCase();
            return val === sClean;
          });
          if (matchDress && typeof matchDress === 'object') {
            totalSizeQty = Math.max(1, Number(matchDress.totalQuantity ?? matchDress.quantity) || 1);
          }
        }
        if (manualMaint >= totalSizeQty) return true;
      }

      if (Array.isArray(ov?.sizes)) {
        const matchOv = ov.sizes.find((s) => {
          const val = String(typeof s === 'string' ? s : s?.size || s?.label || s?.id || '')
            .replace(/^size\s*/i, '')
            .trim()
            .toUpperCase();
          return val === sClean;
        });
        if (matchOv && typeof matchOv === 'object') {
          if (matchOv?.available !== undefined && Number(matchOv.available) <= 0) return true;
          if (matchOv?.quantity !== undefined) {
            const q = Number(matchOv.quantity);
            if (!isNaN(q) && q <= 0) return true;
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. Kiểm tra trực tiếp trên đối tượng sz
  if (typeof sz === 'object' && sz !== null) {
    if (sz.available !== undefined && Number(sz.available) <= 0) return true;
    if (sz.quantity !== undefined) {
      const q = Number(sz.quantity);
      if (!isNaN(q) && q <= 0) return true;
    }
    if (sz.isMaintenance) return true;
  }

  // 4. Kiểm tra trong dress.sizes
  if (Array.isArray(dress?.sizes)) {
    const matchDress = dress.sizes.find((s) => {
      const val = String(typeof s === 'string' ? s : s?.size || s?.label || s?.id || '')
        .replace(/^size\s*/i, '')
        .trim()
        .toUpperCase();
      return val === sClean;
    });
    if (matchDress && typeof matchDress === 'object') {
      if (matchDress.available !== undefined && Number(matchDress.available) <= 0) return true;
      if (matchDress.quantity !== undefined) {
        const q = Number(matchDress.quantity);
        if (!isNaN(q) && q <= 0) return true;
      }
      if (matchDress.isMaintenance) return true;
    }
  }

  return false;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoggedIn } = useAuth();
  const dressIdParam = searchParams.get('dressId');
  const sizeParam = searchParams.get('size');
  const colorParam = searchParams.get('color');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const daysParam = parseInt(searchParams.get('days'), 10);
  const [rentalDays, setRentalDays] = useState(!isNaN(daysParam) && daysParam >= 1 && daysParam <= 30 ? daysParam : 4);

  // Selected dress size & color (định nghĩa sớm để tránh lỗi Temporal Dead Zone)
  const [selectedSize, setSelectedSize] = useState(sizeParam || 'S');
  const [selectedColor, setSelectedColor] = useState(colorParam || 'Trắng Sữa');

  // Helper: Đồng bộ chọn size khi người dùng đổi size ở bất kỳ đâu trên Checkout
  const handleSelectSize = (newSize) => {
    if (!newSize) return;
    const cleanSize = String(newSize).replace(/^size\s*/i, '').trim();
    setSelectedSize(cleanSize);
    setOrderItems((prev) => prev.map((it) => ({ ...it, size: cleanSize, selectedSize: cleanSize })));
    if (activeDress) {
      setActiveDress((prev) => ({ ...prev, size: cleanSize, selectedSize: cleanSize }));
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('size', cleanSize);
    setSearchParams(nextParams, { replace: true });
  };

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

  // Tự động đồng bộ size & color khi query params thay đổi
  useEffect(() => {
    if (sizeParam && sizeParam !== selectedSize) {
      setSelectedSize(sizeParam);
    }
  }, [sizeParam]);

  useEffect(() => {
    if (colorParam && colorParam !== selectedColor) {
      setSelectedColor(colorParam);
    }
  }, [colorParam]);

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



  // 4. Trạng thái kiểm tra thanh toán và Phương thức thanh toán thực tế
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
            const availableSizes = Array.isArray(d.sizes) ? d.sizes.map(s => String(typeof s === 'string' ? s : s?.size || s?.label || s?.id || '').replace(/^size\s*/i, '').trim()) : [];
            const isValidSelectedSize = selectedSize && availableSizes.some(s => s.toUpperCase() === selectedSize.toUpperCase());
            const chosenSize = sizeParam || (isValidSelectedSize ? selectedSize : null) || availableSizes[0] || d.sizes?.[0]?.size || d.sizes?.[0]?.label || (typeof d.sizes?.[0] === 'string' ? d.sizes[0] : 'S');
            const chosenColor = colorParam || selectedColor || d.color || 'Trắng Sữa';
            const singleItem = {
              ...d,
              id: String(d._id || d.id),
              name: d.name,
              price: Number(d.rentPrice || d.price) || 5200000,
              deposit: Number(d.depositAmount || d.deposit) || 15000000,
              image: d.images?.[0] || d.image || '/assets/dresses/dress_01.jpg',
              code: d.code || 'UB-HC-2026',
              size: chosenSize,
              selectedSize: chosenSize,
              color: chosenColor,
              selectedColor: chosenColor,
            };
            setOrderItems([singleItem]);
            setActiveDress(singleItem);
            if (chosenSize && chosenSize !== selectedSize) {
              setSelectedSize(chosenSize);
            }
            if (chosenColor && chosenColor !== selectedColor) {
              setSelectedColor(chosenColor);
            }
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
        const initialCartSize = resolved[0]?.size || resolved[0]?.selectedSize;
        if (initialCartSize) {
          const cleanInitial = String(initialCartSize).replace(/^size\s*/i, '').trim();
          setSelectedSize(cleanInitial);
        }
      } else {
        setOrderItems([]);
        setActiveDress(null);
      }
    }
    return () => { active = false; };
  }, [dressIdParam]);

  // Current Active Wizard Step: 1 = Thông Tin và Số Đo, 2 = Ký Hợp Đồng Điện Tử, 3 = Đặt Cọc và Thanh Toán
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
  const [isViewContractModalOpen, setIsViewContractModalOpen] = useState(false);
  const [sessionOrderCode] = useState(() => `UB-2026-${Math.floor(100 + Math.random() * 900)}`);
  const effectiveOrderCode = createdOrder?.orderCode || sessionOrderCode;
  const effectiveContractCode = createdOrder?.contractCode || `HĐ-${effectiveOrderCode}`;
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

    let calculatedStartIso = toIsoDateString(addDaysToDate(wedIso, -beforeDays));
    const curTomorrow = getTomorrowIsoString();
    // Nếu ngày nhận rơi vào hôm nay hoặc quá khứ, kẹp chặt tối thiểu từ ngày mai (chuẩn bị 24h)
    if (calculatedStartIso < curTomorrow) {
      calculatedStartIso = curTomorrow;
    }

    const startDisplay = toDisplayDateString(calculatedStartIso);
    const weddingDisplay = toDisplayDateString(wedIso);
    const endDisplay = addDaysToDate(calculatedStartIso, validDays);

    return {
      startDate: startDisplay,
      weddingDate: weddingDisplay,
      endDate: endDisplay,
    };
  };

  // Lấy ngày hôm nay và ngày mai chuẩn ISO
  const todayIso = useMemo(() => getTodayIsoString(), []);
  const tomorrowIso = useMemo(() => getTomorrowIsoString(), []);

  // Schedule state (Định dạng hiển thị DD/MM/YYYY)
  const [rentalSchedule, setRentalSchedule] = useState(() => {
    const validStart = startDateParam && startDateParam !== 'undefined' && startDateParam !== 'null' ? toDisplayDateString(startDateParam) : null;
    const validEnd = endDateParam && endDateParam !== 'undefined' && endDateParam !== 'null' ? toDisplayDateString(endDateParam) : null;
    const validWedding = searchParams.get('weddingDate') && searchParams.get('weddingDate') !== 'undefined' && searchParams.get('weddingDate') !== 'null'
      ? toDisplayDateString(searchParams.get('weddingDate'))
      : null;

    const curToday = getTodayIsoString();
    const startIsoCheck = toIsoDateString(validStart);
    if (startIsoCheck && startIsoCheck <= curToday) {
      return { startDate: '', weddingDate: '', endDate: '' };
    }

    if (validStart && validEnd) {
      return {
        startDate: validStart,
        weddingDate: validWedding || validStart,
        endDate: validEnd,
      };
    }

    if (validWedding) {
      const wedIsoCheck = toIsoDateString(validWedding);
      if (wedIsoCheck && wedIsoCheck <= curToday) {
        return { startDate: '', weddingDate: '', endDate: '' };
      }
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
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [showFullCalendar, setShowFullCalendar] = useState(true);

  // Danh sách các khoảng ngày đã kín lịch của chiếc váy theo đúng đơn thuê thực tế trong cơ sở dữ liệu (Không fake data)
  const [bookedIntervals, setBookedIntervals] = useState([]);
  const [isLoadingBookedDates, setIsLoadingBookedDates] = useState(false);

  // Tự động tải lịch đã đặt từ Backend API theo đúng đơn hàng thực tế của chiếc váy
  React.useEffect(() => {
    let isMounted = true;
    const fetchBooked = async () => {
      try {
        const items = orderItems && orderItems.length > 0 ? orderItems : (activeDress ? [activeDress] : []);
        if (items.length === 0) {
          if (isMounted) setBookedIntervals([]);
          return;
        }
        setIsLoadingBookedDates(true);
        const allBooked = [];
        for (const it of items) {
          const dressId = it.id || it._id || it.code;
          if (!dressId) continue;
          try {
            const apiDates = await getDressBookedDates(dressId);
            if (Array.isArray(apiDates)) {
              allBooked.push(...apiDates);
            }
          } catch {
            // bỏ qua lỗi từng váy
          }
        }
        if (!isMounted) return;

        const formatted = allBooked
          .map((item) => {
            const start = toIsoDateString(item.startDate);
            let end = toIsoDateString(item.endDate);
            let actualEnd = toIsoDateString(item.actualEndDate);
            if (!actualEnd) {
              actualEnd = end;
            }
            // Đảm bảo khóa thêm 1 ngày tiếp theo của ngày trả váy (bảo trì & khử trùng)
            if (end === actualEnd && end) {
              const p = end.split('-').map(Number);
              if (p.length === 3) {
                const nextDay = new Date(p[0], p[1] - 1, p[2] + 1);
                const y = nextDay.getFullYear();
                const m = String(nextDay.getMonth() + 1).padStart(2, '0');
                const d = String(nextDay.getDate()).padStart(2, '0');
                end = `${y}-${m}-${d}`;
              }
            }
            return {
              startDate: start,
              endDate: end, // Ngày kết thúc khóa lịch (đã bao gồm ngày bảo trì)
              actualEndDate: actualEnd, // Ngày trả váy thực tế theo đơn
              maintenanceDate: end, // Ngày bảo trì
              orderCode: item.orderCode,
              bride: item.bride || 'Kín lịch',
              size: item.size || '',
              sizes: item.sizes || (item.size ? [item.size] : []),
              hasMaintenanceDay: true,
            };
          })
          .filter((item) => item.startDate && item.endDate);

        // Loại bỏ các khoảng ngày trùng lặp (xét cùng size)
        const uniqueIntervals = [];
        formatted.forEach((item) => {
          if (!uniqueIntervals.some((u) => u.startDate === item.startDate && u.endDate === item.endDate && u.size === item.size)) {
            uniqueIntervals.push(item);
          }
        });

        setBookedIntervals(uniqueIntervals);
      } catch {
        if (isMounted) setBookedIntervals([]);
      } finally {
        if (isMounted) setIsLoadingBookedDates(false);
      }
    };
    fetchBooked();
    return () => {
      isMounted = false;
    };
  }, [orderItems, activeDress]);

  // Kiểm tra 1 ngày cụ thể (YYYY-MM-DD) có bị kín lịch hay không (xét theo size hiện tại)
  const getBookedInfoForDate = (dateStr) => {
    if (!dateStr) return null;
    const currentSizeClean = String(selectedSize || '').replace(/^size\s*/i, '').trim().toUpperCase();
    return bookedIntervals.find((interval) => {
      const s = toIsoDateString(interval.startDate);
      const e = toIsoDateString(interval.endDate);
      const isDateInRange = dateStr >= s && dateStr <= e;
      if (!isDateInRange) return false;

      const intervalSizes = (interval.sizes || [interval.size]).map((sz) =>
        String(sz || '').replace(/^size\s*/i, '').trim().toUpperCase()
      ).filter(Boolean);

      if (currentSizeClean && intervalSizes.length > 0 && !intervalSizes.includes(currentSizeClean)) {
        return false;
      }
      return true;
    });
  };

  // Kiểm tra dải ngày thuê đang chọn [startDate -> endDate] có bị trùng lịch đã đặt không
  const scheduleConflict = useMemo(() => {
    const userStart = toIsoDateString(rentalSchedule.startDate);
    const userEnd = toIsoDateString(rentalSchedule.endDate);
    if (!userStart || !userEnd) return null;

    const currentSizeClean = String(selectedSize || '').replace(/^size\s*/i, '').trim().toUpperCase();

    for (const interval of bookedIntervals) {
      const bStart = toIsoDateString(interval.startDate);
      const bEnd = toIsoDateString(interval.endDate);
      if (!bStart || !bEnd) continue;

      const intervalSizes = (interval.sizes || [interval.size]).map((sz) =>
        String(sz || '').replace(/^size\s*/i, '').trim().toUpperCase()
      ).filter(Boolean);

      // Nếu khoảng ngày đã đặt thuộc size khác với size khách đang chọn -> không tính là xung đột
      if (currentSizeClean && intervalSizes.length > 0 && !intervalSizes.includes(currentSizeClean)) {
        continue;
      }

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
  }, [rentalSchedule.startDate, rentalSchedule.endDate, bookedIntervals, selectedSize]);

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
    if (iso <= todayIso) {
      message.warning(`Không thể đặt thuê nhận váy trong ngày hôm nay! Nàng vui lòng chọn ngày nhận từ ngày mai (${toDisplayDateString(tomorrowIso)}) trở đi để Atelier chuẩn bị và khử trùng lễ phục chu đáo.`);
      return;
    }
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
    if (newWedIso <= todayIso) {
      message.warning(`Ngày cưới chính thức không thể là ngày hôm nay hoặc trong quá khứ! Nàng vui lòng chọn từ ngày mai (${toDisplayDateString(tomorrowIso)}) trở đi.`);
      return;
    }
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
    if (newEndIso <= todayIso) {
      message.warning(`Ngày hoàn trả phải từ ngày mai (${toDisplayDateString(tomorrowIso)}) trở đi!`);
      return;
    }
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
    if (dateStr <= todayIso) {
      message.warning(
        dateStr === todayIso
          ? `Không thể đặt thuê nhận váy trong ngày hôm nay! Nàng vui lòng chọn ngày nhận từ ngày mai (${toDisplayDateString(tomorrowIso)}) trở đi để Atelier chuẩn bị lễ phục chu đáo.`
          : 'Không thể chọn ngày trong quá khứ!'
      );
      return;
    }
    const booked = getBookedInfoForDate(dateStr);
    if (booked) {
      if (booked.actualEndDate && dateStr > booked.actualEndDate) {
        message.warning(
          `Ngày ${toDisplayDateString(dateStr)} là ngày bảo trì & khử trùng lễ phục sau khi khách trả váy. Nàng vui lòng chọn ngày nhận sau ngày bảo trì nhé!`
        );
      } else {
        message.warning(
          `Váy cưới đã kín lịch từ ${toDisplayDateString(booked.startDate)} đến ${toDisplayDateString(booked.endDate)} (bao gồm 1 ngày bảo trì sau thuê). Nàng vui lòng chọn ngày khác trên lịch nhé!`
        );
      }
      return;
    }

    handleSelectStartDate(dateStr);
    const endStr = computeEndDate(dateStr, rentalDays);
    message.success(
      `Đã chọn ngày bắt đầu thuê: ${toDisplayDateString(dateStr)} (Tự động hoàn trả ngày ${endStr} - Gói ${rentalDays} ngày)`
    );
  };

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

  // Gợi ý Size thông minh theo Chiều cao và Cân nặng
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

  // Step 3: Deposit option: 'full100' (Chuyển khoản cọc 100%)
  const [depositOption, setDepositOption] = useState('full100');

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

  // Danh mục trang phục thuê chuẩn hóa hiển thị đồng bộ trong Hợp Đồng Điện Tử
  const contractItems = useMemo(() => {
    const days = Math.max(1, Number(rentalDays) || 1);
    if (orderItems && orderItems.length > 0) {
      return orderItems.map((item, idx) => {
        const itemDailyPrice = Number(item.dailyPrice || item.price || item.rentPrice || 0);
        const itemTotalRent = itemDailyPrice * days;
        return {
          name: item.name || `Váy cưới Haute Couture #${idx + 1}`,
          code: item.code || `UB-HC-0${idx + 1}`,
          size: selectedSize || item.size || activeDress?.size || 'S',
          color: (dressIdParam && selectedColor) ? selectedColor : (item.color || selectedColor || 'Trắng Sữa'),
          rentPrice: itemTotalRent,
          dailyPrice: itemDailyPrice,
          depositAmount: Number(item.deposit || item.depositAmount || 0),
          startDate: rentalSchedule?.startDate || '',
          endDate: rentalSchedule?.endDate || '',
        };
      });
    }
    if (activeDress) {
      const itemDailyPrice = Number(activeDress.price || activeDress.rentPrice || 0);
      return [{
        name: activeDress.name || 'Váy cưới Haute Couture',
        code: activeDress.code || 'UB-HC-2026',
        size: selectedSize || sizeParam || activeDress.size || 'S',
        rentPrice: totalRentPrice,
        dailyPrice: itemDailyPrice,
        depositAmount: depositCollateral,
        startDate: rentalSchedule?.startDate || '',
        endDate: rentalSchedule?.endDate || '',
      }];
    }
    return [];
  }, [orderItems, activeDress, selectedSize, selectedColor, rentalDays, totalRentPrice, depositCollateral, rentalSchedule]);

  // Validate helpers (chuẩn hóa đồng bộ như bên Đặt Lịch Hẹn - AppointmentPage)
  const validateFullNameInput = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return 'Vui lòng nhập họ và tên cô dâu';
    if (/\d/.test(trimmed)) return 'Họ và tên không được chứa chữ số';
    if (trimmed.length < 2) return 'Họ và tên tối thiểu 2 ký tự';
    return null;
  };

  const validatePhoneInput = (val) => {
    const clean = (val || '').replace(/[\s.-]/g, '');
    if (!clean) return 'Vui lòng nhập số điện thoại liên hệ';
    if (!/^\d+$/.test(clean)) return 'Số điện thoại chỉ được chứa chữ số';
    if (clean.length !== 10) return `Số điện thoại phải có đúng 10 số (hiện có ${clean.length} số)`;
    if (!/^(0[2|3|5|7|8|9])[0-9]{8}$/.test(clean)) {
      return 'Số điện thoại không hợp lệ (phải bắt đầu bằng các đầu số 03, 05, 07, 08, 09, 02)';
    }
    return null;
  };

  const validateEmailInput = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return 'Vui lòng nhập email nhận hợp đồng số';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Email không hợp lệ (ví dụ: codau@gmail.com)';
    }
    return null;
  };

  const validateCccdInput = (val) => {
    const clean = (val || '').replace(/[\s.-]/g, '');
    if (!clean) return 'Vui lòng nhập số CCCD / CMND để lập hợp đồng pháp lý';
    if (!/^\d+$/.test(clean)) return 'Số CCCD/CMND chỉ được chứa chữ số';
    if (clean.length !== 9 && clean.length !== 12) {
      return `Số CCCD/CMND phải gồm 9 hoặc 12 chữ số (hiện có ${clean.length} số)`;
    }
    return null;
  };

  const validateAddressInput = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return 'Vui lòng nhập địa chỉ thường trú hoặc nhận lễ phục';
    if (trimmed.length < 5) return 'Địa chỉ cần chi tiết hơn (tối thiểu 5 ký tự)';
    return null;
  };

  // Validation chi tiết Step 1 (Thông tin người đại diện thuê)
  const validateCustomerInfo = () => {
    const errors = {};
    const nameErr = validateFullNameInput(brideName);
    if (nameErr) errors.brideName = nameErr;

    const phoneErr = validatePhoneInput(phone);
    if (phoneErr) errors.phone = phoneErr;

    const emailErr = validateEmailInput(email);
    if (emailErr) errors.email = emailErr;

    const cccdErr = validateCccdInput(cccd);
    if (cccdErr) errors.cccd = cccdErr;

    const addressErr = validateAddressInput(address);
    if (addressErr) errors.address = addressErr;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Kiểm tra sản phẩm trong đơn thuê có bị hết hàng trong kho không
  const hasOutOfStockItem = useMemo(() => {
    if (orderItems && orderItems.length > 0) {
      return orderItems.some(isDressOutOfStock);
    }
    if (activeDress) {
      return isDressOutOfStock(activeDress);
    }
    return false;
  }, [orderItems, activeDress]);

  // Validation Step 1
  const handleProceedToContract = (e) => {
    e?.preventDefault();
    if (hasOutOfStockItem) {
      message.error('Sản phẩm trong đơn thuê hiện đã hết hàng trong kho. Vui lòng chọn mẫu váy khác!');
      return;
    }
    if (!rentalSchedule.startDate || !rentalSchedule.weddingDate || !rentalSchedule.endDate) {
      message.warning('Nàng vui lòng chọn ngày cưới và thời gian thuê trên bảng lịch trước khi tiếp tục!');
      return;
    }

    const startIso = toIsoDateString(rentalSchedule.startDate);
    const wedIso = toIsoDateString(rentalSchedule.weddingDate);
    const endIso = toIsoDateString(rentalSchedule.endDate);

    if (startIso && startIso <= todayIso) {
      message.error(`Không thể đặt thuê cho ngày hôm nay! Ngày nhận váy phải từ ngày mai (${toDisplayDateString(tomorrowIso)}) trở đi.`);
      return;
    }

    if (wedIso && wedIso <= todayIso) {
      message.error(`Ngày cưới chính thức phải từ ngày mai (${toDisplayDateString(tomorrowIso)}) trở đi!`);
      return;
    }

    if (endIso && endIso <= todayIso) {
      message.error(`Ngày hoàn trả phải từ ngày mai (${toDisplayDateString(tomorrowIso)}) trở đi!`);
      return;
    }

    if (startIso && endIso && endIso < startIso) {
      message.error('Ngày hoàn trả không thể trước ngày bắt đầu thuê!');
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
      const typedSig = (contractSignature && !contractSignature.startsWith('data:image') ? contractSignature : brideName).trim();
      if (!typedSig) {
        message.warning('Vui lòng nhập họ tên xác nhận chữ ký điện tử.');
        return;
      }
      setContractSignature(typedSig);
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
                  Địa chỉ: 26 Lý Thường Kiệt, P. Hàng Bài, Q. Hoàn Kiếm, Hà Nội<br />
                  Hotline: <strong>024 3936 8998</strong> • Email: contact@unibridal.vn<br />
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

            <div class="clause-heading">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG VÀ TIÊU CHUẨN LỄ PHỤC</div>
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

            <div class="clause-heading">ĐIỀU 2: THỜI HẠN THUÊ, PHƯƠNG THỨC GIAO NHẬN VÀ QUY TRÌNH THU HỒI, KIỂM ĐỊNH</div>
            <p>2.1. Tổng thời gian thuê: <strong>${rentalDays} ngày</strong> liên tục.</p>
            <p>2.2. Thời điểm nhận váy: Từ 09:00 ngày <strong>${rentalSchedule.startDate}</strong>.</p>
            <p>2.3. Ngày tổ chức hôn lễ chính thức: <strong>${rentalSchedule.weddingDate}</strong>.</p>
            <p>2.4. Phương thức nhận váy và thu hồi: ${deliveryMethod === 'delivery'
        ? 'Bên A thực hiện giao váy tận nơi bằng Vali VIP Courier theo địa chỉ Bên B đã đăng ký. '
        : 'Bên B nhận váy trực tiếp tại Showroom Atelier của Bên A (được hỗ trợ chuyên viên fitting và ủi sấy hoàn thiện trước giờ trao nhận). '
      }Đến thời hạn hoàn trả (trước 20:00 ngày <strong>' + rentalSchedule.endDate + '</strong>), <strong>chuyên viên của Bên A sẽ chủ động liên hệ hẹn giờ và trực tiếp đến tận nơi thu hồi lễ phục trong vali bảo quản niêm phong và kiểm định hiện trạng</strong>, Bên B không cần phải tự mang trả.</p>
            <p>2.5. Hai bên thực hiện ký Biên bản kiểm định bàn giao và thu hồi để ghi nhận hiện trạng đính kết ren, hạt cườm và kết cấu váy tại thời điểm giao và nhận lại.</p>

            <div class="clause-heading">ĐIỀU 3: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</div>
            <p>3.1. Tổng giá trị hợp đồng thuê trọn gói (${rentalDays} ngày): <strong>${formatNumberDots(totalRentPrice)} VNĐ</strong> (Đã bao gồm VAT, dịch vụ giặt hấp khử khuẩn và phí tinh chỉnh phom váy).</p>
            <p>3.2. Tiền cọc bảo lãnh trang phục (50% giá trị váy): <strong>${formatNumberDots(depositCollateral)} VNĐ</strong>.</p>
            <p>3.3. Tổng số tiền thanh toán khi ký hợp đồng (Tiền thuê + Cọc bảo lãnh): <strong>${formatNumberDots(totalRentPrice + depositCollateral)} VNĐ</strong>, Bên B thanh toán ngay thông qua cổng chuyển khoản VietQR Techcombank.</p>
            <p>3.4. Cam kết hoàn tiền cọc: Bên A cam kết hoàn trả 100% tiền cọc bảo lãnh (${formatNumberDots(depositCollateral)} VNĐ) vào tài khoản Bên B ngay khi tiếp nhận hoàn trả váy nguyên vẹn.</p>

            <div class="clause-heading">ĐIỀU 4: CAM KẾT DỊCH VỤ VÀ BẢO HIỂM LỄ PHỤC</div>
            <p>4.1. Cam kết chất lượng: Bên A cam kết bàn giao đúng tác phẩm thiết kế đã chọn, đúng số đo may đo đã ghi nhận và đầy đủ bộ phụ kiện cao cấp đi kèm.</p>
            <p>4.2. Cam kết hoàn cọc: Trường hợp phát sinh thay đổi hoặc hủy hợp đồng theo các điều khoản bất khả kháng quy định tại Điều 7, Bên A cam kết bảo lưu hoặc hoàn trả 100% tiền cọc giữ lịch trong vòng 24 giờ làm việc.</p>

            <div class="clause-heading">ĐIỀU 5: QUY CHUẨN BẢO QUẢN VÀ CHÍNH SÁCH BẢO HIỂM VẢI REN</div>
            <p>5.1. Bảo hiểm vết bẩn sự kiện cưới: Bên A áp dụng chính sách bảo hiểm miễn phí xử lý đối với các vết bẩn thông thường như bụi sân khấu, vết bùn đất gấu váy hoặc vết rượu vang rơi vãi nhẹ. Bên A chịu 100% chi phí xử lý bằng dung môi sinh học chuyên dụng.</p>
            <p>5.2. Trách nhiệm của Bên B: Giữ gìn lễ phục ở nơi khô ráo, thoáng mát, treo cao bằng móc chống biến dạng; tuyệt đối không để tàn thuốc lá, pháo sáng hoặc vật sắc nhọn tiếp xúc gần với bề mặt ren.</p>
            <p>5.3. Nghiêm cấm: Bên B tuyệt đối không tự ý cắt may, thay đổi kết cấu, dán keo vải hoặc đem váy đến các tiệm giặt ủi thông thường bên ngoài.</p>

            <div class="clause-heading">ĐIỀU 6: QUY ĐỊNH BỒI HOÀN KHI HƯ HỎNG, TRỄ HẠN HOẶC MẤT MÁT</div>
            <p>6.1. Bàn giao hoàn trả trễ hạn: Nếu Bên B hoàn trả sau 20:00 ngày ${rentalSchedule.endDate} mà không có thỏa thuận gia hạn trước bằng văn bản, Bên B chịu phí lưu dụng là 800.000 VNĐ/ngày để bù đắp chi phí gián đoạn lịch của cô dâu tiếp theo.</p>
            <p>6.2. Hư hỏng có thể khắc phục (rách ren nhỏ, đứt chỉ đính hạt): Bên B bồi hoàn chi phí công phục dựng thủ công của nghệ nhân theo hóa đơn thực tế, tối đa không vượt quá 15% tiền cọc bảo lãnh.</p>
            <p>6.3. Hư hỏng nặng không thể phục hồi (cháy rách mảng lớn, loang màu hóa chất không tẩy được, hoặc mất mát): Bên B chịu trách nhiệm bồi thường theo giá trị niêm yết xuất kho của tác phẩm sau khi khấu trừ 20% hao mòn tự nhiên.</p>

            <div class="clause-heading">ĐIỀU 7: QUYỀN THAY ĐỔI LỊCH CƯỚI, HỦY HỢP ĐỒNG VÀ BẤT KHẢ KHÁNG</div>
            <p>7.1. Đổi ngày cưới miễn phí: Bên B được quyền chuyển đổi ngày thuê sang bất kỳ ngày nào còn trống trong vòng 12 tháng hoàn toàn miễn phí khi gửi thông báo trước tối thiểu 15 ngày so với ngày nhận váy ban đầu.</p>
            <p>7.2. Trường hợp bất khả kháng: Trong trường hợp xảy ra thiên tai, dịch bệnh hoặc các quyết định cấm tập trung của Cơ quan Nhà nước có thẩm quyền, hai bên thống nhất bảo lưu 100% giá trị hợp đồng và tiền đặt cọc trong thời hạn 18 tháng mà không phải chịu bất kỳ khoản phạt nào.</p>

            <div class="clause-heading">ĐIỀU 8: GIẢI QUYẾT TRANH CHẤP VÀ HIỆU LỰC PHÁP LÝ HỢP ĐỒNG ĐIỆN TỬ</div>
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
              <span>Văn bản hợp đồng thuê điện tử được xác lập và bảo mật bởi UniBridal Atelier Việt Nam</span>
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
              Địa chỉ: 26 Lý Thường Kiệt, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội<br>
              Hotline: 024 3936 8998 • Email: contact@unibridal.vn<br>
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

        <div class='clause-title'>ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG VÀ THỜI HẠN THUÊ</div>
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

        <div class='clause-title'>ĐIỀU 2: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</div>
        <p>2.1. Tổng chi phí thuê váy trọn gói (${rentalDays} ngày): <strong>${formatNumberDots(totalRentPrice)} VNĐ</strong>.</p>
        <p>2.2. Tiền cọc bảo lãnh trang phục (50% giá trị váy): <strong>${formatNumberDots(depositCollateral)} VNĐ</strong>.</p>
        <p>2.3. Tổng số tiền thanh toán khi ký hợp đồng (Tiền thuê + Tiền cọc bảo lãnh): <strong>${formatNumberDots(totalRentPrice + depositCollateral)} VNĐ</strong> (thanh toán qua cổng chuyển khoản VietQR Techcombank).</p>
        <p>2.4. Cam kết hoàn tiền cọc: Bên A hoàn trả 100% khoản cọc bảo lãnh (${formatNumberDots(depositCollateral)} VNĐ) cho Bên B ngay sau khi nhận lại trang phục nguyên vẹn.</p>

        <div class='clause-title'>ĐIỀU 3: CỌC BẢO LÃNH HOÀN TRẢ VÀ CAM KẾT HOÀN TIỀN 100%</div>
        <p>3.1. Tiền cọc bảo lãnh hoàn trả trang phục: <strong>${formatNumberDots(depositCollateral)} VNĐ</strong>.</p>
        <p>3.2. Bên A cam kết hoàn trả 100% khoản cọc bảo lãnh tự động vào tài khoản ngân hàng của Bên B trong vòng 24 giờ sau khi tiếp nhận lại trang phục nguyên vẹn.</p>

        <div class='clause-title'>ĐIỀU 4: BẢO HIỂM VẢI REN VÀ QUY ĐỊNH BẢO QUẢN</div>
        <p>4.1. Bên A tài trợ gói bảo hiểm làm sạch sinh học cao cấp: Miễn trừ trách nhiệm bồi thường đối với các vết bẩn bùn đất thông thường, vết rượu vang hay bụi sân khấu tiệc cưới.</p>
        <p>4.2. Bên B cam kết không tự ý đem lễ phục tới tiệm giặt ủi thông thường hoặc can thiệp cắt xén form dáng nguyên bản.</p>

        <div class='clause-title'>ĐIỀU 5: CHÍNH SÁCH ĐỔI NGÀY CƯỚI VÀ DỜI LỊCH</div>
        <p>5.1. Bên B được quyền thay đổi ngày thuê váy hoàn toàn miễn phí nếu thông báo cho Bên A trước tối thiểu 15 ngày so với ngày nhận dự kiến.</p>

        <div class='clause-title'>ĐIỀU 6: HIỆU LỰC PHÁP LÝ CHỮ KÝ SỐ</div>
        <p>6.1. Hợp đồng này được lập dưới dạng điện tử, có giá trị pháp lý đầy đủ và ràng buộc trách nhiệm song phương theo Luật Giao dịch điện tử số 20/2023/QH15.</p>

        <table style='width: 100%; margin-top: 35px;'>
          <tr>
            <td style='width: 50%; text-align: center; vertical-align: top;'>
              <strong>ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)</strong><br>
              <em>(Đã ký điện tử và đóng dấu mộc số)</em><br><br>
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
      content: 'Đang kết nối cổng Techcombank Napas 247 VÀ đối soát giao dịch chuyển khoản...',
      key: 'payment_confirm',
      duration: 1.8,
    });

    setTimeout(async () => {
      setIsVerifyingPayment(false);
      setIsSubmitting(true);

      const generatedOrderCode = effectiveOrderCode;
      const generatedContractCode = effectiveContractCode;

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
        selectedSize: selectedSize || orderItems?.[0]?.size || activeDress?.size || 'S',
        items: (orderItems && orderItems.length > 0 ? orderItems : [activeDress]).filter(Boolean).map((item, idx) => {
          const itemDailyPrice = Number(item.price || item.rentPrice) || 0;
          let rawItemSize = selectedSize || item.size || item.selectedSize || activeDress?.size || 'S';
          let cleanItemSize = String(rawItemSize).replace(/^size\s*[:\s-]*/i, '').trim();
          if (cleanItemSize.includes('-') || cleanItemSize.includes('/')) {
            cleanItemSize = cleanItemSize.split(/[-/]/)[0].replace(/^size\s*[:\s-]*/i, '').trim();
          }
          const parenIdx = cleanItemSize.indexOf('(');
          if (parenIdx > 0) {
            cleanItemSize = cleanItemSize.slice(0, parenIdx).trim();
          }
          if (!cleanItemSize || cleanItemSize.toLowerCase() === 'theo tư vấn') {
            cleanItemSize = 'S';
          }

          return {
            dressId: item.id || item._id,
            name: item.name,
            code: item.code || `UB-HC-2026-0${idx + 1}`,
            size: cleanItemSize,
            color: item.color || selectedColor || 'Trắng Sữa',
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
          localStorage.setItem('unibridal_order_ping', String(Date.now()));
          const bc = new BroadcastChannel('unibridal_channel');
          bc.postMessage({ type: 'order_created', order: savedOrder });
          bc.close();
        } catch (err) {
          // ignore storage errors
        }

        // Xóa giỏ hàng sau khi đặt thuê thành công
        try {
          clearCart();
          localStorage.removeItem('unibridal_cart');
          localStorage.removeItem('unibridal-rental-cart');
          window.dispatchEvent(new Event('unibridal-cart-updated'));
          window.dispatchEvent(new Event('unibridal_order_created'));
          window.dispatchEvent(new Event('unibridal_order_updated'));
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
      shippingAddress: address.trim() || 'Showroom UniBridal (26 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội)',
      contractCode: generatedContractCode,
      contractSignature: contractSignature || brideName || 'Cô Dâu UniBridal',
      measurements,
      depositOption,
      paymentMethod: 'vietqr',
      paymentStatus: 'pending_payment',
      rentalStartDate: toIsoDateString(rentalSchedule?.startDate) || new Date().toISOString().split('T')[0],
      rentalEndDate: toIsoDateString(rentalSchedule?.endDate) || new Date(Date.now() + (Number(rentalDays) || 4) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rentalDays,
      selectedSize: selectedSize || orderItems?.[0]?.size || activeDress?.size || 'S',
      items: (orderItems && orderItems.length > 0 ? orderItems : [activeDress]).filter(Boolean).map((item, idx) => {
        const itemDailyPrice = Number(item.price || item.rentPrice) || 0;
        return {
          dressId: item.id || item._id,
          name: item.name,
          code: item.code || `UB-HC-2026-0${idx + 1}`,
          size: selectedSize || item.size || activeDress?.size || 'S',
          color: (dressIdParam && selectedColor) ? selectedColor : (item.color || selectedColor || 'Trắng Sữa'),
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
      } catch { }

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

      const generatedOrderCode = effectiveOrderCode;
      const generatedContractCode = effectiveContractCode;

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
        shippingAddress: address.trim() || 'Showroom UniBridal (26 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội)',
        contractCode: generatedContractCode,
        contractSignature: contractSignature || brideName || 'Cô Dâu UniBridal',
        measurements,
        depositOption,
        paymentMethod: 'vietqr',
        paymentStatus: 'deposit_paid',
        rentalStartDate: toIsoDateString(rentalSchedule?.startDate) || new Date().toISOString().split('T')[0],
        rentalEndDate: toIsoDateString(rentalSchedule?.endDate) || new Date(Date.now() + (Number(rentalDays) || 4) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rentalDays,
        selectedSize: selectedSize || orderItems?.[0]?.size || activeDress?.size || 'S',
        items: (orderItems && orderItems.length > 0 ? orderItems : [activeDress]).filter(Boolean).map((item, idx) => {
          const itemDailyPrice = Number(item.price || item.rentPrice) || 0;
          let rawItemSize = selectedSize || item.size || item.selectedSize || activeDress?.size || 'S';
          let cleanItemSize = String(rawItemSize).replace(/^size\s*[:\s-]*/i, '').trim();
          if (cleanItemSize.includes('-') || cleanItemSize.includes('/')) {
            cleanItemSize = cleanItemSize.split(/[-/]/)[0].replace(/^size\s*[:\s-]*/i, '').trim();
          }
          const parenIdx = cleanItemSize.indexOf('(');
          if (parenIdx > 0) {
            cleanItemSize = cleanItemSize.slice(0, parenIdx).trim();
          }
          if (!cleanItemSize || cleanItemSize.toLowerCase() === 'theo tư vấn') {
            cleanItemSize = 'S';
          }

          return {
            dressId: item.id || item._id,
            name: item.name,
            code: item.code || `UB-HC-2026-0${idx + 1}`,
            size: cleanItemSize,
            color: item.color || selectedColor || 'Trắng Sữa',
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
          localStorage.setItem('unibridal_order_ping', String(Date.now()));
          const bc = new BroadcastChannel('unibridal_channel');
          bc.postMessage({ type: 'order_created', order: savedOrder });
          bc.close();
        } catch { }

        try {
          clearCart();
          localStorage.removeItem('unibridal_cart');
          localStorage.removeItem('unibridal-rental-cart');
          window.dispatchEvent(new Event('unibridal-cart-updated'));
          window.dispatchEvent(new Event('unibridal_order_created'));
          window.dispatchEvent(new Event('unibridal_order_updated'));
        } catch { }

        setIsSuccessModalOpen(true);
        message.success({
          content: `✓ [Sandbox Test]: Đã nhận thanh toán ${formatCurrencyVND(amountToPayToday)} qua VietQR Techcombank! Hợp đồng và Lịch thuê đã được kích hoạt.`,
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
              <span>3. Đặt cọc và Thanh toán</span>
            </button>

          </div>
        </div>

        {/* Two-Column Grid: Form Left và Sticky Order Summary Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">

            {/* ================= STEP 1: THÔNG TIN VÀ SỐ ĐO ================= */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-fade-in">

                {/* Banner cảnh báo hết hàng trong kho */}
                {hasOutOfStockItem && (
                  <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] p-5 rounded-2xl flex items-start gap-3 shadow-xs">
                    <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[14px] font-bold">Sản phẩm trong đơn thuê hiện đang TẠM HẾT HÀNG trong kho</div>
                      <div className="text-[12.5px] text-[#7F1D1D] mt-1 leading-relaxed">
                        Thiết kế bạn đang chọn hiện tại đã hết số lượng khả dụng trong kho hoặc đang được phục vụ kín lịch. Bạn không thể tiếp tục đặt cọc và ký hợp đồng thuê mẫu này. Vui lòng quay lại bộ sưu tập để chọn tác phẩm lễ phục khác.
                      </div>
                    </div>
                  </div>
                )}

                {/* 0. LỄ PHỤC ĐANG CHỌN & CHỌN SIZE TRỰC TIẾP TRONG BƯỚC 1 */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex items-center justify-between pb-4 border-b border-[#F5EDE8] mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#B8737D]">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-playfair text-[19px] sm:text-[21px] font-semibold text-[#2C2523] m-0">
                          Lễ Phục Đang Thuê & Kích Cỡ
                        </h2>
                        <p className="text-[12px] text-[#847374] m-0 mt-0.5">
                          Kiểm tra thông tin tác phẩm và chọn kích cỡ (Size) phù hợp nhất với vóc dáng của bạn
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-[#FCF9F6] p-4 rounded-xl border border-[#EEDECF]">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 border border-[#EEDECF] bg-white shadow-2xs">
                        <img
                          src={activeDress?.images?.[0] || activeDress?.image || '/assets/dresses/dress_01.jpg'}
                          alt={activeDress?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-playfair font-bold text-[16px] text-[#2C2523] truncate">
                          {activeDress?.name || 'Tác phẩm lễ phục cưới'}
                        </div>
                        <div className="text-[12px] text-[#847374] mt-0.5">
                          Mã: <span className="font-mono text-[#733F49] font-bold">{activeDress?.code || 'UB-HC-2026'}</span> • Giá niêm yết: <span className="font-bold text-[#733F49]">{formatCurrencyVND(activeDress?.price || totalRentPrice)}</span>
                        </div>
                        <div className="text-[11.5px] text-[#6B5C5D] mt-1 flex items-center gap-1.5 font-medium">
                          <span>Kích cỡ đang chọn:</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#733F49] text-white font-bold text-[11px] shadow-2xs">
                            Size {selectedSize}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bảng nút chọn size trực tiếp */}
                    {Array.isArray(activeDress?.sizes) && activeDress.sizes.length > 0 && (
                      <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0E5DC]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#733F49]">
                          ĐỔI KÍCH CỠ (SIZE):
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {activeDress.sizes.map((sz, sIdx) => {
                            const sVal = typeof sz === 'string' ? sz : sz.size || sz.label || sz.id;
                            const sClean = String(sVal).replace(/^size\s*/i, '').trim();
                            const isSzActive = (selectedSize || '').toUpperCase() === sClean.toUpperCase();
                            const isOutOfStock = checkIsSizeOutOfStock(sz, activeDress);

                            return (
                              <button
                                key={sIdx}
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => handleSelectSize(sClean)}
                                className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold border transition-all cursor-pointer ${
                                  isOutOfStock
                                    ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-40 line-through'
                                    : isSzActive
                                      ? 'bg-[#733F49] text-white border-[#733F49] shadow-sm ring-2 ring-[#733F49]/20'
                                      : 'bg-white text-[#733F49] border-[#EEDECF] hover:border-[#733F49] hover:bg-[#FAF4EE]'
                                }`}
                                title={isOutOfStock ? `Size ${sClean} hiện đã hết hàng` : `Chọn Size ${sClean}`}
                              >
                                Size {sClean}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

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
                      {/* Họ và tên */}
                      <div data-error={Boolean(formErrors.brideName)}>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          HỌ VÀ TÊN CÔ DÂU *
                        </label>
                        <input
                          type="text"
                          required
                          value={brideName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBrideName(val);
                            setContractSignature(val);
                            if (/\d/.test(val)) {
                              setFormErrors((prev) => ({ ...prev, brideName: 'Họ và tên không được chứa chữ số' }));
                            } else if (formErrors.brideName) {
                              setFormErrors((prev) => ({ ...prev, brideName: '' }));
                            }
                          }}
                          onBlur={() => {
                            const err = validateFullNameInput(brideName);
                            if (err) {
                              setFormErrors((prev) => ({ ...prev, brideName: err }));
                            } else if (formErrors.brideName) {
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
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => {
                            const rawVal = e.target.value;
                            const cleanVal = rawVal.replace(/[^\d]/g, '').slice(0, 10);
                            setPhone(cleanVal);
                            if (formErrors.phone) {
                              if (cleanVal.length === 10 && /^(0[2|3|5|7|8|9])[0-9]{8}$/.test(cleanVal)) {
                                setFormErrors((prev) => ({ ...prev, phone: '' }));
                              }
                            }
                          }}
                          onBlur={() => {
                            const err = validatePhoneInput(phone);
                            if (err) {
                              setFormErrors((prev) => ({ ...prev, phone: err }));
                            } else if (formErrors.phone) {
                              setFormErrors((prev) => ({ ...prev, phone: '' }));
                            }
                          }}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none transition-all ${formErrors.phone
                            ? 'border-2 border-red-400 bg-red-50/20 focus:border-red-500'
                            : 'bg-[#FCF9F6] border border-[#EEDECF] focus:border-[#733F49] focus:bg-white'
                            }`}
                          placeholder="Nhập số điện thoại liên hệ (10 chữ số)"
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
                          onBlur={() => {
                            const err = validateEmailInput(email);
                            if (err) {
                              setFormErrors((prev) => ({ ...prev, email: err }));
                            } else if (formErrors.email) {
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
                          maxLength={12}
                          value={cccd}
                          onChange={(e) => {
                            const rawVal = e.target.value;
                            const cleanVal = rawVal.replace(/[^\d]/g, '').slice(0, 12);
                            setCccd(cleanVal);
                            if (formErrors.cccd) {
                              if (cleanVal.length === 9 || cleanVal.length === 12) {
                                setFormErrors((prev) => ({ ...prev, cccd: '' }));
                              }
                            }
                          }}
                          onBlur={() => {
                            const err = validateCccdInput(cccd);
                            if (err) {
                              setFormErrors((prev) => ({ ...prev, cccd: err }));
                            } else if (formErrors.cccd) {
                              setFormErrors((prev) => ({ ...prev, cccd: '' }));
                            }
                          }}
                          className={`w-full rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none transition-all ${formErrors.cccd
                            ? 'border-2 border-red-400 bg-red-50/20 focus:border-red-500'
                            : 'bg-[#FCF9F6] border border-[#EEDECF] focus:border-[#733F49] focus:bg-white'
                            }`}
                          placeholder="Nhập số CCCD (12 số) hoặc CMND (9 số)"
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
                          if (formErrors.address && e.target.value.trim().length >= 5) {
                            setFormErrors((prev) => ({ ...prev, address: '' }));
                          }
                        }}
                        onBlur={() => {
                          const err = validateAddressInput(address);
                          if (err) {
                            setFormErrors((prev) => ({ ...prev, address: err }));
                          } else if (formErrors.address) {
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

                {/* 2. LỊCH TRÌNH THUÊ VÀ PHƯƠNG THỨC BÀN GIAO */}
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
                      <div className="relative flex items-center justify-between bg-white border border-[#EEDECF] rounded-xl px-3 py-2 cursor-pointer group hover:border-[#733F49] transition-colors">
                        <span className="text-[14px] font-bold text-[#2C2523]">
                          {toDisplayDateString(rentalSchedule.startDate) || 'Chọn ngày nhận'}
                        </span>
                        <Calendar className="w-4 h-4 text-[#8C7A7B] group-hover:text-[#733F49] transition-colors shrink-0" />
                        <input
                          type="date"
                          min={tomorrowIso}
                          value={toIsoDateString(rentalSchedule.startDate) || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSelectStartDate(e.target.value);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                      <div className="relative flex items-center justify-between bg-white border border-[#F2D8D4] rounded-xl px-3 py-2 cursor-pointer group hover:border-[#733F49] transition-colors shadow-2xs">
                        <span className="text-[14.5px] font-bold text-[#733F49]">
                          {toDisplayDateString(rentalSchedule.weddingDate) || 'Chọn ngày cưới'}
                        </span>
                        <Calendar className="w-4 h-4 text-[#733F49] transition-colors shrink-0" />
                        <input
                          type="date"
                          min={tomorrowIso}
                          value={toIsoDateString(rentalSchedule.weddingDate) || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSelectWeddingDate(e.target.value);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                      <div className="relative flex items-center justify-between bg-white border border-[#EEDECF] rounded-xl px-3 py-2 cursor-pointer group hover:border-[#733F49] transition-colors shadow-2xs">
                        <span className="text-[14px] font-bold text-[#2C2523]">
                          {toDisplayDateString(rentalSchedule.endDate) || 'Chọn ngày trả'}
                        </span>
                        <Calendar className="w-4 h-4 text-[#8C7A7B] group-hover:text-[#733F49] transition-colors shrink-0" />
                        <input
                          type="date"
                          min={toIsoDateString(rentalSchedule.startDate) || tomorrowIso}
                          value={toIsoDateString(rentalSchedule.endDate) || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSelectEndDate(e.target.value);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <span className="text-[10.5px] font-medium text-[#733F49] mt-1.5 flex items-center gap-1">
                        <span>✓</span> {rentalSchedule.endDate ? (
                          toIsoDateString(rentalSchedule.endDate) === toIsoDateString(rentalSchedule.weddingDate)
                            ? `Trả trước 20:00 (Cùng tối ngày cưới - Gói ${rentalDays} ngày)`
                            : `Trả trước 20:00 ngày ${toDisplayDateString(rentalSchedule.endDate)} (Gói ${rentalDays} ngày)`
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
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[12px] font-jakarta font-bold text-[#733F49]">
                              Tháng {calendarViewDate.getMonth() + 1}/{calendarViewDate.getFullYear()}
                            </span>
                            <span className="text-[10px] font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full border border-[#C8E6C9]">
                              ✓ Cập nhật theo đơn thực tế
                            </span>
                          </div>
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
                        const isPast = dateStr < todayIso;
                        const isToday = dateStr === todayIso;
                        const bookedInfo = getBookedInfoForDate(dateStr);
                        const isBooked = Boolean(bookedInfo);
                        const isStart = dateStr === startIso;
                        const isWedding = dateStr === weddingIso;
                        const isEnd = dateStr === endIso;
                        const isInRange = startIso && endIso && dateStr >= startIso && dateStr <= endIso;

                        // Chặn và làm mờ các ngày trong quá khứ
                        if (isPast) {
                          cells.push(
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => message.warning('Không thể chọn ngày trong quá khứ!')}
                              title="Ngày trong quá khứ (không khả dụng)"
                              className="relative h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-[12px] sm:text-[13px] font-medium transition-all bg-[#F8F5F2] text-[#C2B5B3] cursor-not-allowed opacity-50"
                            >
                              <span className="line-through decoration-[#C2B5B3]">{d}</span>
                            </button>
                          );
                          continue;
                        }

                        // Chặn ngày hôm nay: không cho phép nhận váy ngay hôm nay (cần tối thiểu 24h chuẩn bị)
                        if (isToday) {
                          cells.push(
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => message.warning(`Không thể đặt thuê nhận váy trong ngày hôm nay! Nàng vui lòng chọn ngày nhận từ ngày mai (${toDisplayDateString(tomorrowIso)}) trở đi để Atelier chuẩn bị lễ phục chu đáo.`)}
                              title={`Hôm nay (${toDisplayDateString(dateStr)}) - Cần tối thiểu 24h chuẩn bị lễ phục, vui lòng chọn từ ngày mai`}
                              className="relative h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-[12px] sm:text-[13px] font-medium transition-all bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E7EB] cursor-not-allowed opacity-75 hover:opacity-100"
                            >
                              <span className="line-through decoration-[#9CA3AF]">{d}</span>
                              <span className="text-[7.5px] font-bold leading-none text-[#6B7280] tracking-tight uppercase">
                                HÔM NAY
                              </span>
                            </button>
                          );
                          continue;
                        }

                        if (isBooked) {
                          const isMaintenance = bookedInfo?.actualEndDate && dateStr > bookedInfo.actualEndDate;
                          cells.push(
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => handleCalendarCellClick(dateStr)}
                              title={
                                isMaintenance
                                  ? `Ngày bảo trì & khử trùng lễ phục (${toDisplayDateString(dateStr)}) sau khi cô dâu trả váy`
                                  : `Ngày đã có cô dâu đặt thuê: ${bookedInfo.bride || 'Kín lịch'}`
                              }
                              className={`relative h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center text-[12px] sm:text-[13px] font-bold transition-all border cursor-not-allowed opacity-90 hover:opacity-100 ${isMaintenance
                                  ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]'
                                  : 'border-[#F8D7DA] bg-[#FDF2F0] text-[#B91C1C]'
                                }`}
                            >
                              <span className={`line-through ${isMaintenance ? 'decoration-[#B45309]/60' : 'decoration-[#B91C1C]/60'}`}>{d}</span>
                              <span className={`text-[7px] font-extrabold leading-none tracking-tight uppercase ${isMaintenance ? 'text-[#B45309]' : 'text-[#B91C1C]'}`}>
                                {isMaintenance ? 'BẢO TRÌ' : 'KÍN LỊCH'}
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

                          {/* Chú thích màu sắc trực quan trên lịch thuê */}
                          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mt-3 pt-3 border-t border-[#EEDECF]/70 text-[10.5px] sm:text-[11px] text-[#6B5C5D]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-md bg-[#2E7D32]" />
                              <span>Ngày nhận</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-md bg-[#733F49]" />
                              <span>Ngày cưới</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-md bg-[#847374]" />
                              <span>Ngày trả</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-md bg-[#FDF2F0] border border-[#F8D7DA]" />
                              <span className="text-[#B91C1C] font-semibold">Kín lịch</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-md bg-[#FFFBEB] border border-[#FDE68A]" />
                              <span className="text-[#B45309] font-semibold">Bảo trì</span>
                            </div>
                          </div>
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
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${deliveryMethod === 'direct'
                          ? 'border-[#733F49] bg-[#FAF3F0] ring-1 ring-[#733F49]'
                          : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white'
                          }`}
                      >
                        <div>
                          <span className="font-bold text-[13.5px] text-[#2C2523] block mb-1">
                            Nhận trực tiếp tại Showroom Atelier (Khuyên dùng)
                          </span>
                          <p className="text-[11.5px] text-[#6B5C5D] m-0 leading-relaxed">
                            Thử và căn chỉnh phom dáng chuẩn xác tại phòng VIP Showroom trước giờ trao nhận.
                          </p>
                        </div>
                        <div className="flex justify-end mt-2.5">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#2E7D32] text-white shadow-xs tracking-wider uppercase">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            MIỄN PHÍ
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => setDeliveryMethod('delivery')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${deliveryMethod === 'delivery'
                          ? 'border-[#733F49] bg-[#FAF3F0] ring-1 ring-[#733F49]'
                          : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white'
                          }`}
                      >
                        <div>
                          <span className="font-bold text-[13.5px] text-[#2C2523] block mb-1">
                            Giao váy tận nơi (VIP Courier)
                          </span>
                          <p className="text-[11.5px] text-[#6B5C5D] m-0 leading-relaxed">
                            Giao vali VIP Courier nguyên seal chống ẩm và móc gỗ bảo quản tận nhà cô dâu.
                          </p>
                        </div>
                        <div className="flex justify-end mt-2.5">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-gradient-to-r from-[#733F49] via-[#8C4654] to-[#733F49] text-white shadow-xs tracking-wider uppercase border border-[#B8737D]/30">
                            <Crown className="w-3.5 h-3.5 text-[#FFD700]" />
                            VIP COURIER
                          </span>
                        </div>
                      </div>
                    </div>


                  </div>
                </section>

                {/* 3. SỐ ĐO CƠ THỂ MAY ĐO VÀ TÙY CHỌN CONCIERGE */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#F5EDE8] mb-6 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#B8737D]">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-playfair text-[19px] sm:text-[21px] font-semibold text-[#2C2523] m-0">
                          Số Đo May Đo và Tinh Chỉnh Phom Váy
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
                        <Crown className="w-4 h-4" />
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
                    disabled={Boolean(scheduleConflict) || hasOutOfStockItem}
                    className={`w-full py-4 rounded-xl font-jakarta text-[14px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 border-0 ${scheduleConflict || hasOutOfStockItem
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                      : 'bg-[#733F49] hover:bg-[#5F323B] text-white shadow-[0_4px_16px_rgba(115,63,73,0.3)] hover:shadow-[0_6px_22px_rgba(115,63,73,0.4)] cursor-pointer active:scale-[0.99]'
                      }`}
                  >
                    {hasOutOfStockItem ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-stone-500" />
                        <span>SẢN PHẨM HẾT HÀNG TRONG KHO — KHÔNG THỂ THUÊ</span>
                      </>
                    ) : scheduleConflict ? (
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
                        <span>TIẾP TỤC: XEM VÀ KÝ HỢP ĐỒNG ĐIỆN TỬ (BƯỚC 2)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* ================= STEP 2: XEM VÀ KÝ HỢP ĐỒNG ĐIỆN TỬ ================= */}
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

                    {/* Quốc hiệu và Tiêu ngữ */}
                    <div className="text-center space-y-1 font-sans border-b border-[#E8DFD8] pb-5">
                      <p className="text-xs uppercase font-bold tracking-widest text-[#594B43]">
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                      </p>
                      <p className="text-xs italic text-[#7C695D]">Độc lập – Tự do – Hạnh phúc</p>
                      <div className="w-24 h-0.5 bg-[#C5A880] mx-auto my-3" />
                      <h2 className="text-lg sm:text-2xl font-bold font-serif text-[#2C2523] uppercase mt-2">
                        HỢP ĐỒNG THUÊ LỄ PHỤC CƯỚI CAO CẤP (HAUTE COUTURE)
                      </h2>
                      <p className="text-xs font-mono text-[#8C7A6B]">
                        Số: HĐĐT/{effectiveOrderCode} • Mã đơn hàng: <strong className="text-[#733F49]">#{effectiveOrderCode}</strong> • Mã HĐ: <strong className="text-[#733F49]">{effectiveContractCode}</strong>
                      </p>
                      <p className="text-[11px] text-[#847374] italic mt-0.5 font-sans">
                        Ngày lập hợp đồng: {new Date().toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    {/* Thông tin 2 bên ký kết hợp đồng */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans border border-[#EFE5E1] p-5 rounded-2xl bg-white shadow-2xs">
                      {/* Bên A: Showroom Atelier UniBridal */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[#733F49] font-bold text-[13px] uppercase pb-1.5 border-b border-[#F0E5DC]">
                          <Building2 size={16} />
                          <span>BÊN CHO THUÊ (BÊN A)</span>
                        </div>
                        <p>
                          <strong>Đơn vị:</strong> CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE
                        </p>
                        <p>
                          <strong>Đại diện:</strong> Ông Kim Xuân Hiếu — Tổng Giám Đốc Atelier
                        </p>
                        <p>
                          <strong>Địa chỉ Showroom:</strong> 26 Lý Thường Kiệt, P. Hàng Bài, Q. Hoàn Kiếm, Hà Nội
                        </p>
                        <p>
                          <strong>Hotline CSKH:</strong> 024 3936 8998 · <strong>Mã số thuế:</strong> 0317892026
                        </p>
                      </div>

                      {/* Bên B: Khách hàng thuê lễ phục */}
                      <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-[#F0E5DC] pt-3 md:pt-0 md:pl-4">
                        <div className="flex items-center gap-1.5 text-[#733F49] font-bold text-[13px] uppercase pb-1.5 border-b border-[#F0E5DC]">
                          <User size={16} />
                          <span>BÊN THUÊ LỄ PHỤC (BÊN B)</span>
                        </div>
                        <p>
                          <strong>Họ và tên khách hàng:</strong>{' '}
                          <span className="font-bold text-[#733F49] text-[13px]">{brideName}</span>
                        </p>
                        <p>
                          <strong>Số điện thoại:</strong> {phone}
                        </p>
                        <p>
                          <strong>Số CCCD / Hộ chiếu:</strong> {cccd}
                        </p>
                        <p>
                          <strong>Địa chỉ bàn giao:</strong> {address}
                        </p>
                      </div>
                    </div>

                    {/* Danh mục trang phục thuê và Thời gian thuê */}
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#733F49] uppercase mb-2 flex items-center gap-2">
                        <span>I. DANH MỤC TRANG PHỤC THUÊ VÀ THỜI GIAN SỬ DỤNG</span>
                      </h4>
                      <div className="overflow-x-auto border border-[#EFE5E1] rounded-2xl bg-white shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse font-sans">
                          <thead className="bg-[#FAF5F2] border-b border-[#EFE5E1] text-[#7A6A6B] font-bold">
                            <tr>
                              <th className="p-3">Tác Phẩm Lễ Phục</th>
                              <th className="p-3">Mã Số</th>
                              <th className="p-3">Kích Cỡ</th>
                              <th className="p-3 text-center">Thời Gian Thuê</th>
                              <th className="p-3 text-right">Tổng Tiền Thuê</th>
                              <th className="p-3 text-right">Tiền Cọc Bảo Lãnh</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F6EEEB]">
                            {contractItems.map((it, idx) => (
                              <tr key={idx} className="hover:bg-[#FCFAF8]">
                                <td className="p-3 font-semibold text-[#2C2523]">{it.name}</td>
                                <td className="p-3 font-mono font-bold text-[#733F49]">{it.code}</td>
                                <td className="p-3 font-bold text-[#87565C]">
                                  {it.size}
                                  {it.color && <span className="block text-[11px] font-normal text-[#6B5C5D] mt-0.5">Màu: {it.color}</span>}
                                </td>
                                <td className="p-3 text-center whitespace-nowrap">
                                  <span className="block text-[11.5px] text-[#8C4654] font-semibold mb-0.5">
                                    {rentalDays} ngày
                                  </span>
                                  <div className="text-xs">
                                    <span className="font-semibold text-[#733F49]">{it.startDate}</span>
                                    <span className="text-[#A39192] mx-1">→</span>
                                    <span className="font-semibold text-[#733F49]">{it.endDate}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-right font-bold text-[#733F49]">
                                  <div>{formatCurrencyVND(it.rentPrice)}</div>
                                  {Number(rentalDays) > 1 && (
                                    <div className="text-[10px] font-normal text-[#8A7978]">
                                      ({formatCurrencyVND(it.dailyPrice || Math.round(it.rentPrice / Number(rentalDays)))}/ngày)
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-right font-bold text-[#733F49]">
                                  {formatCurrencyVND(it.depositAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-[#FAF0EC]/60 border-t border-[#E8DFD8] font-bold text-xs">
                            <tr>
                              <td colSpan={4} className="p-3 text-right font-serif font-bold text-[#733F49]">
                                Tổng thanh toán & Ký quỹ cam kết:
                              </td>
                              <td colSpan={2} className="p-3 text-right font-mono font-bold text-base text-[#733F49]">
                                {formatCurrencyVND(totalRentPrice + depositCollateral)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Các điều khoản pháp lý tiêu chuẩn */}
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#733F49] uppercase mb-2">
                        II. CÁC ĐIỀU KHOẢN PHÁP LÝ VÀ QUY CHẾ THUÊ TRANG PHỤC HAUTE COUTURE
                      </h4>
                      <div className="space-y-3 font-sans text-xs">
                        {STANDARD_HAUTE_COUTURE_CLAUSES.map((clause, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-2xs">
                            <h5 className="font-bold text-sm text-[#2C2523] mb-1.5 font-serif">{clause.title}</h5>
                            <p className="text-[#69584D] leading-relaxed text-xs whitespace-pre-line">{clause.content}</p>
                          </div>
                        ))}
                      </div>

                      {/* Phụ lục 1: Bảng giá đền bù thiệt hại niêm yết đối chiếu */}
                      <div className="mt-4 pt-4 border-t border-[#EFE5E1]">
                        <h4 className="font-serif font-bold text-sm text-[#733F49] uppercase mb-2 flex items-center justify-between">
                          <span>PHỤ LỤC 1: BẢNG GIÁ ĐỀN BÙ THIỆT HẠI NIÊM YẾT ĐỐI CHIẾU</span>
                          <span className="text-[10px] font-sans font-normal text-[#8C7D7E] italic lowercase">
                            (Áp dụng chuẩn hóa theo Điều 5 Hợp đồng)
                          </span>
                        </h4>
                        <div className="overflow-x-auto border border-[#EFE5E1] rounded-2xl bg-white shadow-2xs">
                          <table className="w-full text-left text-xs border-collapse font-sans">
                            <thead className="bg-[#FAF5F2] border-b border-[#EFE5E1] text-[#7A6A6B] font-bold">
                              <tr>
                                <th className="p-2.5 w-[25%]">Nhóm Lỗi Hư Hại</th>
                                <th className="p-2.5 w-[45%]">Mô Tả Hiện Trạng</th>
                                <th className="p-2.5 w-[30%] text-right">Mức Phí Bồi Thường Cố Định</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F6EEEB] text-[11.5px]">
                              {DAMAGE_PRICE_CATALOG.map((row) => (
                                <tr key={row.id} className="hover:bg-[#FCFAF8]">
                                  <td className="p-2.5 font-bold text-[#2C2523]">{row.name}</td>
                                  <td className="p-2.5 text-[#5C4D4D]">{row.description}</td>
                                  <td className="p-2.5 text-right font-bold" style={{ color: row.color }}>
                                    {row.feeLabel}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Khối chữ ký điện tử hai bên */}
                    <div className="pt-6 border-t border-[#EFE5E1] grid grid-cols-1 md:grid-cols-2 gap-6 text-center text-xs font-sans">
                      {/* Chữ ký Bên A */}
                      <div className="p-4 rounded-2xl border border-[#EEDECF] bg-white flex flex-col items-center justify-between min-h-[200px] shadow-2xs">
                        <div>
                          <p className="font-bold uppercase text-[#733F49] tracking-wider text-[11px]">
                            ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
                          </p>
                          <p className="text-[#847374] text-[10px] italic mt-0.5">
                            CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE
                          </p>
                        </div>

                        <div className="my-2 flex flex-col items-center">
                          <img
                            src={HIEU_SIGNATURE_BASE64}
                            alt="Chữ ký Kim Xuân Hiếu"
                            className="h-16 w-auto object-contain select-none"
                          />
                          <div className="mt-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[9px] font-bold inline-flex items-center gap-1">
                            <ShieldCheck size={11} /> VERIFIED BY UNIBRIDAL CA
                          </div>
                        </div>

                        <div>
                          <strong className="block text-[#2C2523] text-[12px]">Ông Kim Xuân Hiếu</strong>
                          <span className="text-[10px] text-[#847374]">Tổng Giám Đốc Atelier UniBridal</span>
                        </div>
                      </div>

                      {/* Chữ ký Bên B */}
                      <div className="p-4 rounded-2xl border border-[#EEDECF] bg-white flex flex-col items-center justify-between min-h-[200px] shadow-2xs">
                        <div>
                          <p className="font-bold uppercase text-[#733F49] tracking-wider text-[11px]">
                            BÊN THUÊ LỄ PHỤC (BÊN B)
                          </p>
                          <p className="text-[#847374] text-[10px] italic mt-0.5">
                            XÁC NHẬN BẰNG CHỮ KÝ ĐIỆN TỬ
                          </p>
                        </div>

                        {/* Vùng Ký Tay hoặc Gõ Tên của Khách */}
                        <div className="w-full my-1">
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
                                onClick={() => {
                                  setSignatureMode('type');
                                  const existing = contractSignature && !contractSignature.startsWith('data:image') ? contractSignature : brideName;
                                  if (existing) setContractSignature(existing);
                                }}
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
                              <div className="relative w-full h-24 bg-[#FCFAF8] rounded-xl border border-[#D4AF37]/40 shadow-inner overflow-hidden flex items-center justify-center">
                                {!hasDrawnSignature && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#C5A880] select-none text-[11px] font-playfair italic px-4 text-center">
                                    ✍️ Nàng ký tay vào đây bằng chuột hoặc cảm ứng
                                  </div>
                                )}
                                <canvas
                                  ref={signatureCanvasRef}
                                  width={480}
                                  height={96}
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
                              <div className="flex items-center justify-between text-[10.5px] px-1">
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
                            <div className="space-y-1">
                              <div className="h-20 flex flex-col items-center justify-center bg-[#FCFAF8] rounded-xl border border-[#D4AF37]/40 p-2">
                                <div className="font-playfair italic font-bold text-[20px] text-[#733F49]">
                                  {contractSignature && !contractSignature.startsWith('data:image') ? contractSignature : brideName}
                                </div>
                              </div>
                              <input
                                type="text"
                                value={contractSignature && !contractSignature.startsWith('data:image') ? contractSignature : (brideName || '')}
                                onChange={(e) => setContractSignature(e.target.value)}
                                placeholder="Nhập họ tên cô dâu xác thực chữ ký"
                                className="w-full text-center bg-white border border-[#D4AF37]/40 rounded-lg px-2 py-1 text-[11.5px] font-semibold text-[#733F49] focus:outline-none focus:border-[#733F49]"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <strong className="block text-[#2C2523] text-[12px]">{brideName}</strong>
                          <span className="text-[10px] text-[#847374]">CCCD/Hộ chiếu: {cccd}</span>
                        </div>
                      </div>
                    </div>

                    {/* Paper Footer */}
                    <div className="pt-4 border-t border-[#EFE7E0] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#9E8B89] italic">
                      <span>* Hợp đồng điện tử được lưu trữ an toàn và mã hóa theo tiêu chuẩn UniBridal Secure Cloud</span>
                      <span>Mã đơn hàng: #{effectiveOrderCode} • Mã HĐ: {effectiveContractCode}</span>
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
                    <span>KÝ HỢP ĐỒNG VÀ CHUYỂN SANG THANH TOÁN (BƯỚC 3)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

            {/* ================= STEP 3: ĐẶT CỌC VÀ THANH TOÁN ================= */}
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
                        Quét mã VietQR liên ngân hàng Napas 24/7 tức thì, hệ thống tự động xác nhận đơn cọc và khóa lịch
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
                            NGÂN HÀNG THỤ HƯỞNG VÀ CHỦ TÀI KHOẢN
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



                    {/* VietQR Test Sandbox Card */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FAF0EC] via-[#FFF8F6] to-[#FAF0EC] border-2 border-dashed border-[#D4AF37] relative overflow-hidden shadow-xs animate-fade-in">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#FAF0EC] border border-[#D4AF37] text-[#854D0E] flex items-center justify-center shrink-0 shadow-xs">
                            <Crown className="w-5 h-5 text-[#854D0E]" />
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
                      {orderItems.map((item, idx) => {
                        const itemSizes = Array.isArray(item.sizes) && item.sizes.length > 0
                          ? item.sizes
                          : ['XS', 'S', 'M', 'L'];
                        let curRawSize = String(item.size || selectedSize || 'S').replace(/^size\s*[:\s-]*/i, '').trim();
                        if (curRawSize.includes('-') || curRawSize.includes('/')) {
                          curRawSize = curRawSize.split(/[-/]/)[0].replace(/^size\s*[:\s-]*/i, '').trim();
                        }
                        if (curRawSize.indexOf('(') > 0) {
                          curRawSize = curRawSize.slice(0, curRawSize.indexOf('(')).trim();
                        }
                        const curSize = curRawSize || 'S';

                        return (
                          <div key={item.id || idx} className="flex gap-2.5 items-center bg-[#FAF4EE]/70 p-2.5 rounded-xl border border-[#F0E5DC]">
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
                              <div className="text-[10.5px] text-[#847374] mt-1 flex items-center gap-1.5 flex-wrap">
                                <span>Mã: <strong className="font-mono text-[#733F49]">{item.code || `UB-HC-2026-0${idx + 1}`}</strong></span>
                                <span>•</span>
                                <span>Size:</span>
                                <div className="inline-flex gap-1 items-center">
                                  {itemSizes.map((sz, sIdx) => {
                                    const sVal = typeof sz === 'object' ? (sz.size || sz.label) : sz;
                                    const sClean = String(sVal).replace(/^size\s*[:\s-]*/i, '').trim();
                                    const isAct = curSize.toUpperCase() === sClean.toUpperCase();
                                    return (
                                      <button
                                        key={sIdx}
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setOrderItems((prev) =>
                                            prev.map((it, i) => (i === idx ? { ...it, size: sClean } : it))
                                          );
                                        }}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                          isAct
                                            ? 'bg-[#733F49] text-white border-[#733F49] shadow-2xs'
                                            : 'bg-white text-[#733F49] border-[#EEDECF] hover:border-[#733F49]'
                                        }`}
                                      >
                                        {sClean}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-1 text-[11px]">
                                <span className="text-[#847374]">Thuê ({rentalDays} ngày): <strong className="text-[#733F49] font-bold">{formatCurrencyVND((Number(item.price || item.rentPrice) || 0) * rentalDays)}</strong></span>
                                <span className="text-[#847374]">Cọc: <strong>{formatCurrencyVND(item.deposit || item.depositAmount || 15000000)}</strong></span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                      <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-[#FAF4EE] border border-[#F0E5DC] text-[10.5px] text-[#6B5C5D] flex-wrap">
                        <span>Size: <strong>{selectedSize}</strong></span>
                        <span>•</span>
                        <span>Gói <strong>{rentalDays} ngày</strong></span>
                      </div>
                      <div className="font-jakarta font-extrabold text-[17px] text-[#733F49] mt-2 tabular-nums tracking-tight">
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

              {/* 4. Ticket Lower Section: Breakdown và Amount To Pay (Ghim cố định ở đáy vé, LUÔN HIỂN THỊ TRƯỚC MẮT) */}
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
                    <span>Dịch vụ giặt sấy và may đo:</span>
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

      {/* ================= SUCCESS MODAL (HOÀN TẤT ĐẶT THUÊ VÀ HỢP ĐỒNG ĐÃ KÝ) ================= */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-[620px] max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#EEDECF] p-6 sm:p-7 text-center space-y-4.5">

            <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-[2px] text-[#D4AF37] block mb-1">
                ★ ĐƠN ĐẶT THUÊ <strong className="font-mono font-black text-[#733F49] text-[13px] tracking-normal">#{createdOrder?.orderCode || 'UB-2026-0001'}</strong> ĐÃ KÍCH HOẠT ★
              </span>
              <h2 className="font-playfair text-[22px] sm:text-[28px] font-bold text-[#2C2523] m-0 mb-1.5">
                Khóa Lịch Đặt Thuê Thành Công!
              </h2>
            </div>

            {/* Contract Ticket Voucher */}
            <div className="bg-[#FAF4EE] p-5 rounded-2xl border border-[#EEDECF] text-left text-[12.5px] space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#EEDECF]">
                <span className="text-[#847374] font-medium">Mã Đơn Hàng:</span>
                <strong className="font-mono font-black text-[#733F49] text-[16px] tracking-wider">{createdOrder?.orderCode || 'UB-2026-0001'}</strong>
              </div>

              {/* Dress Details */}
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-[#847374] font-medium shrink-0">Trang phục đặt thuê:</span>
                <strong className="text-[#2C2523] text-right">
                  {orderItems && orderItems.length > 1
                    ? orderItems.map((i) => `${i.name} (Size ${i.size || selectedSize})`).join(' • ')
                    : `${activeDress?.name || 'Váy cưới Haute Couture'} (Size ${selectedSize || 'S'})`}
                </strong>
              </div>

              <div className="space-y-2 pt-1 border-t border-[#EEDECF]/60">
                <div className="flex items-center justify-between">
                  <span className="text-[#847374]">Thời gian nhận:</span>
                  <strong className="text-[#2C2523]">{rentalSchedule?.startDate || 'Chưa chọn'} — {rentalSchedule?.endDate || 'Chưa chọn'}</strong>
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
                  <span className="inline-flex items-center gap-1 font-bold text-[#2E7D32] text-[11.5px] bg-[#E8F5E9] px-2.5 py-1 rounded-md border border-[#C8E6C9]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                    Chuyển khoản VietQR 24/7 Techcombank (Đã đối soát)
                  </span>
                </div>

                {/* Chi tiết tài chính & Số tiền đã cọc */}
                <div className="pt-2.5 pb-1 border-t border-[#EEDECF]/60 space-y-1.5 bg-[#FAF0EC]/60 -mx-1 px-3 py-2.5 rounded-xl border border-[#F2D8D4]">
                  <div className="flex items-center justify-between text-[#847374] text-[12px]">
                    <span>Tổng tiền thuê lễ phục:</span>
                    <strong className="text-[#2C2523]">
                      {formatCurrencyVND(createdOrder?.totalRentPrice ?? totalRentPrice)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[#847374] text-[12px]">
                    <span>Tiền cọc bảo lãnh (Hoàn 100% khi trả):</span>
                    <strong className="text-[#2C2523]">
                      {formatCurrencyVND(createdOrder?.totalDeposit ?? depositCollateral)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-dashed border-[#EEDECF]">
                    <span className="text-[#733F49] font-bold text-[13px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Số tiền đã cọc (Thanh toán thành công):
                    </span>
                    <strong className="text-[#2E7D32] font-extrabold text-[16px]">
                      {formatCurrencyVND(createdOrder?.depositPaidAmount ?? createdOrder?.totalPayment ?? amountToPayToday)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* LỘ TRÌNH CHĂM SÓC LỄ PHỤC (POST-BOOKING JOURNEY TIMELINE - 3 GIAI ĐOẠN) */}
            <div className="bg-[#FCF9F6] p-5 rounded-2xl border border-[#EEDECF] text-left">
              <span className="text-[11px] font-bold text-[#733F49] uppercase tracking-wider block mb-3">
                ✦ LỘ TRÌNH CHĂM SÓC LỄ PHỤC CỦA NÀNG (3 GIAI ĐOẠN)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11.5px]">
                <div className="bg-white p-3 rounded-xl border border-[#E8F5E9] shadow-2xs">
                  <span className="text-[10px] font-bold text-[#2E7D32] block mb-1">GIAI ĐOẠN 1: HÔM NAY</span>
                  <strong className="text-[#2C2523] block mb-0.5">Khóa Lịch Độc Quyền</strong>
                  <span className="text-[#847374] block leading-tight">Hợp đồng điện tử đã ký có hiệu lực pháp lý</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#F2D8D4] shadow-2xs">
                  <span className="text-[10px] font-bold text-[#733F49] block mb-1">BÀN GIAO TRƯỚC 1 NGÀY ({rentalSchedule?.startDate || 'Theo lịch'})</span>
                  <strong className="text-[#2C2523] block mb-0.5">Bàn Giao Vali VIP</strong>
                  <span className="text-[#847374] block leading-tight">Bàn giao trước 1 ngày, nguyên seal chống ẩm và quà tặng găng tay</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#EEDECF] shadow-2xs">
                  <span className="text-[10px] font-bold text-[#847374] block mb-1">GIAI ĐOẠN 3: {rentalSchedule?.endDate || 'Khi hoàn tất'}</span>
                  <strong className="text-[#2C2523] block mb-0.5">Hoàn Trả và Giải Ngân</strong>
                  <span className="text-[#847374] block leading-tight">Hoàn cọc 100% qua tài khoản trong 24h</span>
                </div>
              </div>

              {/* Đề xuất từ Atelier: Nên chọn lịch thử váy để vừa vặn hơn */}
              <div className="mt-3.5 p-3.5 rounded-xl bg-[#FFF8F3] border border-[#F2D8D4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF0EC] text-[#733F49] flex items-center justify-center shrink-0 border border-[#F2D8D4] mt-0.5 sm:mt-0">
                    <Calendar className="w-4 h-4 text-[#733F49]" />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#733F49] flex items-center gap-1.5">
                      <span>💡 Đề xuất từ Atelier UniBridal:</span>
                    </div>
                    <div className="text-[11.5px] text-[#6B5C5D] leading-relaxed mt-0.5">
                      Nàng nên chủ động đặt lịch thử váy tại Showroom trước ngày cưới để chuyên viên may đo căn chỉnh eo và chiều dài vừa vặn hoàn hảo nhất với vóc dáng của bạn.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    const params = new URLSearchParams();
                    const targetDress = (orderItems && orderItems[0]) || activeDress;
                    const dressId = targetDress?._id || targetDress?.id || targetDress?.code || dressIdParam || '';
                    if (dressId) params.set('dressId', dressId);
                    if (targetDress?.name) params.set('dressName', targetDress.name);
                    if (effectiveOrderCode) params.set('orderCode', effectiveOrderCode);
                    if (rentalSchedule?.startDate) {
                      params.set('rentalStartDate', rentalSchedule.startDate);
                      const suggested = calculateSuggestedFittingDate(rentalSchedule.startDate);
                      if (suggested) params.set('suggestedDate', suggested);
                    }
                    if (rentalSchedule?.endDate) params.set('rentalEndDate', rentalSchedule.endDate);
                    if (rentalSchedule?.weddingDate) params.set('weddingDate', rentalSchedule.weddingDate);
                    if (selectedSize) params.set('size', selectedSize);
                    if (brideName) params.set('fullName', brideName);
                    if (phone) params.set('phone', phone);
                    if (email) params.set('email', email);
                    navigate(`/appointment?${params.toString()}`);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white text-[12px] font-bold shrink-0 transition-colors cursor-pointer border-0 shadow-sm whitespace-nowrap text-center"
                >
                  Đặt Lịch Thử Váy Ngay
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const shareText = `Anh yêu ơi, em đã đặt thuê thành công ${orderItems && orderItems.length > 1 ? `${orderItems.length} tác phẩm váy cưới` : `tác phẩm váy cưới ${activeDress?.name || 'Haute Couture'}`} tại UniBridal cho ngày cưới ${rentalSchedule?.weddingDate || rentalSchedule?.startDate || 'hôn lễ'}! Mã đơn hàng: ${createdOrder?.orderCode || 'UB-2026-0001'}. Cùng xem với em nhé: ${window.location.href}`;
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
                className="w-full sm:w-auto p-3 rounded-xl bg-[#FAF0EC] border border-[#F2D8D4] hover:bg-[#F2DDD9] text-[#733F49] text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Chia sẻ tin vui cho Chú Rể"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleOpenPdfContract}
                className="w-full sm:w-auto px-4.5 py-3 rounded-xl bg-white border border-[#EEDECF] hover:bg-[#FAF0EC] text-[#733F49] text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
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

      {/* Modal Hợp Đồng Đã Ký Đồng Bộ Chuẩn Haute Couture */}
      {isViewContractModalOpen && (
        <SignedContractModal
          order={createdOrder || {
            orderCode: effectiveOrderCode,
            contractCode: effectiveContractCode,
            customerName: brideName,
            customerPhone: phone,
            customerCccd: cccd,
            customerEmail: email,
            shippingAddress: address,
            items: contractItems,
            totalRentPrice,
            totalDeposit: depositCollateral,
            totalPayment: totalRentPrice + depositCollateral,
            rentalDays,
            rentalStartDate: rentalSchedule?.startDate,
            rentalEndDate: rentalSchedule?.endDate,
            contractSignature: contractSignature || brideName,
            status: 'deposit_paid',
          }}
          onClose={() => setIsViewContractModalOpen(false)}
        />
      )}

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
