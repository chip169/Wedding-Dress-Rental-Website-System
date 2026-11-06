import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getAllDresses } from '../../services/dressService';
import card1Img from '../../assets/card1_elysian.jpg';
import card2Img from '../../assets/card2_celeste.jpg';
import card3Img from '../../assets/card3_lumiere.jpg';
import card4Img from '../../assets/card4_monet.jpg';
import card5Img from '../../assets/card5_aurora.jpg';
import card7Img from '../../assets/card7_vivienne.jpg';
import logoEmblemImg from '../../assets/logo_emblem.png';

const SILHOUETTES_CONFIG = [
  {
    id: 'ballgown',
    title: 'Công Chúa Hoàng Gia',
    description: 'Lộng lẫy, bồng bềnh với cấu trúc siết eo corsetry tôn vinh tỉ lệ vàng.',
    image: '/assets/dresses/dress_01.jpg',
    fallback: card1Img,
    defaultCount: 5,
  },
  {
    id: 'mermaid',
    title: 'Đuôi Cá Điêu Khắc',
    description: 'Ôm trọn đường cong quyến rũ với chất liệu ren hoa nổi 3D cao cấp.',
    image: '/assets/dresses/dress_02.jpg',
    fallback: card2Img,
    defaultCount: 5,
  },
  {
    id: 'a-line',
    title: 'Chữ A Thanh Lịch',
    description: 'Nhẹ nhàng, bay bổng, hoàn hảo cho tiệc cưới ngoài trời và sảnh tiệc thân mật.',
    image: '/assets/dresses/dress_04.jpg',
    fallback: card4Img,
    defaultCount: 5,
  },
  {
    id: 'silk-gown',
    title: 'Satin Lụa Tối Giản',
    description: 'Vẻ đẹp đương đại từ lụa tơ tằm nguyên bản, thuần khiết và sang trọng.',
    image: '/assets/dresses/dress_03.jpg',
    fallback: card3Img,
    defaultCount: 5,
  },
  {
    id: 'princess',
    title: 'Hoàng Gia Princess',
    description: 'Tùng váy xòe rộng 2m đính kết pha lê Swarovski lấp lánh như cực quang.',
    image: '/assets/dresses/dress_05.jpg',
    fallback: card5Img,
    defaultCount: 5,
  },
  {
    id: 'custom-atelier',
    isCustomBooking: true,
    title: 'May Đo Riêng 1:1',
    description: 'Thiết kế độc bản theo số đo và phong cách riêng cùng Giám Đốc Sáng Tạo Atelier.',
    image: '/assets/dresses/dress_09.jpg',
    fallback: card2Img,
    customTag: 'ATELIER MAY ĐO',
    defaultCount: 1,
  },
];

const SilhouetteShowcase = ({ onSelectSilhouette }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    ballgown: 5,
    mermaid: 5,
    'a-line': 5,
    'silk-gown': 5,
    princess: 5,
  });

  // Tải danh sách váy thực tế từ database và đếm chính xác số lượng từng loại
  useEffect(() => {
    let isMounted = true;
    getAllDresses()
      .then((res) => {
        if (!isMounted) return;
        const list = res?.data;
        if (Array.isArray(list) && list.length > 0) {
          const tally = {};
          list.forEach((item) => {
            let cat = (item.category || item.silhouette || '').toLowerCase().replace(/\s+/g, '-');
            if (cat === 'sheath') cat = 'silk-gown';
            tally[cat] = (tally[cat] || 0) + 1;
          });
          setCounts((prev) => ({ ...prev, ...tally }));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCardClick = (item) => {
    if (item.isCustomBooking) {
      navigate('/dat-lich');
      return;
    }
    if (onSelectSilhouette) {
      onSelectSilhouette(item.id);
    }
    navigate(`/collection?silhouette=${item.id}`);
  };

  return (
    <section id="silhouettes" className="py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
        {/* Header Section */}
        <div className="mb-10 sm:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="font-jakarta text-[11.5px] font-semibold tracking-[0.25em] text-[#B26B74] uppercase block mb-2">
              BỘ SƯU TẬP PHOM DÁNG HAUTE COUTURE ĐỘC QUYỀN
            </span>
            <h2 className="font-playfair text-[32px] sm:text-[40px] leading-[1.15] font-normal tracking-tight text-[#2C2523] m-0">
              Dáng Váy Tuyệt Tác Cho Nàng Dâu
            </h2>
          </div>
          <p className="text-[#695C4E] font-jakarta text-[13.5px] max-w-md m-0 font-light leading-relaxed">
            Hệ thống quy tụ các phom dáng và lễ phục cưới cao cấp, chuẩn hóa kích cỡ và số lượng trực tiếp từ cơ sở dữ liệu Atelier 2026.
          </p>
        </div>

        {/* 8 Cards Grid (4x2 Responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SILHOUETTES_CONFIG.map((item) => {
            const countLabel = item.customTag || `${counts[item.id] || item.defaultCount} MẪU ĐỘC BẢN`;

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className="group relative h-[480px] rounded-2xl overflow-hidden cursor-pointer shadow-[0px_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0px_12px_30px_rgba(0,0,0,0.15)] transition-all duration-500"
              >
                {/* Background Image with UniBridal Logo */}
                <img
                  src={item.image}
                  alt={item.title}
                  onError={(e) => {
                    if (item.fallback && e.currentTarget.src !== item.fallback) {
                      e.currentTarget.src = item.fallback;
                    }
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(29,20,20,0.92)] via-[rgba(29,20,20,0.35)] to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                {/* Top Tag */}
                <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                  <span className="font-jakarta font-semibold text-[10.5px] uppercase tracking-[0.2em] text-[#E6DAC8] bg-[rgba(44,37,35,0.6)] backdrop-blur-md px-3 py-1 rounded-full border border-[rgba(230,218,200,0.25)]">
                    {countLabel}
                  </span>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-6 left-5 right-5 text-left">
                  <h3 className="font-playfair text-[20px] sm:text-[22px] lg:text-[20px] xl:text-[22.5px] font-normal text-white mb-2 leading-snug tracking-tight whitespace-nowrap">
                    {item.title}
                  </h3>
                  <p className="font-jakarta text-[13px] font-light text-[#E0D5D1] leading-[20px] mb-4 opacity-90 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Discover Link with hover arrow shift */}
                  <div className="inline-flex items-center gap-2 text-[#FCEEE9] group-hover:text-white font-jakarta text-[12.5px] font-medium tracking-wide">
                    <span className="relative pb-0.5">
                      {item.isCustomBooking ? 'Đặt lịch hẹn may đo' : 'Khám phá bộ sưu tập'}
                      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white group-hover:w-full transition-all duration-300" />
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#FCEEE9] group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>

                {/* Logo UniBridal Watermark ở góc phải dưới thẻ */}
                <div
                  className="absolute bottom-5 right-5 z-10 pointer-events-none select-none transition-transform duration-300 group-hover:scale-110"
                  title="UniBridal Haute Couture"
                >
                  <img
                    src={logoEmblemImg}
                    alt="UniBridal Emblem"
                    className="w-[42px] h-[42px] object-contain drop-shadow-[0px_2px_6px_rgba(0,0,0,0.45)]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SilhouetteShowcase;
