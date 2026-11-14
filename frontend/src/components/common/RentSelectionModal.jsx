import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Ruler, ArrowRight, Sparkles } from 'lucide-react';
import { addToCart } from '../../services/cartService';

// Bảng quy chuẩn Size chuẩn Haute Couture
const SIZE_MAP = {
  XS: { id: 'XS', label: 'XS', note: 'Dưới 46kg', bust: '80-82cm', waist: '58-62cm' },
  S: { id: 'S', label: 'S', note: '46 - 52kg', bust: '83-86cm', waist: '63-67cm' },
  M: { id: 'M', label: 'M', note: '52 - 58kg', bust: '87-90cm', waist: '68-73cm' },
  L: { id: 'L', label: 'L', note: '58 - 65kg', bust: '91-95cm', waist: '74-78cm' },
  XL: { id: 'XL', label: 'XL', note: '65 - 72kg', bust: '96-102cm', waist: '79-85cm' },
  FreeSize: { id: 'FreeSize', label: 'FreeSize', note: 'Dây đan corset linh hoạt', bust: '82-96cm', waist: '60-80cm' },
};

// Màu sắc mặc định chuẩn tiệc cưới sang trọng khớp ảnh 3
const DEFAULT_COLORS = [
  { name: 'Trắng Sữa', hex: '#FFFFFF', border: '#D9D9D9' },
  { name: 'Trắng Kem Ivory', hex: '#FDFBF7', border: '#E7DEC8' },
];

function formatPriceVND(amount) {
  if (amount === undefined || amount === null || amount === '') return '0 ₫';
  const num = typeof amount === 'number' ? amount : Number(String(amount).replace(/[^0-9]/g, ''));
  if (isNaN(num)) return '0 ₫';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫';
}

/**
 * RentSelectionModal: Popup chọn màu sắc & kích thước khi ấn Thuê Ngay
 * Bê nguyên vẹn giao diện từ Ảnh 3 (Màu sắc dạng pill + Kích thước có sẵn kèm Ruler)
 */
export default function RentSelectionModal({
  isOpen,
  onClose,
  dress,
  onSuccess,
}) {
  const navigate = useNavigate();

  // 1. Phân tích danh sách kích thước có sẵn của mẫu váy
  const availableSizes = useMemo(() => {
    if (!dress) return [SIZE_MAP.XS, SIZE_MAP.S, SIZE_MAP.M, SIZE_MAP.L];

    // Trường hợp 1: sizes là mảng các object hoặc chuỗi
    if (Array.isArray(dress.sizes) && dress.sizes.length > 0) {
      return dress.sizes.map((s) => {
        const key = typeof s === 'string' ? s.trim() : (s?.id || s?.label || '');
        return SIZE_MAP[key] || { id: key, label: key, note: s?.note || 'Chuẩn dáng UniBridal' };
      });
    }

    // Trường hợp 2: size là chuỗi (VD: "Size: XS", "Size: XS - S", "Size: S - M - L")
    if (typeof dress.size === 'string') {
      const matched = dress.size.match(/\b(FreeSize|XS|XL|S|M|L)\b/gi);
      if (matched && matched.length > 0) {
        return matched.map((m) => {
          const upper = m.toUpperCase();
          const key = upper === 'FREESIZE' ? 'FreeSize' : upper;
          return SIZE_MAP[key] || { id: key, label: key, note: 'Chuẩn dáng UniBridal' };
        });
      }
    }

    // Fallback: Mặc định các size thông dụng
    return [SIZE_MAP.XS, SIZE_MAP.S, SIZE_MAP.M, SIZE_MAP.L];
  }, [dress]);

  // 2. Phân tích danh sách màu sắc của mẫu váy
  const availableColors = useMemo(() => {
    if (!dress) return DEFAULT_COLORS;

    if (Array.isArray(dress.colors) && dress.colors.length > 0) {
      return dress.colors;
    }

    if (Array.isArray(dress.colorOptions) && dress.colorOptions.length > 0) {
      return dress.colorOptions;
    }

    if (typeof dress.color === 'string' && dress.color.trim()) {
      const hexMap = {
        'trắng sữa': { hex: '#FFFFFF', border: '#D9D9D9' },
        'trắng kem ivory': { hex: '#FDFBF7', border: '#E7DEC8' },
        'trắng tinh khôi': { hex: '#FFFFFF', border: '#D9D9D9' },
        'trắng kem': { hex: '#FDFBF7', border: '#E7DEC8' },
        'champagne': { hex: '#F7E7CE', border: '#DEC8A6' },
        'hồng pastel': { hex: '#F5D6D8', border: '#E8B6BC' },
      };
      const parsed = dress.color.split(',').map((c) => {
        const cName = c.trim();
        const lower = cName.toLowerCase();
        return {
          name: cName,
          hex: hexMap[lower]?.hex || '#FFFFFF',
          border: hexMap[lower]?.border || '#D9D9D9',
        };
      });
      if (parsed.length > 0) return parsed;
    }

    return DEFAULT_COLORS;
  }, [dress]);

  // State lựa chọn người dùng
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState('S');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Cập nhật giá trị ban đầu tương ứng với từng chiếc váy khi mở popup
  useEffect(() => {
    if (isOpen && dress) {
      if (availableColors && availableColors.length > 0) {
        setSelectedColor(availableColors[0]);
      }
      if (availableSizes && availableSizes.length > 0) {
        setSelectedSize(availableSizes[0].id);
      }
      setIsSizeGuideOpen(false);
    }
  }, [isOpen, dress, availableColors, availableSizes]);

  // Đóng modal khi bấm phím Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !dress) return null;

  // Xác nhận thuê ngay -> Thêm vào giỏ và chuyển đến Checkout
  const handleConfirmRent = () => {
    const payload = {
      ...dress,
      selectedSize,
      size: selectedSize,
      selectedColor,
      color: selectedColor?.name,
      fabric: selectedColor?.name,
      rentalDays: 1,
    };

    addToCart(payload);

    if (onSuccess) {
      onSuccess(payload);
    }

    onClose();

    const colorQuery = selectedColor?.name ? `&color=${encodeURIComponent(selectedColor.name)}` : '';
    navigate(`/checkout?dressId=${dress.id}&size=${selectedSize}${colorQuery}`);
  };

  const dressPrice = dress.priceNumber || dress.rentPrice || dress.price;
  const depositAmount = dress.depositAmountNumber || dress.depositAmount || dress.deposit || 15000000;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] bg-white rounded-[22px] shadow-2xl border border-[#EAE0DC] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Thông tin vắn tắt váy cưới */}
        <div className="relative p-5 pb-4 border-b border-[#F0E5DC] flex items-center justify-between bg-[#FCF9F7]">
          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-[62px] h-[62px] rounded-xl overflow-hidden bg-[#FAF0EC] border border-[#EEDECF] shrink-0 shadow-2xs">
              <img
                src={dress.image}
                alt={dress.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#B26B74] block">
                {dress.badgeMain || 'HAUTE COUTURE 2026'}
              </span>
              <h3 className="font-playfair text-[17px] font-semibold text-[#231A19] leading-tight m-0 line-clamp-1">
                {dress.name}
              </h3>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-playfair font-bold text-[18px] text-[#B26B74]">
                  {formatPriceVND(dressPrice)}
                </span>
                <span className="text-[11.5px] text-[#8A7978]">/ 1 ngày</span>
              </div>
              <p className="text-[11px] text-[#6B5C5D] m-0 mt-0.5">
                Tiền cọc bảo lãnh: <strong className="text-[#231A19]">{formatPriceVND(depositAmount)}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#7A6B6A] hover:bg-[#F2DDD9] hover:text-[#231A19] transition-colors cursor-pointer border-0 bg-white shadow-xs"
            title="Đóng popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nội dung chính: Bê nguyên xi Ảnh 3 */}
        <div className="p-5 sm:p-6 bg-white flex flex-col gap-5">
          {/* 1. KHU VỰC CHỌN MÀU SẮC (Khớp 100% Ảnh 3) */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[13.5px] font-medium text-[#231A19]">
                Màu sắc: <strong className="text-[#B26B74] font-semibold">{selectedColor?.name || 'Trắng Sữa'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {availableColors.map((col, idx) => {
                const isColorActive = selectedColor?.name === col.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    title={col.name}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                      isColorActive
                        ? 'border-[#B26B74] bg-[#FFF5F3] shadow-xs'
                        : 'border-[#EAE0DC] bg-white hover:border-[#C4A5AA]'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-xs"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className={`text-[12.5px] font-medium ${isColorActive ? 'text-[#B26B74]' : 'text-[#5A4848]'}`}>
                      {col.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. KHU VỰC CHỌN KÍCH THƯỚC CÓ SẴN (Khớp 100% Ảnh 3) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[13.5px] font-medium text-[#231A19]">
                Kích thước có sẵn
              </span>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(!isSizeGuideOpen)}
                className="text-[12.5px] text-[#B26B74] hover:underline font-medium flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
              >
                <Ruler className="w-3.5 h-3.5" />
                Hướng dẫn chọn size
              </button>
            </div>

            <div
              className={`grid gap-2.5 ${
                availableSizes.length === 1
                  ? 'grid-cols-2'
                  : availableSizes.length === 2
                  ? 'grid-cols-2'
                  : availableSizes.length === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-4'
              }`}
            >
              {availableSizes.map((sz) => {
                const isSizeActive = selectedSize === sz.id;
                return (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setSelectedSize(sz.id)}
                    className={`py-2.5 px-3 rounded-[12px] border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSizeActive
                        ? 'border-[#B26B74] bg-[#B26B74] text-white shadow-xs'
                        : 'border-[#EAE0DC] bg-white text-[#231A19] hover:border-[#B26B74]'
                    }`}
                  >
                    <span className="font-semibold text-[13.5px] leading-tight">{sz.label}</span>
                    <span
                      className={`text-[10.5px] leading-tight mt-0.5 ${
                        isSizeActive ? 'text-white/80' : 'text-[#8A7978]'
                      }`}
                    >
                      {sz.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. BẢNG HƯỚNG DẪN CHỌN SIZE NHANH (Mở khi bấm Hướng dẫn chọn size) */}
          {isSizeGuideOpen && (
            <div className="p-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE0DC] text-[12px] animate-fade-in">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#EAE0DC]">
                <span className="font-semibold text-[#B26B74] flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" />
                  Bảng thông số số đo chuẩn
                </span>
                <span className="text-[10.5px] text-[#8A7978]">Dây đan corset ±4cm</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11.5px] border-collapse">
                  <thead>
                    <tr className="text-[#8A7978] border-b border-[#EAE0DC]/60">
                      <th className="py-1 px-1.5 font-medium">Size</th>
                      <th className="py-1 px-1.5 font-medium">Cân nặng</th>
                      <th className="py-1 px-1.5 font-medium">Vòng ngực</th>
                      <th className="py-1 px-1.5 font-medium">Vòng eo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE0DC]/40 text-[#231A19]">
                    <tr>
                      <td className="py-1 px-1.5 font-bold text-[#B26B74]">XS</td>
                      <td className="py-1 px-1.5">Dưới 46kg</td>
                      <td className="py-1 px-1.5">80 – 82 cm</td>
                      <td className="py-1 px-1.5">58 – 62 cm</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-1.5 font-bold text-[#B26B74]">S</td>
                      <td className="py-1 px-1.5">46 – 52kg</td>
                      <td className="py-1 px-1.5">83 – 86 cm</td>
                      <td className="py-1 px-1.5">63 – 67 cm</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-1.5 font-bold text-[#B26B74]">M</td>
                      <td className="py-1 px-1.5">52 – 58kg</td>
                      <td className="py-1 px-1.5">87 – 90 cm</td>
                      <td className="py-1 px-1.5">68 – 73 cm</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-1.5 font-bold text-[#B26B74]">L</td>
                      <td className="py-1 px-1.5">58 – 65kg</td>
                      <td className="py-1 px-1.5">91 – 95 cm</td>
                      <td className="py-1 px-1.5">74 – 78 cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10.5px] text-[#7A6B6A] m-0 mt-2 italic">
                * Mọi mẫu váy đều có dây siết eo công nghệ Pháp giúp điều chỉnh vừa vặn vóc dáng cô dâu.
              </p>
            </div>
          )}
        </div>

        {/* Footer: Nút Xác Nhận Thuê Ngay */}
        <div className="p-5 pt-3 border-t border-[#F0E5DC] bg-[#FAF7F5] flex flex-col gap-2">
          <button
            type="button"
            onClick={handleConfirmRent}
            className="w-full py-3 rounded-xl bg-[#804E55] hover:bg-[#6D3940] text-white font-jakarta text-[13.5px] font-semibold tracking-wide transition-all cursor-pointer border-0 shadow-md flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>Xác Nhận Thuê Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

