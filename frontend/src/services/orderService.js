import elysianImage from '../assets/card1_elysian.jpg';
import auroraImage from '../assets/card3_lumiere.jpg';

// Read-only presentation data until an order API is connected.
const ORDERS = [
  {
    id: 'UB-2025-089', status: 'active', statusLabel: 'Đang Chuẩn Bị Bàn Giao', date: '20/11/2025',
    dress: 'Elysian Rose Ballgown', image: elysianImage, imageAlt: 'Mẫu váy cưới Elysian Rose Ballgown',
    category: 'Haute Couture', size: 'S (Eo 64–68cm)', style: 'Corset Siết Eo',
    amount: 4700000, deposit: 15000000, rentalDates: '18/11/2025 – 21/11/2025',
    fitting: 'Phòng Fitting VIP Nam Kỳ Khởi Nghĩa',
  },
  {
    id: 'UB-2025-042', status: 'complete', statusLabel: 'Đã Hoàn Tất & Hoàn Cọc', date: '15/05/2025',
    dress: 'Aurora Pearl Sheath', image: auroraImage, imageAlt: 'Mẫu váy cưới Aurora Pearl Sheath',
    category: 'Giới thiệu 3 ngày', size: 'S', style: 'Sheath', amount: 4800000,
    deposit: 12000000, rentalDates: '12/05/2025 – 15/05/2025', fitting: 'Private Suite UniBridal',
  },
];

export function getDemoOrders() { return ORDERS; }
export function getDemoOrder(id) { return ORDERS.find((order) => order.id === id); }
export function formatVnd(value) { return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'; }
