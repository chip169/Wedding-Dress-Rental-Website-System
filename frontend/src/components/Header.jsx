import React, { useState } from 'react';
import { Bell, MessageSquare, ShoppingBag, Heart, User, Menu, X } from 'lucide-react';
import logoImg from '../assets/logo.png';

const Header = ({ onOpenBooking, cartCount = 2, wishlistCount = 4 }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-[#E6DAC8]/40 shadow-[0px_1px_8px_rgba(201,138,144,0.06)]">
      <div className="max-w-[1280px] mx-auto h-[80px] px-6 sm:px-8 flex items-center justify-between">
        
        {/* Brand / Logo using the official logo image */}
        <a href="#" className="flex items-center gap-2.5 no-underline group select-none">
          <img
            src={logoImg}
            alt="UniBridal Logo"
            className="h-[38px] w-auto object-contain"
          />
          <span className="font-playfair text-[24px] font-bold tracking-[0.5px] text-[#2C2523] leading-none">
            UniBridal
          </span>
        </a>

        {/* Navigation Desktop: Exactly 3 links from design */}
        <nav className="hidden md:flex items-center gap-10">
          <a
            href="#home"
            className="font-jakarta text-[15px] font-medium text-[#B8737D] no-underline hover:text-[#B8737D] transition-colors"
          >
            Trang chủ
          </a>
          <a
            href="#collection"
            className="font-jakarta text-[15px] font-medium text-[#2C2523] no-underline hover:text-[#B8737D] transition-colors"
          >
            Bộ Sưu Tập
          </a>
          <a
            href="#brides"
            className="font-jakarta text-[15px] font-medium text-[#2C2523] no-underline hover:text-[#B8737D] transition-colors"
          >
            Về chúng tôi
          </a>
        </nav>

        {/* Action Icons right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification with dot */}
          <button
            type="button"
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] hover:bg-[#FCEEE9]/50 transition-colors border-0 bg-transparent cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-[19px] h-[19px] stroke-[1.75]" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#B8737D] ring-2 ring-white" />
          </button>

          {/* Chat / Message bubble */}
          <button
            type="button"
            onClick={onOpenBooking}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] hover:bg-[#FCEEE9]/50 transition-colors border-0 bg-transparent cursor-pointer"
            title="Tư vấn trực tuyến"
          >
            <MessageSquare className="w-[19px] h-[19px] stroke-[1.75]" />
          </button>

          {/* Shopping Bag with badge '2' */}
          <button
            type="button"
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] hover:bg-[#FCEEE9]/50 transition-colors border-0 bg-transparent cursor-pointer"
            title="Giỏ thuê váy"
          >
            <ShoppingBag className="w-[19px] h-[19px] stroke-[1.75]" />
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#B8737D] text-white font-jakarta text-[10px] font-bold flex items-center justify-center leading-none">
              {cartCount}
            </span>
          </button>

          {/* Wishlist Heart */}
          <button
            type="button"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] hover:bg-[#FCEEE9]/50 transition-colors border-0 bg-transparent cursor-pointer"
            title="Yêu thích"
          >
            <Heart className="w-[19px] h-[19px] stroke-[1.75]" />
          </button>

          {/* User Profile */}
          <button
            type="button"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] hover:bg-[#FCEEE9]/50 transition-colors border-0 bg-transparent cursor-pointer"
            title="Tài khoản"
          >
            <User className="w-[19px] h-[19px] stroke-[1.75]" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-[#2C2523] hover:bg-[#FCEEE9] border-0 bg-transparent cursor-pointer ml-1"
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
            className="block font-jakarta text-[15px] font-medium text-[#B8737D] no-underline"
          >
            Trang chủ
          </a>
          <a
            href="#collection"
            onClick={() => setMobileMenuOpen(false)}
            className="block font-jakarta text-[15px] font-medium text-[#2C2523] no-underline"
          >
            Bộ Sưu Tập
          </a>
          <a
            href="#brides"
            onClick={() => setMobileMenuOpen(false)}
            className="block font-jakarta text-[15px] font-medium text-[#2C2523] no-underline"
          >
            Về chúng tôi
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
