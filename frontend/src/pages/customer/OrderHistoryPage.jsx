import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Heart, Search } from 'lucide-react';
import AccountLayout from '../../components/layout/AccountLayout';
import { formatVnd, getDemoOrders, getOrders } from '../../services/orderService';
import elysianImage from '../../assets/card1_elysian.jpg';

const tabs = [
  { id: 'all', label: 'Tất cả' },
  { id: 'active', label: 'Đang thuê / Sắp diễn ra' },
  { id: 'complete', label: 'Hoàn tất bàn giao' },
  { id: 'cancelled', label: 'Đã hủy / Hoàn cọc' },
];

function OrderCard({ order }) {
  const active = order.status === 'active';
  return <article className="account-order-card rounded-md border border-[#eadbd8] bg-white p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eee2df] pb-4">
      <div><p className="account-overline">Mã đơn hàng</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">#{order.id}</h2><span className={`account-status ${active ? 'account-status-active' : 'account-status-complete'}`}>{order.statusLabel}</span></div></div>
      <div className="text-right"><p className="account-overline">{active ? 'Ngày cưới trong đơn' : 'Ngày cưới'}</p><strong className="text-base text-[#874e57]">{order.date}</strong></div>
    </div>
    <div className="grid gap-4 py-4 sm:grid-cols-[96px_1fr]">
      <img src={order.image} alt={order.imageAlt} className="h-32 w-24 object-cover object-center" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-playfair text-xl">{order.dress}</h3><p className="mt-1 text-xs text-[#766966]">Phân loại: {order.category} • Size {order.size} • Form {order.style}</p></div><strong className="text-base text-[#874e57]">{formatVnd(order.amount)}</strong></div>
        {active ? <><p className="mt-3 text-xs"><CalendarDays size={14} className="mr-1 inline text-[#874e57]" />Tặng kèm: Voan Cathedral Pháp + Vải bảo quản + Gói Fitting VIP</p><p className="mt-1 text-xs">Lịch thuê trong mẫu: {order.rentalDates}</p><div className="mt-3 rounded-sm bg-[#fcf0ed] px-3 py-2 text-xs leading-5 text-[#66504d]"><strong>Tiền cọc bảo lãnh: {formatVnd(order.deposit)}</strong> (Hoàn tất giả định theo mẫu thiết kế)</div></> : <div className="mt-3 rounded-sm bg-[#fcf0ed] px-3 py-2 text-xs leading-5 text-[#66504d]">Đã bàn giao và hoàn cọc theo kịch bản minh họa của giao diện.</div>}
      </div>
    </div>
    {active && <div className="border-t border-[#eee2df] pt-3"><div className="mb-2 flex justify-between text-[10px] uppercase tracking-wider text-[#766966]"><span>Tiến độ may đo & chuẩn bị lễ phục</span><span>Bước 2/4</span></div><div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-4">{['Đặt cọc', 'Fitting & chỉnh form', 'Bàn giao lễ phục', 'Trả váy & hoàn cọc'].map((label, index) => <div key={label} className="min-w-0"><div className={index < 2 ? 'account-progress-done' : 'account-progress-pending'} /><p className="mt-1.5 text-center text-[11px] leading-4 text-[#766966]">{index + 1}. {label}</p></div>)}</div></div>}
    <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[#eee2df] pt-4">
      {active ? <><button type="button" disabled title="Hợp đồng chỉ khả dụng khi kết nối hệ thống đặt hàng" className="account-button-secondary opacity-60">XEM CHI TIẾT HỢP ĐỒNG</button><Link className="account-button-primary" to={`/profile/orders/${order.id}`}>XEM HÀNH TRÌNH CHI TIẾT</Link></> : <><button type="button" disabled title="Đánh giá sẽ khả dụng khi có đơn hàng thật" className="account-button-secondary opacity-60">ĐÁNH GIÁ</button><Link className="account-button-secondary" to={`/profile/orders/${order.id}`}>XEM CHI TIẾT ĐƠN</Link><Link className="account-button-primary" to="/#collection">THUÊ LẠI MẪU NÀY</Link></>}
    </div>
  </article>;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState(() => getDemoOrders());
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await getOrders();
        const raw = res?.data || [];
        if (Array.isArray(raw) && raw.length > 0) {
          const normalized = raw.map((ord) => ({
            id: ord.orderCode || ord.id || ord._id,
            _id: ord._id,
            status: ord.status === 'completed' || ord.status === 'complete' ? 'complete' : ord.status === 'cancelled' ? 'cancelled' : 'active',
            statusLabel: ord.statusLabel || (ord.status === 'deposit_paid' ? 'Đã Thanh Toán Cọc' : ord.status === 'completed' || ord.status === 'complete' ? 'Đã Hoàn Tất & Hoàn Cọc' : 'Đang Chuẩn Bị Bàn Giao'),
            date: ord.date || (ord.rentalStartDate ? new Date(ord.rentalStartDate).toLocaleDateString('vi-VN') : '20/11/2026'),
            dress: ord.dress || ord.items?.[0]?.name || 'Váy cưới Haute Couture',
            image: ord.image || ord.items?.[0]?.image || elysianImage,
            imageAlt: ord.imageAlt || 'Váy cưới UniBridal',
            category: ord.category || 'Haute Couture',
            size: ord.size || ord.items?.[0]?.size || 'S (Eo 64–68cm)',
            style: ord.style || 'Corsetry Siết Eo',
            amount: ord.amount || ord.totalRentPrice || 5200000,
            deposit: ord.deposit || ord.totalDeposit || 15000000,
            rentalDates: ord.rentalDates || `${ord.rentalStartDate ? new Date(ord.rentalStartDate).toLocaleDateString('vi-VN') : '18/11/2026'} – ${ord.rentalEndDate ? new Date(ord.rentalEndDate).toLocaleDateString('vi-VN') : '21/11/2026'}`,
            contractCode: ord.contractCode,
          }));
          setOrders(normalized);
        }
      } catch (err) {
        setOrders(getDemoOrders());
      }
    }
    fetchOrders();
  }, []);

  const filtered = useMemo(() => orders.filter((order) => (tab === 'all' || order.status === tab) && `${order.id} ${order.dress}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi').trim()) && (!date || (order.date && order.date.slice(3).split('/').reverse().join('-') === date.slice(0, 7)))), [orders, tab, query, date]);
  return <AccountLayout breadcrumb={[{ label: 'Lịch Sử Đơn Hàng' }]}>
    <section className="profile-card rounded-lg bg-white px-5 py-7 sm:px-7" aria-labelledby="order-history-title">
      <p className="account-overline text-[#874e57]">Lịch sử đặt thuê & mua lễ phục</p>
      <h1 id="order-history-title" className="mt-1 font-playfair text-[25px]">Lịch Sử Đơn Hàng</h1>
      <p className="mt-2 text-sm leading-6 text-[#6c5b57]">Theo dõi tiến độ may đo, lịch trình thử váy và tình trạng giao nhận các kiệt tác lễ phục Haute Couture của nàng.</p>
      <div className="account-heading-rule mt-3" />
      <p className="mt-4 rounded-sm border border-[#f1dfd9] bg-[#fff8f6] px-3 py-2 text-xs text-[#795a55]">Dữ liệu minh họa từ năm 2025. Đơn hàng thực tế sẽ xuất hiện khi hệ thống đặt thuê được kết nối.</p>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Lọc trạng thái đơn hàng">{tabs.map(({ id, label }) => <button type="button" role="tab" aria-selected={tab === id} key={id} onClick={() => setTab(id)} className={`account-tab ${tab === id ? 'account-tab-active' : ''}`}>{label} ({id === 'all' ? orders.length : orders.filter((order) => order.status === id).length})</button>)}</div>
      <div className="mt-5 flex flex-wrap gap-3 border-b border-[#eee2df] pb-5">
        <label className="account-search relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#967c79]" /><span className="sr-only">Tìm mã đơn hàng hoặc tên váy</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã đơn, tên váy..." className="w-full border border-[#eee2df] bg-[#fff8f6] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#874e57]" /></label>
        <label className="flex items-center gap-2 border border-[#eee2df] bg-[#fff8f6] px-3 text-xs text-[#766966]"><CalendarDays size={15} className="shrink-0" /><span className="account-overline whitespace-nowrap">Lọc tháng</span><input type="month" value={date} onChange={(event) => setDate(event.target.value)} className="min-w-0 bg-transparent py-2.5 text-xs outline-none" /></label>
      </div>
      <div className="mt-5 space-y-5">{filtered.length ? filtered.map((order) => <OrderCard key={order.id} order={order} />) : <div className="py-16 text-center"><Heart size={30} className="mx-auto text-[#b8737d]" /><h2 className="mt-4 font-playfair text-xl">Không tìm thấy đơn hàng minh họa</h2><p className="mt-2 text-sm text-[#766966]">Thử bộ lọc khác hoặc xóa từ khóa tìm kiếm.</p><button type="button" onClick={() => { setTab('all'); setQuery(''); setDate(''); }} className="account-button-secondary mt-5">XÓA BỘ LỌC</button></div>}</div>
    </section>
  </AccountLayout>;
}
