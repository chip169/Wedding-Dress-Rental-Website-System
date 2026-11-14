import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  Phone,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Crown
} from 'lucide-react';
import { message, Modal, Popconfirm, Tag } from 'antd';
import AccountLayout from '../../components/layout/AccountLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getMyAppointmentsApi, cancelMyAppointmentApi } from '../../services/appointmentService';
import { formatShortDate } from '../../utils/formatDate';

const TABS = [
  { id: 'all', label: 'Tất cả ca hẹn' },
  { id: 'upcoming', label: 'Sắp diễn ra' },
  { id: 'completed', label: 'Đã hoàn tất' },
  { id: 'cancelled', label: 'Đã hủy' },
];

const SHOWROOM_ADDRESSES = {
  'hn-hoankiem': {
    name: 'UniBridal Hoàn Kiếm, Hà Nội',
    address: '12 Hàng Trống, P. Hàng Trống, Q. Hoàn Kiếm, Hà Nội',
    phone: '024 3998 8888',
    mapUrl: 'https://maps.google.com/?q=12+Hang+Trong+Hoan+Kiem+Ha+Noi',
  },
  'hcm-q1': {
    name: 'UniBridal Flagship Atelier Q.1, TP.HCM',
    address: '88 Đồng Khởi, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '028 3888 9999',
    mapUrl: 'https://maps.google.com/?q=88+Dong+Khoi+Quan+1+Ho+Chi+Minh',
  },
};

export default function AppointmentHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await getMyAppointmentsApi();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (id) => {
    setCancellingId(id);
    try {
      await cancelMyAppointmentApi(id);
      message.success('Đã hủy lịch hẹn thử váy thành công.');
      // Refresh local list
      setAppointments((prev) =>
        prev.map((a) => ((a._id || a.id) === id ? { ...a, status: 'cancelled' } : a))
      );
    } catch {
      message.error('Không thể hủy lịch hẹn vào lúc này. Vui lòng liên hệ Hotline.');
    } finally {
      setCancellingId(null);
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const st = (apt.status || 'pending').toLowerCase();
      const aptDate = apt.appointmentDate ? String(apt.appointmentDate).split('T')[0] : '';
      const isPast = aptDate && aptDate < todayStr;

      // Tab filtering
      if (activeTab === 'upcoming') {
        if (st === 'cancelled') return false;
        if (st === 'completed') return false;
        if (isPast) return false;
      } else if (activeTab === 'completed') {
        if (st === 'cancelled') return false;
        if (st !== 'completed' && !isPast) return false;
      } else if (activeTab === 'cancelled') {
        if (st !== 'cancelled') return false;
      }

      // Search filtering
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const code = (apt.appointmentCode || apt._id || '').toLowerCase();
        const customerName = (apt.customerName || '').toLowerCase();
        const branchKey = (apt.branch || apt.branchId || '').toLowerCase();
        const showroomName = (SHOWROOM_ADDRESSES[branchKey]?.name || '').toLowerCase();

        return (
          code.includes(query) ||
          customerName.includes(query) ||
          branchKey.includes(query) ||
          showroomName.includes(query)
        );
      }

      return true;
    });
  }, [appointments, activeTab, searchTerm, todayStr]);

  const renderStatusBadge = (status, dateStr) => {
    const st = (status || 'pending').toLowerCase();
    const isPast = dateStr && dateStr < todayStr;

    if (st === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FDF2F0] text-[#B91C1C] border border-[#F8D7DA]">
          <XCircle className="w-3.5 h-3.5" />
          ĐÃ HỦY
        </span>
      );
    }

    if (st === 'completed' || isPast) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          ĐÃ HOÀN TẤT THỬ VÁY
        </span>
      );
    }

    if (st === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF0EC] text-[#733F49] border border-[#F2D8D4]">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          ĐÃ XÁC NHẬN PRIVATE SUITE
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        CHỜ CHUYÊN VIÊN TIẾP NHẬN
      </span>
    );
  };

  return (
    <AccountLayout
      title="Lịch Sử Hẹn Thử Váy Private Suite"
      subtitle="Theo dõi và quản lý các ca thử váy cưới riêng tư 1:1 cùng Stylist cao cấp tại hệ thống Showroom UniBridal"
    >
      <div className="space-y-6">
        {/* Banner giới thiệu trải nghiệm thử váy */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#FAF4EE] via-[#FFF8F6] to-[#FAF0EC] border border-[#EEDECF] rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#B8737D]" />
                <span className="text-[11px] font-bold text-[#733F49] uppercase tracking-wider">
                  Dịch Vụ Thử Váy Độc Quyền 1:1
                </span>
              </div>
              <h3 className="font-playfair text-[18px] sm:text-[20px] font-bold text-[#2C2523] m-0">
                Không Gian VIP Private Suite Dành Riêng Cho Nàng
              </h3>
              <p className="text-[12.5px] text-[#7A6B6A] m-0 leading-relaxed max-w-2xl">
                Mỗi buổi thử váy kéo dài 90 phút trọn vẹn, có Stylist tư vấn số đo, tiệc trà chiều cao cấp và phòng thử riêng tư cho cô dâu và người thân.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dat-lich')}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5D333B] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              <CalendarDays className="w-4 h-4 text-amber-200" />
              Đặt lịch thử mới
            </button>
          </div>
        </div>

        {/* Thanh điều khiển: Tabs + Tìm kiếm */}
        <div className="bg-white rounded-2xl border border-[#EEE2DF] p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                    isActive
                      ? 'bg-[#733F49] text-white shadow-xs'
                      : 'bg-[#F7ECE8] text-[#745F5B] hover:bg-[#ECD8D3]'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'upcoming' && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                      {appointments.filter((a) => {
                        const st = (a.status || '').toLowerCase();
                        const d = a.appointmentDate ? String(a.appointmentDate).split('T')[0] : '';
                        return st !== 'cancelled' && st !== 'completed' && (!d || d >= todayStr);
                      }).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#8C7A7B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã hẹn, showroom..."
              className="w-full pl-9 pr-3 py-2 bg-[#FCF9F6] border border-[#EEDECF] rounded-xl text-xs text-[#2C2523] placeholder-[#A39290] focus:outline-none focus:border-[#733F49] transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8C7A7B] hover:text-[#2C2523] bg-transparent border-0 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Danh sách các ca hẹn */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#EEE2DF] p-12 text-center shadow-xs">
            <div className="w-10 h-10 border-3 border-[#733F49] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#7A6B6A] m-0">Đang tải lịch sử hẹn thử váy của nàng...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EEE2DF] p-10 sm:p-14 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FAF0EC] text-[#733F49] flex items-center justify-center mx-auto shadow-2xs">
              <CalendarDays className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="font-playfair text-[18px] sm:text-[20px] font-bold text-[#2C2523] m-0">
                {searchTerm
                  ? 'Không tìm thấy ca hẹn thử váy phù hợp'
                  : activeTab === 'upcoming'
                  ? 'Nàng chưa có ca hẹn thử váy sắp diễn ra'
                  : 'Nàng chưa có lịch hẹn thử váy nào'}
              </h4>
              <p className="text-xs sm:text-[13px] text-[#7A6B6A] m-0 leading-relaxed">
                {searchTerm
                  ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc bấm xóa bộ lọc.'
                  : 'Hãy để UniBridal đồng hành cùng nàng trên hành trình chọn chiếc váy cưới lộng lẫy nhất cho ngày trọng đại.'}
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => navigate('/dat-lich')}
                className="px-6 py-3 rounded-xl bg-[#733F49] hover:bg-[#5D333B] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer border-0"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                Đặt lịch thử váy Private Suite (Miễn phí)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => {
              const aptId = apt._id || apt.id;
              const dateStr = apt.appointmentDate ? String(apt.appointmentDate).split('T')[0] : '';
              const branchKey = apt.branch || apt.branchId || 'hcm-q1';
              const branchInfo = SHOWROOM_ADDRESSES[branchKey] || SHOWROOM_ADDRESSES['hcm-q1'];
              const st = (apt.status || 'pending').toLowerCase();
              const isPast = dateStr && dateStr < todayStr;
              const canCancel = st !== 'cancelled' && st !== 'completed' && (!dateStr || dateStr >= todayStr);

              return (
                <article
                  key={aptId}
                  className="bg-white rounded-2xl border border-[#EEE2DF] p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  {/* Header thẻ: Mã đơn & Trạng thái */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#F0E5DC]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-xs sm:text-[13px] text-[#733F49] bg-[#FAF0EC] px-3 py-1 rounded-lg border border-[#F2D8D4]">
                        MÃ HẸN: #{apt.appointmentCode || aptId}
                      </span>
                      {apt.createdAt && (
                        <span className="text-[11.5px] text-[#8C7A7B] hidden sm:inline">
                          Đặt lúc: {formatShortDate(apt.createdAt)}
                        </span>
                      )}
                    </div>
                    {renderStatusBadge(st, dateStr)}
                  </div>

                  {/* Body thẻ: Chi tiết lịch hẹn */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* Cột 1: Thời gian & Ca thử */}
                    <div className="space-y-2 p-3.5 bg-[#FCF9F6] rounded-xl border border-[#F0E5DC]">
                      <span className="text-[10.5px] font-bold text-[#733F49] uppercase tracking-wider block">
                        THỜI GIAN THỬ VÁY
                      </span>
                      <div className="flex items-center gap-2 text-sm font-bold text-[#2C2523]">
                        <CalendarDays className="w-4 h-4 text-[#733F49]" />
                        <span>{dateStr ? formatShortDate(dateStr) : 'Chưa xếp ngày'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#8C4654]">
                        <Clock className="w-4 h-4 text-[#8C4654]" />
                        <span>{apt.timeSlot || '09:00 — 10:30'} (Ca 90 phút)</span>
                      </div>
                    </div>

                    {/* Cột 2: Showroom đón tiếp */}
                    <div className="space-y-1.5 p-3.5 bg-[#FCF9F6] rounded-xl border border-[#F0E5DC]">
                      <span className="text-[10.5px] font-bold text-[#733F49] uppercase tracking-wider block">
                        ĐỊA ĐIỂM SHOWROOM
                      </span>
                      <h5 className="font-bold text-xs sm:text-sm text-[#2C2523] m-0">
                        {branchInfo.name}
                      </h5>
                      <p className="text-[11.5px] text-[#7A6B6A] m-0 flex items-start gap-1.5 leading-relaxed">
                        <MapPin className="w-3.5 h-3.5 text-[#733F49] shrink-0 mt-0.5" />
                        <span>{branchInfo.address}</span>
                      </p>
                      <p className="text-[11.5px] text-[#733F49] font-semibold m-0 flex items-center gap-1.5 pt-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Hotline tiếp đón: {branchInfo.phone}</span>
                      </p>
                    </div>

                    {/* Cột 3: Tác phẩm lễ phục quan tâm & Ghi chú */}
                    <div className="space-y-1.5 p-3.5 bg-[#FCF9F6] rounded-xl border border-[#F0E5DC] flex flex-col justify-between">
                      <div>
                        <span className="text-[10.5px] font-bold text-[#733F49] uppercase tracking-wider block mb-1">
                          LỄ PHỤC QUAN TÂM
                        </span>
                        {Array.isArray(apt.interestedDresses) && apt.interestedDresses.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {apt.interestedDresses.map((dress, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white text-[#733F49] border border-[#EEDECF]"
                              >
                                <span>✦</span> {dress.name || dress.code || dress}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11.5px] text-[#8C7A7B] italic m-0">
                            Stylist chuẩn bị phom dáng Haute Couture theo vóc dáng tại Showroom
                          </p>
                        )}
                      </div>

                      {apt.notes && (
                        <div className="pt-2 border-t border-[#EEDECF] text-[11px] text-[#7A6B6A]">
                          <span className="font-semibold text-[#2C2523]">Ghi chú:</span> {apt.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer thẻ: Nút hành động */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0E5DC]">
                    <div className="text-[11.5px] text-[#7A6B6A]">
                      <span>Trang phục thử: Váy đầm và phụ kiện được khử khuẩn bằng công nghệ sinh học trước giờ thử.</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={branchInfo.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-lg border border-[#EEDECF] text-[#733F49] hover:bg-[#FAF0EC] text-xs font-semibold flex items-center gap-1 transition-colors no-underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Chỉ đường
                      </a>

                      {canCancel && (
                        <Popconfirm
                          title="Hủy lịch hẹn thử váy?"
                          description="Nàng có chắc chắn muốn hủy ca hẹn này không? Nàng có thể đặt lại ca khác bất cứ lúc nào."
                          okText="Xác nhận hủy"
                          cancelText="Giữ lại lịch"
                          okButtonProps={{ danger: true, loading: cancellingId === aptId }}
                          onConfirm={() => handleCancelAppointment(aptId)}
                        >
                          <button
                            type="button"
                            disabled={cancellingId === aptId}
                            className="px-3.5 py-1.5 rounded-lg border border-[#F8D7DA] text-[#B91C1C] hover:bg-[#FDF2F0] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Hủy ca hẹn
                          </button>
                        </Popconfirm>
                      )}

                      <button
                        type="button"
                        onClick={() => navigate('/dat-lich')}
                        className="px-3.5 py-1.5 rounded-lg bg-[#FAF0EC] hover:bg-[#F2D8D4] text-[#733F49] text-xs font-bold transition-colors cursor-pointer border border-[#F2D8D4]"
                      >
                        Đặt ca mới
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
