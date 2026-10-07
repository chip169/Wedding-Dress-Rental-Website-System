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

const TrendingCollection = ({ onBookProduct, onToggleWishlist, wishlistedIds = [1] }) => {
  return (
    <section id="collection" className="py-20 bg-[#FFF7F4] border-y border-[#E6DAC8]/60">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
        
        {/* Section Header */}
        <div className="max-w-[620px] mb-12">
          <span className="font-jakarta font-semibold text-[11px] leading-[14px] tracking-[1.4px] uppercase text-[#B8737D] block mb-2">
            WEDDING DRESS RENTAL
          </span>
          <h2 className="font-playfair text-[34px] sm:text-[40px] leading-[46px] font-normal tracking-tight text-[#2C2523] mb-2.5">
            Xu Hướng Váy Cưới 2026
          </h2>
          <p className="font-jakarta text-[13px] leading-[20px] text-[#514344] m-0">
            Toàn bộ gói thuê đã bao gồm dịch vụ giặt hấp sinh học và phụ kiện phối cùng cao cấp.
          </p>
        </div>

        {/* 4-Column Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((item) => {
            const isWishlisted = wishlistedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="bg-white border border-[#E6DAC8] rounded-[20px] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image & Badges */}
                <div className="relative w-full h-[375px] bg-[#FCEEE9] overflow-hidden rounded-t-[19px]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                  />

                  {/* Left Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    <span className="px-3 py-1 rounded-full bg-white/95 border border-[#E6DAC8] text-[#854F55] font-jakarta font-bold text-[9.5px] tracking-[0.5px] uppercase shadow-xs">
                      {item.badgeMain}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FCEEE9] text-[#B8737D] font-jakarta font-semibold text-[9.5px] tracking-[0.2px] shadow-xs">
                      {item.badgeSub}
                    </span>
                  </div>

                  {/* Right Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist && onToggleWishlist(item.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#514344] hover:text-[#B8737D] border border-[#E6DAC8]/40 shadow-xs cursor-pointer z-10 transition-transform active:scale-90 p-0"
                    title="Yêu thích"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-[#B8737D] text-[#B8737D]' : 'text-[#514344]'}`}
                    />
                  </button>
                </div>

                {/* Details Bottom */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    {/* Rating & Size Row */}
                    <div className="flex items-center justify-between text-[11.5px] font-jakarta mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[#B8737D] font-bold">★ {item.rating}</span>
                        <span className="text-[#847374] font-normal">({item.rentCount})</span>
                      </div>
                      <span className="text-[#514344] font-medium">{item.size}</span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-playfair text-[21px] leading-[28px] font-normal text-[#2C2523] mb-4 min-h-[56px] flex items-center">
                      {item.name}
                    </h3>
                  </div>

                  {/* Price & Deposit */}
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="font-playfair font-bold text-[28px] leading-tight text-[#B8737D]">
                        {item.price}
                      </span>
                      <span className="font-jakarta text-[12px] text-[#514344]">
                        / 1 ngày
                      </span>
                    </div>

                    <p className="font-jakarta text-[11px] leading-[16px] text-[#514344] mb-4">
                      Tiền cọc bảo lãnh: <strong className="font-semibold text-[#2C2523]">{item.depositAmount}</strong> <br />
                      <span className="text-[#847374]">(Hoàn tức thì)</span>
                    </p>

                    {/* Thuê Ngay Button */}
                    <button
                      type="button"
                      onClick={() => onBookProduct && onBookProduct(item)}
                      className="w-full py-2.5 rounded-lg bg-[#B8737D] text-white font-jakarta text-[13px] font-medium tracking-wide hover:bg-[#a6626c] transition-all cursor-pointer border-0 shadow-xs"
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
