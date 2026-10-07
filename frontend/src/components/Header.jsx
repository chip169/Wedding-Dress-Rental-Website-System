import React, { useState } from 'react';
import { Bell, MessageSquare, ShoppingBag, Heart, User, Menu, X } from 'lucide-react';
import logoImg from '../assets/logo.png';

const Header = ({ onOpenBooking, cartCount = 2 }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-[#E6DAC8]/40 shadow-[0px_1px_6px_rgba(201,138,144,0.05)]">
      <div className="max-w-[1280px] mx-auto h-[66px] px-6 sm:px-8 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <a href="#" className="flex items-center gap-2.5 no-underline group select-none">
          <img
            src={logoImg}
            alt="UniBridal Emblem"
            className="h-[30px] w-auto object-contain"
          />
          <span className="font-playfair text-[24px] font-bold tracking-[0.2px] text-[#2C2523] leading-none">
            UniBridal
          </span>
        </a>

        {/* Navigation Desktop: Exactly matching font-size 18px, bold/semi-bold & gap-12 from Image 1 */}
        <nav className="hidden md:flex items-center gap-12">
          <a
            href="#home"
            className="font-jakarta text-[18px] font-semibold text-[#B8737D] no-underline hover:text-[#a6626c] transition-colors"
          >
            Trang chủ
          </a>
          <a
            href="#collection"
            className="font-jakarta text-[18px] font-semibold text-[#2C2523] no-underline hover:text-[#B8737D] transition-colors"
          >
            Bộ Sưu Tập
          </a>
          <a
            href="#brides"
            className="font-jakarta text-[18px] font-semibold text-[#2C2523] no-underline hover:text-[#B8737D] transition-colors"
          >
            Về chúng tôi
          </a>
        </nav>

        {/* Action Icons right */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Notification with dot */}
          <button
            type="button"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] transition-colors border-0 bg-transparent cursor-pointer p-0"
            title="Thông báo"
          >
            <Bell className="w-[18px] h-[18px] stroke-[1.8]" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#B8737D] ring-2 ring-white" />
          </button>

          {/* Chat / Message bubble */}
          <button
            type="button"
            onClick={onOpenBooking}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] transition-colors border-0 bg-transparent cursor-pointer p-0"
            title="Tư vấn trực tuyến"
          >
            <MessageSquare className="w-[18px] h-[18px] stroke-[1.8]" />
          </button>

          {/* Shopping Bag with badge '2' */}
          <button
            type="button"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] transition-colors border-0 bg-transparent cursor-pointer p-0"
            title="Giỏ thuê váy"
          >
            <ShoppingBag className="w-[18px] h-[18px] stroke-[1.8]" />
            <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#B8737D] text-white font-jakarta text-[9.5px] font-bold flex items-center justify-center leading-none">
              {cartCount}
            </span>
          </button>

          {/* Wishlist Heart */}
          <button
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] transition-colors border-0 bg-transparent cursor-pointer p-0"
            title="Yêu thích"
          >
            <Heart className="w-[18px] h-[18px] stroke-[1.8]" />
          </button>

          {/* User Profile / Login */}
          <a
            href="/login"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] transition-colors no-underline"
            title="Đăng nhập / Tài khoản"
          >
            <User className="w-[18px] h-[18px] stroke-[1.8]" />
          </a>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#2C2523] hover:bg-[#FCEEE9] border-0 bg-transparent cursor-pointer ml-1"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#E6DAC8]/50 px-6 py-5 space-y-3.5 shadow-xl">
          <a
            href="#home"
            onClick={() => setMobileMenuOpen(false)}
            className="block font-jakarta text-[17px] font-semibold text-[#B8737D] no-underline"
          >
            Trang chủ
          </a>
          <a
            href="#collection"
            onClick={() => setMobileMenuOpen(false)}
            className="block font-jakarta text-[17px] font-semibold text-[#2C2523] no-underline"
          >
            Bộ Sưu Tập
          </a>
          <a
            href="#brides"
            onClick={() => setMobileMenuOpen(false)}
            className="block font-jakarta text-[17px] font-semibold text-[#2C2523] no-underline"
          >
            Về chúng tôi
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
