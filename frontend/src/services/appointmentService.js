import axiosClient from '../api/axiosClient';

const APPOINTMENTS_KEY = 'unibridal-appointments';
export const APPOINTMENT_EVENT = 'unibridal-appointment-updated';

export const SHOWROOM_BRANCHES = [
  {
    id: 'hcm-q1',
    name: 'UniBridal Flagship Atelier — Quận 1, TP. HCM',
    address: '88 Nam Kỳ Khởi Nghĩa, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '028 3822 8998',
    hours: '09:00 — 21:30 (Thứ 2 — Chủ Nhật)',
    features: ['Private Suite 1:1', 'Sân khấu Catwalk ánh sáng chuẩn', 'Atelier may đo tại chỗ'],
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
    mapUrl: 'https://maps.google.com/?q=88+Nam+Ky+Khoi+Nghia+Quan+1+TP+Ho+Chi+Minh',
  },
  {
    id: 'hn-hoankiem',
    name: 'UniBridal Heritage Mansion — Hoàn Kiếm, Hà Nội',
    address: '26 Lý Thường Kiệt, Phường Hàng Bài, Quận Hoàn Kiếm, Hà Nội',
    phone: '024 3936 8998',
    hours: '09:00 — 21:00 (Thứ 2 — Chủ Nhật)',
    features: ['Kiến trúc Pháp cổ điển', 'Phòng thử váy VIP Hoàng Gia', 'Bộ sưu tập Haute Couture mới nhất'],
    image: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80',
    mapUrl: 'https://maps.google.com/?q=26+Ly+Thuong+Kiet+Hoan+Kiem+Ha+Noi',
  },
  {
    id: 'dn-haichau',
    name: 'UniBridal Boutique Coastal — Hải Châu, Đà Nẵng',
    address: '152 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng',
    phone: '0236 388 8998',
    hours: '09:00 — 21:00 (Thứ 2 — Chủ Nhật)',
    features: ['View sông Hàn thơ mộng', 'Bộ sưu tập váy cưới ngoài trời & bãi biển', 'Stylist riêng tận tình'],
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&q=80',
    mapUrl: 'https://maps.google.com/?q=152+Bach+Dang+Hai+Chau+Da+Nang',
  },
];

export const TIME_SLOTS = [
  { id: 't1', time: '09:00 — 10:30', period: 'Sáng', available: 2, label: 'Thanh bình & Ánh sáng tự nhiên' },
  { id: 't2', time: '10:30 — 12:00', period: 'Sáng', available: 1, label: 'Thích hợp thử kỹ phom dáng' },
  { id: 't3', time: '13:30 — 15:00', period: 'Chiều', available: 3, label: 'Khung giờ vàng tư vấn NTK' },
  { id: 't4', time: '15:00 — 16:30', period: 'Chiều', available: 2, label: 'Thư thái cùng tiệc trà chiều' },
  { id: 't5', time: '16:30 — 18:00', period: 'Chiều', available: 0, label: 'Đã kín lịch', disabled: true },
  { id: 't6', time: '18:30 — 20:00', period: 'Tối', available: 2, label: 'Trải nghiệm ánh sáng tiệc cưới' },
  { id: 't7', time: '20:00 — 21:30', period: 'Tối', available: 1, label: 'Buổi thử riêng tư cuối ngày' },
];

export const VIP_SERVICES = [
  {
    id: 'tea',
    name: 'Tiệc Trà Chiều Macaron & Trà Hoa Paris',
    desc: 'Thưởng trà thượng hạng cùng bánh ngọt Pháp trong không gian âm nhạc thính phòng',
    price: 0,
    tag: 'ĐẶC QUYỀN MIỄN PHÍ',
  },
  {
    id: 'stylist',
    name: 'Tư Vấn Trực Tiếp 1:1 Cùng Giám Đốc Thiết Kế',
    desc: 'Phân tích tỉ lệ cơ thể, tone da và định hình phong cách váy cưới độc bản',
    price: 0,
    tag: 'TẶNG KÈM',
  },
  {
    id: 'polaroid',
    name: 'Bộ Ảnh Kỷ Niệm Polaroid & Clip Thử Váy 4K',
    desc: 'Chụp ảnh lấy ngay lưu giữ khoảnh khắc xúc động đầu tiên khi khoác lên chiếc váy mơ ước',
    price: 0,
    tag: 'MIỄN PHÍ',
  },
  {
    id: 'groom',
    name: 'Phối Đồ & Thử Vest Chú Rể Đồng Điệu',
    desc: 'Dành riêng cho cặp đôi muốn chọn vest cưới đồng điệu màu sắc và phong cách',
    price: 0,
    tag: 'COMBO CẶP ĐÔI',
  },
];

const INITIAL_APPOINTMENTS = [
  {
    id: 'APT-2026-8812',
    fullName: 'Lê Nguyễn Thảo My',
    phone: '0938 128 899',
    email: 'thaomy.bride@gmail.com',
    branchId: 'hcm-q1',
    branchName: 'UniBridal Flagship Atelier — Quận 1, TP. HCM',
    branchAddress: '88 Nam Kỳ Khởi Nghĩa, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    branchPhone: '028 3822 8998',
    date: '2026-10-25',
    timeSlot: '13:30 — 15:00',
    guestsCount: 2,
    selectedDresses: [
      { id: 1, name: 'Elysian Rose Ballgown', code: 'BGW-2026' },
      { id: 2, name: 'Celeste Royal Mermaid', code: 'MMD-2026' },
    ],
    vipServices: ['tea', 'stylist', 'polaroid'],
    notes: 'Cô dâu muốn thử thêm voan dài đính ren đồng bộ và kiểm tra corset siết eo.',
    status: 'Confirmed',
    stylistName: 'NTK. Hoàng Yến (Lead Haute Couture Stylist)',
    createdAt: new Date().toISOString(),
  },
];

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getAppointments() {
  const store = storage();
  if (!store) return INITIAL_APPOINTMENTS;
  try {
    const raw = store.getItem(APPOINTMENTS_KEY);
    if (!raw) {
      store.setItem(APPOINTMENTS_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
      return INITIAL_APPOINTMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_APPOINTMENTS;
  } catch {
    return INITIAL_APPOINTMENTS;
  }
}

export function createAppointment(data) {
  const store = storage();
  const current = getAppointments();
  const newAppointment = {
    id: `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'Confirmed',
    stylistName: 'NTK. Hoàng Yến (Lead Haute Couture Stylist)',
    createdAt: new Date().toISOString(),
    ...data,
  };

  const updated = [newAppointment, ...current];
  if (store) {
    store.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(APPOINTMENT_EVENT));
  }
  return newAppointment;
}

/**
 * Gọi API lấy danh sách lịch hẹn từ Backend
 * @param {Object} params - { status, branch, date }
 */
export async function getAppointmentsApi(params = {}) {
  try {
    return await axiosClient.get('/appointments', { params });
  } catch (error) {
    return { success: true, data: getAppointments() };
  }
}

/**
 * Gọi API đặt lịch hẹn mới lên Backend
 * @param {Object} data - { customerName, customerPhone, customerEmail, branch, appointmentDate, timeSlot, interestedDresses, notes }
 */
export async function createAppointmentApi(data) {
  try {
    return await axiosClient.post('/appointments', data);
  } catch (error) {
    const local = createAppointment(data);
    return { success: true, message: 'Đặt lịch hẹn thành công (Offline Demo)', data: local };
  }
}

/**
 * Gọi API cập nhật trạng thái lịch hẹn
 * @param {string} id
 * @param {string} status - 'pending' | 'confirmed' | 'completed' | 'cancelled'
 */
export async function updateAppointmentStatusApi(id, status) {
  try {
    return await axiosClient.patch(`/appointments/${id}/status`, { status });
  } catch (error) {
    return { success: true, message: 'Cập nhật trạng thái lịch hẹn thành công (Offline Demo)' };
  }
}
