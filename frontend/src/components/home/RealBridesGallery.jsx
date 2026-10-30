import React from 'react';

const reviews = [
  {
    id: 1,
    author: 'Minh Thư và Hoàng Nam',
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
    author: 'Khánh Linh và Eric Tran',
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
    author: 'Phương Uyên và Tuấn Anh',
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
  {
    id: 4,
    author: 'Thảo Vy và Daniel Lee',
    venue: 'Lễ cưới tại InterContinental Danang',
    dressType: 'A-Line Lace',
    quote: (
      <>
        “Chất liệu ren hoa 3D tinh xảo đến từng đường kim mũi chỉ.{' '}
        <span className="italic">Váy nhẹ tênh giúp mình di chuyển chào bàn suốt 4 tiếng</span> mà
        vẫn giữ trọn vẹn phom dáng siết eo hoàn hảo.”
      </>
    ),
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 5,
    author: 'Hà My và Quốc Bảo',
    venue: 'Lễ cưới tại GEM Center Saigon',
    dressType: 'Royal Princess',
    quote: (
      <>
        “Được thử váy trong không gian riêng tư và được quay chụp kỷ niệm trước lễ cưới.{' '}
        <span className="italic">Đội ngũ stylist chăm sóc chu đáo như người nhà</span>, mang lại trải
        nghiệm may đo hoàng gia đích thực.”
      </>
    ),
    image: 'https://images.unsplash.com/photo-1546804784-896d0dca3800?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 6,
    author: 'Kim Ngân và Tuấn Hưng',
    venue: 'Lễ cưới tại Lotte Hotel Hanoi',
    dressType: 'Minimalist Silk',
    quote: (
      <>
        “Váy lụa Mikado tối giản nhưng toát lên vẻ sang trọng quý phái.{' '}
        <span className="italic">Ai nhìn cũng khen gu chọn váy tinh tế, thanh tao</span>. Rất hài
        lòng với sự chỉn chu và quy trình giặt hấp sinh học sạch sẽ.”
      </>
    ),
    image: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=85',
  },
];

const allReviews = [...reviews, ...reviews];

const RealBridesGallery = () => {
  return (
    <section id="brides" className="py-20 bg-[#FAF7F2] border-y border-[#E6DAC8]/60 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
        
        {/* Header Section */}
        <div className="mb-10 sm:mb-12 text-left">
          <h2 className="font-playfair text-[32px] sm:text-[40px] leading-[48px] font-normal tracking-tight text-[#2C2523] m-0">
            Khoảnh Khắc Của Những Nàng Thơ
          </h2>
        </div>

      </div>

      {/* Infinite Seamless Continuous Running Marquee */}
      <div className="relative w-full overflow-hidden">
        {/* Left & Right Soft Fade Gradients */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-24 bg-gradient-to-r from-[#FAF7F2] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-24 bg-gradient-to-l from-[#FAF7F2] to-transparent z-10" />

        <div className="flex gap-6 animate-marquee py-2 px-6">
          {allReviews.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="w-[310px] sm:w-[350px] md:w-[370px] shrink-0 bg-white border border-[#E6DAC8] hover:border-[#D498A0] rounded-2xl p-6 shadow-[0_4px_16px_rgba(218,142,150,0.08)] hover:shadow-[0_16px_36px_rgba(218,142,150,0.32)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between select-none cursor-pointer"
            >
              <div>
                {/* Photo */}
                <div className="relative w-full h-[220px] rounded-xl overflow-hidden bg-[#FCEEE9] mb-4">
                  <img
                    src={item.image}
                    alt={item.author}
                    className="w-full h-full object-cover object-center pointer-events-none"
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
