import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/layout/AdminLayout';
import { message, Modal, Radio, Input, InputNumber, Dropdown, notification, Select, Tag } from 'antd';
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  Calendar,
  Clock,
  CheckCircle2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  ShieldAlert,
  Check,
  Download,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Camera,
  UploadCloud,
  Archive,
  FileText,
  Eye,
  FolderArchive,
  Banknote,
  CreditCard,
  UserCheck,
  UserX,
  CircleUser,
  PhoneCall,
  Copy,
  CheckCheck,
  Lock,
  FileSpreadsheet,
  BookOpen,
  FileEdit,
  FileCheck,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import HangerIcon from '../../components/common/HangerIcon';
import {
  getAllOrdersAdmin,
  getCachedAdminOrders,
  getOrderForManagement,
  updateOrderStatus,
  submitReturnInspection,
  getReturnInspection,
  settleInspectionAdmin,
  confirmDepositRefund,
} from '../../services/orderService';
import { formatCurrencyVND } from '../../utils/formatCurrency';
import { DRESS_CATALOG } from '../../data/dressCatalog';
import {
  DAMAGE_PRICE_CATALOG,
  getDamageCatalogItem,
  computeCompensation,
  computeMultipleCompensation,
  formatMultipleDamageNames,
  formatMultipleDamageDescriptions,
} from '../../data/damagePriceCatalog';
import { recordCompletedOrderMaintenance } from '../../utils/maintenanceStorage';

// Helper lấy mã sản phẩm (SKU) của váy cưới từ item hoặc fallback vào catalog
const getDressCode = (item) => {
  if (!item) return '';
  if (item.code) return item.code;
  if (item.dressCode) return item.dressCode;
  const match = DRESS_CATALOG.find(
    (d) =>
      (item.dressId && (String(d.id) === String(item.dressId) || String(d._id) === String(item.dressId))) ||
      (d.code && (d.code === item.dressId || d.code === item.id)) ||
      (d.name && item.name && d.name.trim().toLowerCase() === item.name.trim().toLowerCase())
  );
  if (match?.code) return match.code;
  if (item.dressId && typeof item.dressId === 'string' && item.dressId.startsWith('UB-')) {
    return item.dressId;
  }
  return '';
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

/** Badge config cho từng status */
const STATUS_CONFIG = {
  pending_payment: { label: 'Chờ Cọc', bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
  deposit_paid: { label: 'Đã Đặt Cọc', bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
  active: { label: 'Đã Ký Hợp Đồng', bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]' },
  confirmed: { label: 'Đã Xác Nhận', bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]' },
  preparing: { label: 'Đang Chuẩn Bị', bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]' },
  delivered: { label: 'Đã Giao Váy', bg: 'bg-[#FFEDD5]', text: 'text-[#C2410C]' },
  renting: { label: 'Đang Thuê', bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]' },
  returned: { label: 'Chờ Hoàn Cọc', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  waiting_refund: { label: 'Chờ Hoàn Cọc', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
  disputed: { label: 'Tạm giữ - Chờ Admin đàm phán', bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]' },
  complete: { label: 'Hoàn Tất', bg: 'bg-[#A7F3D0]', text: 'text-[#064E3B]' },
  completed: { label: 'Hoàn Tất', bg: 'bg-[#A7F3D0]', text: 'text-[#064E3B]' },
  cancelled: { label: 'Đã Hủy', bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]' },
};

/** Các chuyển tiếp status hợp lệ (chỉ tiến, không lui) */
const NEXT_STATUSES = {
  pending_payment: ['deposit_paid', 'cancelled'],
  deposit_paid: ['delivered', 'cancelled'],
  active: ['delivered', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  preparing: ['delivered', 'cancelled'],
  delivered: ['renting', 'cancelled'],
  renting: [], // Bắt buộc nhân viên bấm nút [Kiểm Định], không dùng dropdown tùy ý
  returned: [],
  waiting_refund: [],
  complete: [],
  completed: [],
  cancelled: [],
};

const canRecordReturn = (order) => ['renting', 'delivered'].includes(order.status);
const canInspectOrder = (order) => canRecordReturn(order) || (order.status === 'returned' && !order.inspection);
const hasDisputedInspection = (order) => order.status === 'disputed'
  || (order.inspection?.customerStatus || order.inspectionCustomerStatus) === 'disputed';

const CONDITION_OPTIONS = [
  { value: 'good', label: 'Tốt' },
  { value: 'minor_stain', label: 'Vết nhỏ' },
  { value: 'heavy_damage', label: 'Hư hỏng nặng' },
  { value: 'torn_lace', label: 'Rách ren/đính kết' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const fmtVnd = (v) => formatCurrencyVND(v ?? 0);

const getRentalDays = (order) => {
  if (order?.rentalDays) return order.rentalDays;
  if (order?.rentalStartDate && order?.rentalEndDate) {
    const start = new Date(order.rentalStartDate);
    const end = new Date(order.rentalEndDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 4;
  }
  return 4;
};

const returnDateFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
});

function calcLate(rentalEndDate, returnedAt) {
  if (!rentalEndDate) return 0;
  const end = new Date(rentalEndDate);
  const received = returnedAt ? new Date(returnedAt) : new Date();
  if (!Number.isFinite(end.getTime()) || !Number.isFinite(received.getTime())) return 0;
  return Math.max(0, (Date.parse(returnDateFormatter.format(received)) - Date.parse(returnDateFormatter.format(end))) / 86_400_000);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, order }) {
  if (hasDisputedInspection(order)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
        Tạm Giữ - Chờ Admin Đàm Phán
      </span>
    );
  }

  // Nếu đang chờ hoàn cọc hoặc cần đối soát cọc: hiển thị rõ trạng thái Chờ Hoàn Cọc
  const isRefundPending =
    status === 'waiting_refund' ||
    status === 'returned' ||
    order.refundPending ||
    order.inspection?.canConfirmRefund ||
    ['pending', 'reconciliation_required'].includes(order.inspection?.refundStatus);

  if (isRefundPending) {
    const isConflict = Boolean(
      order.inspection?.refundConflict ||
      order.inspection?.refundStatus === 'reconciliation_required'
    );
    const label = isConflict ? 'Cần Đối Soát Cọc' : 'Chờ Hoàn Cọc';
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
        {label}
      </span>
    );
  }

  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
    </div>
  );
}

function UpdateStatusDropdown({ order, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const nexts = NEXT_STATUSES[order.status] || [];

  if (nexts.length === 0) return null;

  const handleChange = async (newStatus) => {
    setLoading(true);
    try {
      await updateOrderStatus(order._id, newStatus);
      if (newStatus === 'completed' || newStatus === 'complete') {
        recordCompletedOrderMaintenance(order);
      }
      message.success(`Đã cập nhật trạng thái thành "${STATUS_CONFIG[newStatus]?.label ?? newStatus}"`);
      onUpdated?.(order._id, newStatus);
    } catch {
      message.error('Cập nhật trạng thái thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      key: 'header',
      type: 'group',
      label: (
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A7B] block py-0.5">
          Chuyển bước tiếp theo
        </span>
      ),
      children: nexts.map((s) => {
        const cfg = STATUS_CONFIG[s] || { label: s };
        const isCancel = s === 'cancelled';
        return {
          key: s,
          label: (
            <div className="flex items-center justify-between py-1 min-w-[175px]">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isCancel ? 'bg-red-500' : 'bg-[#733F49]'}`} />
                <span className={`text-[12.5px] font-medium ${isCancel ? 'text-red-600' : 'text-[#4A3E3F]'}`}>
                  {cfg.label}
                </span>
              </span>
              <ChevronRight size={13} className="text-[#8C7A7B] opacity-50" />
            </div>
          ),
          onClick: () => handleChange(s),
        };
      }),
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      placement="bottomRight"
      disabled={loading}
    >
      <button
        type="button"
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF2EE] border border-[#EFE2DC] text-[12px] text-[#554748] font-medium hover:bg-[#F3E7E2] hover:text-[#733F49] transition-all disabled:opacity-60 cursor-pointer shadow-2xs"
      >
        <SlidersHorizontal size={12} className="text-[#846E63]" />
        <span>Cập nhật</span>
        <ChevronDown size={12} className="text-[#846E63]" />
      </button>
    </Dropdown>
  );
}

function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  const items = order.items && order.items.length > 0 ? order.items : [
    {
      name: order.dressName || 'Lễ Phục Cao Cấp',
      code: order.dressCode,
      size: order.size,
      color: order.color,
      rentPrice: order.totalRentPrice,
      depositAmount: order.totalDeposit,
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-jakarta"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-[#EFE5E1] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Tiêu đề + Mã đơn + Trạng thái + Nút đóng X */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#F0E6E2] bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#733F49] shrink-0">
              <FileText size={17} />
            </div>
            <div>
              <h3 className="font-sans text-lg font-bold text-[#5F2B36] m-0 leading-tight">
                Chi Tiết Đơn Thuê
              </h3>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[11px] text-[#8C7D7E] font-medium">Mã đơn thuê:</span>
                <span className="px-2 py-0.5 rounded bg-[#FAF0EC] text-[#733F49] font-mono text-[11px] font-bold border border-[#F2D8D4]">
                  {order.orderCode || order._id}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} order={order} />
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#FAF2EE] text-[#7A6B6C] hover:text-[#5F2B36] flex items-center justify-center transition-colors cursor-pointer border-0 shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Nội dung hiển thị trọn vẹn trong 1 trang duy nhất, không cần cuộn */}
        <div className="p-5 pb-6 space-y-3.5 text-xs">
          {/* 1. Thông tin khách hàng */}
          <div className="bg-[#FAF5F2]/70 rounded-2xl p-3.5 border border-[#EFE5E1]">
            <h4 className="font-bold text-[#733F49] text-[11px] uppercase tracking-wider m-0 mb-2.5">
              Thông Tin Khách Hàng
            </h4>
            <div className="space-y-2 text-[12px]">
              {/* Dòng 1: Tên khách hàng & Số điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#8C7D7E] shrink-0">Tên khách hàng:</span>
                  <span className="font-bold text-[#2C2523] inline-flex items-center gap-1.5 truncate" title={order.customerName}>
                    {order.customerName || '—'}
                    {(order.hasAccount || order.customerId) && (
                      <CircleUser size={15} className="text-[#733F49] shrink-0" title="Khách hàng thành viên" />
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#8C7D7E] shrink-0">Số điện thoại:</span>
                  <span className="font-bold text-[#2C2523]">{order.customerPhone || '—'}</span>
                </div>
              </div>
              {/* Dòng 2: Email khách hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#8C7D7E] shrink-0">Email khách hàng:</span>
                  <span className="font-semibold text-[#2C2523] truncate" title={order.customerEmail}>
                    {order.customerEmail || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Grid 2 cột: Thông tin váy cưới (Trái) & Thời gian + Chi phí (Phải) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Cột trái: Thông tin váy cưới (1 khung duy nhất, không lồng 2 khung) */}
            <div className="bg-[#FAF5F2]/70 rounded-2xl p-3.5 border border-[#EFE5E1]">
              <h4 className="font-bold text-[#733F49] text-[11px] uppercase tracking-wider m-0 mb-2.5">
                Thông tin váy cưới
              </h4>
              <div className="space-y-2 text-[11.5px]">
                {items.map((it, idx) => {
                  const code = getDressCode(it);
                  const sizeStr = it.size ? it.size.replace(/^size\s*/i, '') : '—';
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#8C7D7E] shrink-0">Tên váy:</span>
                        <span className="font-bold text-[#2C2523] text-[12px] truncate" title={it.name}>
                          {it.name || 'Lễ Phục Cao Cấp'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#8C7D7E] shrink-0">Mã váy:</span>
                        <span className="font-mono font-bold text-[#733F49] text-[12px]">
                          {code || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#8C7D7E] shrink-0">Size váy:</span>
                        <span className="font-bold text-[#B8737D] text-[12px]">
                          Size {sizeStr}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#8C7D7E] shrink-0">Màu sắc:</span>
                        <span className="font-semibold text-[#2C2523] text-[12px]">
                          {it.color || it.fabric || order.color || 'Trắng Sữa'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cột phải: Thời Gian & Chi Phí */}
            <div className="bg-[#FAF5F2]/70 rounded-2xl p-3.5 border border-[#EFE5E1]">
              <h4 className="font-bold text-[#733F49] text-[11px] uppercase tracking-wider m-0 mb-2.5">
                Thời Gian & Chi Phí
              </h4>
              <div className="space-y-2 text-[11.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#8C7D7E]">Chi tiết ngày:</span>
                  <span className="font-semibold text-[#2C2523]">
                    {fmtDate(order.rentalStartDate)} – {fmtDate(order.rentalEndDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8C7D7E]">Giá thuê váy:</span>
                  <span className="font-bold text-[#733F49]">{fmtVnd(order.totalRentPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8C7D7E]">Tiền đặt cọc:</span>
                  <span className="font-bold text-[#863E4B]">{fmtVnd(order.totalDeposit)}</span>
                </div>

                <div className="pt-2 border-t border-[#E8D0CC] flex items-center justify-between text-[12.5px]">
                  <span className="font-bold text-[#5F2B36]">Tổng thanh toán:</span>
                  <span className="font-extrabold text-[#733F49] text-[13px]">
                    {fmtVnd(order.totalAmount || ((order.totalRentPrice || 0) + (order.totalDeposit || 0)))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DamagePriceCatalogModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-[#EFE5E1] overflow-hidden"
      >
        {/* Header - Luôn ghim cố định trên cùng */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-[#F0E6E2] bg-gradient-to-r from-[#FFF8F6] via-[#FCF4F0] to-[#FFF8F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FAF0EC] flex items-center justify-center text-[#733F49] border border-[#ECD9D3] shadow-2xs">
              <FileSpreadsheet size={15} />
            </div>
            <div>
              <h3 className="font-sans text-[15px] font-bold text-[#5F2B36] m-0 leading-tight">
                Bảng Giá Đền Bù Thiệt Hại Niêm Yết
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white text-[#7A6B6C] hover:text-[#733F49] hover:bg-[#FAF0EC] flex items-center justify-center transition-colors border border-[#EFE5E1] cursor-pointer"
            title="Đóng bảng giá (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Table Body - Hiển thị gọn gàng, tự co dãn và không bao giờ đẩy mất nút đóng */}
        <div className="p-3 overflow-y-auto flex-1 min-h-0">
          <div className="overflow-x-auto rounded-xl border border-[#EFE5E1] shadow-2xs">
            <table className="w-full min-w-[650px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF5F2] text-[#5F2B36] border-b border-[#EFE5E1] text-[10.5px] font-bold uppercase tracking-wider sticky top-0 z-10">
                  <th className="py-2 px-3 w-[28%] whitespace-nowrap bg-[#FAF5F2]">Nhóm Lỗi Hư Hại</th>
                  <th className="py-2 px-3 w-[42%] bg-[#FAF5F2]">Hiện Trạng Thực Tế</th>
                  <th className="py-2 px-3 w-[30%] bg-[#FAF5F2]">Mức Phí Niêm Yết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2E5E0] text-[11px]">
                {DAMAGE_PRICE_CATALOG.map((row) => (
                  <tr key={row.id} className="hover:bg-[#FFF9F6] transition-colors">
                    <td className="py-1.5 px-3 font-bold text-[#2C2523] align-middle">
                      {row.name}
                    </td>
                    <td className="py-1.5 px-3 text-[#5C4D4D] leading-snug align-middle">
                      {row.description}
                    </td>
                    <td className="py-1.5 px-3 font-bold align-middle" style={{ color: row.color }}>
                      {row.feeLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer - Luôn ghim cố định ở đáy modal */}
        <div className="shrink-0 px-4 py-2 border-t border-[#F0E6E2] bg-[#FAF5F2] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-[#733F49] text-white text-[12px] font-bold hover:bg-[#5C3038] shadow-xs transition-colors cursor-pointer"
          >
            Đã hiểu & Đóng bảng giá
          </button>
        </div>
      </div>
    </div>
  );
}

function InspectionModal({ order, onClose, onSuccess }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const isStaffPath = location.pathname.startsWith('/staff');
  const isCurrentAdmin = (user?.role === 'admin' || isAdmin) && !isStaffPath;

  const isCompletedOrder = order.status === 'completed' || order.status === 'complete';
  const isReturnedOrder = order.status === 'waiting_refund' || order.status === 'returned';
  const isGuestOrder = !order.hasAccount && !order.customerId && !order.userId;
  const [customerStatus, setCustomerStatus] = useState(order.inspectionCustomerStatus || order.inspection?.customerStatus || 'pending');
  const isCustomerApproved = customerStatus === 'approved';

  const [savedInspection, setSavedInspection] = useState(null);
  const isReadOnly = !canInspectOrder(order) || Boolean(savedInspection);
  const canResumeInspection = canRecordReturn(order) && Boolean(savedInspection);

  const [disputeReason, setDisputeReason] = useState('');
  const [refundBankDetails, setRefundBankDetails] = useState(null);

  // 2. Ý kiến khách hàng về biên bản kiểm định (Trường hợp 1: Chốt tại chỗ | Trường hợp 2: Giữ đơn chuyển Admin)
  const [inspectionLoading, setInspectionLoading] = useState(true);
  const [inspectionError, setInspectionError] = useState('');
  const [inspectionReload, setInspectionReload] = useState(0);
  const [customerDisputeNote, setCustomerDisputeNote] = useState('');
  const [onSiteBankName, setOnSiteBankName] = useState('Vietcombank');
  const [onSiteAccountNum, setOnSiteAccountNum] = useState('');
  const [onSiteAccountHolder, setOnSiteAccountHolder] = useState(order.customerName || '');

  const [itemsCondition, setItemsCondition] = useState(
    () =>
      (order.items || []).map((item) => {
        const itemDeposit = item.depositAmount ?? (order.totalDeposit ? Math.round(order.totalDeposit / Math.max(1, (order.items || []).length)) : 0);
        const itemRent = item.rentPrice ?? (order.totalRentPrice ? Math.round(order.totalRentPrice / Math.max(1, (order.items || []).length)) : 0);
        // Giới hạn tiền bồi thường tối đa không được vượt quá tiền cọc
        const maxDepositLimit = itemDeposit > 0 ? itemDeposit : (order.totalDeposit || 0);
        return {
          dressId: item.dressId || item.id || item._id || 'item_default',
          name: item.name,
          condition: 'normal_wear',
          conditions: ['normal_wear'],
          selectedOption: null,
          damageNotes: '',
          compensation: 0,
          rentPrice: itemRent,
          depositAmount: maxDepositLimit,
          maxPrice: maxDepositLimit,
          maxDeposit: maxDepositLimit,
        };
      })
  );
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Luôn luôn tải biên bản kiểm định đã lưu từ trước (nếu có)
  useEffect(() => {
    let active = true;
    setInspectionError('');
    setInspectionLoading(true);
    getReturnInspection(order._id)
      .then((insp) => {
        if (!active) return;
        setSavedInspection(insp);
        if (insp && (insp.itemsCondition || insp.totalDeduction !== undefined)) {
          if (insp.customerStatus) {
            setCustomerStatus(insp.customerStatus);
          }
          if (insp.disputeReason) setDisputeReason(insp.disputeReason);
          if (insp.refundBankDetails) setRefundBankDetails(insp.refundBankDetails);
          if (insp.evidencePhotos?.length) {
            setEvidencePhotos(insp.evidencePhotos);
          }
          if (insp.itemsCondition?.length) {
            setItemsCondition((prev) =>
              prev.map((it, idx) => {
                const match =
                  insp.itemsCondition[idx] ||
                  insp.itemsCondition.find((c) => String(c.dressId) === String(it.dressId));
                if (!match) return it;
                let loadedConditions = [];
                if (Array.isArray(match.conditions) && match.conditions.length > 0) {
                  loadedConditions = match.conditions.map((c) => (c === 'good' ? 'normal_wear' : c));
                } else if (match.condition) {
                  loadedConditions = [match.condition === 'good' ? 'normal_wear' : match.condition];
                } else {
                  loadedConditions = ['normal_wear'];
                }
                const primaryCond = loadedConditions.includes('total_damage')
                  ? 'total_damage'
                  : (loadedConditions.find((c) => c !== 'normal_wear') || 'normal_wear');
                return {
                  ...it,
                  condition: primaryCond,
                  conditions: loadedConditions,
                  damageNotes: match.note || match.damageNotes || '',
                  selectedOption: match.repairFee ?? match.compensation ?? 0,
                  compensation: match.repairFee ?? match.compensation ?? 0,
                };
              })
            );
          }
        }
      })
      .catch(() => { if (active) setInspectionError('Không tải được biên bản.'); })
      .finally(() => { if (active) setInspectionLoading(false); });
    return () => { active = false; };
  }, [order._id, inspectionReload]);

  // Xử lý chụp ảnh / tải ảnh bằng chứng hiện trạng váy (tự động nén ảnh nhẹ để tối ưu tốc độ và database)
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setEvidencePhotos((prev) => [...prev, compressed]);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx) => {
    setEvidencePhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const lateDays = savedInspection?.lateDays ?? calcLate(order.rentalEndDate, order.actualReturnDate);
  const totalDeposit = Number(savedInspection?.initialDeposit ?? order.totalDeposit ?? 0);
  const totalRentPrice = Number(order.totalRentPrice || itemsCondition.reduce((acc, ic) => acc + (ic.rentPrice || 0), 0) || 0);

  // Phạt trễ hạn: 50% tiền thuê mỗi ngày, quá 5 ngày chưa trả tịch thu 100% tiền cọc
  let lateFee = 0;
  if (lateDays > 5) {
    lateFee = totalDeposit;
  } else if (lateDays > 0) {
    lateFee = Math.min(totalDeposit, lateDays * Math.round(totalRentPrice * 0.5));
  }
  const totalCompensation = itemsCondition.reduce((acc, ic) => acc + Number(ic.compensation || 0), 0);
  lateFee = savedInspection?.latePenaltyFee ?? lateFee;
  const totalDeduction = savedInspection?.totalDeduction ?? Math.min(totalDeposit, lateFee + totalCompensation);
  const finalRefund = savedInspection?.finalRefundAmount ?? Math.max(0, totalDeposit - totalDeduction);
  const hasSevereDamage = itemsCondition.some((ic) => {
    const conds = ic.conditions || [ic.condition];
    return conds.includes('total_damage');
  });

  const hasCustomAgreement = itemsCondition.some((ic) => {
    const conds = ic.conditions || [ic.condition];
    return conds.includes('custom_agreement');
  });

  const hasAdminEscalation = hasSevereDamage || hasCustomAgreement;
  const isStaffEscalationRequired = !isCurrentAdmin && hasAdminEscalation;

  // Thay đổi nhóm lỗi theo Bảng giá niêm yết (Hỗ trợ chọn nhiều lỗi trên cùng 1 váy)
  const updateConditions = (idx, newCondIds) => {
    if (isReadOnly) return;
    const oldConditions = itemsCondition[idx]?.conditions || [itemsCondition[idx]?.condition || 'normal_wear'];

    let sanitized = Array.isArray(newCondIds) ? [...newCondIds] : [];

    // Nếu vừa bấm chọn "normal_wear" (Hao mòn tự nhiên) khi trước đó đang có lỗi khác -> reset về chỉ có normal_wear
    if (sanitized.includes('normal_wear') && !oldConditions.includes('normal_wear')) {
      sanitized = ['normal_wear'];
    } else if (sanitized.includes('custom_agreement') && !oldConditions.includes('custom_agreement')) {
      // Khi chọn "Thỏa thuận 2 bên" (Mục 10) -> các lỗi khác không tính, chỉ giữ duy nhất custom_agreement
      sanitized = ['custom_agreement'];
    } else if (sanitized.includes('total_damage') && !oldConditions.includes('total_damage')) {
      // Khi chọn "Hỏng hoàn toàn" (Mục 9) -> chỉ giữ duy nhất total_damage
      sanitized = ['total_damage'];
    } else {
      // Nếu chọn các lỗi thông thường (Mục 2-8), tự động bỏ normal_wear và bỏ custom_agreement / total_damage
      sanitized = sanitized.filter((c) => c !== 'normal_wear');
      if (sanitized.some((c) => c !== 'custom_agreement' && c !== 'total_damage')) {
        sanitized = sanitized.filter((c) => c !== 'custom_agreement' && c !== 'total_damage');
      }
    }

    // Nếu rỗng -> mặc định về 'normal_wear'
    if (sanitized.length === 0) {
      sanitized = ['normal_wear'];
    }

    const maxLimit = itemsCondition[idx]?.maxDeposit || itemsCondition[idx]?.depositAmount || order.totalDeposit || 0;
    const currentAgreed = itemsCondition[idx]?.agreedAmount || 0;
    const comp = computeMultipleCompensation(sanitized, maxLimit, currentAgreed);

    // Xác định condition chính để tương thích ngược
    const primaryCond = sanitized.includes('total_damage')
      ? 'total_damage'
      : (sanitized.find((c) => c !== 'normal_wear') || 'normal_wear');

    setItemsCondition((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        condition: primaryCond,
        conditions: sanitized,
        compensation: comp,
        // Không tự chèn text ví dụ, để người dùng tự nhập mô tả thực tế
        damageNotes: next[idx]?.damageNotes || '',
      };
      return next;
    });

    const hasAdminOnly = sanitized.some((cid) => getDamageCatalogItem(cid).isAdminOnly);
    const hasCustomAgreed = sanitized.includes('custom_agreement');

    if (hasAdminOnly) {
      if (!isCurrentAdmin) {
        message.warning(`Có lỗi [Cần Admin xác nhận]. Vui lòng bấm [Tạm Giữ Biên Bản Gửi Admin] để chuyển Admin.`);
      }
      if (!customerDisputeNote) {
        setCustomerDisputeNote('Váy bị hư hại nghiêm trọng / lỗi nặng không thể may lại, chuyển Quản lý & Admin trực tiếp thẩm định xử lý.');
      }
    } else if (hasCustomAgreed && !isCurrentAdmin) {
      message.info('Đã chọn [Thỏa thuận 2 bên]. Lỗi này cần chuyển Admin phê duyệt, vui lòng bấm [Tạm Giữ Biên Bản Gửi Admin].');
      if (!customerDisputeNote) {
        setCustomerDisputeNote('Lỗi ngoài danh mục cần thỏa thuận 2 bên, chuyển Admin trực tiếp thẩm định và phê duyệt mức bồi thường.');
      }
    }
  };

  // Cập nhật mức phí thỏa thuận thống nhất cho Mục 10 (Lỗi khác ngoài danh mục)
  const updateAgreedAmount = (idx, amount) => {
    if (isReadOnly) return;
    const sanitized = itemsCondition[idx]?.conditions || [itemsCondition[idx]?.condition || 'normal_wear'];
    const maxLimit = itemsCondition[idx]?.maxDeposit || itemsCondition[idx]?.depositAmount || order.totalDeposit || 0;
    const agreed = Math.max(0, Number(amount || 0));
    const comp = computeMultipleCompensation(sanitized, maxLimit, agreed);
    setItemsCondition((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        agreedAmount: agreed,
        compensation: comp,
      };
      return next;
    });
  };

  // Toggle nhanh 1 lỗi qua button chip
  const toggleCondition = (idx, condId) => {
    if (isReadOnly) return;
    const currentList = itemsCondition[idx]?.conditions || [itemsCondition[idx]?.condition || 'normal_wear'];
    let nextList;
    if (condId === 'normal_wear') {
      nextList = ['normal_wear'];
    } else if (condId === 'custom_agreement') {
      // Khi chọn "Thỏa thuận 2 bên" (Mục 10) -> các lỗi khác không tính, chỉ giữ custom_agreement
      nextList = currentList.includes('custom_agreement') ? ['normal_wear'] : ['custom_agreement'];
    } else if (condId === 'total_damage') {
      // Khi chọn "Hỏng hoàn toàn" (Mục 9) -> chỉ giữ total_damage
      nextList = currentList.includes('total_damage') ? ['normal_wear'] : ['total_damage'];
    } else if (currentList.includes(condId)) {
      nextList = currentList.filter((c) => c !== condId);
    } else {
      // Chọn lỗi thường thì bỏ normal_wear, custom_agreement, total_damage
      nextList = [...currentList.filter((c) => c !== 'normal_wear' && c !== 'custom_agreement' && c !== 'total_damage'), condId];
    }
    updateConditions(idx, nextList);
  };

  const updateOption = (idx, optVal) => {
    if (isReadOnly) return;
    const curCond = itemsCondition[idx]?.condition || 'normal_wear';
    const maxLimit = itemsCondition[idx]?.maxDeposit || itemsCondition[idx]?.depositAmount || order.totalDeposit || 0;
    const comp = computeCompensation(curCond, optVal, maxLimit);
    setItemsCondition((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        selectedOption: optVal,
        compensation: comp,
      };
      return next;
    });
  };

  const updateNotes = (idx, noteText) => {
    if (isReadOnly) return;
    setItemsCondition((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], damageNotes: noteText };
      return next;
    });
  };

  const saveInspection = async (body) => {
    setSubmitting(true);
    try {
      const result = await submitReturnInspection(order._id, body);
      if (result.heldForAdmin) {
        message.warning('Đã lưu biên bản và chuyển Admin xử lý.');
      } else if (result.inspection?.customerStatus === 'pending') {
        message.success('Đã lưu biên bản và chuyển sang chờ khách xác nhận.');
      } else if (result.inspection?.refundStatus === 'not_required') {
        message.success('Đơn đã hoàn tất. Số tiền cần hoàn là 0 đ.');
      } else if (result.inspection?.refundConflict) {
        message.warning('Đã lưu biên bản. Cần đối soát tiền cọc trước khi quyết toán.');
      } else {
        message.success(`Đã hoàn tất kiểm định. Chờ hoàn ${fmtVnd(result.inspection?.refundRemaining)} tiền cọc.`);
      }
      onSuccess(result);
    } catch (error) {
      message.error(error.response?.data?.message || error.message || 'Không lưu được biên bản. Vui lòng thử lại.');
      setInspectionReload((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (actionType = 'complete') => {
    if (isReadOnly || inspectionLoading || inspectionError || submitting) return;
    if (isCustomerApproved) {
      message.error('Khách hàng đã duyệt biên bản kiểm định, hồ sơ đã khóa và không thể chỉnh sửa.');
      return;
    }

    const isHoldCase = (!isCurrentAdmin && actionType === 'hold') || isStaffEscalationRequired;

    // 1. Kiểm tra tình trạng váy & BẮT BUỘC CHỤP ẢNH LỖI ĐẦY ĐỦ
    const hasDamage = itemsCondition.some((ic) => {
      const conds = ic.conditions || [ic.condition];
      const hasRealDamage = conds.some((c) => c !== 'normal_wear' && c !== 'good');
      return hasRealDamage || Number(ic.compensation || 0) > 0;
    });
    if (hasDamage && (!evidencePhotos || evidencePhotos.length === 0)) {
      message.error('Quy định bắt buộc: Phải chụp hoặc tải ít nhất 1 ảnh bằng chứng lỗi hư hại của váy trước khi gửi!');
      return;
    }

    // Validate không được vượt quá tiền cọc
    for (const ic of itemsCondition) {
      const maxLimit = ic.maxDeposit || ic.depositAmount || order.totalDeposit || 0;
      if (Number(ic.compensation || 0) > maxLimit && maxLimit > 0) {
        message.error(`Số tiền bồi thường của váy "${ic.name}" không được vượt quá tiền cọc (${fmtVnd(maxLimit)})`);
        return;
      }
    }

    if (totalCompensation > (order.totalDeposit || 0) && (order.totalDeposit || 0) > 0) {
      message.error(`Tổng số tiền bồi thường (${fmtVnd(totalCompensation)}) không được vượt quá tổng tiền cọc của đơn (${fmtVnd(order.totalDeposit || 0)})`);
      return;
    }

    // Nếu hoàn tất kiểm định và có tiền hoàn trả thì bắt buộc nhập STK
    const confirmOnSite = isGuestOrder || actionType === 'complete';
    if (!isHoldCase && confirmOnSite && finalRefund > 0 &&
      (!onSiteBankName.trim() || !/^\d{6,30}$/.test(onSiteAccountNum.trim()) || !onSiteAccountHolder.trim())) {
      message.warning('Vui lòng kiểm tra ngân hàng, số tài khoản và tên chủ tài khoản.');
      return;
    }

    const payload = itemsCondition.map((ic) => {
      const conditions = ic.conditions || [ic.condition || 'normal_wear'];
      const damages = conditions
        .filter((id) => id !== 'normal_wear' && id !== 'good')
        .map((id) => {
          const damage = getDamageCatalogItem(id);
          return { id: damage.id, name: damage.name, fee: damage.fixedFee, feeLabel: damage.feeLabel };
        });
      const condition = ic.condition || (conditions.includes('total_damage') ? 'total_damage' : conditions[0]);
      const repairFee = Number(ic.compensation || 0);

      return {
        dressId: ic.dressId,
        condition,
        conditions,
        damages,
        damageName: formatMultipleDamageNames(conditions),
        feeLabel: fmtVnd(repairFee),
        note: ic.damageNotes || '',
        repairFee,
      };
    });

    return saveInspection({
      itemsCondition: payload,
      evidencePhotos,
      holdForAdmin: isHoldCase,
      confirmOnSite: !isHoldCase && confirmOnSite,
      disputeReason: isHoldCase ? (customerDisputeNote || itemsCondition.map((ic) => ic.damageNotes).filter(Boolean).join('; ') || 'Biên bản tạm giữ chuyển Admin thẩm định xử lý').trim() : '',
      refundBankDetails: onSiteAccountNum?.trim() ? {
        bankName: onSiteBankName.trim(),
        accountNumber: onSiteAccountNum.trim(),
        accountHolder: onSiteAccountHolder.trim(),
      } : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-[#EFE5E1]">
        {/* Header - Chuẩn Atelier Haute Couture sang trọng */}
        <div className="flex items-center justify-between py-3 px-5 border-b border-[#F0E6E2] bg-gradient-to-r from-[#FFF8F6] via-[#FCF4F0] to-[#FFF8F6] rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#733F49] border border-[#ECD9D3] shadow-2xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-sans text-[16px] font-bold text-[#5F2B36] m-0 tracking-tight">
                {isCompletedOrder
                  ? 'Hồ Sơ Lưu Trữ Đơn Thuê & Quyết Toán Cọc'
                  : isCustomerApproved
                    ? 'Biên Bản Giám Định Lễ Phục (Khách Đã Duyệt)'
                    : isReturnedOrder
                      ? 'Biên Bản Giám Định Lễ Phục '
                      : 'Biên Bản Giám Định Hiện Trạng & Quyết Toán Cọc'}
              </h3>
              <p className="text-[11px] text-[#8C7D7E] m-0 flex items-center gap-1.5 mt-0.5">
                <span>Mã đơn: <strong className="font-mono text-[#5F2B36]">#{order.orderCode}</strong></span>


              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-[#7A6B6C] hover:text-[#733F49] hover:bg-[#FAF0EC] flex items-center justify-center transition-colors cursor-pointer border border-[#EFE5E1]"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 text-xs font-jakarta">
          {/* Status banner nếu khách đã phản hồi */}
          {customerStatus === 'disputed' && (
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1 animate-fadeIn">
              <div className="font-bold flex items-center gap-2 text-amber-950 text-[12px]">
                <Clock size={14} className="text-amber-700" />
                <span>Hồ sơ đang ở trạng thái Tạm Giữ — Chờ Quản lý trực tiếp đàm phán:</span>
              </div>
              <p className="italic bg-white p-2 rounded-xl border border-amber-100 text-[#4A3B3D] text-[11.5px] m-0 leading-relaxed">
                "{disputeReason || 'Khách hàng có ý kiến phản hồi về chi phí phục chế tổn thất'}"
              </p>
            </div>
          )}

          {customerStatus === 'approved' && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <div className="flex items-center justify-between gap-2 text-[12px] flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong>Khách hàng đã đồng thuận biên bản giám định.</strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                  Hồ Sơ Đã Khóa
                </span>
              </div>
              {refundBankDetails?.accountNumber && (
                <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 text-[11.5px] text-[#2C2523] space-y-0.5 mt-1">
                  <div>• Ngân hàng thụ hưởng: <strong>{refundBankDetails.bankName || 'Ngân hàng nội địa'}</strong> • STK: <strong className="font-mono">{refundBankDetails.accountNumber}</strong> • Chủ TK: <strong>{refundBankDetails.accountHolder}</strong></div>
                  {refundBankDetails.notes && <div>• Ghi chú: <em>{refundBankDetails.notes}</em></div>}
                </div>
              )}
            </div>
          )}

          {/* Dải thông tin khách hàng & lịch trình chuẩn Atelier */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF5F2] to-[#FFFBF9] border border-[#EFE5E1] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FAF0EC] text-[#733F49] font-bold text-xs flex items-center justify-center border border-[#ECD9D3] shrink-0">
                {order.customerName?.charAt(0) || 'K'}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <strong className="text-[13px] text-[#2C2523]">{order.customerName}</strong>
                </div>
                {order.customerPhone && (
                  <span className="text-[11px] text-[#8C7D7E] block mt-0.5 font-mono">{order.customerPhone}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:items-end justify-center text-xs">
              <div className="text-[#7A6B6C]">
                Thời gian thuê: <strong className="text-[#2C2523]">{fmtDate(order.rentalStartDate)} – {fmtDate(order.rentalEndDate)}</strong>
              </div>
              {lateDays > 0 ? (
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10.5px] font-bold ${lateDays > 5 ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                  {lateDays > 5 ? `Trễ hạn ${lateDays} ngày (Tịch thu 100% cọc: -${fmtVnd(lateFee)})` : `Trễ hạn ${lateDays} ngày (Phạt 50%/ngày: -${fmtVnd(lateFee)})`}
                </span>
              ) : (
                <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Bàn giao đúng hạn hợp đồng
                </span>
              )}
            </div>
          </div>

          {/* Danh sách lễ phục & Giám định tình trạng */}
          <div className="space-y-2.5">
            {itemsCondition.map((ic, idx) => {
              const maxLimit = ic.maxDeposit || ic.depositAmount || order.totalDeposit || 0;
              const itemCode = getDressCode(ic) || getDressCode(order.items?.[idx]);
              const catItem = getDamageCatalogItem(ic.condition);
              return (
                <div key={idx} className="p-3 rounded-2xl border border-[#EFE5E1] bg-white space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-1.5 border-b border-[#F7EFEA]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans font-bold text-[13.5px] text-[#5F2B36]">
                        {ic.name}
                      </span>
                      {itemCode && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#FAF0EC] text-[#733F49] font-mono text-[10px] font-bold border border-[#F2D8D4] leading-none">
                          {itemCode}
                        </span>
                      )}
                      {(ic.size || order.items?.[idx]?.size) && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-[#FCECE8] text-[#B8737D] text-[10px] font-bold leading-none">
                          Size {ic.size || order.items?.[idx]?.size}
                        </span>
                      )}
                      {(ic.color || order.items?.[idx]?.color || order.color) && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-[#FAF4EE] text-[#733F49] text-[10px] font-bold leading-none border border-[#F0E5DC]">
                          Màu {ic.color || order.items?.[idx]?.color || order.color || 'Trắng Sữa'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8C7D7E]">
                      Tiền cọc: <strong className="text-[#5F2B36]">{fmtVnd(maxLimit)}</strong>
                    </span>
                  </div>

                  {/* Chọn nhóm lỗi hư hại theo Bảng giá niêm yết (Hỗ trợ chọn nhiều lỗi) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-[11.5px] font-bold text-[#5F4E50] block">
                        Nhóm lỗi theo Bảng Giá Niêm Yết:
                      </span>
                      <span className="text-[10.5px] text-[#8C7D7E] italic">
                        * Có thể chọn cùng lúc nhiều lỗi trên 1 váy
                      </span>
                    </div>

                    <Select
                      mode="multiple"
                      disabled={isReadOnly}
                      style={{ width: '100%' }}
                      placeholder="Chọn một hoặc nhiều lỗi theo Bảng Giá Niêm Yết..."
                      value={ic.conditions || [ic.condition || 'normal_wear']}
                      onChange={(vals) => updateConditions(idx, vals)}
                      options={DAMAGE_PRICE_CATALOG.map((cat) => ({
                        value: cat.id,
                        label: `${cat.name} — Phí: ${cat.feeLabel}`,
                      }))}
                      className="rounded-xl text-xs"
                    />

                    {/* Quick pills để nhân viên tiện click chọn/bỏ chọn nhanh */}
                    {!isReadOnly && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {DAMAGE_PRICE_CATALOG.map((cat) => {
                          const isSelected = (ic.conditions || [ic.condition || 'normal_wear']).includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => toggleCondition(idx, cat.id)}
                              className={`text-[10.5px] px-2 py-0.5 rounded-lg border font-medium transition-all cursor-pointer ${isSelected
                                ? cat.id === 'total_damage'
                                  ? 'bg-red-600 text-white border-red-700 shadow-2xs font-bold'
                                  : cat.id === 'normal_wear'
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs font-bold'
                                    : 'bg-[#733F49] text-white border-[#5C323A] shadow-2xs font-bold'
                                : 'bg-white text-[#5F4E50] border-[#E5D7D0] hover:bg-[#FAF0EC]'
                                }`}
                            >
                              {cat.shortName} ({cat.feeType === 'deposit_100' ? '100% Cọc' : cat.feeType === 'agreement' ? 'Thỏa thuận' : cat.feeLabel})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Chi tiết hiện trạng & Mức phí đền bù khóa cố định */}
                  {(ic.conditions || [ic.condition]).some((c) => c !== 'normal_wear' && c !== 'good') && (
                    <div className="p-3 rounded-xl bg-[#FFF9F6] border border-[#F4E1D8] space-y-2.5 animate-fadeIn text-xs">
                      {/* Bảng danh sách các lỗi đã chọn */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-[#733F49] uppercase tracking-wider block">
                          Danh sách lỗi ghi nhận trên váy:
                        </span>
                        <div className="space-y-1">
                          {(ic.conditions || [ic.condition])
                            .filter((c) => c !== 'normal_wear' && c !== 'good')
                            .map((cid) => {
                              const cat = getDamageCatalogItem(cid);
                              return (
                                <div
                                  key={cid}
                                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#EFE2DC] text-xs"
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-[#2C2523]">{cat.name}</span>
                                    <span className="text-[10.5px] text-[#8C7D7E] italic hidden sm:inline">
                                      ({cat.description})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-bold text-red-700">
                                      {cat.feeType === 'deposit_100'
                                        ? 'Tịch thu 100% Cọc'
                                        : cat.feeType === 'agreement'
                                          ? (ic.agreedAmount ? `${fmtVnd(ic.agreedAmount)} (Thỏa thuận)` : 'Thỏa thuận 2 bên')
                                          : cat.feeLabel}
                                    </span>
                                    {!isReadOnly && (
                                      <button
                                        type="button"
                                        onClick={() => toggleCondition(idx, cid)}
                                        className="text-stone-400 hover:text-red-600 font-bold px-1 cursor-pointer text-sm leading-none"
                                        title="Bỏ chọn lỗi này"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Nhập mức phí đền bù thỏa thuận nếu chọn Mục 10 (Lỗi khác ngoài danh mục) */}
                      {(ic.conditions || [ic.condition]).includes('custom_agreement') && (
                        <div className="p-2.5 rounded-xl bg-white border border-[#EFE2DC] space-y-1.5 animate-fadeIn">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <label className="text-[11.5px] font-bold text-[#733F49] flex items-center gap-1.5">
                              <span>🤝 Mức phí đền bù thỏa thuận thống nhất (Mục 10):</span>
                            </label>
                            <span className="text-[10px] text-[#8C7D7E] italic">
                              * Dựa trên quyết định thống nhất giữa 2 bên
                            </span>
                          </div>
                          <InputNumber
                            disabled={isReadOnly}
                            min={0}
                            max={ic.maxDeposit || 50000000}
                            step={50000}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            value={ic.agreedAmount || 0}
                            onChange={(val) => updateAgreedAmount(idx, val)}
                            addonAfter="VNĐ"
                            className="w-full text-xs font-bold"
                            placeholder="Nhập mức phí 2 bên đã thỏa thuận..."
                          />
                        </div>
                      )}

                      {/* Hiện trạng thực tế (Cho phép nhân viên trực tiếp điền / chỉnh sửa) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11.5px] font-bold text-[#733F49] flex items-center gap-1.5">
                            <FileEdit size={13} className="text-[#8D3B4C]" />
                            Hiện trạng thực tế:
                          </label>
                          <span className="text-[10px] text-[#8C7D7E] italic">
                            * Có thể chỉnh sửa hoặc điền chi tiết vị trí từng lỗi trên váy
                          </span>
                        </div>
                        <Input.TextArea
                          rows={3}
                          disabled={isReadOnly}
                          placeholder="Nhập mô tả hiện trạng thực tế, vị trí vết bẩn hoặc lỗi hư hại trên váy..."
                          value={ic.damageNotes || ''}
                          onChange={(e) => updateNotes(idx, e.target.value)}
                          className="text-xs rounded-xl border-[#E5D7D0] focus:border-[#733F49]"
                        />
                      </div>

                      {/* Hộp hiển thị mức bồi thường tổng cộng */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EFE2DC] flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Lock size={13} className="text-[#8C7D7E]" />
                          <span className="text-[#5F4E50] font-semibold">Tổng mức phí đền bù niêm yết:</span>
                          <span className="text-sm font-bold text-red-700">
                            {(ic.conditions || [ic.condition]).includes('total_damage')
                              ? `Tịch thu 100% Cọc (${fmtVnd(ic.compensation)})`
                              : fmtVnd(ic.compensation)}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8C7D7E] italic">
                          🔒 Khóa cố định theo Bảng giá niêm yết (Tối đa tiền cọc)
                        </span>
                      </div>


                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hồ sơ ảnh giám định hiện trạng */}
          <div className="p-3 rounded-2xl border border-[#EFE5E1] bg-[#FAF6F3] space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Camera size={15} className="text-[#733F49]" />
                <span className="font-bold text-[12px] text-[#2C2523]">
                  Hồ Sơ Ảnh Giám Định Hiện Trạng ({evidencePhotos.length})
                </span>
                {itemsCondition.some((ic) => {
                  const conds = ic.conditions || [ic.condition];
                  return conds.some((c) => c !== 'normal_wear' && c !== 'good') || Number(ic.compensation || 0) > 0;
                }) && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${evidencePhotos.length > 0
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                      }`}>
                      {evidencePhotos.length > 0 ? '✓ Đã đính kèm ảnh đối soát' : '⚠️ Bắt buộc chụp ảnh lỗi'}
                    </span>
                  )}
              </div>
              {!isReadOnly && (
                <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#733F49] text-white text-[11px] font-bold cursor-pointer hover:bg-[#5C3038] transition-colors shadow-2xs">
                  <Camera size={13} />
                  <span>+ Thêm Ảnh Giám Định</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {evidencePhotos.length === 0 ? (
              <div className="py-2.5 px-3 rounded-xl border border-dashed border-[#DDC6C0] text-center bg-white text-[11px] text-[#8C7D7E] flex items-center justify-center gap-2">
                <Camera size={14} className="text-[#A38D91]" />
                <span>Chưa có ảnh giám định hiện trạng (nhấn nút "+ Thêm Ảnh Giám Định" để tải ảnh)</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {evidencePhotos.map((photo, pIdx) => (
                  <div key={pIdx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#E5D7D0] group shadow-2xs">
                    <img src={photo} alt={`Bằng chứng ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removePhoto(pIdx)}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer border-0"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bảng Quyết Toán Tài Chính Chuẩn Showroom */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF8F6] via-[#FAF3F0] to-[#FFF8F6] border border-[#EFE5E1] text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2.5 border-b border-[#F0E4DE]">
              <div>
                <span className="text-[#8C7D7E] text-[10px] uppercase font-bold tracking-wider block">Cọc Ban Đầu</span>
                <strong className="text-[13.5px] text-[#2C2523]">{fmtVnd(order.totalDeposit)}</strong>
              </div>
              <div>
                <span className="text-[#8C7D7E] text-[10px] uppercase font-bold tracking-wider block">Phạt Trễ Hạn</span>
                <strong className={`text-[13.5px] ${lateFee > 0 ? 'text-amber-700' : 'text-[#8C7D7E]'}`}>
                  {lateFee > 0 ? `-${fmtVnd(lateFee)}` : '0 đ'}
                </strong>
              </div>
              <div>
                <span className="text-[#8C7D7E] text-[10px] uppercase font-bold tracking-wider block">Chi Phí Phục Chế</span>
                <strong className={`text-[13.5px] ${totalCompensation > 0 ? 'text-red-700' : 'text-[#8C7D7E]'}`}>
                  {totalCompensation > 0 ? `-${fmtVnd(totalCompensation)}` : '0 đ'}
                </strong>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-[#1E8347] text-[10px] uppercase font-bold tracking-wider block">Dự Kiến Hoàn Trả</span>
                <strong className="text-[16px] text-[#1E8347] font-sans font-bold">{fmtVnd(finalRefund)}</strong>
              </div>
            </div>
            <p className="text-[10.5px] text-[#8C7D7E] m-0 mt-2 italic text-center sm:text-left">
              * Số tiền hoàn cọc thực tế sẽ được quyết toán sau khi thống nhất biên bản giám định hiện trạng.
            </p>
          </div>

          {/* Thông tin tài khoản nhận hoàn cọc của Khách Hàng */}
          {!isReadOnly && (
            <div className="p-4 rounded-2xl border border-[#DDC6C0] bg-[#FAF5F2] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-[13px] text-[#5F2B36] flex items-center gap-2">
                  <CreditCard size={15} className="text-[#733F49]" />
                  <span>Thông Tin Nhận Chuyển Khoản Hoàn Cọc Của Khách</span>
                </span>
                <span className="text-[10.5px] text-emerald-800 font-semibold bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Hoàn cọc qua chuyển khoản (STK)
                </span>
              </div>

              {/* Form điền STK */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3.5 rounded-xl border border-[#E8DCD5]">
                <div>
                  <span className="text-[10.5px] text-[#7A6A6B] block mb-1 font-semibold">
                    Ngân hàng <span className="text-red-600">*</span>
                  </span>
                  <Input
                    size="small"
                    placeholder="VD: Vietcombank, MB, Techcombank..."
                    value={onSiteBankName}
                    onChange={(e) => setOnSiteBankName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10.5px] text-[#7A6A6B] block mb-1 font-semibold">
                    Số tài khoản (STK) <span className="text-red-600">*</span>
                  </span>
                  <Input
                    size="small"
                    placeholder="Nhập STK nhận tiền..."
                    value={onSiteAccountNum}
                    onChange={(e) => setOnSiteAccountNum(e.target.value)}
                    className="text-xs font-mono font-bold text-[#1E8347]"
                  />
                </div>
                <div>
                  <span className="text-[10.5px] text-[#7A6A6B] block mb-1 font-semibold">
                    Tên chủ tài khoản <span className="text-red-600">*</span>
                  </span>
                  <Input
                    size="small"
                    placeholder="TÊN CHỦ TÀI KHOẢN"
                    value={onSiteAccountHolder}
                    onChange={(e) => setOnSiteAccountHolder(e.target.value.toUpperCase())}
                    className="text-xs font-semibold"
                  />
                </div>
              </div>


            </div>
          )}

          {inspectionLoading && <p role="status">Đang tải biên bản…</p>}
          {inspectionError && <p role="alert" className="text-red-700">{inspectionError} <button type="button" className="underline" onClick={() => setInspectionReload((value) => value + 1)}>Thử lại</button></p>}
          {isReadOnly && !savedInspection && !inspectionLoading && !inspectionError && <p>Đơn chưa có biên bản kiểm định.</p>}
          <div className="flex flex-wrap gap-2.5 pt-1.5">
            {canResumeInspection ? (
              <button
                type="button"
                onClick={() => saveInspection({})}
                disabled={submitting || inspectionLoading || Boolean(inspectionError)}
                className="w-full py-2.5 rounded-xl bg-[#733F49] text-white text-[12.5px] font-bold disabled:opacity-60"
              >
                {submitting ? 'Đang cập nhật…' : 'Cập nhật trạng thái trả váy'}
              </button>
            ) : isReadOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-[#EFE5E1] text-[12.5px] font-bold text-[#5F4E50] hover:bg-[#FAF5F2] transition-colors bg-white cursor-pointer shadow-2xs"
              >
                {isCompletedOrder ? 'Đóng Hồ Sơ Lưu Trữ' : 'Đóng Biên Bản'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#EFE5E1] text-[12px] font-bold text-[#5F4E50] hover:bg-[#FAF5F2] transition-colors bg-transparent cursor-pointer"
                >
                  Hủy
                </button>

                {/* Nút Tạm Giữ Biên Bản Gửi Admin: CHỈ hiển thị cho STAFF, KHÔNG hiển thị cho ADMIN */}
                {!isCurrentAdmin && (
                  <button
                    type="button"
                    disabled={submitting || inspectionLoading || Boolean(inspectionError)}
                    onClick={() => handleSubmit('hold')}
                    className="flex-1 py-2.5 rounded-xl bg-[#8B2635] hover:bg-[#701E2A] text-white text-[12.5px] font-bold transition-all border-0 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-xs"
                    title="Chuyển Admin khi cần thỏa thuận hoặc thẩm định xử lý"
                  >
                    {submitting ? <RefreshCw size={13} className="animate-spin" /> : <ShieldAlert size={14} />}
                    <span>Tạm Giữ Biên Bản Gửi Admin</span>
                  </button>
                )}

                {/* Nút Khách Đồng Ý Tại Quầy: ẨN khi Staff chọn Thỏa thuận 2 bên hoặc Hư hỏng nặng */}
                {!isStaffEscalationRequired && (
                  <button
                    type="button"
                    disabled={submitting || inspectionLoading || Boolean(inspectionError)}
                    onClick={() => handleSubmit('complete')}
                    className="flex-1 py-2.5 rounded-xl bg-[#1E8347] hover:bg-[#166534] text-white text-[12.5px] font-bold transition-all border-0 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-xs"
                    title="Hoàn tất kiểm định và chuyển đơn sang trạng thái Chờ Hoàn Cọc"
                  >
                    {submitting ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>Khách Đồng Ý Tại Quầy</span>
                  </button>
                )}


              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminNegotiationModal({ order, onClose, onSuccess }) {
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreedPenalty, setAgreedPenalty] = useState(0);
  const [transactionCode, setTransactionCode] = useState('');
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [bankName, setBankName] = useState('Vietcombank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState(order.customerName || '');
  const [negotiationNotes, setNegotiationNotes] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    getReturnInspection(order._id)
      .then((insp) => {
        if (!active) return;
        setInspection(insp);
        if (!insp) setLoadError('Đơn chưa có biên bản kiểm định.');
        if (insp) {
          const initPenalty = insp.negotiatedByAdmin ? insp.agreedPenaltyFee : insp.totalDeduction;
          setAgreedPenalty(initPenalty ?? 0);
          if (insp.refundBankDetails?.bankName) setBankName(insp.refundBankDetails.bankName);
          if (insp.refundBankDetails?.accountNumber) setAccountNumber(insp.refundBankDetails.accountNumber);
          if (insp.refundBankDetails?.accountHolder) setAccountHolder(insp.refundBankDetails.accountHolder);
          if (insp.adminNegotiationNotes) setNegotiationNotes(insp.adminNegotiationNotes);
        }
      })
      .catch(() => { if (active) setLoadError('Không tải được biên bản kiểm định.'); })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [order._id, reload]);

  const totalDeposit = Number(inspection?.initialDeposit ?? order.totalDeposit ?? 0);
  const staffInitialDeduction = inspection?.totalDeduction ?? 0;
  const finalRefund = Math.max(0, totalDeposit - agreedPenalty);
  const remaining = Math.max(0, finalRefund - (inspection?.refundedAmount ?? 0));
  const invalidRefund = inspection && (finalRefund > inspection.depositCollected || finalRefund < inspection.refundedAmount);
  const phone = order.customerPhone || order.phone || order.customer?.phone || '';

  const handleCopyPhone = () => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    message.success('Đã sao chép số điện thoại khách hàng!');
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSubmitAdminSettle = async () => {
    if (loading || loadError || !inspection || submitting) return;
    if (invalidRefund) {
      message.error('Số tiền hoàn không khớp với giao dịch thu hoặc hoàn cọc đã ghi nhận.');
      return;
    }
    if (agreedPenalty > totalDeposit) {
      message.error(`Mức phạt không được vượt quá số tiền cọc (${fmtVnd(totalDeposit)})!`);
      return;
    }
    if (remaining > 0 && (!bankName.trim() || !/^\d{6,30}$/.test(accountNumber.trim()) || !accountHolder.trim())) {
      message.warning('Vui lòng kiểm tra ngân hàng, số tài khoản và tên chủ tài khoản nhận hoàn cọc.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await settleInspectionAdmin(order._id, {
        agreedPenaltyFee: agreedPenalty,
        transactionCode: transactionCode.trim(),
        expectedAmount: remaining,
        negotiationNotes,
        refundBankDetails: {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          notes: negotiationNotes,
        },
      });

      message.success(
        transactionCode.trim()
          ? 'Đã lưu kết quả đàm phán và hoàn tất quyết toán cọc.'
          : 'Đã hoàn tất đàm phán. Đơn đã chuyển sang trạng thái Chờ Hoàn Cọc.'
      );
      onSuccess(result);
    } catch (err) {
      message.error(err?.response?.data?.message || err.message || 'Xác nhận đàm phán thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-[#EFE5E1]">
        {/* Header */}
        <div className="flex items-center justify-between py-2.5 px-4 border-b border-red-200 bg-red-50/70 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700">
              <PhoneCall size={16} />
            </div>
            <div>
              <h3 className="font-sans text-[15px] font-bold text-red-950 m-0">
                Admin Đàm Phán Mức Phạt & Hoàn Tất Đơn
              </h3>
              <p className="text-[10.5px] text-red-700 m-0 font-medium">
                Đơn #{order.orderCode} • Trạng thái: Tạm giữ - Chờ Admin đàm phán
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white text-stone-600 hover:text-red-900 flex items-center justify-center transition-colors cursor-pointer border border-red-100"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3.5 text-xs font-jakarta">
          {/* Thông tin liên hệ khách hàng & Khiếu nại */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[13px] text-stone-900">{order.customerName}</span>
                {phone && (
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-red-700 bg-white px-2 py-0.5 rounded border border-red-200">
                    <PhoneCall size={11} /> {phone}
                  </span>
                )}
              </div>
              {phone && (
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${phone}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors no-underline"
                  >
                    <PhoneCall size={12} />
                    <span>Gọi Khách</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 font-bold text-[11px] hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    {copiedPhone ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedPhone ? 'Đã sao chép' : 'Sao chép SĐT'}</span>
                  </button>
                </div>
              )}
            </div>
            <div className="text-[11.5px] text-stone-800">
              <span className="font-bold text-red-800">Lý do khách khiếu nại / Ghi chú từ Staff: </span>
              <span className="italic">"{inspection?.disputeReason || 'Khách không đồng ý với biên bản kiểm định hoặc mức phạt do Staff đề xuất tại chỗ.'}"</span>
            </div>
          </div>

          {/* BƯỚC 3: Admin xem ảnh lỗi Staff chụp & Đánh giá hiện trạng */}
          <div className="p-3.5 rounded-xl border border-[#EFE5E1] bg-white space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-stone-800 text-white flex items-center justify-center text-[10.5px] font-bold">3</span>
                <span className="font-bold text-[12.5px] text-[#5F2B36]">
                  Admin Xem Ảnh Lỗi Staff Đã Chụp & Đánh Giá
                </span>
              </div>
              <span className="text-[11px] text-stone-600">
                Mức phạt Staff đề xuất: <strong className="text-red-700">{fmtVnd(staffInitialDeduction)}</strong>
              </span>
            </div>

            {/* Chi tiết từng váy */}
            <div className="space-y-1.5">
              {(inspection?.itemsCondition || order.items || []).map((it, idx) => {
                const condList = Array.isArray(it.conditions) && it.conditions.length > 0
                  ? it.conditions
                  : (it.condition ? [it.condition] : ['good']);
                const realDamages = condList.filter((c) => c !== 'normal_wear' && c !== 'good');
                const displayName = it.damageName || (realDamages.length ? formatMultipleDamageNames(condList) : 'Hao mòn tự nhiên');

                return (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#FAF5F2] border border-[#F0E6E2] flex items-center justify-between text-[11.5px] flex-wrap gap-1">
                    <div>
                      <strong className="text-stone-900">{it.name || order.items?.[idx]?.name || `Váy ${idx + 1}`}</strong>
                      <span className="text-stone-500 ml-1.5 font-medium">({displayName})</span>
                      {it.note && <div className="text-red-700 italic text-[11px] mt-0.5 whitespace-pre-line">• {it.note}</div>}
                    </div>
                    <div className="text-right">
                      <span className="text-stone-600">Phí Staff ghi: </span>
                      <strong className="text-red-700">{fmtVnd(it.repairFee || it.compensation || 0)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bộ sưu tập ảnh lỗi Staff chụp */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                  <Camera size={13} className="text-red-600" />
                  <span>Ảnh bằng chứng lỗi ({inspection?.evidencePhotos?.length || 0} ảnh) - Nhấn ảnh để phóng to:</span>
                </span>
              </div>
              {inspection?.evidencePhotos && inspection.evidencePhotos.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {inspection.evidencePhotos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => setPreviewPhoto(photo)}
                      className="w-16 h-16 rounded-lg overflow-hidden border-2 border-red-200 hover:border-red-500 cursor-pointer transition-all shadow-xs group relative"
                    >
                      <img src={photo} alt={`Lỗi ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                        <Eye size={12} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-500 italic text-[11px] text-center">
                  Không tìm thấy ảnh lỗi lưu kèm đơn hàng.
                </div>
              )}
            </div>
          </div>

          {/* BƯỚC 4: Admin duyệt hoàn tất đơn & Chốt mức phạt đàm phán */}
          <div className="p-3.5 rounded-xl border-2 border-[#1E8347]/30 bg-[#F6FAF7] space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1E8347] text-white flex items-center justify-center text-[10.5px] font-bold">4</span>
              <span className="font-bold text-[12.5px] text-[#166534]">
                Admin Duyệt Hoàn Tất Đơn & Chốt Mức Phạt Thống Nhất
              </span>
            </div>

            <p className="text-[11px] text-[#2F6B42] m-0 leading-relaxed">
              💡 <strong>Hướng dẫn:</strong> Admin trực tiếp trao đổi với khách, thống nhất "Mức phạt chung hợp lý" cả 2 bên cùng đồng thuận, sau đó nhập vào ô bên dưới.
            </p>

            {/* Nhập mức phạt */}
            <div className="bg-white p-3 rounded-xl border border-[#D5E8D8] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-[11.5px] text-stone-900">
                  Mức Phạt Thống Nhất Sau Đàm Phán (VND):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setAgreedPenalty(0)}
                    className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                  >
                    Miễn phạt (0đ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgreedPenalty(Math.round(staffInitialDeduction * 0.5))}
                    className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                  >
                    Giảm 50% phạt ({fmtVnd(Math.round(staffInitialDeduction * 0.5))})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgreedPenalty(staffInitialDeduction)}
                    className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-stone-100 text-stone-800 border border-stone-200 hover:bg-stone-200 cursor-pointer"
                  >
                    Giữ nguyên ({fmtVnd(staffInitialDeduction)})
                  </button>
                </div>
              </div>

              <Input
                size="large"
                placeholder="Nhập mức phạt đã thống nhất..."
                value={agreedPenalty ? String(agreedPenalty).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                onChange={(e) => {
                  const rawDigits = e.target.value.replace(/\D/g, '');
                  const num = rawDigits ? parseInt(rawDigits, 10) : 0;
                  setAgreedPenalty(Math.min(totalDeposit, Math.max(0, num)));
                }}
                suffix={<span className="text-stone-500 font-bold text-xs">VND</span>}
                className="text-sm font-bold text-red-700"
              />

              {/* Bảng tổng kết tiền hoàn cọc */}
              <div className="p-2.5 rounded-lg bg-[#FAF5F2] border border-[#F0E6E2] flex items-center justify-between text-[11.5px] flex-wrap gap-2">
                <div className="space-x-2 text-stone-600">
                  <span>Tiền cọc: <strong className="text-stone-900">{fmtVnd(totalDeposit)}</strong></span>
                  <span>• Mức phạt chốt: <strong className="text-red-700">-{fmtVnd(agreedPenalty)}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-stone-800">Hoàn lại cho khách:</span>
                  <span className="text-[16px] font-bold text-[#1E8347]">{fmtVnd(finalRefund)}</span>
                </div>
              </div>
            </div>

            {invalidRefund && <p role="alert" className="text-xs font-semibold text-amber-800">
              Cần đối soát cọc. Đã thu {fmtVnd(inspection.depositCollected)}, đã hoàn {fmtVnd(inspection.refundedAmount)}.
            </p>}
            {remaining > 0 && !invalidRefund && <div className="bg-white p-3 rounded-xl border border-[#D5E8D8] space-y-2 text-[11.5px]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-stone-800 font-bold flex items-center gap-1.5 text-xs">
                  <CreditCard size={14} className="text-[#1E8347]" />
                  <span>Hình thức hoàn tiền: <strong className="text-[#1E8347]">Chuyển khoản (STK)</strong></span>
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                  Chính sách duy nhất: CK ngân hàng
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div>
                  <span className="text-[10.5px] text-stone-600 block mb-0.5 font-medium">Ngân hàng <span className="text-red-600">*</span></span>
                  <Input
                    size="small"
                    placeholder="VD: Vietcombank, MB..."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10.5px] text-stone-600 block mb-0.5 font-medium">Số tài khoản <span className="text-red-600">*</span></span>
                  <Input
                    size="small"
                    placeholder="Nhập STK nhận tiền..."
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="text-xs font-mono font-bold text-[#1E8347]"
                  />
                </div>
                <div>
                  <span className="text-[10.5px] text-stone-600 block mb-0.5 font-medium">Chủ tài khoản <span className="text-red-600">*</span></span>
                  <Input
                    size="small"
                    placeholder="TÊN CHỦ TÀI KHOẢN"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                    className="text-xs font-semibold"
                  />
                </div>
              </div>

              <Input
                id="negotiation-refund-reference"
                size="small"
                placeholder="Nhập mã giao dịch nếu đã chuyển tiền (không bắt buộc)..."
                value={transactionCode}
                maxLength={100}
                onChange={(event) => setTransactionCode(event.target.value)}
              />
            </div>}

            {/* Ghi chú kết quả đàm phán */}
            <div className="bg-white p-3 rounded-xl border border-[#D5E8D8]">
              <span className="text-[11px] font-bold text-stone-800 block mb-1">
                Ghi chú nội dung đàm phán & đồng thuận:
              </span>
              <Input.TextArea
                rows={2}
                placeholder="VD: Admin đã gọi trao đổi với khách, thống nhất mức hỗ trợ phục chế 50% (300.000đ). Khách đã đồng thuận và nhận hoàn tiền cọc."
                value={negotiationNotes}
                onChange={(e) => setNegotiationNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {loadError && <p role="alert" className="text-red-700">{loadError} <button type="button" className="underline" onClick={() => setReload((value) => value + 1)}>Thử lại</button></p>}
          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-28 py-2.5 rounded-xl border border-[#EFE5E1] text-[12px] font-bold text-stone-700 hover:bg-[#FAF5F2] transition-colors bg-transparent cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={submitting || loading || Boolean(loadError) || !inspection || invalidRefund}
              onClick={handleSubmitAdminSettle}
              className="flex-1 py-2.5 rounded-xl bg-[#1E8347] hover:bg-[#166534] text-white text-[12.5px] font-bold transition-all border-0 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs"
            >
              {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span>{transactionCode.trim() ? 'LƯU ĐÀM PHÁN VÀ HOÀN TẤT QUYẾT TOÁN' : 'HOÀN THÀNH ĐÀM PHÁN (CHUYỂN CHỜ HOÀN CỌC)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox xem ảnh lỗi phóng to */}
      {
        previewPhoto && (
          <div
            onClick={() => setPreviewPhoto(null)}
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
          >
            <div className="max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
              <img src={previewPhoto} alt="Bằng chứng lỗi chi tiết" className="w-full h-full object-contain max-h-[80vh] rounded-xl" />
            </div>
          </div>
        )
      }
    </div >
  );
}

function RefundModal({ order, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [refundNote, setRefundNote] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [inspectionData, setInspectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    setInspectionData(null);
    getReturnInspection(order._id)
      .then((inspection) => {
        if (active) {
          setInspectionData(inspection);
          if (!inspection) setLoadError('Đơn chưa có biên bản kiểm định.');
        }
      })
      .catch(() => { if (active) setLoadError('Không tải được biên bản kiểm định.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [order._id, reload]);

  const lateDays = inspectionData?.lateDays ?? 0;
  const totalDeduction = inspectionData?.totalDeduction;
  const lateFee = Math.min(inspectionData?.latePenaltyFee ?? 0, totalDeduction ?? 0);
  const compensation = (totalDeduction ?? 0) - lateFee;
  const finalRefund = inspectionData?.finalRefundAmount;
  const remaining = inspectionData?.refundRemaining;
  const refundConflict = inspectionData?.refundConflict;
  const canConfirm = inspectionData?.canConfirmRefund && !loading && !loadError;
  const handleConfirmRefund = async () => {
    if (!canConfirm || submitting || (remaining > 0 && !transactionCode.trim())) return;
    setSubmitting(true);
    try {
      const result = await confirmDepositRefund(order._id, { transactionCode, notes: refundNote, expectedAmount: remaining });
      message.success(remaining > 0 ? 'Đã ghi nhận giao dịch hoàn cọc.' : 'Đã lưu quyết toán cọc.');
      onSuccess(result);
    } catch (error) {
      message.error(error.message || 'Không thể ghi nhận hoàn cọc. Vui lòng thử lại.');
      setReload((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EFE5E1]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#F0E6E2] bg-[#F4FAF6] rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E8F7ED] flex items-center justify-center text-[#1E8347] shrink-0">
              <Banknote size={20} />
            </div>
            <div>
              <h3 className="font-sans text-[18px] font-bold text-[#196C3B]">
                Quyết Toán và Hoàn Cọc Cho Khách (Bước 2)
              </h3>
              <p className="text-[11.5px] text-[#6E8276]">
                Đơn #{order.orderCode} • Hoàn trả tiền cọc bảo lãnh sau khi đã qua bước kiểm định
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#E5EFE8] text-[#4F6858] hover:text-[#196C3B] flex items-center justify-center transition-colors cursor-pointer border-0"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs font-jakarta">
          {/* Thông tin khách hàng và Hiện trạng kiểm định */}
          <div className="p-3.5 rounded-xl bg-[#FAF5F2] border border-[#F0E6E2] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#8C7D7E]">Khách hàng nhận hoàn cọc:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#2C2523] text-[13px]">{order.customerName}</span>
                {order.hasAccount || order.customerId ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-[#FAF0EC] text-[#733F49] border border-[#F2D8D4]">
                    <UserCheck size={10} className="text-[#B8737D]" /> Thành Viên
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-[#F5F2F0] text-[#7A6A6B] border border-[#E8DFDC]">
                    <UserX size={10} className="text-[#A39192]" /> Khách Vãng Lai
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8C7D7E]">Số điện thoại liên hệ:</span>
              <span className="font-semibold text-[#2C2523]">{order.customerPhone || 'Chưa cập nhật'}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#EFE2DC]">
              <span className="text-[#8C7D7E]">Tình trạng kiểm định:</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#1E8347] bg-[#EAF7EE] px-2 py-0.5 rounded-md">
                <CheckCircle2 size={12} />
                {totalDeduction == null ? 'Chưa có kết quả' : totalDeduction === 0 ? 'Không khấu trừ' : `Đã khấu trừ ${fmtVnd(totalDeduction)}`}
              </span>
            </div>
          </div>

          {loading && <p role="status">Đang tải biên bản…</p>}
          {loadError && <p role="alert" className="text-red-700">{loadError} <button type="button" className="underline" onClick={() => setReload((value) => value + 1)}>Thử lại</button></p>}
          {refundConflict && <p role="alert" className="text-amber-800 font-semibold">
            {refundConflict === 'refund_exceeds_agreement'
              ? 'Số tiền đã hoàn vượt mức trên biên bản. Cần đối chiếu sao kê.'
              : 'Tiền hoàn theo biên bản vượt số cọc đã thu. Cần đối soát giao dịch thu cọc.'}
          </p>}
          {inspectionData && !canConfirm && !refundConflict && <p role="status">Biên bản chưa đủ điều kiện ghi nhận hoàn cọc hoặc đã được quyết toán.</p>}
          {inspectionData && <div className="p-4 rounded-xl bg-[#FFF9F6] border border-[#F2E5E0] space-y-2.5">
            <div className="flex justify-between text-[#7A6B6C]">
              <span>1. Tiền cọc bảo lãnh ban đầu:</span>
              <span className="font-semibold text-[#2C2523]">{fmtVnd(inspectionData.initialDeposit ?? order.totalDeposit)}</span>
            </div>
            <div className="flex justify-between text-[#7A6B6C]">
              <span>Tiền cọc đã thu:</span>
              <span className="font-semibold text-[#2C2523]">{fmtVnd(inspectionData.depositCollected)}</span>
            </div>
            {lateDays > 0 && (
              <div className="flex justify-between text-[#92400E]">
                <span>2. Khấu trừ phí trả trễ ({lateDays} ngày):</span>
                <span className="font-semibold">-{fmtVnd(lateFee)}</span>
              </div>
            )}
            {compensation > 0 && (
              <div className="flex justify-between text-[#B84E5D]">
                <span>3. Khấu trừ chi phí phục hồi / hư hại:</span>
                <span className="font-semibold">-{fmtVnd(compensation)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2.5 mt-2 border-t border-[#ECDCD6]">
              <div>
                <span className="font-bold text-[13px] text-[#2C2523] block">SỐ TIỀN CHƯA GHI NHẬN HOÀN</span>
                <span className="text-[11px] text-[#8C7D7E]">Theo biên bản: {fmtVnd(finalRefund)} · Đã ghi nhận: {fmtVnd(inspectionData.refundedAmount)}</span>
              </div>
              <span className="font-sans text-[20px] font-bold text-[#1E8347]">
                {remaining == null ? '—' : fmtVnd(remaining)}
              </span>
            </div>
          </div>}

          {/* Thông tin tài khoản ngân hàng thụ hưởng của khách */}
          {inspectionData?.refundBankDetails && (
            <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-1.5">
              <div className="font-bold text-[#166534] text-[12px] flex items-center gap-1.5">
                <CreditCard size={14} />
                <span>Tài khoản ngân hàng nhận hoàn cọc của khách:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12px] text-[#2C2523] pt-1">
                <div>
                  <span className="text-[#6E8276] block text-[11px]">Ngân hàng:</span>
                  <strong>{inspectionData.refundBankDetails.bankName || 'Ngân hàng nội địa'}</strong>
                </div>
                <div>
                  <span className="text-[#6E8276] block text-[11px]">Số tài khoản (STK):</span>
                  <strong className="font-mono text-[#166534] text-[13px]">{inspectionData.refundBankDetails.accountNumber}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-[#6E8276] block text-[11px]">Chủ tài khoản:</span>
                  <strong className="uppercase">{inspectionData.refundBankDetails.accountHolder}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Ghi chú đối soát */}
          {canConfirm && remaining > 0 && <div className="p-3 rounded-xl border border-[#EFE5E1] bg-white space-y-2">
            <p className="m-0 text-[11.5px] text-[#786663]">
              {inspectionData.refundNeedsReconciliation
                ? 'Biên bản cũ ghi đã hoàn nhưng thiếu giao dịch. Kiểm tra sao kê để tránh chuyển khoản lần nữa.'
                : 'Đối chiếu giao dịch ngân hàng của đơn trước khi xác nhận.'}
            </p>
            <label htmlFor="refund-reference" className="text-[11.5px] text-[#8C7D7E] block">
              Mã giao dịch sau khi đã chuyển khoản <span className="text-red-600">*</span>
            </label>
            <Input
              id="refund-reference"
              value={transactionCode}
              onChange={(e) => setTransactionCode(e.target.value)}
              maxLength={100}
              required
            />
            <Input
              aria-label="Ghi chú đối soát (tùy chọn)"
              placeholder="Ghi chú đối soát (tùy chọn)"
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              className="text-[12px] rounded-lg"
            />
          </div>}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#EFE5E1] text-[12px] font-bold text-[#5F4E50] hover:bg-[#FAF5F2] transition-colors bg-transparent cursor-pointer"
            >
              Hủy / Để Sau
            </button>
            <button
              type="button"
              disabled={submitting || !canConfirm || (remaining > 0 && !transactionCode.trim())}
              onClick={handleConfirmRefund}
              className="flex-1 py-2.5 rounded-xl bg-[#1E8347] text-[12.5px] font-bold text-white hover:bg-[#166534] transition-colors border-0 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs"
            >
              {submitting ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              <span>{remaining === 0 ? 'Hoàn Tất Quyết Toán' : 'Xác Nhận Đã Hoàn Cọc'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrderRentalManagement() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const isStaffContext =
    location.pathname.startsWith('/staff') ||
    (user?.role === 'staff' && !location.pathname.startsWith('/admin'));

  const queryOrderCode = searchParams.get('orderCode') || searchParams.get('search') || '';
  const queryAction = searchParams.get('action') || '';

  const initialCached = useMemo(() => {
    return getCachedAdminOrders({ page: 1, limit: PAGE_SIZE, viewMode: 'active' });
  }, []);

  const [orders, setOrders] = useState(() => initialCached?.orders || []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => !initialCached);
  const [total, setTotal] = useState(() => initialCached?.total || 0);
  const [totalPages, setTotalPages] = useState(() => initialCached?.totalPages || 1);
  const [activePage, setActivePage] = useState(1);

  // Lưu trữ chỉ số thống kê toàn hệ thống showroom (không bị nhảy về 0 khi tìm kiếm)
  const [globalStats, setGlobalStats] = useState(() => initialCached?.stats || {
    total: 0,
    renting: 0,
    completed: 0,
    cancelled: 0,
    active: 0,
  });

  const [searchTerm, setSearchTerm] = useState(queryOrderCode);
  const [highlightedOrderCode, setHighlightedOrderCode] = useState(queryOrderCode);
  const autoHandledRef = useRef(false);

  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') === 'waiting_refund' ? 'waiting_refund' : 'all');
  const [viewMode, setViewMode] = useState('active'); // 'active' (Đơn Đang Xử Lý) | 'archived' (Kho Lưu Trữ)
  const [sortField, setSortField] = useState('orderCode'); // 'orderCode' | 'customer' | 'rentalDate' | 'deposit' | 'status'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc': mới nhất -> cũ nhất, 'asc': cũ nhất -> mới nhất

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'orderCode' || field === 'rentalDate' || field === 'deposit' ? 'desc' : 'asc');
    }
  };

  const [inspectionOrder, setInspectionOrder] = useState(null); // for inspection modal (bước 1 & 2)
  const [negotiationOrder, setNegotiationOrder] = useState(null); // for Admin Negotiation Modal (bước 3 & 4)
  const [refundOrder, setRefundOrder] = useState(null); // for refund modal (bước 2 cũ)
  const [detailOrder, setDetailOrder] = useState(null); // for detail modal (chi tiết đơn thuê)
  const [statusMenuId, setStatusMenuId] = useState(null); // row dropdown open id
  const [showDamageCatalogModal, setShowDamageCatalogModal] = useState(false); // Modal bảng giá đền bù niêm yết ra ngoài trang đơn thuê

  const isArchived = (order) => order.status === 'completed' || order.status === 'complete' || order.status === 'cancelled';
  const activeOrdersCount = useMemo(() => {
    return globalStats.active ?? (globalStats.total - ((globalStats.completed || 0) + (globalStats.cancelled || 0))) ?? 0;
  }, [globalStats]);

  const archivedOrdersCount = useMemo(() => {
    return ((globalStats.completed || 0) + (globalStats.cancelled || 0)) || 0;
  }, [globalStats]);

  // ── Load orders ──────────────────────────────────────────────────────────
  const loadOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = { page: activePage, limit: PAGE_SIZE };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (!searchTerm.trim()) {
        params.viewMode = viewMode;
      }

      const result = await getAllOrdersAdmin(params, false, { throwOnError: true });
      const rawList = result.orders || [];

      setOrders(rawList);
      setTotal(result.total ?? rawList.length);
      setTotalPages(result.totalPages || Math.ceil((result.total || rawList.length) / PAGE_SIZE));
      if (result.stats) {
        setGlobalStats(result.stats);
      }
      setError('');
    } catch (err) {
      console.error('Database connection error in OrderRentalManagement:', err);
      if (!isSilent) {
        setOrders([]);
        setTotal(0);
        setTotalPages(1);
        setError('Lỗi kết nối cơ sở dữ liệu: Không thể lấy danh sách đơn thuê từ máy chủ MongoDB.');
      }
    } finally {
      setLoading(false);
    }
  }, [activePage, statusFilter, searchTerm, viewMode]);

  const handleOrderUpdated = (orderId, newStatus) => {
    setStatusMenuId(null);
    if (orderId && newStatus) {
      setOrders((prev) => {
        const next = prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o));
        try {
          localStorage.setItem('unibridal_orders_local', JSON.stringify(next));
        } catch { }
        return next;
      });
    }
    loadOrders();
  };

  const syncReturnResult = ({ order, inspection }) => {
    setOrders((previous) => previous.map((row) => (
      row._id === order._id ? { ...row, ...order, inspection } : row
    )));
    loadOrders();
  };

  useEffect(() => {
    loadOrders(Boolean(initialCached));
  }, [loadOrders]);

  // ── Tự động nhảy vào chính đơn và mở quy trình kiểm định nếu điều hướng từ Lịch Tổng Quan ──
  useEffect(() => {
    if (!queryOrderCode || autoHandledRef.current) return;
    if (loading && orders.length === 0) return;

    const cleanQ = queryOrderCode.trim().toLowerCase().replace(/^[#\s]+/, '');
    const found = orders.find((o) => {
      const code = (o.orderCode || o._id || o.id || '').toLowerCase().replace(/^[#\s]+/, '');
      return code === cleanQ;
    });

    if (found) {
      autoHandledRef.current = true;
      setHighlightedOrderCode(found.orderCode || found._id);
      if (isArchived(found)) {
        setViewMode('archived');
      } else {
        setViewMode('active');
      }

      if (queryAction === 'inspect') {
        if (canInspectOrder(found) || found.inspection) setInspectionOrder(found);
      } else if (queryAction === 'negotiate') {
        if (isAdmin && !isStaffContext) setNegotiationOrder(found);
        else setInspectionOrder(found);
      }

      setTimeout(() => {
        const rowId = `order-row-${found.orderCode || found._id}`;
        const el = document.getElementById(rowId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);

      const timer = setTimeout(() => {
        setHighlightedOrderCode(null);
      }, 6000);
      return () => clearTimeout(timer);
    } else if (!loading) {
      // Trường hợp đơn hàng không nằm ở trang 1, gọi getOrder để nạp trực tiếp
      getOrderForManagement(cleanQ)
        .then((detail) => {
          if (detail) {
            autoHandledRef.current = true;
            setHighlightedOrderCode(detail.orderCode || detail._id);
            if (isArchived(detail)) {
              setViewMode('archived');
            } else {
              setViewMode('active');
            }
            setOrders((prev) => {
              const exists = prev.some(
                (o) => (o.orderCode || o._id) === (detail.orderCode || detail._id)
              );
              return exists ? prev : [detail, ...prev];
            });

            if (queryAction === 'inspect') {
              if (canInspectOrder(detail) || detail.inspection) setInspectionOrder(detail);
            } else if (queryAction === 'negotiate') {
              if (isAdmin && !isStaffContext) setNegotiationOrder(detail);
              else setInspectionOrder(detail);
            }

            setTimeout(() => {
              const rowId = `order-row-${detail.orderCode || detail._id}`;
              const el = document.getElementById(rowId);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 350);

            const timer = setTimeout(() => {
              setHighlightedOrderCode(null);
            }, 6000);
            return () => clearTimeout(timer);
          }
        })
        .catch(() => { });
    }
  }, [queryOrderCode, queryAction, orders, loading]);

  // ── Stats derived from orders ────────────────────────────────────────────
  const stats = useMemo(() => {
    return {
      total: globalStats.total || orders.length,
      renting: globalStats.renting || orders.filter((o) => o.status === 'renting').length,
      completed: globalStats.completed || orders.filter((o) => o.status === 'completed' || o.status === 'complete').length,
      cancelled: globalStats.cancelled || orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [globalStats, orders]);

  // ── Client-side filter (for demo fallback và search) ───────────────────────
  const filteredOrders = useMemo(() => {
    const qRaw = searchTerm.trim().toLowerCase();
    const cleanQ = qRaw.replace(/^[#\s]+/, '');

    return orders.filter((o) => {
      const matchSearch =
        !cleanQ ||
        (o.orderCode || '').toLowerCase().includes(cleanQ) ||
        `#${(o.orderCode || '').toLowerCase()}`.includes(qRaw) ||
        (o.customerName || '').toLowerCase().includes(qRaw) ||
        (o.customerPhone || '').includes(cleanQ) ||
        (o.items || []).some((it) => {
          const c = getDressCode(it);
          return (it.name || '').toLowerCase().includes(qRaw) || (c && c.toLowerCase().includes(cleanQ));
        });

      const isDisputed = hasDisputedInspection(o);

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'disputed'
            ? isDisputed
            : (statusFilter === 'waiting_refund' || statusFilter === 'returned')
              ? o.inspection?.canConfirmRefund || o.inspection?.refundConflict
              : o.status === statusFilter;

      // Khi người dùng đang tìm kiếm cụ thể: Hiển thị ngay kết quả kể cả đơn nằm ở Kho Lưu Trữ
      if (cleanQ) {
        return matchSearch && matchStatus;
      }

      // Khi lọc đơn khiếu nại: Hiển thị luôn không phân biệt active/archived
      if (['disputed', 'waiting_refund', 'returned'].includes(statusFilter)) {
        return matchSearch && matchStatus;
      }

      // Khi không tìm kiếm: Phân tách rõ ràng giữa Đơn Đang Xử Lý và Kho Lưu Trữ
      if (viewMode === 'active' && isArchived(o)) return false;
      if (viewMode === 'archived' && !isArchived(o)) return false;

      return matchSearch && matchStatus;
    });

    // Tự động sắp xếp linh hoạt theo cột được chọn
    return [...list].sort((a, b) => {
      if (sortField === 'orderCode') {
        const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
        if (timeB !== timeA) {
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        }
        return sortOrder === 'desc'
          ? String(b.orderCode || b._id || '').localeCompare(String(a.orderCode || a._id || ''), undefined, { numeric: true })
          : String(a.orderCode || a._id || '').localeCompare(String(b.orderCode || b._id || ''), undefined, { numeric: true });
      }

      if (sortField === 'customer') {
        const nameA = String(a.shippingAddress?.fullName || a.userId?.fullName || a.customerName || '');
        const nameB = String(b.shippingAddress?.fullName || b.userId?.fullName || b.customerName || '');
        return sortOrder === 'desc'
          ? nameB.localeCompare(nameA, 'vi')
          : nameA.localeCompare(nameB, 'vi');
      }

      if (sortField === 'rentalDate') {
        const dateA = new Date(a.rentalStartDate || a.rentalDates?.start || 0).getTime();
        const dateB = new Date(b.rentalStartDate || b.rentalDates?.start || 0).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }

      if (sortField === 'deposit') {
        const depA = Number(a.depositAmount ?? a.pricing?.deposit ?? 0);
        const depB = Number(b.depositAmount ?? b.pricing?.deposit ?? 0);
        return sortOrder === 'desc' ? depB - depA : depA - depB;
      }

      if (sortField === 'status') {
        const stA = String(a.orderStatus || a.status || '');
        const stB = String(b.orderStatus || b.status || '');
        return sortOrder === 'desc' ? stB.localeCompare(stA) : stA.localeCompare(stB);
      }

      return 0;
    });
  }, [orders, searchTerm, statusFilter, viewMode, sortField, sortOrder]);

  // ── Pagination helper ────────────────────────────────────────────────────
  const pageNumbers = useMemo(() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    // Khi ở trang 1 hoặc 2: hiển thị 1, 2, 3 ... (totalPages - 1), totalPages
    if (activePage < 3) {
      return [1, 2, 3, '...', totalPages - 1, totalPages];
    }
    // Khi ở các trang cuối:
    if (activePage >= totalPages - 2) {
      return ['...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    // Khi ấn đến 3 trở đi: thu số 1 về (thay bằng '...'), hiện 4 -> ... 2, 3, 4 ...
    if (activePage + 2 >= totalPages - 1) {
      return ['...', activePage - 1, activePage, activePage + 1, totalPages - 1, totalPages];
    }
    return ['...', activePage - 1, activePage, activePage + 1, '...', totalPages - 1, totalPages];
  }, [activePage, totalPages]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AdminLayout activeMenu="don-thue" role={isStaffContext ? 'staff' : 'admin'}>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-[32px] sm:text-[38px] font-normal text-[#5F2B36] tracking-tight leading-tight mb-2">
            Quản Lý Đơn Thuê
          </h1>
          <p className="text-[14px] text-[#7A6B6C] font-normal max-w-3xl leading-relaxed">
            Theo dõi, điều phối tiến độ đơn thuê váy cưới và biên bản kiểm định hoàn cọc hệ thống UniBridal.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowDamageCatalogModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#ECD9D3] bg-white hover:bg-[#FAF0EC] text-[#733F49] text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Tra cứu Bảng Giá Đền Bù Thiệt Hại Niêm Yết"
          >
            <FileSpreadsheet size={15} className="text-[#B8737D]" />
            <span>Bảng Giá Đền Bù Niêm Yết</span>
          </button>

          <button
            type="button"
            onClick={() => {
              loadOrders();
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E8DDD8] bg-white text-[#5F2B36] hover:bg-[#FAF0EC] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60"
            title="Làm mới danh sách đơn thuê từ máy chủ"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Tổng đơn */}
        <div
          onClick={() => { setViewMode('active'); setStatusFilter('all'); setActivePage(1); }}
          className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FCDCE1_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] py-4 px-5 shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md hover:border-[#B8737D]/50 transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                TỔNG ĐƠN THUÊ
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#F4EDE6] flex items-center justify-center text-[#8C6D62]">
                <HangerIcon size={17} strokeWidth={1.8} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[28px] font-bold text-[#2C2523] leading-none">
                {loading && !stats.total ? '—' : stats.total}
              </span>
              <span className="text-[12px] font-medium text-[#8C7D7E] ml-1.5">đơn</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đang thuê */}
        <div
          onClick={() => { setViewMode('active'); setStatusFilter('renting'); setActivePage(1); }}
          className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#EDE9FE_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] py-4 px-5 shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md hover:border-[#6D28D9]/50 transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                ĐANG THUÊ
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-[#6D28D9]">
                <CalendarDays size={17} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[28px] font-bold text-[#6D28D9] leading-none">
                {loading && !stats.total ? '—' : stats.renting}
              </span>
              <span className="text-[12px] font-medium text-[#8C7D7E] ml-1.5">đơn</span>
            </div>
          </div>
        </div>

        {/* Card 3: Hoàn tất (Kho Lưu Trữ) */}
        <div
          onClick={() => { setViewMode('archived'); setStatusFilter('all'); setActivePage(1); }}
          className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#DEF5E7_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] py-4 px-5 shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md hover:border-[#229A53]/50 transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                ĐÃ HOÀN TẤT (LƯU KHO)
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#EAF7EE] flex items-center justify-center text-[#229A53]">
                <Archive size={17} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[28px] font-bold text-[#1E8347] leading-none">
                {loading && !stats.total ? '—' : stats.completed}
              </span>
              <span className="text-[12px] font-medium text-[#8C7D7E] ml-1.5">đơn</span>
            </div>
          </div>
        </div>

        {/* Card 4: Đã hủy */}
        <div
          onClick={() => { setViewMode('archived'); setStatusFilter('cancelled'); setActivePage(1); }}
          className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FCDFD9_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] py-4 px-5 shadow-xs flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md hover:border-[#B8737D]/50 transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                ĐÃ HỦY
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#FDECEE] flex items-center justify-center text-[#B8737D]">
                <Clock size={17} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[28px] font-bold text-[#A84A58] leading-none">
                {loading && !stats.total ? '—' : stats.cancelled}
              </span>
              <span className="text-[12px] font-medium text-[#8C7D7E] ml-1.5">đơn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search và Filter Bar (Tích hợp tìm kiếm và tab Đơn Đang Xử Lý / Kho Lưu Trữ) */}
      <div className="bg-white p-2 rounded-2xl border border-[#EFE5E1] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39192]" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách, số điện thoại, váy thuê..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!e.target.value.trim()) setHighlightedOrderCode(null);
              setActivePage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#EFE5E1] bg-[#FCF7F4] text-sm text-[#302626] placeholder-[#A39293] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30 focus:border-[#B8737D] transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setHighlightedOrderCode(null);
                setActivePage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A39192] hover:text-[#5F333B] cursor-pointer bg-transparent border-0 p-0"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0">
          <button type="button"
            aria-pressed={statusFilter === 'waiting_refund'}
            onClick={() => {
              setViewMode('active');
              const nextFilter = statusFilter === 'waiting_refund' ? 'all' : 'waiting_refund';
              setStatusFilter(nextFilter);
              if (nextFilter === 'all') setHighlightedOrderCode(null);
              setActivePage(1);
            }}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#EFE5E1] px-3 py-2 text-xs font-semibold ${statusFilter === 'waiting_refund' ? 'bg-[#733F49] text-white' : 'bg-[#FCF7F4] text-[#733F49] hover:bg-[#FAF0EC]'}`}>
            <Banknote size={14} aria-hidden="true" /> Chờ Hoàn Cọc
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('active');
              setStatusFilter('all');
              setHighlightedOrderCode(null);
              setActivePage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border-0 ${viewMode === 'active' && statusFilter !== 'waiting_refund'
              ? 'bg-[#733F49] text-white shadow-xs'
              : 'bg-[#FCF7F4] text-[#7A6B6C] hover:bg-[#FAF0EC] hover:text-[#733F49]'
              }`}
          >
            <SlidersHorizontal size={14} />
            <span>Đơn Đang Xử Lý</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${viewMode === 'active' ? 'bg-white/20 text-white' : 'bg-[#FAF0EC] text-[#733F49]'
                }`}
            >
              {activeOrdersCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('archived');
              setStatusFilter('all');
              setHighlightedOrderCode(null);
              setActivePage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border-0 ${viewMode === 'archived'
              ? 'bg-[#1E8347] text-white shadow-xs'
              : 'bg-[#FCF7F4] text-[#7A6B6C] hover:bg-[#FAF0EC] hover:text-[#733F49]'
              }`}
          >
            <Archive size={14} />
            <span>Kho Lưu Trữ Đơn Hoàn Tất</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${viewMode === 'archived' ? 'bg-white/20 text-white' : 'bg-[#EAF7EE] text-[#1E8347]'
                }`}
            >
              {archivedOrdersCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#EFE5E1] shadow-xs overflow-hidden mb-6">
        <div className="overflow-x-auto min-h-[260px]">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-[#F2E5E0] bg-[#FFF6F3]">
                <th className="py-4 px-5 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase select-none">
                  MÃ ĐƠN
                </th>
                <th
                  onClick={() => handleSort('customer')}
                  className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase cursor-pointer hover:text-[#733F49] transition-colors select-none group text-center"
                  title="Nhấp để sắp xếp theo Tên khách hàng"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>KHÁCH HÀNG</span>
                    {sortField === 'customer' && (
                      <span className="inline-flex items-center">
                        {sortOrder === 'desc' ? (
                          <ArrowDown size={13} className="text-[#733F49]" />
                        ) : (
                          <ArrowUp size={13} className="text-[#733F49]" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center">
                  VÁY THUÊ
                </th>
                <th
                  onClick={() => handleSort('rentalDate')}
                  className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase cursor-pointer hover:text-[#733F49] transition-colors select-none group text-center"
                  title="Nhấp để sắp xếp theo Thời gian thuê"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>NGÀY THUÊ</span>
                    {sortField === 'rentalDate' && (
                      <span className="inline-flex items-center">
                        {sortOrder === 'desc' ? (
                          <ArrowDown size={13} className="text-[#733F49]" />
                        ) : (
                          <ArrowUp size={13} className="text-[#733F49]" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('deposit')}
                  className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase cursor-pointer hover:text-[#733F49] transition-colors select-none group text-center"
                  title="Nhấp để sắp xếp theo Tiền cọc"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>TIỀN CỌC</span>
                    {sortField === 'deposit' && (
                      <span className="inline-flex items-center">
                        {sortOrder === 'desc' ? (
                          <ArrowDown size={13} className="text-[#733F49]" />
                        ) : (
                          <ArrowUp size={13} className="text-[#733F49]" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase cursor-pointer hover:text-[#733F49] transition-colors select-none group text-center"
                  title="Nhấp để sắp xếp theo Trạng thái đơn"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>TRẠNG THÁI</span>
                    {sortField === 'status' && (
                      <span className="inline-flex items-center">
                        {sortOrder === 'desc' ? (
                          <ArrowDown size={13} className="text-[#733F49]" />
                        ) : (
                          <ArrowUp size={13} className="text-[#733F49]" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-4 px-5 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center">
                  THAO TÁC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6EDE9]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <RefreshCw size={24} className="animate-spin text-[#B8737D] mx-auto mb-2" />
                    <p className="text-[13px] text-[#8C7D7E]">Đang tải dữ liệu đơn thuê...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#8C7D7E] text-sm">
                    {viewMode === 'archived' ? (
                      <div className="flex flex-col items-center justify-center">
                        <FolderArchive size={32} className="text-[#8C7D7E] mb-2 opacity-60" />
                        <p className="font-medium text-[#4A3B3D]">Kho lưu trữ hiện chưa có đơn hoàn tất nào.</p>
                        <p className="text-[12px] text-[#A39293] mt-0.5">
                          Các đơn đã hoàn tất hoặc hủy được lưu tại đây.
                        </p>
                      </div>
                    ) : (
                      'Không tìm thấy đơn thuê nào phù hợp.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const firstItem = order.items?.[0] || {};
                  const canInspect = canInspectOrder(order);
                  const isDisputed = hasDisputedInspection(order);

                  const hasSearch = Boolean(searchTerm && searchTerm.trim());
                  const hasFilter = Boolean(statusFilter && statusFilter !== 'all');
                  const hasSearchOrFilter = hasSearch || hasFilter;

                  const cleanSearch = (searchTerm || '').trim().toLowerCase().replace(/^[#\s]+/, '');
                  const cleanHighlight = (highlightedOrderCode || '').toLowerCase().replace(/^[#\s]+/, '');

                  // Chỉ bôi vàng khi người dùng CÓ tìm kiếm hoặc CÓ lọc trạng thái cụ thể
                  const isHighlighted =
                    hasSearchOrFilter &&
                    Boolean(
                      (cleanHighlight && (
                        (order.orderCode && order.orderCode.toLowerCase().replace(/^[#\s]+/, '') === cleanHighlight) ||
                        order._id === highlightedOrderCode
                      )) ||
                      (hasSearch && cleanSearch && cleanSearch === (order.orderCode || '').toLowerCase().replace(/^[#\s]+/, ''))
                    );

                  return (
                    <tr
                      id={`order-row-${order.orderCode || order._id}`}
                      key={order._id || order.orderCode}
                      className={`transition-all duration-300 ${isHighlighted
                        ? 'bg-amber-100/80 border-l-4 border-l-amber-500 ring-2 ring-amber-400 ring-inset shadow-md'
                        : isDisputed
                          ? 'bg-red-50/40 hover:bg-red-50/70 border-l-4 border-l-red-500'
                          : 'hover:bg-[#FCF9F7]'
                        }`}
                    >
                      {/* Mã đơn */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block px-2 py-0.5 rounded bg-[#F6EDE8] text-[#846E63] font-mono text-[11px] font-semibold tracking-wider">
                            {order.orderCode || order._id}
                          </span>
                          {isHighlighted && (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-500 text-white animate-bounce shadow-2xs">
                              Đang Chọn
                            </span>
                          )}
                          {isArchived(order) && (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#EAF7EE] text-[#1E8347] border border-[#C6F0D4]">
                              Kho Lưu Trữ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13.5px] font-semibold text-[#2C2523] leading-tight">
                            {order.customerName || '—'}
                          </span>
                          {(order.hasAccount || order.customerId) && (
                            <CircleUser size={15} className="text-[#733F49] shrink-0" title="Khách hàng thành viên" />
                          )}
                        </div>
                      </td>

                      {/* Váy thuê */}
                      <td className="py-4 px-4 text-center">
                        <div className="text-[13px] font-semibold text-[#2C2523] leading-tight text-center">
                          {firstItem.name || '—'}
                        </div>
                        {order.items?.length > 1 && (
                          <div className="text-[11px] text-[#8C7D7E] font-medium mt-0.5">
                            (+{order.items.length - 1} váy khác)
                          </div>
                        )}
                      </td>

                      {/* Ngày thuê */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-[#FAF0EC] text-[#733F49] text-[12px] font-bold border border-[#F2D8D4]">
                          {getRentalDays(order)} ngày
                        </span>
                      </td>

                      {/* Tiền cọc */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="text-[13.5px] font-bold text-[#863E4B]">
                          {fmtVnd(order.totalDeposit)}
                        </div>
                        {order.totalRentPrice > 0 && (
                          <div className="text-[11px] text-[#8C7D7E] mt-0.5">
                            (Thuê: {fmtVnd(order.totalRentPrice)})
                          </div>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <StatusBadge status={order.status} order={order} />
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-2">
                          {/* Nút Xem Chi Tiết Đơn Thuê */}
                          <button
                            type="button"
                            onClick={() => setDetailOrder(order)}
                            title="Xem chi tiết đầy đủ đơn thuê"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF0EC] hover:bg-[#F3E2DB] border border-[#ECD9D3] text-[#733F49] text-[12px] font-bold transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye size={13} />
                            <span>Chi Tiết</span>
                          </button>
                          {/* ĐỐI VỚI CÁC ĐƠN ĐÃ HOÀN TẤT TRONG KHO LƯU TRỮ */}
                          {isArchived(order) && !order.inspection?.canConfirmRefund && !order.inspection?.refundConflict && !isDisputed ? (
                            <button
                              type="button"
                              onClick={() => setInspectionOrder(order)}
                              title="Xem biên bản kiểm định và hồ sơ lưu trữ"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAF7EE] border border-[#C6F0D4] text-[#1E8347] text-[12px] font-bold hover:bg-[#D5EFE0] transition-all cursor-pointer shadow-2xs"
                            >
                              <FileText size={13} />
                              <span>Hồ Sơ Lưu Trữ</span>
                            </button>
                          ) : canInspect ? (
                            <button
                              type="button"
                              onClick={() => setInspectionOrder(order)}
                              title="Bước 1: Tiếp nhận và Kiểm định hiện trạng váy khi khách trả"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#733F49] text-white text-[12px] font-bold hover:bg-[#5C3038] shadow-xs transition-all cursor-pointer"
                            >
                              <ShieldCheck size={13} />
                              <span>{order.inspection ? 'Cập Nhật Trả Váy' : 'Kiểm Định Trả Váy'}</span>
                            </button>
                          ) : isDisputed ? (
                            <button
                              type="button"
                              onClick={() => (isAdmin && !isStaffContext) ? setNegotiationOrder(order) : setInspectionOrder(order)}
                              title={(isAdmin && !isStaffContext) ? "Admin trực tiếp gọi điện đàm phán mức phạt & hoàn tất đơn" : "Xem biên bản đã gửi Admin thẩm định"}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold shadow-xs transition-all cursor-pointer ${(isAdmin && !isStaffContext)
                                ? 'bg-red-600 text-white hover:bg-red-700 border border-red-600'
                                : 'bg-[#FAF0EB] text-[#733F49] hover:bg-[#F3E2DB] border border-[#ECD9D3]'}`}
                            >
                              {(isAdmin && !isStaffContext) ? <PhoneCall size={13} /> : <Eye size={13} />}
                              <span>{(isAdmin && !isStaffContext) ? 'Đàm Phán & Xử Lý' : 'Xem Biên Bản'}</span>
                            </button>
                          ) : (order.status === 'returned' || order.status === 'waiting_refund' || order.inspection) ? (
                            <div className="inline-flex items-center gap-1.5">
                              {(order.inspection?.canConfirmRefund || order.inspection?.refundConflict) && <button
                                type="button"
                                onClick={() => setRefundOrder(order)}
                                title="Mở biên bản để ghi nhận giao dịch hoàn cọc"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E8347] hover:bg-[#166534] text-white text-[12px] font-bold shadow-xs transition-all cursor-pointer"
                              >
                                <Banknote size={14} />
                                <span>{order.inspection.refundConflict ? 'Đối Soát Cọc' : order.inspection.refundRemaining > 0 ? 'Hoàn Cọc' : 'Quyết Toán'}</span>
                              </button>}
                              <button
                                type="button"
                                onClick={() => setInspectionOrder(order)}
                                title="Xem biên bản kiểm định hiện trạng"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF0EB] text-[#733F49] hover:bg-[#F3E2DB] border border-[#ECD9D3] text-[12px] font-semibold transition-all cursor-pointer"
                              >
                                <Eye size={13} />
                                <span>Biên Bản</span>
                              </button>
                            </div>
                          ) : (
                            <UpdateStatusDropdown
                              order={order}
                              onUpdated={handleOrderUpdated}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="py-4 px-6 border-t border-[#F0E6E2] bg-[#FAF2EE] rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[12.5px] text-[#7A6B6C]">
            <span>
              Hiển thị{' '}
              <span className="font-bold text-[#5F2B36]">
                {total > 0 ? `${(activePage - 1) * PAGE_SIZE + 1} – ${Math.min(activePage * PAGE_SIZE, total)}` : 0}
              </span>{' '}
              trong tổng số{' '}
              <span className="font-bold text-[#2C2523]">{total}</span> đơn
            </span>
          </div>

          <div className="flex items-center gap-2 text-[13px]">
            <button
              type="button"
              disabled={activePage === 1}
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#7A6B6C] hover:bg-[#F5ECE8] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {pageNumbers.map((p, idx) =>
              p === '...' ? (
                <button
                  key={`ellipsis-${idx}`}
                  type="button"
                  title={idx === 0 ? 'Về các trang trước' : 'Đến các trang sau'}
                  onClick={() => {
                    if (idx === 0) setActivePage((prev) => Math.max(1, prev - 3));
                    else setActivePage((prev) => Math.min(totalPages, prev + 3));
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#8C7D7E] text-xs font-bold hover:bg-[#F5ECE8] hover:text-[#78434D] transition-colors cursor-pointer"
                >
                  ...
                </button>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActivePage(p)}
                  className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ${activePage === p
                    ? 'bg-[#78434D] text-white shadow-xs'
                    : 'bg-white border border-[#EFE5E1] shadow-2xs text-[#4A3B3D] hover:bg-[#F5ECE8]'
                    }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              disabled={activePage === totalPages}
              onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#7A6B6C] hover:bg-[#F5ECE8] disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bước 1 & 2: Inspection Modal (Biên bản kiểm định trả váy) */}
      {inspectionOrder && (
        <InspectionModal
          order={inspectionOrder}
          onClose={() => setInspectionOrder(null)}
          onSuccess={(result) => {
            setInspectionOrder(null);
            syncReturnResult(result);
          }}
        />
      )}

      {/* Bước 3 & 4: Admin Negotiation Modal (Admin trực tiếp đàm phán mức phạt & hoàn tất đơn) */}
      {isAdmin && negotiationOrder && (
        <AdminNegotiationModal
          order={negotiationOrder}
          onClose={() => setNegotiationOrder(null)}
          onSuccess={(result) => {
            setNegotiationOrder(null);
            syncReturnResult(result);
          }}
        />
      )}

      {/* Bước 2: Refund Modal (Quyết toán và Hoàn tiền cọc sau kiểm định) */}
      {refundOrder && (
        <RefundModal
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onSuccess={(result) => {
            setRefundOrder(null);
            syncReturnResult(result);
          }}
        />
      )}

      {/* Modal Chi Tiết Đơn Thuê */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
        />
      )}

      {/* Modal Bảng Giá Đền Bù Thiệt Hại Niêm Yết tra cứu ngoài trang */}
      <DamagePriceCatalogModal
        open={showDamageCatalogModal}
        onClose={() => setShowDamageCatalogModal(false)}
      />
    </AdminLayout>
  );
}
