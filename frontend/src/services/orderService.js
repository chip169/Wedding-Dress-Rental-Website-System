import axiosClient from '../api/axiosClient';
import { dressImage } from './dressApiService';

const STATUS = {
  pending_payment: ['active', 'Chờ thanh toán cọc'], deposit_paid: ['active', 'Đã đặt cọc'],
  preparing: ['active', 'Đang chuẩn bị bàn giao'], delivered: ['active', 'Đã bàn giao'],
  renting: ['active', 'Đang thuê'], returned: ['active', 'Đã trả váy'],
  completed: ['complete', 'Hoàn tất'], cancelled: ['cancelled', 'Đã hủy'],
};
const fmtDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '—';
export const formatVnd = (value) => `${new Intl.NumberFormat('vi-VN').format(value || 0)} ₫`;

export function mapOrder(order) {
  const item = order.items?.[0] || {};
  const [status, statusLabel] = STATUS[order.status] || ['active', order.status];
  return {
    id: order.orderCode, status, statusLabel, rawStatus: order.status,
    date: fmtDate(order.rentalStartDate), dress: item.name || 'Lễ phục',
    image: dressImage(item.dressId || {}), imageAlt: item.name || 'Lễ phục',
    category: item.dressId?.silhouette || 'Haute Couture', size: item.size || '—', style: 'Theo đơn hàng',
    amount: order.totalRentPrice || 0, deposit: order.totalDeposit || 0,
    rentalDates: `${fmtDate(order.rentalStartDate)} – ${fmtDate(order.rentalEndDate)}`,
    fitting: 'Liên hệ showroom để xác nhận', shippingAddress: order.shippingAddress,
  };
}

export const getOrders = async () => (await axiosClient.get('/orders/my')).data.map(mapOrder);
export const getOrder = async (id) => mapOrder((await axiosClient.get(`/orders/my/${encodeURIComponent(id)}`)).data);
