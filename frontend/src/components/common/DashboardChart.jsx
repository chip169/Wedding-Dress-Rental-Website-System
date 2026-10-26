import React from 'react';
import { MoveHorizontal } from 'lucide-react';

const dashboardChartStyles = `
.ub-dashboard-heading-row h1 { margin: 0; color: #87565c; font-family: 'Playfair Display', Georgia, serif; font-size: clamp(31px, 3.5vw, 42px); font-weight: 400; line-height: 1.12; }
.ub-dashboard-heading-row p { margin: 2px 0 0; color: #6f625f; font-size: 12px; }
.ub-dashboard-demo-label { display: inline-flex; align-items: center; gap: 5px; margin: 10px 0 12px; color: #987b74; font-size: 10px; letter-spacing: .04em; }
.ub-dashboard-metric { box-shadow: 0 2px 2px #78575708; }
.ub-dashboard-metric-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; min-height: 28px; }
.ub-dashboard-metric-head > span:first-child { color: #6c5750; font-size: 10px; font-weight: 700; letter-spacing: .09em; line-height: 1.5; }
.ub-dashboard-metric-icon { display: grid; flex: none; place-items: center; width: 40px; height: 40px; border-radius: 12px; }
.ub-dashboard-metric-icon.rose { background: #fff0ed; color: #a6646d; }
.ub-dashboard-metric-icon.gold { background: #f4e3d1; color: #84654c; }
.ub-dashboard-metric-icon.amber { background: #ffe2c4; color: #765434; }
.ub-dashboard-metric-value { display: flex; align-items: baseline; gap: 8px; margin-top: -4px; color: #2b2523; font-family: 'Playfair Display', Georgia, serif; font-size: clamp(31px, 3vw, 43px); font-weight: 400; line-height: 1.35; white-space: nowrap; }
.ub-dashboard-metric-value small { color: #7a665d; font-size: 18px; }
.ub-dashboard-metric p { display: flex; align-items: center; gap: 4px; overflow: hidden; margin: 7px 0 7px; color: #665b58; font-size: 10px; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
.ub-dashboard-metric p svg { flex: none; color: #b17652; }
.ub-dashboard-metric p.is-positive, .ub-dashboard-metric p.is-positive svg { color: #438653; }
.ub-dashboard-metric p.is-alert { color: #c53d39; }
.ub-dashboard-alert-dot { width: 7px; height: 7px; border-radius: 50%; background: #c53d39; }
.ub-dashboard-progress { overflow: hidden; height: 4px; border-radius: 4px; background: #fae9e5; }
.ub-dashboard-progress > span { display: block; height: 100%; border-radius: inherit; background: #87565c; }
.ub-dashboard-metric:nth-child(2) .ub-dashboard-progress > span, .ub-dashboard-metric:nth-child(3) .ub-dashboard-progress > span { background: #b99568; }
.ub-dashboard-chart-card { box-shadow: 0 2px 3px #78575706; }
.ub-dashboard-eyebrow { display: flex; align-items: center; gap: 5px; margin: 0 0 6px; color: #98786a; font-size: 11px; letter-spacing: .11em; }
.ub-dashboard-eyebrow svg { color: #ad6974; }
.ub-dashboard-chart-head h2 { margin: 0; color: #332728; font-family: 'Playfair Display', Georgia, serif; font-size: clamp(20px, 2vw, 25px); font-weight: 500; line-height: 1.35; }
.ub-dashboard-chart-subtitle { margin: 4px 0 0; color: #6e6561; font-size: 11px; line-height: 1.5; }
.ub-dashboard-periods { display: inline-flex; flex: none; padding: 4px; border-radius: 6px; background: #f9ece9; }
.ub-dashboard-periods button { min-width: 75px; min-height: 28px; padding: 5px 8px; border-radius: 5px; color: #5d4d49; font-size: 10px; font-weight: 600; line-height: 1.2; }
.ub-dashboard-periods button.is-active { background: #fff; color: #95575f; box-shadow: 0 1px 3px #3f25231a; }
.ub-dashboard-periods button:hover:not(.is-active) { background: #f4e2dd; }
.ub-dashboard-periods button:focus-visible { outline: 2px solid #9a5861; outline-offset: 2px; }
.ub-chart-legend { display: flex; flex-wrap: wrap; gap: 18px; margin: 15px 0 4px; color: #5d4f4a; font-size: 10px; font-weight: 600; }
.ub-chart-legend > span { display: inline-flex; align-items: center; gap: 6px; }
.ub-chart-dot { width: 9px; height: 9px; border-radius: 50%; }
.ub-chart-dot.primary { background: #87565c; }
.is-admin .ub-chart-dot.primary { background: #cc9ca1; }
.ub-chart-dot.secondary { background: #efd8c2; }
.ub-chart-line-key { width: 18px; height: 0; border-top: 2px dashed #9e6b55; }
.is-admin .ub-chart-line-key { border-top-style: solid; border-top-color: #8c704d; }
.ub-chart-scroll { width: 100%; overflow-x: auto; scrollbar-color: #cba9a7 #f8ede9; }
.ub-chart-scroll:focus-visible { outline: 2px solid #9a5861; outline-offset: 2px; }
.ub-chart-scroll-hint { display: none; }
.ub-chart-svg { display: block; width: 100%; min-width: 530px; height: auto; margin-top: 11px; }
.ub-chart-axis { fill: #826e67; font-size: 10px; font-family: 'Plus Jakarta Sans', sans-serif; }
.ub-chart-x { fill: #5b4b45; font-size: 11px; font-weight: 600; }
.ub-dashboard-insight { display: flex; align-items: flex-start; gap: 12px; margin-top: 20px; padding: 14px 16px; border-radius: 6px; background: #fffaf8; border: 1px solid #f6ebe6; color: #62504b; font-size: 12px; line-height: 1.6; }
.ub-dashboard-insight svg { flex: none; color: #87565c; margin-top: 2px; }
.ub-dashboard-performance { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; margin-bottom: 6px; font-size: 11px; color: #63534d; }
.ub-dashboard-metric-breakdown { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; font-size: 11px; color: #67554f; }
.ub-dashboard-metric-breakdown span { display: flex; align-items: center; gap: 6px; }
.ub-dashboard-metric-breakdown i { width: 6px; height: 6px; border-radius: 50%; background: #9c6e64; }
.ub-dashboard-title-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #9e606a; margin-right: 8px; }
`;

const W = 760;
const H = 260;
const PLOT_LEFT = 44;
const PLOT_RIGHT = 22;
const PLOT_TOP = 18;
const PLOT_BOTTOM = 220;

export default function DashboardChart({ labels, primary, secondary, trend, max, ticks, primaryLabel, secondaryLabel, trendLabel, chartId, unit = '', variant = 'staff' }) {
  const plotHeight = PLOT_BOTTOM - PLOT_TOP;
  const plotWidth = W - PLOT_LEFT - PLOT_RIGHT;
  const groupWidth = plotWidth / labels.length;
  const y = (value) => PLOT_BOTTOM - (Math.min(max, value) / max) * plotHeight;
  const points = trend.map((value, index) => `${PLOT_LEFT + groupWidth * (index + .5)},${y(value)}`).join(' ');

  return (
    <>
      <style>{dashboardChartStyles}</style>
      <div className="ub-chart-legend" aria-label="Chú giải biểu đồ">
        <span><i className="ub-chart-dot primary" />{primaryLabel}</span>
        <span><i className="ub-chart-dot secondary" />{secondaryLabel}</span>
        <span><i className="ub-chart-line-key" />{trendLabel}</span>
      </div>
      <p className="ub-chart-scroll-hint"><MoveHorizontal size={14} /> Vuốt ngang để xem toàn bộ biểu đồ</p>
      <div className="ub-chart-scroll" role="region" tabIndex={0} aria-label={`Biểu đồ có thể cuộn ngang: ${primaryLabel}, ${secondaryLabel} và ${trendLabel} theo ${labels.join(', ')}`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="ub-chart-svg" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PLOT_LEFT} x2={W - PLOT_RIGHT} y1={y(tick)} y2={y(tick)} stroke="#f0e6e2" strokeDasharray={tick === 0 ? undefined : '3 4'} />
              <text x="0" y={y(tick) + 4} className="ub-chart-axis">{tick}{unit}</text>
            </g>
          ))}
          {labels.map((label, index) => {
            const center = PLOT_LEFT + groupWidth * (index + .5);
            const barWidth = Math.min(25, groupWidth * .26);
            return (
              <g key={`${chartId}-${label}`}>
                <rect x={center - barWidth - 2} y={y(primary[index])} width={barWidth} height={PLOT_BOTTOM - y(primary[index])} rx="1.5" fill={variant === 'admin' && index !== labels.length - 1 ? '#cc9ca1' : '#87565c'} />
                <rect x={center + 2} y={y(secondary[index])} width={barWidth} height={PLOT_BOTTOM - y(secondary[index])} rx="1.5" fill="#efd8c2" />
                <text x={center} y={PLOT_BOTTOM + 18} textAnchor="middle" className="ub-chart-axis ub-chart-x">{label}</text>
              </g>
            );
          })}
          <polyline points={points} fill="none" stroke="#8c704d" strokeWidth="2.2" strokeDasharray={variant === 'admin' ? undefined : '3 4'} />
          {trend.map((value, index) => <circle key={index} cx={PLOT_LEFT + groupWidth * (index + .5)} cy={y(value)} r="3.4" fill="#fff" stroke="#9e6b55" strokeWidth="2" />)}
        </svg>
      </div>
    </>
  );
}
