import React from 'react';
import { Heart } from 'lucide-react';
import card1Img from '../assets/card1_elysian.jpg';
import card2Img from '../assets/card2_celeste.jpg';
import card3Img from '../assets/card3_lumiere.jpg';
import card4Img from '../assets/card4_monet.jpg';

const products = [
  {
    id: 1,
    name: 'Elysian Rose Ballgown',
    badgeMain: 'BALLGOWN VIP',
    badgeSub: 'Còn Lịch 11/2025',
    rating: '4.9',
    rentCount: '128 lượt thuê',
    size: 'Size: S - M',
    price: '5.200.000₫',
    depositAmount: '15.000.000₫',
    image: card1Img,
  },
  {
    id: 2,
    name: 'Celeste Royal Mermaid',
    badgeMain: 'HAUTE COUTURE',
    badgeSub: 'Chỉ Có 1 Bản May Đo',
    rating: '5.0',
    rentCount: '89 lượt thuê',
    size: 'Size: M',
    price: '6.500.000₫',
    depositAmount: '18.000.000₫',
    image: card2Img,
  },
  {
    id: 3,
    name: 'Lumière Minimal Silk',
    badgeMain: 'TƠ TẰM Ý',
    badgeSub: 'Sẵn Sàng Giao Ngay',
    rating: '4.8',
    rentCount: '94 lượt thuê',
    size: 'Size: XS - S',
    price: '3.800.000₫',
    depositAmount: '10.000.000₫',
    image: card3Img,
  },
  {
    id: 4,
    name: 'Monet 3D Floral Couture',
    badgeMain: 'NEW SEASON 2025',
    badgeSub: 'Hoa Thủ Công 3D',
    rating: '4.9',
    rentCount: '62 lượt thuê',
    size: 'Size: S - M',
    price: '5.500.000₫',
    depositAmount: '15.000.000₫',
    image: card4Img,
  },
];

const renderPriceWithDong = (priceStr) => {
  const num = priceStr.replace(/[^0-9.]/g, '');
  return (
    <span>
      {num}<span className="underline decoration-[2px] underline-offset-[3px] ml-0.5 font-medium">đ</span>
    </span>
  );
};

const renderDepositWithDong = (amountStr) => {
  const num = amountStr.replace(/[^0-9.]/g, '');
  return (
    <span>
      {num}<span className="underline decoration-1 underline-offset-1">đ</span>
    </span>
  );
};

const TrendingCollection = ({ onBookProduct, onToggleWishlist, wishlistedIds = [1] }) => {
  return (
    <section id="collection" className="py-16 sm:py-20 bg-[#FAF7F5]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        
        {/* Section Header */}
        <div className="max-w-[700px] mb-10 sm:mb-12 text-left">
          <span className="font-jakarta font-semibold text-[11px] sm:text-[11.5px] tracking-[0.2em] uppercase text-[#B8737D] block mb-0.5 leading-none">
            WEDDING DRESS RENTAL
          </span>
          <h2 className="font-playfair text-[38px] sm:text-[44px] leading-[1.15] font-normal tracking-tight text-[#221816] mb-3 m-0">
            Xu Hướng Váy Cưới 2026
          </h2>
          <p className="font-jakarta text-[13.5px] sm:text-[14px] leading-[22px] text-[#5A4B4B] m-0 font-normal">
            Toàn bộ gói thuê đã bao gồm dịch vụ giặt hấp sinh học và phụ kiện phối cùng cao cấp.
          </p>
        </div>

        {/* 4-Column Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {products.map((item) => {
            const isWishlisted = wishlistedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="bg-white border border-[#EFE5E2] rounded-[24px] overflow-hidden shadow-[0px_4px_20px_rgba(44,37,35,0.03)] hover:shadow-[0px_12px_32px_rgba(44,37,35,0.07)] transition-all duration-300 flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="relative w-full h-[370px] sm:h-[390px] bg-[#FCEEE9] overflow-hidden rounded-t-[23px]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Left Badges */}
                  <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-10">
                    <span className="h-[36px] px-4 rounded-full bg-white text-[#B26B74] font-jakarta font-bold text-[11px] tracking-[0.5px] uppercase shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center">
                      {item.badgeMain}
                    </span>
                    <span className="h-[32px] px-3.5 rounded-full bg-[#FDF2F0] border border-[#F7D8D4] text-[#B26B74] font-jakarta font-medium text-[11.5px] tracking-normal shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-center">
                      {item.badgeSub}
                    </span>
                  </div>

                  {/* Right Heart Button (Rounded rectangle squircle matching reference) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist && onToggleWishlist(item.id);
                    }}
                    className="absolute top-4 right-4 w-[36px] h-[36px] rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center text-[#4A3E3D] hover:text-[#B26B74] border-0 cursor-pointer z-10 transition-transform hover:scale-105 active:scale-90 p-0"
                    title="Yêu thích"
                    aria-label="Yêu thích"
                  >
                    <Heart
                      className={`w-[17px] h-[17px] ${isWishlisted ? 'fill-[#B26B74] text-[#B26B74]' : 'text-[#4A3E3D]'}`}
                      strokeWidth={1.65}
                    />
                  </button>
                </div>

                {/* Details Bottom - Compact and hugging button closely at the bottom */}
                <div className="px-5 pt-6 sm:pt-6.5 pb-4 flex flex-col justify-start">
                  <div>
                    {/* Rating & Size Row */}
                    <div className="flex items-center justify-between text-[12px] font-jakarta mb-2">
                      <div className="flex items-center gap-1.5 text-[#B26B74]">
                        <span className="font-bold">★ {item.rating}</span>
                        <span className="text-[#C69098] font-normal">({item.rentCount})</span>
                      </div>
                      <span className="text-[#231A19] font-semibold tracking-wide text-[12.5px]">
                        {item.size}
                      </span>
                    </div>

                    {/* Product Name */}
                    <div className="min-h-[48px] mb-3.5 flex items-start">
                      <h3 className="font-playfair text-[20px] sm:text-[21px] leading-[26px] font-semibold text-[#231A19] m-0 text-left">
                        {item.name}
                      </h3>
                    </div>
                  </div>

                  {/* Price & Deposit */}
                  <div>
                    {/* Price & Unit - Large Didone Serif style */}
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
                      <p className="m-0 text-[#6B5C5D]">
                        (Hoàn tức thì)
                      </p>
                    </div>

                    {/* Thuê Ngay Button */}
                    <button
                      type="button"
                      onClick={() => onBookProduct && onBookProduct(item)}
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
