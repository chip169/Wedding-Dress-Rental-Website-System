import axiosClient from '../api/axiosClient';
import elysianImage from '../assets/card1_elysian.jpg';
import auroraImage from '../assets/card3_lumiere.jpg';
import { formatCurrencyVND } from '../utils/formatCurrency';
import { dressImage } from './dressApiService';

const STATUS = {
  pending_payment: ['active', 'Chờ thanh toán cọc'],
  deposit_paid: ['active', 'Đã đặt cọc'],
  preparing: ['active', 'Đang chuẩn bị bàn giao'],
  delivered: ['active', 'Đã bàn giao'],
  renting: ['active', 'Đang thuê'],
  returned: ['active', 'Chờ hoàn cọc'],
  waiting_refund: ['active', 'Chờ hoàn cọc'],
  disputed: ['active', 'Tạm giữ - Chờ đàm phán'],
  completed: ['complete', 'Hoàn tất'],
  complete: ['complete', 'Hoàn tất'],
  cancelled: ['cancelled', 'Đã hủy'],
};

const fmtDate = (date) => (date ? new Date(date).toLocaleDateString('vi-VN') : '—');
export const formatVnd = (value) => formatCurrencyVND(value);

export function mapOrder(order) {
  if (!order) return null;
  const item = order.items?.[0] || {};
  let currentRawStatus = order.status;
  if (['completed', 'complete'].includes(currentRawStatus)) {
    currentRawStatus = 'completed';
  } else if (['returned', 'waiting_refund'].includes(currentRawStatus)) {
    currentRawStatus = 'waiting_refund';
  }
  const [status, statusLabel] = STATUS[currentRawStatus] || ['active', order.statusLabel || currentRawStatus || 'Đang xử lý'];
  return {
    id: order.orderCode || order.id || order._id,
    _id: order._id || order.id,
    orderCode: order.orderCode || order.id,
    status,
    statusLabel,
    rawStatus: currentRawStatus,
    date: fmtDate(order.rentalStartDate || order.createdAt || order.date),
    dress: order.items?.map((entry) => entry.name).filter(Boolean).join(', ') || order.dress || 'Lễ phục',
    image: order.image || (item.image ? dressImage({ image: item.image }) : typeof item.dressId === 'object' && item.dressId ? dressImage(item.dressId) : elysianImage),
    imageAlt: order.imageAlt || item.name || 'Lễ phục',
    category: item.dressId?.silhouette || order.category || 'Haute Couture',
    size: item.size || order.size || '—',
    color: item.color || item.fabric || order.color || 'Trắng Sữa',
    style: order.style || 'Theo đơn hàng',
    amount: order.totalRentPrice || order.amount || 0,
    deposit: order.totalDeposit || order.deposit || 0,
    totalDeposit: order.totalDeposit || order.deposit || 0,
    totalRentPrice: order.totalRentPrice || order.amount || 0,
    rentalStartDate: order.rentalStartDate,
    rentalEndDate: order.rentalEndDate,
    actualReturnDate: order.actualReturnDate,
    rentalDates: order.rentalDates || `${fmtDate(order.rentalStartDate)} – ${fmtDate(order.rentalEndDate)}`,
    fitting: order.fitting || 'Liên hệ showroom để xác nhận',
    shippingAddress: order.shippingAddress,
    items: (order.items || []).map((it) => ({
      ...it,
      color: it.color || it.fabric || order.color || 'Trắng Sữa',
    })),
    inspection: order.inspection || null,
    customerName: order.customerName || '',
    contract: order.contract || null,
    contractCode: order.contractCode || '',
    contractSignature: order.contractSignature || '',
    rentalDays: order.rentalDays,
  };
}

/**
 * Lấy danh sách toàn bộ đơn thuê (Admin / Staff) hoặc đơn cá nhân (Customer)
 * @param {Object} params - { status, customerId, page, limit }
 */
export async function getOrders(params = {}) {
  // Dọn dẹp cache fake cũ trong localStorage nếu có
  try {
    localStorage.removeItem('unibridal-orders');
  } catch {}

  try {
    const res = await axiosClient.get('/orders/my', { params });
    const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : res.data?.data || []);
    if (Array.isArray(list)) {
      return list.map(mapOrder);
    }
  } catch (error) {
    // Không đăng nhập hoặc lỗi kết nối -> trả về mảng rỗng, không tự tạo mock
    return [];
  }

  return [];
}

/**
 * Lấy chi tiết đơn thuê theo ID hoặc OrderCode
 * @param {string} idOrCode
 */
export async function getOrder(idOrCode) {
  try {
    const res = await axiosClient.get(`/orders/my/${encodeURIComponent(idOrCode)}`);
    const raw = res?.data?.data || res?.data;
    if (raw) return mapOrder(raw);
  } catch (error) {
    // Thử endpoint chung
  }

  try {
    const res = await axiosClient.get(`/orders/${encodeURIComponent(idOrCode)}`);
    const raw = res?.data?.data || res?.data;
    if (raw) return mapOrder(raw);
  } catch (error) {
    // Lỗi
  }

  throw new Error('Không tìm thấy đơn hàng trong cơ sở dữ liệu.');
}

/**
 * Tạo mới đơn thuê váy từ giỏ hàng
 * @param {Object} orderData - { items, rentalStartDate, rentalEndDate, deliveryMethod, shippingAddress, notes }
 */
export async function createOrder(orderData) {
  try {
    return await axiosClient.post('/orders', orderData);
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Không thể tạo đơn thuê, vui lòng thử lại.');
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
 * @param {Object} inspectionData - { itemsCondition, evidencePhotos }
 */
export async function submitReturnInspection(orderId, inspectionData) {
  try {
    return await axiosClient.post(`/orders/${orderId}/inspection`, inspectionData);
  } catch (error) {
    throw error;
  }
}

/**
 * Admin duyệt đàm phán mức phạt và hoàn tất đơn (Trường hợp 2)
 * @param {string} orderId
 * @param {Object} data - { agreedPenaltyFee, refundMethod, refundBankDetails, negotiationNotes }
 */
export async function settleInspectionAdmin(orderId, data) {
  try {
    const res = await axiosClient.post(`/orders/${orderId}/inspection/admin-settle`, data);
    return res.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Khách hàng đồng ý biên bản kiểm định -> Tự động hoàn cọc và cập nhật STK ngân hàng
 * @param {string} orderId
 * @param {Object} bankData - { bankName, accountNumber, accountHolder, notes }
 */
export async function approveReturnInspection(orderId, bankData = {}) {
  try {
    const res = await axiosClient.post(`/orders/${orderId}/inspection/approve`, bankData);
    return res.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Khách hàng khiếu nại biên bản kiểm định
 * @param {string} orderId
 * @param {Object} data - { reason }
 */
export async function disputeReturnInspection(orderId, data) {
  try {
    const res = await axiosClient.post(`/orders/${orderId}/inspection/dispute`, data);
    return res.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Lấy danh sách khoảng thời gian váy đã có người đặt thuê kín lịch
 * @param {string} dressId
 */
export async function getDressBookedDates(dressId) {
  if (!dressId) return [];
  try {
    const res = await axiosClient.get(`/orders/dress/${dressId}/booked-dates`);
    return Array.isArray(res.data) ? res.data : (res.data?.data || res || []);
  } catch (error) {
    try {
      const res = await axiosClient.get('/orders/booked-dates', {
        params: { dressId },
      });
      return Array.isArray(res.data) ? res.data : (res.data?.data || res || []);
    } catch {
      return [];
    }
  }
}

/**
 * Lấy toàn bộ danh sách đơn thuê (Admin)
 * @param {Object} params - { status, search, page, limit }
 */
export async function getAllOrdersAdmin(params = {}) {
  try {
    const res = await axiosClient.get('/orders', { params });
    const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : res.data?.data || []);
    const total = res.pagination?.total ?? res.total ?? list.length;
    const page = res.pagination?.page ?? res.page ?? 1;
    const totalPages = res.pagination?.totalPages ?? res.totalPages ?? 1;
    const stats = res.stats || null;
    return {
      orders: list,
      total,
      page,
      totalPages,
      stats,
    };
  } catch (error) {
    return { orders: [], total: 0, page: 1, totalPages: 1, stats: null };
  }
}

/**
 * Lấy biên bản kiểm định trả váy theo orderId
 * @param {string} orderId
 */
export async function getReturnInspection(orderId) {
  try {
    const res = await axiosClient.get(`/orders/${orderId}/inspection`);
    return res.data?.data || res.data || null;
  } catch (error) {
    return null;
  }
}
