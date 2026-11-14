import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, CalendarDays, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import AccountLayout from '../../components/layout/AccountLayout';
import { useAuth } from '../../contexts/AuthContext';
import { formatVnd } from '../../services/orderService';
import { getOrders } from '../../services/customerOrderService';
import CustomerInspectionModal from '../../components/common/CustomerInspectionModal';
import SignedContractModal from '../../components/common/SignedContractModal';

const tabs = [
  { id: 'all', label: 'Tất cả' },
  { id: 'active', label: 'Đang thuê và Chờ nhận' },
  { id: 'complete', label: 'Đã hoàn tất' },
  { id: 'cancelled', label: 'Đã hủy' },
];

function OrderCard({ order, onOpenInspection, onOpenContract }) {
  const active = order.status === 'active';
  const hasInspection = order.rawStatus === 'returned' || order.inspection;
  const inspStatus = order.inspection?.customerStatus || 'pending';

  return (
    <article className="border border-[#eee2df] bg-white p-4 sm:p-5 rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee2df] pb-3 text-xs">
        <span className="font-semibold text-[#874e57]">MÃ ĐƠN: #{order.id}</span>
        <span className={`account-status ${active ? 'account-status-active' : 'account-status-complete'}`}>
          {order.statusLabel}
        </span>
      </div>
      <div className="my-4 flex flex-col gap-4 sm:flex-row">
        <img src={order.image} alt={order.imageAlt} className="h-32 w-24 object-cover object-center rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-playfair text-xl">{order.dress}</h3>
              <p className="mt-1 text-xs text-[#766966]">
                Phân loại: {order.category} • Size {order.size} • Màu {order.color || 'Trắng Sữa'} • Form {order.style}
              </p>
            </div>
            <strong className="text-base text-[#874e57]">{formatVnd(order.amount)}</strong>
          </div>
          {active ? (
            <>
              <p className="mt-3 text-xs">
                <CalendarDays size={14} className="mr-1 inline text-[#874e57]" />
                Lịch thuê: {order.rentalDates}
              </p>
              <div className="mt-3 rounded-xl bg-[#fcf0ed] px-3.5 py-2 text-xs leading-5 text-[#66504d]">
                Tiền cọc theo đơn: <strong>{formatVnd(order.deposit)}</strong>
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-xl bg-[#fcf0ed] px-3.5 py-2 text-xs leading-5 text-[#66504d]">
              {order.status === 'cancelled' ? 'Đơn đã hủy. Các khoản đã thu cần đối soát theo chính sách hợp đồng.' : 'Đơn đã hoàn tất. Xem biên bản để kiểm tra khoản hoàn cọc.'}
            </div>
          )}
        </div>
      </div>

      {/* BANNER BIÊN BẢN KIỂM ĐỊNH VÀ HOÀN CỌC NỔI BẬT */}
      {hasInspection && (
        <div className="mb-4 pt-1">
          {inspStatus === 'pending' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFF4F0] via-[#FFF8F5] to-[#FFF1EC] border-2 border-[#E7BFB5] shadow-sm space-y-3 font-jakarta transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B8737D] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#8C4654]"></span>
                  </span>
                  <span className="font-playfair font-bold text-[#5F2B36] text-[15px] sm:text-[16px] tracking-wide">
                    ✦ Showroom đã lập Biên Bản Kiểm Định Trả Váy
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenInspection(order)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#733F49] to-[#8C4654] hover:from-[#5A2D35] hover:to-[#733F49] text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg border-0 shrink-0"
                >
                  <span>Xem Biên Bản và Xác Nhận Hoàn Cọc</span>
                </button>
              </div>

              <p className="text-[12.5px] sm:text-[13px] leading-relaxed text-[#5E4D4F] m-0">
                Nàng vui lòng kiểm tra biên bản và gửi thông tin nhận tiền. Showroom sẽ đối soát trước khi xử lý hoàn cọc.
              </p>

              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#8C7A7B]">
                <span>📧</span>
                <span>Nàng có thể xem biên bản và trạng thái xử lý hoàn cọc tại đây.</span>
              </div>
            </div>
          )}

          {inspStatus === 'disputed' && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-2 font-jakarta">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-amber-900 flex items-center gap-2 text-[13px]">
                  <AlertTriangle size={16} className="text-amber-600" />
                  Nàng đã gửi khiếu nại về biên bản kiểm định
                </span>
                <button
                  type="button"
                  onClick={() => onOpenInspection(order)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                >
                  Xem Lại Biên Bản và Khiếu Nại
                </button>
              </div>
              <p className="text-[12px] text-amber-800 m-0 italic bg-white/70 p-2 rounded-lg border border-amber-100">
                Lý do: "{order.inspection?.disputeReason}"
              </p>
              <p className="text-[11px] text-amber-700 m-0">
                Chuyên viên Atelier của UniBridal đang rà soát và sẽ liên hệ giải quyết hoặc cập nhật lại biên bản hoàn cọc cho nàng.
              </p>
            </div>
          )}

          {inspStatus === 'approved' && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Nàng đã duyệt biên bản. Vui lòng xem trạng thái hoàn cọc riêng trong biên bản.</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenInspection(order)}
                className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-900 cursor-pointer bg-transparent border-0"
              >
                Xem chi tiết biên bản
              </button>
            </div>
          )}
        </div>
      )}

      {active && (
        <div className="border-t border-[#eee2df] pt-3 text-xs text-[#766966]">
          Trạng thái hiện tại: <span className="font-medium text-[#874e57]">{order.statusLabel}</span>
        </div>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[#eee2df] pt-4">
        <button type="button" onClick={() => onOpenContract(order)} className="account-button-secondary inline-flex items-center gap-1.5" aria-label={`Xem hợp đồng đã ký của đơn ${order.id}`}>
          <FileText size={15} /> Xem hợp đồng đã ký
        </button>
        <Link className="account-button-primary" to={`/profile/orders/${order.id}`}>
          XEM CHI TIẾT ĐƠN
        </Link>
      </div>
    </article>
  );
}

export default function OrderHistoryPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedInspectionOrder, setSelectedInspectionOrder] = useState(null);
  const [selectedContractOrder, setSelectedContractOrder] = useState(null);

  // Xóa bỏ triệt để dữ liệu đơn hàng giả lập (fake) lưu trong localStorage của trình duyệt
  useEffect(() => {
    try {
      localStorage.removeItem('unibridal-orders');
      localStorage.removeItem('unibridal-last-order');
    } catch {}
  }, []);

  const fetchOrders = () => setReload((value) => value + 1);

  useEffect(() => {
    let active = true;
    if (!token && !user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setError('');
    setLoading(true);
    getOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((issue) => {
        if (!active) return;
        setOrders([]);
        setError(issue.message || 'Không tải được danh sách đơn hàng từ máy chủ.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token, user, reload]);

  const filtered = useMemo(
    () =>
      orders.filter(
        (order) =>
          (tab === 'all' || order.status === tab) &&
          `${order.id || ''} ${order.dress || ''}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi').trim())
      ),
    [orders, tab, query]
  );

  return (
    <AccountLayout hideBreadcrumb={true} breadcrumb={[]}>
      <section className="profile-card rounded-2xl bg-white px-5 py-7 sm:px-7 border border-[#F0E5DC] shadow-xs font-jakarta" aria-labelledby="order-history-title">
        <h1 id="order-history-title" className="mt-1 font-jakarta font-bold text-[24px] sm:text-[26px] text-[#2C2523] tracking-tight">
          Lịch Sử Đơn Hàng
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#6c5b57]">
          Theo dõi tiến độ may đo, lịch trình thử váy và tình trạng giao nhận các kiệt tác lễ phục Haute Couture của nàng.
        </p>
        <div className="account-heading-rule mt-3" />

        {!user && !token ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FAF0EC] text-[#733F49] flex items-center justify-center mx-auto mb-4">
              <FileText size={28} />
            </div>
            <h2 className="font-playfair text-2xl font-bold text-[#5F2B36]">Chưa Đăng Nhập Tài Khoản</h2>
            <p className="mt-2 text-sm text-[#7A6B6C] max-w-md mx-auto">
              Vui lòng đăng nhập tài khoản của nàng để theo dõi lịch sử thuê váy cưới, tiến độ giao nhận và biên bản kiểm định cọc.
            </p>
            <Link to="/login" className="account-button-primary mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider">
              Đăng Nhập Ngay
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-700">
                {error} <button type="button" onClick={fetchOrders} className="ml-3 underline">Thử lại</button>
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Lọc trạng thái đơn hàng">
              {tabs.map(({ id, label }) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  key={id}
                  onClick={() => setTab(id)}
                  className={`account-tab ${tab === id ? 'account-tab-active' : ''}`}
                >
                  {label} ({id === 'all' ? orders.length : orders.filter((order) => order.status === id).length})
                </button>
              ))}
            </div>
            <div className="mt-5 border-b border-[#eee2df] pb-5">
              <label className="account-search relative block w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#967c79]" />
                <span className="sr-only">Tìm mã đơn hàng hoặc tên váy</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm theo mã đơn hàng, tên váy cưới..."
                  className="w-full rounded-xl border border-[#eee2df] bg-[#fff8f6] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#874e57] focus:bg-white transition-colors"
                />
              </label>
            </div>
            <div className="mt-5 space-y-5">
              {loading ? (
                <p className="py-8 text-center text-sm text-[#766966]">Đang tải đơn hàng...</p>
              ) : error ? null : filtered.length ? (
                filtered.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onOpenInspection={(ord) => setSelectedInspectionOrder(ord)}
                    onOpenContract={setSelectedContractOrder}
                  />
                ))
              ) : (
                <div className="py-16 text-center">
                  <Heart size={30} className="mx-auto text-[#b8737d]" />
                  <h2 className="mt-4 font-playfair text-xl font-bold text-[#5F2B36]">
                    {orders.length === 0 ? 'Nàng chưa có đơn thuê nào' : 'Không tìm thấy đơn hàng phù hợp'}
                  </h2>
                  <p className="mt-2 text-sm text-[#766966]">
                    {orders.length === 0
                      ? 'Hãy khám phá các mẫu thiết kế Haute Couture mới nhất của UniBridal.'
                      : 'Thử bộ lọc khác hoặc xóa từ khóa tìm kiếm.'}
                  </p>
                  {orders.length === 0 ? (
                    <Link to="/collection" className="account-button-primary mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold">
                      KHÁM PHÁ BỘ SƯU TẬP
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('all');
                        setQuery('');
                      }}
                      className="account-button-secondary mt-5"
                    >
                      XÓA BỘ LỌC
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Modal Kiểm Định và Hoàn Cọc (Khách Hàng) */}
      {selectedInspectionOrder && (
        <CustomerInspectionModal
          order={selectedInspectionOrder}
          onClose={() => setSelectedInspectionOrder(null)}
          onUpdated={fetchOrders}
        />
      )}
      {selectedContractOrder && (
        <SignedContractModal
          orderId={selectedContractOrder._id || selectedContractOrder.id}
          onClose={() => setSelectedContractOrder(null)}
        />
      )}
    </AccountLayout>
  );
}
