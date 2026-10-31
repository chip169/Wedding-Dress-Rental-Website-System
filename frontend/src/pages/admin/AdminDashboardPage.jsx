import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, Gem, PackageCheck } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardChart from '../../components/common/DashboardChart';
import { getAdminDashboard } from '../../services/reportService';

const PERIODS = { week: '7 ngày', month: 'Tháng này', quarter: 'Quý này', year: 'Năm nay' };
const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; setError(''); getAdminDashboard(period).then((value) => { if (active) setData(value); }).catch((issue) => { if (active) setError(issue.message || 'Không tải được tổng quan.'); }); return () => { active = false; }; }, [period]);
  const chart = useMemo(() => {
    const values = data?.chart || [];
    const primary = values.map((item) => item.orderValue / 1_000_000);
    const max = Math.max(1, ...primary);
    return { labels: values.map((item) => item.label), primary, secondary: values.map(() => 0), trend: primary, max, ticks: [0, max / 4, max / 2, max * .75, max], unit: 'tr' };
  }, [data]);
  const controls = <div className="ub-dashboard-periods is-heading" role="group" aria-label="Khoảng thời gian thống kê">{Object.entries(PERIODS).map(([key, label]) => <button key={key} type="button" aria-pressed={key === period} className={key === period ? 'is-active' : ''} onClick={() => setPeriod(key)}>{label}</button>)}</div>;
  return <DashboardLayout role="admin" controls={controls}>
    {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
    {data?.ordersMissingDepositTransaction > 0 && <p role="alert" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{data.ordersMissingDepositTransaction} đơn đã chuyển sang trạng thái đặt cọc nhưng chưa có giao dịch cọc thành công trong hệ thống. Cần đối soát trước khi xác nhận tiền thực thu.</p>}
    <section className="ub-dashboard-metrics grid grid-cols-3 gap-[23px] max-[1120px]:gap-3 max-[650px]:grid-cols-1" aria-label="Chỉ số kinh doanh">
      {[
        { title: 'GIÁ TRỊ ĐƠN ĐÃ ĐẶT CỌC', value: money(data?.orderValue), note: `Tiền thuê thực thu ghi sổ: ${money(data?.revenue)}`, Icon: Banknote, color: 'rose' },
        { title: 'ĐƠN THUÊ', value: data?.totalOrders ?? '—', note: `${data?.completedOrders ?? 0} đơn hoàn tất trong kỳ`, Icon: PackageCheck, color: 'gold' },
        { title: 'CỘNG ĐỒNG', value: data?.members ?? '—', note: 'Tài khoản khách hàng đang hoạt động', Icon: Gem, color: 'rose' },
      ].map(({ title, value, note, Icon, color }) => <article key={title} className="ub-dashboard-metric admin-metric min-w-0 rounded-[7px] border border-white bg-white px-[27px] pb-5 pt-7 max-[1120px]:px-[17px] max-[650px]:p-[18px]"><div className="ub-dashboard-metric-head"><span>{title}</span><span className={`ub-dashboard-metric-icon ${color}`}><Icon size={20} /></span></div><div className="ub-dashboard-metric-value">{value}</div><p>{note}</p></article>)}
    </section>
    <section className="ub-dashboard-chart-card is-admin mt-[41px] rounded-lg border border-[#f2e7e2] bg-white px-7 pb-[30px] pt-[27px] max-[650px]:mt-5 max-[650px]:p-4" aria-labelledby="admin-chart-title"><div className="ub-dashboard-chart-head"><h2 id="admin-chart-title"><span className="ub-dashboard-title-dot" />Giá Trị Đơn Đã Đặt Cọc Theo Kỳ</h2><p className="ub-dashboard-chart-subtitle">Tổng tiền thuê của các đơn đã qua bước đặt cọc; chưa đồng nghĩa với tiền đã thu.</p></div>{data && <DashboardChart chartId={`admin-${period}`} {...chart} primaryLabel="Giá trị đơn" secondaryLabel="" trendLabel="Xu hướng" variant="admin" />}</section>
  </DashboardLayout>;
}
