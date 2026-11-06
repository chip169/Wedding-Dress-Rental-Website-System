import { useEffect, useState } from 'react';
import { Button, Modal } from 'antd';
import {
  FileSignature,
  ExternalLink,
  FileText,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Building2,
  User,
  Phone,
  CreditCard,
  MapPin,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { getOrder } from '../../services/customerOrderService';
import { getSignedContract } from '../../utils/signedContract';
import { formatCurrencyVND } from '../../utils/formatCurrency';
import { formatShortDate } from '../../utils/formatDate';
import { HIEU_SIGNATURE_BASE64 } from '../../assets/images/signatureHieuBase64';

export default function SignedContractModal({ orderId, order: propOrder, onClose }) {
  const [order, setOrder] = useState(propOrder || null);
  const [loading, setLoading] = useState(!propOrder);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setError('');
    setOrder(propOrder || null);
    if (propOrder?.contract || !orderId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getOrder(orderId)
      .then((value) => {
        if (active) setOrder(value);
      })
      .catch((issue) => {
        if (active) setError(issue.message || 'Không tải được hợp đồng. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId, propOrder, retry]);

  const saved = getSignedContract(order);

  // Xử lý in hợp đồng hoặc xuất sang file PDF trình duyệt
  const handlePrint = () => {
    window.print();
  };

  const customerName = order?.contract?.customerName || order?.customerName || order?.brideName || 'Cô Dâu UniBridal';
  const customerPhone = order?.contract?.phone || order?.customerPhone || order?.phone || '0908 123 888';
  const customerCccd = order?.contract?.idCard || order?.customerCccd || order?.cccd || order?.idCard || 'Đã xác thực tài khoản';
  const address = order?.shippingAddress;
  const shippingAddress = (typeof address === 'string' ? address
    : ['street', 'ward', 'district', 'city'].map((key) => address?.[key]).filter(Boolean).join(', '))
    || 'Nhận trực tiếp tại Showroom UniBridal (186 Nam Kỳ Khởi Nghĩa, Q.3, TP.HCM)';
  const contractCode = saved.code || order?.contractCode || order?.id || `HĐ-${order?.orderCode || orderId}`;
  const signedDateStr = saved.signedAt ? formatShortDate(saved.signedAt) : (order?.createdAt ? formatShortDate(order.createdAt) : '2026-11-01');

  // Danh sách váy thuê
  const items = Array.isArray(order?.items) && order.items.length > 0
    ? order.items
    : [
      {
        name: order?.dress || order?.dressName || 'Lễ phục cưới Haute Couture',
        size: order?.size || order?.dressSize || 'S',
        code: order?.code || order?.dressCode || 'UB-HC-2026',
        rentPrice: order?.totalRentPrice || order?.rentalPrice || order?.amount || 0,
        depositAmount: order?.totalDeposit || order?.depositAmount || order?.deposit || 0,
      },
    ];

  // Các điều khoản chuẩn của hợp đồng
  const contractClauses = saved.clauses && saved.clauses.length > 0
    ? saved.clauses
    : [
      {
        title: 'ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & TIÊU CHUẨN LỄ PHỤC CƯỚI',
        content: '1.1. Bên A đồng ý cho Bên B thuê tác phẩm váy cưới độc bản thiết kế mang tên theo thông tin đơn thuê chi tiết, kích cỡ may đo chuẩn mực theo yêu cầu của Bên B.\n1.2. Tiêu chuẩn bàn giao: Tác phẩm đạt chuẩn Haute Couture, khung xương nẹp corset siết eo công nghệ Pháp, được giặt sấy tiệt trùng sinh học, ủi phẳng phiu và đặt trong Vali VIP Courier bảo quản chống bụi nhiệt trước giờ trao nhận.\n1.3. Tinh chỉnh may đo: Bên A cung cấp dịch vụ tinh chỉnh nới/siết phom theo đúng thông số số đo chuẩn (Chiều cao, Cân nặng, Vòng eo) đã được ghi nhận của Bên B.',
      },
      {
        title: 'ĐIỀU 2: THỜI HẠN THUÊ, PHƯƠNG THỨC GIAO NHẬN & QUY TRÌNH THU HỒI',
        content: '2.1. Tổng thời gian thuê: Được xác định theo gói ngày Bên B lựa chọn ghi rõ trên đơn thuê.\n2.2. Thời điểm nhận váy: Từ 09:00 ngày bắt đầu thuê tại Showroom UniBridal hoặc bàn giao tận nơi bằng Vali VIP Courier.\n2.3. Phương thức hoàn trả & thu hồi: Trước 20:00 ngày kết thúc thời hạn thuê. Chuyên viên của Bên A chủ động liên hệ hẹn giờ và trực tiếp đến tận địa chỉ của Bên B thu hồi lễ phục trong vali bảo quản niêm phong, thực hiện kiểm định sơ bộ hiện trạng sản phẩm.\n2.4. Hai bên thực hiện ký Biên bản kiểm định bàn giao và thu hồi để ghi nhận hiện trạng đính kết ren, hạt cườm và kết cấu váy tại thời điểm giao và nhận lại.',
      },
      {
        title: 'ĐIỀU 3: GIÁ THUÊ & PHƯƠNG THỨC THANH TOÁN',
        content: '3.1. Tổng giá trị hợp đồng thuê trọn gói đã bao gồm VAT, dịch vụ giặt hấp khử khuẩn và phí tinh chỉnh phom váy.\n3.2. Tiền đặt cọc giữ lịch độc quyền (50% giá trị hợp đồng): Bên B thanh toán ngay khi ký hợp đồng thông qua cổng chuyển khoản VietQR Napas 24/7 hoặc thẻ ngân hàng.\n3.3. Số tiền thuê còn lại sẽ được Bên B thanh toán dứt điểm tại thời điểm nhận bàn giao lễ phục.',
      },
      {
        title: 'ĐIỀU 4: TIỀN ĐẶT CỌC BẢO LÃNH & CƠ CHẾ HOÀN CỌC',
        content: '4.1. Tiền đặt cọc bảo lãnh trách nhiệm được Bên B nộp để đảm bảo giữ gìn trang phục cưới nguyên trạng.\n4.2. Số tiền cọc sẽ được hoàn trả 100% cho Bên B trong vòng 02 giờ làm việc qua hình thức chuyển khoản trực tiếp sau khi hoàn tất Biên bản kiểm định thu hồi hiện trạng không phát sinh hư hỏng cấu trúc.\n4.3. Trường hợp phát sinh vết bẩn nhẹ thông thường tẩy được bằng giặt hấp sinh học, Bên A cam kết MIỄN PHÍ và không trừ tiền cọc.',
      },
      {
        title: 'ĐIỀU 5: TRÁCH NHIỆM BẢO QUẢN & BỒI THƯỜNG HƯ TỔN',
        content: '5.1. Bên B cam kết giữ gìn trang phục cẩn trọng, không tự ý cắt may, ủi nhiệt độ cao hoặc tẩy hóa chất.\n5.2. Trường hợp làm rách ren thủng lớn, cháy vải hoặc đứt gãy gọng siết eo corsetry, Bên B đồng ý chịu chi phí phục chế nguyên trạng theo bảng giá niêm yết tại Atelier hoặc trừ trực tiếp vào quỹ cọc bảo lãnh.',
      },
      {
        title: 'ĐIỀU 6: HIỆU LỰC HỢP ĐỒNG ĐIỆN TỬ',
        content: '6.1. Hợp đồng điện tử này được khởi tạo và ký kết trực tuyến hợp pháp, có giá trị pháp lý ràng buộc tương đương văn bản ký tay theo Luật Giao dịch điện tử Việt Nam.\n6.2. Hợp đồng có hiệu lực kể từ thời điểm Bên B ký điện tử và thanh toán cọc thành công cho đến khi hai bên hoàn tất biên bản bàn giao, thu hồi và thanh quyết toán cọc.',
      },
    ];
  const canPrint = !loading && !error && !saved.pendingSignature && contractClauses.length > 0;

  return (
    <>
      {/* CSS In Ấn / Xuất File PDF */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #unibridal-signed-contract-print, #unibridal-signed-contract-print * {
            visibility: visible !important;
          }
          #unibridal-signed-contract-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: white !important;
            color: #2C2523 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Modal
        open
        title={
          <div className="flex items-center justify-between pr-8 no-print">
            <span className="flex items-center gap-2 text-[#733F49] font-playfair font-semibold text-lg">
              <FileSignature size={20} className="text-[#874e57]" />
              Hợp Đồng Điện Tử #{contractCode}
            </span>
            <Button
              type="primary"
              onClick={handlePrint}
              disabled={!canPrint}
              icon={<Printer size={15} />}
              className="bg-[#733F49]! hover:bg-[#5C323A]! text-white! font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 shadow-xs"
            >
              In / Xuất File PDF
            </Button>
          </div>
        }
        width={920}
        onCancel={onClose}
        footer={
          <div className="flex items-center justify-between no-print w-full">
            <span className="text-[11.5px] text-[#7A6A6B]">
              ✓ Văn bản có giá trị pháp lý theo Luật Giao dịch điện tử Việt Nam.
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrint}
                disabled={!canPrint}
                icon={<Printer size={15} />}
                className="border-[#D9C4BD] text-[#733F49] hover:bg-[#FAF0EC]"
              >
                In / Xuất File PDF
              </Button>
              <Button onClick={onClose} className="rounded-lg">
                Đóng
              </Button>
            </div>
          </div>
        }
      >
        <div className="max-h-[72vh] overflow-y-auto py-2 pr-1">
          {loading ? (
            <p role="status" className="py-16 text-center text-stone-500">
              Đang tải hợp đồng điện tử...
            </p>
          ) : error ? (
            <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-800">
              <p>{error}</p>
              <Button className="mt-3" onClick={() => setRetry((value) => value + 1)}>
                Thử lại
              </Button>
            </div>
          ) : saved.pendingSignature || !saved.hasDocument ? (
            <p role="status" className="rounded-xl bg-amber-50 p-5 text-sm text-amber-900">
              {saved.pendingSignature ? 'Hợp đồng đang chờ ký, chưa có bản đã ký để xem.' : 'Đơn này chưa có file hoặc nội dung hợp đồng đã ký được lưu. Vui lòng liên hệ showroom.'}
            </p>
          ) : (
            <div id="unibridal-signed-contract-print" className="space-y-6 text-[#2C2523] font-sans">
              {saved.fileUrl && <a href={saved.fileUrl} target="_blank" rel="noopener noreferrer" className="no-print inline-flex items-center gap-2 text-sm font-semibold text-[#733F49]"><ExternalLink size={16} /> Mở file hợp đồng đã lưu</a>}
              {/* Quốc hiệu tiêu ngữ */}
              <div className="text-center pb-5 border-b border-[#EFE5E1]">
                <p className="font-bold text-xs uppercase tracking-widest text-[#594B49]">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="text-xs italic text-[#7A6A6B] mt-0.5">
                  Độc lập – Tự do – Hạnh phúc
                </p>
                <div className="w-24 h-0.5 bg-[#874e57] mx-auto my-2.5" />
                <h1 className="font-playfair text-xl sm:text-2xl font-bold text-[#733F49] uppercase tracking-wide mt-2">
                  HỢP ĐỒNG CHO THUÊ LỄ PHỤC CƯỚI CAO CẤP
                </h1>
                <p className="text-xs text-[#7A6A6B] mt-1 font-mono">
                  Số: <strong>{contractCode}</strong> / HĐ-UNIBRIDAL · Đơn thuê: <strong>#{order?.orderCode || orderId}</strong>
                </p>
                <p className="text-[11px] text-[#847374] italic mt-0.5">
                  Ngày ký được lưu: {signedDateStr}
                </p>
              </div>

              {/* Thông tin 2 bên ký kết */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border border-[#F0E5DC] p-4.5 rounded-2xl bg-[#FCF9F6]">
                {/* Bên A */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#733F49] font-bold text-[13px] uppercase pb-1 border-b border-[#F0E5DC]">
                    <Building2 size={15} />
                    <span>BÊN CHO THUÊ (BÊN A)</span>
                  </div>
                  <p><strong>Đơn vị:</strong> CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE</p>
                  <p><strong>Đại diện:</strong> Ông Kim Xuân Hiếu — Tổng Giám Đốc Atelier</p>
                  <p><strong>Địa chỉ:</strong> 186 Nam Kỳ Khởi Nghĩa, P. Võ Thị Sáu, Q.3, TP.HCM</p>
                  <p><strong>Hotline:</strong> 1900 888 2026 · <strong>Mã số thuế:</strong> 0317892026</p>
                </div>

                {/* Bên B */}
                <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-[#F0E5DC] pt-3 md:pt-0 md:pl-4">
                  <div className="flex items-center gap-1.5 text-[#733F49] font-bold text-[13px] uppercase pb-1 border-b border-[#F0E5DC]">
                    <User size={15} />
                    <span>BÊN THUÊ (BÊN B)</span>
                  </div>
                  <p><strong>Họ và tên:</strong> <span className="font-bold text-[#733F49]">{customerName}</span></p>
                  <p><strong>Số điện thoại:</strong> {customerPhone}</p>
                  <p><strong>Số CCCD/CMND:</strong> {customerCccd}</p>
                  <p><strong>Địa chỉ bàn giao:</strong> {shippingAddress}</p>
                </div>
              </div>

              {/* Bảng danh mục lễ phục thuê */}
              <div>
                <h3 className="font-playfair text-base font-bold text-[#733F49] mb-2.5">
                  I. DANH MỤC TRANG PHỤC THUÊ &amp; THỜI GIAN SỬ DỤNG
                </h3>
                <div className="overflow-x-auto border border-[#EEDECF] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF5F2] border-b border-[#EEDECF] text-[#7A6A6B] font-bold">
                      <tr>
                        <th className="p-3">Tác Phẩm Lễ Phục</th>
                        <th className="p-3">Mã Số</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Ngày Nhận</th>
                        <th className="p-3">Ngày Hoàn Trả</th>
                        <th className="p-3 text-right">Tiền Thuê</th>
                        <th className="p-3 text-right">Tiền Cọc</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5EDE8]">
                      {items.map((it, idx) => (
                        <tr key={it._id || idx} className="hover:bg-[#FCFAF8]">
                          <td className="p-3 font-semibold text-[#2C2523]">{it.name}</td>
                          <td className="p-3 font-mono text-[#733F49]">{it.code || it.dressCode || '—'}</td>
                          <td className="p-3 font-bold text-[#87565C]">{it.size || 'Theo tư vấn'}</td>
                          <td className="p-3 font-semibold text-emerald-700">{formatShortDate(order?.rentalStartDate)}</td>
                          <td className="p-3 font-semibold text-[#87565C]">{formatShortDate(order?.rentalEndDate)}</td>
                          <td className="p-3 text-right font-semibold">{formatCurrencyVND(it.rentPrice)}</td>
                          <td className="p-3 text-right font-semibold text-[#733F49]">{formatCurrencyVND(it.depositAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#FAF5F2] border-t border-[#EEDECF] font-bold">
                      <tr>
                        <td colSpan={5} className="p-3 text-right uppercase text-[#7A6A6B]">Tổng Cộng Theo Đơn:</td>
                        <td className="p-3 text-right text-emerald-800">{formatCurrencyVND(order?.totalRentPrice || order?.amount)}</td>
                        <td className="p-3 text-right text-[#733F49]">{formatCurrencyVND(order?.totalDeposit || order?.deposit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Các điều khoản pháp lý */}
              <div>
                <h3 className="font-playfair text-base font-bold text-[#733F49] mb-3">
                  II. CÁC ĐIỀU KHOẢN PHÁP LÝ &amp; QUY CHẾ KÝ QUỸ
                </h3>
                <div className="space-y-3.5 text-xs text-[#4A3D3C] leading-relaxed">
                  {!contractClauses.length && <p>Vui lòng mở file hợp đồng đã lưu để xem nội dung đầy đủ.</p>}
                  {contractClauses.map((clause, idx) => (
                    <article key={clause.id || idx} className="p-3.5 rounded-xl border border-[#F0E5DC] bg-white">
                      <h4 className="font-bold text-[#733F49] text-[12.5px] mb-1.5">{clause.title}</h4>
                      <p className="whitespace-pre-wrap text-[#5C4D4A] m-0">{clause.content}</p>
                    </article>
                  ))}
                </div>
              </div>

              {/* Khối chữ ký điện tử hai bên */}
              <div className="pt-6 border-t border-[#EFE5E1] grid grid-cols-2 gap-8 text-center text-xs">
                {/* Chữ ký Bên A */}
                <div className="p-4 rounded-2xl border border-[#EEDECF] bg-[#FCF9F6] flex flex-col items-center justify-between min-h-[220px]">
                  <div>
                    <p className="font-bold uppercase text-[#733F49] tracking-wider text-[12px]">
                      ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
                    </p>
                    <p className="text-[#847374] text-[11px] italic mt-0.5">
                      Xác thực Chữ ký số &amp; Con dấu pháp nhân Atelier
                    </p>
                  </div>

                  <div className="my-2 flex flex-col items-center">
                    <img
                      src={HIEU_SIGNATURE_BASE64}
                      alt="Chữ ký Kim Xuân Hiếu"
                      className="h-20 w-auto object-contain select-none"
                    />
                    <div className="mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[10px] font-bold inline-flex items-center gap-1">
                      <ShieldCheck size={13} /> VERIFIED BY UNIBRIDAL CA
                    </div>
                  </div>

                  <div>
                    <strong className="block text-[#2C2523] text-[13px]">Ông Kim Xuân Hiếu</strong>
                    <span className="text-[11px] text-[#847374]">Tổng Giám Đốc Atelier UniBridal</span>
                  </div>
                </div>

                {/* Chữ ký Bên B */}
                <div className="p-4 rounded-2xl border border-[#EEDECF] bg-[#FCF9F6] flex flex-col items-center justify-between min-h-[220px]">
                  <div>
                    <p className="font-bold uppercase text-[#733F49] tracking-wider text-[12px]">
                      ĐẠI DIỆN BÊN THUÊ (BÊN B)
                    </p>
                    <p className="text-[#847374] text-[11px] italic mt-0.5">
                      Xác thực Chữ ký điện tử của Cô Dâu
                    </p>
                  </div>

                  <div className="my-2 flex flex-col items-center justify-center min-h-[80px]">
                    {saved.signature && (saved.signatureIsImage || saved.signature.startsWith('data:image')) ? (
                      <img
                        src={saved.signature}
                        alt="Chữ ký cô dâu"
                        className="max-h-20 w-auto object-contain select-none"
                      />
                    ) : saved.signature ? (
                      <div className="font-serif italic text-2xl text-[#733F49] font-bold tracking-wider px-4 py-2 border-b-2 border-[#733F49]/40">
                        {customerName}
                      </div>
                    ) : (
                      <p className="text-stone-500 text-sm">Chưa có chữ ký khách hàng được lưu.</p>
                    )}
                    {saved.signature && (
                      <div className="mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[10px] font-bold inline-flex items-center gap-1 max-w-full">
                        <CheckCircle2 size={13} className="shrink-0" />
                        <span className="truncate max-w-[200px]">
                          E-SIGNED BY {customerName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <strong className="block text-[#2C2523] text-[13px]">{customerName}</strong>
                    <span className="text-[11px] text-[#847374]">Ngày ký: {signedDateStr}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
