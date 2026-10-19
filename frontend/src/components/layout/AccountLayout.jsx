import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ClipboardPenLine, History, LogOut, ReceiptText } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import BookingModal from '../common/BookingModal';
import { clearProfile } from '../../services/profileService';
import '../../pages/customer/ProfilePage.css';

const items = [
  { to: '/profile', label: 'Chỉnh sửa hồ sơ', Icon: ClipboardPenLine, end: true },
  { to: '/profile/orders', label: 'Lịch sử đơn hàng', Icon: ReceiptText },
  { to: '/profile/password', label: 'Đổi mật khẩu', Icon: History },
];

export function AccountSidebar({ onLogout }) {
  return <aside className="profile-sidebar rounded-lg border border-[#f4edeb] bg-white p-4">
    <p className="mb-2 mt-1 text-[11px] font-medium uppercase tracking-[2.5px] text-[#874e57]">Bridal Concierge</p>
    <h2 className="mb-3 text-lg font-semibold">Danh Mục Quản Lý</h2>
    <nav aria-label="Quản lý tài khoản" className="flex flex-col gap-1">
      {items.map(({ to, label, Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-2 rounded-sm px-2 py-2.5 text-left text-sm transition-colors ${isActive ? 'bg-[#faeae5] text-[#874e57]' : 'text-[#615452] hover:bg-[#fff8f6]'}`}><Icon size={17} />{label}</NavLink>)}
      <button type="button" onClick={onLogout} className="mt-1 flex items-center gap-2 border-t border-[#f1ebe9] px-2 pb-2 pt-3 text-left text-sm text-[#c33232] hover:text-[#962727]"><LogOut size={17} />Đăng xuất</button>
    </nav>
  </aside>;
}

export default function AccountLayout({ children, breadcrumb = [], notice, onLogout, hideSidebar = false }) {
  const navigate = useNavigate();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const logout = onLogout || (() => { clearProfile(); navigate('/login'); });
  return <div className="profile-page min-h-screen font-jakarta text-[#302725]">
    <Header onLogout={logout} onOpenBooking={() => setIsBookingOpen(true)} />
    <main className="profile-main mx-auto w-full max-w-[1320px] px-5 pb-20 pt-4 sm:px-8">
      <nav aria-label="Đường dẫn" className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#6c5b57]">
        <Link to="/" className="hover:text-[#874e57]">Trang chủ</Link><span aria-hidden="true" className="text-[#ccb7b1]">/</span>
        <Link to="/profile" className="hover:text-[#874e57]">Hồ Sơ Cá Nhân</Link>
        {breadcrumb.map((part, index) => <React.Fragment key={index}><span aria-hidden="true" className="text-[#ccb7b1]">/</span>{part.to ? <Link to={part.to} className="hover:text-[#874e57]">{part.label}</Link> : <span aria-current="page" className="text-[#874e57]">{part.label}</span>}</React.Fragment>)}
      </nav>
      {notice}
      <div className={hideSidebar ? '' : 'grid items-start gap-6 lg:grid-cols-[minmax(240px,380px)_minmax(0,1fr)] lg:gap-10'}>
        {!hideSidebar && <AccountSidebar onLogout={logout} />}
        {children}
      </div>
    </main>
    <Footer variant="profile" />
    <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
  </div>;
}
