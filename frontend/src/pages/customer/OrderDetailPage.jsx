import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Landmark,
  Shirt,
  CheckCircle2,
  Circle,
  Clock,
  Truck,
  RefreshCcw,
  Star,
  XCircle,
  FileSignature,
} from 'lucide-react';
import AccountLayout from '../../components/layout/AccountLayout';
import { formatVnd } from '../../services/orderService';
import { getOrder } from '../../services/customerOrderService';
import CustomerInspectionModal from '../../components/common/CustomerInspectionModal';
import SignedContractModal from '../../components/common/SignedContractModal';

/* ─────────────────────────────────────────────
   STATUS TIMELINE CONFIG
───────────────────────────────────────────── */
const TIMELINE_STEPS = [
  {
    key: 'deposit_paid',
    label: 'Đặt Cọc',
    subLabel: 'Đã xác nhận cọc',
    Icon: CheckCircle2,
  },
  {
    key: 'delivered',
    label: 'Đã Giao Váy',
    subLabel: 'Váy đã được bàn giao',
    Icon: Truck,
  },
  {
    key: 'renting',
    label: 'Đang Thuê',
    subLabel: 'Đang trong thời gian thuê',
    Icon: Clock,
  },
  {
    key: 'waiting_refund',
    label: 'Chờ Hoàn Cọc',
    subLabel: 'Đã kiểm định, chờ hoàn cọc',
    Icon: RefreshCcw,
  },
  {
    key: 'completed',
    label: 'Hoàn Tất',
    subLabel: 'Đơn hàng hoàn tất',
    Icon: CheckCircle2,
  },
];

// Map từ rawStatus → index bước đang active (0-based)
const STATUS_STEP_MAP = {
  pending_payment: -1, // chưa cọc
  deposit_paid: 0,
  preparing: 0, // Fallback đơn cũ: hiển thị ở bước Đặt Cọc
  delivered: 1,
  renting: 2,
  returned: 3,
  waiting_refund: 3,
  completed: 4,
  complete: 4,
};

/* ─────────────────────────────────────────────
   ORDER STATUS TIMELINE COMPONENT
───────────────────────────────────────────── */
function OrderStatusTimeline({ rawStatus }) {
  // Trạng thái huỷ: hiển thị banner thay timeline
  if (rawStatus === 'cancelled') {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
        <XCircle className="h-5 w-5 shrink-0 text-red-500" />
        <div>
          <p className="font-semibold text-sm">Đơn hàng đã bị huỷ</p>
          <p className="text-xs text-red-500 mt-0.5">
            Đơn thuê này đã được huỷ. Vui lòng liên hệ UniBridal nếu có thắc mắc.
          </p>
        </div>
      </div>
    );
  }

  const isAllCompleted = rawStatus === 'completed' || rawStatus === 'complete';
  const activeIndex = STATUS_STEP_MAP[rawStatus] ?? -1;

  return (
    <section className="mt-6 rounded-2xl border border-[#EEDECF] bg-[#FFF9F6] px-5 py-6 sm:px-7" aria-label="Trạng thái đơn hàng">
      <p className="mb-5 text-[11px] font-bold uppercase tracking-[1.6px] text-[#BA7A83]">✦ Hành Trình Lễ Phục Của Nàng</p>
      <ol className="flex flex-col sm:flex-row sm:items-start">
        {TIMELINE_STEPS.map(({ key, label, subLabel, Icon }, index) => {
          const done = isAllCompleted ? index <= activeIndex : index < activeIndex;
          const active = !isAllCompleted && index === activeIndex;
          const StepIcon = done ? CheckCircle2 : active ? Icon : Circle;
          const circleClass = done ? 'bg-[#BA7A83] text-white' : active
            ? 'border-2 border-[#BA7A83] bg-white text-[#BA7A83]'
            : 'border border-[#EEDECF] bg-[#EEDECF]/60 text-[#EEDECF]';

          return (
            <li key={key} className="relative flex gap-3 pb-4 last:pb-0 sm:min-w-0 sm:flex-1 sm:flex-col sm:items-center sm:gap-2 sm:pb-0">
              {index < TIMELINE_STEPS.length - 1 && (
                <span aria-hidden="true" className={`absolute bottom-0 left-[17px] top-10 w-0.5 sm:bottom-auto sm:left-[calc(50%+20px)] sm:right-[calc(-50%+20px)] sm:top-5 sm:h-0.5 sm:w-auto ${done ? 'bg-[#BA7A83]' : 'bg-[#EEDECF]'}`} />
              )}
              <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${circleClass}`}>
                <StepIcon className="h-4 w-4" />
                {active && <span className="absolute inset-0 animate-ping rounded-full bg-[#BA7A83]/20" />}
              </span>
              <div className="sm:px-1 sm:text-center">
                <p className={`text-sm font-semibold leading-tight sm:text-[11.5px] ${done || active ? 'text-[#804E55]' : 'text-[#BCAAA4]'}`}>{label}</p>
                {(active || done) && <p className={`mt-0.5 text-[11px] leading-tight text-[#BA7A83] sm:text-[10px] ${done ? 'sm:hidden' : ''}`}>{subLabel}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);

  const fetchOrderDetail = () => {
    setIsInspectionOpen(false);
    setReload((value) => value + 1);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setOrder(null);
    setIsInspectionOpen(false);
    setIsContractOpen(false);
    getOrder(orderId)
      .then((data) => {
        if (active) {
          setOrder(data);
          const isApproved = data?.inspection?.customerStatus === 'approved' || data?.inspection?.customerConfirmed;
          // Tự động mở màn hình bắt buộc khách hàng xem biên bản và xác nhận hoàn cọc
          if (!isApproved && (data?.rawStatus === 'returned' || data?.inspection)) {
            setIsInspectionOpen(true);
          }
        }
      })
      .catch((issue) => {
        if (active) setError(issue.message || 'Không tìm thấy thông tin đơn hàng.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId, reload]);

  const approved = order?.inspection?.customerStatus === 'approved';

  return (
    <AccountLayout
      hideSidebar
      hideBreadcrumb={true}
      breadcrumb={[]}
    >
      <div className="account-detail-content">
        <div className="mb-3 flex justify-end">
          <Link
            to="/profile/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-[#874e57] hover:text-[#5F2B36] transition-colors"
          >
            <ArrowLeft size={14} /> QUAY LẠI LỊCH SỬ ĐƠN HÀNG
          </Link>
        </div>

        {loading ? (
          <section className="rounded-md bg-white p-8 text-center text-[#766966]">
            Đang tải dữ liệu đơn hàng...
          </section>
        ) : error ? (
          <section className="rounded-md bg-white p-8 text-center text-red-700" role="alert">
            {error} <button type="button" onClick={fetchOrderDetail} className="ml-3 underline">Thử lại</button>
          </section>
        ) : (
          <>
            {/* ── HEADER GỌN GÀNG ── */}
            <div className="rounded-xl bg-gradient-to-r from-[#FAF0EB] to-[#FFF8F5] px-5 py-3.5 sm:px-6 border border-[#EEDECF]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-playfair text-xl sm:text-2xl font-bold text-[#2C2424] m-0">
                    Chi Tiết Đơn Thuê
                  </h1>
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#874e57] bg-white px-2.5 py-1 rounded-lg border border-[#EEDECF] shadow-2xs">
                    #{order.orderCode || order.id}
                  </span>
                </div>
                <div className="text-xs text-[#7A6A6B] flex items-center gap-1.5 shrink-0">
                  <CalendarDays size={13} className="text-[#874e57]" />
                  <span>Lịch thuê: <strong className="text-[#2C2424]">{order.rentalDates}</strong></span>
                </div>
              </div>
            </div>

            {/* ── BANNER BIÊN BẢN KIỂM ĐỊNH VÀ HOÀN CỌC NỔI BẬT (Chỉ hiển thị khi đơn đang chờ duyệt kiểm định, ẩn đối với đơn đã hoàn thành) ── */}
            {order.rawStatus !== 'completed' && order.status !== 'completed' && !approved && (order.rawStatus === 'returned' || order.inspection) && (
              <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFF4F0] via-[#FFF8F5] to-[#FFF1EC] border-2 border-[#E7BFB5] shadow-sm space-y-3 font-jakarta transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B8737D] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8C4654]"></span>
                    </span>
                    <span className="font-playfair font-bold text-[#5F2B36] text-[15px] sm:text-[16px] tracking-wide">
                      ✦ Yêu Cầu Bắt Buộc: Xem Biên Bản Kiểm Định và Xác Nhận Hoàn Cọc
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInspectionOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#733F49] to-[#8C4654] hover:from-[#5A2D35] hover:to-[#733F49] text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg border-0 shrink-0"
                  >
                    <span>Xem Biên Bản và Xác Nhận Hoàn Cọc</span>
                  </button>
                </div>

                <p className="text-[12.5px] sm:text-[13px] leading-relaxed text-[#5E4D4F] m-0">
                  Nàng vui lòng kiểm tra hiện trạng váy và số tiền đề nghị hoàn. Showroom sẽ đối soát và xử lý hoàn cọc sau khi nàng xác nhận; nếu chưa đồng ý, nàng có thể gửi khiếu nại.
                </p>

                <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#8C7A7B]">
                  <span>📧</span>
                  <span>Nàng có thể xem biên bản kiểm định và trạng thái xử lý hoàn cọc tại đây.</span>
                </div>
              </div>
            )}

            {/* ── STATUS TIMELINE ── */}
            <OrderStatusTimeline rawStatus={order.rawStatus} />

            {/* ── 2-COLUMN DETAIL ── */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Dress detail */}
              <section
                className="rounded-2xl bg-white px-5 py-6 sm:px-7 border border-[#EEDECF]"
                aria-labelledby="dress-detail-title"
              >
                <p className="account-overline text-[#874e57]">
                  <Shirt size={14} className="mr-1 inline" />
                  Chi tiết lễ phục
                </p>
                <div className="mt-5 space-y-5">
                  {order.items.map((item, index) => (
                    <article key={item._id || `${item.dressId}-${index}`} className="grid gap-5 border-b border-[#EEDECF] pb-4 last:border-b-0 sm:grid-cols-[120px_1fr]">
                      {(item.image || order.image) && <img src={item.image || order.image} alt={item.name} className="h-40 w-28 rounded-xl object-cover" />}
                      <div>
                        <h3 className="font-playfair text-xl">{item.name || 'Lễ phục'}</h3>
                        <p className="mt-2 text-sm">Kích cỡ: {item.size || 'Theo đơn hàng'}</p>
                        <p className="mt-2 text-sm">Màu sắc: {item.color || item.fabric || order.color || 'Trắng Sữa'}</p>
                        <p className="mt-2 text-sm">Tiền thuê: {formatVnd(item.rentPrice)}</p>
                        <p className="mt-2 text-sm">Tiền cọc: {formatVnd(item.depositAmount)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Finance */}
              <section
                className="rounded-2xl bg-white px-5 py-6 sm:px-7 border border-[#EEDECF] flex flex-col justify-between"
                aria-labelledby="invoice-title"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="account-overline text-[#874e57]">
                      Tài chính và ký quỹ
                    </p>
                    <Landmark size={15} className="text-[#874e57]" />
                  </div>
                  <h2 id="invoice-title" className="mt-2 font-playfair text-xl">
                    Tiền Cọc Theo Đơn
                  </h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt>Tổng phí thuê trọn gói</dt>
                      <dd className="font-semibold">{formatVnd(order.amount)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-[#eee2df] pt-3">
                      <dt>Tiền cọc bảo lãnh</dt>
                      <dd className="font-semibold text-[#874e57]">{formatVnd(order.deposit)}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 rounded-xl bg-[#fcf0ed] p-3 text-xs leading-5 text-[#66504d]">
                    Số tiền trên ghi nhận theo hợp đồng thuê. Tiền cọc sẽ được hoàn tất chuyển
                    trả vào tài khoản của nàng sau khi chuyên viên UniBridal thu hồi và kiểm định
                    lễ phục.
                  </p>
                </div>

                {/* Mã đơn hàng và Nút xem hợp đồng */}
                <div className="mt-5 pt-4 border-t border-[#eee2df] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#874e57] block">MÃ ĐƠN HÀNG</span>
                    <span className="text-xs font-mono font-bold text-stone-700">
                      #{order.orderCode || order.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.inspection && (
                      <button
                        type="button"
                        onClick={() => setIsInspectionOpen(true)}
                        className="account-button-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg"
                      >
                        <CheckCircle2 size={14} className="text-[#874e57]" /> Xem biên bản kiểm định
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsContractOpen(true)}
                      className="account-button-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3 rounded-lg"
                    >
                      <FileSignature size={15} /> Xem hợp đồng đã ký
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Biên Bản Kiểm Định và Quyết Toán Hoàn Cọc */}
            {isInspectionOpen && (
              <CustomerInspectionModal
                order={order}
                onClose={() => setIsInspectionOpen(false)}
                onUpdated={fetchOrderDetail}
              />
            )}
            {isContractOpen && (
              <SignedContractModal
                orderId={order._id || order.id}
                onClose={() => setIsContractOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </AccountLayout>
  );
}
