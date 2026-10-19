import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Heart, Landmark, LockKeyhole, Scissors, Shirt, Truck } from 'lucide-react';
import AccountLayout from '../../components/layout/AccountLayout';
import { formatVnd, getDemoOrder } from '../../services/orderService';
import './AccountPages.css';

const steps = [
  { title: 'Đặt Cọc & Xác Nhận', Icon: Check, description: 'Khách hàng đặt cọc và xác nhận đơn theo kịch bản minh họa.' },
  { title: 'Fitting & Chỉnh Số Đo', Icon: Scissors, description: 'Phòng Fitting VIP Nam Kỳ Khởi Nghĩa' },
  { title: 'Bàn Giao & Hợp Đồng', Icon: Truck, description: 'Đội ngũ chuyên môn chuẩn bị và bàn giao lễ phục theo lịch hẹn.' },
  { title: 'Hoàn Trả & Giải Tỏa Cọc', Icon: Shirt, description: 'Kiểm tra lễ phục và xử lý hoàn cọc theo điều khoản hợp đồng.' },
];

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const order = getDemoOrder(orderId);
  if (!order) return <AccountLayout breadcrumb={[{ label: 'Lịch Sử Đơn Hàng', to: '/profile/orders' }, { label: 'Không tìm thấy đơn hàng' }]}>
    <section className="profile-card rounded-lg bg-white p-8"><h1 className="font-playfair text-2xl">Không tìm thấy đơn hàng</h1><p className="mt-3 text-sm text-[#766966]">Mã đơn này không có trong dữ liệu minh họa.</p><Link className="account-button-primary mt-6" to="/profile/orders">VỀ LỊCH SỬ ĐƠN HÀNG</Link></section>
  </AccountLayout>;

  const active = order.status === 'active';
  return <AccountLayout hideSidebar breadcrumb={[{ label: 'Lịch sử đơn hàng', to: '/profile/orders' }, { label: `Chi tiết hành trình #${order.id}` }]}>
    <div className="account-detail-content">
      <div className="mb-4 flex justify-end"><Link to="/profile/orders" className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-[#874e57] hover:underline"><ArrowLeft size={14} /> QUAY LẠI LỊCH SỬ ĐƠN HÀNG</Link></div>
      <div className="rounded-md bg-[#f8e9e4] px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs"><span className="account-status account-status-active">{order.statusLabel} (BƯỚC {active ? '2' : '4'}/4)</span><span>• Mã đơn mẫu: {order.id}</span></div>
        <h1 className="mt-2 font-playfair text-3xl sm:text-4xl">Hành Trình Chi Tiết Lễ Phục</h1>
        <p className="mt-2 font-playfair text-[27px] italic text-[#874e57]">#{order.id}</p>
        <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#874e57]"><span><Heart size={14} className="mr-1 inline" />Ngày cưới trong mẫu: {order.date}</span><span>•</span><span>Dữ liệu minh họa năm 2025</span></p>
      </div>
      <section className="mt-6 rounded-md bg-white px-6 py-7 sm:px-8" aria-labelledby="journey-title">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="account-overline text-[#874e57]">Atelier bespoke protocol</p><h2 id="journey-title" className="mt-1 font-playfair text-xl">Tiến Độ Chế Tác & Bàn Giao Lễ Phục</h2></div><span className="rounded-sm bg-[#fbf0ec] px-3 py-2 text-xs text-[#874e57]"><LockKeyhole size={13} className="mr-1 inline" />Bản mô phỏng tiến độ</span></div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{steps.map(({ title, Icon, description }, index) => <div key={title} className="relative"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${index <= (active ? 1 : 3) ? 'bg-[#874e57] text-white' : 'bg-[#f3e8e5] text-[#874e57]'}`}><Icon size={20} /></div><div className="mt-3 h-0.5 bg-[#e7d9d5]"><span className={`block h-full ${index <= (active ? 1 : 3) ? 'bg-[#874e57]' : ''}`} /></div><p className="account-overline mt-4">Giai đoạn 0{index + 1}{index === 1 && active ? ' • Hiện tại' : ''}</p><h3 className="mt-1 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#766966]">{description}</p></div>)}</div>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-md bg-white px-5 py-6 sm:px-7" aria-labelledby="dress-detail-title"><div className="flex flex-wrap justify-between gap-2"><p className="account-overline text-[#874e57]">Chi tiết mẫu lễ phục</p><span className="account-overline bg-[#f5e6db] px-2 py-1">Mã mẫu: {order.id}</span></div><div className="mt-5 grid gap-5 sm:grid-cols-[160px_1fr]"><img src={order.image} alt={order.imageAlt} className="h-56 w-full object-cover" /><div><h2 id="dress-detail-title" className="font-playfair text-xl">{order.dress}</h2><p className="mt-2 text-xs text-[#874e57]">{order.category} • {order.style}</p><div className="mt-4 space-y-2 text-xs"><p><span className="bg-[#f7eae6] px-2 py-1">Kích cỡ: {order.size}</span></p><p><span className="bg-[#f7eae6] px-2 py-1">Lịch thuê: {order.rentalDates}</span></p><p><span className="bg-[#f7eae6] px-2 py-1">Địa điểm thử: {order.fitting}</span></p></div></div></div><div className="mt-5 rounded-sm bg-[#fcf0ed] p-3 text-xs leading-5"><strong>THÔNG TIN PHỤ KIỆN MẪU:</strong><p>Phụ kiện đi kèm chỉ mang tính minh họa cho bản thiết kế.</p></div></section>
        <section className="rounded-md bg-white px-5 py-6 sm:px-7" aria-labelledby="invoice-title"><p className="account-overline text-[#874e57]">Tài chính & ký quỹ <Landmark size={15} className="float-right" /></p><h2 id="invoice-title" className="mt-2 font-playfair text-xl">Hóa Đơn Thuê & Tiền Cọc</h2><div className="mt-5 space-y-3 text-xs"><div className="flex justify-between gap-3"><span>Phí thuê váy chính (3 ngày 2 đêm):</span><strong>{formatVnd(order.amount)}</strong></div><div className="flex justify-between gap-3"><span>Phụ kiện đính kèm (Voan, Tùng, Val):</span><strong>Tặng kèm (0 đ)</strong></div><div className="flex justify-between border-t border-[#eee2df] pt-3 text-sm"><strong>Tổng chi phí thuê:</strong><strong className="text-[#874e57]">{formatVnd(order.amount)}</strong></div></div><p className="mt-3 text-right text-[10px] text-[#766966]">Đã thanh toán đủ theo kịch bản minh họa.</p><div className="mt-5 rounded-sm bg-[#fcf0ed] p-4 text-xs leading-5"><p className="flex items-center justify-between gap-3 font-semibold"><span><LockKeyhole size={13} className="mr-1 inline" /> TIỀN CỌC BẢO LÃNH THEO MẪU:</span><span className="shrink-0 whitespace-nowrap text-sm text-[#874e57] sm:text-base">{formatVnd(order.deposit)}</span></p><p className="mt-3 text-[#66504d]">Khoản cọc và quy trình hoàn trả hiển thị theo bản thiết kế minh họa. Chưa có giao dịch hoặc hợp đồng thực tế trên trang này.</p></div></section>
      </div>
    </div>
  </AccountLayout>;
}



