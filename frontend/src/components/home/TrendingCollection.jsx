import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllDresses } from '../../services/dressService';
import { dressImage } from '../../services/dressApiService';
import { getWishlistIds, toggleWishlist, WISHLIST_EVENT } from '../../services/wishlistService';
import card1Img from '../../assets/card1_elysian.jpg';
import card2Img from '../../assets/card2_celeste.jpg';
import card3Img from '../../assets/card3_lumiere.jpg';
import card4Img from '../../assets/card4_monet.jpg';
import logoEmblemImg from '../../assets/logo_emblem.png';

const products = [
  {
    id: 1,
    name: 'Elysian Rose Ballgown',
    badgeMain: 'BALLGOWN VIP',
    badgeSub: 'Còn Lịch 11/2026',
    rating: '4.9',
    rentCount: '128 lượt thuê',
    size: 'Size: XS - S',
    price: 5200000,
    depositAmount: 15000000,
    image: '/assets/dresses/dress_01.jpg',
  },
  {
    id: 2,
    name: 'Celeste Royal Mermaid',
    badgeMain: 'HAUTE COUTURE',
    badgeSub: 'Chỉ Có 1 Bản May Đo',
    rating: '5.0',
    rentCount: '89 lượt thuê',
    size: 'Size: M - L',
    price: 6500000,
    depositAmount: 18000000,
    image: '/assets/dresses/dress_02.jpg',
  },
  {
    id: 3,
    name: 'Lumière Minimal Silk',
    badgeMain: 'TƠ TẰM Ý',
    badgeSub: 'Sẵn Sàng Giao Ngay',
    rating: '4.8',
    rentCount: '94 lượt thuê',
    size: 'Size: XS',
    price: 3800000,
    depositAmount: 10000000,
    image: '/assets/dresses/dress_03.jpg',
  },
  {
    id: 4,
    name: 'Monet 3D Floral Couture',
    badgeMain: 'NEW SEASON 2026',
    badgeSub: 'Hoa Thủ Công 3D',
    rating: '4.9',
    rentCount: '62 lượt thuê',
    size: 'Size: S - M - L',
    price: 5500000,
    depositAmount: 15000000,
    image: '/assets/dresses/dress_04.jpg',
  },
];

const renderPriceWithDong = (priceVal) => {
  if (priceVal === undefined || priceVal === null || priceVal === '') return '5.200.000 ₫';
  const num = typeof priceVal === 'number' ? priceVal : Number(String(priceVal).replace(/[^0-9]/g, ''));
  const str = !isNaN(num) ? Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '5.200.000';
  return (
    <span>
      {str}
      <span className="underline decoration-[2px] underline-offset-[3px] ml-0.5 font-medium">₫</span>
    </span>
  );
};

const renderDepositWithDong = (amountVal) => {
  if (amountVal === undefined || amountVal === null || amountVal === '') return '15.000.000 ₫';
  const num = typeof amountVal === 'number' ? amountVal : Number(String(amountVal).replace(/[^0-9]/g, ''));
  const str = !isNaN(num) ? Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '15.000.000';
  return (
    <span>
      {str}
      <span className="underline decoration-1 underline-offset-1">₫</span>
    </span>
  );
};

const TrendingCollection = ({ onBookProduct, onToggleWishlist, wishlistedIds: propWishlistedIds }) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [internalWishlistIds, setInternalWishlistIds] = useState(() => getWishlistIds());

  useEffect(() => {
    const refresh = () => setInternalWishlistIds(getWishlistIds());
    window.addEventListener(WISHLIST_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const wishlistedIds = propWishlistedIds || internalWishlistIds;

  useEffect(() => {
    let isMounted = true;
    getAllDresses()
      .then((res) => {
        if (isMounted && res?.data?.length > 0) {
          const mapped = res.data.slice(0, 4).map((d, index) => ({
            id: d.id || d._id || index + 1,
            slug: d.slug,
            name: d.name,
            badgeMain: d.collectionTag?.split(' ')?.[0] || 'HAUTE COUTURE',
            badgeSub: d.silhouette ? `Dáng ${d.silhouette}` : 'Có sẵn',
            rating: Number(d.rating || 4.9).toFixed(1),
            rentCount: `${d.rentCount || 88} lượt thuê`,
            size: d.sizes?.length
              ? `Size: ${d.sizes.map((s) => (typeof s === 'string' ? s : s.id || s.label)).join(' - ')}`
              : 'Size: S - M',
            price: d.price || d.rentPrice || 5000000,
            depositAmount: d.depositAmount || 15000000,
            image: dressImage(d) || card1Img,
          }));
          setItems(mapped);
          setError('');
        } else if (isMounted) {
          setItems([]);
          setError('Lỗi kết nối cơ sở dữ liệu: Không có dữ liệu váy cưới từ MongoDB.');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setItems([]);
          setError('Lỗi kết nối cơ sở dữ liệu: Không thể kết nối tới máy chủ MongoDB.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCardClick = (target) => {
    navigate(`/dresses/${target}`);
  };

  return (
    <section id="collection" className="py-16 sm:py-20 bg-[#FAF7F5]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="max-w-[700px] mb-10 sm:mb-12 text-left">
          <h2 className="font-playfair text-[38px] sm:text-[44px] leading-[1.15] font-normal tracking-tight text-[#221816] mb-3 m-0">
            Xu Hướng Váy Cưới 2026
          </h2>
          <p className="font-jakarta text-[13.5px] sm:text-[14px] leading-[22px] text-[#5A4B4B] m-0 font-normal">
            Toàn bộ gói thuê đã bao gồm dịch vụ giặt hấp sinh học và phụ kiện phối cùng cao cấp.
          </p>
        </div>

        {/* 4-Column Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {items.map((item, index) => {
            const isWishlisted = Boolean(
              Array.isArray(wishlistedIds) &&
              wishlistedIds.some((w) => {
                const wId = typeof w === 'object' && w !== null ? w?.id : w;
                return String(wId) === String(item.id) || (item.code && String(wId) === String(item.code));
              })
            );
            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item.slug || item.id)}
                className="bg-white border border-[#EFE5E2] rounded-[24px] overflow-hidden shadow-[0px_4px_20px_rgba(44,37,35,0.03)] hover:shadow-[0px_12px_32px_rgba(44,37,35,0.07)] transition-all duration-300 flex flex-col group cursor-pointer"
              >
                {/* Image & Badges */}
                <div className="relative w-full h-[370px] sm:h-[390px] bg-[#FCEEE9] overflow-hidden rounded-t-[23px]">
                  <img
                    src={item.image}
                    alt={item.name}
                    onError={(e) => {
                      const fallback = products[index]?.image || card1Img;
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Left Badge */}
                  {item.badgeSub && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="h-[32px] px-3.5 rounded-full bg-[#FDF2F0] border border-[#F7D8D4] text-[#B26B74] font-jakarta font-medium text-[11.5px] tracking-normal shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-center">
                        {item.badgeSub}
                      </span>
                    </div>
                  )}

                  {/* Right Heart Button - Chỉ hiển thị khi đã đăng nhập */}
                  {isLoggedIn && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleWishlist) {
                          onToggleWishlist(item.id);
                        } else {
                          toggleWishlist(item.id);
                          setInternalWishlistIds(getWishlistIds());
                        }
                      }}
                      className={`absolute top-4 right-4 w-[36px] h-[36px] rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center border cursor-pointer z-10 transition-all hover:scale-105 active:scale-90 p-0 ${
                        isWishlisted ? 'border-red-200 bg-red-50/70 text-red-500' : 'border-transparent text-[#4A3E3D] hover:text-red-500'
                      }`}
                      title={isWishlisted ? 'Bỏ yêu thích' : 'Yêu thích'}
                      aria-label="Yêu thích"
                    >
                      <Heart
                        className={`w-[17px] h-[17px] transition-all duration-200 ${isWishlisted ? 'fill-red-500 text-red-500 scale-110' : 'text-[#4A3E3D]'}`}
                        strokeWidth={1.65}
                      />
                    </button>
                  )}

                  {/* Logo UniBridal Watermark ở góc ảnh */}
                  <div
                    className="absolute bottom-3 right-3.5 z-10 pointer-events-none select-none transition-transform duration-300 group-hover:scale-110"
                    title="UniBridal Haute Couture"
                  >
                    <img
                      src={logoEmblemImg}
                      alt="UniBridal Emblem"
                      className="w-[42px] h-[42px] object-contain drop-shadow-[0px_2px_6px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                </div>

                {/* Details Bottom */}
                <div className="px-5 pt-6 sm:pt-6.5 pb-4 flex flex-col justify-start">
                  <div>
                    {/* Rating & Size Row */}
                    <div className="flex items-center justify-between text-[12px] font-jakarta mb-1">
                      <div className="flex items-center gap-1.5 text-[#B26B74]">
                        <span className="font-bold">★ {Number(item.rating || 4.9).toFixed(1)}</span>
                        <span className="text-[#C69098] font-normal">({item.rentCount})</span>
                      </div>
                      <span className="text-[#231A19] font-semibold tracking-wide text-[12.5px]">
                        {item.size}
                      </span>
                    </div>

                    {/* Product Name - Căn giữa tự nhiên giữa Size và Giá tiền khi tên 1 dòng */}
                    <div className="min-h-[52px] my-1.5 flex items-center">
                      <h3 className="font-playfair text-[20px] sm:text-[21px] leading-[25px] font-semibold text-[#231A19] m-0 text-left line-clamp-2">
                        {item.name}
                      </h3>
                    </div>
                  </div>

                  {/* Price & Deposit */}
                  <div>
                    <div className="flex items-baseline gap-1.5 mb-2 flex-nowrap">
                      <span className="font-playfair font-medium text-[33px] sm:text-[35px] leading-none text-[#B26B74] tracking-tight whitespace-nowrap">
                        {renderPriceWithDong(item.price)}
                      </span>
                      <span className="font-jakarta text-[13px] text-[#5A4848] font-normal whitespace-nowrap ml-1">
                        / 1 ngày
                      </span>
                    </div>

                    {/* Deposit notice */}
                    <div className="font-jakarta text-[12px] leading-[19px] text-[#6B5C5D] mb-4 text-left">
                      <p className="m-0">
                        Tiền cọc bảo lãnh: <strong className="font-bold text-[#231A19]">{renderDepositWithDong(item.depositAmount)}</strong>
                      </p>
                      <p className="m-0 text-[#6B5C5D]">(Hoàn cọc tức thì)</p>
                    </div>

                    {/* Thuê Ngay Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/checkout?dressId=${item.id}`);
                      }}
                      className="w-full py-3 rounded-[13px] bg-[#B26B74] hover:bg-[#a05a63] text-white font-jakarta text-[14px] font-medium tracking-[0.8px] transition-colors cursor-pointer border-0 shadow-xs flex items-center justify-center active:scale-[0.99]"
                    >
                      Thuê Ngay
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrendingCollection;
