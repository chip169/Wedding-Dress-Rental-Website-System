import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import heroBrideImg from '../../assets/hero_bride.jpg';
import laceDetailImg from '../../assets/lace_detail.jpg';
import logoEmblemImg from '../../assets/logo_emblem.png';

const HeroSection = ({ onOpenBooking }) => {
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
                BỘ SƯU TẬP CAO CẤP 2026
              </span>
            </div>

            {/* Heading 1 */}
            <h1 className="font-playfair text-[44px] sm:text-[54px] lg:text-[58px] leading-[1.15] font-normal tracking-tight text-[#2C2523] mb-5">
              Khoảnh Khắc <br />
              <span className="italic text-[#B8737D] font-normal">Tỏa Sáng Trọn Vẹn</span>
            </h1>

            {/* Paragraph */}
            <p className="font-jakarta font-light text-[15px] sm:text-[16px] leading-[26px] text-[#514344] max-w-[490px] mb-8">
              Tuyển tập áo cưới hoàng gia nhập khẩu và đính kết pha lê thủ công tinh xảo. Trải nghiệm nghi thức thử váy riêng tư đỉnh cao trong không gian salon độc bản.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-10">
              <Link
                to="/collection"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#B8737D] text-white font-jakarta text-[14px] font-semibold tracking-wider uppercase transition-all duration-300 shadow-[0px_4px_16px_rgba(184,115,125,0.3)] hover:bg-[#a6626c] hover:shadow-[0px_6px_20px_rgba(184,115,125,0.4)] active:scale-[0.98]"
              >
                KHÁM PHÁ BỘ SƯU TẬP
              </Link>
              <button
                type="button"
                onClick={onOpenBooking}
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white border border-[#E6DAC8] text-[#2C2523] font-jakarta text-[14px] font-medium tracking-wide hover:border-[#B8737D] hover:text-[#B8737D] transition-all duration-300 shadow-[0px_2px_8px_rgba(0,0,0,0.03)] cursor-pointer"
              >
                Đặt Lịch Thử Váy
              </button>
            </div>

            {/* Value Propositions */}
            <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-2 border-t border-[#EEDECF] w-full">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#B8737D]" />
                <span className="font-jakarta text-[13px] text-[#514344] font-normal">
                  Chỉnh may đo chuẩn số đo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#B8737D]" />
                <span className="font-jakarta text-[13px] text-[#514344] font-normal">
                  Giặt hấp sinh học tiệt trùng
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#B8737D]" />
                <span className="font-jakarta text-[13px] text-[#514344] font-normal">
                  Ký hợp đồng &amp; hoàn cọc tức thì
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Composition */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            {/* Main Portrait Card */}
            <div className="relative w-full max-w-[440px] sm:max-w-[480px] h-[580px] sm:h-[640px] rounded-[32px] overflow-hidden shadow-[0px_16px_40px_rgba(44,37,35,0.08)] border-4 border-white">
              <img
                src={heroBrideImg}
                alt="Nàng dâu trong mẫu váy cưới Elysian Rose"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(44,37,35,0.4)] via-transparent to-transparent pointer-events-none" />
              {/* Logo UniBridal Watermark */}
              <div
                className="absolute bottom-5 right-5 z-10 pointer-events-none select-none transition-transform duration-300 hover:scale-110"
                title="UniBridal Haute Couture"
              >
                <img
                  src={logoEmblemImg}
                  alt="UniBridal Emblem"
                  className="w-[52px] h-[52px] object-contain drop-shadow-[0px_2px_8px_rgba(0,0,0,0.4)]"
                />
              </div>
            </div>

            {/* Floating Overlap Card 1: Luxury Lace Detail */}
            <div className="absolute -bottom-6 -left-4 sm:left-4 w-[160px] sm:w-[190px] h-[210px] sm:h-[240px] rounded-2xl overflow-hidden shadow-[0px_12px_32px_rgba(0,0,0,0.12)] border-4 border-white hidden sm:block">
              <img
                src={laceDetailImg}
                alt="Chi tiết ren đính đá Swarovski thủ công"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-xs py-1 px-2 rounded text-center">
                <span className="font-jakarta text-[10px] uppercase font-bold tracking-widest text-[#B8737D]">
                  Ren Ý Thủ Công
                </span>
              </div>
            </div>

            {/* Floating Overlap Card 2: Rating Trust Badge */}
            <div className="absolute top-10 -right-2 sm:right-4 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-[0px_8px_24px_rgba(201,138,144,0.18)] border border-[#F3D8D8] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFF5F2] flex items-center justify-center text-[#B8737D] font-serif text-lg font-bold">
                5★
              </div>
              <div className="text-left">
                <div className="font-playfair text-[15px] font-bold text-[#2C2523] leading-tight">
                  Haute Couture
                </div>
                <div className="font-jakarta text-[11px] text-[#847374] mt-0.5">
                  100% Khách Hài Lòng
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
