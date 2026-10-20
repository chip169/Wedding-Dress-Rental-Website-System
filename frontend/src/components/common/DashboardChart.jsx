import React from 'react';
import { MoveHorizontal } from 'lucide-react';

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
