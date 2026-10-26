import React from 'react';

/**
 * Biểu tượng Kệ kho / Tủ treo hàng chuyên dụng
 * Chuẩn stroke và style theo bộ icon Lucide / UniBridal Admin
 */
export default function ShelvesIcon({ size = 16, className = '', strokeWidth = 1.9 }) {
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
      {/* 2 cột đứng chịu lực bên trái và phải với chóp trên và chân đế đều nhau */}
      <line x1="4" y1="2.5" x2="4" y2="21.5" />
      <line x1="20" y1="2.5" x2="20" y2="21.5" />

      {/* 3 tầng đợt kệ ngang */}
      <line x1="4" y1="5.5" x2="20" y2="5.5" />
      <line x1="4" y1="12.5" x2="20" y2="12.5" />
      <line x1="4" y1="18.5" x2="20" y2="18.5" />

      {/* Hộp kiện tầng giữa bên trái */}
      <path d="M4 12.5V8.5h5v4" />

      {/* Hộp kiện tầng đáy bên trái */}
      <path d="M4 18.5v-4h5v4" />
    </svg>
  );
}
