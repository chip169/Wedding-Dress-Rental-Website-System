import React from 'react';
import { ArrowRight } from 'lucide-react';

const silhouettes = [
  {
    id: 'ballgown',
    count: '18 MẪU ĐỘC QUYỀN',
    title: 'Công Chúa Hoàng Gia',
    description: 'Lộng lẫy, bồng bềnh với cấu trúc siết eo corsetry tôn vinh tỷ lệ vàng.',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'mermaid',
    count: '14 MẪU ĐỘC QUYỀN',
    title: 'Đuôi Cá Điêu Khắc',
    description: 'Ôm trọn đường cong quyến rũ với chất liệu ren hoa nổi 3D cao cấp.',
    image: 'https://images.unsplash.com/photo-1546804784-896d0dca3800?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'a-line',
    count: '22 MẪU ĐỘC QUYỀN',
    title: 'Chữ A Thanh Lịch',
    description: 'Nhẹ nhàng, bay bổng, hoàn hảo cho tiệc cưới ngoài trời và sảnh tiệc thân mật.',
    image: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'minimalist-silk',
    brandBadge: 'A U R A',
    count: '12 MẪU ĐỘC QUYỀN',
    title: 'Satin Lụa Tối Giản',
    description: 'Vẻ đẹp đương đại từ lụa tơ tằm nguyên bản, thuần khiết và sang trọng.',
    image: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=85',
  },
];

const SilhouetteShowcase = ({ onSelectSilhouette }) => {
  return (
    <section id="silhouettes" className="py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
        
        {/* Header Section matching screenshot exactly */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-[620px]">
            <span className="font-jakarta font-bold text-[11px] leading-tight tracking-[2.75px] uppercase text-[#B8737D] block mb-1">
              ARCHIVAL SILHOUETTES
            </span>
            <h2 className="font-playfair text-[32px] sm:text-[40px] leading-[1.15] font-normal tracking-tight text-[#2C2523] m-0">
              Dáng Váy Tuyệt Tác Cho Nàng Dâu
            </h2>
          </div>

          <div className="max-w-[490px] md:pb-[2px]">
            <p className="font-jakarta font-light text-[13.5px] sm:text-[14px] leading-[22px] text-[#514344] m-0">
              Mỗi cấu trúc phom dáng là bản giao hưởng giữa kỹ thuật corset siết eo hoàng gia và chất liệu thượng hạng từ Ý & Pháp.
            </p>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {silhouettes.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectSilhouette && onSelectSilhouette(item)}
              className="group relative h-[420px] rounded-2xl overflow-hidden bg-[#FCEEE9] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              {/* Background Photo */}
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Optional top branding badge like A U R A on 4th card */}
              {item.brandBadge && (
                <div className="absolute top-0 inset-x-0 py-2 text-center bg-white/70 backdrop-blur-sm z-10">
                  <span className="font-playfair text-[11px] tracking-[4px] text-[#2C2523] uppercase font-medium">
                    {item.brandBadge}
                  </span>
                </div>
              )}

              {/* Gradient dark overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

              {/* Text info bottom */}
              <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end z-10 text-white">
                <span className="font-jakarta font-medium text-[11px] uppercase tracking-wider text-[#FFDADC] mb-1.5 block">
                  {item.count}
                </span>

                <h3 className="font-playfair text-[22px] leading-[28px] font-medium text-white mb-2 group-hover:text-[#FFDADC] transition-colors">
                  {item.title}
                </h3>

                <p className="font-jakarta text-[12px] leading-[18px] text-white/80 mb-4 line-clamp-2">
                  {item.description}
                </p>

                <div className="inline-flex items-center gap-1.5 text-[#FFDADC] font-jakarta text-[14px] font-normal tracking-[0.14px] group-hover:translate-x-1 transition-transform">
                  <span>Xem Dáng Váy</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FFDADC]" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default SilhouetteShowcase;
