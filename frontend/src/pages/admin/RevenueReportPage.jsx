import { formatCurrencyVND } from '../../utils/formatCurrency';
import React, { useEffect, useState } from 'react';
import {
  Banknote,
  LockKeyhole,
  TrendingUp,
  CreditCard,
  AlertCircle,
  PieChart,
  Award,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getRevenueReport } from '../../services/reportService';
import { roundedChartScale, formatGrowth } from '../../utils/chartScale';

const revenueReportStyles = `
/* UniBridal Haute Couture — Luxury Revenue Report Styling */
.ub-revenue-page {
  --wine: #733F49;
  --wine-dark: #5C2D35;
  --wine-light: #F7E9E6;
  --gold: #D8B168;
  --gold-dark: #B88E3E;
  --gold-light: #FBF6EB;
  --ink: #2C2424;
  --muted: #7E706D;
  --card-bg: #FFFFFF;
  --border-color: #F2E8E4;
  color: var(--ink);
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}

.ub-revenue-page button,
.ub-revenue-page input,
.ub-revenue-page select {
  font: inherit;
}

/* Metric Cards */
.ub-revenue-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 18px;
  margin-top: 12px;
}

.ub-revenue-metric {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 175px;
  padding: 22px 24px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #FFFFFF;
  box-shadow: 0 4px 16px rgba(115, 63, 73, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.ub-revenue-metric:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(115, 63, 73, 0.08);
}

.ub-revenue-metric::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--wine), var(--gold));
  opacity: 0.85;
}

.ub-revenue-metric-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ub-revenue-metric-head i {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--wine-light);
  color: var(--wine);
  font-style: normal;
}

.ub-revenue-metric > strong {
  display: block;
  margin: 12px 0 6px;
  color: var(--wine);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(22px, 2.1vw, 30px);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.ub-revenue-metric-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #F6EDE8;
}

.ub-revenue-metric-foot p {
  margin: 0;
  color: var(--muted);
  font-size: 11.5px;
  line-height: 1.4;
}

.ub-revenue-growth {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 20px;
  background: #E8F7EE;
  color: #1E824C;
  font-size: 11px;
  font-weight: 700;
}

/* Period Filter Bar */
.ub-revenue-filter-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
  padding: 14px 20px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: #FFFFFF;
}

.ub-revenue-periods {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 8px;
  background: #F8EFEA;
}

.ub-revenue-periods button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6C5854;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ub-revenue-periods button:hover:not(.is-active) {
  background: #F2DFD9;
  color: var(--wine);
}

.ub-revenue-periods button.is-active {
  background: var(--wine);
  color: #FFFFFF;
  box-shadow: 0 2px 6px rgba(115, 63, 73, 0.25);
}

.ub-revenue-db-live {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4A7A57;
  font-size: 12px;
  font-weight: 600;
}

.ub-revenue-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2ECC71;
  box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.25);
  animation: ub-pulse 2s infinite;
}

@keyframes ub-pulse {
  0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.5); }
  70% { box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); }
  100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
}

/* Chart Container và Header */
.ub-revenue-chart-card {
  position: relative;
  margin-top: 24px;
  padding: 26px 28px 22px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #FFFFFF;
  box-shadow: 0 4px 20px rgba(115, 63, 73, 0.04);
}

.ub-revenue-chart-top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}

.ub-revenue-chart-card h2 {
  margin: 0;
  color: var(--ink);
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.3;
}

.ub-revenue-chart-top p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
}

/* SVG Chart Visualization */
.ub-revenue-chart-scroll {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 8px;
}

.ub-revenue-chart-plot {
  position: relative;
  min-width: 680px;
}

.ub-revenue-chart-svg {
  display: block;
  width: 100%;
  height: 290px;
}

.ub-revenue-axis-text {
  fill: #8D817C;
  font-size: 11px;
  font-weight: 500;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.ub-revenue-axis-label-x {
  fill: #5A4743;
  font-size: 11.5px;
  font-weight: 600;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* Interactive Floating Tooltip */
.ub-revenue-tooltip-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  width: 218px;
  padding: 12px 14px;
  border: 1px solid #EADBCE;
  border-radius: 8px;
  background: rgba(44, 36, 36, 0.95);
  backdrop-filter: blur(8px);
  color: #FFFFFF;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  transform: translate(-50%, calc(-100% - 8px));
  transition: left 0.12s ease-out, top 0.12s ease-out;
}

.ub-revenue-tooltip-overlay.is-below {
  transform: translate(-50%, 8px);
}

.ub-revenue-tooltip-title {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--gold);
  text-transform: uppercase;
}

.ub-revenue-tooltip-val {
  font-size: 15px;
  font-weight: 700;
  color: #FFFFFF;
}

.ub-revenue-tooltip-sub {
  margin-top: 4px;
  font-size: 11px;
  color: #E2D3CE;
  line-height: 1.4;
}

/* Chart Foot Legend và Metrics */
.ub-revenue-chart-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.ub-revenue-chart-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  font-size: 12px;
  color: var(--muted);
}

.ub-revenue-chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ub-revenue-legend-bar {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: linear-gradient(180deg, #B8737D, #733F49);
}

.ub-revenue-peak-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--gold-light);
  color: var(--gold-dark);
  font-size: 11.5px;
  font-weight: 700;
}

/* Table */

@media (max-width: 768px) {
  .ub-revenue-filter-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .ub-revenue-periods {
    width: 100%;
    overflow-x: auto;
  }
}

.ub-revenue-growth.is-negative { color: #b42318; background: #fef3f2; }
`;

const money = (value) => value == null ? '—' : formatCurrencyVND(value);
const percent = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 });

const REVENUE_SOURCES = [
  { label: 'Tiền thuê váy', amount: 'rentalRevenue', share: 'rentalPercentage', color: 'bg-[#733F49]' },
  { label: 'Tiền đền bù hư hỏng', amount: 'damagePayment', share: 'damagePercentage', color: 'bg-[#D8B168]' },
  { label: 'Phí trả váy quá hạn', amount: 'latePenaltyRevenue', share: 'latePenaltyPercentage', color: 'bg-[#5C8275]' },
];

const PERIODS = {
  week: '7 ngày qua',
  month: 'Tháng này',
  quarter: 'Quý này',
  year: 'Năm nay',
};

function MetricCard({ title, value, Icon, note, growth }) {
  return (
    <article className="ub-revenue-metric">
      <div className="ub-revenue-metric-head">
        <span>{title}</span>
        <i>
          <Icon size={19} />
        </i>
      </div>
      <strong>{money(value)}</strong>
      <div className="ub-revenue-metric-foot">
        <p>{note}</p>
        {growth != null && <span title="So với kỳ trước" className={`ub-revenue-growth ${growth < 0 ? 'is-negative' : ''}`}>{formatGrowth(growth)}</span>}
      </div>
    </article>
  );
}

function LuxuryRevenueChart({ entries = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const maxRevenue = Math.max(
    10000000,
    ...entries.map((item) => Math.max(item.revenue || 0, item.rentalRevenue || 0))
  );

  const { max: scaleMax, ticks } = roundedChartScale(maxRevenue, 5000000);

  const svgWidth = 840;
  const svgHeight = 290;
  const chartBottom = 230;
  const chartTop = 30;
  const chartHeight = chartBottom - chartTop;
  const leftMargin = 75;
  const rightMargin = 40;
  const usableWidth = svgWidth - leftMargin - rightMargin;

  const count = Math.max(1, entries.length);
  const stepX = usableWidth / count;

  // Calculate bar positions and label anchors.
  const points = entries.map((item, index) => {
    const x = leftMargin + index * stepX + stepX * 0.5;
    const rev = item.revenue || 0;
    const y = chartBottom - (rev / scaleMax) * chartHeight;
    return { x, y, item, index };
  });

  // Find peak point
  const peakPoint = points.reduce((peak, point) => !peak || point.item.revenue > peak.item.revenue ? point : peak, null);

  const hoveredItem = hoveredIndex !== null ? entries[hoveredIndex] : null;
  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="ub-revenue-chart-scroll" role="region" aria-label="Biểu đồ doanh thu thực nhận">
      <div className="ub-revenue-chart-plot">
        {hoveredItem && hoveredPoint && (
          <div
            className={`ub-revenue-tooltip-overlay${hoveredPoint.y < 120 ? ' is-below' : ''}`}
            style={{
              left: `clamp(109px, ${(hoveredPoint.x / svgWidth) * 100}%, calc(100% - 109px))`,
              top: `${(hoveredPoint.y / svgHeight) * 100}%`,
            }}
          >
            <p className="ub-revenue-tooltip-title">{hoveredItem.label}</p>
            <div className="ub-revenue-tooltip-val">{money(hoveredItem.revenue)}</div>
            <div className="ub-revenue-tooltip-sub">
              {REVENUE_SOURCES.map(({ label, amount }) => (
                <div key={amount}>{label}: {money(hoveredItem[amount] ?? 0)}</div>
              ))}
            </div>
          </div>
        )}

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="ub-revenue-chart-svg" preserveAspectRatio="none">
          <defs>
            {/* Main Bar Gradient */}
            <linearGradient id="ubBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B8737D" />
              <stop offset="100%" stopColor="#733F49" />
            </linearGradient>

            {/* Bar Hover Gradient */}
            <linearGradient id="ubBarHoverGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5D07A" />
              <stop offset="100%" stopColor="#D8B168" />
            </linearGradient>

            {/* Soft Shadow Filter */}
            <filter id="ubSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#733F49" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Horizontal Grid lines and Y-axis labels */}
          {ticks.map((tick) => {
            const y = chartBottom - (tick / scaleMax) * chartHeight;
            const valInMillions = tick / 1000000;
            return (
              <g key={tick}>
                <line
                  x1={leftMargin}
                  x2={svgWidth - rightMargin}
                  y1={y}
                  y2={y}
                  stroke="#F2E6E2"
                  strokeWidth={tick === 0 ? 1.5 : 1}
                  strokeDasharray={tick === 0 ? undefined : '4 4'}
                />
                <text x={leftMargin - 12} y={y + 4} textAnchor="end" className="ub-revenue-axis-text">
                  {valInMillions}tr ₫
                </text>
              </g>
            );
          })}

          {/* Shaded hover columns */}
          {entries.map((item, index) => {
            const colX = leftMargin + index * stepX;
            const isHovered = hoveredIndex === index;
            return (
              <rect
                key={`col-hover-${index}`}
                x={colX + 2}
                y={chartTop}
                width={stepX - 4}
                height={chartHeight}
                fill={isHovered ? 'rgba(115, 63, 73, 0.05)' : 'transparent'}
                rx={6}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
              />
            );
          })}

          {/* Revenue bars */}
          {entries.map((item, index) => {
              const barWidth = Math.min(42, Math.max(18, stepX * 0.42));
              const rev = item.revenue || 0;
              const bHeight = Math.max(0, (rev / scaleMax) * chartHeight);
              const x = leftMargin + index * stepX + (stepX - barWidth) / 2;
              const y = chartBottom - bHeight;
              const isHovered = hoveredIndex === index;

              return (
                <g key={`bar-${index}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={bHeight}
                    fill={isHovered ? 'url(#ubBarHoverGrad)' : 'url(#ubBarGrad)'}
                    rx={5}
                    filter={isHovered ? 'url(#ubSoftGlow)' : undefined}
                    style={{
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}

          {/* Peak badge và X labels */}
          {points.map((pt) => {
            const isHovered = hoveredIndex === pt.index;
            const isPeak = peakPoint && peakPoint.index === pt.index && (pt.item.revenue || 0) > 0;

            return (
              <g key={`pt-${pt.index}`}>
                {/* Peak badge pin on top */}
                {isPeak && !isHovered && (
                  <g>
                    <rect
                      x={pt.x - 38}
                      y={pt.y - 24}
                      width={76}
                      height={18}
                      rx={4}
                      fill="#733F49"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 12}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize={9.5}
                      fontWeight={700}
                    >
                      Đỉnh: {Math.round((pt.item.revenue || 0) / 1000000)}tr
                    </text>
                  </g>
                )}

                {/* X Axis Label */}
                <text
                  x={pt.x}
                  y={chartBottom + 22}
                  textAnchor="middle"
                  className="ub-revenue-axis-label-x"
                >
                  {pt.item.shortLabel || pt.item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function RevenueReportPage() {
  const [period, setPeriod] = useState('month');
  const [reload, setReload] = useState(0);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setReport(null);

    getRevenueReport(period)
      .then((data) => {
        if (!active) return;
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError('Không thể kết nối cơ sở dữ liệu để tải báo cáo doanh thu.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [period, reload]);

  const avgOrderValue = report ? Math.round((report.orderValue || 0) / (report.activeOrdersCount || 1)) : null;

  return (
    <DashboardLayout
      role="admin"
      activeNav="Báo Cáo Doanh Thu"
      title="Báo Cáo Doanh Thu"
      subtitle="Theo dõi tiền thuê váy, các khoản đền bù, phí trả quá hạn và số dư tiền cọc."
    >
      <div className="ub-revenue-page">
        <style>{revenueReportStyles}</style>
        {error && (
          <div role="alert" className="p-4 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span><button type="button" className="underline" onClick={() => setReload((value) => value + 1)}>Thử lại</button>
          </div>
        )}

        <section className="ub-revenue-metrics" aria-label="Chỉ số doanh thu chính">
          <MetricCard
            title="DOANH THU ĐÃ THU"
            value={report?.revenue}
            Icon={TrendingUp}
            note="Tiền thuê váy, đền bù hư hỏng và phí trả quá hạn trong kỳ."
            growth={report?.growthRate}
          />
          <MetricCard
            title="TIỀN CỌC CÒN GIỮ"
            value={report?.depositsHeld}
            Icon={LockKeyhole}
            note="Cọc đã thu, trừ phần đã hoàn theo giao dịch và phần đã khấu trừ, tính đến cuối kỳ."
          />
          <MetricCard
            title="TỔNG TIỀN THUÊ THEO ĐƠN"
            value={report?.orderValue}
            Icon={Banknote}
            note={report
              ? `Tính ${report.activeOrdersCount} trên ${report.orders} đơn trong kỳ. Chỉ tính đơn đã qua bước đặt cọc và chưa hủy.`
              : 'Tiền thuê ghi trên các đơn đã qua bước đặt cọc và chưa hủy.'}
          />
          <MetricCard
            title="TIỀN THUÊ TRUNG BÌNH MỖI ĐƠN"
            value={avgOrderValue}
            Icon={CreditCard}
            note="Tổng tiền thuê theo đơn chia cho số đơn đã qua bước đặt cọc và chưa hủy trong kỳ."
          />
        </section>

        {/* Period Selector và Live Database Indicator */}
        <section className="ub-revenue-filter-card" aria-label="Bộ lọc kỳ báo cáo">
          <div className="ub-revenue-periods" role="group">
            {Object.entries(PERIODS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={period === key ? 'is-active' : ''}
                aria-pressed={period === key}
                onClick={() => setPeriod(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="ub-revenue-db-live">
            <span className="ub-revenue-live-dot" />
            <span>{loading ? 'Đang tải dữ liệu...' : error ? 'Chưa tải được báo cáo' : `Dữ liệu từ hệ thống (${report?.transactions?.length || 0} giao dịch)`}</span>
          </div>
        </section>

        {/* Redesigned Luxury Revenue Chart */}
        <section className="ub-revenue-chart-card" aria-labelledby="ub-revenue-chart-title">
          <div className="ub-revenue-chart-top">
            <div>
              <h2 id="ub-revenue-chart-title">Biểu Đồ Doanh Thu</h2>
              <p>Tiền thuê, đền bù hư hỏng và phí trả quá hạn theo kỳ · Đơn vị: triệu đồng (VNĐ)</p>
            </div>

          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-stone-500">
              Đang tải dữ liệu biểu đồ từ MongoDB...
            </div>
          ) : report ? (
            <LuxuryRevenueChart key={period} entries={report.chart || []} />
          ) : (
            <p className="py-20 text-center text-sm text-stone-500">Chưa tải được dữ liệu biểu đồ.</p>
          )}

          <div className="ub-revenue-chart-foot">
            <div className="ub-revenue-chart-legend">
              <span>
                <i className="ub-revenue-legend-bar" /> Cột doanh thu thực nhận
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="ub-revenue-peak-badge">
                <TrendingUp size={14} /> Tổng kỳ: {money(report?.revenue)}
              </span>
            </div>
          </div>
        </section>

        {report && <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-6" aria-label="Phân tích chuyên sâu doanh thu">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EFE5E1] p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-[#FAF0EC] flex items-center justify-center text-[#733F49]">
                <PieChart size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2C2523] uppercase tracking-wider">Cơ Cấu Dòng Tiền Thu Vào</h3>
                <p className="text-xs text-[#8A797A]">Tỷ trọng từng nguồn trong doanh thu đã thu của kỳ</p>
              </div>
            </div>

            <div className="h-3 rounded-full bg-[#F5EBE8] overflow-hidden flex my-4" aria-hidden="true">
              {REVENUE_SOURCES.map(({ share, color }) => (
                <div key={share} style={{ width: `${report.financialBreakdown?.[share] ?? 0}%` }} className={color} />
              ))}
            </div>

            <dl className="space-y-3 text-xs">
              {REVENUE_SOURCES.map(({ label, amount, share, color }) => (
                <div key={amount} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#FFF9F7] border border-[#F5EAE6]">
                  <dt className="flex items-center gap-2 font-medium text-[#4A3C3D]">
                    <span className={`w-2.5 h-2.5 shrink-0 rounded-full ${color}`} aria-hidden="true" />
                    {label}
                  </dt>
                  <dd className="shrink-0 text-right">
                    <span className="block font-bold text-[#733F49] text-sm">{money(report.financialBreakdown?.[amount] ?? 0)}</span>
                    <span className="text-[#786663]">{percent.format((report.financialBreakdown?.[share] ?? 0) / 100)}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 pt-3 border-t border-[#F2E7E2] text-xs text-[#786663]">
              Phần cọc khấu trừ được ghi nhận khi đơn có giao dịch cọc thành công và biên bản kiểm định đã được xác nhận.
            </p>
          </div>

          {/* Card Phải: Top 5 Mẫu Váy Cưới Mang Lại Doanh Thu Cao Nhất */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EFE5E1] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF0EC] flex items-center justify-center text-[#733F49]">
                    <Award size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#2C2523] uppercase tracking-wider">Top Mẫu Váy Theo Tiền Thuê Đã Thu</h3>
                    <p className="text-xs text-[#8A797A]">Xếp hạng theo tiền thuê đã thu trong kỳ</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAF0EC] text-[#733F49] border border-[#F2DFD9]">
                  Niên độ 2026
                </span>
              </div>

              {/* Bảng Top Váy */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#F4EBE7] text-[#9A8B8C] font-semibold">
                      <th className="pb-2.5 w-10 text-center">Hạng</th>
                      <th className="pb-2.5">Mẫu Lễ Phục</th>
                      <th className="pb-2.5 text-center">Số Lượt Thuê</th>
                      <th className="pb-2.5 text-right">Doanh Thu Thuê</th>
                      <th className="pb-2.5 text-right w-24">Tỷ Trọng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F7EFEA]">
                    {!report.topDresses?.length && (
                      <tr>
                        <td colSpan={5} className="py-5 text-center text-[#786663]">Chưa ghi nhận tiền thuê theo mẫu váy trong kỳ.</td>
                      </tr>
                    )}
                    {report.topDresses?.map((dress, index) => (
                      <tr key={dress.name || index} className="hover:bg-[#FFFDFB] transition-colors">
                        <td className="py-2.5 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            dress.rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            dress.rank === 2 ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                            dress.rank === 3 ? 'bg-[#FAF0EC] text-[#733F49] border border-[#E8DDD8]' :
                            'text-[#8A797A]'
                          }`}>
                            {dress.rank}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2">
                          <div className="font-semibold text-[#2C2523] truncate max-w-[200px]">{dress.name}</div>
                          <span className="text-[10px] text-[#A39293] font-mono">{dress.code}</span>
                        </td>
                        <td className="py-2.5 text-center font-medium text-[#5D4E50]">
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF2EE] text-[#5F4648] font-bold">
                            {dress.rentalCount} lượt
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-[#733F49]">
                          {money(dress.totalRevenue)}
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-semibold text-[11px] text-[#733F49]">{dress.share ?? 0}%</span>
                            <div className="w-10 h-1.5 rounded-full bg-[#F5EBE8] overflow-hidden">
                              <div
                                style={{ width: `${Math.min(100, dress.share ?? 0)}%` }}
                                className="h-full bg-[#733F49] rounded-full"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F2E7E2] flex items-center justify-between text-xs text-[#8A797A]">
              <span>Phân bổ tiền thuê đã thanh toán cho từng mẫu váy</span>
              <span className="font-semibold text-emerald-700">Theo giao dịch thành công</span>
            </div>
          </div>
        </section>}

      </div>
    </DashboardLayout>
  );
}
