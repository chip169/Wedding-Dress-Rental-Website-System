import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  Calendar,
  ConfigProvider,
  Modal,
  Tag,
  Tooltip,
  Empty,
  Spin,
  message,
  Table,
} from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { CalendarDays,
  Crown,
  RotateCcw,
  Clock,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShoppingBag,
  ArrowRight,
  Filter,
  Search,
  Calendar as CalendarIcon,
  Building2,
  Users,
  Mail,
  XCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  LayoutGrid,
  PhoneCall,
  CheckCheck,
  AlertTriangle,
  HeartHandshake,
  MessageSquare,
  RefreshCw,
  PackageCheck,
  Truck,
  History,
} from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAppointmentsApi,
  updateAppointmentStatusApi,
  SHOWROOM_BRANCHES,
  APPOINTMENT_EVENT,
} from '../../services/appointmentService';
import { getAllOrdersAdmin } from '../../services/orderService';
import { formatCurrencyVND } from '../../utils/formatCurrency';
import { formatShortDate } from '../../utils/formatDate';

// Thiết lập locale tiếng Việt cho Dayjs
dayjs.locale('vi');

// Trích xuất giờ bắt đầu chuẩn xác từ chuỗi "18:30 — 20:00" hoặc "18:30 - 20:00"
const extractStartTime = (timeSlot) => {
  if (!timeSlot) return '';
  const parts = String(timeSlot).split(/[\u2014\u2013-]/);
  return (parts[0] || '').trim();
};

// Trích xuất tên ngắn gọn hiển thị trên thẻ lịch (ví dụ: "Phạm Hương Ly" -> "Hương Ly")
const extractDisplayName = (fullName) => {
  if (!fullName) return 'Cô dâu';
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length <= 2) return fullName;
  return parts.slice(-2).join(' ');
};

// Chuẩn hóa trạng thái lịch hẹn: chỉ có 'confirmed' và 'completed'
const normalizeAptStatus = (st) => {
  const s = (st || '').toLowerCase();
  if (s === 'completed') return 'completed';
  if (s === 'cancelled') return 'cancelled';
  return 'confirmed';
};

// Định dạng địa chỉ khách hàng (hỗ trợ cả dạng string và object)
const formatAddress = (addr) => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr.trim();
  if (typeof addr === 'object') {
    const parts = [addr.street, addr.ward, addr.district, addr.city].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }
  return String(addr);
};



// Chuẩn hóa định dạng YYYY-MM-DD
const toDateKey = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Trợ giúp định dạng nhãn trạng thái chính xác theo nghiệp vụ database
const getEventBadge = (item) => {
  if (!item) return { label: 'ĐANG XỬ LÝ', className: 'bg-gray-100 text-gray-700 border-gray-300' };

  if (item.type === 'fitting') {
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    return {
      label: isCompleted ? 'CÓ MẶT' : isCancelled ? 'VẮNG MẶT' : 'ĐÃ XÁC NHẬN',
      className: isCompleted
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
        : isCancelled
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-sky-100 text-sky-800 border-sky-300',
    };
  }

  // Sự kiện Giao Váy: Vàng (khách sắp lấy / sắp giao), Xanh (khách đã lấy / ship đã giao), Đỏ (chưa đến lấy / chưa giao)
  if (item.type === 'delivery') {
    const isDone = ['delivered', 'renting', 'returned', 'completed', 'waiting_refund'].includes((item.status || '').toLowerCase()) || Boolean(item.actualDeliveryDate);
    const deliveryDateKey = item.deliveryDate || item.date;
    const todayKey = toDateKey(new Date());
    const isExpress = item.deliveryMethod === 'express';

    if (isDone) {
      return {
        label: isExpress ? 'SHIP ĐÃ GIAO' : 'KHÁCH ĐÃ LẤY',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    if (deliveryDateKey && deliveryDateKey < todayKey) {
      return {
        label: isExpress ? 'CHƯA GIAO' : 'CHƯA ĐẾN LẤY',
        className: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    }
    return {
      label: isExpress ? 'SẮP GIAO' : 'KHÁCH SẮP LẤY',
      className: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  }

  // Sự kiện Trả Váy: Vàng (sắp đến hạn / tương lai), Xanh (đã trả), Đỏ (quá hạn chưa trả)
  if (item.type === 'return') {
    const isDone = item.status === 'completed' || item.status === 'returned' || item.status === 'waiting_refund' || Boolean(item.actualReturnDate);
    const returnDateKey = item.date || toDateKey(item.rentalEndDate);
    const todayKey = toDateKey(new Date());

    if (isDone) {
      return {
        label: 'ĐÃ TRẢ',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    }
    if (returnDateKey && returnDateKey < todayKey) {
      return {
        label: 'CHƯA TRẢ',
        className: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    }
    return {
      label: 'SẮP ĐẾN HẠN',
      className: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  }

  const st = (item.status || '').toLowerCase();
  switch (st) {
    case 'deposit_paid':
      return { label: 'ĐÃ CỌC (CHỜ GIAO)', className: 'bg-sky-100 text-sky-800 border-sky-300' };
    case 'preparing':
      return { label: 'ĐANG CHUẨN BỊ', className: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'delivered':
      return { label: 'ĐÃ BÀN GIAO', className: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    case 'renting':
      return { label: 'ĐANG THUÊ', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'returned':
      return { label: 'ĐÃ TRẢ (CHỜ KIỂM ĐỊNH)', className: 'bg-rose-100 text-rose-800 border-rose-300' };
    case 'completed':
      return { label: 'HOÀN TẤT ĐƠN', className: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'cancelled':
      return { label: 'ĐÃ HỦY', className: 'bg-gray-100 text-gray-700 border-gray-300' };
    default:
      return { label: (st || 'ĐANG XỬ LÝ').toUpperCase(), className: 'bg-gray-100 text-gray-700 border-gray-300' };
  }
};

// Component hiển thị danh sách sự kiện trên từng ô ngày của Lịch Biểu
// Hỗ trợ hiển thị đầy đủ 1-3 lịch, và tự động kích hoạt cuộn + nút mũi tên lướt xuống khi có từ 4 lịch trở lên
// Hỗ trợ làm nổi bật ĐỒNG THỜI cả ngày Giao & ngày Trả khi click vào đơn thuê
function CalendarDateCellEvents({
  dayApts = [],
  dayDeliveries = [],
  dayReturns = [],
  showApts = true,
  showDeliveries = true,
  showReturns = true,
  activeOrderCode = null,
  onSelectEvent,
  onSelectOrderHighlight,
}) {
  const scrollRef = React.useRef(null);
  const [canScrollDown, setCanScrollDown] = React.useState(false);
  const [canScrollUp, setCanScrollUp] = React.useState(false);

  // Gộp tất cả các sự kiện hợp lệ hiển thị trong ô ngày
  const items = React.useMemo(() => {
    const list = [];
    if (showApts) {
      dayApts.forEach((item) => list.push({ ...item, eventCategory: 'apt' }));
    }
    if (showDeliveries) {
      dayDeliveries.forEach((item) => list.push({ ...item, eventCategory: 'delivery' }));
    }
    if (showReturns) {
      dayReturns.forEach((item) => list.push({ ...item, eventCategory: 'return' }));
    }
    return list;
  }, [dayApts, dayDeliveries, dayReturns, showApts, showDeliveries, showReturns]);

  const total = items.length;
  const isScrollable = total > 3;

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 4);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4);
  }, []);

  React.useEffect(() => {
    checkScroll();
  }, [items.length, checkScroll]);

  if (total === 0) return null;

  return (
    <div className="relative flex flex-col h-full w-full">
      {/* Danh sách các sự kiện trong ô */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className={`space-y-1 mt-0.5 px-0.5 ${
          isScrollable
            ? 'max-h-[76px] overflow-y-auto custom-mini-scrollbar pr-0.5'
            : 'overflow-hidden'
        }`}
      >
        {items.map((item, idx) => {
          if (item.eventCategory === 'apt') {
            const startTime = extractStartTime(item.timeSlot);
            const displayName = extractDisplayName(item.customerName);
            const isConfirmed = item.status === 'confirmed';
            const isCompleted = item.status === 'completed';
            const isCancelled = item.status === 'cancelled';

            const badgeBg = isCompleted
              ? 'bg-emerald-50/90 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              : isCancelled
              ? 'bg-rose-50/90 text-rose-900 border-rose-300 hover:bg-rose-100'
              : 'bg-sky-50/90 text-sky-900 border-sky-300 hover:bg-sky-100';

            const dotBg = isCompleted
              ? 'bg-emerald-500'
              : isCancelled
              ? 'bg-rose-500'
              : 'bg-sky-500';

            const statusText = isCompleted ? 'Có mặt' : isCancelled ? 'Vắng mặt' : 'Đã xác nhận';

            return (
              <Tooltip key={item.id || `apt-${idx}`} title={`👗 Thử váy: ${item.customerName} (${item.timeSlot}) — ${statusText}`}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent?.(item);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10.5px] font-medium border shadow-2xs transition-all hover:scale-[1.01] cursor-pointer ${badgeBg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotBg}`} />
                  <span className="font-mono text-[9.5px] font-bold text-gray-900 shrink-0">
                    {startTime}
                  </span>
                </div>
              </Tooltip>
            );
          }

          if (item.eventCategory === 'delivery') {
            const isDone = ['delivered', 'renting', 'returned', 'completed', 'waiting_refund'].includes((item.status || '').toLowerCase()) || Boolean(item.actualDeliveryDate);
            const isHighlight = Boolean(activeOrderCode && (item.code === activeOrderCode || item.id === activeOrderCode));
            const isExpress = item.deliveryMethod === 'express';
            const deliveryDateKey = item.deliveryDate || item.date;
            const currentTodayKey = toDateKey(new Date());

            const isOverdue = !isDone && Boolean(deliveryDateKey && deliveryDateKey < currentTodayKey);
            const isFutureOrToday = !isDone && (!deliveryDateKey || deliveryDateKey >= currentTodayKey);

            let deliveryBadgeBg = '';
            let deliveryDotBg = '';
            let deliveryTextColor = '';

            if (isDone) {
              // Xanh là khách đã lấy, hoặc ship đã giao
              deliveryBadgeBg = 'bg-emerald-50/90 border-emerald-300 hover:bg-emerald-100';
              deliveryDotBg = 'bg-emerald-500';
              deliveryTextColor = 'text-emerald-950 font-bold';
            } else if (isFutureOrToday) {
              // Vàng là khách sắp lấy
              deliveryBadgeBg = 'bg-amber-50/90 border-amber-300 hover:bg-amber-100';
              deliveryDotBg = 'bg-amber-500';
              deliveryTextColor = 'text-amber-950 font-bold';
            } else {
              // Đỏ là khách chưa đến lấy hoặc nhân viên chưa giao
              deliveryBadgeBg = 'bg-rose-50/90 border-rose-300 hover:bg-rose-100';
              deliveryDotBg = 'bg-rose-500';
              deliveryTextColor = 'text-rose-950 font-bold';
            }

            return (
              <Tooltip
                key={`del-${item.id || idx}`}
                title={
                  <div className="text-xs space-y-1">
                    <div>Khách hàng: <strong>{item.customerName}</strong></div>
                    <div>
                      Trạng thái: <strong>{isDone ? (isExpress ? 'Ship đã giao' : 'Khách đã lấy') : isFutureOrToday ? (isExpress ? 'Sắp giao' : 'Khách sắp lấy') : (isExpress ? 'Chưa giao' : 'Chưa đến lấy')}</strong>
                    </div>
                    {item.rentalStartDate && (
                      <div className="text-amber-200">
                        Thuê chính thức: <strong>{formatShortDate(item.rentalStartDate)}</strong>
                      </div>
                    )}
                  </div>
                }
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectOrderHighlight?.(item);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-medium border shadow-2xs transition-all cursor-pointer ${
                    isHighlight
                      ? isDone
                        ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-xs'
                        : isFutureOrToday
                        ? 'bg-amber-600 text-white border-amber-500 font-bold shadow-xs'
                        : 'bg-rose-600 text-white border-rose-500 font-bold shadow-xs'
                      : `${deliveryBadgeBg} hover:scale-[1.02]`
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isHighlight ? 'bg-white' : deliveryDotBg
                    }`}
                  />
                  <span
                    className={`font-mono text-[9px] shrink-0 uppercase tracking-tight flex items-center gap-0.5 ${
                      isHighlight ? 'font-extrabold text-white' : deliveryTextColor
                    }`}
                  >
                    {isExpress ? 'NV SHIP' : 'KHÁCH LẤY'}
                  </span>
                </div>
              </Tooltip>
            );
          }

          // Trả Váy (return)
          const isDone = item.status === 'completed' || item.status === 'returned' || item.status === 'waiting_refund' || Boolean(item.actualReturnDate);
          const isHighlight = Boolean(activeOrderCode && (item.code === activeOrderCode || item.id === activeOrderCode));
          const isExpress = item.deliveryMethod === 'express';
          const returnDateKey = item.date || toDateKey(item.rentalEndDate);
          const currentTodayKey = toDateKey(new Date());

          const isOverdue = !isDone && Boolean(returnDateKey && returnDateKey < currentTodayKey);
          const isFutureOrToday = !isDone && (!returnDateKey || returnDateKey >= currentTodayKey);

          let returnBadgeBg = '';
          let returnDotBg = '';
          let returnTextColor = '';

          if (isDone) {
            // Xanh là đã trả
            returnBadgeBg = 'bg-emerald-50/90 border-emerald-300 hover:bg-emerald-100';
            returnDotBg = 'bg-emerald-500';
            returnTextColor = 'text-emerald-950 font-bold';
          } else if (isFutureOrToday) {
            // Vàng là sắp đến hạn trả hoặc các ngày trong tương lai
            returnBadgeBg = 'bg-amber-50/90 border-amber-300 hover:bg-amber-100';
            returnDotBg = 'bg-amber-500';
            returnTextColor = 'text-amber-950 font-bold';
          } else {
            // Đỏ là chưa trả
            returnBadgeBg = 'bg-rose-50/90 border-rose-300 hover:bg-rose-100';
            returnDotBg = 'bg-rose-500';
            returnTextColor = 'text-rose-950 font-bold';
          }

          return (
            <Tooltip
              key={`ret-${item.id || idx}`}
              title={
                <div className="text-xs space-y-1">
                  <div>Khách hàng: <strong>{item.customerName}</strong></div>
                  <div>
                    Trạng thái: <strong>{isDone ? 'Đã trả' : isFutureOrToday ? 'Sắp đến hạn' : 'Chưa trả'}</strong>
                  </div>
                </div>
              }
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOrderHighlight?.(item);
                }}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-medium border shadow-2xs transition-all cursor-pointer ${
                  isHighlight
                    ? isDone
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-xs'
                      : isFutureOrToday
                      ? 'bg-amber-600 text-white border-amber-500 font-bold shadow-xs'
                      : 'bg-rose-600 text-white border-rose-500 font-bold shadow-xs'
                    : `${returnBadgeBg} hover:scale-[1.02]`
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isHighlight ? 'bg-white' : returnDotBg
                  }`}
                />
                <span
                  className={`font-mono text-[9px] shrink-0 uppercase tracking-tight flex items-center gap-0.5 ${
                    isHighlight ? 'font-extrabold text-white' : returnTextColor
                  }`}
                >
                  {isExpress ? 'NV LẤY' : 'KHÁCH TRẢ'}
                </span>
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* Dấu mũi tên lướt xuống để báo hiệu còn nhiều lịch chưa hiện lên */}
      {isScrollable && (
        <div className="pt-0.5 mt-0.5">
          {canScrollDown ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (scrollRef.current) {
                  scrollRef.current.scrollBy({ top: 32, behavior: 'smooth' });
                }
              }}
              className="w-full h-3.5 bg-[#FFF2EE] hover:bg-[#FDE2D9] text-[#733F49] border border-[#F5CDC3] rounded-md flex items-center justify-center transition-all cursor-pointer select-none group shadow-2xs"
              title="Còn lịch hẹn khác bên dưới — Bấm hoặc cuộn chuột để xem"
            >
              <ChevronDown size={12} className="stroke-[2.2] text-[#733F49] animate-bounce group-hover:translate-y-0.5 transition-transform" />
            </button>
          ) : canScrollUp ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="w-full h-3.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-md flex items-center justify-center transition-all cursor-pointer select-none group shadow-2xs"
              title="Đã xem hết — Bấm để cuộn lên đầu ô"
            >
              <ChevronUp size={12} className="stroke-[2.2] group-hover:-translate-y-0.5 transition-transform" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function ScheduleOverviewPage({ defaultTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tự động nhận diện phân hệ đang truy cập: Admin vs Staff để điều hướng đúng màn hình
  const isStaffContext =
    location.pathname.startsWith('/staff') ||
    (user?.role === 'staff' && !location.pathname.startsWith('/admin'));
  const orderBasePath = isStaffContext ? '/staff/don-thue' : '/admin/don-thue';

  // Tab chính điều hướng: 'calendar' (Lịch Biểu Showroom) | 'history' (Lịch Sử Thử Váy)
  const [activeMainTab, setActiveMainTab] = useState(
    searchParams.get('tab') === 'history' ? 'history' : 'calendar'
  );

  const handleMainTabChange = (tabKey) => {
    setActiveMainTab(tabKey);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tabKey === 'calendar') {
        next.delete('tab');
      } else {
        next.set('tab', tabKey);
      }
      return next;
    });
  };

  // Bộ lọc cho Tab Lịch Sử Thử Váy
  const [historySearch, setHistorySearch] = useState('');
  const [historyBranch, setHistoryBranch] = useState('hcm-q1');

  // Sub-filter trong Tab Lịch Biểu: 'all' | 'fitting' (Thử váy) | 'delivery' (Giao váy) | 'return' (Trả váy)
  const [calendarFilterType, setCalendarFilterType] = useState('all');
  const [calendarBranchFilter, setCalendarBranchFilter] = useState('hcm-q1');
  // Lọc hình thức giao váy: 'all' (Tất cả) | 'showroom' (Khách đến lấy) | 'express' (Nhân viên ship tận nơi)
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState('all');
  // Lọc hình thức trả váy: 'all' (Tất cả) | 'showroom' (Khách đến trả) | 'express' (Nhân viên đến lấy)
  const [returnMethodFilter, setReturnMethodFilter] = useState('all');

  // Dữ liệu
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Quản lý làm nổi bật ĐỒNG THỜI cả ngày Giao & ngày Trả của cùng một đơn hàng
  const [highlightedOrderCode, setHighlightedOrderCode] = useState(null);

  // Quản lý kéo co giãn kích thước & thu gọn/mở rộng bảng Chi Tiết Ngày Được Chọn
  const splitContainerRef = useRef(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('unibridal_schedule_right_panel_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 320 && parsed <= 900) return parsed;
      }
    }
    return 480;
  });
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('unibridal_schedule_right_panel_collapsed') === 'true';
    }
    return false;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 1024;
    return true;
  });

  const handleToggleRightPanel = useCallback(() => {
    setIsRightPanelCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('unibridal_schedule_right_panel_collapsed', String(next));
      } catch (_) {}
      return next;
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDownResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = isRightPanelCollapsed ? 320 : rightPanelWidth;
    let hasMoved = false;

    setIsDragging(true);

    const handleMouseMove = (moveEvent) => {
      const deltaX = startX - moveEvent.clientX;
      if (Math.abs(deltaX) > 4) {
        hasMoved = true;
        if (isRightPanelCollapsed) {
          setIsRightPanelCollapsed(false);
          try {
            localStorage.setItem('unibridal_schedule_right_panel_collapsed', 'false');
          } catch (_) {}
        }
      }

      let newWidth = startWidth + deltaX;

      const containerWidth = splitContainerRef.current?.offsetWidth || 1200;
      // Đảm bảo lịch tháng bên trái luôn còn ít nhất 380px
      const maxAllowed = Math.max(340, Math.min(850, containerWidth - 380));
      const minAllowed = 320;

      newWidth = Math.max(minAllowed, Math.min(newWidth, maxAllowed));
      setRightPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      if (!hasMoved) {
        // Người dùng click vào nút mũi tên mà không kéo chuột -> Toggle Mở / Thu gọn
        handleToggleRightPanel();
      } else {
        setRightPanelWidth((curr) => {
          try {
            localStorage.setItem('unibridal_schedule_right_panel_width', String(curr));
          } catch (_) {}
          return curr;
        });
      }
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Lấy dữ liệu cả Lịch Hẹn Thử Váy và Đơn Thuê
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resApt, resOrd] = await Promise.all([
        getAppointmentsApi({ limit: 1000 }).catch(() => ({ data: [] })),
        getAllOrdersAdmin({ limit: 1000 }).catch(() => ({ orders: [] })),
      ]);

      const aptList = Array.isArray(resApt?.data)
        ? resApt.data
        : resApt?.data?.data || [];
      setAppointments(aptList);

      const ordList = Array.isArray(resOrd?.orders)
        ? resOrd.orders
        : Array.isArray(resOrd?.data)
        ? resOrd.data
        : Array.isArray(resOrd)
        ? resOrd
        : [];
      setOrders(ordList);
    } catch (err) {
      console.error('Lỗi tải dữ liệu lịch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener(APPOINTMENT_EVENT, fetchData);
    return () => window.removeEventListener(APPOINTMENT_EVENT, fetchData);
  }, [fetchData]);

  // Cập nhật trạng thái lịch hẹn (Xác nhận, Hoàn tất, Hủy)
  const handleUpdateAppointmentStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateAppointmentStatusApi(id, newStatus);
      const statusText =
        newStatus === 'confirmed'
          ? 'Đã xác nhận'
          : newStatus === 'completed'
          ? 'Đã ghi nhận khách CÓ MẶT thử váy'
          : 'Đã ghi nhận khách VẮNG MẶT';
      message.success(`Cập nhật thành công: "${statusText}"`);

      // Cập nhật local state ngay lập tức để giao diện phản hồi mượt mà
      setAppointments((prev) =>
        prev.map((a) => {
          if ((a._id || a.id) === id) {
            return { ...a, status: newStatus };
          }
          return a;
        })
      );

      // Nếu đang xem modal chi tiết, cập nhật luôn modal
      if (selectedEvent && selectedEvent.id === id) {
        setSelectedEvent((prev) => ({ ...prev, status: newStatus }));
      }
    } catch {
      message.error('Không thể cập nhật trạng thái. Vui lòng thử lại!');
    } finally {
      setUpdatingId(null);
    }
  };

  // Chuẩn hóa định dạng YYYY-MM-DD
  const toDateKey = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayKey = toDateKey(new Date());
  const selectedDateKey = toDateKey(selectedDate);

  // Đơn hàng đang được làm nổi bật chu kỳ Giao - Trả
  const activeOrderCode = highlightedOrderCode;
  const activeHighlightOrder = useMemo(() => {
    if (!activeOrderCode) return null;
    return orders.find(
      (o) => (o.orderCode || o.contractCode || o._id || o.id) === activeOrderCode
    ) || null;
  }, [activeOrderCode, orders]);

  const highlightStartDateKey = useMemo(() => {
    if (!activeHighlightOrder?.rentalStartDate) return null;
    const d = new Date(activeHighlightOrder.rentalStartDate);
    d.setDate(d.getDate() - 1);
    return toDateKey(d);
  }, [activeHighlightOrder]);
  const highlightEndDateKey = activeHighlightOrder ? toDateKey(activeHighlightOrder.rentalEndDate) : null;

  // Danh sách sự kiện thử váy map theo ngày:
  // Nếu ca thử đã hoàn tất và ngày thử đã qua trong quá khứ (trước hôm nay), ẩn khỏi lịch biểu (chỉ hiện lịch thử từ hôm nay trở đi)
  const appointmentsByDate = useMemo(() => {
    const map = {};
    appointments.forEach((apt) => {
      const st = (apt.status || '').toLowerCase();
      // Bỏ qua ca hẹn đã hủy
      if (st === 'cancelled') return;

      const key = toDateKey(apt.appointmentDate);
      if (!key) return;

      // Nếu lịch thử đã hoàn tất và qua ngày hôm sau thì không cần hiện lịch sử thử váy
      if (key < todayKey && st === 'completed') return;

      if (!map[key]) map[key] = [];
      map[key].push({
        type: 'fitting',
        id: apt._id || apt.id,
        code: apt.appointmentCode || 'APT',
        customerName: apt.customerName || apt.fullName || 'Cô dâu',
        phone: apt.customerPhone || apt.phone,
        email: apt.customerEmail || apt.email,
        timeSlot: apt.timeSlot || '09:00 — 11:00',
        guestsCount: apt.guestsCount || 2,
        branch: apt.branch || apt.branchId || 'hcm-q1',
        status: normalizeAptStatus(apt.status),
        notes: apt.notes,
        interestedDresses: apt.interestedDresses || apt.selectedDresses || [],
        weddingDate: apt.weddingDate,
        date: key,
      });
    });
    return map;
  }, [appointments, todayKey]);

  // Danh sách các đơn thuê còn hiệu lực (loại bỏ các đơn đã bị hủy trước khi thuê)
  const activeOrders = useMemo(
    () => orders.filter((o) => (o.status || '').toLowerCase() !== 'cancelled'),
    [orders]
  );

  // Lọc danh sách lịch hẹn theo chi nhánh (Lọc riêng từng cơ sở & loại bỏ các ca đã hoàn tất trong quá khứ)
  const calendarVisibleAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchBranch = (a.branch || a.branchId || 'hcm-q1') === calendarBranchFilter;
      if (!matchBranch) return false;

      const st = (a.status || '').toLowerCase();
      if (st === 'cancelled') return false;

      const key = toDateKey(a.appointmentDate);
      // Nếu lịch thử đã hoàn tất và qua ngày hôm sau thì không cần hiện lịch sử thử váy
      if (key && key < todayKey && st === 'completed') {
        return false;
      }

      return true;
    });
  }, [appointments, calendarBranchFilter, todayKey]);

  // Toàn bộ đơn thuê còn hiệu lực của chi nhánh hiện tại
  const calendarBranchOrders = useMemo(() => {
    return activeOrders.filter(
      (o) => (o.branch || o.branchId || 'hcm-q1') === calendarBranchFilter
    );
  }, [activeOrders, calendarBranchFilter]);

  // Đếm đơn khách đến lấy trực tiếp tại showroom
  const showroomDeliveriesCount = useMemo(() => {
    return calendarBranchOrders.filter(
      (o) => (o.deliveryMethod || 'showroom') === 'showroom'
    ).length;
  }, [calendarBranchOrders]);

  // Đếm đơn nhân viên giao váy tận nơi
  const expressDeliveriesCount = useMemo(() => {
    return calendarBranchOrders.filter(
      (o) => (o.deliveryMethod || 'showroom') === 'express'
    ).length;
  }, [calendarBranchOrders]);

  // Đếm đơn khách đến trả trực tiếp tại showroom
  const showroomReturnsCount = useMemo(() => {
    return calendarBranchOrders.filter(
      (o) => (o.deliveryMethod || 'showroom') === 'showroom'
    ).length;
  }, [calendarBranchOrders]);

  // Đếm đơn nhân viên đến lấy (thu hồi tận nơi)
  const expressReturnsCount = useMemo(() => {
    return calendarBranchOrders.filter(
      (o) => (o.deliveryMethod || 'showroom') === 'express'
    ).length;
  }, [calendarBranchOrders]);

  // Đơn giao hiển thị sau khi lọc theo hình thức nhận/giao
  const calendarVisibleActiveOrders = useMemo(() => {
    if (deliveryMethodFilter === 'all') return calendarBranchOrders;
    return calendarBranchOrders.filter(
      (o) => (o.deliveryMethod || 'showroom') === deliveryMethodFilter
    );
  }, [calendarBranchOrders, deliveryMethodFilter]);

  // Danh sách sự kiện bàn giao / nhận váy: LÙI 1 NGÀY trước ngày khách bắt đầu thuê
  // (Do showroom giao sớm 1 ngày hoặc khách đến showroom lấy sớm 1 ngày để thử và chuẩn bị)
  const deliveriesByDate = useMemo(() => {
    const map = {};
    orders.forEach((ord) => {
      // Đơn hàng đã hủy trước khi thuê thì không phát sinh lịch giao
      if ((ord.status || '').toLowerCase() === 'cancelled') return;

      const startDate = ord.rentalStartDate ? new Date(ord.rentalStartDate) : null;
      if (!startDate || isNaN(startDate.getTime())) return;

      // Lùi về 1 ngày trước khi khách bắt đầu thuê
      const deliveryDate = new Date(startDate);
      deliveryDate.setDate(deliveryDate.getDate() - 1);

      const key = toDateKey(deliveryDate);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push({
        type: 'delivery',
        id: ord._id || ord.id,
        code: ord.orderCode || ord.contractCode || 'UB-ORD',
        customerName: ord.customerName || ord.brideName || 'Cô dâu',
        phone: ord.customerPhone || ord.phone,
        status: (ord.status || 'deposit_paid').toLowerCase(),
        items: ord.items || [],
        totalDeposit: ord.totalDeposit || 0,
        totalRentPrice: ord.totalRentPrice || 0,
        deliveryDate: key,
        rentalStartDate: ord.rentalStartDate,
        rentalEndDate: ord.rentalEndDate,
        deliveryMethod: ord.deliveryMethod || 'showroom',
        shippingAddress: ord.shippingAddress || ord.customerAddress || ord.address || '',
        notes: ord.notes,
        date: key,
        branch: ord.branch || ord.branchId || 'hcm-q1',
      });
    });
    return map;
  }, [orders]);

  // Danh sách sự kiện trả váy map theo ngày hạn trả (rentalEndDate)
  const returnsByDate = useMemo(() => {
    const map = {};
    orders.forEach((ord) => {
      // Đơn hàng đã hủy trước khi thuê thì không phát sinh lịch trả váy
      if ((ord.status || '').toLowerCase() === 'cancelled') return;

      const key = toDateKey(ord.rentalEndDate);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push({
        type: 'return',
        id: ord._id || ord.id,
        code: ord.orderCode || ord.contractCode || 'UB-ORD',
        customerName: ord.customerName || ord.brideName || 'Cô dâu',
        phone: ord.customerPhone || ord.phone,
        status: (ord.status || 'renting').toLowerCase(),
        items: ord.items || [],
        totalDeposit: ord.totalDeposit || 0,
        totalRentPrice: ord.totalRentPrice || 0,
        rentalStartDate: ord.rentalStartDate,
        rentalEndDate: ord.rentalEndDate,
        actualReturnDate: ord.actualReturnDate,
        inspection: ord.inspection,
        deliveryMethod: ord.deliveryMethod || 'showroom',
        shippingAddress: ord.shippingAddress || ord.customerAddress || ord.address || '',
        notes: ord.notes,
        date: key,
        branch: ord.branch || ord.branchId || 'hcm-q1',
      });
    });
    return map;
  }, [orders]);

  // Thống kê nhanh theo đúng cơ sở đang chọn từ MongoDB
  const stats = useMemo(() => {
    const branchAptsToday = (appointmentsByDate[todayKey] || []).filter(
      (a) => (a.branch || a.branchId || 'hcm-q1') === calendarBranchFilter
    );
    const branchDeliveriesToday = (deliveriesByDate[todayKey] || []).filter(
      (d) => (d.branch || d.branchId || 'hcm-q1') === calendarBranchFilter
    );
    const branchReturnsToday = (returnsByDate[todayKey] || []).filter(
      (r) => (r.branch || r.branchId || 'hcm-q1') === calendarBranchFilter
    );

    const todayFittings = branchAptsToday.length;
    const todayDeliveries = branchDeliveriesToday.length;
    const todayReturns = branchReturnsToday.length;

    const branchAppointments = appointments.filter(
      (a) => (a.branch || a.branchId || 'hcm-q1') === calendarBranchFilter
    );
    const branchOrders = activeOrders.filter(
      (o) => (o.branch || o.branchId || 'hcm-q1') === calendarBranchFilter
    );

    const pendingAppointments = branchAppointments.filter(
      (a) => (a.status || 'pending').toLowerCase() === 'pending'
    ).length;
    const confirmedAppointments = branchAppointments.filter(
      (a) => (a.status || '').toLowerCase() === 'confirmed'
    ).length;
    const completedAppointments = branchAppointments.filter(
      (a) => (a.status || '').toLowerCase() === 'completed'
    ).length;
    const activeRentals = branchOrders.filter((o) =>
      ['renting', 'delivered', 'preparing', 'deposit_paid'].includes((o.status || '').toLowerCase())
    ).length;
    const totalReturns = branchOrders.filter((o) =>
      ['renting', 'delivered', 'returned'].includes((o.status || '').toLowerCase())
    ).length;

    return {
      todayFittings,
      todayDeliveries,
      todayReturns,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      totalAppointments: branchAppointments.length,
      totalOrders: branchOrders.length,
      activeRentals,
      totalReturns,
    };
  }, [
    appointmentsByDate,
    deliveriesByDate,
    returnsByDate,
    todayKey,
    appointments,
    activeOrders,
    calendarBranchFilter,
  ]);

  // Lọc danh sách Lịch Sử Thử Váy (theo từ khóa tìm kiếm và chi nhánh)
  const historyAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        const name = (apt.customerName || apt.fullName || '').toLowerCase();
        const phone = apt.customerPhone || apt.phone || '';
        const code = (apt.appointmentCode || apt._id || apt.id || '').toLowerCase();
        const search = historySearch.trim().toLowerCase();

        const matchSearch =
          !search || name.includes(search) || phone.includes(search) || code.includes(search);

        const branch = apt.branch || apt.branchId || 'hcm-q1';
        const matchBranch = branch === historyBranch;

        return matchSearch && matchBranch;
      })
      .sort((a, b) => {
        const dateA = a.appointmentDate ? new Date(a.appointmentDate).getTime() : 0;
        const dateB = b.appointmentDate ? new Date(b.appointmentDate).getTime() : 0;
        return dateB - dateA;
      });
  }, [appointments, historySearch, historyBranch]);

  // Cấu hình cột hiển thị cho Bảng Lịch Sử Thử Váy
  const historyColumns = [
    {
      title: 'MÃ HẸN',
      dataIndex: 'appointmentCode',
      key: 'code',
      width: 125,
      render: (code, record) => (
        <span className="font-mono font-bold text-xs text-[#733F49] bg-[#FAF0EC] px-2 py-0.5 rounded border border-[#F2D8D4]">
          {code || record._id?.slice(-6)?.toUpperCase() || 'APT'}
        </span>
      ),
    },
    {
      title: 'KHÁCH HÀNG',
      key: 'customer',
      width: 210,
      render: (_, record) => {
        const phone = record.customerPhone || record.phone;
        const email = record.customerEmail || record.email;
        return (
          <div className="space-y-0.5">
            <div className="font-bold text-gray-900 text-xs sm:text-sm font-playfair">
              {record.customerName || record.fullName || 'Cô dâu'}
            </div>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1 text-[11px] text-[#733F49] hover:underline font-semibold"
              >
                <Phone className="w-3 h-3 text-[#733F49]" />
                <span>{phone}</span>
              </a>
            )}
            {email && (
              <div className="text-[10.5px] text-gray-400 truncate max-w-[180px]">
                {email}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'NGÀY & GIỜ HẸN',
      key: 'datetime',
      width: 180,
      render: (_, record) => {
        const dateStr = record.appointmentDate
          ? dayjs(record.appointmentDate).format('DD/MM/YYYY')
          : record.date || '---';
        const dateKey = toDateKey(record.appointmentDate || record.date);
        const isPast = dateKey && dateKey < todayKey;
        const isToday = dateKey === todayKey;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <Clock className="w-3.5 h-3.5 text-[#733F49]" />
              <span>{record.timeSlot || '09:00 — 11:00'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
              <span>{dateStr}</span>
              {isToday ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                  Hôm nay
                </span>
              ) : isPast ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  Đã qua
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-medium">
                  Sắp tới
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'CƠ SỞ SHOWROOM',
      dataIndex: 'branch',
      key: 'branch',
      width: 175,
      render: (branch, record) => {
        const b = branch || record.branchId;
        const isHn = b === 'hn-hoankiem';
        return (
          <div className="text-xs space-y-0.5">
            <div className="font-semibold text-gray-800 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#BA7A83] shrink-0" />
              <span>{isHn ? 'Hoàn Kiếm, HN' : 'Quận 1, TP.HCM'}</span>
            </div>
            <div className="text-[11px] text-gray-500 font-normal">
              📍 {isHn ? '26 Lý Thường Kiệt' : '88 Nam Kỳ Khởi Nghĩa'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'LỄ PHỤC QUAN TÂM',
      key: 'dresses',
      render: (_, record) => {
        const dresses = record.interestedDresses || record.selectedDresses || [];
        if (!dresses || dresses.length === 0) {
          return <span className="text-gray-400 text-xs italic">Tư vấn trực tiếp tại showroom</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[240px]">
            {dresses.map((d, i) => (
              <span
                key={i}
                className="text-[10.5px] px-2 py-0.5 bg-[#FAF0EC] text-[#733F49] rounded-md border border-[#F2D8D4] font-medium"
              >
                👗 {d.name || d}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: 'THAO TÁC',
      key: 'actions',
      width: 175,
      render: (_, record) => {
        const st = (record.status || '').toLowerCase();
        const id = record._id || record.id;
        const isBusy = updatingId === id;

        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedEvent({
                  type: 'fitting',
                  id,
                  code: record.appointmentCode || 'APT',
                  customerName: record.customerName || record.fullName || 'Cô dâu',
                  phone: record.customerPhone || record.phone,
                  email: record.customerEmail || record.email,
                  timeSlot: record.timeSlot || '09:00 — 11:00',
                  branch: record.branch || record.branchId || 'hcm-q1',
                  status: record.status,
                  notes: record.notes,
                  interestedDresses: record.interestedDresses || record.selectedDresses || [],
                  weddingDate: record.weddingDate,
                  date: toDateKey(record.appointmentDate),
                });
                setDetailModalOpen(true);
              }}
              className="p-1.5 rounded-lg bg-gray-50 hover:bg-[#FAF0EC] text-gray-600 hover:text-[#733F49] border border-gray-200 transition cursor-pointer"
              title="Xem chi tiết ca thử"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {st !== 'completed' && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleUpdateAppointmentStatus(id, 'completed')}
                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Ghi nhận khách có mặt thử váy"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Có Mặt</span>
              </button>
            )}

            {st !== 'cancelled' && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleUpdateAppointmentStatus(id, 'cancelled')}
                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Ghi nhận khách vắng mặt"
              >
                <XCircle className="w-3 h-3 text-rose-600" />
                <span>Vắng Mặt</span>
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Sự kiện của ngày được chọn trên lịch (Lọc riêng từng cơ sở & hình thức giao)
  const currentDayEvents = useMemo(() => {
    const apts = appointmentsByDate[selectedDateKey] || [];
    const deliveries = deliveriesByDate[selectedDateKey] || [];
    const returns = returnsByDate[selectedDateKey] || [];

    const filteredApts = apts.filter(
      (a) => (a.branch || a.branchId || 'hcm-q1') === calendarBranchFilter
    );

    const filteredDeliveries = deliveries.filter((d) => {
      const matchBranch = (d.branch || d.branchId || 'hcm-q1') === calendarBranchFilter;
      const matchMethod =
        deliveryMethodFilter === 'all' || (d.deliveryMethod || 'showroom') === deliveryMethodFilter;
      return matchBranch && matchMethod;
    });

    const filteredReturns = returns.filter((r) => {
      const matchBranch = (r.branch || r.branchId || 'hcm-q1') === calendarBranchFilter;
      const matchMethod =
        returnMethodFilter === 'all' || (r.deliveryMethod || 'showroom') === returnMethodFilter;
      return matchBranch && matchMethod;
    });

    if (calendarFilterType === 'fitting') return filteredApts;
    if (calendarFilterType === 'delivery') return filteredDeliveries;
    if (calendarFilterType === 'return') return filteredReturns;

    return [...filteredApts, ...filteredDeliveries, ...filteredReturns];
  }, [
    appointmentsByDate,
    deliveriesByDate,
    returnsByDate,
    selectedDateKey,
    calendarFilterType,
    calendarBranchFilter,
    deliveryMethodFilter,
    returnMethodFilter,
  ]);

  // Render nội dung từng ô ngày trên lịch Ant Design (Lọc riêng từng cơ sở & hình thức giao)
  const dateCellRender = (dateObj) => {
    const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    const key = toDateKey(d);

    const dayApts = appointmentsByDate[key] || [];
    const dayDeliveries = deliveriesByDate[key] || [];
    const dayReturns = returnsByDate[key] || [];

    const showApts = calendarFilterType === 'all' || calendarFilterType === 'fitting';
    const showDeliveries = calendarFilterType === 'all' || calendarFilterType === 'delivery';
    const showReturns = calendarFilterType === 'all' || calendarFilterType === 'return';

    const visibleApts = dayApts.filter(
      (a) => (a.branch || a.branchId || 'hcm-q1') === calendarBranchFilter
    );

    const visibleDeliveries = dayDeliveries.filter((d) => {
      const matchBranch = (d.branch || d.branchId || 'hcm-q1') === calendarBranchFilter;
      const matchMethod =
        deliveryMethodFilter === 'all' || (d.deliveryMethod || 'showroom') === deliveryMethodFilter;
      return matchBranch && matchMethod;
    });

    const visibleReturns = dayReturns.filter((r) => {
      const matchBranch = (r.branch || r.branchId || 'hcm-q1') === calendarBranchFilter;
      const matchMethod =
        returnMethodFilter === 'all' || (r.deliveryMethod || 'showroom') === returnMethodFilter;
      return matchBranch && matchMethod;
    });

    const totalEvents =
      (showApts ? visibleApts.length : 0) +
      (showDeliveries ? visibleDeliveries.length : 0) +
      (showReturns ? visibleReturns.length : 0);
    if (totalEvents === 0) return null;

    return (
      <CalendarDateCellEvents
        dayApts={visibleApts}
        dayDeliveries={visibleDeliveries}
        dayReturns={visibleReturns}
        showApts={showApts}
        showDeliveries={showDeliveries}
        showReturns={showReturns}
        activeOrderCode={calendarFilterType === 'all' ? activeOrderCode : null}
        onSelectEvent={(item) => {
          setSelectedEvent(item);
          setDetailModalOpen(true);
        }}
        onSelectOrderHighlight={(item) => {
          if (calendarFilterType !== 'all') return;
          const targetCode = item.code || item.id;
          setHighlightedOrderCode((prev) => (prev === targetCode ? null : targetCode));
        }}
      />
    );
  };

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#733F49',
          borderRadius: 14,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      }}
    >
      {/* Scope CSS tùy biến giao diện Lịch theo chuẩn Haute Couture UniBridal */}
      <style>{`
        .unibridal-luxury-calendar .ant-picker-content th {
          color: #733F49 !important;
          font-weight: 700 !important;
          font-size: 11.5px !important;
          letter-spacing: 0.5px !important;
          padding-bottom: 10px !important;
          border-bottom: 1px solid #F4EBE8 !important;
        }
        .unibridal-luxury-calendar .ant-picker-calendar-date {
          border: 1px solid #F1E5E2 !important;
          border-radius: 14px !important;
          margin: 3px !important;
          min-height: 122px !important;
          background: #FFFFFF !important;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.015) !important;
          display: flex !important;
          flex-direction: column !important;
        }
        .unibridal-luxury-calendar .ant-picker-calendar-date:hover {
          border-color: #BA7A83 !important;
          background: #FFFDFD !important;
          box-shadow: 0 4px 16px rgba(115, 63, 73, 0.08) !important;
        }
        .unibridal-luxury-calendar .ant-picker-calendar-date-value {
          padding: 4px 8px 1px 8px !important;
          line-height: 1.2 !important;
        }
        .unibridal-luxury-calendar .ant-picker-calendar-date-content {
          flex: 1 1 auto !important;
          height: auto !important;
          max-height: 98px !important;
          overflow: visible !important;
          padding: 0 2px 2px 2px !important;
        }
        /* Custom scrollbar siêu nhỏ cho ô lịch */
        .custom-mini-scrollbar::-webkit-scrollbar {
          width: 3.5px;
        }
        .custom-mini-scrollbar::-webkit-scrollbar-track {
          background: #FAF3F0;
          border-radius: 4px;
        }
        .custom-mini-scrollbar::-webkit-scrollbar-thumb {
          background: #D8B7AE;
          border-radius: 4px;
        }
        .custom-mini-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #733F49;
        }
        /* Ô ĐƯỢC CHỌN (SELECTED CELL): KHÔNG BỊ XÁM ĐEN MÙ MỊT NỮA */
        .unibridal-luxury-calendar .ant-picker-cell-selected .ant-picker-calendar-date {
          background: #FFF5F2 !important;
          border: 2px solid #733F49 !important;
          box-shadow: 0 6px 20px rgba(115, 63, 73, 0.16) !important;
        }
        .unibridal-luxury-calendar .ant-picker-cell-selected .ant-picker-calendar-date-value {
          color: #733F49 !important;
          font-weight: 800 !important;
          font-size: 15px !important;
        }
        /* Ô HÔM NAY (TODAY) */
        .unibridal-luxury-calendar .ant-picker-calendar-date-today {
          border-color: #D4AF37 !important;
          background: #FFFEFB !important;
        }
        .unibridal-luxury-calendar .ant-picker-calendar-date-today .ant-picker-calendar-date-value {
          color: #B45309 !important;
          font-weight: 800 !important;
        }
        /* Ô THÁNG KHÁC (DISABLED/OUT OF MONTH) */
        .unibridal-luxury-calendar .ant-picker-cell-disabled .ant-picker-calendar-date {
          background: #FAFAFA !important;
          opacity: 0.4 !important;
          border-color: #F3F3F3 !important;
        }

        /* NỔI BẬT ĐỒNG THỜI NGÀY GIAO & NGÀY TRẢ CỦA CÙNG ĐƠN HÀNG */
        .unibridal-luxury-calendar .ant-picker-calendar-date.cell-delivery-highlight {
          border: 2px solid #0284C7 !important;
          background: #F0F9FF !important;
          box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2) !important;
          z-index: 2;
        }
        .unibridal-luxury-calendar .ant-picker-calendar-date.cell-delivery-highlight .ant-picker-calendar-date-value {
          color: #0369A1 !important;
          font-weight: 800 !important;
        }

        .unibridal-luxury-calendar .ant-picker-calendar-date.cell-return-highlight {
          border: 2px solid #E11D48 !important;
          background: #FFF1F2 !important;
          box-shadow: 0 0 0 2px rgba(225, 29, 72, 0.2) !important;
          z-index: 2;
        }
        .unibridal-luxury-calendar .ant-picker-calendar-date.cell-return-highlight .ant-picker-calendar-date-value {
          color: #BE123C !important;
          font-weight: 800 !important;
        }
      `}</style>

      <AdminLayout activeMenu="lich-tong-quan" role={isStaffContext ? 'staff' : 'admin'}>
        <div className="space-y-5">
          {/* Header và Thanh Tiêu Đề */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-playfair text-[32px] sm:text-[38px] font-normal text-[#5F2B36] tracking-tight leading-tight mb-2">
                Lịch Tổng Quan
              </h1>
              <p className="text-[14px] text-[#7A6B6C] font-normal max-w-3xl leading-relaxed">
                Quản lý lịch hẹn thử váy Private Suite 1:1 và điều phối ngày bàn giao / hạn hoàn trả lễ phục cưới UniBridal.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E8DDD8] bg-white text-[#5F2B36] hover:bg-[#FAF0EC] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Làm mới dữ liệu</span>
              </button>
            </div>
          </div>

          {/* TAB CHÍNH ĐIỀU HƯỚNG: LỊCH BIỂU & LỊCH SỬ THỬ VÁY */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-[#EFE5E1] shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleMainTabChange('calendar')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeMainTab === 'calendar'
                    ? 'bg-[#733F49] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Lịch Biểu</span>
              </button>
              <button
                type="button"
                onClick={() => handleMainTabChange('history')}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeMainTab === 'history'
                    ? 'bg-[#733F49] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Lịch thử váy</span>
              </button>
            </div>

            {/* Quick Stats Pill: Thống kê nhanh hôm nay (chỉ hiển thị ở Lịch Biểu) */}
            {activeMainTab === 'calendar' && (
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-900 rounded-lg border border-purple-200 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                  <span>Hôm nay: <strong>{stats.todayFittings} ca thử</strong></span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-900 rounded-lg border border-sky-200 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                  <span>Hôm nay: <strong>{stats.todayDeliveries} đơn giao</strong></span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-900 rounded-lg border border-rose-200 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Hôm nay: <strong>{stats.todayReturns} đơn trả</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* NỘI DUNG LỊCH BIỂU SHOWROOM (LỊCH THÁNG + CHI TIẾT NGÀY) */}
          {/* ========================================================= */}
          {activeMainTab === 'calendar' && (
            <div className="space-y-6">
              {/* Thanh lọc phụ cho Lịch Biểu - Thiết kế sang trọng */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#EFE5E1] shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-[#733F49] uppercase tracking-wider text-[11px] flex items-center gap-1.5 mr-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Lọc hiển thị:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarFilterType('all');
                      setDeliveryMethodFilter('all');
                      setReturnMethodFilter('all');
                      setHighlightedOrderCode(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      calendarFilterType === 'all'
                        ? 'bg-[#733F49] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200/80'
                    }`}
                  >
                    Tất cả sự kiện ({calendarVisibleAppointments.length + calendarBranchOrders.length * 2})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarFilterType('fitting');
                      setDeliveryMethodFilter('all');
                      setReturnMethodFilter('all');
                      setHighlightedOrderCode(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      calendarFilterType === 'fitting'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Lịch thử váy ({calendarVisibleAppointments.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarFilterType('delivery');
                      setReturnMethodFilter('all');
                      setHighlightedOrderCode(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      calendarFilterType === 'delivery'
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                    }`}
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Lịch giao váy ({calendarBranchOrders.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarFilterType('return');
                      setDeliveryMethodFilter('all');
                      setHighlightedOrderCode(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      calendarFilterType === 'return'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Hạn trả váy ({calendarBranchOrders.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#733F49]" />
                    <span>Chi nhánh:</span>
                  </span>
                  <select
                    value={calendarBranchFilter}
                    onChange={(e) => setCalendarBranchFilter(e.target.value)}
                    className="px-3.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-bold outline-none cursor-pointer text-xs focus:border-[#733F49]"
                  >
                    <option value="hcm-q1">UniBridal Q.1 TP.HCM</option>
                    <option value="hn-hoankiem">UniBridal Hoàn Kiếm, HN</option>
                  </select>
                </div>
              </div>

              {/* Container 2 Cột: Lịch Tháng (Trái) + Thanh Kéo Co Giãn (Giữa) + Bảng Chi Tiết Ngày (Phải) */}
              <div ref={splitContainerRef} className="flex flex-col lg:flex-row items-stretch gap-0 relative">
                {/* Lịch tháng Ant Design với Custom Styling và Header */}
                <div className="flex-1 min-w-[340px] bg-white p-5 rounded-2xl shadow-xs border border-[#EFE5E1]">
                  {loading ? (
                    <div className="h-96 flex items-center justify-center">
                      <Spin tip="Đang tải dữ liệu lịch showroom..." />
                    </div>
                  ) : (
                    <Calendar
                      className="unibridal-luxury-calendar"
                      fullCellRender={(date, info) => {
                        if (info?.type === 'month') return info.originNode;

                        const d = date?.toDate ? date.toDate() : new Date(date);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const dateLabel = `${day}/${month}`;
                        const isToday = toDateKey(d) === todayKey;
                        const dateKey = toDateKey(d);

                        const isAllEvents = calendarFilterType === 'all';
                        const isDeliveryHighlight = isAllEvents && highlightStartDateKey && dateKey === highlightStartDateKey;
                        const isReturnHighlight = isAllEvents && highlightEndDateKey && dateKey === highlightEndDateKey;

                        let highlightClass = '';
                        if (isDeliveryHighlight) {
                          highlightClass = 'cell-delivery-highlight';
                        } else if (isReturnHighlight) {
                          highlightClass = 'cell-return-highlight';
                        }

                        return (
                          <div
                            className={`ant-picker-cell-inner ant-picker-calendar-date ${
                              isToday ? 'ant-picker-calendar-date-today' : ''
                            } ${highlightClass}`}
                          >
                            <div className="ant-picker-calendar-date-value font-mono">
                              {dateLabel}
                            </div>
                            <div className="ant-picker-calendar-date-content">
                              {dateCellRender(date)}
                            </div>
                          </div>
                        );
                      }}
                      headerRender={({ value, onChange }) => {
                        const current = value || dayjs();
                        const monthLabel = current.format('MMMM, YYYY');
                        const capitalized =
                          monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

                        return (
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-3 border-b border-gray-100">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#FAF0EC] border border-[#F2D8D4] flex items-center justify-center">
                                  <CalendarIcon className="w-4 h-4 text-[#733F49]" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 m-0 font-playfair tracking-wide">
                                  {capitalized}
                                </h2>
                              </div>

                              {/* 2 Ô Lọc: Khách đến lấy & Giao tận nơi CHỈ HIỂN THỊ KHI ĐANG XEM LỊCH GIAO VÁY */}
                              {calendarFilterType === 'delivery' && (
                                <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-gray-200">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeliveryMethodFilter((prev) =>
                                        prev === 'showroom' ? 'all' : 'showroom'
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                                      deliveryMethodFilter === 'showroom'
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                        : 'bg-indigo-50/80 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                                    }`}
                                    title={
                                      deliveryMethodFilter === 'showroom'
                                        ? 'Đang lọc: Khách đến lấy (Bấm để xem tất cả)'
                                        : 'Lọc đơn khách đến showroom lấy trực tiếp'
                                    }
                                  >
                                    <Building2 className="w-3.5 h-3.5" />
                                    <span>Khách đến lấy</span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                                        deliveryMethodFilter === 'showroom'
                                          ? 'bg-white/20 text-white'
                                          : 'bg-indigo-100 text-indigo-900'
                                      }`}
                                    >
                                      {showroomDeliveriesCount}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeliveryMethodFilter((prev) =>
                                        prev === 'express' ? 'all' : 'express'
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                                      deliveryMethodFilter === 'express'
                                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                        : 'bg-sky-50/80 text-sky-900 border-sky-200 hover:bg-sky-100'
                                    }`}
                                    title={
                                      deliveryMethodFilter === 'express'
                                        ? 'Đang lọc: Nhân viên giao (Bấm để xem tất cả)'
                                        : 'Lọc đơn nhân viên giao váy tận nơi'
                                    }
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>Nhân viên giao</span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                                        deliveryMethodFilter === 'express'
                                          ? 'bg-white/20 text-white'
                                          : 'bg-sky-100 text-sky-900'
                                      }`}
                                    >
                                      {expressDeliveriesCount}
                                    </span>
                                  </button>
                                </div>
                              )}

                              {/* 2 Ô Lọc: Khách đến trả & Nhân viên đến lấy CHỈ HIỂN THỊ KHI ĐANG XEM HẠN TRẢ VÁY */}
                              {calendarFilterType === 'return' && (
                                <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-gray-200">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReturnMethodFilter((prev) =>
                                        prev === 'showroom' ? 'all' : 'showroom'
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                                      returnMethodFilter === 'showroom'
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                        : 'bg-indigo-50/80 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                                    }`}
                                    title={
                                      returnMethodFilter === 'showroom'
                                        ? 'Đang lọc: Khách đến trả (Bấm để xem tất cả)'
                                        : 'Lọc đơn khách đến showroom trả trực tiếp'
                                    }
                                  >
                                    <Building2 className="w-3.5 h-3.5" />
                                    <span>Khách đến trả</span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                                        returnMethodFilter === 'showroom'
                                          ? 'bg-white/20 text-white'
                                          : 'bg-indigo-100 text-indigo-900'
                                      }`}
                                    >
                                      {showroomReturnsCount}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReturnMethodFilter((prev) =>
                                        prev === 'express' ? 'all' : 'express'
                                      )
                                    }
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                                      returnMethodFilter === 'express'
                                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                        : 'bg-sky-50/80 text-sky-900 border-sky-200 hover:bg-sky-100'
                                    }`}
                                    title={
                                      returnMethodFilter === 'express'
                                        ? 'Đang lọc: Nhân viên lấy (Bấm để xem tất cả)'
                                        : 'Lọc đơn nhân viên đến thu hồi váy tận nơi'
                                    }
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>Nhân viên lấy</span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                                        returnMethodFilter === 'express'
                                          ? 'bg-white/20 text-white'
                                          : 'bg-sky-100 text-sky-900'
                                      }`}
                                    >
                                      {expressReturnsCount}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onChange(current.subtract(1, 'month'))}
                                className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                                title="Tháng trước"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onChange(dayjs())}
                                className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[#733F49]/30 text-[#733F49] bg-[#FAF0EC] hover:bg-[#F2D8D4] transition cursor-pointer shadow-2xs"
                              >
                                Hôm nay
                              </button>
                              <button
                                type="button"
                                onClick={() => onChange(current.add(1, 'month'))}
                                className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                                title="Tháng sau"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      }}
                      onSelect={(date) => {
                        const d = date.toDate ? date.toDate() : new Date(date);
                        setSelectedDate(d);
                      }}
                    />
                  )}
                </div>

                {/* Thanh Kéo Co Giãn & Nút Mũi Tên Kéo Ra (Pull-out Arrow Handle) ở giữa 2 cột */}
                <div
                  onMouseDown={handleMouseDownResize}
                  onDoubleClick={() => {
                    setIsRightPanelCollapsed(false);
                    setRightPanelWidth(480);
                    try {
                      localStorage.setItem('unibridal_schedule_right_panel_width', '480');
                      localStorage.setItem('unibridal_schedule_right_panel_collapsed', 'false');
                    } catch (_) {}
                  }}
                  className={`hidden lg:flex items-center justify-center shrink-0 cursor-col-resize select-none relative z-20 group transition-all duration-200 ${
                    isRightPanelCollapsed ? 'w-8 pl-1.5' : 'w-6'
                  }`}
                  title={
                    isRightPanelCollapsed
                      ? 'Bấm để kéo ra bảng chi tiết ngày'
                      : 'Bấm mũi tên để thu gọn / Kéo sang trái để mở rộng (Nhấp đúp đặt lại 480px)'
                  }
                >
                  {/* Đường rãnh phân cách mờ */}
                  {!isRightPanelCollapsed && (
                    <div className="absolute inset-y-0 w-[1px] bg-[#EFE5E1] group-hover:bg-[#BA7A83]/60 transition-colors" />
                  )}

                  {/* Nút Mũi Tên Kéo Ra */}
                  <div
                    className={`relative z-10 w-6 h-16 rounded-full flex flex-col items-center justify-center border shadow-xs transition-all duration-200 cursor-pointer ${
                      isDragging
                        ? 'bg-[#733F49] text-white border-[#5F2B36] shadow-md scale-110 ring-2 ring-[#733F49]/20'
                        : isRightPanelCollapsed
                        ? 'bg-[#733F49] text-white border-[#5F2B36] shadow-md hover:scale-105 hover:bg-[#5F2B36]'
                        : 'bg-white hover:bg-[#733F49] text-[#733F49] hover:text-white border-[#E8DDD8] hover:border-[#733F49] hover:shadow-md'
                    }`}
                  >
                    {isRightPanelCollapsed ? (
                      <ChevronsLeft className="w-4 h-4 stroke-[2.5] animate-pulse" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
                    )}
                  </div>
                </div>

                {/* Cột Phải: Bảng Chi Tiết Ngày VIP Concierge Docket (Có thể kéo co giãn độ rộng tùy ý) */}
                {(!isLargeScreen || !isRightPanelCollapsed) && (
                  <div
                    style={{
                      width: isLargeScreen ? `${rightPanelWidth}px` : '100%',
                      minWidth: isLargeScreen ? '320px' : 'auto',
                    }}
                    className="w-full shrink-0 bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-[#EFE5E1] flex flex-col h-fit transition-all duration-150"
                  >
                    <div className="border-b border-[#F2E5E0] pb-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-gray-900 capitalize font-playfair">
                          {selectedDate.toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRightPanel();
                          }}
                          className="flex items-center justify-center w-6 h-6 rounded-lg text-gray-400 hover:text-[#733F49] hover:bg-[#FAF0EC] transition cursor-pointer"
                          title="Thu gọn bảng chi tiết"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  <div className="space-y-4 overflow-y-auto max-h-[680px] pr-1">
                    {currentDayEvents.length === 0 ? (
                      <div className="py-14 text-center text-gray-400 text-xs">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="Không có ca hẹn thử hoặc đơn trả nào trong ngày này"
                        />
                      </div>
                    ) : (
                      currentDayEvents.map((item) => {
                        const isFitting = item.type === 'fitting';
                        const isDelivery = item.type === 'delivery';
                        const isReturn = item.type === 'return';
                        const isPending = item.status === 'pending';
                        const isConfirmed = item.status === 'confirmed';
                        const isCompleted = item.status === 'completed';
                        const badge = getEventBadge(item);

                        // Trạng thái Giao Váy: Vàng (khách sắp lấy), Xanh (khách đã lấy/ship đã giao), Đỏ (chưa đến lấy/chưa giao)
                        const isDeliveryDone = isDelivery && (['delivered', 'renting', 'returned', 'completed', 'waiting_refund'].includes((item.status || '').toLowerCase()) || Boolean(item.actualDeliveryDate));
                        const deliveryDateKey = isDelivery ? (item.deliveryDate || item.date) : '';
                        const isDeliveryOverdue = isDelivery && !isDeliveryDone && Boolean(deliveryDateKey && deliveryDateKey < todayKey);
                        const isDeliveryFutureOrToday = isDelivery && !isDeliveryDone && (!deliveryDateKey || deliveryDateKey >= todayKey);

                        // Trạng thái Trả Váy: Vàng (sắp đến hạn/tương lai), Xanh (đã trả), Đỏ (chưa trả)
                        const isReturnDone = isReturn && (item.status === 'completed' || item.status === 'returned' || item.status === 'waiting_refund' || Boolean(item.actualReturnDate));
                        const returnDateKey = isReturn ? (item.date || toDateKey(item.rentalEndDate)) : '';
                        const isReturnOverdue = isReturn && !isReturnDone && Boolean(returnDateKey && returnDateKey < todayKey);
                        const isReturnFutureOrToday = isReturn && !isReturnDone && (!returnDateKey || returnDateKey >= todayKey);

                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border transition-all shadow-xs ${
                              isFitting
                                ? isPending
                                  ? 'border-amber-300 bg-amber-50/30'
                                  : isConfirmed
                                  ? 'border-emerald-300 bg-emerald-50/30'
                                  : 'border-purple-300 bg-purple-50/20'
                                : isDelivery
                                ? isDeliveryDone
                                  ? 'border-emerald-300 bg-emerald-50/30'
                                  : isDeliveryFutureOrToday
                                  ? 'border-amber-300 bg-amber-50/30'
                                  : 'border-rose-300 bg-rose-50/30'
                                : isReturnDone
                                ? 'border-emerald-300 bg-emerald-50/30'
                                : isReturnFutureOrToday
                                ? 'border-amber-300 bg-amber-50/30'
                                : 'border-rose-300 bg-rose-50/30'
                            }`}
                          >
                            {/* Dòng 1: Header sự kiện và Trạng thái */}
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                                {isFitting ? (
                                  <>
                                    <Clock className="w-3.5 h-3.5 text-[#733F49]" />
                                    <span className="font-mono text-sm">{item.timeSlot}</span>
                                  </>
                                ) : isDelivery ? (
                                  <>
                                    {item.deliveryMethod === 'express' ? (
                                      <>
                                        <Truck className={`w-3.5 h-3.5 ${
                                          isDeliveryDone
                                            ? 'text-emerald-700'
                                            : isDeliveryFutureOrToday
                                            ? 'text-amber-700'
                                            : 'text-rose-700'
                                        }`} />
                                        <span className={`font-mono font-bold ${
                                          isDeliveryDone
                                            ? 'text-emerald-900'
                                            : isDeliveryFutureOrToday
                                            ? 'text-amber-900'
                                            : 'text-rose-900'
                                        }`}>
                                          SHIP VÁY: {item.code}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Building2 className={`w-3.5 h-3.5 ${
                                          isDeliveryDone
                                            ? 'text-emerald-700'
                                            : isDeliveryFutureOrToday
                                            ? 'text-amber-700'
                                            : 'text-rose-700'
                                        }`} />
                                        <span className={`font-mono font-bold ${
                                          isDeliveryDone
                                            ? 'text-emerald-900'
                                            : isDeliveryFutureOrToday
                                            ? 'text-amber-900'
                                            : 'text-rose-900'
                                        }`}>
                                          KHÁCH LẤY: {item.code}
                                        </span>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className={`w-3.5 h-3.5 ${
                                      isReturnDone
                                        ? 'text-emerald-700'
                                        : isReturnFutureOrToday
                                        ? 'text-amber-700'
                                        : 'text-rose-700'
                                    }`} />
                                    <span className={`font-mono font-bold ${
                                      isReturnDone
                                        ? 'text-emerald-900'
                                        : isReturnFutureOrToday
                                        ? 'text-amber-900'
                                        : 'text-rose-900'
                                    }`}>
                                      HẠN TRẢ: {item.code}
                                    </span>
                                  </>
                                )}
                              </span>
                              {!isReturn && !isDelivery && (
                                <span
                                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${badge.className}`}
                                >
                                  {badge.label}
                                </span>
                              )}
                              {isDelivery && (
                                <span
                                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                    isDeliveryDone
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : isDeliveryFutureOrToday
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : 'bg-rose-50 text-rose-900 border-rose-300'
                                  }`}
                                >
                                  {isDeliveryDone
                                    ? (item.deliveryMethod === 'express' ? 'Ship đã giao' : 'Khách đã lấy')
                                    : isDeliveryFutureOrToday
                                    ? (item.deliveryMethod === 'express' ? 'Sắp giao' : 'Khách sắp lấy')
                                    : (item.deliveryMethod === 'express' ? 'Chưa giao' : 'Chưa đến lấy')}
                                </span>
                              )}
                              {isReturn && (
                                <span
                                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                    isReturnDone
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : isReturnFutureOrToday
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : 'bg-rose-50 text-rose-900 border-rose-300'
                                  }`}
                                >
                                  {isReturnDone ? 'Đã trả' : isReturnFutureOrToday ? 'Sắp đến hạn' : 'Chưa trả'}
                                </span>
                              )}
                            </div>

                            {/* Tên khách hàng */}
                            <div className="font-bold text-gray-900 text-base font-playfair tracking-tight">
                              {item.customerName}
                            </div>

                            {/* Điện thoại liên hệ */}
                            {item.phone && (
                              <div className="flex items-center gap-2 mt-2">
                                <a
                                  href={`tel:${item.phone}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#EFE5E1] text-[#733F49] text-xs font-bold hover:bg-[#FAF0EC] transition shadow-2xs"
                                >
                                  <Phone className="w-3.5 h-3.5 text-[#733F49]" />
                                  <span>{item.phone}</span>
                                </a>
                              </div>
                            )}

                            {/* Chi nhánh Showroom / Phương thức & Địa chỉ giao hoặc trả */}
                            {isFitting ? (
                              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-2 font-medium">
                                <Building2 size={12} className="text-[#BA7A83]" />
                                <span>
                                  {item.branch === 'hn-hoankiem'
                                    ? 'Showroom Hoàn Kiếm, Hà Nội (26 Lý Thường Kiệt)'
                                    : 'Flagship Showroom Q.1, TP. HCM (88 Nam Kỳ Khởi Nghĩa)'}
                                </span>
                              </div>
                            ) : isDelivery ? (
                              item.deliveryMethod === 'express' ? (
                                <div className="mt-2.5 text-[11px] p-2.5 rounded-xl border font-medium space-y-1 bg-sky-50/80 text-sky-900 border-sky-200">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                    <span>Địa chỉ khách yêu cầu giao:</span>
                                  </div>
                                  <div className="text-gray-800 font-semibold pl-5 text-xs">
                                    📍 {formatAddress(item.shippingAddress) || 'Địa chỉ khách hàng đã đăng ký'}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2.5 text-[11.5px] p-2.5 rounded-xl border font-bold flex items-center gap-1.5 bg-indigo-50/80 text-indigo-950 border-indigo-200">
                                  <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>Khách đến lấy tại Showroom</span>
                                </div>
                              )
                            ) : (
                              item.deliveryMethod === 'express' ? (
                                <div className="mt-2.5 text-[11px] p-2.5 rounded-xl border font-medium space-y-1 bg-sky-50/80 text-sky-900 border-sky-200">
                                  <div className="flex items-center gap-1.5 font-bold">
                                    <Truck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                    <span>Nhân viên lấy:</span>
                                  </div>
                                  <div className="text-gray-800 font-semibold pl-5 text-xs">
                                    📍 {formatAddress(item.shippingAddress) || 'Địa chỉ khách hàng đã đăng ký'}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2.5 text-[11.5px] p-2.5 rounded-xl border font-bold flex items-center gap-1.5 bg-indigo-50/80 text-indigo-950 border-indigo-200">
                                  <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>Khách đến trả tại Showroom</span>
                                </div>
                              )
                            )}

                            {/* Lễ phục quan tâm / Lễ phục thuê */}
                            {isFitting && item.interestedDresses?.length > 0 && (
                              <div className="p-2.5 rounded-xl bg-white/80 border border-[#F2D8D4] text-xs text-[#733F49] font-medium mt-2.5 space-y-1">
                                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                  👗 Lễ phục đã đăng ký thử:
                                </div>
                                <div className="space-y-0.5">
                                  {item.interestedDresses.map((d, i) => (
                                    <div key={i} className="font-semibold text-gray-800">
                                      • {d.name || d}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {!isFitting && item.items?.length > 0 && (
                              <div className="p-2.5 rounded-xl bg-white/80 border border-[#EFE5E1] text-xs font-medium mt-2.5 space-y-1">
                                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                  {isDelivery ? '📦 Lễ phục bàn giao:' : '🔄 Lễ phục trả:'}
                                </div>
                                <div className="space-y-0.5">
                                  {item.items.map((it, idx) => (
                                    <div key={idx} className="font-semibold text-gray-800">
                                      • {it.name} (Size: {it.size || 'M'}{it.color ? ` • Màu: ${it.color}` : ''})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Ghi chú (chỉ hiển thị ở lịch thử váy, ẩn ở phần giao và trả theo yêu cầu) */}
                            {isFitting && item.notes && (
                              <div className="p-2.5 bg-white/70 rounded-xl text-xs text-gray-600 border border-gray-200/80 italic mt-2.5 leading-relaxed">
                                &ldquo;{item.notes}&rdquo;
                              </div>
                            )}

                            {/* CÁC NÚT THAO TÁC TRỰC TIẾP DÀNH CHO STAFF */}
                            <div className="flex items-center gap-2 pt-3 border-t border-gray-200/70 mt-3">
                              {isFitting && item.status === 'confirmed' && (
                                (item.date || toDateKey(item.appointmentDate)) <= todayKey ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={updatingId === item.id}
                                      onClick={() =>
                                        handleUpdateAppointmentStatus(item.id, 'completed')
                                      }
                                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                                      title="Khách hàng đã đến showroom: Đánh dấu có mặt"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Có Mặt</span>
                                    </button>
                                    <button
                                      type="button"
                                      disabled={updatingId === item.id}
                                      onClick={() =>
                                        handleUpdateAppointmentStatus(item.id, 'cancelled')
                                      }
                                      className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-50"
                                      title="Khách bận hoặc không đến: Đánh dấu vắng mặt"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Vắng Mặt</span>
                                    </button>
                                  </>
                                ) : (
                                  <div className="flex-1 py-1.5 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-xs font-semibold flex items-center justify-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span>Chờ đến ngày hẹn</span>
                                  </div>
                                )
                              )}

                              {isDelivery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const targetCode = item.code || item.id || '';
                                    navigate(`${orderBasePath}?orderCode=${encodeURIComponent(targetCode)}`);
                                  }}
                                  className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                                  title="Xem chi tiết đơn thuê và bàn giao"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" />
                                  <span>Đơn Thuê</span>
                                </button>
                              )}

                              {isReturn && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const targetCode = item.code || item.id || '';
                                    navigate(`${orderBasePath}?orderCode=${encodeURIComponent(targetCode)}&action=inspect`);
                                  }}
                                  className="w-full py-2 px-3 rounded-xl bg-[#FAF0EC] hover:bg-[#F2D8D4] text-[#733F49] text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer border border-[#F2D8D4]"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Kiểm Định Trả Váy</span>
                                </button>
                              )}

                              {!isReturn && !isDelivery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedEvent(item);
                                    setDetailModalOpen(true);
                                  }}
                                  className="p-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium transition cursor-pointer"
                                  title="Xem chi tiết đầy đủ"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );                      })
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* NỘI DUNG LỊCH SỬ THỬ VÁY (BẢNG DANH SÁCH & BỘ LỌC)       */}
          {/* ========================================================= */}
          {activeMainTab === 'history' && (
            <div className="space-y-4">
              {/* Bộ lọc Lịch Sử Thử Váy */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#EFE5E1] shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Tìm kiếm */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Tìm theo tên khách, SĐT, mã hẹn..."
                      className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#BA7A83] focus:bg-white transition"
                    />
                    {historySearch && (
                      <button
                        type="button"
                        onClick={() => setHistorySearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Lọc Chi nhánh */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">Chi nhánh:</span>
                    <select
                      value={historyBranch}
                      onChange={(e) => setHistoryBranch(e.target.value)}
                      className="text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-3 py-2 focus:outline-none focus:border-[#BA7A83] cursor-pointer"
                    >
                      <option value="hcm-q1">UniBridal Q.1 TP.HCM</option>
                      <option value="hn-hoankiem">UniBridal Hoàn Kiếm, HN</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bảng danh sách Lịch Sử Thử Váy */}
              <div className="bg-white rounded-2xl border border-[#EFE5E1] shadow-2xs overflow-hidden p-4">
                <Table
                  dataSource={historyAppointments}
                  columns={historyColumns}
                  rowKey={(record) => record._id || record.id || record.appointmentCode}
                  scroll={{ x: 1000 }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total, range) => (
                      <span className="text-xs text-gray-500">
                        Hiển thị {range[0]}-{range[1]} trên tổng số {total} ca hẹn
                      </span>
                    ),
                  }}
                  locale={{
                    emptyText: (
                      <div className="py-12 text-center text-gray-400">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#733F49]" />
                        <div className="text-sm font-semibold text-gray-600">
                          Không tìm thấy lịch sử thử váy nào phù hợp
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc
                        </div>
                      </div>
                    ),
                  }}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL XEM CHI TIẾT SỰ KIỆN + DUYỆT TRẠNG THÁI TRỰC TIẾP */}
          {/* ========================================================= */}
          <Modal
            open={detailModalOpen}
            onCancel={() => setDetailModalOpen(false)}
            footer={null}
            title={
              <div className="flex items-center gap-2 text-base font-bold text-gray-900 font-playfair">
                {selectedEvent?.type === 'fitting' ? (
                  <>
                    <Crown className="w-5 h-5 text-[#733F49]" />
                    <span>Chi Tiết Lịch Hẹn Thử Váy Private Suite</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5 text-rose-600" />
                    <span>Chi Tiết Đơn Thuê và Hạn Hoàn Trả Lễ Phục</span>
                  </>
                )}
              </div>
            }
          >
            {selectedEvent && (
              <div className="space-y-4 py-2 text-xs sm:text-sm">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Mã tham chiếu:</span>
                    <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {selectedEvent.code}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Khách hàng:</span>
                    <span className="font-bold text-gray-900">{selectedEvent.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Số điện thoại:</span>
                    <a
                      href={`tel:${selectedEvent.phone}`}
                      className="font-bold text-[#733F49] hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {selectedEvent.phone || 'Chưa cập nhật'}
                    </a>
                  </div>
                  {selectedEvent.email && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">Email:</span>
                      <span className="text-gray-700">{selectedEvent.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">
                      {selectedEvent.type === 'fitting'
                        ? 'Khung giờ thử:'
                        : selectedEvent.type === 'delivery'
                        ? 'Ngày bàn giao:'
                        : 'Hạn hoàn trả:'}
                    </span>
                    <span className="font-bold text-[#733F49]">
                      {selectedEvent.type === 'fitting'
                        ? `${selectedEvent.timeSlot} (${selectedEvent.date})`
                        : `Ngày ${selectedEvent.date}`}
                    </span>
                  </div>

                  {/* Địa điểm bàn giao / hoàn trả / thử váy */}
                  <div className="flex justify-between items-start pt-2 border-t border-gray-200">
                    <span className="text-gray-500 font-medium shrink-0">
                      {selectedEvent.type === 'fitting'
                        ? 'Địa điểm thử:'
                        : selectedEvent.type === 'delivery'
                        ? 'Hình thức & Địa chỉ giao:'
                        : 'Hình thức & Địa chỉ trả:'}
                    </span>
                    <div className="text-right text-xs font-semibold text-gray-800 max-w-[280px]">
                      {selectedEvent.type === 'fitting' ? (
                        <div>
                          <div className="font-bold text-gray-900">
                            {selectedEvent.branch === 'hn-hoankiem'
                              ? 'UniBridal Showroom Hoàn Kiếm, HN'
                              : 'UniBridal Flagship Showroom Q.1, TP.HCM'}
                          </div>
                          <div className="text-[11px] text-gray-600 font-normal">
                            📍 {selectedEvent.branch === 'hn-hoankiem'
                              ? '26 Lý Thường Kiệt, P. Hàng Bài, Q. Hoàn Kiếm, Hà Nội'
                              : '88 Nam Kỳ Khởi Nghĩa, P. Bến Nghé, Q.1, TP. Hồ Chí Minh'}
                          </div>
                        </div>
                      ) : selectedEvent.deliveryMethod === 'express' ? (
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px] mb-1">
                            {selectedEvent.type === 'delivery' ? 'Giao tận nơi' : 'Thu hồi tận nơi'}
                          </span>
                          <div className="text-gray-800">
                            📍 {formatAddress(selectedEvent.shippingAddress) || 'Địa chỉ khách hàng đã đăng ký'}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-bold text-xs">
                            {selectedEvent.type === 'delivery' ? 'Khách đến lấy tại Showroom' : 'Khách đến trả tại Showroom'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Trạng thái hiện tại:</span>
                    {(() => {
                        const badge = getEventBadge(selectedEvent);
                        return (
                          <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${badge.className}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                  </div>
                </div>

                {/* Ghi chú và Chi tiết váy */}
                {selectedEvent.type === 'fitting' && (
                  <div className="space-y-3">
                    {selectedEvent.interestedDresses?.length > 0 && (
                      <div>
                        <div className="text-xs font-bold uppercase text-gray-500 mb-1.5">
                          Lễ phục cô dâu quan tâm:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEvent.interestedDresses.map((dress, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF0EC] text-[#733F49] text-xs font-semibold border border-[#F2D8D4]"
                            >
                              👗 {dress.name || dress}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-xs font-bold uppercase text-gray-500 mb-1">
                        Ghi chú từ cô dâu:
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl text-gray-700 text-xs border border-gray-200 italic">
                        {selectedEvent.notes || 'Không có ghi chú thêm.'}
                      </div>
                    </div>

                    {/* Nút hành động phê duyệt trực tiếp trong Modal */}
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                      {selectedEvent.status === 'confirmed' && (
                        (selectedEvent.date || toDateKey(selectedEvent.appointmentDate)) <= todayKey ? (
                          <>
                            <button
                              type="button"
                              disabled={updatingId === selectedEvent.id}
                              onClick={() => handleUpdateAppointmentStatus(selectedEvent.id, 'completed')}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                              title="Khách hàng đã đến showroom: Đánh dấu có mặt"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Có Mặt</span>
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === selectedEvent.id}
                              onClick={() => handleUpdateAppointmentStatus(selectedEvent.id, 'cancelled')}
                              className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                              title="Khách không đến: Đánh dấu vắng mặt"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Vắng Mặt</span>
                            </button>
                          </>
                        ) : (
                          <div className="w-full py-2.5 px-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold text-center flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>Lịch hẹn chưa đến ngày — Chỉ mở thao tác khi đến ngày hẹn</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {selectedEvent.type === 'delivery' && (
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalOpen(false);
                        const targetCode = selectedEvent.code || selectedEvent.id || '';
                        navigate(`${orderBasePath}?orderCode=${encodeURIComponent(targetCode)}&action=inspect`);
                      }}
                      className="flex-1 py-2.5 px-3 bg-[#733F49] hover:bg-[#5a3239] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Mở Quy Trình Kiểm Định &amp; Hoàn Cọc</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalOpen(false);
                        const targetCode = selectedEvent.code || selectedEvent.id || '';
                        navigate(`${orderBasePath}?orderCode=${encodeURIComponent(targetCode)}`);
                      }}
                      className="py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Quản Lý Đơn Thuê</span>
                    </button>
                  </div>
                )}

                {selectedEvent.type === 'return' && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailModalOpen(false);
                        const targetCode = selectedEvent.code || selectedEvent.id || '';
                        navigate(`${orderBasePath}?orderCode=${encodeURIComponent(targetCode)}&action=inspect`);
                      }}
                      className="w-full py-2.5 px-4 bg-[#733F49] hover:bg-[#5a3239] text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>Mở Quy Trình Kiểm Định &amp; Hoàn Cọc</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </Modal>
        </div>
      </AdminLayout>
    </ConfigProvider>
  );
}
