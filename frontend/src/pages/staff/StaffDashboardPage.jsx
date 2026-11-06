import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardCheck,
  PackageCheck,
  ShieldPlus,
  Calendar,
  Clock,
  Phone,
  Sparkles,
} from 'lucide-react';
import { message } from 'antd';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardChart from '../../components/common/DashboardChart';
import { getStaffDashboard } from '../../services/reportService';
import { APPOINTMENT_EVENT } from '../../services/appointmentService';
import { getStaffAppointments, updateStaffAppointmentStatus } from '../../services/staffDashboardService';

const PERIODS = { week: '7 ngày qua', month: 'Tháng này', quarter: 'Quý này' };
const STATUS_LABELS = { confirmed: 'Đã xác nhận', completed: 'Hoàn tất', cancelled: 'Đã hủy' };

export default function StaffDashboardPage() {
  const [period, setPeriod] = useState('week');
  const [reload, setReload] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loadingApt, setLoadingApt] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoadingApt(true);
    setAppointmentsError('');
    try {
      setAppointments(await getStaffAppointments());
    } catch {
      setAppointments([]);
      setAppointmentsError('Không thể tải danh sách lịch hẹn từ máy chủ. Vui lòng làm mới lịch để thử lại.');
    } finally {
      setLoadingApt(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    window.addEventListener(APPOINTMENT_EVENT, fetchAppointments);
    return () => window.removeEventListener(APPOINTMENT_EVENT, fetchAppointments);
  }, [fetchAppointments]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateStaffAppointmentStatus(id, newStatus);
      message.success(`Đã cập nhật lịch hẹn thành "${STATUS_LABELS[newStatus]}".`);
      fetchAppointments();
    } catch {
      message.error('Cập nhật trạng thái lịch hẹn thất bại.');
    }
  };

  useEffect(() => {
    let active = true;
    setError('');
    setLoading(true);
    setData(null);
    getStaffDashboard(period)
      .then((value) => {
        if (!active) return;
        setData(value);
      })
      .catch(() => {
        if (!active) return;
        setData(null);
        setError('Lỗi kết nối cơ sở dữ liệu: Không thể tải dữ liệu bảng điều khiển từ máy chủ MongoDB.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
    };
  }, [period, reload]);

  const chart = useMemo(() => {
    const values = data?.chart || [];
    const primary = values.map((item) => item.orders || 0);
    const secondary = values.map((item) => item.completed || 0);
    const rawMax = Math.max(0, ...primary, ...secondary);
    const max = Math.max(4, Math.ceil(rawMax));
    const step = Math.ceil(max / 4);
    const actualMax = step * 4;
    return {
      labels: values.map((item) => item.label),
      primary,
      secondary,
      trend: primary,
      max: actualMax,
      ticks: [0, step, step * 2, step * 3, actualMax],
    };
  }, [data]);

  const metrics = [
    {
      title: 'TỔNG ĐƠN THUÊ TRONG KỲ',
      value: data?.totalOrders ?? '—',
      note: `${data?.completedOrders ?? 0} đơn hoàn tất`,
      Icon: ClipboardCheck,
      color: 'rose',
    },
    {
      title: 'BÀN GIAO HÔM NAY',
      value: data?.todayDeliveries ?? '—',
      note: 'Theo ngày bắt đầu thuê',
      Icon: PackageCheck,
      color: 'gold',
    },
    {
      title: 'SẢN PHẨM BẢO TRÌ',
      value: data?.maintenance ?? '—',
      note: 'Mẫu váy đang hấp tiệt trùng & bảo dưỡng',
      Icon: ShieldPlus,
      color: 'amber',
    },
  ];

  return (
    <DashboardLayout
      role="staff"
      title="Tổng Quan Vận Hành"
      subtitle="Theo dõi tiến độ đơn hàng và lịch hẹn tiếp đón cô dâu hôm nay"
      activeNav="dashboard"
    >
      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error} <button type="button" onClick={() => setReload((value) => value + 1)} className="ml-3 underline">Thử lại</button>
        </div>
      )}
      {loading && <p role="status" className="mb-4 text-sm text-stone-500">Đang tải thống kê...</p>}
      {data?.ordersMissingDepositTransaction > 0 && (
        <p role="alert" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Có {data.ordersMissingDepositTransaction} đơn đã chuyển sang trạng thái đặt cọc nhưng chưa có giao dịch cọc thành công. Vui lòng đối soát với bộ phận thu ngân.
        </p>
      )}

      <section
        className="ub-dashboard-metrics grid grid-cols-3 gap-[23px] max-[1120px]:gap-3 max-[650px]:grid-cols-1"
        aria-label="Chỉ số vận hành"
      >
        {metrics.map(({ title, value, note, Icon, color }) => (
          <article
            key={title}
            className="ub-dashboard-metric min-w-0 min-h-[188px] rounded-[7px] border border-white bg-white px-[27px] pb-5 pt-[25px] max-[1120px]:px-[17px] max-[650px]:min-h-[150px] max-[650px]:p-[18px]"
          >
            <div className="ub-dashboard-metric-head">
              <span>{title}</span>
              <span className={`ub-dashboard-metric-icon ${color}`}>
                <Icon size={20} />
              </span>
            </div>
            <div className="ub-dashboard-metric-value">{value}</div>
            <p>
              <CalendarClock size={13} />
              {note}
            </p>
          </article>
        ))}
      </section>

      <section
        className="ub-dashboard-chart-card mt-[27px] rounded-lg border border-[#f2e7e2] bg-white px-7 pb-[30px] pt-[27px] max-[650px]:mt-5 max-[650px]:p-4"
        aria-labelledby="staff-chart-title"
      >
        <div className="ub-dashboard-chart-head flex items-center justify-between gap-4 border-b border-[#f3e9e5] pb-4 max-[1120px]:flex-col max-[1120px]:items-start">
          <div>
            <p className="ub-dashboard-eyebrow">
              <ChartNoAxesCombined size={16} /> HAUTE COUTURE PERFORMANCE
            </p>
            <h2 id="staff-chart-title">Đơn Thuê &amp; Bàn Giao Hoàn Tất</h2>
            <p className="ub-dashboard-chart-subtitle">
              Dữ liệu đơn hàng thực tế trong kỳ đã chọn tại showroom.
            </p>
          </div>
          <div className="ub-dashboard-periods" role="group" aria-label="Khoảng thời gian biểu đồ">
            {Object.entries(PERIODS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={key === period}
                className={key === period ? 'is-active' : ''}
                onClick={() => setPeriod(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {data && (
          <DashboardChart
            chartId={`staff-${period}`}
            {...chart}
            primaryLabel="Đơn thuê"
            secondaryLabel="Hoàn tất"
            trendLabel="Xu hướng đơn"
            unit=" đơn"
          />
        )}
      </section>

      {/* LỊCH HẸN THỬ VÁY PRIVATE SUITE (Atelier Appointments) */}
      <section
        className="mt-[27px] rounded-lg border border-[#f2e7e2] bg-white px-7 pb-[30px] pt-[27px] max-[650px]:mt-5 max-[650px]:p-4"
        aria-labelledby="staff-appointments-title"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#f3e9e5] pb-4 mb-5 max-[768px]:flex-col max-[768px]:items-start">
          <div>
            <p className="ub-dashboard-eyebrow text-[#B8737D] flex items-center gap-1.5 font-bold tracking-[1.5px] uppercase text-[11px]">
              <Sparkles size={14} /> PRIVATE SUITE ATELIER
            </p>
            <h2 id="staff-appointments-title" className="font-playfair text-[20px] font-bold text-[#2C2523] mt-1">
              Lịch Hẹn Thử Váy VIP Hôm Nay & Sắp Tới
            </h2>
            <p className="text-[12.5px] text-[#7A6B6C]">
              Quản lý và tiếp đón cô dâu đặt phòng thử riêng tư 1:1 cùng chuyên viên Haute Couture.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchAppointments}
            disabled={loadingApt}
            className="px-3.5 py-1.5 rounded-lg border border-[#EFE2DC] bg-[#FFF9F6] text-[12px] font-semibold text-[#804E55] hover:bg-[#FCEEEA] transition-colors cursor-pointer"
          >
            {loadingApt ? 'Đang tải...' : 'Làm mới lịch'}
          </button>
        </div>

        {loadingApt ? (
          <p role="status" className="py-12 text-center text-[#8C7D7E] text-[13px]">Đang tải danh sách lịch hẹn...</p>
        ) : appointmentsError ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{appointmentsError}</p>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center text-[#8C7D7E] text-[13px]">
            Không có lịch hẹn chờ xử lý trong hôm nay và sắp tới.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#F2E5E0] bg-[#FFF6F3] text-[11px] font-bold text-[#7A696B] uppercase tracking-wider">
                  <th className="py-3 px-4">MÃ & KHÁCH HÀNG</th>
                  <th className="py-3 px-4">NGÀY & KHUNG GIỜ</th>
                  <th className="py-3 px-4">LỄ PHỤC QUAN TÂM</th>
                  <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                  <th className="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6EDE9] text-[12.5px]">
                {appointments.map((apt) => {
                  const aptId = apt._id || apt.id || apt.appointmentCode;
                  const name = apt.customerName || apt.fullName || 'Cô dâu';
                  const phone = apt.customerPhone || apt.phone || '—';
                  const dateStr = apt.appointmentDate
                    ? new Date(apt.appointmentDate).toLocaleDateString('vi-VN')
                    : apt.date || '—';
                  const time = apt.timeSlot || '—';
                  const dresses = apt.interestedDresses || apt.selectedDresses || [];
                  const status = apt.status?.toLowerCase() || 'pending';

                  return (
                    <tr key={aptId} className="hover:bg-[#FCF9F7] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2C2523]">{name}</div>
                        <div className="text-[11.5px] text-[#7A6B6C] flex items-center gap-1 mt-0.5">
                          <Phone size={12} className="text-[#BA7A83]" />
                          <span>{phone}</span>
                        </div>
                        {apt.guestsCount && (
                          <div className="text-[10.5px] text-[#A89899] mt-0.5">
                            Đi cùng: {apt.guestsCount} người
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-[#2C2523]">
                          <Calendar size={13} className="text-[#BA7A83]" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11.5px] text-[#7A6B6C] mt-0.5">
                          <Clock size={12} className="text-[#BA7A83]" />
                          <span>{time}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[240px]">
                        {dresses.length > 0 ? (
                          <div className="space-y-1">
                            {dresses.map((d, i) => (
                              <div
                                key={i}
                                className="inline-block px-2 py-0.5 rounded-md bg-[#FFF2EE] text-[#804E55] text-[11px] font-medium mr-1 mb-1 border border-[#F3DBD4]"
                              >
                                {d.name || d}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#998889] italic">Tư vấn trực tiếp tại chỗ</span>
                        )}
                        {apt.notes && (
                          <div className="text-[11px] text-[#8A797A] truncate mt-1" title={apt.notes}>
                            Ghi chú: {apt.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {status === 'confirmed' ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EAF8EE] text-[#1E8347]">
                            Đã xác nhận
                          </span>
                        ) : status === 'completed' ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F0FDF4] text-[#166534]">
                            Hoàn tất
                          </span>
                        ) : status === 'cancelled' ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F3F4F6] text-[#6B7280]">
                            Đã hủy
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E]">
                            Chờ duyệt
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {status !== 'confirmed' && status !== 'completed' && status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(aptId, 'confirmed')}
                              className="px-2.5 py-1 rounded-md bg-[#1E8347] hover:bg-[#166534] text-white text-[11px] font-semibold transition-colors cursor-pointer border-0"
                            >
                              Xác nhận
                            </button>
                          )}
                          {status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(aptId, 'completed')}
                              className="px-2.5 py-1 rounded-md bg-[#BA7A83] hover:bg-[#a86a73] text-white text-[11px] font-semibold transition-colors cursor-pointer border-0"
                            >
                              Đã thử xong
                            </button>
                          )}
                          {status !== 'cancelled' && status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(aptId, 'cancelled')}
                              className="px-2 py-1 rounded-md bg-[#FAF5F2] hover:bg-[#FCEEEA] text-[#847374] hover:text-[#BA7A83] text-[11px] transition-colors cursor-pointer border border-[#EEDECF]"
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
