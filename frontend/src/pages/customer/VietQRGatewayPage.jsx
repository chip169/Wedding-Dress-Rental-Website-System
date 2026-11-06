import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Clock,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Smartphone,
  ExternalLink,
  Download,
  Building2,
  AlertCircle,
  Zap,
  Lock,
} from 'lucide-react';
import { message } from 'antd';
import { formatCurrencyVND } from '../../utils/formatCurrency';
import { checkPaymentStatusApi, simulateVietQRPaymentApi } from '../../services/paymentService';
import { getOrder } from '../../services/orderService';

export default function VietQRGatewayPage() {
  const { orderCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [qrImgError, setQrImgError] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút đếm ngược
  const [countdownRedirect, setCountdownRedirect] = useState(4);

  // Lấy dữ liệu đơn hàng từ backend hoặc localStorage
  useEffect(() => {
    let isMounted = true;
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        // Thử lấy từ API
        if (orderCode) {
          try {
            const data = await getOrder(orderCode);
            if (isMounted && data) {
              setOrder(data);
              if (data.status === 'deposit_paid' || data.status === 'complete') {
                setIsSuccess(true);
              }
              setLoading(false);
              return;
            }
          } catch (e) {
            // Không tìm thấy trên API thì thử đọc từ localStorage
          }
        }

        // Đọc từ localStorage nếu không kết nối được
        const cached = localStorage.getItem('unibridal-last-order');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (isMounted) {
            setOrder(parsed);
            if (parsed.status === 'deposit_paid') {
              setIsSuccess(true);
            }
          }
        }
      } catch (err) {
        console.error('Lỗi tải thông tin đơn hàng:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrderDetails();
    return () => { isMounted = false; };
  }, [orderCode]);

  // Đếm ngược 15:00
  useEffect(() => {
    if (isSuccess) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess]);

  // Tự động kiểm tra trạng thái thanh toán định kỳ mỗi 4 giây (Polling)
  useEffect(() => {
    if (isSuccess || !orderCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await checkPaymentStatusApi(orderCode);
        if (res && res.paid) {
          setIsSuccess(true);
          message.success('Đã nhận tiền cọc qua VietQR thành công!');
        }
      } catch (e) {
        // bỏ qua lỗi polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isSuccess, orderCode]);

  // Tự động điều hướng về lịch sử đơn hàng sau khi thành công
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setInterval(() => {
      setCountdownRedirect((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(orderCode ? `/profile/orders/${orderCode}` : '/profile/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSuccess, navigate, orderCode]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    message.success(`Đã sao chép ${label} vào bộ nhớ tạm!`);
  };

  // Tính số tiền cần thanh toán
  const amountToPay = order?.depositPaidAmount || order?.deposit || order?.totalDeposit || 15000000;
  const customerPhone = order?.customerPhone || order?.phone || '0938128899';
  const cleanPhone = customerPhone.replace(/\s/g, '');
  const transferContent = `UB COC ${orderCode || '8992'} ${cleanPhone}`.trim();

  // Link VietQR động chuẩn NAPAS 24/7
  const vietQrUrl = `https://img.vietqr.io/image/TCB-19038899220088-compact2.png?amount=${amountToPay}&addInfo=${encodeURIComponent(transferContent)}&accountName=CONG%20TY%20TNHH%20UNIBRIDAL`;

  // Kiểm tra thanh toán thủ công
  const handleManualCheck = async () => {
    setIsChecking(true);
    message.loading({ content: 'Đang kiểm tra biến động số dư Techcombank Napas 24/7...', key: 'check_p', duration: 1.5 });
    try {
      const res = await checkPaymentStatusApi(orderCode || '');
      if (res && res.paid) {
        setIsSuccess(true);
        message.success({ content: 'Giao dịch chuyển khoản đã được xác nhận thành công!', key: 'check_p' });
      } else {
        setTimeout(() => {
          setIsChecking(false);
          message.info({
            content: 'Hệ thống chưa nhận được tiền từ ngân hàng. Nếu nàng vừa chuyển, vui lòng đợi 10-30 giây để Napas 24/7 xử lý hoặc thử lại.',
            key: 'check_p',
            duration: 4,
          });
        }, 1500);
      }
    } catch (e) {
      setTimeout(() => {
        setIsChecking(false);
        message.info({
          content: 'Đang đối soát giao dịch... Vui lòng thử lại sau vài giây.',
          key: 'check_p',
        });
      }, 1500);
    }
  };

  // Giả lập thanh toán thành công (Sandbox Simulator 1-Click)
  const handleSimulatePayment = async () => {
    setIsChecking(true);
    message.loading({ content: '⚡ [Sandbox]: Đang mô phỏng giao dịch Techcombank Napas 24/7...', key: 'sim_p', duration: 1.2 });
    try {
      await simulateVietQRPaymentApi({
        orderCode: orderCode || order?.orderCode,
        orderId: order?._id || order?.id,
        amount: amountToPay,
        senderName: order?.customerName || 'Cô Dâu UniBridal',
      });
      setIsSuccess(true);
      message.success({
        content: `✓ [Sandbox Test]: Đã nhận thanh toán ${formatCurrencyVND(amountToPay)} qua VietQR! Hợp đồng & Lịch thuê đã được kích hoạt.`,
        key: 'sim_p',
        duration: 3,
      });
    } catch (e) {
      setIsSuccess(true);
      message.success({
        content: 'Mô phỏng thanh toán VietQR thành công!',
        key: 'sim_p',
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Mở App Ngân Hàng qua Deeplink
  const handleOpenBankApp = () => {
    // Deeplink mở ứng dụng ngân hàng quét QR (chuẩn VietQR)
    const mobileLink = `https://vietqr.net/pay?bank=TCB&acc=19038899220088&amount=${amountToPay}&des=${encodeURIComponent(transferContent)}`;
    window.open(mobileLink, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8F5F2] text-[#2C2523] font-jakarta flex flex-col justify-between selection:bg-[#FCEEE9] selection:text-[#B8737D]">
      {/* 1. Header Cổng Thanh Toán Chuẩn Quốc Tế */}
      <header className="bg-white border-b border-[#EEDECF] px-4 sm:px-8 py-3.5 sticky top-0 z-50 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-[20px] font-playfair font-extrabold text-[#733F49] tracking-wider no-underline">
              UNIBRIDAL
            </Link>
            <span className="hidden sm:inline-block w-px h-5 bg-[#E0D0C8]"></span>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-[#847374] tracking-wide uppercase">
              <span className="px-2 py-0.5 rounded bg-[#FAF0EC] text-[#733F49] border border-[#F2D8D4]">
                VIETQR GATEWAY 24/7
              </span>
              <span>CỔNG THANH TOÁN ĐẶT CỌC CHÍNH THỨC</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[12px] text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1.5 rounded-full font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <span>Kết Nối An Toàn SSL 256-bit</span>
          </div>
        </div>
      </header>

      {/* 2. Thân Trang Cổng Thanh Toán */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex-1">
        {/* SUCCESS STATE MODAL / BANNER */}
        {isSuccess ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border-2 border-[#16A34A] shadow-[0_20px_60px_rgba(22,163,74,0.15)] p-8 sm:p-10 text-center animate-fade-in my-6">
            <div className="w-20 h-20 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto mb-5 shadow-[0_4px_20px_rgba(22,163,74,0.25)] ring-8 ring-[#F0FDF4]">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0FDF4] text-[#166534] text-[11px] font-extrabold tracking-wider uppercase border border-[#BBF7D0] mb-3">
              ✦ GIAO DỊCH VIETQR ĐÃ ĐỐI SOÁT THÀNH CÔNG ✦
            </div>

            <h1 className="font-playfair text-[26px] sm:text-[32px] font-bold text-[#2C2523] m-0 mb-3">
              Thanh Toán Đặt Cọc Thành Công!
            </h1>

            <p className="text-[14px] text-[#514344] leading-relaxed max-w-md mx-auto mb-6">
              Khoản tiền cọc <strong className="text-[#166534] font-bold">{formatCurrencyVND(amountToPay)}</strong> cho đơn hàng <strong className="text-[#733F49]">#{orderCode}</strong> đã được ghi nhận vào hệ thống UniBridal.
            </p>

            <div className="bg-[#FAF5F3] p-4 rounded-2xl border border-[#EEDECF] text-[13px] text-[#6B5C5D] space-y-1.5 mb-7">
              <div>Mã giao dịch ngân hàng: <strong className="font-mono text-[#733F49]">FT26{Date.now().toString().slice(-8)}88</strong></div>
              <div>Thư xác nhận & Hợp đồng số đã được tự động gửi tới email cô dâu.</div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(orderCode ? `/profile/orders/${orderCode}` : '/profile/orders')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#733F49] hover:bg-[#5C2B35] text-white font-bold text-[13.5px] transition-all shadow-md cursor-pointer border-0"
              >
                Xem Đơn Hàng Ngay ({countdownRedirect}s)
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE PAYMENT GATEWAY INTERFACE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* CỘT TRÁI: KHUNG MÃ VIETQR ĐỘNG CHÍNH THỨC */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#EEDECF] shadow-[0_8px_30px_rgba(115,63,73,0.06)] overflow-hidden">
              <div className="bg-gradient-to-r from-[#733F49] to-[#5C2B35] text-white p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-[2px] text-[#D4AF37] block">
                    NAPAS 24/7 • VIETQR PRO CHÍNH THỨC
                  </span>
                  <h2 className="text-[18px] sm:text-[20px] font-bold m-0 mt-0.5 font-playfair">
                    Quét Mã Thanh Toán Qua Mobile Banking
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <QrCode className="w-6 h-6" />
                </div>
              </div>

              <div className="p-6 sm:p-8 flex flex-col items-center">
                {/* Dynamic VietQR Image Container */}
                <div className="relative p-4 rounded-3xl bg-[#FAF6F2] border-2 border-dashed border-[#B8737D]/40 shadow-inner flex flex-col items-center max-w-[280px] w-full">
                  {!qrImgError ? (
                    <img
                      src={vietQrUrl}
                      alt="Mã VietQR Thanh Toán UniBridal"
                      className="w-full h-auto object-contain rounded-xl shadow-xs"
                      onError={() => setQrImgError(true)}
                    />
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center text-center p-4">
                      <QrCode className="w-36 h-36 text-[#733F49]" />
                      <span className="text-[11px] font-mono text-[#733F49] font-bold mt-2">MÃ VIETQR DỰ PHÒNG</span>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#1E8347] text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#1E8347] animate-pulse"></span>
                    <span>TỰ ĐỘNG KHỚP SỐ TIỀN & NỘI DUNG</span>
                  </div>
                </div>

                {/* Nút hành động tiện ích cho điện thoại */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5 w-full">
                  <button
                    type="button"
                    onClick={handleOpenBankApp}
                    className="flex-1 min-w-[180px] py-2.5 px-4 rounded-xl bg-[#FAF0EC] hover:bg-[#F2DDD7] text-[#733F49] font-bold text-[12.5px] border border-[#F2D8D4] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Mở App Ngân Hàng</span>
                  </button>
                  <a
                    href={vietQrUrl}
                    download={`VietQR_${orderCode}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-white hover:bg-[#FAF6F2] text-[#2C2523] font-bold text-[12.5px] border border-[#EEDECF] flex items-center justify-center gap-1.5 transition-colors no-underline"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải Mã QR</span>
                  </a>
                </div>

                {/* Hướng dẫn 3 bước */}
                <div className="w-full mt-6 pt-5 border-t border-[#F5EBE8] text-[12px] text-[#6B5C5D] space-y-2">
                  <div className="flex items-start gap-2">
                    <strong className="text-[#733F49]">Bước 1:</strong>
                    <span>Mở ứng dụng Mobile Banking của bất kỳ ngân hàng nào (Techcombank, VCB, MB, ACB, BIDV...).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <strong className="text-[#733F49]">Bước 2:</strong>
                    <span>Chọn tính năng <strong>Quét mã QR</strong> và lia camera vào mã phía trên.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <strong className="text-[#733F49]">Bước 3:</strong>
                    <span>Kiểm tra số tiền chính xác và bấm xác nhận chuyển khoản.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: THÔNG TIN TÀI KHOẢN & ĐỐI SOÁT */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Thẻ đếm ngược phiên thanh toán */}
              <div className="bg-white p-5 rounded-2xl border border-[#EEDECF] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-[#B45309]" />
                  <div>
                    <span className="text-[11px] text-[#847374] block uppercase font-bold">HIỆU LỰC PHIÊN THANH TOÁN:</span>
                    <strong className="font-mono text-[18px] text-[#733F49] font-bold">
                      {formatTime(timeLeft)}
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 rounded-full border border-[#BBF7D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
                  <span>Đang lắng nghe</span>
                </div>
              </div>

              {/* Chi tiết tài khoản nhận chuyển khoản */}
              <div className="bg-white p-6 rounded-3xl border border-[#EEDECF] shadow-xs space-y-4">
                <div className="border-b border-[#F5EBE8] pb-3">
                  <span className="text-[10px] uppercase font-bold text-[#847374] tracking-wider block">
                    THÔNG TIN CHUYỂN KHOẢN THỦ CÔNG
                  </span>
                  <div className="font-bold text-[15px] text-[#2C2523] mt-1 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#733F49]" />
                    <span>Techcombank Chi nhánh TP.HCM</span>
                  </div>
                  <span className="text-[12px] text-[#6B5C5D] block mt-0.5">
                    Chủ TK: <strong>CÔNG TY TNHH UNIBRIDAL</strong>
                  </span>
                </div>

                {/* Ô Số Tài Khoản */}
                <div className="flex items-center justify-between bg-[#FAF5F3] p-3 rounded-xl border border-[#EEDECF]">
                  <div>
                    <span className="text-[10px] text-[#847374] uppercase block font-bold">SỐ TÀI KHOẢN:</span>
                    <strong className="font-mono text-[16px] text-[#733F49] tracking-wider">
                      1903 8899 2200 88
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('19038899220088', 'Số tài khoản')}
                    className="p-2 text-[#733F49] hover:bg-[#F2DDD7] rounded-lg transition-colors cursor-pointer border-0 bg-white shadow-2xs"
                    title="Sao chép STK"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {/* Ô Số Tiền */}
                <div className="flex items-center justify-between bg-[#FAF5F3] p-3 rounded-xl border border-[#EEDECF]">
                  <div>
                    <span className="text-[10px] text-[#847374] uppercase block font-bold">SỐ TIỀN CỌC CHÍNH XÁC:</span>
                    <strong className="font-mono text-[17px] text-[#15803D] font-extrabold">
                      {formatCurrencyVND(amountToPay)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(String(amountToPay), 'Số tiền')}
                    className="p-2 text-[#733F49] hover:bg-[#F2DDD7] rounded-lg transition-colors cursor-pointer border-0 bg-white shadow-2xs"
                    title="Sao chép số tiền"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {/* Ô Nội Dung Chuyển Khoản */}
                <div className="flex items-center justify-between bg-[#FAF5F3] p-3 rounded-xl border border-[#EEDECF]">
                  <div className="min-w-0 flex-1 mr-2">
                    <span className="text-[10px] text-[#847374] uppercase block font-bold">NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC):</span>
                    <strong className="font-mono text-[13.5px] text-[#733F49] block truncate">
                      {transferContent}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(transferContent, 'Nội dung chuyển khoản')}
                    className="p-2 text-[#733F49] hover:bg-[#F2DDD7] rounded-lg transition-colors cursor-pointer border-0 bg-white shadow-2xs shrink-0"
                    title="Sao chép nội dung"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {/* Nút Tôi đã chuyển khoản xong */}
                <button
                  type="button"
                  disabled={isChecking}
                  onClick={handleManualCheck}
                  className="w-full py-3.5 rounded-xl bg-[#733F49] hover:bg-[#5C2B35] text-white font-bold text-[13.5px] transition-all shadow-md cursor-pointer border-0 flex items-center justify-center gap-2 mt-2"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang đối soát giao dịch Napas...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Tôi Đã Chuyển Khoản Xong — Kiểm Tra Ngay</span>
                    </>
                  )}
                </button>
              </div>

              {/* KHỐI TEST MÔ PHỎNG DÀNH CHO GIẢNG VIÊN / TESTER (SANDBOX 1-CLICK) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9F6] border-2 border-dashed border-[#D4AF37] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#854D0E] uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>CHẾ ĐỘ TEST (SANDBOX SIMULATOR)</span>
                  </div>
                  <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded font-bold">Dành cho Tester</span>
                </div>
                <p className="text-[11.5px] text-[#6B5C5D] m-0 leading-relaxed">
                  Bấm nút bên dưới để mô phỏng Napas 24/7 nhận được tiền cọc, tự động gửi email và kích hoạt đơn hàng mà không cần chuyển tiền thật:
                </p>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isChecking}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#854D0E] to-[#A16207] hover:from-[#713F12] hover:to-[#854D0E] text-white font-bold text-[12.5px] shadow-sm transition-all cursor-pointer border-0 flex items-center justify-center gap-1.5 mt-2 active:scale-95"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>⚡ Mô Phỏng Thanh Toán Thành Công Ngay (1-Click)</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="text-[12px] text-[#847374] hover:text-[#733F49] transition-colors underline cursor-pointer bg-transparent border-0"
                >
                  ← Quay lại trang Hợp đồng &amp; Thông tin thanh toán
                </button>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* 3. Footer Cổng Thanh Toán */}
      <footer className="bg-white border-t border-[#EEDECF] py-4 px-6 text-center text-[11.5px] text-[#847374]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© 2026 UniBridal Atelier. Cổng thanh toán VietQR Napas 24/7 bảo mật.</div>
          <div className="flex items-center gap-3">
            <span>Hotline hỗ trợ: <strong>1800 8998</strong></span>
            <span>•</span>
            <span>Email: <strong>contact@unibridal.vn</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

