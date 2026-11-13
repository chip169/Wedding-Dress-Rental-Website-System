import { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  ExternalLink,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Building2,
  User,
  Phone,
  CreditCard,
  MapPin,
  CalendarDays,
  Crown,
  X,
  Clock,
  AlertCircle
} from 'lucide-react';
import { getOrder } from '../../services/customerOrderService';
import { formatCurrencyVND } from '../../utils/formatCurrency';
import { formatShortDate } from '../../utils/formatDate';
import { HIEU_SIGNATURE_BASE64 } from '../../assets/images/signatureHieuBase64';
import { DAMAGE_PRICE_CATALOG } from '../../data/damagePriceCatalog';

// Danh sách các điều khoản pháp lý tiêu chuẩn Haute Couture
const STANDARD_HAUTE_COUTURE_CLAUSES = [
  {
    title: 'ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG VÀ TIÊU CHUẨN LỄ PHỤC CƯỚI',
    content:
      '1.1. Bên A đồng ý cho Bên B thuê tác phẩm váy cưới độc bản thiết kế mang tên theo thông tin đơn thuê chi tiết, kích cỡ may đo chuẩn mực theo yêu cầu của Bên B.\n' +
      '1.2. Tiêu chuẩn bàn giao: Tác phẩm đạt chuẩn Haute Couture, khung xương nẹp corset siết eo công nghệ Pháp, được giặt sấy tiệt trùng sinh học, ủi phẳng phiu và đặt trong Vali VIP Courier bảo quản chống bụi nhiệt trước giờ trao nhận 02 giờ.\n' +
      '1.3. Tinh chỉnh may đo: Bên A cung cấp dịch vụ tinh chỉnh nới/siết phom theo đúng thông số số đo chuẩn (Chiều cao, Cân nặng, Vòng eo) đã được ghi nhận của Bên B.'
  },
  {
    title: 'ĐIỀU 2: THỜI HẠN THUÊ, PHƯƠNG THỨC GIAO NHẬN VÀ QUY TRÌNH THU HỒI',
    content:
      '2.1. Tổng thời gian thuê: Được xác định theo gói ngày Bên B lựa chọn ghi rõ trên đơn thuê.\n' +
      '2.2. Thời điểm nhận váy: Từ 09:00 ngày bắt đầu thuê tại Showroom UniBridal hoặc bàn giao tận nơi bằng Vali VIP Courier.\n' +
      '2.3. Phương thức hoàn trả và thu hồi: Trước 20:00 ngày kết thúc thời hạn thuê. Chuyên viên của Bên A chủ động liên hệ hẹn giờ và trực tiếp đến tận địa chỉ của Bên B thu hồi lễ phục trong vali bảo quản niêm phong, thực hiện kiểm định sơ bộ hiện trạng sản phẩm.\n' +
      '2.4. Hai bên thực hiện ký Biên bản kiểm định bàn giao và thu hồi để ghi nhận hiện trạng đính kết ren, hạt cườm và kết cấu váy tại thời điểm giao và nhận lại.'
  },
  {
    title: 'ĐIỀU 3: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN',
    content:
      '3.1. Tổng giá trị hợp đồng thuê trọn gói đã bao gồm VAT, dịch vụ giặt hấp khử khuẩn và phí tinh chỉnh phom váy.\n' +
      '3.2. Tiền đặt cọc giữ lịch độc quyền (50% giá trị hợp đồng): Bên B thanh toán ngay khi ký hợp đồng thông qua cổng chuyển khoản VietQR Napas 24/7 hoặc thẻ ngân hàng.\n' +
      '3.3. Số tiền thuê còn lại sẽ được Bên B thanh toán dứt điểm tại thời điểm nhận bàn giao lễ phục.'
  },
  {
    title: 'ĐIỀU 4: TIỀN ĐẶT CỌC BẢO LÃNH VÀ CƠ CHẾ HOÀN CỌC',
    content:
      '4.1. Tiền đặt cọc bảo lãnh trách nhiệm được Bên B nộp để đảm bảo giữ gìn trang phục cưới nguyên trạng.\n' +
      '4.2. Số tiền cọc sẽ được hoàn trả 100% cho Bên B trong vòng 02 giờ làm việc qua hình thức chuyển khoản trực tiếp sau khi hoàn tất Biên bản kiểm định thu hồi hiện trạng không phát sinh hư hỏng cấu trúc.\n' +
      '4.3. Trường hợp phát sinh vết bẩn nhẹ thông thường tẩy được bằng giặt hấp sinh học, Bên A cam kết MIỄN PHÍ và không trừ tiền cọc.'
  },
  {
    title: 'ĐIỀU 5: TRÁCH NHIỆM BẢO QUẢN VÀ BẢNG GIÁ ĐỀN BÙ THIỆT HẠI NIÊM YẾT',
    content:
      '5.1. Bên B cam kết giữ gìn trang phục cẩn trọng, không tự ý cắt may, ủi nhiệt độ cao hoặc tẩy hóa chất.\n' +
      '5.2. Hai bên thống nhất áp dụng Bảng giá đền bù thiệt hại cố định niêm yết (Phụ lục 1) để đối chiếu khi hoàn trả lễ phục, không phụ thuộc ý chí chủ quan của nhân viên:\n' +
      '   • Nhóm 1 (Hao mòn tự nhiên): 0 VNĐ (Miễn phí trong gói giặt);\n' +
      '   • Nhóm 2 (Vết bẩn nhẹ - son môi, phấn trang điểm): 250.000 VNĐ;\n' +
      '   • Nhóm 3 (Sút chỉ / Tuột cúc - đứt chỉ viền, bung cườm): 200.000 VNĐ;\n' +
      '   • Nhóm 4 (Vết bẩn cứng đầu - rượu vang, dầu mỡ sậm màu): 500.000 VNĐ;\n' +
      '   • Nhóm 5 (Rách gấu ren nhỏ < 5cm do giẫm gót): 500.000 VNĐ;\n' +
      '   • Nhóm 6 (Hỏng khóa lưng - zipper): 300.000 VNĐ;\n' +
      '   • Nhóm 7 (Rách tùng voan lớn > 10cm, rách vải chính): 1.500.000 VNĐ;\n' +
      '   • Nhóm 8 (Mất phụ kiện đi kèm): 500.000 VNĐ / món;\n' +
      '   • Nhóm 9 (Hỏng hoàn toàn - cháy vải, rách nát không thể phục hồi): Tịch thu 100% tiền cọc bảo lãnh.\n' +
      '5.3. Chi phí đền bù (nếu có) được khấu trừ trực tiếp vào quỹ cọc bảo lãnh. Số tiền cọc còn lại được Bên A hoàn trả đầy đủ vào STK ngân hàng của Bên B.'
  },
  {
    title: 'ĐIỀU 6: HIỆU LỰC HỢP ĐỒNG ĐIỆN TỬ',
    content:
      '6.1. Hợp đồng điện tử này được khởi tạo và ký kết trực tuyến hợp pháp, có giá trị pháp lý ràng buộc tương đương văn bản ký tay theo Luật Giao dịch điện tử Việt Nam.\n' +
      '6.2. Hợp đồng có hiệu lực kể từ thời điểm Bên B ký điện tử và thanh toán cọc thành công cho đến khi hai bên hoàn tất biên bản bàn giao, thu hồi và thanh quyết toán cọc.'
  }
];

export default function SignedContractModal({ orderId, order: propOrder, contractData, onClose }) {
  const [order, setOrder] = useState(propOrder || null);
  const [loading, setLoading] = useState(!propOrder && Boolean(orderId));
  const [error, setError] = useState('');

  // Đảm bảo body luôn cuộn tự nhiên
  useEffect(() => {
    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (propOrder) {
      setOrder(propOrder);
      setLoading(false);
      return;
    }
    if (!orderId) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    getOrder(orderId)
      .then((val) => {
        if (active) setOrder(val);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không thể tải thông tin hợp đồng từ hệ thống.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId, propOrder]);

  // Thông tin hợp đồng tổng hợp
  const effectiveData = useMemo(() => {
    const rawOrder = order?.rawOrder || order || {};
    const cData = contractData || {};

    const orderCode =
      cData.orderCode ||
      rawOrder.orderCode ||
      orderId ||
      (rawOrder._id ? String(rawOrder._id).slice(-6).toUpperCase() : 'UB-2026');

    const contractCode =
      cData.id ||
      rawOrder.contractCode ||
      rawOrder.contract?.contractCode ||
      `HD-${orderCode}`;

    const customerName =
      cData.customerName ||
      rawOrder.customerName ||
      rawOrder.brideName ||
      rawOrder.userId?.fullName ||
      'Khách Hàng UniBridal';

    const customerPhone =
      cData.phone ||
      rawOrder.customerPhone ||
      rawOrder.phone ||
      rawOrder.userId?.phone ||
      '0908 123 888';

    const customerCccd =
      cData.idCard ||
      rawOrder.customerCccd ||
      rawOrder.cccd ||
      rawOrder.idCard ||
      rawOrder.contract?.idCard ||
      '001198012345';

    // Địa chỉ giao nhận
    const addr = rawOrder.shippingAddress || cData.shippingAddress;
    let shippingAddress = 'Nhận trực tiếp tại Showroom UniBridal (186 Nam Kỳ Khởi Nghĩa, Q.3, TP.HCM)';
    if (typeof addr === 'string' && addr.trim()) {
      shippingAddress = addr.trim();
    } else if (addr && typeof addr === 'object') {
      const parts = ['street', 'ward', 'district', 'city'].map((k) => addr[k]).filter(Boolean);
      if (parts.length > 0) shippingAddress = parts.join(', ');
    }

    // Thời gian thuê
    const startDateRaw = cData.startDate || rawOrder.rentalStartDate;
    const endDateRaw = cData.endDate || rawOrder.rentalEndDate;
    const startDate = startDateRaw
      ? new Date(startDateRaw).toISOString().split('T')[0]
      : '2026-11-15';
    const endDate = endDateRaw
      ? new Date(endDateRaw).toISOString().split('T')[0]
      : '2026-11-18';

    // Số ngày thuê
    let rentalDays = 3;
    try {
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      if (diff > 0) rentalDays = diff;
    } catch { }

    // Danh sách trang phục thuê
    const rawItems = Array.isArray(rawOrder.items) && rawOrder.items.length > 0
      ? rawOrder.items
      : null;

    let items = [];
    if (rawItems) {
      items = rawItems.map((it) => {
        let name = it.name || it.dressId?.name;
        if (!name || name.trim().length <= 1) {
          const match = rawOrder.notes?.match(/mẫu\s+(.*?)\s+phục vụ/i);
          name = match ? match[1].trim() : (cData.dressName || 'Váy cưới Haute Couture Tiêu Chuẩn');
        }
        return {
          name,
          code: it.dressCode || it.code || it.dressId?.code || cData.dressCode || 'UB-HC-2026',
          size: it.size ? (String(it.size).startsWith('Size') ? it.size : `Size ${it.size}`) : (cData.dressSize || 'Size S'),
          color: it.color || it.fabric || rawOrder.color || 'Trắng Sữa',
          rentPrice: Number(it.rentPrice || it.price || cData.rentalPrice || 0),
          depositAmount: Number(it.depositAmount || it.deposit || cData.depositAmount || 0)
        };
      });
    } else {
      let name = cData.dressName;
      if (!name || name.trim().length <= 1) {
        const match = rawOrder.notes?.match(/mẫu\s+(.*?)\s+phục vụ/i);
        name = match ? match[1].trim() : 'Váy cưới Haute Couture Tiêu Chuẩn';
      }
      items = [
        {
          name: name || 'Váy cưới Haute Couture Tiêu Chuẩn',
          code: cData.dressCode || 'UB-HC-2026',
          size: cData.dressSize || 'Size S',
          rentPrice: Number(cData.rentalPrice || rawOrder.totalRentPrice || 0),
          depositAmount: Number(cData.depositAmount || rawOrder.totalDeposit || 0)
        }
      ];
    }

    const totalRentPrice = Number(
      cData.rentalPrice ?? (rawOrder.totalRentPrice || items.reduce((s, it) => s + it.rentPrice, 0))
    );
    const totalDeposit = Number(
      cData.depositAmount ?? (rawOrder.totalDeposit || items.reduce((s, it) => s + it.depositAmount, 0))
    );
    const totalValue = totalRentPrice + totalDeposit;

    // Trạng thái hợp đồng
    const status = cData.status || rawOrder.status || 'active';
    let statusLabel = 'Đang áp dụng toàn hệ thống';
    let statusClass = 'text-emerald-700 font-semibold';
    if (status === 'completed') {
      statusLabel = 'Đã hoàn thành';
      statusClass = 'text-[#705856] font-semibold';
    } else if (status === 'disputed' || status === 'returned') {
      statusLabel = 'Đang xử lý hoàn cọc';
      statusClass = 'text-rose-700 font-semibold';
    } else if (status === 'pending_signature') {
      statusLabel = 'Chờ ký & thanh toán';
      statusClass = 'text-amber-700 font-semibold';
    } else {
      statusLabel = 'Có hiệu lực pháp lý';
      statusClass = 'text-emerald-700 font-semibold';
    }

    // Ngày ký
    const signedDateStr =
      cData.signedAt ||
      (rawOrder.contract?.signedAt
        ? new Date(rawOrder.contract.signedAt).toLocaleDateString('vi-VN')
        : rawOrder.createdAt
        ? new Date(rawOrder.createdAt).toLocaleDateString('vi-VN')
        : new Date().toLocaleDateString('vi-VN'));

    // Chữ ký Bên B
    const signature = rawOrder.contractSignature || cData.contractSignature || rawOrder.contract?.contractSignature || customerName;

    return {
      orderCode,
      contractCode,
      customerName,
      customerPhone,
      customerCccd,
      shippingAddress,
      startDate,
      endDate,
      rentalDays,
      items,
      totalRentPrice,
      totalDeposit,
      totalValue,
      status,
      statusLabel,
      statusClass,
      signedDateStr,
      signature
    };
  }, [order, contractData, orderId]);

  // Xử lý in / xuất PDF chuẩn A4
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Stylesheet tối ưu cho in ấn và xuất PDF chuẩn A4 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #unibridal-haute-couture-contract-modal,
          #unibridal-haute-couture-contract-modal * {
            visibility: visible !important;
          }
          #unibridal-haute-couture-contract-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px 24px !important;
            background: white !important;
            color: #2C2523 !important;
            box-shadow: none !important;
            border: none !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Dialog */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-transparent animate-in fade-in duration-200 cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-[0_25px_70px_rgba(44,37,35,0.35)] border border-[#DFD3C8] overflow-hidden cursor-default"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-[#EFE5E1] flex items-center justify-between bg-white no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-[#C5A880] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#733F49]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2C2523]">
                  Hợp Đồng Thuê Lễ Phục Cưới Cao Cấp (Haute Couture)
                </h3>
                <p className="text-xs text-[#8C7A6B]">
                  Mã mẫu: <span className="font-mono font-bold text-[#733F49]">TPL-HC-01</span> • Mã HĐ:{' '}
                  <span className="font-mono font-bold text-[#733F49]">{effectiveData.contractCode}</span> • Trạng thái:{' '}
                  <span className={effectiveData.statusClass}>{effectiveData.statusLabel}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-[#E0D5CE] text-[#8C7A6B] hover:text-[#2C2523] flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div
            id="unibridal-haute-couture-contract-modal"
            className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[#2C2523] bg-white no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {loading ? (
              <div className="py-20 text-center space-y-3 font-sans">
                <div className="w-10 h-10 border-3 border-[#733F49] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-[#7A6A6B]">Đang tải dữ liệu hợp đồng điện tử...</p>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-sans space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertCircle size={18} />
                  <span>Không thể tải hợp đồng</span>
                </div>
                <p className="text-xs text-rose-700">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-3 px-4 py-1.5 text-xs font-semibold bg-white border border-rose-300 rounded-lg text-rose-800 hover:bg-rose-100 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <>
                {/* Quốc hiệu và Tiêu ngữ */}
                <div className="text-center space-y-1 font-sans border-b border-[#E8DFD8] pb-5">
                  <p className="text-xs uppercase font-bold tracking-widest text-[#594B43]">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p className="text-xs italic text-[#7C695D]">Độc lập – Tự do – Hạnh phúc</p>
                  <div className="w-24 h-0.5 bg-[#C5A880] mx-auto my-3" />
                  <h2 className="text-lg sm:text-xl font-bold font-serif text-[#2C2523] uppercase mt-2">
                    HỢP ĐỒNG THUÊ LỄ PHỤC CƯỚI CAO CẤP (HAUTE COUTURE)
                  </h2>
                  <p className="text-xs font-mono text-[#8C7A6B]">
                    Số: HDDT/TPL-HC-01/{effectiveData.orderCode} • Mã HĐ: {effectiveData.contractCode}
                  </p>
                  <p className="text-[11px] text-[#847374] italic mt-0.5 font-sans">
                    Ngày lập hợp đồng: {effectiveData.signedDateStr}
                  </p>
                </div>

                {/* Thông tin 2 bên ký kết hợp đồng */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans border border-[#EFE5E1] p-5 rounded-2xl bg-white shadow-2xs">
                  {/* Bên A: Showroom Atelier UniBridal */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[#733F49] font-bold text-[13px] uppercase pb-1.5 border-b border-[#F0E5DC]">
                      <Building2 size={16} />
                      <span>BÊN CHO THUÊ (BÊN A)</span>
                    </div>
                    <p>
                      <strong>Đơn vị:</strong> CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE
                    </p>
                    <p>
                      <strong>Đại diện:</strong> Ông Kim Xuân Hiếu — Tổng Giám Đốc Atelier
                    </p>
                    <p>
                      <strong>Địa chỉ Showroom:</strong> 186 Nam Kỳ Khởi Nghĩa, P. Võ Thị Sáu, Q.3, TP.HCM
                    </p>
                    <p>
                      <strong>Hotline CSKH:</strong> 1900 888 2026 · <strong>Mã số thuế:</strong> 0317892026
                    </p>
                  </div>

                  {/* Bên B: Khách hàng thuê lễ phục */}
                  <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-[#F0E5DC] pt-3 md:pt-0 md:pl-4">
                    <div className="flex items-center gap-1.5 text-[#733F49] font-bold text-[13px] uppercase pb-1.5 border-b border-[#F0E5DC]">
                      <User size={16} />
                      <span>BÊN THUÊ LỄ PHỤC (BÊN B)</span>
                    </div>
                    <p>
                      <strong>Họ và tên khách hàng:</strong>{' '}
                      <span className="font-bold text-[#733F49] text-[13px]">{effectiveData.customerName}</span>
                    </p>
                    <p>
                      <strong>Số điện thoại:</strong> {effectiveData.customerPhone}
                    </p>
                    <p>
                      <strong>Số CCCD / Hộ chiếu:</strong> {effectiveData.customerCccd}
                    </p>
                    <p>
                      <strong>Địa chỉ bàn giao:</strong> {effectiveData.shippingAddress}
                    </p>
                  </div>
                </div>

                {/* Danh mục trang phục thuê và Thời gian thuê */}
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#733F49] uppercase mb-2 flex items-center gap-2">
                    <span>I. DANH MỤC TRANG PHỤC THUÊ VÀ THỜI GIAN SỬ DỤNG</span>
                  </h4>
                  <div className="overflow-x-auto border border-[#EFE5E1] rounded-2xl bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead className="bg-[#FAF5F2] border-b border-[#EFE5E1] text-[#7A6A6B] font-bold">
                        <tr>
                          <th className="p-3">Tác Phẩm Lễ Phục</th>
                          <th className="p-3">Mã Số</th>
                          <th className="p-3">Kích Cỡ</th>
                          <th className="p-3 text-center">Thời Gian Thuê</th>
                          <th className="p-3 text-right">Tiền Thuê</th>
                          <th className="p-3 text-right">Tiền Cọc Bảo Lãnh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F6EEEB]">
                        {effectiveData.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-[#FCFAF8]">
                            <td className="p-3 font-semibold text-[#2C2523]">{it.name}</td>
                            <td className="p-3 font-mono font-bold text-[#733F49]">{it.code}</td>
                            <td className="p-3 font-bold text-[#87565C]">
                              {it.size}
                              {it.color && <span className="block text-[11px] font-normal text-[#6B5C5D] mt-0.5">Màu: {it.color}</span>}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className="block text-[11.5px] text-[#8C4654] font-semibold mb-0.5">
                                {effectiveData.rentalDays} ngày
                              </span>
                              <div className="text-xs">
                                <span className="font-semibold text-emerald-800">{formatShortDate(it.startDate || effectiveData.startDate)}</span>
                                <span className="text-[#A39192] mx-1">→</span>
                                <span className="font-semibold text-[#87565C]">{formatShortDate(it.endDate || effectiveData.endDate)}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-800">
                              {formatCurrencyVND(it.rentPrice)}
                            </td>
                            <td className="p-3 text-right font-bold text-[#733F49]">
                              {formatCurrencyVND(it.depositAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#FAF0EC]/60 border-t border-[#E8DFD8] font-bold text-xs">
                        <tr>
                          <td colSpan={4} className="p-3 text-right font-serif font-bold text-[#733F49]">
                            Tổng thanh toán & Ký quỹ cam kết:
                          </td>
                          <td colSpan={2} className="p-3 text-right font-mono font-bold text-base text-[#733F49]">
                            {formatCurrencyVND(effectiveData.totalValue)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Các điều khoản pháp lý tiêu chuẩn */}
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#733F49] uppercase mb-2">
                    II. CÁC ĐIỀU KHOẢN PHÁP LÝ VÀ QUY CHẾ THUÊ TRANG PHỤC HAUTE COUTURE
                  </h4>
                  <div className="space-y-3 font-sans text-xs">
                    {STANDARD_HAUTE_COUTURE_CLAUSES.map((clause, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-2xs">
                        <h5 className="font-bold text-sm text-[#2C2523] mb-1.5 font-serif">{clause.title}</h5>
                        <p className="text-[#69584D] leading-relaxed text-xs whitespace-pre-line">{clause.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Phụ lục 1: Bảng giá đền bù thiệt hại niêm yết đối chiếu */}
                  <div className="mt-4 pt-4 border-t border-[#EFE5E1]">
                    <h4 className="font-serif font-bold text-sm text-[#733F49] uppercase mb-2 flex items-center justify-between">
                      <span>PHỤ LỤC 1: BẢNG GIÁ ĐỀN BÙ THIỆT HẠI NIÊM YẾT ĐỐI CHIẾU</span>
                      <span className="text-[10px] font-sans font-normal text-[#8C7D7E] italic lowercase">
                        (Áp dụng chuẩn hóa theo Điều 5 Hợp đồng)
                      </span>
                    </h4>
                    <div className="overflow-x-auto border border-[#EFE5E1] rounded-2xl bg-white shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead className="bg-[#FAF5F2] border-b border-[#EFE5E1] text-[#7A6A6B] font-bold">
                          <tr>
                            <th className="p-2.5 w-[25%]">Nhóm Lỗi Hư Hại</th>
                            <th className="p-2.5 w-[45%]">Mô Tả Hiện Trạng</th>
                            <th className="p-2.5 w-[30%] text-right">Mức Phí Bồi Thường Cố Định</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F6EEEB] text-[11.5px]">
                          {DAMAGE_PRICE_CATALOG.map((row) => (
                            <tr key={row.id} className="hover:bg-[#FCFAF8]">
                              <td className="p-2.5 font-bold text-[#2C2523]">{row.name}</td>
                              <td className="p-2.5 text-[#5C4D4D]">{row.description}</td>
                              <td className="p-2.5 text-right font-bold" style={{ color: row.color }}>
                                {row.feeLabel}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Khối chữ ký điện tử hai bên */}
                <div className="pt-6 border-t border-[#EFE5E1] grid grid-cols-2 gap-6 text-center text-xs font-sans">
                  {/* Chữ ký Bên A */}
                  <div className="p-4 rounded-2xl border border-[#EEDECF] bg-white flex flex-col items-center justify-between min-h-[190px] shadow-2xs">
                    <div>
                      <p className="font-bold uppercase text-[#733F49] tracking-wider text-[11px]">
                        ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
                      </p>
                      <p className="text-[#847374] text-[10px] italic mt-0.5">
                        CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE
                      </p>
                    </div>

                    <div className="my-2 flex flex-col items-center">
                      <img
                        src={HIEU_SIGNATURE_BASE64}
                        alt="Chữ ký Kim Xuân Hiếu"
                        className="h-16 w-auto object-contain select-none"
                      />
                      <div className="mt-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[9px] font-bold inline-flex items-center gap-1">
                        <ShieldCheck size={11} /> VERIFIED BY UNIBRIDAL CA
                      </div>
                    </div>

                    <div>
                      <strong className="block text-[#2C2523] text-[12px]">Ông Kim Xuân Hiếu</strong>
                      <span className="text-[10px] text-[#847374]">Tổng Giám Đốc Atelier UniBridal</span>
                    </div>
                  </div>

                  {/* Chữ ký Bên B */}
                  <div className="p-4 rounded-2xl border border-[#EEDECF] bg-white flex flex-col items-center justify-between min-h-[190px] shadow-2xs">
                    <div>
                      <p className="font-bold uppercase text-[#733F49] tracking-wider text-[11px]">
                        BÊN THUÊ LỄ PHỤC (BÊN B)
                      </p>
                      <p className="text-[#847374] text-[10px] italic mt-0.5">
                        XÁC NHẬN BẰNG CHỮ KÝ ĐIỆN TỬ
                      </p>
                    </div>

                    <div className="my-2 flex flex-col items-center justify-center min-h-[64px]">
                      {effectiveData.signature && String(effectiveData.signature).startsWith('data:image') ? (
                        <img
                          src={effectiveData.signature}
                          alt="Chữ ký khách hàng"
                          className="max-h-16 w-auto object-contain select-none"
                        />
                      ) : (
                        <div className="font-serif italic text-xl sm:text-2xl text-[#733F49] font-bold tracking-wider px-4 py-1 border-b-2 border-[#733F49]/40 select-none">
                          {effectiveData.signature || effectiveData.customerName}
                        </div>
                      )}
                      <div className="mt-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[9px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 size={11} /> E-SIGNED BY {String(effectiveData.signature || effectiveData.customerName).toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <strong className="block text-[#2C2523] text-[12px]">{effectiveData.customerName}</strong>
                      <span className="text-[10px] text-[#847374]">Ngày ký: {effectiveData.signedDateStr}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-white border-t border-[#EFE5E1] flex items-center justify-between no-print">
            <button
              onClick={handlePrint}
              disabled={loading || Boolean(error)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#733F49] hover:bg-[#FAF0EC] bg-white rounded-xl border border-[#E8DFD8] transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Mở hộp thoại in ấn / lưu bản PDF chuẩn khổ A4"
            >
              <ExternalLink className="w-4 h-4" />
              Mở Bản In PDF (Chuẩn A4)
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 text-xs font-bold text-white bg-[#733F49] hover:bg-[#5C323A] rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
