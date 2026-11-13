import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard,
  Crown,
  CalendarCheck,
  CalendarDays,
  Package,
  Headphones,
  BarChart3,
  Store,
  LogOut,
  Menu,
  X,
  Layers,
  FileSignature,
  Users,
  Tag,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  ExternalLink,
  Truck,
  RotateCcw } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import heroBride from '../../assets/hero_bride.jpg';
import adminAvatarImg from '../../assets/admin_avatar.jpg';
import { useAuth } from '../../contexts/AuthContext';
import { getAllOrdersAdmin } from '../../services/orderService';
import { getAppointmentsApi, getAppointments, APPOINTMENT_EVENT } from '../../services/appointmentService';
import { formatCurrencyVND } from '../../utils/formatCurrency';

const READ_NOTIFS_STORAGE_KEY = 'unibridal_read_notif_ids';

/**
 * Kiểm tra xem một mốc thời gian có rơi vào đúng ngày hôm nay (theo múi giờ Việt Nam) hay không
 */
function isSameDayVietnam(dateInput) {
  if (!dateInput) return false;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;
    const vnOptions = { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateStr = d.toLocaleDateString('vi-VN', vnOptions);
    const todayStr = new Date().toLocaleDateString('vi-VN', vnOptions);
    return dateStr === todayStr;
  } catch {
    const d = new Date(dateInput);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }
}

function timeAgo(dateInput) {
  if (!dateInput) return 'Vừa xong';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Gần đây';
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export default function AdminLayout({
  children,
  activeMenu,
  role = 'admin',
  title,
  subtitle,
  controls,
  headerTitle,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Live Notifications State for New Deposits & Appointments
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [currentTickerIdx, setCurrentTickerIdx] = useState(0);
  const [isTickerPaused, setIsTickerPaused] = useState(false);

  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem(READ_NOTIFS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markIdAsRead = (id) => {
    setReadNotifIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [id, ...prev].slice(0, 100);
      try {
        localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Tự động nhận diện menu đang active nếu không truyền chủ động
  const currentPath = location.pathname;
  const isStaff = role === 'staff' || user?.role === 'staff' || currentPath.startsWith('/staff');

  // Fetch Live Notifications: Chỉ hiển thị các sự kiện phát sinh trong ngày hôm nay:
  // 1. Đơn vừa đặt / vừa cọc hôm nay (createdAt là hôm nay)
  // 2. Lịch ship váy / giao váy cho khách hôm nay (rentalStartDate là hôm nay)
  // 3. Lịch khách hẹn trả váy hôm nay (rentalEndDate là hôm nay)
  // 4. Lịch hẹn thử váy hôm nay (appointmentDate là hôm nay)
  const fetchLiveNotifications = async () => {
    try {
      const notifs = [];

      // 1. Fetch Orders (Lọc đơn vừa đặt, lịch ship váy và lịch trả váy trong ngày hôm nay)
      try {
        const ordersRes = await getAllOrdersAdmin({ limit: 100 });
        const orders = ordersRes?.orders || [];
        orders.forEach((o) => {
          const rawSt = (o.rawStatus || o.status || '').toLowerCase();
          if (rawSt === 'cancelled') return;

          const orderIdStr = o._id || o.orderCode || Math.random();
          const customerName = o.customerName || 'Khách Hàng';
          const dressName = o.items?.[0]?.name || o.dress || 'Lễ phục cưới';

          // A. Đơn vừa đặt / vừa cọc trong ngày hôm nay
          if (isSameDayVietnam(o.createdAt)) {
            const hasDeposit = (o.totalDeposit > 0 || o.depositAmount > 0);
            notifs.push({
              id: `order-created-${orderIdStr}`,
              type: 'deposit',
              orderCode: o.orderCode,
              customerName,
              amount: o.totalDeposit || o.depositAmount || 0,
              time: o.createdAt,
              url: `${isStaff ? '/staff' : '/admin'}/don-thue?search=${encodeURIComponent(o.orderCode || '')}`,
              badge: hasDeposit ? 'ĐƠN CỌC MỚI' : 'ĐƠN VỪA ĐẶT',
            });
          }

          // B. Lịch ship váy / giao váy cho khách trong ngày hôm nay
          if (isSameDayVietnam(o.rentalStartDate) && !['completed', 'complete'].includes(rawSt)) {
            notifs.push({
              id: `order-ship-${orderIdStr}`,
              type: 'ship',
              orderCode: o.orderCode,
              customerName,
              dressName,
              time: o.rentalStartDate || new Date(),
              url: `${isStaff ? '/staff' : '/admin'}/don-thue?search=${encodeURIComponent(o.orderCode || '')}`,
              badge: 'LỊCH SHIP VÁY',
            });
          }

          // C. Lịch khách hẹn trả váy trong ngày hôm nay
          if (isSameDayVietnam(o.rentalEndDate) && !['completed', 'complete'].includes(rawSt)) {
            notifs.push({
              id: `order-return-${orderIdStr}`,
              type: 'return',
              orderCode: o.orderCode,
              customerName,
              dressName,
              time: o.rentalEndDate || new Date(),
              url: `${isStaff ? '/staff' : '/admin'}/don-thue?search=${encodeURIComponent(o.orderCode || '')}`,
              badge: 'LỊCH TRẢ VÁY',
            });
          }
        });
      } catch (err) {
        console.warn('Orders notification fetch error:', err);
      }

      // 2. Fetch Appointments (Lịch hẹn thử váy trong ngày hôm nay)
      try {
        const aptsRes = await getAppointmentsApi({ limit: 100 });
        const apts = Array.isArray(aptsRes?.data) ? aptsRes.data : (Array.isArray(aptsRes) ? aptsRes : getAppointments());
        if (Array.isArray(apts)) {
          apts.forEach((a) => {
            const aptDateStr = a.appointmentDate || a.date;
            if (a.status === 'cancelled') return;

            // Chỉ hiển thị lịch thử váy có ngày hẹn đúng hôm nay hoặc vừa đặt hôm nay
            const isForToday = isSameDayVietnam(aptDateStr);
            const isCreatedToday = isSameDayVietnam(a.createdAt);

            if (isForToday || isCreatedToday) {
              const timeSlotStr = a.timeSlot || '09:00 — 10:30';
              notifs.push({
                id: `apt-${a._id || a.id || a.appointmentCode || Math.random()}`,
                type: 'appointment',
                orderCode: a.appointmentCode || a.id || 'LỊCH HẸN',
                customerName: a.customerName || a.fullName || 'Cô Dâu / Chú Rể',
                timeSlot: timeSlotStr,
                date: aptDateStr,
                branchName: a.branchName || 'Showroom UniBridal',
                time: a.createdAt || a.appointmentDate || new Date(),
                url: `${isStaff ? '/staff' : '/admin'}/lich-tong-quan`,
                badge: isForToday ? 'LỊCH THỬ HÔM NAY' : 'LỊCH THỬ MỚI',
              });
            }
          });
        }
      } catch (err) {
        console.warn('Appointments notification fetch error:', err);
      }

      // Sắp xếp thời gian mới nhất lên đầu
      notifs.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
      setLiveNotifications(notifs);
    } catch (err) {
      console.error('Error fetching live notifications:', err);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    const timer = setInterval(fetchLiveNotifications, 20000); // 20s polling
    const handleUpdate = () => fetchLiveNotifications();
    window.addEventListener(APPOINTMENT_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener(APPOINTMENT_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [isStaff]);

  // Ticker Auto-rotation every 4.5s
  useEffect(() => {
    if (isTickerPaused || liveNotifications.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTickerIdx((prev) => (prev + 1) % liveNotifications.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isTickerPaused, liveNotifications.length]);

  const handleSelectNotification = (item) => {
    markIdAsRead(item.id);
    navigate(item.url);
  };

  const currentNotif = liveNotifications[currentTickerIdx % Math.max(liveNotifications.length, 1)];

  const getActiveKey = () => {
    if (activeMenu) {
      const lower = activeMenu.toLowerCase();
      if (lower.includes('lịch tổng quan') || lower === 'lich-tong-quan' || lower === 'schedule' || lower.includes('lịch hẹn') || lower === 'appointments' || lower === 'lich-hen') return 'lich-tong-quan';
      if (lower.includes('tổng quan') || lower === 'dashboard') return 'dashboard';
      if (lower.includes('đơn thuê') || lower === 'don-thue') return 'don-thue';
      if (lower.includes('mẫu hợp đồng') || lower === 'contract-templates') return 'contract-templates';
      if (lower.includes('hợp đồng') || lower === 'contracts') return 'contracts';
      if (lower.includes('danh mục') || lower === 'categories' || lower === 'danh-muc') return 'categories';
      if (lower.includes('tài khoản') || lower.includes('account') || lower.includes('user')) return 'accounts';
      if (lower.includes('kho hàng') || lower.includes('sản phẩm') || lower === 'inventory' || lower === 'san-pham') return 'inventory';
      if (lower.includes('chăm sóc') || lower === 'customer-care') return 'customer-care';
      if (lower.includes('doanh thu') || lower === 'revenue') return 'revenue';
    }
    if (currentPath.includes('/lich-tong-quan') || currentPath.includes('/schedule') || currentPath.includes('/lich-hen') || currentPath.includes('/appointments')) return 'lich-tong-quan';
    if (currentPath.includes('/dashboard')) return 'dashboard';
    if (currentPath.includes('/reports') || currentPath.includes('/revenue')) return 'revenue';
    if (currentPath.includes('/accounts') || currentPath.includes('/users') || currentPath.includes('/tai-khoan')) return 'accounts';
    if (currentPath.includes('/don-thue') || currentPath.includes('/orders')) return 'don-thue';
    if (currentPath.includes('/kho-hang') || currentPath.includes('/inventory')) return 'inventory';
    if (currentPath.includes('/cham-soc-khach-hang') || currentPath.includes('/customer-care')) return 'customer-care';
    if (currentPath.includes('/hop-dong') || currentPath.includes('/contracts')) return 'contracts';
    if (currentPath.includes('/mau-hop-dong') || currentPath.includes('/contract-templates')) return 'contract-templates';
    if (currentPath.includes('/danh-muc') || currentPath.includes('/categories')) return 'categories';
    return 'dashboard';
  };

  const activeKey = getActiveKey();

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Tổng Quan',
      icon: LayoutDashboard,
      to: isStaff ? '/staff/dashboard' : '/admin/dashboard'
    },
    {
      key: 'lich-tong-quan',
      label: 'Lịch Tổng Quan',
      icon: CalendarDays,
      to: isStaff ? '/staff/lich-tong-quan' : '/admin/lich-tong-quan'
    },
    {
      key: 'don-thue',
      label: 'Quản Lý Đơn Thuê',
      icon: CalendarCheck,
      to: isStaff ? '/staff/don-thue' : '/admin/don-thue'
    },
    {
      key: 'contracts',
      label: 'Quản Lý Hợp Đồng',
      icon: FileSignature,
      to: isStaff ? '/staff/hop-dong' : '/admin/hop-dong'
    },
    {
      key: 'inventory',
      label: 'Quản Lý Sản Phẩm',
      icon: Package,
      to: isStaff ? '/staff/kho-hang' : '/admin/kho-hang'
    },
    {
      key: 'customer-care',
      label: 'Chăm Sóc Khách Hàng',
      icon: Headphones,
      to: isStaff ? '/staff/cham-soc-khach-hang' : '/admin/cham-soc-khach-hang'
    },
    ...(!isStaff ? [
      {
        key: 'categories',
        label: 'Quản Lý Danh Mục',
        icon: Tag,
        to: '/admin/danh-muc'
      },
      {
        key: 'accounts',
        label: 'Quản Lý Tài Khoản',
        icon: Users,
        to: '/admin/accounts'
      },
      {
        key: 'revenue',
        label: 'Báo Cáo Doanh Thu',
        icon: BarChart3,
        to: '/admin/reports/revenue'
      }
    ] : [])
  ];

  const userName = user?.fullName || user?.name || (isStaff ? 'Chuyên Viên Atelier' : 'Quản Trị Viên UniBridal');
  const userAvatar = (!isStaff || user?.role === 'admin')
    ? adminAvatarImg
    : (user?.avatar || adminAvatarImg || heroBride);
  const userRoleText = isStaff ? 'STAFF MODE' : 'ADMIN MODE';

  const handleLogout = () => {
    navigate('/login', { replace: true });
    logout();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-jakarta text-[#2C2523] flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#FCF7F4] border-r border-[#EFE5E1] flex flex-col justify-between py-6 px-4 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shrink-0 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top Logo */}
          <div className="flex items-center justify-between px-2 mb-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-[#EFE5E0] flex items-center justify-center p-1 shrink-0 transition-transform group-hover:scale-105">
                <img
                  src={logoImg}
                  alt="UniBridal"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-[19px] font-bold tracking-normal text-[#BE807C] select-none leading-none">
                  UniBridal
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#A39192] mt-1 font-semibold">
                  Atelier Haute Couture
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#733F49] hover:bg-[#F3E7E3]"
              aria-label="Đóng menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu Section Title */}
          <div className="px-3 mb-3">
            <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-[#A39192]">
              MENU QUẢN TRỊ
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;
              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13.5px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#F2E4DE] text-[#5F333B] font-bold shadow-xs'
                      : 'text-[#6D5D5E] hover:bg-[#F8EFEA] hover:text-[#5F333B]'
                  }`}
                >
                  <Icon
                    size={18}
                    className={isActive ? 'text-[#733F49]' : 'text-[#8A797A]'}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Box */}
        <div className="mt-8 rounded-lg bg-[#F6ECE8] border border-[#EFE2DD] p-2.5 flex flex-col gap-1">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold text-[#5F333B] bg-transparent hover:bg-[#EDE0DA] transition-colors"
          >
            <Store size={16} className="text-[#733F49]" />
            <span>VỀ TRANG CHỦ</span>
          </Link>
          <div className="h-px bg-[#EADBCE] my-0.5" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold text-[#C93B3B] bg-transparent hover:bg-[#FADBD8] transition-colors w-full text-left cursor-pointer"
          >
            <LogOut size={16} />
            <span>ĐĂNG XUẤT</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF5F2]">
        {/* Top Header Bar */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#F0E6E2] flex items-center justify-between sticky top-0 z-30">
          {/* Left: Sidebar toggle + Title */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#733F49] hover:bg-[#F8EFEA]"
              aria-label="Mở menu điều hướng"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2.5">
              <Crown size={20} className="text-[#8A797A] shrink-0" />
              {(headerTitle || (activeMenu === 'customer-care' ? 'Chăm Sóc Khách Hàng' : null)) && (
                <span className="font-playfair text-[18px] sm:text-[21px] font-bold text-[#5F2B36] tracking-tight leading-none m-0 p-0 select-none hidden sm:inline">
                  {headerTitle || 'Chăm Sóc Khách Hàng'}
                </span>
              )}
            </div>
          </div>

          {/* Center: Live Notification Ticker Pill (Đơn mới cọc & Lịch thử váy mới) */}
          <div
            className="hidden md:flex items-center justify-center flex-1 max-w-xl lg:max-w-2xl mx-3"
            onMouseEnter={() => setIsTickerPaused(true)}
            onMouseLeave={() => setIsTickerPaused(false)}
          >
            {liveNotifications.length > 0 && currentNotif ? (
              <div className="w-full flex items-center justify-between gap-2 bg-gradient-to-r from-[#FFFBF9] via-[#FAF3F0] to-[#FFFBF9] border border-[#F2DFD8] hover:border-[#D6A498] rounded-full py-1.5 px-3.5 shadow-xs transition-all duration-300">
                <div
                  onClick={() => handleSelectNotification(currentNotif)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
                  title="Nhấn để xem chi tiết ngay"
                >
                  {currentNotif.type === 'deposit' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF6EE] text-[#1E8347] border border-[#CDEBCE] shrink-0 tracking-wider">
                      <CreditCard size={11} className="shrink-0" />
                      <span>{currentNotif.badge}</span>
                    </span>
                  ) : currentNotif.type === 'ship' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5] shrink-0 tracking-wider">
                      <Truck size={11} className="shrink-0" />
                      <span>{currentNotif.badge}</span>
                    </span>
                  ) : currentNotif.type === 'return' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] shrink-0 tracking-wider">
                      <RotateCcw size={11} className="shrink-0" />
                      <span>{currentNotif.badge}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDECEE] text-[#BE4B5E] border border-[#F9CFD7] shrink-0 tracking-wider">
                      <CalendarCheck size={11} className="shrink-0" />
                      <span>{currentNotif.badge}</span>
                    </span>
                  )}

                  <span className="text-[12.5px] font-medium text-[#4A3B32] truncate group-hover:text-[#733F49] transition-colors">
                    <strong className="font-bold text-[#2C2523]">{currentNotif.customerName}</strong>
                    {currentNotif.type === 'deposit' ? (
                      <> • Cọc <span className="font-bold text-[#1E8347]">{formatCurrencyVND(currentNotif.amount)}</span> • Đơn <span className="font-mono font-medium text-[#733F49]">#{currentNotif.orderCode}</span></>
                    ) : currentNotif.type === 'ship' ? (
                      <> • Ship váy hôm nay: <span className="font-semibold text-[#C2410C]">{currentNotif.dressName}</span> • Đơn <span className="font-mono font-medium text-[#733F49]">#{currentNotif.orderCode}</span></>
                    ) : currentNotif.type === 'return' ? (
                      <> • Hạn trả váy hôm nay • Đơn <span className="font-mono font-medium text-[#733F49]">#{currentNotif.orderCode}</span></>
                    ) : (
                      <> • {currentNotif.timeSlot} • Lịch hẹn #{currentNotif.orderCode}</>
                    )}
                  </span>

                  <span className="text-[11px] text-[#A89899] shrink-0 hidden lg:inline flex items-center gap-1 font-mono">
                    <Clock size={11} />
                    {timeAgo(currentNotif.time)}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 shrink-0 pl-1.5 border-l border-[#EFE2DC]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTickerIdx((prev) => (prev - 1 + liveNotifications.length) % liveNotifications.length);
                    }}
                    className="p-1 rounded-full text-[#8A797A] hover:bg-white hover:text-[#5F2B36] transition-colors cursor-pointer"
                    title="Thông báo trước"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-[10px] text-[#A89899] font-mono px-1">
                    {currentTickerIdx + 1}/{liveNotifications.length}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTickerIdx((prev) => (prev + 1) % liveNotifications.length);
                    }}
                    className="p-1 rounded-full text-[#8A797A] hover:bg-white hover:text-[#5F2B36] transition-colors cursor-pointer"
                    title="Thông báo kế tiếp"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-1.5 px-4 rounded-full bg-[#FAF5F2] border border-[#EFE5E0] text-[12px] text-[#8A797A]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Hôm nay chưa có đơn mới hoặc lịch ship/trả váy trong ngày</span>
              </div>
            )}
          </div>

          {/* Right Section: User Profile Widget */}
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[13.5px] font-bold text-[#2C2523] leading-tight">
                  {userName}
                </div>
                <div className={`inline-block mt-0.5 px-2 py-0.5 rounded-sm text-[9.5px] font-bold tracking-wider uppercase ${
                  isStaff ? 'bg-[#FDECEE] text-[#B8737D]' : 'bg-[#EBF5EE] text-[#2F6F4E]'
                }`}>
                  {userRoleText}
                </div>
              </div>
              <div className="relative">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#EFE5E1]"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Optional Page Heading Header if title or controls are passed */}
        {(title || controls) && (
          <div className="px-6 lg:px-8 pt-6 pb-2 max-w-[1400px] w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              {title && (
                <h1 className="font-playfair text-[32px] sm:text-[38px] font-normal text-[#5F2B36] tracking-tight leading-tight mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-[14px] text-[#7A6B6C] font-normal max-w-3xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            {controls && <div>{controls}</div>}
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 px-6 lg:px-8 pt-3.5 pb-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
