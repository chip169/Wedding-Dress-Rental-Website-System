import React from 'react';
import { Star } from 'lucide-react';

const reviews = [
  {
    id: 1,
    author: 'Minh Thư & Hoàng Nam',
    venue: 'Lễ cưới tại Park Hyatt Saigon',
    dressType: 'Ballgown',
    quote: (
      <>
        “Cảm giác bước vào sảnh tiệc ai cũng trầm trồ vì{' '}
        <span className="italic">chiếc váy lấp lánh như pha lê dưới ánh đèn sân khấu</span>. Dịch
        vụ chỉnh phom eo của Aura khiến mình{' '}
        <span className="italic">cực kỳ tự tin và nhẹ nhàng khi khiêu vũ</span>.”
      </>
    ),
    image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 2,
    author: 'Khánh Linh & Eric Tran',
    venue: 'Destination Wedding tại Amanoi',
    dressType: 'Silk Gown',
    quote: (
      <>
        “Mình chọn Lumière Silk cho tiệc cưới hoàng hôn tại Amanoi.{' '}
        <span className="italic">Lụa bay vô cùng tự nhiên trong gió biển</span>. Đặc biệt,{' '}
        <span className="italic">
          thủ tục hoàn tiền cọc cực kỳ nhanh chỉ sau 1 giờ gửi váy về tiệm
        </span>
        .”
      </>
    ),
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 3,
    author: 'Phương Uyên & Tuấn Anh',
    venue: 'Lễ cưới tại JW Marriott Hanoi',
    dressType: 'Mermaid',
    quote: (
      <>
        “Phòng <span className="italic">thử váy VIP riêng tư</span> thực sự làm bố mẹ mình rất xúc
        động. Stylist tư vấn tỉ mỉ từ kiểu tóc, lúp che mặt{' '}
        <span className="italic">cho đến giày cao gót</span>. Aura thực sự{' '}
        <span className="italic">nâng niu mọi cảm xúc của cô dâu</span>.”
      </>
    ),
    image: 'https://images.unsplash.com/photo-1583939411023-14783179e581?auto=format&fit=crop&w=800&q=85',
  },
];

const RealBridesGallery = () => {
  return (
    <section id="brides" className="py-20 bg-[#FAF7F2] border-y border-[#E6DAC8]/60">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-[620px]">
            <span className="font-jakarta font-bold text-[11px] leading-[14px] tracking-[2.75px] uppercase text-[#B8737D] block mb-2">
              UNIBRIDAL REAL BRIDES
            </span>
            <h2 className="font-playfair text-[32px] sm:text-[40px] leading-[48px] font-normal tracking-tight text-[#2C2523] m-0">
              Khoảnh Khắc Của Những Nàng Thơ
            </h2>
          </div>

          <div className="max-w-[420px]">
            <p className="font-jakarta text-[13px] leading-[20px] text-[#514344] m-0">
              Những nụ cười rạng rỡ và câu chuyện hạnh phúc đọng lại trong từng thước phim cưới.
            </p>
          </div>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#E6DAC8] rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Photo */}
                <div className="relative w-full h-[220px] rounded-xl overflow-hidden bg-[#FCEEE9] mb-4">
                  <img
                    src={item.image}
                    alt={item.author}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* 5 Stars */}
                <div className="flex items-center gap-1 mb-3 text-[#B8737D]">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-[14px] leading-none">
                      ★
                    </span>
                  ))}
                </div>

                {/* Quote with accurate italic nuances */}
                <p className="font-jakarta text-[13.5px] leading-[22px] text-[#2C2523] mb-6 min-h-[96px]">
                  {item.quote}
                </p>
              </div>

              {/* Author & Dress details */}
              <div className="pt-4 border-t border-[#E6DAC8]/60 flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-playfair font-normal text-[18px] text-[#2C2523] leading-snug m-0">
                    {item.author}
                  </h4>
                  <p className="font-jakarta text-[11px] text-[#847374] m-0 mt-0.5">
                    {item.venue}
                  </p>
                </div>

                <div className="px-3 py-1 rounded-full bg-[#FCEEE9] text-[#B8737D] font-jakarta font-medium text-[11px] whitespace-nowrap">
                  {item.dressType}
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
