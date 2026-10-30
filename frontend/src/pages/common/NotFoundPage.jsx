import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock,
  ShieldAlert,
  Compass,
  ArrowLeft,
  Home,
  LogIn,
  Search,
  Sparkles,
  Calendar,
  Sparkle,
  UserPlus,
  HelpCircle,
  ShoppingBag
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../contexts/AuthContext';
import logoEmblem from '../../assets/logo_emblem.png';

/**
 * Màn hình 404 / 401 / 403 thông minh của UniBridal
 * Hiển thị khi:
 * - Người dùng vào liên kết không tồn tại (404)
 * - Chưa đăng nhập khi vào trang cần bảo mật (401)
 * - Đã đăng nhập nhưng không đủ quyền hạn (403, vd: khách vào trang quản trị/nhân viên)
 */
export default function NotFoundPage({ type: propType }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoggedIn, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Xác định loại lỗi từ props, route state hoặc query params
  const errorType =
    propType ||
    location.state?.type ||
    searchParams.get('type') ||
    (location.state?.reason === 'unauthenticated' ? '401' : null) ||
    (location.state?.reason === 'forbidden' ? '403' : null) ||
    '404';

  const is401 = errorType === '401' || errorType === 'unauthenticated';
  const is403 = errorType === '403' || errorType === 'forbidden';
  const is404 = !is401 && !is403;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/collection?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCF9F6] text-[#2C2523] flex flex-col font-sans selection:bg-[#F2D8D4] selection:text-[#733F49]">
      <Header />

      <main className="flex-1 flex items-center justify-center py-16 sm:py-24 px-4 relative overflow-hidden">
        {/* Decorative Luxury Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-radial from-[#F2D8D4]/45 via-[#FAF4EE]/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#E0A96D]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#733F49]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl w-full mx-auto relative z-10 text-center">
          
          {/* Top Emblem & Error Badge */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative mb-5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-2 border-[#EEDECF] shadow-lg flex items-center justify-center p-4 relative">
                {is401 ? (
                  <div className="w-14 h-14 rounded-full bg-[#FAF4EE] flex items-center justify-center text-[#E0A96D]">
                    <Lock className="w-8 h-8 stroke-[1.75]" />
                  </div>
                ) : is403 ? (
                  <div className="w-14 h-14 rounded-full bg-[#FFF4F2] flex items-center justify-center text-[#B8737D]">
                    <ShieldAlert className="w-8 h-8 stroke-[1.75]" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#FAF4EE] flex items-center justify-center text-[#733F49]">
                    <Compass className="w-8 h-8 stroke-[1.75] animate-spin-slow" />
                  </div>
                )}
                {/* Micro Emblem Gold Seal */}
                <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#733F49] p-1.5 shadow-md border-2 border-white flex items-center justify-center">
                  <img src={logoEmblem} alt="UniBridal Emblem" className="w-full h-full object-contain brightness-0 invert" />
                </div>
              </div>
            </div>

            {/* Error Code Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase bg-white border border-[#EEDECF] shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#E0A96D]" />
              {is401 && <span className="text-[#B8737D]">YÊU CẦU ĐĂNG NHẬP • 401 UNAUTHORIZED</span>}
              {is403 && <span className="text-[#893844]">TRUY CẬP BỊ GIỚI HẠN • 403 FORBIDDEN</span>}
              {is404 && <span className="text-[#733F49]">TRANG KHÔNG TỒN TẠI • 404 NOT FOUND</span>}
            </div>
          </div>

          {/* Large Stylish Error Display */}
          <div className="relative mb-4">
            <h1 className="font-playfair text-[76px] sm:text-[100px] leading-none font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#733F49] via-[#893844] to-[#B8737D] select-none opacity-90 drop-shadow-xs">
              {is401 ? '401' : is403 ? '403' : '404'}
            </h1>
          </div>

          {/* Heading Title */}
          <h2 className="font-playfair text-2xl sm:text-3xl text-[#2C2523] font-bold mb-3 tracking-tight">
            {is401 && 'Nàng Cần Đăng Nhập Để Tiếp Tục'}
            {is403 && 'Khu Vực Quản Trị Giới Hạn Quyền Hạn'}
            {is404 && 'Không Tìm Thấy Trang Hoặc Liên Kết Đã Bị Gỡ'}
          </h2>

          {/* Description Text */}
          <p className="text-[14px] sm:text-[15px] text-[#6B5C5D] max-w-lg mx-auto leading-relaxed mb-8">
            {is401 && (
              <>
                Trang này chứa dữ liệu đặt lịch hoặc bảo mật cá nhân của nàng.
                Vui lòng đăng nhập vào tài khoản <strong className="text-[#733F49]">UniBridal</strong> để tiếp tục trải nghiệm dịch vụ cưới cao cấp.
              </>
            )}
            {is403 && (
              <>
                Tài khoản hiện tại của bạn{' '}
                {user ? (
                  <span className="font-bold text-[#733F49]">({user.fullName || user.email} - Vai trò: {user.role || 'Khách hàng'})</span>
                ) : null}{' '}
                không có đặc quyền truy cập trang quản trị này. Nếu bạn là nhân viên hoặc quản lý showroom, vui lòng đăng nhập tài khoản có thẩm quyền tương ứng.
              </>
            )}
            {is404 && (
              <>
                Đường dẫn nàng vừa truy cập không tồn tại, đã được đổi tên hoặc nàng không có quyền xem liên kết này.
                UniBridal luôn sẵn sàng đồng hành cùng nàng tìm kiếm chiếc váy cưới trong mơ!
              </>
            )}
          </p>

          {/* Quick Dress Search Form */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8 relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#847374] absolute left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm mẫu váy cưới, dạ hội nàng quan tâm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-3 rounded-full bg-white border border-[#EEDECF] text-[13.5px] text-[#2C2523] placeholder-[#847374] shadow-xs focus:outline-none focus:border-[#733F49] focus:ring-2 focus:ring-[#733F49]/15 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-1.5 rounded-full bg-[#733F49] hover:bg-[#5C323A] text-white text-[12px] font-bold transition-colors cursor-pointer shadow-xs"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Action Buttons Group */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
            {is401 ? (
              <>
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#733F49] hover:bg-[#5C323A] text-white font-bold text-[13.5px] shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập ngay</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-[#FAF4EE] border border-[#EEDECF] text-[#733F49] font-bold text-[13.5px] shadow-2xs transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tạo tài khoản mới</span>
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-transparent hover:bg-black/5 text-[#6B5C5D] font-medium text-[13px] transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Về trang chủ</span>
                </Link>
              </>
            ) : is403 ? (
              <>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#733F49] hover:bg-[#5C323A] text-white font-bold text-[13.5px] shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Quay về trang chủ</span>
                </Link>
                {user?.role === 'staff' && (
                  <Link
                    to="/staff/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#FAF4EE] border border-[#E0A96D] text-[#733F49] font-bold text-[13.5px] shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Về trang làm việc Staff</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login', { state: { from: location } });
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-[#FAF4EE] border border-[#EEDECF] text-[#893844] font-bold text-[13px] shadow-2xs transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập tài khoản khác</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#733F49] hover:bg-[#5C323A] text-white font-bold text-[13.5px] shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Quay về trang chủ</span>
                </Link>
                <Link
                  to="/collection"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-[#FAF4EE] border border-[#EEDECF] text-[#733F49] font-bold text-[13.5px] shadow-2xs transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Khám phá bộ sưu tập</span>
                </Link>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full text-[#847374] hover:text-[#2C2523] text-[13px] font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Trang trước đó</span>
                </button>
              </>
            )}
          </div>

          {/* Helpful Quick Navigation Cards */}
          <div className="pt-8 border-t border-[#EEDECF]/60 text-left">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#847374] text-center mb-4">
              ✦ GỢI Ý ĐIỀU HƯỚNG DÀNH CHO NÀNG
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/collection"
                className="p-3.5 rounded-2xl bg-white border border-[#EEDECF] hover:border-[#733F49] hover:shadow-sm transition-all group block cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FAF4EE] text-[#733F49] flex items-center justify-center shrink-0 group-hover:bg-[#733F49] group-hover:text-white transition-colors">
                    <Sparkle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[12.5px] text-[#2C2523] group-hover:text-[#733F49] transition-colors">
                      Bộ Sưu Tập Váy Cưới
                    </strong>
                    <span className="text-[11px] text-[#847374] block">Hơn 50+ tác phẩm may đo cao cấp</span>
                  </div>
                </div>
              </Link>

              <Link
                to="/dat-lich"
                className="p-3.5 rounded-2xl bg-white border border-[#EEDECF] hover:border-[#733F49] hover:shadow-sm transition-all group block cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FAF4EE] text-[#733F49] flex items-center justify-center shrink-0 group-hover:bg-[#733F49] group-hover:text-white transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[12.5px] text-[#2C2523] group-hover:text-[#733F49] transition-colors">
                      Đặt Lịch Thử Váy VIP
                    </strong>
                    <span className="text-[11px] text-[#847374] block">Phòng thử riêng tư & Stylist 1-1</span>
                  </div>
                </div>
              </Link>

              <Link
                to="/tin-nhan"
                className="p-3.5 rounded-2xl bg-white border border-[#EEDECF] hover:border-[#733F49] hover:shadow-sm transition-all group block cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FAF4EE] text-[#733F49] flex items-center justify-center shrink-0 group-hover:bg-[#733F49] group-hover:text-white transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[12.5px] text-[#2C2523] group-hover:text-[#733F49] transition-colors">
                      Tư Vấn & Trợ Giúp
                    </strong>
                    <span className="text-[11px] text-[#847374] block">Trò chuyện trực tiếp cùng Stylist</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

