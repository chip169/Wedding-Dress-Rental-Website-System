import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Banknote, CalendarDays, ChevronLeft, ChevronRight, FileSearch, LockKeyhole, RotateCcw, Search, ShieldCheck, SlidersHorizontal, TrendingUp, X } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const revenueStyles = `
.ub-revenue-page { --wine:#87565c; --ink:#302626; --muted:#786a66; color:var(--ink); }
.ub-revenue-page button,.ub-revenue-page input,.ub-revenue-page select { font:inherit; }
.ub-revenue-page button:focus-visible,.ub-revenue-page a:focus-visible,.ub-revenue-page input:focus-visible,.ub-revenue-page select:focus-visible,.ub-revenue-chart-scroll:focus-visible,.ub-revenue-table-scroll:focus-visible,.ub-revenue-modal button:focus-visible { outline:2px solid var(--wine); outline-offset:2px; }
.ub-revenue-metrics { margin-top:8px; }
.ub-revenue-metric { min-width:0; min-height:220px; padding:25px 24px 20px; border:1px solid #f7eeea; border-radius:8px; background:#fff; box-shadow:0 2px 8px #6e454608; }
.ub-revenue-metric-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; min-height:44px; color:#806a64; font-size:11px; font-weight:700; letter-spacing:.12em; line-height:1.45; }
.ub-revenue-metric-head i { display:grid; flex:none; place-items:center; width:33px; height:33px; border-radius:5px; background:#f8e9e6; color:#9d646b; font-style:normal; }
.ub-revenue-metric > strong { display:block; margin:8px 0 19px; color:#8d555e; font-family:'Playfair Display',Georgia,serif; font-size:clamp(22px,2.15vw,32px); font-weight:500; letter-spacing:-.02em; white-space:nowrap; }
.ub-revenue-metric-foot p { margin:6px 0; color:#75615c; font-size:11px; line-height:1.55; }
.ub-revenue-metric-foot p span:not(.ub-revenue-growth) { float:right; }
.ub-revenue-share { display:flex; align-items:baseline; justify-content:space-between; gap:12px; color:#75615c; font-size:11px; line-height:1.5; }
.ub-revenue-share span:last-child { flex:none; }
.ub-revenue-growth { display:inline-flex; align-items:center; gap:3px; margin-right:5px; padding:2px 6px; border-radius:3px; background:#f3eadb; color:#795f46; font-weight:700; }
.ub-revenue-progress { height:5px; margin:8px 0; border-radius:3px; background:#f6eae6; }
.ub-revenue-progress span { display:block; height:100%; border-radius:3px; background:#ba7580; }
.ub-revenue-metric-foot .ub-revenue-protect { display:flex; align-items:center; gap:5px; color:var(--wine); font-weight:700; }
.ub-revenue-filter { margin-top:28px; padding:16px 18px; border:1px solid #f6ede8; border-radius:8px; background:#fff; }
.ub-revenue-periods { display:flex; flex-wrap:wrap; gap:3px; width:max-content; max-width:100%; padding:4px; border-radius:5px; background:#f9e9e5; }
.ub-revenue-periods button { display:inline-flex; align-items:center; justify-content:center; gap:5px; min-height:34px; padding:7px 11px; border-radius:4px; color:#64514e; font-size:11px; }
.ub-revenue-periods button.is-active { background:var(--wine); color:#fff; }
.ub-revenue-periods button:hover:not(.is-active) { background:#f1d8d3; }
.ub-revenue-filter-bottom { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:12px; }
.ub-revenue-filter-bottom p { margin:0; color:#8c7872; font-size:11px; }
.ub-revenue-filter-bottom > div { display:flex; gap:6px; }
.ub-revenue-filter-bottom button { display:inline-flex; align-items:center; justify-content:center; gap:5px; min-height:29px; padding:5px 9px; border-radius:3px; background:#f9ece9; color:#6f5754; font-size:10px; white-space:nowrap; }
.ub-revenue-filter-bottom button:hover { background:#efddd8; }
.ub-revenue-advanced { display:flex; flex-wrap:wrap; gap:10px; margin-top:15px; padding-top:15px; border-top:1px solid #f0e6e1; }
.ub-revenue-advanced label { display:flex; flex-direction:column; gap:4px; min-width:150px; color:#675450; font-size:10px; font-weight:700; }
.ub-revenue-advanced input,.ub-revenue-advanced select { min-height:34px; padding:6px 8px; border:1px solid #ead8d1; border-radius:4px; background:#fffaf8; color:#403330; font-size:11px; }
.ub-revenue-advanced p { flex-basis:100%; margin:0; color:#927e79; font-size:10px; }
.ub-revenue-chart-card,.ub-revenue-journal { margin-top:26px; padding:23px 23px 18px; border:1px solid #f1e8e4; border-radius:8px; background:#fff; box-shadow:0 2px 7px #79545108; }
.ub-revenue-chart-top,.ub-revenue-journal-head { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; }
.ub-revenue-chart-card h2,.ub-revenue-journal h2 { margin:0; color:#392e2b; font-family:'Playfair Display',Georgia,serif; font-size:22px; font-weight:500; line-height:1.25; }
.ub-revenue-chart-top p,.ub-revenue-journal-head p { margin:5px 0 0; color:#85736e; font-size:11px; line-height:1.5; }
.ub-revenue-chart-legend { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:14px; padding-top:7px; color:#5e4e49; font-size:10px; white-space:nowrap; }
.ub-revenue-chart-legend span { display:inline-flex; align-items:center; gap:5px; }
.ub-revenue-chart-legend i.bar { width:9px; height:9px; border-radius:2px; background:var(--wine); }
.ub-revenue-chart-legend i.line { width:15px; border-top:2px solid #8b6d45; }
.ub-revenue-chart-scroll { overflow-x:auto; margin-top:12px; scrollbar-color:#b99892 #f8efeb; }
.ub-revenue-chart { display:block; width:100%; min-width:620px; height:auto; }
.ub-revenue-axis { fill:#8d817c; font:10px 'Plus Jakarta Sans',sans-serif; }
.ub-revenue-bar-label { fill:#fff; font:700 11px 'Plus Jakarta Sans',sans-serif; }
.ub-revenue-chart-foot { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-top:7px; padding-top:14px; border-top:1px solid #f2e8e4; }
.ub-revenue-chart-foot p { max-width:55%; margin:0; color:#766863; font-size:11px; line-height:1.5; }
.ub-revenue-chart-foot a { max-width:40%; color:var(--wine); font-size:11px; font-weight:700; line-height:1.4; text-decoration:none; text-transform:uppercase; }
.ub-revenue-chart-foot a:hover { text-decoration:underline; }
.ub-revenue-scroll-hint { display:none; margin:10px 0 0; color:#876e69; font-size:10px; }
.ub-revenue-journal { margin-top:32px; scroll-margin-top:20px; padding:26px 24px 17px; }
.ub-revenue-journal h2 { font-size:20px; }
.ub-revenue-journal-controls { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:6px; }
.ub-revenue-journal-controls label { display:flex; align-items:center; gap:6px; min-width:200px; height:33px; padding:0 9px; border-radius:3px; background:#fbefec; color:#9d7770; }
.ub-revenue-journal-controls input { width:100%; min-width:0; border:0; outline:none; background:transparent; color:#463632; font-size:11px; }
.ub-revenue-journal-controls input::placeholder { color:#9b8881; }
.ub-revenue-journal-controls select { max-width:145px; height:33px; padding:0 7px; border:0; border-radius:3px; background:#fbefec; color:#685652; font-size:10px; }
.ub-revenue-table-scroll { width:100%; overflow-x:auto; margin-top:18px; scrollbar-color:#caa9a2 #f9efeb; }
.ub-revenue-journal table { width:100%; min-width:880px; border-collapse:collapse; text-align:left; }
.ub-revenue-journal th { padding:13px 10px; background:#f9ece8; color:#836f69; font-size:9px; font-weight:700; letter-spacing:.085em; line-height:1.3; }
.ub-revenue-journal td { padding:15px 10px; border-bottom:1px solid #f4ebe7; color:#392d2a; font-size:10px; vertical-align:top; line-height:1.5; }
.ub-revenue-journal td strong { display:block; font-size:11px; font-weight:700; line-height:1.45; }
.ub-revenue-journal td small { display:block; margin-top:3px; color:#9b8983; font-size:9px; line-height:1.4; }
.ub-revenue-journal td .ub-revenue-id { color:#a45e66; }
.ub-revenue-type { display:block; max-width:105px; padding:6px; border-radius:3px; background:#f9eeea; color:#69534e; }
.ub-revenue-journal td.ub-revenue-amount { text-align:right; white-space:nowrap; }
.ub-revenue-status { display:inline-block; max-width:95px; padding:6px 9px; border-radius:15px; background:#f5e2cd; color:#705338; font-weight:700; line-height:1.35; text-align:center; }
.ub-revenue-status.pending { background:#f7e9e6; color:#895c5c; }
.ub-revenue-status.refund { background:#f8e9e7; color:#a26768; }
.ub-revenue-detail { display:grid; place-items:center; width:27px; height:27px; border-radius:4px; color:#825b60; }
.ub-revenue-detail:hover { background:#f9e9e5; }
.ub-revenue-empty { padding:24px 10px; color:#816e68; font-size:12px; }
.ub-revenue-pagination { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:15px; }
.ub-revenue-pagination p { margin:0; color:#9b8983; font-size:10px; }
.ub-revenue-pagination > div { display:flex; gap:3px; }
.ub-revenue-pagination button { display:grid; place-items:center; min-width:25px; height:25px; border-radius:3px; background:#f9ece9; color:#775e59; font-size:10px; }
.ub-revenue-pagination button.is-active { background:var(--wine); color:#fff; }
.ub-revenue-pagination button:disabled { cursor:not-allowed; opacity:.45; }
.ub-revenue-modal-backdrop { position:fixed; z-index:100; inset:0; display:grid; place-items:center; padding:20px; background:#251b1baa; }
.ub-revenue-modal { position:relative; width:min(100%,480px); max-height:90vh; overflow:auto; padding:27px; border-radius:8px; background:#fffaf8; box-shadow:0 15px 45px #180c0c33; }
.ub-revenue-modal-close { position:absolute; top:14px; right:14px; display:grid; place-items:center; width:30px; height:30px; color:#87565c; }
.ub-revenue-modal > p:first-of-type { margin:0; color:#936d68; font-size:10px; letter-spacing:.12em; }
.ub-revenue-modal h2 { margin:5px 0 18px; color:#87565c; font-family:'Playfair Display',Georgia,serif; font-size:28px; }
.ub-revenue-modal dl { display:grid; grid-template-columns:120px 1fr; gap:9px; font-size:12px; }
.ub-revenue-modal dt { color:#8d746e; }
.ub-revenue-modal dd { margin:0; color:#372b28; font-weight:600; }
.ub-revenue-modal > p:last-child { margin:20px 0 0; padding:10px; background:#f8eeea; color:#866a63; font-size:11px; }
@media(max-width:1120px) { .ub-revenue-metric { padding:18px 15px; } .ub-revenue-metric > strong { font-size:clamp(18px,2.3vw,28px); } .ub-revenue-metric-foot p,.ub-revenue-share { font-size:12px; } .ub-revenue-share { align-items:flex-start; flex-direction:column; gap:1px; } .ub-revenue-chart-top,.ub-revenue-journal-head { flex-direction:column; } .ub-revenue-chart-legend,.ub-revenue-journal-controls { justify-content:flex-start; } }
@media(max-width:700px) { .ub-revenue-metric { min-height:0; } .ub-revenue-metric > strong { font-size:27px; } .ub-revenue-filter { padding:12px; } .ub-revenue-periods { width:100%; } .ub-revenue-periods button { flex:1 1 40%; font-size:10px; } .ub-revenue-filter-bottom { align-items:flex-start; flex-direction:column; } .ub-revenue-chart-card,.ub-revenue-journal { margin-top:20px; padding:18px 14px; } .ub-revenue-chart-card h2,.ub-revenue-journal h2 { font-size:20px; } .ub-revenue-scroll-hint { display:block; } .ub-revenue-chart-foot { align-items:flex-start; flex-direction:column; } .ub-revenue-chart-foot p,.ub-revenue-chart-foot a { max-width:100%; } .ub-revenue-journal-controls { width:100%; } .ub-revenue-journal-controls label { flex:1; } .ub-revenue-pagination { align-items:flex-start; flex-direction:column; } }
`;

const MONEY = new Intl.NumberFormat('vi-VN');
const fmt = (value) => `${MONEY.format(value)}đ`;
const REPORTS = {
  month: { label: 'Tháng này', date: 'Tháng 10/2026', total: 2845000000, rental: 1620000000, deposit: 1850000000, orders: 342, bars: [360, 425, 395, 440], weeks: ['01–07/10', '08–14/10', '15–21/10', '22–31/10'] },
  quarter: { label: 'Quý này', date: 'Quý IV/2026 · số liệu mẫu đến 20/10', total: 7620000000, rental: 4420000000, deposit: 2210000000, orders: 924, bars: [940, 1130, 1080, 1270], weeks: ['Đợt 1', 'Đợt 2', 'Đợt 3', 'Đợt 4'] },
  year: { label: 'Năm nay', date: 'Năm 2026 · số liệu mẫu đến 20/10', total: 24600000000, rental: 13800000000, deposit: 2210000000, orders: 2710, bars: [2800, 3300, 3600, 4100], weeks: ['Quý I', 'Quý II', 'Quý III', 'Quý IV*'] },
};

const TRANSACTIONS = [
  { id: 'TX-2026-1041', contract: 'HD-UB-2026-089', date: '20/10/2026', time: '14:30', channel: 'Vietcombank QR', customer: 'Nguyễn Khánh Linh', initials: 'KL', tier: 'VIP DIAMANT', dress: 'Elysian Rose Ballgown', detail: 'Gói thuê 3 ngày · Size S', type: 'Tất toán hợp đồng thuê', amount: 28500000, note: 'Đã gồm VAT 8%', status: 'Đã xuất hóa đơn' },
  { id: 'TX-2026-1040', contract: 'HD-UB-2026-088', date: '20/10/2026', time: '11:15', channel: 'Thẻ Visa Signature', customer: 'Trần Thảo My', initials: 'TM', tier: 'VIP PLATINUM', dress: 'Bespoke Atelier Tailoring', detail: 'Thiết kế độc bản · 6 tuần', type: 'Thanh toán cọc đợt 2 (50%)', amount: 75000000, note: 'Đã gồm VAT 8%', status: 'Đã xuất hóa đơn' },
  { id: 'TX-2026-1039', contract: 'HD-UB-2026-082', date: '19/10/2026', time: '17:40', channel: 'Chuyển khoản VCB', customer: 'Phạm Hoàng Anh', initials: 'HA', tier: 'STANDARD', dress: 'Celeste Royal Mermaid', detail: 'Thuê lễ phục đính đá', type: 'Thanh toán cọc 30%', amount: 6500000, note: 'Bộ phận kế toán kiểm tra', status: 'Đang đối soát' },
  { id: 'TX-2026-1038', contract: 'HD-UB-2026-076', date: '19/10/2026', time: '15:20', channel: 'Tại atelier · QR', customer: 'Lê Quỳnh Như', initials: 'QN', tier: 'VIP DIAMANT', dress: 'Gói Pre-Wedding Heritage', detail: '02 váy cưới · 01 vest chú rể', type: 'Tất toán trọn gói', amount: 32000000, note: 'Đã xuất hóa đơn', status: 'Đã xuất hóa đơn' },
  { id: 'TX-2026-1037', contract: 'HD-UB-2026-069', date: '18/10/2026', time: '19:10', channel: 'Hoàn cọc tự động', customer: 'Đỗ Ngọc Bích', initials: 'NB', tier: 'VIP PLATINUM', dress: 'Hoàn Quỹ Bảo Lãnh Váy', detail: 'Kiểm tra trả váy 100% nguyên vẹn', type: 'Giải tỏa cọc bảo lãnh', amount: -15000000, note: 'SmartOTP hoàn tất', status: 'Hoàn cọc tự động' },
  { id: 'TX-2026-1036', contract: 'HD-UB-2026-061', date: '17/10/2026', time: '09:45', channel: 'Vietcombank QR', customer: 'Vũ Thanh Hương', initials: 'TH', tier: 'STANDARD', dress: 'Juliette Floral A-Line', detail: 'Gói thuê 3 ngày · Size M', type: 'Thanh toán cọc 30%', amount: 8700000, note: 'Đã gồm VAT 8%', status: 'Đã xuất hóa đơn' },
];

const STATUS_OPTIONS = ['Tất cả trạng thái', 'Đã xuất hóa đơn', 'Đang đối soát', 'Hoàn cọc tự động'];
const PAGE_SIZE = 5;

function Metric({ eyebrow, value, icon: Icon, children, className = '' }) {
  return <article className={`ub-revenue-metric ${className}`}>
    <div className="ub-revenue-metric-head"><span>{eyebrow}</span><i><Icon size={19} strokeWidth={1.8} /></i></div>
    <strong>{fmt(value)}</strong>
    <div className="ub-revenue-metric-foot">{children}</div>
  </article>;
}

function RevenueChart({ report }) {
  const max = report.bars.some((bar) => bar > 500) ? Math.ceil(Math.max(...report.bars) / 500) * 500 : 500;
  const y = (value) => 208 - (value / max) * 160;
  const centers = [133, 307, 481, 655];
  const averages = report.bars.map((value, index) => index === 0 ? value : (report.bars[index - 1] + value) / 2);
  const points = averages.map((value, index) => `${centers[index]},${y(value)}`).join(' ');
  return <div className="ub-revenue-chart-scroll" role="region" tabIndex={0} aria-label={`Biểu đồ doanh thu minh họa ${report.date}, các giá trị ${report.bars.join(', ')} triệu đồng; đường biểu diễn bình quân trượt hai kỳ`}>
    <svg viewBox="0 0 760 258" className="ub-revenue-chart" aria-hidden="true">
      {[0, .25, .5, .75, 1].map((fraction) => <g key={fraction}><line x1="58" x2="735" y1={208 - fraction * 160} y2={208 - fraction * 160} stroke="#f2e9e5" strokeDasharray={fraction ? '3 4' : undefined} /><text x="11" y={212 - fraction * 160} className="ub-revenue-axis">{Math.round(max * fraction)}tr</text></g>)}
      {report.bars.map((value, index) => <g key={report.weeks[index]}>
        <rect x={centers[index] - 25} y={y(value)} width="50" height={208 - y(value)} fill="#87565c" rx="2" />
        <text x={centers[index]} y={y(value) + 17} textAnchor="middle" className="ub-revenue-bar-label">{value}tr</text>
        <text x={centers[index]} y="231" textAnchor="middle" className="ub-revenue-axis">{report.weeks[index]}</text>
      </g>)}
      <polyline points={points} fill="none" stroke="#8b6d45" strokeWidth="2" />
      {averages.map((value, index) => <circle key={index} cx={centers[index]} cy={y(value)} r="4" fill="#fff" stroke="#8b6d45" strokeWidth="2" />)}
    </svg>
  </div>;
}

export default function RevenueReportPage() {
  const [period, setPeriod] = useState('month');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [dateFrom, setDateFrom] = useState('2026-10-01');
  const [dateTo, setDateTo] = useState('2026-10-20');
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const report = REPORTS[period] || REPORTS.month;
  const filtered = useMemo(() => TRANSACTIONS.filter((item) => {
    const term = search.trim().toLocaleLowerCase('vi');
    const isoDate = item.date.split('/').reverse().join('-');
    return (!term || [item.id, item.contract, item.customer, item.dress].some((part) => part.toLocaleLowerCase('vi').includes(term))) && (status === STATUS_OPTIONS[0] || item.status === status) && (period !== 'custom' || (isoDate >= dateFrom && isoDate <= dateTo));
  }), [search, status, period, dateFrom, dateTo]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const reset = () => { setPeriod('month'); setSearch(''); setStatus(STATUS_OPTIONS[0]); setPage(1); setDateFrom('2026-10-01'); setDateTo('2026-10-20'); setShowAdvanced(false); };
  const updateSearch = (value) => { setSearch(value); setPage(1); };
  const updateStatus = (value) => { setStatus(value); setPage(1); };

  useEffect(() => {
    if (!selected) return undefined;
    const dialog = dialogRef.current;
    dialog?.querySelector('button')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setSelected(null); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const focusables = [...dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusables.length) { event.preventDefault(); dialog.focus(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); triggerRef.current?.focus(); };
  }, [selected]);

  return <DashboardLayout role="admin" activeNav="Báo Cáo Doanh Thu" title="Báo Cáo Doanh Thu & Tài Chính" subtitle="Phân tích dòng tiền cho thuê lễ phục, hợp đồng may đo và đối soát lợi nhuận hệ thống.">
    <div className="ub-revenue-page">
      <style>{revenueStyles}</style>
      <section className="ub-revenue-metrics grid grid-cols-3 gap-5 max-[1150px]:gap-3 max-[700px]:grid-cols-1" aria-label="Các chỉ số tài chính minh họa">
        <Metric eyebrow={`TỔNG DOANH THU · ${report.date.toUpperCase()}`} value={report.total} icon={Banknote} className="ub-revenue-total"><p><span className="ub-revenue-growth"><TrendingUp size={13} /> +18,4%</span> so với kỳ so sánh minh họa</p><p>Mục tiêu quý IV: 72,8% · Dự kiến 186 hóa đơn điện tử</p></Metric>
        <Metric eyebrow="DOANH THU THUÊ LỄ PHỤC" value={report.rental} icon={TrendingUp}><div className="ub-revenue-share"><span>Tỷ trọng: {Math.round(report.rental / report.total * 100)}% tổng doanh thu</span><span>{report.orders} lượt</span></div><div className="ub-revenue-progress"><span style={{ width: `${Math.round(report.rental / report.total * 100)}%` }} /></div><p>Giá trị bình quân: {fmt(Math.round(report.rental / report.orders))}/lượt</p></Metric>
        <Metric eyebrow="QUỸ CỌC ĐANG PHONG TỎA" value={report.deposit} icon={LockKeyhole}><p className="ub-revenue-protect"><ShieldCheck size={15} /> Quỹ cọc bảo lãnh (minh họa)</p><p>{Math.round(report.orders * .36)} hợp đồng đang giữ cọc · Chưa kết nối ngân hàng</p></Metric>
      </section>

      <section className="ub-revenue-filter" aria-label="Chọn kỳ báo cáo">
        <div className="ub-revenue-periods" role="group" aria-label="Kỳ báo cáo minh họa">
          {Object.entries(REPORTS).map(([key, item]) => <button type="button" key={key} className={period === key ? 'is-active' : ''} aria-pressed={period === key} onClick={() => setPeriod(key)}>{item.label}{key === 'month' ? ' (10/2026)' : ''}</button>)}
          <button type="button" className={period === 'custom' ? 'is-active' : ''} aria-pressed={period === 'custom'} onClick={() => { setPeriod('custom'); setPage(1); setShowAdvanced(true); }}><CalendarDays size={13} /> Tùy chọn ngày</button>
        </div>
        <div className="ub-revenue-filter-bottom"><p>Dữ liệu minh họa · {period === 'custom' ? `Giao dịch từ ${dateFrom} đến ${dateTo}; chỉ số & biểu đồ vẫn là mẫu tháng 10/2026` : report.date}</p><div><button type="button" onClick={() => setShowAdvanced((value) => !value)} aria-expanded={showAdvanced}><SlidersHorizontal size={14} /> Lọc nâng cao</button><button type="button" onClick={reset} aria-label="Đặt lại bộ lọc"><RotateCcw size={15} /></button></div></div>
        {showAdvanced && <div className="ub-revenue-advanced"><label>Từ ngày <input type="date" value={dateFrom} max={dateTo} onChange={(event) => { setDateFrom(event.target.value); setPage(1); setPeriod('custom'); }} /></label><label>Đến ngày <input type="date" value={dateTo} min={dateFrom} onChange={(event) => { setDateTo(event.target.value); setPage(1); setPeriod('custom'); }} /></label><label>Trạng thái đối soát <select value={status} onChange={(event) => updateStatus(event.target.value)}>{STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label><p>Ngày và trạng thái lọc 6 giao dịch minh họa. Chỉ số tổng hợp không tính lại theo ngày tùy chọn.</p></div>}
      </section>

      <section className="ub-revenue-chart-card" aria-labelledby="ub-revenue-chart-title"><div className="ub-revenue-chart-top"><div><h2 id="ub-revenue-chart-title">Biểu Đồ Doanh Thu Thuê Lễ Phục {period === 'month' || period === 'custom' ? 'Theo Tuần' : 'Theo Kỳ'}</h2><p>Doanh thu minh họa theo {report.date.toLocaleLowerCase('vi')} · đơn vị: triệu đồng</p></div><div className="ub-revenue-chart-legend"><span><i className="bar" /> Doanh thu thuê lễ phục</span><span><i className="line" /> Bình quân trượt 2 kỳ</span></div></div><p className="ub-revenue-scroll-hint">Trên màn hình nhỏ, vuốt ngang để xem biểu đồ.</p><RevenueChart report={report} /><div className="ub-revenue-chart-foot"><p>Ballgown và Mermaid chiếm khoảng 78% doanh thu thuê trong bộ dữ liệu minh họa.</p><a href="#ub-revenue-journal">Xem nhật ký giao dịch &amp; hoàn cọc thuê →</a></div></section>

      <section id="ub-revenue-journal" className="ub-revenue-journal" aria-labelledby="ub-revenue-journal-title"><div className="ub-revenue-journal-head"><div><h2 id="ub-revenue-journal-title">Sổ Nhật Ký Doanh Thu &amp; Đối Soát Giao Dịch Gần Nhất</h2><p>6 giao dịch mẫu của hệ thống POS, chuyển khoản và hợp đồng điện tử.</p></div><div className="ub-revenue-journal-controls"><label><Search size={15} /><input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Tìm mã, khách hàng, váy..." aria-label="Tìm giao dịch mẫu" /></label><select value={status} onChange={(event) => updateStatus(event.target.value)} aria-label="Lọc trạng thái giao dịch">{STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></div></div>
        <p className="ub-revenue-scroll-hint">Vuốt ngang để xem đủ các cột giao dịch.</p>
        <div className="ub-revenue-table-scroll" role="region" tabIndex={0} aria-label="Bảng giao dịch có thể cuộn ngang"><table><thead><tr><th>MÃ GD &amp; HỢP ĐỒNG</th><th>THỜI GIAN &amp; KÊNH THU</th><th>KHÁCH HÀNG</th><th>LỄ PHỤC / DỊCH VỤ</th><th>LOẠI THU</th><th>DOANH THU THỰC NHẬN</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong className="ub-revenue-id">{item.id}</strong><small>{item.contract}</small></td><td><strong>{item.date} · {item.time}</strong><small>{item.channel}</small></td><td><strong>{item.customer}</strong><small>{item.tier}</small></td><td><strong>{item.dress}</strong><small>{item.detail}</small></td><td><span className="ub-revenue-type">{item.type}</span></td><td className="ub-revenue-amount"><strong>{fmt(item.amount)}</strong><small>{item.note}</small></td><td><span className={`ub-revenue-status ${item.status === 'Đang đối soát' ? 'pending' : item.status === 'Hoàn cọc tự động' ? 'refund' : ''}`}>{item.status}</span></td><td><button type="button" className="ub-revenue-detail" onClick={(event) => { triggerRef.current = event.currentTarget; setSelected(item); }} aria-label={`Xem chi tiết ${item.id}`}><FileSearch size={17} /></button></td></tr>)}</tbody></table>{rows.length === 0 && <p className="ub-revenue-empty">Không có giao dịch mẫu phù hợp với bộ lọc.</p>}</div>
        <div className="ub-revenue-pagination"><p>Hiển thị {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} trong {filtered.length} giao dịch mẫu</p><div><button type="button" aria-label="Trang trước" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={15} /></button>{Array.from({ length: pageCount }, (_, index) => <button type="button" key={index} className={page === index + 1 ? 'is-active' : ''} aria-current={page === index + 1 ? 'page' : undefined} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button type="button" aria-label="Trang sau" disabled={page === pageCount} onClick={() => setPage(page + 1)}><ChevronRight size={15} /></button></div></div>
      </section>
    </div>
    {selected && <div className="ub-revenue-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section ref={dialogRef} tabIndex={-1} className="ub-revenue-modal" role="dialog" aria-modal="true" aria-labelledby="ub-revenue-modal-title"><button type="button" className="ub-revenue-modal-close" onClick={() => setSelected(null)} aria-label="Đóng chi tiết"><X size={19} /></button><p>CHI TIẾT GIAO DỊCH MINH HỌA</p><h2 id="ub-revenue-modal-title">{selected.id}</h2><dl><dt>Hợp đồng</dt><dd>{selected.contract}</dd><dt>Khách hàng</dt><dd>{selected.customer}</dd><dt>Dịch vụ</dt><dd>{selected.dress}</dd><dt>Thời gian / Kênh</dt><dd>{selected.date} · {selected.time} / {selected.channel}</dd><dt>Loại thu</dt><dd>{selected.type}</dd><dt>Số tiền</dt><dd>{fmt(selected.amount)}</dd><dt>Trạng thái</dt><dd>{selected.status}</dd></dl><p>Đây là dữ liệu mẫu, chưa kết nối hệ thống hóa đơn hoặc ngân hàng.</p></section></div>}
  </DashboardLayout>;
}
