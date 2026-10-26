import React, { useState } from 'react';
import { CalendarClock, ChartNoAxesCombined, ClipboardCheck, PackageCheck, ShieldPlus, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardChart from '../../components/common/DashboardChart';

const PERIODS = {
  week: { label: '7 ngày qua', subtitle: 'Xu hướng vận hành xưởng may và điều phối lễ phục theo từng ngày', note: 'Tăng trưởng tuần: +18.4% so với chu kỳ trước', labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'], primary: [22, 27, 31, 24, 38, 44, 34], secondary: [14, 16, 19, 15, 22, 28, 20], trend: [14, 18, 21, 25, 29, 35, 28], max: 50, ticks: [0, 10, 20, 30, 40, 50] },
  month: { label: 'Tháng này', subtitle: 'Xu hướng vận hành xưởng may và điều phối lễ phục theo từng tuần', note: 'Tháng này: 142 đơn thuê trong dữ liệu minh họa', labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'], primary: [28, 34, 39, 41], secondary: [18, 22, 26, 29], trend: [20, 27, 31, 36], max: 50, ticks: [0, 10, 20, 30, 40, 50] },
  quarter: { label: 'Quý này', subtitle: 'Xu hướng vận hành xưởng may và điều phối lễ phục theo từng tháng', note: 'Quý này: nhịp bàn giao tăng đều theo tháng', labels: ['Tháng 8', 'Tháng 9', 'Tháng 10'], primary: [38, 42, 47], secondary: [25, 29, 32], trend: [28, 35, 40], max: 50, ticks: [0, 10, 20, 30, 40, 50] },
};

const metrics = [
  { eyebrow: 'TỔNG ĐƠN THUÊ THÁNG', value: '142', detail: '+12.5% so với tháng trước', Icon: ClipboardCheck, color: 'rose', progress: 76, positive: true },
  { eyebrow: 'BÀN GIAO HÔM NAY', value: '08', suffix: 'Váy', detail: '3 lễ phục cần kiểm định mép gấp', Icon: PackageCheck, color: 'gold', progress: 63, alert: true },
  { eyebrow: 'SẢN PHẨM BẢO TRÌ', value: '12', suffix: 'Mẫu', detail: '3 mẫu cần đính lại hạt & hấp vi sinh', Icon: ShieldPlus, color: 'amber', progress: 52 },
];

export default function StaffDashboardPage() {
  const [period, setPeriod] = useState('week');
  const series = PERIODS[period];

  return (
    <DashboardLayout role="staff">
      <section className="ub-dashboard-metrics grid grid-cols-3 gap-[23px] max-[1120px]:gap-3 max-[650px]:grid-cols-1" aria-label="Chỉ số vận hành">
        {metrics.map(({ eyebrow, value, suffix, detail, Icon, color, progress, positive, alert }) => (
          <article className="ub-dashboard-metric min-w-0 min-h-[188px] rounded-[7px] border border-white bg-white px-[27px] pb-5 pt-[25px] max-[1120px]:px-[17px] max-[650px]:min-h-[150px] max-[650px]:p-[18px]" key={eyebrow}>
            <div className="ub-dashboard-metric-head"><span>{eyebrow}</span><span className={`ub-dashboard-metric-icon ${color}`}><Icon size={20} strokeWidth={2} /></span></div>
            <div className="ub-dashboard-metric-value">{value} {suffix && <small>{suffix}</small>}</div>
            <p className={positive ? 'is-positive' : alert ? 'is-alert' : ''}>{positive ? <TrendingUp size={13} /> : alert ? <span className="ub-dashboard-alert-dot" /> : <CalendarClock size={13} />}{detail}</p>
            <div className="ub-dashboard-progress"><span style={{ width: `${progress}%` }} /></div>
          </article>
        ))}
      </section>
      <section className="ub-dashboard-chart-card mt-[27px] rounded-lg border border-[#f2e7e2] bg-white px-7 pb-[30px] pt-[27px] max-[650px]:mt-5 max-[650px]:p-4" aria-labelledby="staff-chart-title">
        <div className="ub-dashboard-chart-head flex items-center justify-between gap-4 border-b border-[#f3e9e5] pb-4 max-[1120px]:flex-col max-[1120px]:items-start">
          <div><p className="ub-dashboard-eyebrow"><ChartNoAxesCombined size={16} /> HAUTE COUTURE PERFORMANCE</p><h2 id="staff-chart-title">Biểu Đồ Theo Dõi Đơn Thuê &amp; Lịch Bàn Giao</h2><p className="ub-dashboard-chart-subtitle">{series.subtitle}</p></div>
          <div className="ub-dashboard-periods" role="group" aria-label="Khoảng thời gian biểu đồ">
            {Object.entries(PERIODS).map(([key, item]) => <button key={key} type="button" aria-pressed={key === period} className={key === period ? 'is-active' : ''} onClick={() => setPeriod(key)}>{item.label}</button>)}
          </div>
        </div>
        <DashboardChart chartId={`staff-${period}`} {...series} primaryLabel="Đơn thuê hoàn tất" secondaryLabel="Váy đang bàn giao" trendLabel="Xu hướng đơn hoàn tất" unit=" đơn" />
        <div className="ub-dashboard-trend-note"><TrendingUp size={14} /> {series.note}</div>
      </section>
    </DashboardLayout>
  );
}
