import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, User, Calendar, ChevronDown, Menu, X, LogOut, Bell, MessageSquare } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { clearProfile } from '../../services/profileService';
import { CART_EVENT, getCart } from '../../services/cartService';
import { getWishlistIds, WISHLIST_EVENT } from '../../services/wishlistService';

const Header = ({ onOpenBooking, onLogout, cartCount: propCartCount, wishlistCount: propWishlistCount }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userTimeoutRef = useRef(null);
  const [internalCartCount, setInternalCartCount] = useState(() => getCart().length);
  const [internalWishlistCount, setInternalWishlistCount] = useState(() => getWishlistIds().length);

  useEffect(() => {
    const refreshCart = () => setInternalCartCount(getCart().length);
    window.addEventListener(CART_EVENT, refreshCart);
    window.addEventListener('storage', refreshCart);
    return () => {
      window.removeEventListener(CART_EVENT, refreshCart);
      window.removeEventListener('storage', refreshCart);
    };
  }, []);

  useEffect(() => {
    const refreshWishlist = () => setInternalWishlistCount(getWishlistIds().length);
    window.addEventListener(WISHLIST_EVENT, refreshWishlist);
    window.addEventListener('storage', refreshWishlist);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, refreshWishlist);
      window.removeEventListener('storage', refreshWishlist);
    };
  }, []);

  const cartCount = propCartCount !== undefined ? propCartCount : internalCartCount;
  const wishlistCount = propWishlistCount !== undefined ? propWishlistCount : internalWishlistCount;
  const isWishlistPage = location.pathname === '/wishlist' || location.pathname === '/yeu-thich';
  const isMessagesPage = location.pathname === '/tin-nhan' || location.pathname === '/messages' || location.pathname === '/chat';
  const isAboutPage = location.pathname === '/about' || location.pathname === '/ve-chung-toi';
  const isCollectionPage = location.pathname === '/collection' || location.pathname === '/bo-suu-tap';
  const isHomePage = location.pathname === '/';

  const categories = [
    {
      title: 'Tất Cả Thiết Kế Bộ Sưu Tập',
      subtitle: 'Khám phá hơn 70+ mẫu trang phục cưới cao cấp',
      href: '/collection',
    },
    {
      title: 'Váy Cưới Haute Couture',
      subtitle: 'Độc bản may đo & ren Pháp cao cấp',
      href: '/collection',
    },
    {
      title: 'Phom Dáng Corsetry',
      subtitle: 'Ballgown, Mermaid, A-Line chuẩn tỷ lệ',
      href: '#silhouettes',
    },
    {
      title: 'Vest Cưới & Tuxedo',
      subtitle: 'Phong cách quý ông Châu Âu thanh lịch',
      href: '/collection',
    },
    {
      title: 'Áo Dài Cưới Truyền Thống',
      subtitle: 'Gấm thêu tay hoàng gia cao cấp',
      href: '/collection',
    },
  ];

  const userAccountItems = [
    {
      title: 'Trang cá nhân',
      subtitle: 'Quản lý thông tin & hồ sơ',
      href: '/profile',
    },
    {
      title: 'Lịch sử đơn hàng',
      subtitle: 'Tiến độ thuê & thử váy cưới',
      href: '/profile/orders',
    },
    {
      title: 'Quản lý đơn thuê (Staff)',
      subtitle: 'Bàn giao, kiểm định & định danh số đo',
      href: '/admin/don-thue',
    },
    {
      title: 'Đổi mật khẩu',
      subtitle: 'Bảo mật tài khoản',
      href: '/profile/password',
    },
    {
      title: 'Đăng nhập',
      subtitle: 'Đăng nhập tài khoản thành viên',
      href: '/login',
    },
    {
      title: 'Đăng ký thành viên',
      subtitle: 'Tạo tài khoản UniBridal mới',
      href: '/register',
    },
    {
      title: 'Đăng xuất',
      subtitle: 'Thoát phiên đăng nhập hiện tại',
      isLogout: true,
    },
  ];

  // Điều hướng thông minh: Nếu đang ở trang chủ thì cuộn mượt mà; nếu đang ở trang khác thì chuyển về trang chủ + hash
  const handleNavClick = (hash = '') => {
    setIsDropdownOpen(false);
    setMobileMenuOpen(false);

    if (hash && hash.startsWith('/')) {
      navigate(hash);
      return;
    }

    if (location.pathname === '/') {
      if (hash) {
        const elem = document.querySelector(hash);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    navigate(hash ? `/${hash}` : '/');
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    setMobileMenuOpen(false);
    if (onLogout) {
      onLogout();
      return;
    }
    clearProfile();
    navigate('/login');
  };

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150);
  };

  const handleUserMouseEnter = () => {
    if (userTimeoutRef.current) clearTimeout(userTimeoutRef.current);
    setIsUserMenuOpen(true);
  };

  const handleUserMouseLeave = () => {
    userTimeoutRef.current = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 150);
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-[#E6DAC8]/40 shadow-[0px_1px_6px_rgba(201,138,144,0.05)]">
      <div className="max-w-[1320px] mx-auto h-[68px] px-5 sm:px-8 flex items-center justify-between">

        {/* Brand / Logo */}
        <Link
          to="/"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('');
          }}
          className="flex items-center gap-2.5 no-underline group select-none cursor-pointer"
        >
          <img
            src={logoImg}
            alt="UniBridal Emblem"
            className="h-[32px] w-auto object-contain"
          />
          <span className="font-playfair text-[24px] font-bold tracking-[0.2px] text-[#2C2523] leading-none group-hover:text-[#B8737D] transition-colors">
            UniBridal
          </span>
        </Link>

        {/* Navigation Desktop */}
        <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
          <Link
            to="/"
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                handleNavClick('');
              }
            }}
            className={`font-jakarta text-[15.5px] no-underline transition-colors cursor-pointer ${
              isHomePage ? 'text-[#804E55] font-semibold' : 'font-medium text-[#2C2523] hover:text-[#B8737D]'
            }`}
          >
            Trang chủ
          </Link>

          {/* Bộ Sưu Tập - 1 Nút bấm trực tiếp */}
          <Link
            to="/collection"
            className={`font-jakarta text-[15.5px] no-underline transition-colors cursor-pointer ${
              isCollectionPage ? 'text-[#804E55] font-semibold' : 'font-medium text-[#2C2523] hover:text-[#B8737D]'
            }`}
          >
            Bộ Sưu Tập
          </Link>

          <Link
            to="/about"
            className={`font-jakarta text-[15.5px] no-underline transition-colors cursor-pointer ${
              isAboutPage ? 'text-[#804E55] font-semibold' : 'font-medium text-[#2C2523] hover:text-[#B8737D]'
            }`}
          >
            Về chúng tôi
          </Link>
        </nav>

        {/* Action Elements Right */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Notification Bell */}
          <button
            type="button"
            className="p-1.5 flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] transition-colors border-0 bg-transparent cursor-pointer"
            title="Thông báo hệ thống"
            onClick={() => onOpenBooking ? onOpenBooking() : navigate('/dat-lich')}
          >
            <Bell className="w-[19px] h-[19px] stroke-[1.8]" />
          </button>

          {/* Chat / Support */}
          <Link
            to="/tin-nhan"
            className={`relative w-[36px] h-[36px] sm:w-[38px] sm:h-[38px] flex items-center justify-center rounded-[12px] transition-all duration-300 cursor-pointer no-underline active:scale-95 ${
              isMessagesPage
                ? 'bg-[#FFF2F0] border border-[#D498A0] text-[#2C2523] shadow-[0_0_14px_rgba(218,142,150,0.55)]'
                : 'text-[#2C2523] hover:text-[#B8737D] hover:bg-[#FFF5F3] hover:border hover:border-[#D498A0]/50 hover:shadow-[0_0_10px_rgba(218,142,150,0.35)] border border-transparent'
            }`}
            style={
              isMessagesPage
                ? {
                    boxShadow: '0 0 14px rgba(218, 142, 150, 0.55), 0 1px 6px rgba(186, 122, 131, 0.25)',
                  }
                : undefined
            }
            title="Trò chuyện cùng chuyên viên"
          >
            <MessageSquare className="w-[18px] h-[18px] stroke-[1.8] text-[#2C2523]" />
          </Link>

          {/* Shopping Bag with badge */}
          <Link
            to="/cart"
            className="relative p-1.5 flex items-center justify-center text-[#2C2523] hover:text-[#B8737D] transition-colors border-0 bg-transparent cursor-pointer no-underline"
            title="Giỏ thuê váy"
          >
            <ShoppingBag className="w-[19px] h-[19px] stroke-[1.8]" />
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#B8737D] text-white font-jakarta text-[9.5px] font-bold flex items-center justify-center leading-none">
              {cartCount}
            </span>
          </Link>

          {/* Wishlist Heart (Hiệu ứng active hình vuông bo góc viền hồng + bóng đổ hồng tỏa sáng chuẩn 100% theo mẫu) */}
          <Link
            to="/wishlist"
            className={`relative w-[36px] h-[36px] sm:w-[38px] sm:h-[38px] flex items-center justify-center rounded-[12px] transition-all duration-300 cursor-pointer no-underline active:scale-95 ${
              isWishlistPage
                ? 'bg-[#FFF2F0] border border-[#D498A0] text-[#2C2523] shadow-[0_0_14px_rgba(218,142,150,0.55)]'
                : 'text-[#2C2523] hover:text-[#B8737D] hover:bg-[#FFF5F3] hover:border hover:border-[#D498A0]/50 hover:shadow-[0_0_10px_rgba(218,142,150,0.35)] border border-transparent'
            }`}
            style={
              isWishlistPage
                ? {
                    boxShadow: '0 0 14px rgba(218, 142, 150, 0.55), 0 1px 6px rgba(186, 122, 131, 0.25)',
                  }
                : undefined
            }
            title="Tủ đồ trong mơ (Danh sách yêu thích)"
          >
            <Heart className="w-[18px] h-[18px] stroke-[1.8] text-[#2C2523]" />
          </Link>

          {/* User Profile Dropdown */}
          <div
            className="relative group py-4"
            onMouseEnter={handleUserMouseEnter}
            onMouseLeave={handleUserMouseLeave}
          >
            <button
              id="user-profile-button"
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className={`p-1.5 flex items-center justify-center transition-colors border-0 bg-transparent cursor-pointer ${isUserMenuOpen ? 'text-[#B8737D]' : 'text-[#2C2523] group-hover:text-[#B8737D]'
                }`}
              title="Tài khoản cá nhân"
            >
              <User className="w-[19px] h-[19px] stroke-[1.8]" />
            </button>

            {/* Dropdown Menu Box */}
            <div
              id="user-dropdown-menu"
              className={`absolute top-full right-0 pt-1 z-50 transition-all duration-150 ${isUserMenuOpen
                ? 'block opacity-100 pointer-events-auto'
                : 'hidden group-hover:block group-hover:opacity-100 group-hover:pointer-events-auto'
                }`}
            >
              <div className="w-[280px] bg-white rounded-2xl shadow-[0_18px_45px_rgba(44,37,35,0.12)] border border-[#F0E6E8] p-4 text-left">
                <div className="text-[11px] font-bold tracking-wider text-[#B8737D] uppercase mb-2.5 px-2">
                  TÀI KHOẢN
                </div>

                <div className="space-y-1">
                  {userAccountItems.map((item, idx) => {
                    if (item.isLogout) {
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left block p-2.5 rounded-xl hover:bg-[#FFF2F0] transition-colors no-underline group/useritem cursor-pointer border-0 bg-transparent"
                        >
                          <div className="font-jakarta font-bold text-[14.5px] text-[#C33232] group-hover/useritem:text-[#A82525] transition-colors leading-snug flex items-center gap-1.5">
                            <LogOut className="w-3.5 h-3.5 stroke-[2]" />
                            <span>{item.title}</span>
                          </div>
                          <div className="font-jakarta text-[12px] text-[#A37878] mt-0.5 leading-normal font-normal">
                            {item.subtitle}
                          </div>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={idx}
                        to={item.href}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block p-2.5 rounded-xl hover:bg-[#FAF5F6] transition-colors no-underline group/useritem cursor-pointer"
                      >
                        <div className="font-jakarta font-bold text-[14.5px] text-[#2C2523] group-hover/useritem:text-[#B8737D] transition-colors leading-snug">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="font-jakarta text-[12px] text-[#78716C] mt-0.5 leading-normal font-normal">
                            {item.subtitle}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Đặt Lịch Thử Váy CTA Button */}
          <button
            type="button"
            onClick={onOpenBooking || (() => navigate('/thue-nhanh'))}
            className="hidden sm:inline-flex items-center gap-2 bg-[#B8737D] hover:bg-[#a6626c] text-white font-jakarta text-[13.5px] font-semibold px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer border-0 select-none ml-1 active:scale-95"
          >
            <Calendar className="w-4 h-4 stroke-[2]" />
            <span>Đặt Lịch Thử Váy</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 flex items-center justify-center text-[#2C2523] hover:bg-[#FCEEE9] rounded-lg border-0 bg-transparent cursor-pointer ml-1"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E6DAC8]/50 px-6 py-5 space-y-4 shadow-xl">
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('');
            }}
            className="block font-jakarta text-[16px] font-semibold text-[#2C2523] no-underline hover:text-[#B8737D]"
          >
            Trang chủ
          </Link>

          <Link
            to="/collection"
            onClick={() => setMobileMenuOpen(false)}
            className="block font-jakarta text-[16px] font-semibold text-[#2C2523] no-underline hover:text-[#B8737D]"
          >
            Bộ Sưu Tập
          </Link>


          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={`block font-jakarta text-[16px] no-underline ${
              isAboutPage ? 'text-[#804E55] font-semibold' : 'font-semibold text-[#2C2523] hover:text-[#B8737D]'
            }`}
          >
            Về chúng tôi
          </Link>

          <div>
            <div className="text-[11px] font-bold tracking-wider text-[#B8737D] uppercase mb-2">
              TÀI KHOẢN
            </div>
            <div className="pl-3 border-l-2 border-[#B8737D]/30 space-y-2.5">
              {userAccountItems.map((item, idx) => {
                if (item.isLogout) {
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left block no-underline border-0 bg-transparent p-0 cursor-pointer text-[#C33232] font-semibold text-[14px]"
                    >
                      {item.title}
                    </button>
                  );
                }

                return (
                  <Link
                    key={idx}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block no-underline"
                  >
                    <div className="text-[14px] font-semibold text-[#2C2523] hover:text-[#B8737D]">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-[12px] text-[#78716C]">
                        {item.subtitle}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenBooking) onOpenBooking();
                else handleNavClick('#home');
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#B8737D] hover:bg-[#a6626c] text-white font-jakarta text-[14px] font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer border-0"
            >
              <Calendar className="w-4 h-4 stroke-[2]" />
              <span>Đặt Lịch Thử Váy</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
