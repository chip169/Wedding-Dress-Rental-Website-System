import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#FAF7F2] border-t border-[#E6DAC8] pt-14 pb-8 text-[#514344]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
        
        {/* 4 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12">
          
          {/* Column 1: Brand Intro (col-span-4) */}
          <div className="lg:col-span-4 pr-0 lg:pr-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-playfair text-[26px] font-bold italic text-[#B8737D]">
                <span className="text-[#C98A90]">U</span>B
              </span>
              <span className="font-playfair text-[22px] font-bold text-[#2C2523]">
                UniBridal
              </span>
            </div>

            <p className="font-jakarta text-[13px] leading-[22px] text-[#514344] max-w-[340px] m-0">
              Không gian Haute Couture bridal atelier độc bản dành cho cô dâu hiện đại. Trải nghiệm dịch vụ thử váy riêng tư và giải pháp thuê lễ phục cao cấp với chính sách bảo lãnh minh bạch.
            </p>
          </div>

          {/* Column 2: Hệ Thống (col-span-3) */}
          <div className="lg:col-span-3">
            <h4 className="font-playfair font-normal text-[20px] text-[#2C2523] mb-4">
              Hệ Thống
            </h4>

            {/* TP. HCM */}
            <div className="mb-4">
              <span className="font-jakarta font-semibold text-[12px] uppercase tracking-wider text-[#B8737D] block mb-1">
                TP. Hồ Chí Minh
              </span>
              <p className="font-jakarta text-[12px] leading-[18px] text-[#514344] m-0 mb-1">
                Số 88 Nam Kỳ Khởi Nghĩa, Phường Bến Nghé, Quận 1
              </p>
              <span className="font-jakarta text-[11px] text-[#695C4E] block">
                Hotline VIP: 0908 123 888
              </span>
            </div>

            {/* Hà Nội */}
            <div>
              <span className="font-jakarta font-semibold text-[12px] uppercase tracking-wider text-[#B8737D] block mb-1">
                Hà Nội
              </span>
              <p className="font-jakarta text-[12px] leading-[18px] text-[#514344] m-0 mb-1">
                Số 24 Tràng Tiền, Phường Tràng Tiền, Quận Hoàn Kiếm
              </p>
              <span className="font-jakarta text-[11px] text-[#695C4E] block">
                Hotline VIP: 0909 789 999
              </span>
            </div>
          </div>

          {/* Column 3: Chính Sách & Cam Kết (col-span-3) */}
          <div className="lg:col-span-3">
            <h4 className="font-playfair font-normal text-[20px] text-[#2C2523] mb-4">
              Chính Sách & Cam Kết
            </h4>
            <ul className="list-none p-0 m-0 space-y-2">
              {[
                'Cam kết hoàn cọc 100%',
                'Hợp đồng bảo hiểm váy cưới',
                'Gói thử váy Private Suite',
                'Điều khoản giao nhận toàn quốc',
                'Bảo quản & Xử lý lụa tơ tằm',
              ].map((text, idx) => (
                <li key={idx}>
                  <a
                    href="#"
                    className="font-jakarta text-[12px] text-[#514344] hover:text-[#B8737D] transition-colors text-decoration-none"
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Thông tin (col-span-2) */}
          <div className="lg:col-span-2">
            <h4 className="font-playfair font-normal text-[20px] text-[#2C2523] mb-4">
              Thông tin
            </h4>
            <ul className="list-none p-0 m-0 space-y-2">
              {[
                'Về UniBridal Haute Couture',
                'Bảng giá & Gói dịch vụ',
                'Hướng dẫn đặt lịch thử váy',
                'Câu hỏi thường gặp (FAQ)',
                'Tuyển dụng & Hợp tác',
              ].map((text, idx) => (
                <li key={idx}>
                  <a
                    href="#"
                    className="font-jakarta text-[12px] text-[#514344] hover:text-[#B8737D] transition-colors text-decoration-none"
                  >
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#E6DAC8]/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-jakarta text-[11px] text-[#514344] m-0 text-center md:text-left">
            © 2026 UniBridal Haute Couture Atelier. All rights reserved. Nghiêm cấm sao chép bản quyền thiết kế.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 font-jakarta text-[11px] text-[#514344]">
            <a href="#" className="hover:text-[#B8737D] transition-colors text-decoration-none">
              Quy Định Đặt Cọc
            </a>
            <span>•</span>
            <a href="#" className="hover:text-[#B8737D] transition-colors text-decoration-none">
              Chính Sách Bảo Mật
            </a>
            <span>•</span>
            <a href="#" className="hover:text-[#B8737D] transition-colors text-decoration-none">
              Tiêu Chuẩn Giặt Hấp
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
