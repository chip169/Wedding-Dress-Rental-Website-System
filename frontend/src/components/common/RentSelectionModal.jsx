import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Ruler, ArrowRight, Sparkles } from 'lucide-react';
import { message } from 'antd';
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

function formatPriceVND(amount) {
  if (amount === undefined || amount === null || amount === '') return '0 ₫';
  const num = typeof amount === 'number' ? amount : Number(String(amount).replace(/[^0-9]/g, ''));
  if (isNaN(num)) return '0 ₫';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫';
}

// Kiểm tra một size cụ thể của váy có bị hết hàng hay không
function checkIsSizeOutOfStock(sz, dress) {
  if (!dress) return false;
  const sClean = String(typeof sz === 'string' ? sz : sz?.size || sz?.label || sz?.id || '')
    .replace(/^size\s*/i, '')
    .trim()
    .toUpperCase();

  // 1. Kiểm tra trạng thái chung của váy
  const status = String(dress.status || dress.statusType || '').toLowerCase();
  if (['out_of_stock', 'retired', 'unavailable', 'drying'].includes(status)) {
    return true;
  }

  // 2. Kiểm tra trong kho override (localStorage)
  try {
    const rawOverrides = localStorage.getItem('unibridal_inventory_overrides');
    if (rawOverrides) {
      const overrides = JSON.parse(rawOverrides);
      const dressId = String(dress._id || dress.id || '');
      const dressCode = String(dress.code || '').toUpperCase();
      const ov =
        overrides[dressId] ||
        overrides[dressCode] ||
        Object.values(overrides).find(
          (o) =>
            (o?.code && o.code.toUpperCase() === dressCode) ||
            (o?.id && String(o.id) === dressId)
        );

      if (ov?.statusType === 'out_of_stock' || ov?.statusType === 'drying') {
        return true;
      }

      // Kiểm tra bảo dưỡng thủ công theo size
      const manualMaint = Number(ov?.maintenanceSizes?.[sClean] ?? 0);
      if (manualMaint > 0) {
        let totalSizeQty = 1;
        if (Array.isArray(dress.sizes)) {
          const matchDress = dress.sizes.find((s) => {
            const val = String(typeof s === 'string' ? s : s?.size || s?.label || s?.id || '')
              .replace(/^size\s*/i, '')
              .trim()
              .toUpperCase();
            return val === sClean;
          });
          if (matchDress && typeof matchDress === 'object') {
            totalSizeQty = Math.max(1, Number(matchDress.totalQuantity ?? matchDress.quantity) || 1);
          }
        }
        if (manualMaint >= totalSizeQty) return true;
      }

      if (Array.isArray(ov?.sizes)) {
        const matchOv = ov.sizes.find((s) => {
          const val = String(typeof s === 'string' ? s : s?.size || s?.label || s?.id || '')
            .replace(/^size\s*/i, '')
            .trim()
            .toUpperCase();
          return val === sClean;
        });
        if (matchOv && typeof matchOv === 'object') {
          if (matchOv?.available !== undefined && Number(matchOv.available) <= 0) return true;
          if (matchOv?.quantity !== undefined) {
            const q = Number(matchOv.quantity);
            if (!isNaN(q) && q <= 0) return true;
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. Kiểm tra trực tiếp trên đối tượng sz
  if (typeof sz === 'object' && sz !== null) {
    if (sz.available !== undefined && Number(sz.available) <= 0) return true;
    if (sz.quantity !== undefined) {
      const q = Number(sz.quantity);
      if (!isNaN(q) && q <= 0) return true;
    }
    if (sz.isMaintenance) return true;
  }

  // 4. Kiểm tra trong dress.sizes
  if (Array.isArray(dress.sizes)) {
    const matchDress = dress.sizes.find((s) => {
      const val = String(typeof s === 'string' ? s : s?.size || s?.label || s?.id || '')
        .replace(/^size\s*/i, '')
        .trim()
        .toUpperCase();
      return val === sClean;
    });
    if (matchDress && typeof matchDress === 'object') {
      if (matchDress.available !== undefined && Number(matchDress.available) <= 0) return true;
      if (matchDress.quantity !== undefined) {
        const q = Number(matchDress.quantity);
        if (!isNaN(q) && q <= 0) return true;
      }
      if (matchDress.isMaintenance) return true;
    }
  }

  return false;
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
        const rawKey = typeof s === 'string' ? s : (s?.size || s?.id || s?.label || '');
        const clean = String(rawKey).replace(/^size\s*/i, '').trim().toUpperCase();
        const mapKey = clean === 'FREESIZE' ? 'FreeSize' : clean;
        const matched = SIZE_MAP[mapKey];
        const sQty = typeof s === 'object' && s?.available !== undefined
          ? Number(s.available)
          : (typeof s === 'object' && s?.quantity !== undefined ? Number(s.quantity) : 1);

        if (matched) {
          return {
            ...matched,
            quantity: sQty,
            available: sQty,
          };
        }
        return {
          id: mapKey || 'S',
          label: mapKey || 'S',
          note: s?.note || 'Chuẩn dáng UniBridal',
          quantity: sQty,
          available: sQty,
        };
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

  // State lựa chọn người dùng
  const [selectedSize, setSelectedSize] = useState('S');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const wasOpenRef = React.useRef(false);

  // Cập nhật giá trị ban đầu tương ứng với từng chiếc váy khi mới mở popup
  useEffect(() => {
    if (isOpen && !wasOpenRef.current && dress) {
      if (availableSizes && availableSizes.length > 0) {
        const firstAvailable = availableSizes.find((sz) => !checkIsSizeOutOfStock(sz, dress));
        setSelectedSize(firstAvailable ? firstAvailable.id : availableSizes[0].id);
      }
      setIsSizeGuideOpen(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, dress, availableSizes]);

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
    if (checkIsSizeOutOfStock(selectedSize, dress)) {
      message.error(`Size ${selectedSize} hiện đã hết hàng trong kho. Vui lòng chọn size khác!`);
      return;
    }

    const payload = {
      ...dress,
      selectedSize,
      size: selectedSize,
      rentalDays: 1,
    };

    addToCart(payload);

    if (onSuccess) {
      onSuccess(payload);
    }

    onClose();

    navigate(`/checkout?dressId=${dress.id}&size=${selectedSize}`);
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

        {/* Nội dung chính */}
        <div className="p-5 sm:p-6 bg-white flex flex-col gap-5">
          {/* KHU VỰC CHỌN KÍCH THƯỚC CÓ SẴN */}
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
                const isOutOfStock = checkIsSizeOutOfStock(sz, dress);

                return (
                  <button
                    key={sz.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => {
                      if (!isOutOfStock) setSelectedSize(sz.id);
                    }}
                    title={isOutOfStock ? `Size ${sz.label} hiện đã hết hàng trong kho` : undefined}
                    className={`py-2.5 px-3 rounded-[12px] border text-center transition-all flex flex-col items-center justify-center ${
                      isOutOfStock
                        ? 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed opacity-40 line-through decoration-stone-400 select-none'
                        : isSizeActive
                          ? 'border-[#B26B74] bg-[#B26B74] text-white shadow-xs cursor-pointer'
                          : 'border-[#EAE0DC] bg-white text-[#231A19] hover:border-[#B26B74] cursor-pointer'
                    }`}
                  >
                    <span className="font-semibold text-[13.5px] leading-tight">{sz.label}</span>
                    <span
                      className={`text-[10.5px] leading-tight mt-0.5 ${
                        isOutOfStock
                          ? 'text-stone-400 font-medium'
                          : isSizeActive
                            ? 'text-white/80'
                            : 'text-[#8A7978]'
                      }`}
                    >
                      {isOutOfStock ? 'Hết hàng' : sz.note}
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

