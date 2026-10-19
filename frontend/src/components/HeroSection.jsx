import React from 'react';
import { CheckCircle } from 'lucide-react';
import heroBrideImg from '../assets/hero_bride.jpg';
import laceDetailImg from '../assets/lace_detail.jpg';

const HeroSection = () => {
  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-b from-[#FFF7F5] via-[#FFFBF8] to-[#FDFBF7] pt-12 pb-20 lg:pt-16 lg:pb-24">
      {/* Soft Ambient Radial Glows */}
      <div className="absolute -top-24 -left-20 w-[420px] h-[420px] rounded-full bg-[rgba(201,138,144,0.12)] blur-[60px] pointer-events-none" />
      <div className="absolute top-1/2 -right-28 w-[500px] h-[500px] rounded-full bg-[rgba(230,218,200,0.3)] blur-[65px] pointer-events-none" />

      <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column: Text Content */}
          <div className="lg:col-span-6 flex flex-col items-start z-10">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white shadow-[0px_2px_10px_rgba(0,0,0,0.04)] mb-6 select-none mt-2 sm:mt-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8737D] shrink-0" />
              <span className="font-jakarta font-semibold text-[11px] sm:text-[11.5px] tracking-[0.2em] uppercase text-[#B8737D] leading-none">
                HAUTE COUTURE COLLECTION 2026
              </span>
            </div>

            {/* Heading 1: Exactly as in the design */}
            <h1 className="font-playfair text-[44px] sm:text-[54px] lg:text-[58px] leading-[1.15] font-normal tracking-tight text-[#2C2523] mb-5">
              Khoảnh Khắc <br />
              <span className="italic text-[#B8737D] font-normal">
                Tỏa Sáng Trọn Vẹn
              </span>
            </h1>

            {/* Paragraph */}
            <p className="font-jakarta font-light text-[15px] sm:text-[16px] leading-[26px] text-[#514344] max-w-[490px] mb-8">
              Tuyển tập áo cưới hoàng gia nhập khẩu và đính kết pha lê thủ công tinh xảo. Trải nghiệm nghi thức thử váy riêng tư đỉnh cao trong không gian salon độc bản.
            </p>

            {/* CTA Button: KHÁM PHÁ BỘ SƯU TẬP */}
            <div className="mb-12">
              <a
                href="#collection"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-[#B8737D] text-white font-jakarta text-[13px] font-semibold tracking-wider uppercase shadow-[0px_4px_16px_rgba(184,115,125,0.35)] hover:bg-[#a6626c] transition-all cursor-pointer no-underline"
              >
                KHÁM PHÁ BỘ SƯU TẬP
              </a>
            </div>

            {/* Separator Line */}
            <div className="w-full border-t border-[#E6DAC8]/70 pt-8 grid grid-cols-3 gap-4 sm:gap-6">
              {/* Metric 1 */}
              <div>
                <span className="font-playfair text-[32px] sm:text-[36px] font-normal text-[#B8737D] block leading-none mb-1.5">
                  100%
                </span>
                <span className="font-jakarta text-[12px] leading-[17px] text-[#514344] block">
                  Lụa tơ tằm & ren nhập khẩu Pháp
                </span>
              </div>

              {/* Metric 2 */}
              <div>
                <span className="font-playfair text-[32px] sm:text-[36px] font-normal text-[#B8737D] block leading-none mb-1.5">
                  1 : 1
                </span>
                <span className="font-jakarta text-[12px] leading-[17px] text-[#514344] block">
                  Staff tư vấn riêng tư
                </span>
              </div>

              {/* Metric 3 */}
              <div>
                <span className="font-playfair text-[32px] sm:text-[36px] font-normal text-[#B8737D] block leading-none mb-1.5">
                  2.400+
                </span>
                <span className="font-jakarta text-[12px] leading-[17px] text-[#514344] block">
                  Cô dâu tỏa sáng rạng ngời
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Editorial Imagery matching screenshot */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[480px] lg:max-w-[510px]">
              
              {/* Floating Top Badge: Chính Sách Hoàn Cọc 100% */}
              <div className="absolute -top-4 right-4 z-20 flex items-center gap-2 px-3.5 py-1.5 bg-white/95 border border-[#E6DAC8] rounded-xl shadow-md">
                <div className="w-4 h-4 rounded-full bg-[#FCEEE9] flex items-center justify-center text-[#B8737D]">
                  <CheckCircle className="w-3.5 h-3.5 text-[#B8737D]" />
                </div>
                <span className="font-jakarta text-[12px] font-medium text-[#2C2523]">
                  Chính Sách Hoàn Cọc 100%
                </span>
              </div>

              {/* Main Hero Portrait with Clean 4px White Border */}
              <div className="relative w-full h-[520px] sm:h-[600px] lg:h-[640px] rounded-[28px] sm:rounded-[32px] overflow-hidden bg-[#FCEEE9] border-4 border-solid border-white shadow-[0px_20px_45px_-10px_rgba(0,0,0,0.18)]">
                <img
                  src={heroBrideImg}
                  alt="UniBridal Haute Couture Collection"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Overlapping Detail Inset matching sample 4px white border */}
              <div className="absolute -bottom-6 -left-4 sm:-left-8 z-20 w-[150px] h-[150px] sm:w-[185px] sm:h-[185px] rounded-2xl overflow-hidden bg-[#FCEEE9] border-4 border-solid border-white shadow-[0px_16px_32px_-6px_rgba(0,0,0,0.2)]">
                <img
                  src={laceDetailImg}
                  alt="Chi tiết đính kết ren thủ công"
                  className="w-full h-full object-cover"
                />
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
