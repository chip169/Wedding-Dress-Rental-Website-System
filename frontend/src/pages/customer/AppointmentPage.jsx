import { formatCurrencyVND } from '../../utils/formatCurrency';
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Check,
  CheckCircle2,
  Users,
  ShieldCheck,
  Phone,
  Mail,
  Heart,
  QrCode,
  Download,
  CalendarCheck,
  ChevronRight,
  Info,
  Gift,
  Coffee,
  Camera,
  Shirt,
  X,
  ArrowRight,
  Star,
  Crown,
  ExternalLink,
  Printer,
  CalendarPlus,
} from 'lucide-react';
import { message } from 'antd';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import {
  SHOWROOM_BRANCHES,
  TIME_SLOTS,
  VIP_SERVICES,
  createAppointment,
  createAppointmentApi,
} from '../../services/appointmentService';
import { getAllDresses } from '../../services/dressService';

// Helper: Format Vietnamese Date
function formatVietnameseDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month - 1, day);
      const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = daysOfWeek[d.getDay()];
      return `${dayName}, ngày ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

// Helper: Format Short Date (DD/MM/YYYY)
function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Helper: Build Google Calendar event URL
function buildGoogleCalendarUrl(booking) {
  if (!booking) return '#';
  try {
    const title = encodeURIComponent('Lịch Thử Váy Cưới Private Suite — UniBridal Atelier');
    const dateClean = (booking.date || '').replace(/-/g, '');
    let startTime = '133000';
    let endTime = '150000';
    if (booking.timeSlot && booking.timeSlot.includes('—')) {
      const [start, end] = booking.timeSlot.split('—').map((s) => s.trim().replace(':', ''));
      if (start) startTime = `${start}00`;
      if (end) endTime = `${end}00`;
    }
    const dates = `${dateClean}T${startTime}/${dateClean}T${endTime}`;
    const location = encodeURIComponent(`${booking.branchName || ''} - ${booking.branchAddress || ''}`);
    const details = encodeURIComponent(
      `Mã Check-in: ${booking.id}\nCô dâu vinh dự: ${booking.fullName}\nSĐT: ${booking.phone}\nĐịa chỉ: ${booking.branchAddress || ''}\nPhụ trách đón tiếp: ${booking.stylistName || 'NTK UniBridal'}\nTrân trọng đón tiếp nàng!`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&details=${details}`;
  } catch {
    return 'https://calendar.google.com';
  }
}

export default function AppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDressId = searchParams.get('dressId');

  // Step 1: Branch selection
  const [selectedBranchId, setSelectedBranchId] = useState('hcm-q1');

  // Step 2: Date & Time Slot selection
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(tomorrowStr);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState('t3');
  const [periodFilter, setPeriodFilter] = useState('all');

  // Step 3: Selected Dresses (Tối đa 2 mẫu: 1 mẫu chính + tối đa 1 mẫu đề xuất thêm)
  const [selectedDressIds, setSelectedDressIds] = useState(() => {
    if (initialDressId) {
      const parsed = Number(initialDressId);
      return !isNaN(parsed) && parsed > 0 ? [parsed] : [initialDressId];
    }
    return [];
  });
  const [isChangingPrimary, setIsChangingPrimary] = useState(false);

  // Step 4: VIP Services
  const [selectedServices, setSelectedServices] = useState(['tea', 'stylist', 'polaroid']);

  const { user, isLoggedIn } = useAuth();

  // Step 5: Bride Contact Info (Tự động điền nếu đã đăng nhập, để trống nếu chưa đăng nhập)
  const [fullName, setFullName] = useState(() => (isLoggedIn ? (user?.fullName || user?.name || '') : ''));
  const [phone, setPhone] = useState(() => (isLoggedIn ? (user?.phone || '') : ''));
  const [email, setEmail] = useState(() => (isLoggedIn ? (user?.email || '') : ''));
  const [guestsCount, setGuestsCount] = useState(2);
  const [weddingDate, setWeddingDate] = useState(() => (isLoggedIn ? (user?.weddingDate || '') : ''));
  const [notes, setNotes] = useState('');

  // Tự động đồng bộ nếu user đăng nhập sau khi load
  useEffect(() => {
    if (isLoggedIn && user) {
      if (user.fullName || user.name) setFullName(user.fullName || user.name);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
      if (user.weddingDate) setWeddingDate(user.weddingDate);
    }
  }, [isLoggedIn, user]);

  // Form Validation Errors
  const [errors, setErrors] = useState({});

  // Confirmation / Success State
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Active Branch
  const selectedBranch = useMemo(
    () => SHOWROOM_BRANCHES.find((b) => b.id === selectedBranchId) || SHOWROOM_BRANCHES[0],
    [selectedBranchId]
  );

  // Active Time Slot
  const selectedTimeSlot = useMemo(
    () => TIME_SLOTS.find((t) => t.id === selectedTimeSlotId) || TIME_SLOTS[2],
    [selectedTimeSlotId]
  );

  // Selected Dress Objects
  const [availableDresses, setAvailableDresses] = useState([]);
  const [dbError, setDbError] = useState('');

  useEffect(() => {
    let active = true;
    getAllDresses().then((res) => {
      if (!active) return;
      const list = res?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setAvailableDresses(list);
        if (initialDressId) {
          const matched = list.find(
            (d) => String(d.id) === String(initialDressId) ||
              String(d._id) === String(initialDressId) ||
              String(d.code) === String(initialDressId) ||
              Number(d.id) === Number(initialDressId)
          );
          if (matched) {
            setSelectedDressIds([matched.id]);
          }
        }
      }
    }).catch((err) => {
      console.error('Error loading dresses:', err);
      setAvailableDresses([]);
      setDbError('Lỗi kết nối cơ sở dữ liệu: Không thể tải danh sách lễ phục từ máy chủ.');
    });
    return () => { active = false; };
  }, []);

  const primaryDress = useMemo(() => {
    if (!availableDresses || availableDresses.length === 0 || selectedDressIds.length === 0) return null;
    const primaryId = selectedDressIds[0];
    return (
      availableDresses.find(
        (d) => String(d.id) === String(primaryId) || String(d._id) === String(primaryId) || String(d.code) === String(primaryId)
      ) || null
    );
  }, [availableDresses, selectedDressIds]);

  // Gợi ý 4 thiết kế phù hợp dựa trên phom dáng & phong cách váy chính
  const recommendedDresses = useMemo(() => {
    if (!availableDresses || availableDresses.length === 0 || !primaryDress) return [];
    const primaryId = primaryDress?.id;
    const others = availableDresses.filter(
      (d) => String(d.id) !== String(primaryId) && String(d._id) !== String(primaryId)
    );
    // Ưu tiên váy cùng silhouette hoặc chất liệu
    const sameStyle = others.filter((d) => d.silhouette === primaryDress?.silhouette);
    const diffStyle = others.filter((d) => d.silhouette !== primaryDress?.silhouette);
    return [...sameStyle, ...diffStyle].slice(0, 4);
  }, [availableDresses, primaryDress]);

  const chosenDresses = useMemo(() => {
    if (!availableDresses || availableDresses.length === 0 || selectedDressIds.length === 0) return [];
    return availableDresses.filter((d) =>
      selectedDressIds.some(
        (id) => String(d.id) === String(id) || String(d._id) === String(id)
      )
    );
  }, [availableDresses, selectedDressIds]);

  // Chọn / Bỏ chọn mẫu váy thứ 2 từ danh sách đề xuất (Tối đa 2 mẫu thử)
  const handleToggleSecondaryDress = (dressId) => {
    if (selectedDressIds.length === 0) {
      setSelectedDressIds([dressId]);
      message.success('Đã chọn mẫu váy cưới chính.');
      return;
    }
    if (String(selectedDressIds[0]) === String(dressId)) {
      message.info('Đây là mẫu váy cưới chính của nàng.');
      return;
    }
    if (selectedDressIds.some((id) => String(id) === String(dressId))) {
      setSelectedDressIds([selectedDressIds[0]]);
      message.success('Đã bỏ bớt mẫu váy thử.');
    } else {
      setSelectedDressIds([selectedDressIds[0], dressId]);
      message.success('Đã thêm mẫu váy thứ 2 vào lịch thử (Tối đa 2 mẫu).');
    }
  };

  // Bỏ chọn toàn bộ váy
  const handleRemovePrimaryDress = () => {
    setSelectedDressIds([]);
    setIsChangingPrimary(false);
    message.info('Đã bỏ chọn mẫu váy.');
  };

  // Đổi mẫu váy chính
  const handleSelectPrimaryDress = (dressId) => {
    const secondary = selectedDressIds.slice(1);
    setSelectedDressIds([dressId, ...secondary]);
    setIsChangingPrimary(false);
    if (errors.dresses) {
      setErrors((prev) => ({ ...prev, dresses: null }));
    }
    message.success('Đã chọn mẫu váy cưới chính.');
  };

  // Filtered Time Slots
  const filteredTimeSlots = useMemo(() => {
    if (periodFilter === 'all') return TIME_SLOTS;
    return TIME_SLOTS.filter((slot) => slot.period.toLowerCase() === periodFilter.toLowerCase());
  }, [periodFilter]);

  // Toggle dress selection
  const handleToggleDress = (dressId) => {
    if (selectedDressIds.includes(dressId)) {
      if (selectedDressIds.length === 1) {
        message.warning('Nàng dâu vui lòng giữ tối thiểu 1 mẫu váy để Atelier chuẩn bị trước.');
        return;
      }
      setSelectedDressIds(selectedDressIds.filter((id) => id !== dressId));
    } else {
      if (selectedDressIds.length >= 5) {
        message.info('Mỗi buổi thử váy Private Suite chuẩn bị tối đa 5 mẫu váy để đảm bảo trải nghiệm chu đáo nhất.');
        return;
      }
      setSelectedDressIds([...selectedDressIds, dressId]);
    }
  };

  // Toggle VIP Service
  const handleToggleService = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  // Validate form
  const validateForm = () => {
    const errs = {};
    if (!fullName.trim()) {
      errs.fullName = 'Vui lòng nhập họ và tên cô dâu';
    }
    if (!phone.trim()) {
      errs.phone = 'Vui lòng nhập số điện thoại liên hệ';
    } else {
      const cleanPhone = phone.replace(/[\s.-]/g, '');
      if (!/^[0-9]{9,11}$/.test(cleanPhone)) {
        errs.phone = 'Số điện thoại không hợp lệ (từ 9 đến 11 số)';
      }
    }
    if (!email.trim()) {
      errs.email = 'Vui lòng nhập email nhận thư xác nhận';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Email không hợp lệ (ví dụ: thaomy@gmail.com)';
    }
    if (selectedDressIds.length === 0) {
      errs.dresses = 'Vui lòng chọn ít nhất 1 mẫu váy cưới nàng muốn thử';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit appointment
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      message.error('Vui lòng kiểm tra lại thông tin còn thiếu trên biểu mẫu.');
      return;
    }

    const appointmentData = {
      fullName: fullName.trim(),
      customerName: fullName.trim(),
      phone: phone.trim(),
      customerPhone: phone.trim(),
      email: email.trim(),
      customerEmail: email.trim(),
      branchId: selectedBranch.id,
      branch: selectedBranch.id,
      branchName: selectedBranch.name,
      branchAddress: selectedBranch.address,
      branchPhone: selectedBranch.phone,
      branchMapUrl: selectedBranch.mapUrl,
      date: selectedDate,
      appointmentDate: selectedDate,
      timeSlot: selectedTimeSlot.time,
      timeSlotPeriod: selectedTimeSlot.period,
      guestsCount,
      weddingDate: weddingDate || null,
      selectedDresses: chosenDresses.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        silhouette: d.silhouette,
        price: d.price,
        image: d.images?.[0],
      })),
      vipServices: [],
      notes: notes.trim(),
    };

    try {
      const res = await createAppointmentApi(appointmentData);
      const result = res?.data || createAppointment(appointmentData);
      setConfirmedBooking(result);
      message.success('Đặt lịch hẹn Private Suite thành công!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const localResult = createAppointment(appointmentData);
      setConfirmedBooking(localResult);
      message.success('Đặt lịch hẹn Private Suite thành công!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Print invitation handler
  const handlePrintInvitation = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2523] flex flex-col font-jakarta selection:bg-[#FCEEE9] selection:text-[#B8737D]">
      {/* Header hidden on print */}
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9">

        {confirmedBooking ? (
          /* ================= SUCCESS CONFIRMATION INVITATION ================= */
          <div className="max-w-[820px] mx-auto animate-fade-in my-2 sm:my-4">

            {/* Top Status Header */}
            <div className="text-center mb-8 print:hidden">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#E8F5E9] to-[#C8E6C9] text-[#2E7D32] flex items-center justify-center mx-auto mb-3 shadow-[0_4px_16px_rgba(46,125,50,0.15)] ring-4 ring-white">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0EC] text-[#B8737D] text-[11.5px] font-bold tracking-[1.5px] uppercase border border-[#F2D8D4] mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                XÁC NHẬN ĐẶT LỊCH HẸN PRIVATE SUITE THÀNH CÔNG
              </span>
              <h1 className="font-jakarta text-[26px] sm:text-[34px] font-extrabold text-[#2C2523] mt-2 mb-2 leading-tight tracking-tight">
                Hẹn Gặp Nàng Tại UniBridal Private Suite
              </h1>
              <p className="text-[14px] sm:text-[15px] text-[#6B5C5D] max-w-[620px] mx-auto leading-relaxed">
                Đặc quyền phòng thử riêng tư 1:1 đã được chuẩn bị sẵn sàng để chào đón quý cô{' '}
                <span className="font-bold text-[#733F49] whitespace-nowrap">{confirmedBooking.fullName}</span>{' '}
                cùng người thân.
              </p>
              <div className="mt-3.5 inline-flex items-center gap-2 bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] px-4 py-2 rounded-xl text-[13px] font-medium shadow-xs">
                <Mail className="w-4 h-4 text-[#16a34a] shrink-0" />
                <span>Toàn bộ thông tin lịch hẹn & mã check-in đã được gửi tới email <strong>{confirmedBooking.email}</strong></span>
              </div>
            </div>

            {/* Luxury Invitation Pass (VIP Golden / Champagne Atelier Pass) */}
            <div
              id="invitation-card"
              className="bg-white rounded-3xl border border-[#EEDECF] shadow-[0_16px_50px_rgba(115,63,73,0.12)] overflow-hidden relative mb-8 print:shadow-none print:border-2 print:border-[#D4AF37] print:m-0"
            >
              {/* Luxury Top Accent Ribbon with Foil Gold Gradient */}
              <div className="h-3.5 bg-gradient-to-r from-[#733F49] via-[#D4AF37] to-[#B8737D]" />

              <div className="p-6 sm:p-10 space-y-7">

                {/* Invitation Card Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-[#F0E5DC] text-center sm:text-left gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[2px] uppercase text-[#D4AF37]">
                      <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>VIP PRIVATE ATELIER INVITATION</span>
                      <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </div>
                    <h2 className="font-jakarta text-[20px] sm:text-[24px] font-extrabold text-[#2C2523] m-0 tracking-tight">
                      GIẤY MỜI DANH DỰ THỬ LỄ PHỤC CƯỚI
                    </h2>
                    <p className="text-[12px] text-[#847374] m-0">
                      Hệ thống phòng thử váy cô dâu tiêu chuẩn Haute Couture độc bản
                    </p>
                  </div>
                  <div className="text-center sm:text-right shrink-0">
                    <span className="text-[10.5px] uppercase font-bold text-[#847374] block tracking-wider mb-1">
                      MÃ CHECK-IN TẠI QUẦY
                    </span>
                    <span className="font-mono text-[17px] font-extrabold text-[#733F49] bg-[#FAF0EC] px-3.5 py-1.5 rounded-xl border border-[#F2D8D4] shadow-xs inline-block">
                      {confirmedBooking.id}
                    </span>
                  </div>
                </div>

                {/* Primary Booking Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[13.5px]">

                  {/* Bride Info Box */}
                  <div className="bg-[#FCF9F6] p-5 rounded-2xl border border-[#EEDECF]/90 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10.5px] font-bold text-[#847374] tracking-wider uppercase block mb-1">
                        CÔ DÂU VINH DỰ & ĐOÀN ĐỒNG HÀNH
                      </span>
                      <div className="font-jakarta font-bold text-[18px] text-[#2C2523] leading-snug">
                        {confirmedBooking.fullName}
                      </div>
                      <div className="text-[12.5px] text-[#733F49] font-medium mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{confirmedBooking.phone}</span>
                        <span>•</span>
                        <span className="truncate max-w-[200px]">{confirmedBooking.email}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#EEDECF]/60 flex items-center justify-between text-[12px] text-[#6B5C5D]">
                      <span>Số người cùng trải nghiệm:</span>
                      <strong className="text-[#2C2523] font-bold">{confirmedBooking.guestsCount} khách</strong>
                    </div>

                    {confirmedBooking.weddingDate && (
                      <div className="text-[11.5px] text-[#847374] bg-white px-2.5 py-1.5 rounded-lg border border-[#EEDECF] flex items-center justify-between">
                        <span>Ngày cưới dự kiến:</span>
                        <strong className="text-[#733F49]">{formatShortDate(confirmedBooking.weddingDate)}</strong>
                      </div>
                    )}
                  </div>

                  {/* Time & Slot Box */}
                  <div className="bg-[#FCF9F6] p-5 rounded-2xl border border-[#EEDECF]/90 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10.5px] font-bold text-[#847374] tracking-wider uppercase block mb-1">
                        THỜI GIAN & KHUNG GIỜ VÀNG
                      </span>
                      <div className="font-jakarta font-extrabold text-[18px] text-[#733F49]">
                        {confirmedBooking.timeSlot}
                      </div>
                      <div className="text-[14px] font-semibold text-[#2C2523] mt-1 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#B8737D]" />
                        <span>{formatVietnameseDate(confirmedBooking.date)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#EEDECF]/60 space-y-1">
                      <div className="text-[12px] text-[#2E7D32] font-semibold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Phòng thử Suite riêng tư 90 phút trọn vẹn</span>
                      </div>
                      <div className="text-[11px] text-[#847374]">
                        ✦ Váy được hấp sấy tiệt trùng & ủi phẳng trước 2 giờ
                      </div>
                    </div>
                  </div>

                </div>

                {/* Showroom Atelier Location Box */}
                <div className="bg-[#FAF4EE] p-5 rounded-2xl border border-[#EEDECF] flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#EEDECF] text-[#B8737D] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <MapPin className="w-5 h-5 text-[#B8737D]" />
                    </div>
                    <div>
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#733F49] block mb-0.5">
                        ĐỊA ĐIỂM SHOWROOM ATELIER ĐÓN TIẾP
                      </span>
                      <div className="font-jakarta font-bold text-[16px] text-[#2C2523]">
                        {confirmedBooking.branchName}
                      </div>
                      <div className="text-[12.5px] text-[#6B5C5D] mt-1">
                        {confirmedBooking.branchAddress || 'Chi nhánh trung tâm UniBridal'}
                      </div>
                      <div className="text-[12px] text-[#733F49] font-medium mt-1">
                        Hotline showroom: <strong>{confirmedBooking.branchPhone || '1800 8998'}</strong> • Phụ trách đón tiếp: <strong>{confirmedBooking.stylistName}</strong>
                      </div>
                    </div>
                  </div>

                  {confirmedBooking.branchMapUrl && (
                    <a
                      href={confirmedBooking.branchMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#EEDECF] hover:bg-[#FAF0EC] text-[#733F49] text-[12px] font-bold transition-all no-underline shrink-0 shadow-2xs print:hidden"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Xem bản đồ</span>
                    </a>
                  )}
                </div>

                {/* Selected Dresses Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#847374]">
                      DANH SÁCH {confirmedBooking.selectedDresses?.length || 0} MẪU VÁY CƯỚI CHUẨN BỊ SẴN TRONG PHÒNG THỬ:
                    </span>
                    <span className="text-[11px] text-[#733F49] font-semibold">
                      Chuẩn bị đúng số đo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {confirmedBooking.selectedDresses?.map((dress) => (
                      <div
                        key={dress.id}
                        className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FCF9F6] border border-[#EEDECF] hover:border-[#D8C7B8] transition-all"
                      >
                        {dress.image && (
                          <img
                            src={dress.image}
                            alt={dress.name}
                            className="w-12 h-16 object-cover rounded-xl shrink-0 border border-[#EEDECF] shadow-2xs"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-jakarta font-bold text-[14.5px] text-[#2C2523] truncate">
                            {dress.name}
                          </div>
                          <div className="text-[11.5px] text-[#847374] mt-0.5">
                            Mã: <span className="font-mono text-[#733F49] font-bold">{dress.code}</span>
                            {dress.silhouette && ` • ${dress.silhouette}`}
                          </div>
                          {dress.price && (
                            <div className="text-[11px] font-bold text-[#733F49] mt-0.5">
                              Giá thuê niêm yết: {formatCurrencyVND(dress.price)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected VIP Amenities Badges */}
                {confirmedBooking.vipServices && confirmedBooking.vipServices.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#847374] block mb-2">
                      ĐẶC QUYỀN TRẢI NGHIỆM ĐI KÈM ĐÃ ĐẶT:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {confirmedBooking.vipServices.map((srv, idx) => (
                        <div
                          key={srv.id || idx}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FAF0EC]/60 border border-[#F2D8D4] text-[12px]"
                        >
                          <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-[#2C2523] block truncate">{srv.name}</span>
                            <span className="text-[10px] text-[#733F49] font-medium">{srv.tag || 'MIỄN PHÍ'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes from Bride (if any) */}
                {confirmedBooking.notes && (
                  <div className="p-3.5 rounded-xl bg-[#FCF9F6] border border-[#EEDECF] text-[12px] text-[#6B5C5D]">
                    <span className="font-bold text-[#733F49] uppercase text-[10.5px] block mb-0.5">
                      YÊU CẦU & GHI CHÚ RIÊNG TỪ CÔ DÂU:
                    </span>
                    <p className="m-0 italic">"{confirmedBooking.notes}"</p>
                  </div>
                )}

                {/* QR Code Check-in Pass Strip */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FCF9F6] border border-[#EEDECF] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-16 h-16 bg-white p-1.5 rounded-2xl border border-[#EEDECF] flex items-center justify-center shrink-0 shadow-sm">
                      <QrCode className="w-12 h-12 text-[#2C2523]" />
                    </div>
                    <div>
                      <div className="font-bold text-[13.5px] text-[#2C2523]">
                        Mã QR Thẻ Khách Hàng Danh Dự
                      </div>
                      <div className="text-[11.5px] text-[#847374] leading-relaxed max-w-[380px]">
                        Xuất trình mã này tại quầy tiếp tân để chuyên viên hướng dẫn nàng bước thẳng vào Private Suite.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 print:hidden">
                    {/* Add to Google Calendar Button */}
                    <a
                      href={buildGoogleCalendarUrl(confirmedBooking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-[#EEDECF] hover:bg-[#FAF0EC] text-[#2C2523] text-[12px] font-bold flex items-center gap-1.5 transition-colors no-underline shadow-2xs"
                      title="Thêm lịch hẹn vào Google Calendar"
                    >
                      <CalendarPlus className="w-4 h-4 text-[#733F49]" />
                      <span>Thêm Calendar</span>
                    </a>

                    {/* Print / Save Invitation */}
                    <button
                      type="button"
                      onClick={handlePrintInvitation}
                      className="px-4 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="In hoặc tải thiệp mời PDF"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Lưu Thiệp Mời</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Card Footer Actions (hidden on print) */}
              <div className="bg-[#FAF4EE] px-6 sm:px-10 py-5 border-t border-[#EEDECF] flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                <Link
                  to="/collection"
                  className="text-[13px] font-semibold text-[#733F49] hover:text-[#5F323B] hover:underline flex items-center gap-1.5 no-underline transition-colors"
                >
                  <span>Xem thêm bộ sưu tập váy cưới mới</span>
                  <span>→</span>
                </Link>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedBooking(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-white border border-[#EEDECF] text-[#2C2523] text-[13px] font-bold hover:bg-[#FAF0EC] transition-colors cursor-pointer shadow-2xs"
                  >
                    Đặt Thêm Lịch Mới
                  </button>
                  <Link
                    to="/"
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white text-[13px] font-bold transition-all text-center no-underline shadow-xs"
                  >
                    Về Trang Chủ
                  </Link>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* ================= MAIN BOOKING FORM INTERFACE ================= */
          <div className="space-y-7 sm:space-y-8 font-jakarta">

            {/* Page Header */}
            <div className="mb-2 sm:mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0EC] text-[#733F49] text-[11px] font-bold tracking-[1.5px] uppercase border border-[#F2D8D4] mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                TRẢI NGHIỆM THỬ VÁY RIÊNG TƯ 1:1
              </span>
              <h1 className="font-jakarta text-[24px] sm:text-[30px] font-extrabold text-[#2C2523] m-0 tracking-tight leading-tight">
                Đặt Lịch Hẹn Thử Váy Cưới Private Suite
              </h1>
              <p className="text-[13px] sm:text-[14px] text-[#6B5C5D] mt-1.5 max-w-2xl leading-relaxed">
                Không gian Atelier chuẩn bị riêng cho nàng và người thân, cùng chuyên viên tư vấn phục trang cao cấp hoàn toàn miễn phí.
              </p>
            </div>

            {/* Main Form Content */}
            <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* LEFT COLUMN: All Steps (col-span-8) */}
              <div className="lg:col-span-8 space-y-8">

                {/* BƯỚC 1: CHỌN SHOWROOM */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F5EDE8] mb-5">
                    <span className="w-7 h-7 rounded-full bg-[#733F49] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                      1
                    </span>
                    <div>
                      <h2 className="font-jakarta text-[18px] sm:text-[20px] font-bold text-[#2C2523] m-0">
                        Chọn Showroom Atelier Trải Nghiệm
                      </h2>
                      <p className="text-[12px] text-[#847374] m-0 mt-0.5">
                        Mỗi không gian Private Suite chỉ phục vụ tối đa 1 cô dâu tại cùng một khung giờ
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {SHOWROOM_BRANCHES.map((branch) => {
                      const isSelected = selectedBranchId === branch.id;
                      return (
                        <div
                          key={branch.id}
                          onClick={() => setSelectedBranchId(branch.id)}
                          className={`rounded-2xl border overflow-hidden cursor-pointer transition-all flex flex-col justify-between ${isSelected
                            ? 'border-[#733F49] ring-2 ring-[#733F49]/20 bg-[#FAF4EE] shadow-sm'
                            : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white hover:border-[#D8C7B8]'
                            }`}
                        >
                          <div className="h-36 sm:h-40 w-full overflow-hidden relative">
                            <img
                              src={branch.image}
                              alt={branch.name}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                            {isSelected && (
                              <span className="absolute top-2.5 right-2.5 bg-[#733F49] text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                                <Check className="w-3 h-3" /> Đang chọn
                              </span>
                            )}
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-jakarta font-bold text-[14.5px] sm:text-[15px] text-[#2C2523] m-0 mb-1 leading-snug">
                                <span>{branch.shortName || branch.name.split(' — ')[0]}</span>
                                {(branch.location || branch.name.includes(' — ')) && (
                                  <>
                                    <span className="text-[#847374] font-normal mx-1.5">—</span>
                                    <span className="whitespace-nowrap text-[#733F49] font-bold">
                                      {branch.location || branch.name.split(' — ')[1]}
                                    </span>
                                  </>
                                )}
                              </h3>
                              <p className="text-[11.5px] text-[#6B5C5D] leading-relaxed mb-2.5 m-0 line-clamp-2">
                                <MapPin className="w-3 h-3 text-[#B8737D] inline mr-1" />
                                {branch.address}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-[#EEDECF]/60">
                              <span className="text-[10px] text-[#847374] block mb-1">Đặc quyền chi nhánh:</span>
                              <div className="flex flex-wrap gap-1">
                                {branch.features.map((f, i) => (
                                  <span
                                    key={i}
                                    className="text-[9.5px] font-medium bg-white px-2 py-0.5 rounded-md border border-[#EEDECF] text-[#733F49]"
                                  >
                                    ✦ {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* BƯỚC 2: CHỌN NGÀY & KHUNG GIỜ VÀNG */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F5EDE8] mb-5">
                    <span className="w-7 h-7 rounded-full bg-[#733F49] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                      2
                    </span>
                    <div>
                      <h2 className="font-jakarta text-[18px] sm:text-[20px] font-bold text-[#2C2523] m-0">
                        Chọn Thời Gian Thử Váy
                      </h2>
                      <p className="text-[12px] text-[#847374] m-0 mt-0.5">
                        Thời lượng 90 phút riêng tư, chuyên viên tư vấn phục vụ 1:1 trọn vẹn
                      </p>
                    </div>
                  </div>

                  {/* Date Input & Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5 items-end">
                    <div className="md:col-span-5">
                      <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                        NGÀY HẸN THỬ VÁY *
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-[#B8737D] absolute left-3.5 top-3" />
                        <input
                          type="date"
                          min={tomorrowStr}
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl pl-10 pr-3.5 py-2.5 text-[14px] text-[#2C2523] font-bold focus:outline-none focus:border-[#733F49] focus:bg-white"
                        />
                      </div>

                    </div>

                    <div className="md:col-span-7">
                      <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#847374] mb-1.5">
                        LỌC BUỔI TRONG NGÀY
                      </label>
                      <div className="flex items-center gap-1.5 bg-[#FAF4EE] p-1 rounded-xl border border-[#EEDECF]">
                        {[
                          { id: 'all', label: 'Tất cả' },
                          { id: 'Sáng', label: 'Buổi Sáng' },
                          { id: 'Chiều', label: 'Buổi Chiều' },
                          { id: 'Tối', label: 'Buổi Tối' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPeriodFilter(p.id)}
                            className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold transition-all border-0 cursor-pointer ${periodFilter === p.id
                              ? 'bg-[#733F49] text-white shadow-2xs'
                              : 'bg-transparent text-[#6B5C5D] hover:text-[#2C2523]'
                              }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Time Slots Grid */}
                  <div>
                    <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-2.5">
                      KHUNG GIỜ KHẢ DỤNG (90 PHÚT / CA THỬ)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {filteredTimeSlots.map((slot) => {
                        const isSelected = selectedTimeSlotId === slot.id;
                        const isDisabled = slot.disabled || slot.available === 0;
                        return (
                          <div
                            key={slot.id}
                            onClick={() => !isDisabled && setSelectedTimeSlotId(slot.id)}
                            className={`rounded-xl p-3 border transition-all text-left ${isDisabled
                              ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                              : isSelected
                                ? 'border-[#733F49] bg-[#FAF3F0] ring-1 ring-[#733F49] shadow-2xs cursor-pointer'
                                : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white cursor-pointer'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-jakarta font-bold text-[14px] text-[#2C2523]">
                                {slot.time}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDisabled
                                  ? 'bg-gray-200 text-gray-500'
                                  : slot.available === 1
                                    ? 'bg-[#FFEBEE] text-[#C62828]'
                                    : 'bg-[#E8F5E9] text-[#2E7D32]'
                                  }`}
                              >
                                {isDisabled ? 'Hết chỗ' : `Còn ${slot.available} chỗ`}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#847374] m-0 line-clamp-1">
                              {slot.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* BƯỚC 3: CHỌN MẪU VÁY CƯỚI (1 VÁY CHÍNH + ĐỀ XUẤT TỐI ĐA 2 MẪU THỬ) */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F5EDE8] mb-5 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#733F49] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                        3
                      </span>
                      <div>
                        <h2 className="font-jakarta text-[18px] sm:text-[20px] font-bold text-[#2C2523] m-0">
                          Chọn Mẫu Váy Cưới Nàng Muốn Thử
                        </h2>
                        <p className="text-[12px] text-[#847374] m-0 mt-0.5">
                          1 mẫu thiết kế chính và tối đa 1 mẫu tương đồng thử kèm
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-[#FAF0EC] border border-[#F2D8D4] text-[#733F49] font-bold text-[11px]">
                        Đã chọn: {selectedDressIds.length} / 2 mẫu thử VIP
                      </span>
                    </div>
                  </div>

                  {errors.dresses && (
                    <div className="text-[12px] text-red-600 font-medium mb-3">
                      {errors.dresses}
                    </div>
                  )}

                  {/* 1. MẪU VÁY CHÍNH ĐÃ CHỌN HOẶC CHƯA CHỌN */}
                  {!primaryDress ? (
                    <div className="p-5 sm:p-6 rounded-2xl bg-[#FCF9F6] border border-[#EEDECF] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0E5DC]">
                        <div>
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1">
                            <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Vui Lòng Chọn Mẫu Váy Cưới Nàng Muốn Thử</span>
                          </div>
                          <p className="text-[12.5px] text-[#6B5C5D] m-0">
                            Click vào một mẫu thiết kế bên dưới để phòng thử chuẩn bị trước giờ hẹn (tối đa 2 mẫu):
                          </p>
                        </div>
                        <Link
                          to="/collection"

                          className="text-[12px] font-bold text-[#733F49] hover:underline flex items-center gap-1 shrink-0"
                        >
                          <span>Xem toàn bộ BST</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {availableDresses.length === 0 ? (
                        <div className="p-8 text-center text-[#847374] text-[13px]">
                          Đang tải danh sách lễ phục từ showroom...
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                          {availableDresses.map((dress) => (
                            <div
                              key={dress.id}
                              onClick={() => handleSelectPrimaryDress(dress.id)}
                              className="rounded-xl border border-[#EEDECF] bg-white p-2.5 cursor-pointer hover:border-[#733F49] hover:shadow-xs transition-all flex flex-col justify-between group"
                            >
                              <div className="aspect-[3/4] w-full rounded-lg overflow-hidden relative mb-2">
                                <img
                                  src={dress.images?.[0] || dress.image}
                                  alt={dress.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className="absolute bottom-1.5 left-1.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                                  {dress.silhouette}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-jakarta text-[12.5px] font-bold text-[#2C2523] truncate m-0 leading-tight">
                                  {dress.name}
                                </h4>
                                <div className="text-[11px] font-bold text-[#733F49] mt-1">
                                  {formatCurrencyVND(dress.price || dress.rentPrice)}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="mt-2.5 w-full py-1.5 rounded-lg bg-[#FAF0EC] text-[#733F49] text-[11px] font-bold group-hover:bg-[#733F49] group-hover:text-white transition-colors cursor-pointer border border-[#F2D8D4]"
                              >
                                + Chọn thử mẫu này
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#733F49] flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                          Mẫu Váy Chính Nàng Đã Chọn
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setIsChangingPrimary(!isChangingPrimary)}
                            className="text-[11.5px] font-bold text-[#733F49] hover:text-[#582A33] underline underline-offset-4 cursor-pointer transition-colors"
                          >
                            {isChangingPrimary ? '← Đóng danh sách' : '✦ Đổi sang mẫu chính khác'}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemovePrimaryDress}
                            className="text-[11.5px] font-bold text-[#847374] hover:text-red-600 cursor-pointer transition-colors"
                          >
                            ✕ Bỏ chọn
                          </button>
                        </div>
                      </div>

                      {!isChangingPrimary ? (
                        /* Card Váy Chính VIP Suite */
                        <div className="rounded-2xl border border-[#B8737D]/40 bg-gradient-to-br from-[#FFFDFC] to-[#FAF3F0] p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
                          <div className="w-full sm:w-40 aspect-[3/4] sm:aspect-auto sm:h-52 rounded-xl overflow-hidden shrink-0 border border-[#EEDECF] relative shadow-xs">
                            <img
                              src={primaryDress?.images?.[0] || primaryDress?.image}
                              alt={primaryDress?.name}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-2 left-2 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                              {primaryDress?.silhouette || 'Haute Couture'}
                            </span>
                          </div>

                          <div className="flex-1 w-full flex flex-col justify-between self-stretch">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="px-2 py-0.5 rounded-full bg-[#FAF0EC] text-[#733F49] text-[10px] font-bold uppercase tracking-wider">
                                  {primaryDress?.collectionTag || 'ATELIER HAUTE COUTURE'}
                                </span>
                                {primaryDress?.code && (
                                  <span className="text-[11px] font-mono font-semibold text-[#847374]">
                                    #{primaryDress.code}
                                  </span>
                                )}
                              </div>

                              <h3 className="font-jakarta text-[19px] sm:text-[21px] font-bold text-[#2C2523] m-0 mb-1 leading-snug">
                                {primaryDress?.name}
                              </h3>

                              <p className="text-[12px] text-[#6B5C5D] leading-relaxed mb-3 m-0 line-clamp-2">
                                {primaryDress?.description || 'Thiết kế thủ công tinh xảo, đính kết ren và pha lê cao cấp chuẩn bị riêng cho nàng.'}
                              </p>

                              <div className="grid grid-cols-2 gap-3 mb-3 p-3 rounded-xl bg-white/80 border border-[#F0E5DC]">
                                <div>
                                  <span className="text-[10.5px] text-[#847374] block">Giá thuê niêm yết:</span>
                                  <strong className="text-[13.5px] font-jakarta text-[#733F49] font-bold">
                                    {formatCurrencyVND(primaryDress?.price || primaryDress?.rentPrice)}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[10.5px] text-[#847374] block">Cọc bảo lãnh hoàn trả:</span>
                                  <strong className="text-[13.5px] font-jakarta text-[#2C2523] font-bold">
                                    {formatCurrencyVND(primaryDress?.depositAmount || 15000000)}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Chọn mẫu chính khác */
                        <div className="p-4 rounded-2xl bg-[#FCF9F6] border border-[#EEDECF]">
                          <p className="text-[12px] text-[#6B5C5D] mb-3 m-0">Click vào một mẫu váy dưới đây để đặt làm mẫu chính:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {availableDresses.map((dress) => {
                              const isSelected = String(primaryDress?.id) === String(dress.id);
                              return (
                                <div
                                  key={dress.id}
                                  onClick={() => handleSelectPrimaryDress(dress.id)}
                                  className={`rounded-xl border p-2 cursor-pointer transition-all flex flex-col justify-between ${isSelected ? 'border-[#733F49] ring-2 ring-[#733F49]/30 bg-white' : 'border-[#EEDECF] bg-white hover:border-[#B8737D]'}`}
                                >
                                  <div className="aspect-[3/4] w-full rounded-lg overflow-hidden relative mb-1.5">
                                    <img src={dress.images?.[0] || dress.image} alt={dress.name} className="w-full h-full object-cover" />
                                    {isSelected && (
                                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#733F49] text-white flex items-center justify-center">
                                        <Check className="w-3 h-3" />
                                      </div>
                                    )}
                                  </div>
                                  <h4 className="font-jakarta text-[12px] font-bold text-[#2C2523] truncate m-0">{dress.name}</h4>
                                  <span className="text-[10.5px] text-[#733F49] font-bold">{formatCurrencyVND(dress.price || dress.rentPrice)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. ĐỀ XUẤT CÁC MẪU VÁY TƯƠNG ĐỒNG PHÙ HỢP (CHỌN THÊM TỐI ĐA 1 MẪU - CHỈ HIỂN THỊ KHI ĐÃ CÓ VÁY CHÍNH) */}
                  {primaryDress && (
                    <div className="pt-4 border-t border-[#F5EDE8]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 gap-1">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8737D] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#B8737D]" />
                            Gợi Ý Thiết Kế Tương Đồng Dành Riêng Cho Nàng
                          </span>
                        </div>
                        <span className="text-[11px] text-[#733F49] font-semibold">
                          {selectedDressIds.length === 2 ? '✓ Đã chọn đủ 2 mẫu' : '+ Có thể chọn thêm 1 mẫu'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        {recommendedDresses.map((dress) => {
                          const isChosenAsSecondary = selectedDressIds.slice(1).some(
                            (id) => String(id) === String(dress.id) || String(id) === String(dress._id)
                          );
                          return (
                            <div
                              key={dress.id}
                              onClick={() => handleToggleSecondaryDress(dress.id)}
                              className={`rounded-xl border overflow-hidden cursor-pointer transition-all flex flex-col justify-between relative group ${isChosenAsSecondary
                                ? 'border-[#733F49] ring-2 ring-[#733F49]/30 bg-[#FAF4EE] shadow-sm'
                                : 'border-[#EEDECF] bg-[#FCF9F6] hover:bg-white hover:border-[#D8C7B8]'
                                }`}
                            >
                              <div className="aspect-[3/4] w-full overflow-hidden relative">
                                <img
                                  src={dress.images?.[0] || dress.image}
                                  alt={dress.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />

                                <span className="absolute bottom-1.5 left-1.5 text-[8.5px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                                  {dress.silhouette}
                                </span>
                              </div>

                              <div className="p-2.5 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-jakarta font-bold text-[13px] text-[#2C2523] m-0 mb-0.5 truncate leading-tight">
                                    {dress.name}
                                  </h4>
                                  <div className="text-[11px] font-bold text-[#733F49] mb-2">
                                    {formatCurrencyVND(dress.price || dress.rentPrice)}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className={`w-full py-1 text-[10.5px] font-bold rounded-lg border transition-colors cursor-pointer ${isChosenAsSecondary
                                    ? 'bg-[#733F49] text-white border-[#733F49]'
                                    : 'bg-white text-[#733F49] border-[#EEDECF] hover:bg-[#FAF0EC]'
                                    }`}
                                >
                                  {isChosenAsSecondary ? '✓ Đang chọn thử kèm' : '+ Thử mẫu này'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                {/* BƯỚC 4: THÔNG TIN LIÊN HỆ CÔ DÂU */}
                <section className="bg-white rounded-2xl border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)] p-6 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F5EDE8] mb-5">
                    <span className="w-7 h-7 rounded-full bg-[#733F49] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                      4
                    </span>
                    <div>
                      <h2 className="font-jakarta text-[18px] sm:text-[20px] font-bold text-[#2C2523] m-0">
                        Thông Tin Đón Tiếp Cô Dâu
                      </h2>
                      <p className="text-[12px] text-[#847374] m-0 mt-0.5">
                        Chuyên viên tư vấn sẽ liên hệ xác nhận lịch và chuẩn bị chu đáo nhất
                      </p>

                      {isLoggedIn && (
                        <p className="text-[12px] text-[#2E7D32] font-semibold m-0 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                          Tự động điền thông tin từ tài khoản ({user?.fullName || user?.name || user?.email})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          HỌ VÀ TÊN CÔ DÂU *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (errors.fullName) setErrors({ ...errors, fullName: null });
                          }}
                          className={`w-full bg-[#FCF9F6] border rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:bg-white ${errors.fullName ? 'border-red-500' : 'border-[#EEDECF] focus:border-[#733F49]'
                            }`}
                          placeholder="Nhập họ tên cô dâu"
                        />
                        {errors.fullName && (
                          <span className="text-[11px] text-red-600 mt-1 block">{errors.fullName}</span>
                        )}
                      </div>

                      <div>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          SỐ ĐIỆN THOẠI *
                        </label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (errors.phone) setErrors({ ...errors, phone: null });
                          }}
                          className={`w-full bg-[#FCF9F6] border rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:bg-white ${errors.phone ? 'border-red-500' : 'border-[#EEDECF] focus:border-[#733F49]'
                            }`}
                          placeholder="Nhập số điện thoại liên hệ"
                        />
                        {errors.phone && (
                          <span className="text-[11px] text-red-600 mt-1 block">{errors.phone}</span>
                        )}
                      </div>

                      <div>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          EMAIL NHẬN XÁC NHẬN *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors({ ...errors, email: null });
                          }}
                          className={`w-full bg-[#FCF9F6] border rounded-xl px-3.5 py-2.5 text-[14px] text-[#2C2523] font-medium focus:outline-none focus:bg-white ${errors.email ? 'border-red-500' : 'border-[#EEDECF] focus:border-[#733F49]'
                            }`}
                          placeholder="Nhập email nhận thư xác nhận"
                        />
                        {errors.email && (
                          <span className="text-[11px] text-red-600 mt-1 block">{errors.email}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                      <div>
                        <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                          NGÀY CƯỚI CHÍNH THỨC (NẾU ĐÃ CÓ)
                        </label>
                        <input
                          type="date"
                          value={weddingDate}
                          onChange={(e) => setWeddingDate(e.target.value)}
                          className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2 text-[13.5px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#733F49] mb-1.5">
                        GHI CHÚ MONG MUỐN HOẶC PHOM DÁNG CÔ DÂU QUAN TÂM
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Nhập yêu cầu đặc biệt hoặc phong cách váy cưới nàng mong muốn trải nghiệm..."
                        className="w-full bg-[#FCF9F6] border border-[#EEDECF] rounded-xl px-3.5 py-2.5 text-[13.5px] text-[#2C2523] font-medium focus:outline-none focus:border-[#733F49] focus:bg-white resize-none"
                      />
                    </div>
                  </div>
                </section>

              </div>

              {/* RIGHT COLUMN: Sticky Summary Sidebar (col-span-4) */}
              <div className="lg:col-span-4 sticky top-24 space-y-4">

                <div className="bg-white rounded-3xl border border-[#F0E5DC] shadow-[0_8px_32px_rgba(44,37,35,0.06)] p-6 space-y-5">

                  {/* Top Eyebrow */}
                  <div className="pb-4 border-b border-[#F5EDE8]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8737D] block mb-1">
                      TÓM TẮT LỊCH HẸN PRIVATE SUITE
                    </span>
                    <h3 className="font-jakarta text-[18px] sm:text-[19px] font-bold text-[#2C2523] m-0">
                      Thông Tin Thử Lễ Phục
                    </h3>
                  </div>

                  {/* Booking Details List */}
                  <div className="space-y-3.5 text-[13px]">
                    <div className="bg-[#FCF9F6] p-3.5 rounded-xl border border-[#EEDECF]">
                      <span className="text-[11px] font-bold uppercase text-[#847374] block mb-1">
                        CHI NHÁNH SHOWROOM
                      </span>
                      <div className="font-bold text-[#2C2523] leading-snug">
                        {selectedBranch.name}
                      </div>
                      <div className="text-[11px] text-[#6B5C5D] mt-1">
                        {selectedBranch.address}
                      </div>
                    </div>

                    <div className="bg-[#FCF9F6] p-3.5 rounded-xl border border-[#EEDECF] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-[#847374] block mb-0.5">
                          NGÀY HẸN
                        </span>
                        <div className="font-bold text-[#2C2523]">{formatShortDate(selectedDate)}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold uppercase text-[#847374] block mb-0.5">
                          KHUNG GIỜ
                        </span>
                        <div className="font-bold text-[#733F49]">{selectedTimeSlot.time}</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase text-[#847374] block mb-1.5">
                        MẪU VÁY SẼ THỬ ({chosenDresses.length} / 2 MẪU)
                      </span>
                      {chosenDresses.length > 0 ? (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {chosenDresses.map((dress) => (
                            <div
                              key={dress.id}
                              className="flex items-center justify-between text-[12.5px] p-2 rounded-lg bg-[#FAF4EE] border border-[#EEDECF]"
                            >
                              <span className="font-medium text-[#2C2523] truncate max-w-[190px]">
                                {dress.name}
                              </span>
                              <span className="text-[11px] font-bold text-[#733F49]">
                                {formatCurrencyVND(dress.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[12px] text-[#847374] bg-[#FAF4EE] p-3 rounded-xl border border-dashed border-[#EEDECF] text-center">
                          Chưa chọn mẫu váy (Chọn tại Bước 3)
                        </div>
                      )}
                    </div>

                    {/* Cost summary: Free appointment */}
                    <div className="pt-3 border-t border-[#F5EDE8] flex items-center justify-between">
                      <span className="text-[#6B5C5D] font-medium">Chi phí buổi thử váy VIP:</span>
                      <span className="font-jakarta font-extrabold text-[17px] text-[#2E7D32]">
                        0₫ (Miễn Phí)
                      </span>
                    </div>
                  </div>

                  {/* Promises Banner */}
                  <div className="p-3.5 rounded-xl bg-[#FAF0EC] border border-[#F2D8D4] space-y-1.5 text-[11.5px] text-[#733F49]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-4 h-4 text-[#B8737D]" />
                      <span>CAM KẾT DÀNH CHO CÔ DÂU:</span>
                    </div>
                    <p className="m-0 text-[#6B5C5D] leading-relaxed">
                      ✓ Phòng thử riêng tư 100% không ghép khách.<br />
                      ✓ Hấp tiệt trùng sinh học & chuẩn bị váy trước 2 giờ.<br />
                      ✓ Không ép cọc, hoàn toàn thoải mái trải nghiệm.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-[#733F49] hover:bg-[#5F323B] text-white font-jakarta text-[14px] font-bold tracking-wider uppercase transition-all shadow-[0_4px_16px_rgba(115,63,73,0.3)] hover:shadow-[0_6px_22px_rgba(115,63,73,0.4)] cursor-pointer border-0 flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <span>XÁC NHẬN ĐẶT LỊCH HẸN PRIVATE SUITE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center text-[11.5px] text-[#847374]">
                    Cần hỗ trợ gấp? Gọi Hotline{' '}
                    <a href="tel:18008998" className="text-[#733F49] font-bold hover:underline">
                      1800 8998
                    </a>
                  </div>

                </div>

              </div>

            </form>

          </div>
        )}

      </main>

      {/* Footer hidden on print */}
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
