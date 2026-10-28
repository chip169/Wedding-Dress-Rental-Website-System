import axiosClient from '../api/axiosClient';
import elysianImage from '../assets/card1_elysian.jpg';
import auroraImage from '../assets/card3_lumiere.jpg';
import { formatCurrencyVND } from '../utils/formatCurrency';

// Dữ liệu mẫu dự phòng khi Backend chưa khởi chạy
const DEMO_ORDERS = [
  {
    id: 'UB-2025-089',
    _id: 'ord_demo_001',
    orderCode: 'UB-2025-089',
    status: 'active',
    statusLabel: 'Đang Chuẩn Bị Bàn Giao',
    date: '20/11/2025',
    dress: 'Elysian Rose Ballgown',
    image: elysianImage,
    imageAlt: 'Mẫu váy cưới Elysian Rose Ballgown',
    category: 'Haute Couture',
    size: 'S (Eo 64–68cm)',
    style: 'Corset Siết Eo',
    amount: 4700000,
    deposit: 15000000,
    rentalDates: '18/11/2025 – 21/11/2025',
    fitting: 'Phòng Fitting VIP Nam Kỳ Khởi Nghĩa',
  },
  {
    id: 'UB-2025-042',
    _id: 'ord_demo_002',
    orderCode: 'UB-2025-042',
    status: 'complete',
    statusLabel: 'Đã Hoàn Tất & Hoàn Cọc',
    date: '15/05/2025',
    dress: 'Aurora Pearl Sheath',
    image: auroraImage,
    imageAlt: 'Mẫu váy cưới Aurora Pearl Sheath',
    category: 'Giới thiệu 3 ngày',
    size: 'S',
    style: 'Sheath',
    amount: 4800000,
    deposit: 12000000,
    rentalDates: '12/05/2025 – 15/05/2025',
    fitting: 'Private Suite UniBridal',
  },
];

/**
 * Lấy danh sách toàn bộ đơn thuê (Admin / Staff) hoặc đơn cá nhân (Customer)
 * @param {Object} params - { status, customerId, page, limit }
 */
export async function getOrders(params = {}) {
  try {
    return await axiosClient.get('/orders', { params });
  } catch (error) {
    const cached = localStorage.getItem('unibridal-orders');
    return {
      success: true,
      data: cached ? JSON.parse(cached) : DEMO_ORDERS,
    };
  }
}

/**
 * Lấy chi tiết đơn thuê theo ID hoặc OrderCode
 * @param {string} idOrCode
 */
export async function getOrderById(idOrCode) {
  try {
    return await axiosClient.get(`/orders/${idOrCode}`);
  } catch (error) {
    const cached = JSON.parse(localStorage.getItem('unibridal-orders') || '[]');
    const all = [...cached, ...DEMO_ORDERS];
    const found = all.find((o) => o.id === idOrCode || o._id === idOrCode || o.orderCode === idOrCode);
    return {
      success: !!found,
      data: found || DEMO_ORDERS[0],
    };
  }
}

/**
 * Tạo mới đơn thuê váy từ giỏ hàng
 * @param {Object} orderData - { items, rentalStartDate, rentalEndDate, deliveryMethod, shippingAddress, notes }
 */
export async function createOrder(orderData) {
  try {
    return await axiosClient.post('/orders', orderData);
  } catch (error) {
    const newOrder = {
      id: `UB-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      _id: `ord_${Date.now()}`,
      orderCode: `UB-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      status: 'pending',
      statusLabel: 'Chờ Xác Nhận',
      date: new Date().toLocaleDateString('vi-VN'),
      createdAt: new Date().toISOString(),
      ...orderData,
    };
    const cached = JSON.parse(localStorage.getItem('unibridal-orders') || '[]');
    cached.unshift(newOrder);
    localStorage.setItem('unibridal-orders', JSON.stringify(cached));
    return {
      success: true,
      message: 'Đặt đơn thuê thành công (Offline Demo)',
      data: newOrder,
    };
  }
}

/**
 * Cập nhật trạng thái đơn hàng (Admin/Staff)
 * @param {string} orderId
 * @param {string} status - 'confirmed' | 'preparing' | 'handover' | 'renting' | 'returned' | 'completed' | 'cancelled'
 */
export async function updateOrderStatus(orderId, status) {
  try {
    return await axiosClient.patch(`/orders/${orderId}/status`, { status });
  } catch (error) {
    return { success: true, message: 'Cập nhật trạng thái đơn thành công (Offline Demo)' };
  }
}

/**
 * Lập biên bản kiểm định tình trạng váy khi trả (Return Inspection)
 * @param {string} orderId
 * @param {Object} inspectionData - { condition, damageNotes, penaltyFee, refundDepositAmount, inspectorStaffId }
 */
export async function submitReturnInspection(orderId, inspectionData) {
  try {
    return await axiosClient.post(`/orders/${orderId}/inspection`, inspectionData);
  } catch (error) {
    return { success: true, message: 'Lập biên bản hoàn trả thành công (Offline Demo)' };
  }
}

/**
 * Lấy danh sách khoảng thời gian váy đã có người đặt thuê kín lịch
 * @param {string} dressId
 */
export async function getDressBookedDates(dressId) {
  try {
    const res = await axiosClient.get('/orders/booked-dates', {
      params: { dressId },
    });
    return res.data?.data || res.data || [];
  } catch (error) {
    return [];
  }
}

// Giữ lại các hàm cũ để tương thích hoàn toàn với các component đang gọi
export function getDemoOrders() {
  return DEMO_ORDERS;
}

export function getDemoOrder(id) {
  return DEMO_ORDERS.find((order) => order.id === id);
}

export function formatVnd(value) {
  return formatCurrencyVND(value);
}
