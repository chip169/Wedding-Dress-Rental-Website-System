import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ClipboardPenLine, History, LogOut, ReceiptText } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import BookingModal from '../common/BookingModal';
import { clearProfile } from '../../services/profileService';

const accountLayoutStyles = `
:where(.profile-page) :is(h1, h2, h3, h4, p) { margin: 0; }
:where(.profile-page) button { background-color: transparent; font-family: inherit; cursor: pointer; }
.profile-page { background: #fff8f6; }
.profile-main { min-height: 809.5px; }
.profile-page button, .profile-page a, .profile-page input { -webkit-tap-highlight-color: transparent; }
.profile-page :is(button, a, input):focus-visible { outline: 2px solid #874e57; outline-offset: 4px; }
.account-overline { font-size: 10px; line-height: 1.4; letter-spacing: .13em; text-transform: uppercase; }
.account-heading-rule { width: 46px; height: 3px; background: #b8737d; border-radius: 2px; }
.account-tab { border-radius: 16px; padding: 7px 12px; background: #f7ece8 !important; color: #745f5b; font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.account-tab:hover, .account-tab:focus-visible { background: #ecd8d3 !important; }
.account-tab-active { background: #874e57 !important; color: white; }
.account-status { display: inline-block; border-radius: 12px; padding: 4px 8px; font-size: 10px; font-weight: 700; line-height: 1.2; }
.account-status-active { background: #f7dfe0; color: #723e49; }
.account-status-complete { background: #fbe6c9; color: #795739; }
.account-button-primary, .account-button-secondary { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 8px 13px; font-size: 10px; font-weight: 600; letter-spacing: .05em; text-align: center; transition: background .15s, color .15s; }
.account-button-primary { background: #874e57 !important; color: white !important; }
.account-button-primary:hover { background: #6e3c45 !important; }
.account-button-secondary { border: 1px solid #eadbd8; background: #fff8f6 !important; color: #6d5554; }
.account-button-secondary:hover:not(:disabled) { background: #f5e6e2 !important; }
.account-progress-done, .account-progress-pending { height: 4px; border-radius: 4px; }
.account-progress-done { background: #874e57; }
.account-progress-pending { background: #e8dddd; }
.account-detail-content { max-width: 1280px; margin: 0 auto; }
.account-order-card { box-shadow: 0 3px 14px #683b4008; }
.profile-page :is(.account-tab, .account-button-primary, .account-button-secondary):focus-visible { outline: 2px solid #874e57; outline-offset: 3px; }
@media (max-width: 639px) {
  .account-order-card { padding: 16px; }
  .account-order-card img { width: 85px; height: 110px; }
  .account-detail-content h1 { font-size: 28px; }
}
`;

const items = [
  { to: '/profile', label: 'Chỉnh sửa hồ sơ', Icon: ClipboardPenLine, end: true },
  { to: '/profile/orders', label: 'Lịch sử đơn hàng', Icon: ReceiptText },
  { to: '/profile/password', label: 'Đổi mật khẩu', Icon: History },
];

export function AccountSidebar({ onLogout }) {
  return (
    <aside className="profile-sidebar rounded-lg border border-[#f4edeb] bg-white p-4">
      <p className="mb-2 mt-1 text-[11px] font-medium uppercase tracking-[2.5px] text-[#874e57]">Bridal Concierge</p>
      <h2 className="mb-3 text-lg font-semibold">Danh Mục Quản Lý</h2>
      <nav aria-label="Quản lý tài khoản" className="flex flex-col gap-1">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-sm px-2 py-2.5 text-left text-sm transition-colors ${
                isActive ? 'bg-[#faeae5] text-[#874e57]' : 'text-[#615452] hover:bg-[#fff8f6]'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex items-center gap-2 border-t border-[#f1ebe9] px-2 pb-2 pt-3 text-left text-sm text-[#c33232] hover:text-[#962727]"
        >
          <LogOut size={17} />
          Đăng xuất
        </button>
      </nav>
    </aside>
  );
}

export default function AccountLayout({ children, breadcrumb = [], notice, onLogout, hideSidebar = false }) {
  const navigate = useNavigate();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const logout = onLogout || (() => { clearProfile(); navigate('/login'); });

  return (
    <div className="profile-page min-h-screen font-jakarta text-[#302725]">
      <style>{accountLayoutStyles}</style>
      <Header onLogout={logout} onOpenBooking={() => setIsBookingOpen(true)} />
      <main className="profile-main mx-auto w-full max-w-[1320px] px-5 pb-20 pt-4 sm:px-8">
        <nav aria-label="Đường dẫn" className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#6c5b57]">
          <Link to="/" className="hover:text-[#874e57]">Trang chủ</Link>
          <span aria-hidden="true" className="text-[#ccb7b1]">/</span>
          <Link to="/profile" className="hover:text-[#874e57]">Hồ Sơ Cá Nhân</Link>
          {breadcrumb.map((part, index) => (
            <React.Fragment key={index}>
              <span aria-hidden="true" className="text-[#ccb7b1]">/</span>
              {part.to ? (
                <Link to={part.to} className="hover:text-[#874e57]">{part.label}</Link>
              ) : (
                <span aria-current="page" className="text-[#874e57]">{part.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
        {notice}
        <div className={hideSidebar ? '' : 'grid items-start gap-6 lg:grid-cols-[minmax(240px,380px)_minmax(0,1fr)] lg:gap-10'}>
          {!hideSidebar && <AccountSidebar onLogout={logout} />}
          {children}
        </div>
      </main>
      <Footer variant="profile" />
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </div>
  );
}
