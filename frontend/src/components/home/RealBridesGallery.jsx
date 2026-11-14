import React from 'react';
import logoEmblemImg from '../../assets/logo_emblem.png';

const reviews = [
  {
    id: 1,
    author: 'Minh Thư và Hoàng Nam',
    venue: 'Lễ cưới tại Park Hyatt Saigon',
    dressType: 'Ballgown',
    quote: (
      <>
        “Cảm giác bước vào sảnh tiệc ai cũng trầm trồ và{' '}
        <span className="italic">chiếc váy lấp lánh như pha lê dưới ánh đèn sân khấu</span>. Dịch vụ chỉnh phom eo của UniBridal khiến mình{' '}
        <span className="italic">cực kỳ tự tin và nhẹ nhàng khi khiêu vũ</span>.”
      </>
    ),
    image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 2,
    author: 'Khánh Linh và Eric Trần',
    venue: 'Destination Wedding tại Amanoi',
    dressType: 'Silk Gown',
    quote: (
      <>
        “Mình chọn Lumière Silk cho tiệc cưới hoàng hôn tại Amanoi.{' '}
        <span className="italic">Lụa bay vô cùng tự nhiên trong gió biển</span>. Đặc biệt,{' '}
        <span className="italic">
          thủ tục hoàn tiền cọc cực kỳ nhanh chóng ngay khi chuyên viên đến thu hồi váy
        </span>
        .”
      </>
    ),
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 3,
    author: 'Phương Uyên và Tuấn Anh',
    venue: 'Lễ cưới tại JW Marriott Hanoi',
    dressType: 'Mermaid',
    quote: (
      <>
        “Phòng <span className="italic">thử váy VIP riêng tư</span> thực sự làm ba mẹ mình rất xúc động. Stylist tư vấn tỉ mỉ từ kiểu tóc, lúp che mặt{' '}
        <span className="italic">cho đến giày cao gót</span>. UniBridal thực sự{' '}
        <span className="italic">nâng niu mọi cảm xúc của cô dâu</span>.”
      </>
    ),
    image: 'https://images.unsplash.com/photo-1583939411023-14783179e581?auto=format&fit=crop&w=800&q=85',
  },
];

const RealBridesGallery = () => {
  return (
    <section id="brides" className="py-20 bg-white">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="max-w-[850px] mb-12 text-left">
          <h2 className="font-playfair text-[32px] sm:text-[40px] leading-[1.15] font-normal tracking-tight text-[#2C2523] mb-3 m-0">
            Khoảnh Khắc Nàng Dâu UniBridal
          </h2>
          <p className="font-jakarta text-[14px] leading-[24px] text-[#514344] m-0 font-normal">
            Những xúc cảm chân thực và trọn vẹn nhất từ các nàng dâu đã tin chọn UniBridal cho ngày hạnh phúc nhất đời mình.
          </p>
        </div>

        {/* 3 Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-[#FDFBF7] border border-[#EEDECF] rounded-2xl overflow-hidden shadow-[0px_4px_16px_rgba(44,37,35,0.04)] flex flex-col justify-between"
            >
              <div className="relative h-[280px] overflow-hidden">
                <img
                  src={rev.image}
                  alt={rev.author}
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                />

                {/* Logo UniBridal Watermark */}
                <div
                  className="absolute bottom-3 right-3.5 z-10 pointer-events-none select-none transition-transform duration-300 hover:scale-110"
                  title="UniBridal Haute Couture"
                >
                  <img
                    src={logoEmblemImg}
                    alt="UniBridal Emblem"
                    className="w-[38px] h-[38px] object-contain drop-shadow-[0px_2px_6px_rgba(0,0,0,0.35)]"
                  />
  
                </div>

              </div>

              <div className="p-6 flex flex-col justify-between flex-1">
                <p className="font-playfair text-[15px] sm:text-[15.5px] leading-[24px] text-[#2C2523] mb-6 italic">
                  {rev.quote}
                </p>

                <div className="pt-4 border-t border-[#EEDECF] flex items-center justify-between">
                  <div>
                    <h4 className="font-jakarta font-semibold text-[13px] text-[#2C2523] m-0">
                      {rev.author}
                    </h4>
                    <span className="font-jakarta text-[11.5px] text-[#847374] block mt-0.5">
                      {rev.venue}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#FFF5F2] border border-[#F3D8D8] text-[#B8737D] font-jakarta text-[11px] font-medium">
                    {rev.dressType}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RealBridesGallery;
