import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Archive, BarChart3, CalendarCheck2, FileText, Gem, House, LayoutDashboard,
  LogOut, Menu, Scissors, Sparkles, Tags, UserRoundCog,
  UsersRound, X,
} from 'lucide-react';
import './Dashboard.css';

const COMMON_ITEMS = [
  { label: 'Quản Lý Sản Phẩm', Icon: Scissors },
  { label: 'Quản Lý Danh Mục', Icon: Tags },
  { label: 'Quản Lý Đơn Thuê', Icon: CalendarCheck2 },
  { label: 'Quản Lý Kho Hàng', Icon: Archive },
  { label: 'Quản Lý Hợp Đồng', Icon: FileText },
  { label: 'Chăm sóc khách hàng', Icon: UsersRound },
];

function Sidebar({ role, close, closeButtonRef, activeNav }) {
  const isAdmin = role === 'admin';
  const items = [
    { label: 'Tổng Quan', Icon: LayoutDashboard, path: isAdmin ? '/admin/dashboard' : '/staff/dashboard' },
    ...(isAdmin ? [{ label: 'Quản Lý Tài Khoản', Icon: UserRoundCog }] : []),
    ...COMMON_ITEMS,
    ...(isAdmin ? [{ label: 'Báo Cáo Doanh Thu', Icon: BarChart3, path: '/admin/reports/revenue' }] : []),
  ];
  const navigate = useNavigate();

  return (
    <aside className="ub-dashboard-sidebar sticky top-0 flex h-screen w-[288px] flex-col bg-[#fff0ec] px-4 pb-4 pt-[18px] max-[1120px]:w-[248px] max-[850px]:w-[288px]" aria-label="Menu quản trị">
      <div className="ub-dashboard-logo-row">
        <Link to="/" onClick={close} aria-label="UniBridal — Trang chủ">
          <img src="/images/unibridal-logo-full-transparent.png" alt="UniBridal" />
        </Link>
        <button ref={closeButtonRef} type="button" className="ub-dashboard-close" onClick={close} aria-label="Đóng menu"><X size={20} /></button>
      </div>
      <nav className="ub-dashboard-nav" aria-label="Điều hướng quản trị">
        <p>MENU QUẢN TRỊ</p>
        {items.map(({ label, Icon, path }) => label === activeNav ? (
          <div key={label} className="ub-dashboard-nav-item is-current" aria-current="page"><Icon size={17} strokeWidth={1.9} /><span>{label}</span></div>
        ) : path ? (
          <Link key={label} to={path} onClick={close} className="ub-dashboard-nav-item"><Icon size={17} strokeWidth={1.9} /><span>{label}</span></Link>
        ) : (
          <button key={label} type="button" className="ub-dashboard-nav-item" disabled title="Chức năng đang phát triển" aria-label={`${label} — đang phát triển`}>
            <Icon size={17} strokeWidth={1.9} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="ub-dashboard-sidebar-bottom mt-auto">
        <Link to="/" onClick={close}><House size={17} strokeWidth={1.8} /> VỀ TRANG CHỦ</Link>
        <button type="button" onClick={() => { close(); navigate('/login'); }}><LogOut size={17} strokeWidth={1.8} /> VỀ TRANG ĐĂNG NHẬP</button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ role, children, controls, title = 'Tổng Quan', subtitle = 'Tổng quan các số liệu', activeNav = 'Tổng Quan' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 850px)').matches);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 850px)');
    const onChange = () => { setIsMobile(media.matches); if (!media.matches) setMenuOpen(false); };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    if (isMobile) requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  useEffect(() => {
    if (!menuOpen || !isMobile) return undefined;
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { closeMenu(); return; }
      if (event.key !== 'Tab') return;
      const focusables = [...sidebarRef.current.querySelectorAll('a[href], button:not([disabled])')];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, isMobile]);

  return (
    <div className="ub-dashboard-shell flex min-h-screen bg-[#fff8f6] text-[#302626] font-jakarta">
      <div id="ub-dashboard-drawer" ref={sidebarRef} inert={isMobile && !menuOpen} aria-hidden={isMobile && !menuOpen ? 'true' : undefined} className={`ub-dashboard-sidebar-wrap w-[288px] shrink-0 max-[1120px]:w-[248px] max-[850px]:fixed max-[850px]:left-0 max-[850px]:top-0 max-[850px]:z-[60] max-[850px]:h-screen max-[850px]:w-[288px]${menuOpen ? ' is-open' : ''}`}><Sidebar role={role} close={closeMenu} closeButtonRef={closeButtonRef} activeNav={activeNav} /></div>
      {menuOpen && isMobile && <button type="button" className="ub-dashboard-scrim" onClick={closeMenu} aria-label="Đóng menu" />}
      <div className="ub-dashboard-main-column min-w-0 flex-1">
        <header className="ub-dashboard-topbar flex h-[82px] items-center justify-between border-b border-[#f3e8e3] bg-[#fff8f6] px-[42px] max-[850px]:px-6 max-[650px]:h-[65px] max-[650px]:px-[17px]">
          <button ref={menuButtonRef} type="button" className="ub-dashboard-menu-toggle" onClick={() => setMenuOpen(true)} aria-controls="ub-dashboard-drawer" aria-label="Mở menu quản trị" aria-expanded={menuOpen}><Menu size={22} /></button>
          <Sparkles className="ub-dashboard-sparkle" size={16} strokeWidth={1.8} aria-hidden="true" />
          <div className="ub-dashboard-user" aria-label="Tài khoản minh họa">
            <div className="ub-dashboard-user-text"><strong>Trần Bích Ngọc</strong><span>{role === 'admin' ? 'ADMIN MODE · MẪU' : 'STAFF MODE · MẪU'}</span></div>
            <div className="ub-dashboard-avatar" aria-hidden="true">BN<i /></div>
          </div>
        </header>
        <main className="ub-dashboard-content mx-auto max-w-[1460px] px-10 pb-16 pt-[25px] max-[1120px]:px-[25px] max-[650px]:px-[17px] max-[650px]:pb-10 max-[650px]:pt-[22px]">
          <div className="ub-dashboard-heading-row flex items-center justify-between gap-4 max-[650px]:flex-col max-[650px]:items-start">
            <div><h1>{title}</h1><p>{subtitle}</p></div>
            {controls}
          </div>
          <p className="ub-dashboard-demo-label"><Gem size={13} aria-hidden="true" /> Dữ liệu minh họa</p>
          {children}
        </main>
      </div>
    </div>
  );
}
