import { formatCurrencyVND } from '../../utils/formatCurrency';
import React, { useEffect, useMemo, useState } from 'react';
import {
  PackageCheck,
  CalendarDays,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Users,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardChart from '../../components/common/DashboardChart';
import { roundedChartScale } from '../../utils/chartScale';
import { getAdminDashboard } from '../../services/reportService';

const PERIODS = { week: '7 ngày qua', month: 'Tháng này', quarter: 'Quý này', year: 'Năm nay' };
const money = (value) => value == null ? '—' : formatCurrencyVND(value);

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState('month');
  const [reload, setReload] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    setLoading(true);
    setData(null);
    getAdminDashboard(period)
      .then((value) => {
        if (!active) return;
        if (value) {
          setData(value?.data || value);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setData(null);
        setError('Lỗi kết nối cơ sở dữ liệu: Không thể tải dữ liệu thống kê quản trị từ máy chủ MongoDB.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period, reload]);

  const chart = useMemo(() => {
    const values = data?.chart || [];
    const primary = values.map((item) => (item.orderValue || 0) / 1_000_000);
    const { max, ticks } = roundedChartScale(Math.max(0, ...primary));
    return {
      labels: values.map((item) => item.label),
      primary,
      tooltipValues: values.map((item) => item.orderValue || 0),
      max,
      ticks,
      unit: 'tr',
    };
  }, [data]);

  const controls = (
    <div className="ub-dashboard-periods is-heading" role="group" aria-label="Khoảng thời gian thống kê">
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
  );

  return (
    <DashboardLayout
      role="admin"
      controls={controls}
      title="Tổng Quan Kinh Doanh"
      subtitle="Chỉ số hoạt động & phân tích tài chính UniBridal 2026"
      activeNav="dashboard"
    >
      {error && (
        <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span className="font-semibold">⚠️ Lỗi kết nối Cơ sở dữ liệu:</span> {error} <button type="button" onClick={() => setReload((value) => value + 1)} className="ml-3 underline">Thử lại</button>
        </div>
      )}
      {data?.ordersMissingDepositTransaction > 0 && (
        <p role="alert" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {data.ordersMissingDepositTransaction} đơn đã chuyển sang trạng thái đặt cọc nhưng chưa có giao dịch cọc thành công trong hệ thống. Cần đối soát trước khi xác nhận tiền thực thu.
        </p>
      )}

      {loading && <p role="status" className="mb-4 text-sm text-stone-500">Đang tải thống kê...</p>}
      {/* Tổng đơn thuê, lịch hẹn và người dùng */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-label="Chỉ số kinh doanh trọng yếu">
        {[
          {
            title: 'TỔNG ĐƠN THUÊ',
            value: data?.totalOrders ?? '—',
            note: `${data?.completedOrders ?? 0} đơn đã hoàn tất & quyết toán`,
            Icon: PackageCheck,
            color: 'rose',
          },
          {
            title: 'TỔNG LỊCH HẸN',
            value: data?.totalAppointments ?? '—',
            note: `${data?.todayAppointments ?? '—'} lịch hẹn cần tiếp đón hôm nay`,
            Icon: CalendarDays,
            color: 'gold',
          },
          {
            title: 'SỐ USER',
            value: data?.totalUsers ?? '—',
            note: 'Toàn bộ tài khoản trên hệ thống',
            Icon: Users,
            color: 'gold',
          },
        ].map(({ title, value, note, Icon, color }) => (
          <article
            key={title}
            className="ub-dashboard-metric admin-metric min-w-0 rounded-2xl border border-[#EFE5E1] bg-white p-5 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="ub-dashboard-metric-head flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#705F60] uppercase">{title}</span>
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === 'rose' ? 'bg-[#FAF0EC] text-[#733F49]' : 'bg-[#FAF2EE] text-[#8C6B46]'}`}>
                <Icon size={19} />
              </span>
            </div>
            <div className="text-[28px] font-bold text-[#2C2523] tracking-tight leading-none mb-2 font-serif">{value}</div>
            <div className="flex items-center justify-between text-xs text-[#8A797A] pt-2 border-t border-[#F5EAE6]">
              <span>{note}</span>
            </div>
          </article>
        ))}
      </section>

      {/* NÂNG CẤP: Bảng Thống Kê Chu Trình Đơn Hàng Vận Hành (Showroom Order Pipeline) */}
      <section className="mt-7 rounded-2xl border border-[#EFE5E1] bg-white p-6 shadow-xs" aria-label="Tiến độ đơn thuê">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#F4EBE7]">
          <div>
            <h2 className="text-sm font-bold text-[#2C2523] uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-[#733F49]" />
              Tiến Độ Chu Trình Đơn Thuê Showroom
            </h2>
            <p className="text-xs text-[#8A797A]">Theo dõi trực tiếp số lượng đơn hàng qua từng giai đoạn phục vụ cô dâu</p>
          </div>

          <Link
            to="/admin/don-thue"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#733F49] hover:text-[#5F2B36] transition-colors"
          >
            <span>Đến Quản Lý Đơn Thuê</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* 5 Bước Pipeline Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Đã Đặt Cọc', count: data?.ordersPipeline?.deposit_paid ?? '—', color: 'border-amber-200 bg-amber-50 text-amber-800' },
            { label: 'Đã Giao Váy', count: data?.ordersPipeline?.delivered ?? '—', color: 'border-purple-200 bg-purple-50 text-purple-800' },
            { label: 'Khách Đang Thuê', count: data?.ordersPipeline?.renting ?? '—', color: 'border-indigo-200 bg-indigo-50 text-indigo-800' },
            { label: 'Chờ Kiểm Định', count: data?.ordersPipeline?.returned ?? '—', color: 'border-rose-200 bg-rose-50 text-rose-800' },
            { label: 'Đã Hoàn Tất', count: data?.ordersPipeline?.completed ?? '—', color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
          ].map((step, idx) => (
            <div key={step.label} className={`rounded-xl border p-3 flex flex-col justify-between ${step.color}`}>
              <div className="text-[10.5px] font-bold uppercase tracking-wider opacity-85">
                B{idx + 1}. {step.label}
              </div>
              <div className="text-[24px] font-bold mt-2 font-serif leading-none">
                {step.count} <span className="text-[11px] font-normal opacity-75">đơn</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Biểu Đồ Doanh Thu & Giá Trị Đơn */}
      <section
        className="ub-dashboard-chart-card is-admin mt-7 rounded-2xl border border-[#EFE5E1] bg-white p-6 shadow-xs"
        aria-labelledby="admin-chart-title"
      >
        <div className="ub-dashboard-chart-head mb-4">
          <h2 id="admin-chart-title" className="text-base font-bold text-[#2C2523] flex items-center gap-2">
            <span className="ub-dashboard-title-dot" />
            Biểu Đồ Giá Trị Đơn Đã Đặt Cọc Theo Kỳ
          </h2>
          <p className="ub-dashboard-chart-subtitle text-xs text-[#8A797A]">
            Tổng tiền thuê của các đơn đã qua bước đặt cọc giữ lịch theo niên độ 2026 · Đơn vị: triệu đồng (VNĐ).
          </p>
        </div>
        {data && (
          <DashboardChart
            chartId={`admin-${period}`}
            {...chart}
            primaryLabel="Giá trị đơn"
            chartType="bar"
            variant="admin"
            formatTooltipValue={money}
          />
        )}
      </section>

      {/* Quick Action Navigation Grid */}
      <section className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-4" aria-label="Phím tắt quản trị">
        {[
          { label: 'Quản Lý Đơn Thuê', to: '/admin/don-thue', icon: PackageCheck, desc: 'Bàn giao, kiểm định & hoàn cọc' },
          { label: 'Quản Lý Kho Hàng', to: '/admin/kho-hang', icon: Layers, desc: 'Tồn kho size & vị trí tủ' },
          { label: 'Quản Lý Tài Khoản', to: '/admin/accounts', icon: Users, desc: 'Phân quyền Admin / Staff / Khách' },
          { label: 'Báo Cáo Doanh Thu', to: '/admin/reports/revenue', icon: TrendingUp, desc: 'Dòng tiền & quỹ cọc bảo lãnh' },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="p-4 rounded-2xl bg-white border border-[#EFE5E1] hover:border-[#733F49] hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-xl bg-[#FAF0EC] text-[#733F49] flex items-center justify-center group-hover:scale-105 transition-transform">
                <item.icon size={18} />
              </span>
              <ArrowUpRight size={15} className="text-[#9A8B8C] group-hover:text-[#733F49] transition-colors" />
            </div>
            <div>
              <div className="font-bold text-xs text-[#2C2523] group-hover:text-[#733F49] transition-colors">{item.label}</div>
              <div className="text-[11px] text-[#8A797A] mt-0.5">{item.desc}</div>
            </div>
          </Link>
        ))}
      </section>
    </DashboardLayout>
  );
}
