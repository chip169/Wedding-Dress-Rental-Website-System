import React, { useState } from 'react';
import { Banknote, ChartNoAxesCombined, Gem, PackageCheck, Sparkles, TrendingUp, UsersRound } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardChart from '../../components/common/DashboardChart';

const PERIODS = {
  today: { label: 'Hôm nay', revenue: '94.000.000đ', orders: '11', rentals: '8', bespoke: '3', insight: 'Doanh thu minh họa theo từng khung giờ trong ngày.', labels: ['08h', '10h', '12h', '14h', '16h', '18h'], primary: [4, 7, 9, 11, 14, 16], secondary: [2, 4, 6, 7, 9, 11], trend: [5, 8, 10, 13, 15, 18], max: 20, ticks: [0, 5, 10, 15, 20], unit: 'tr' },
  week: { label: '7 Ngày', revenue: '654.000.000đ', orders: '82', rentals: '58', bespoke: '24', insight: 'Nhịp đơn thuê minh họa tăng dần về cuối tuần.', labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'], primary: [45, 56, 62, 69, 74, 82, 89], secondary: [30, 36, 42, 47, 51, 60, 65], trend: [44, 50, 58, 64, 70, 79, 88], max: 100, ticks: [0, 25, 50, 75, 100], unit: 'tr' },
  month: { label: 'Tháng này', revenue: '2.850.000.000đ', orders: '326', rentals: '214', bespoke: '112', insight: 'Giai đoạn cao điểm cưới mùa thu – đông ghi nhận tỷ trọng đầm Haute Couture tăng 28.4%.', labels: ['05/2026', '06/2026', '07/2026', '08/2026', '09/2026', '10/2026'], primary: [1.5, 1.9, 2.1, 2.3, 2.55, 2.85], secondary: [1.2, 1.35, 1.5, 1.75, 1.95, 2.2], trend: [1.6, 1.9, 2.15, 2.35, 2.65, 2.95], max: 3.5, ticks: [0, 1, 2, 3], unit: ' tỷ' },
  year: { label: 'Năm 2026', revenue: '24.600.000.000đ', orders: '2.710', rentals: '1.910', bespoke: '800', insight: 'Quý IV đang trong quá trình cập nhật; số liệu đến tháng 10/2026.', labels: ['Q1', 'Q2', 'Q3', 'Q4*'], primary: [5.1, 6.2, 7.4, 5.9], secondary: [3.7, 4.4, 5.2, 4.1], trend: [5, 6, 7.2, 6.1], max: 8, ticks: [0, 2, 4, 6, 8], unit: ' tỷ' },
};

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState('month');
  const series = PERIODS[period];
  const controls = <div className="ub-dashboard-periods is-heading" role="group" aria-label="Khoảng thời gian thống kê">{Object.entries(PERIODS).map(([key, item]) => <button key={key} type="button" aria-pressed={key === period} className={key === period ? 'is-active' : ''} onClick={() => setPeriod(key)}>{item.label}</button>)}</div>;

  return (
    <DashboardLayout role="admin" controls={controls}>
      <section className="ub-dashboard-metrics grid grid-cols-3 gap-[23px] max-[1120px]:gap-3 max-[650px]:grid-cols-1" aria-label="Chỉ số kinh doanh">
        <article className="ub-dashboard-metric admin-metric min-w-0 rounded-[7px] border border-white bg-white px-[27px] pb-5 pt-7 max-[1120px]:px-[17px] max-[650px]:p-[18px]">
          <div className="ub-dashboard-metric-head"><span>TỔNG DOANH THU</span><span className="ub-dashboard-metric-icon rose"><Banknote size={20} /></span></div>
          <div className="ub-dashboard-metric-value is-currency">{series.revenue}</div><p className="is-positive"><TrendingUp size={13} /> +18.2% so với kỳ trước</p>
          <div className="ub-dashboard-performance"><span>Tiến độ chỉ tiêu quý IV</span><b>85%</b></div><div className="ub-dashboard-progress"><span style={{ width: '85%' }} /></div>
        </article>
        <article className="ub-dashboard-metric admin-metric min-w-0 rounded-[7px] border border-white bg-white px-[27px] pb-5 pt-7 max-[1120px]:px-[17px] max-[650px]:p-[18px]">
          <div className="ub-dashboard-metric-head"><span>ĐƠN THUÊ &amp; BÁN RA</span><span className="ub-dashboard-metric-icon gold"><PackageCheck size={20} /></span></div>
          <div className="ub-dashboard-metric-value">{series.orders}<small>Đơn</small></div><p className="is-positive"><TrendingUp size={13} /> +12.4% lượng đặt hẹn thử</p>
          <div className="ub-dashboard-metric-breakdown"><span><i />{series.rentals} Thuê Gown</span><span><i />{series.bespoke} Phụ kiện/Bespoke</span></div>
        </article>
        <article className="ub-dashboard-metric admin-metric min-w-0 rounded-[7px] border border-white bg-white px-[27px] pb-5 pt-7 max-[1120px]:px-[17px] max-[650px]:p-[18px]">
          <div className="ub-dashboard-metric-head"><span>CỘNG ĐỒNG</span><span className="ub-dashboard-metric-icon rose"><Gem size={20} /></span></div>
          <div className="ub-dashboard-metric-value">1.480<small>Thành viên</small></div><p className="is-positive"><TrendingUp size={13} /> +48 thành viên mới tuần qua</p>
          <div className="ub-dashboard-metric-breakdown"><span><i />400 Thành viên VIP</span><span><i />1.080 Thành viên</span></div>
        </article>
      </section>
      <section className="ub-dashboard-chart-card is-admin mt-[41px] rounded-lg border border-[#f2e7e2] bg-white px-7 pb-[30px] pt-[27px] max-[650px]:mt-5 max-[650px]:p-4" aria-labelledby="admin-chart-title">
        <div className="ub-dashboard-chart-head flex items-center justify-between gap-4 max-[1120px]:flex-col max-[1120px]:items-start"><div><h2 id="admin-chart-title"><span className="ub-dashboard-title-dot" />Biểu Đồ Doanh Thu &amp; Xu Hướng Thuê Váy Cưới</h2><p className="ub-dashboard-chart-subtitle">Biến động kinh doanh theo kỳ tại UniBridal Flagship Atelier</p></div></div>
        <DashboardChart chartId={`admin-${period}`} {...series} primaryLabel="Haute Couture" secondaryLabel="Thuê Sẵn" trendLabel="Xu hướng" variant="admin" />
        <div className="ub-dashboard-insight"><Sparkles size={19} /><span>{series.insight}<br /><em>Phân tích chuyên sâu đang phát triển</em></span></div>
      </section>
    </DashboardLayout>
  );
}
