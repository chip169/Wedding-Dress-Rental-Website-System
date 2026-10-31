import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, ChevronLeft, ChevronRight, LockKeyhole, Search, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getRevenueReport } from '../../services/reportService';
import './RevenueReportPage.css';

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const PERIODS = { week: '7 ngày', month: 'Tháng này', quarter: 'Quý này', year: 'Năm nay' };
const TYPE = { deposit_payment: 'Thu tiền cọc', rental_payment: 'Thanh toán thuê', damage_compensation: 'Bồi thường', deposit_refund: 'Hoàn tiền cọc' };
const STATUS = { success: 'Thành công', pending: 'Đang xử lý', failed: 'Thất bại' };
const PAGE_SIZE = 10;

function Metric({ title, value, Icon, note }) {
  return <article className="ub-revenue-metric"><div className="ub-revenue-metric-head"><span>{title}</span><i><Icon size={19} /></i></div><strong>{money(value)}</strong><div className="ub-revenue-metric-foot"><p>{note}</p></div></article>;
}

function RevenueChart({ entries }) {
  const max = Math.max(1, ...entries.map((item) => item.revenue));
  return <div className="ub-revenue-chart-scroll" role="region" tabIndex={0} aria-label="Biểu đồ doanh thu thực nhận"><svg viewBox="0 0 760 258" className="ub-revenue-chart" aria-hidden="true">
    {[0, .25, .5, .75, 1].map((fraction) => <g key={fraction}><line x1="58" x2="735" y1={208 - fraction * 160} y2={208 - fraction * 160} stroke="#f2e9e5" strokeDasharray={fraction ? '3 4' : undefined} /><text x="8" y={212 - fraction * 160} className="ub-revenue-axis">{Math.round(max * fraction / 1_000_000)}tr</text></g>)}
    {entries.map((item, index) => { const width = 650 / Math.max(entries.length, 1); const height = item.revenue / max * 160; const x = 70 + index * width; return <g key={`${item.label}-${index}`}><rect x={x + width * .25} y={208 - height} width={Math.max(8, width * .5)} height={height} fill="#87565c" rx="2" /><text x={x + width * .5} y={231} textAnchor="middle" className="ub-revenue-axis">{item.label}</text></g>; })}
  </svg></div>;
}

export default function RevenueReportPage() {
  const [period, setPeriod] = useState('month');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  useEffect(() => { let active = true; setError(''); getRevenueReport(period).then((value) => { if (active) setReport(value); }).catch((issue) => { if (active) setError(issue.message || 'Không tải được báo cáo.'); }); return () => { active = false; }; }, [period]);
  const filtered = useMemo(() => (report?.transactions || []).filter((item) => {
    const term = search.trim().toLocaleLowerCase('vi');
    return (status === 'all' || item.status === status) && (!term || [item.code, item.customer, item.orderCode, item.dress].some((part) => String(part).toLocaleLowerCase('vi').includes(term)));
  }), [report, search, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return <DashboardLayout role="admin" activeNav="Báo Cáo Doanh Thu" title="Báo Cáo Doanh Thu & Tài Chính" subtitle="Dòng tiền thực nhận từ các giao dịch đã ghi nhận trong hệ thống.">
    <div className="ub-revenue-page">
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      {report?.ordersMissingDepositTransaction?.length > 0 && <p role="alert" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Đơn {report.ordersMissingDepositTransaction.join(', ')} đã qua bước đặt cọc nhưng chưa có giao dịch cọc thành công. Cần kiểm tra chứng từ và đối soát; giá trị đơn không được cộng vào tiền thực thu.</p>}
      <section className="ub-revenue-metrics grid grid-cols-3 gap-5 max-[1150px]:gap-3 max-[700px]:grid-cols-1" aria-label="Các chỉ số tài chính">
        <Metric title="GIÁ TRỊ ĐƠN ĐÃ ĐẶT CỌC" value={report?.orderValue} Icon={Banknote} note="Tiền thuê theo đơn; chưa phải tiền thực thu." />
        <Metric title="TIỀN THUÊ THỰC THU" value={report?.rentalRevenue} Icon={TrendingUp} note={`${report?.orders || 0} đơn hàng được tạo trong kỳ · tổng tiền thực thu gồm bồi thường: ${money(report?.revenue)}.`} />
        <Metric title="QUỸ CỌC ĐANG GIỮ" value={report?.depositsHeld} Icon={LockKeyhole} note="Tiền cọc thu thành công trừ tiền cọc đã hoàn." />
      </section>
      <section className="ub-revenue-filter" aria-label="Chọn kỳ báo cáo"><div className="ub-revenue-periods" role="group">{Object.entries(PERIODS).map(([key, label]) => <button key={key} type="button" className={period === key ? 'is-active' : ''} aria-pressed={period === key} onClick={() => { setPeriod(key); setPage(1); }}>{label}</button>)}</div><div className="ub-revenue-filter-bottom"><p>Dữ liệu thực tế · {PERIODS[period]}</p></div></section>
      <section className="ub-revenue-chart-card" aria-labelledby="ub-revenue-chart-title"><div className="ub-revenue-chart-top"><div><h2 id="ub-revenue-chart-title">Biểu Đồ Doanh Thu Thực Nhận</h2><p>Chỉ tính giao dịch thành công · đơn vị: đồng Việt Nam</p></div></div>{report && <RevenueChart entries={report.chart} />}</section>
      <section id="ub-revenue-journal" className="ub-revenue-journal" aria-labelledby="ub-revenue-journal-title"><div className="ub-revenue-journal-head"><div><h2 id="ub-revenue-journal-title">Sổ Nhật Ký Giao Dịch</h2><p>{report?.transactions.length || 0} giao dịch được ghi nhận trong kỳ.</p></div><div className="ub-revenue-journal-controls"><label><Search size={15} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm mã, khách hàng, váy..." aria-label="Tìm giao dịch" /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="Lọc trạng thái"><option value="all">Tất cả trạng thái</option><option value="success">Thành công</option><option value="pending">Đang xử lý</option><option value="failed">Thất bại</option></select></div></div>
        <div className="ub-revenue-table-scroll" role="region" tabIndex={0} aria-label="Bảng giao dịch có thể cuộn ngang"><table><thead><tr><th>MÃ GIAO DỊCH</th><th>THỜI GIAN &amp; KÊNH THU</th><th>KHÁCH HÀNG</th><th>ĐƠN HÀNG / LỄ PHỤC</th><th>LOẠI GIAO DỊCH</th><th>SỐ TIỀN</th><th>TRẠNG THÁI</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong className="ub-revenue-id">{item.code}</strong></td><td><strong>{new Date(item.date).toLocaleString('vi-VN')}</strong><small>{item.method}</small></td><td><strong>{item.customer}</strong></td><td><strong>{item.orderCode}</strong><small>{item.dress}</small></td><td><span className="ub-revenue-type">{TYPE[item.type] || item.type}</span></td><td className="ub-revenue-amount"><strong>{item.type === 'deposit_refund' ? '−' : ''}{money(item.amount)}</strong></td><td><span className={`ub-revenue-status ${item.status === 'pending' ? 'pending' : item.status === 'failed' ? 'refund' : ''}`}>{STATUS[item.status] || item.status}</span></td></tr>)}</tbody></table>{rows.length === 0 && <p className="ub-revenue-empty">Chưa có giao dịch phù hợp trong kỳ.</p>}</div>
        <div className="ub-revenue-pagination"><p>Hiển thị {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} trong {filtered.length} giao dịch</p><div><button type="button" aria-label="Trang trước" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={15} /></button><span>{page} / {pageCount}</span><button type="button" aria-label="Trang sau" disabled={page === pageCount} onClick={() => setPage(page + 1)}><ChevronRight size={15} /></button></div></div>
      </section>
    </div>
  </DashboardLayout>;
}
