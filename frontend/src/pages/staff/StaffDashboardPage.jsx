import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChartNoAxesCombined, ClipboardCheck, PackageCheck, ShieldPlus } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardChart from '../../components/common/DashboardChart';
import { getStaffDashboard } from '../../services/reportService';

const PERIODS = { week: '7 ngày qua', month: 'Tháng này', quarter: 'Quý này' };
export default function StaffDashboardPage() {
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; setError(''); getStaffDashboard(period).then((value) => { if (active) setData(value); }).catch((issue) => { if (active) setError(issue.message || 'Không tải được tổng quan.'); }); return () => { active = false; }; }, [period]);
  const chart = useMemo(() => { const values = data?.chart || []; const primary = values.map((item) => item.orders); const secondary = values.map((item) => item.completed); const max = Math.max(1, ...primary); return { labels: values.map((item) => item.label), primary, secondary, trend: primary, max, ticks: [0, max / 4, max / 2, max * .75, max] }; }, [data]);
  const metrics = [
    { title: 'TỔNG ĐƠN THUÊ TRONG KỲ', value: data?.totalOrders ?? '—', note: `${data?.completedOrders ?? 0} đơn hoàn tất`, Icon: ClipboardCheck, color: 'rose' },
    { title: 'BÀN GIAO HÔM NAY', value: data?.todayDeliveries ?? '—', note: 'Theo ngày bắt đầu thuê', Icon: PackageCheck, color: 'gold' },
    { title: 'SẢN PHẨM BẢO TRÌ', value: data?.maintenance ?? '—', note: 'Mẫu váy đang bảo trì', Icon: ShieldPlus, color: 'amber' },
  ];
  return <DashboardLayout role="staff">
    {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
    {data?.ordersMissingDepositTransaction > 0 && <p role="alert" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Có {data.ordersMissingDepositTransaction} đơn đã chuyển sang trạng thái đặt cọc nhưng chưa có giao dịch cọc thành công. Vui lòng đối soát với bộ phận thu ngân.</p>}
    <section className="ub-dashboard-metrics grid grid-cols-3 gap-[23px] max-[1120px]:gap-3 max-[650px]:grid-cols-1" aria-label="Chỉ số vận hành">{metrics.map(({ title, value, note, Icon, color }) => <article key={title} className="ub-dashboard-metric min-w-0 min-h-[188px] rounded-[7px] border border-white bg-white px-[27px] pb-5 pt-[25px] max-[1120px]:px-[17px] max-[650px]:min-h-[150px] max-[650px]:p-[18px]"><div className="ub-dashboard-metric-head"><span>{title}</span><span className={`ub-dashboard-metric-icon ${color}`}><Icon size={20} /></span></div><div className="ub-dashboard-metric-value">{value}</div><p><CalendarClock size={13} />{note}</p></article>)}</section>
    <section className="ub-dashboard-chart-card mt-[27px] rounded-lg border border-[#f2e7e2] bg-white px-7 pb-[30px] pt-[27px] max-[650px]:mt-5 max-[650px]:p-4" aria-labelledby="staff-chart-title"><div className="ub-dashboard-chart-head flex items-center justify-between gap-4 border-b border-[#f3e9e5] pb-4 max-[1120px]:flex-col max-[1120px]:items-start"><div><p className="ub-dashboard-eyebrow"><ChartNoAxesCombined size={16} /> HAUTE COUTURE PERFORMANCE</p><h2 id="staff-chart-title">Đơn Thuê &amp; Đơn Hoàn Tất</h2><p className="ub-dashboard-chart-subtitle">Dữ liệu đơn hàng thực tế trong kỳ đã chọn.</p></div><div className="ub-dashboard-periods" role="group" aria-label="Khoảng thời gian biểu đồ">{Object.entries(PERIODS).map(([key, label]) => <button key={key} type="button" aria-pressed={key === period} className={key === period ? 'is-active' : ''} onClick={() => setPeriod(key)}>{label}</button>)}</div></div>{data && <DashboardChart chartId={`staff-${period}`} {...chart} primaryLabel="Đơn thuê" secondaryLabel="Hoàn tất" trendLabel="Xu hướng đơn" unit=" đơn" />}</section>
  </DashboardLayout>;
}
