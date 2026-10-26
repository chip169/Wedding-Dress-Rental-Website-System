import React from 'react';

/**
 * Biểu tượng móc treo trang phục cưới / váy dạ hội
 * Chuẩn stroke và style theo bộ icon Lucide / UniBridal Admin
 */
export default function HangerIcon({ size = 18, className = '', strokeWidth = 1.8 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Móc treo trên đầu */}
      <path d="M12 9V7.5a2 2 0 0 1-1.2-1.8 2.2 2.2 0 0 1 2.2-2.2 2.2 2.2 0 0 1 2.2 2.2c0 .6-.3 1.1-.8 1.4" />
      {/* Thân móc hình tam giác vai áo */}
      <path d="M12 9 3.5 13.8a1.2 1.2 0 0 0 .6 2.2h15.8a1.2 1.2 0 0 0 .6-2.2L12 9Z" />
      {/* Khung vuông treo tùng váy / khăn phụ kiện bên dưới */}
      <path d="M8.5 16v4.2a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V16" />
    </svg>
  );
}
