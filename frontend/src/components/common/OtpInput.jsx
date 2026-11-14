import React, { useRef, useState, useEffect } from 'react';

/**
 * OtpInput - Luxury Haute Couture 6-Digit OTP Component
 * 
 * Sử dụng kiến trúc "Single Input + Visual Boxes" chuẩn quốc tế:
 * - Dùng duy nhất 1 input text trên DOM để quản lý focus và sự kiện phím
 * - Giải quyết triệt để 100% hiện tượng bộ gõ tiếng Việt (Unikey, EVKey, Telex, VNI)
 *   bị lặp ký tự hoặc nhảy số khi chuyển focus giữa các ô.
 * - Hỗ trợ gõ nhanh, xóa Backspace mượt mà, dán mã OTP từ clipboard.
 */
export default function OtpInput({
  value = '',
  onChange,
  disabled = false,
  autoFocus = true,
  length = 6,
  className = '',
  onComplete,
}) {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Chuẩn hóa chuỗi số: chỉ lấy ký tự số từ 0-9, tối đa `length` ký tự
  const cleanVal = String(value || '').replace(/\D/g, '').slice(0, length);

  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      // Focus sau khi render
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  // Khi đủ số lượng ký tự thì kích hoạt onComplete (nếu có)
  useEffect(() => {
    if (cleanVal.length === length && onComplete) {
      onComplete(cleanVal);
    }
  }, [cleanVal, length, onComplete]);

  const handleInputChange = (e) => {
    const raw = e.target.value || '';
    const digitsOnly = raw.replace(/\D/g, '').slice(0, length);
    if (onChange) {
      onChange(digitsOnly);
    }
  };

  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Tạo mảng các ô
  const boxIndices = Array.from({ length }, (_, i) => i);

  return (
    <div
      onClick={handleContainerClick}
      className={`ub-otp-wrapper ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'text',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes ubOtpBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .ub-otp-caret {
          display: inline-block;
          width: 2px;
          height: 24px;
          background-color: #854F55;
          border-radius: 1px;
          animation: ubOtpBlink 1.1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Input thật duy nhất: Nằm phủ lên trên, trong suốt hoàn toàn */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        value={cleanVal}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        aria-label="Mã xác thực OTP"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: disabled ? 'not-allowed' : 'text',
          zIndex: 10,
          fontSize: '1px',
          color: 'transparent',
          background: 'transparent',
          border: 'none',
          outline: 'none',
        }}
      />

      {/* Visual Boxes: Hiển thị 6 ô số sang trọng */}
      {boxIndices.map((index) => {
        const digit = cleanVal[index] || '';
        // Ô đang active là ô mà con trỏ đang sẵn sàng nhận ký tự tiếp theo
        const isActive = isFocused && !disabled && (
          index === cleanVal.length || (cleanVal.length === length && index === length - 1)
        );
        const isFilled = Boolean(digit);

        return (
          <div
            key={index}
            style={{
              position: 'relative',
              width: '48px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
              fontVariantNumeric: 'tabular-nums',
              fontSize: '24px',
              fontWeight: 700,
              borderRadius: '12px',
              transition: 'all 0.18s ease',
              color: '#2C2523',
              background: isFilled ? '#FFFFFF' : '#FAF8F7',
              border: isActive
                ? '2px solid #854F55'
                : isFilled
                ? '2px solid #854F55'
                : '1.5px solid #E5DCD8',
              boxShadow: isActive
                ? '0 0 0 3px rgba(133, 79, 85, 0.15), 0 2px 8px rgba(133, 79, 85, 0.12)'
                : isFilled
                ? '0 2px 8px rgba(133, 79, 85, 0.12)'
                : 'none',
              transform: isActive ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {digit ? (
              <span>{digit}</span>
            ) : isActive && index === cleanVal.length ? (
              <span className="ub-otp-caret" />
            ) : (
              <span style={{ color: '#D5C7C3', fontSize: '18px' }}>•</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

