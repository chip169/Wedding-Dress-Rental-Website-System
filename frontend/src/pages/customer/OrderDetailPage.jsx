import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Landmark, Shirt } from 'lucide-react';
import AccountLayout from '../../components/layout/AccountLayout';
import { formatVnd, getOrder } from '../../services/orderService';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; getOrder(orderId).then((data) => { if (active) setOrder(data); }).catch((issue) => { if (active) setError(issue.message || 'Không tìm thấy đơn hàng.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [orderId]);

  return <AccountLayout hideSidebar breadcrumb={[{ label: 'Lịch sử đơn hàng', to: '/profile/orders' }, { label: order ? `Chi tiết #${order.id}` : 'Chi tiết đơn hàng' }]}>
    <div className="account-detail-content">
      <div className="mb-4 flex justify-end"><Link to="/profile/orders" className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-[#874e57]"><ArrowLeft size={14} /> QUAY LẠI LỊCH SỬ ĐƠN HÀNG</Link></div>
      {loading ? <section className="rounded-md bg-white p-8">Đang tải đơn hàng...</section> : error ? <section className="rounded-md bg-white p-8" role="alert">{error}</section> : <>
        <div className="rounded-md bg-[#f8e9e4] px-6 py-6 sm:px-8">
          <span className="account-status account-status-active">{order.statusLabel}</span>
          <h1 className="mt-2 font-playfair text-3xl sm:text-4xl">Chi Tiết Đơn Thuê Lễ Phục</h1>
          <p className="mt-2 font-playfair text-[27px] italic text-[#874e57]">#{order.id}</p>
          <p className="mt-2 text-xs text-[#874e57]"><CalendarDays size={14} className="mr-1 inline" />Lịch thuê: {order.rentalDates}</p>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-md bg-white px-5 py-6 sm:px-7" aria-labelledby="dress-detail-title">
            <p className="account-overline text-[#874e57]"><Shirt size={14} className="mr-1 inline" />Chi tiết lễ phục</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-[160px_1fr]">{order.image && <img src={order.image} alt={order.imageAlt} className="h-56 w-full object-cover" />}<div><h2 id="dress-detail-title" className="font-playfair text-xl">{order.dress}</h2><p className="mt-2 text-xs text-[#874e57]">{order.category}</p><p className="mt-4 text-sm">Kích cỡ: {order.size}</p><p className="mt-2 text-sm">Trạng thái: {order.statusLabel}</p></div></div>
          </section>
          <section className="rounded-md bg-white px-5 py-6 sm:px-7" aria-labelledby="invoice-title">
            <p className="account-overline text-[#874e57]">Tài chính & ký quỹ <Landmark size={15} className="float-right" /></p>
            <h2 id="invoice-title" className="mt-2 font-playfair text-xl">Phí Thuê & Tiền Cọc Theo Đơn</h2>
            <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt>Tổng phí thuê</dt><dd className="font-semibold">{formatVnd(order.amount)}</dd></div><div className="flex justify-between gap-3 border-t border-[#eee2df] pt-3"><dt>Tiền cọc</dt><dd className="font-semibold text-[#874e57]">{formatVnd(order.deposit)}</dd></div></dl>
            <p className="mt-5 rounded-sm bg-[#fcf0ed] p-4 text-xs leading-5 text-[#66504d]">Số tiền trên lấy từ đơn hàng. Trạng thái thanh toán được ghi nhận riêng theo giao dịch thực tế.</p>
          </section>
        </div>
      </>}
    </div>
  </AccountLayout>;
}
