import React, { useState, useEffect, useMemo } from 'react';
import { message, Modal } from 'antd';
import { CheckCircle2, AlertTriangle, Camera, ShieldCheck, Clock, X, Send, MessageSquare, Building2, CreditCard, ArrowLeft, Crown, FileSpreadsheet, Lock } from 'lucide-react';
import { formatVnd } from '../../services/orderService';
import { getReturnInspection, approveReturnInspection, disputeReturnInspection } from '../../services/customerOrderService';
import { DAMAGE_PRICE_CATALOG, getDamageCatalogItem } from '../../data/damagePriceCatalog';

const POPULAR_BANKS = [
  'Vietcombank (VCB)',
  'MB Bank (Quân Đội)',
  'Techcombank (TCB)',
  'ACB (Á Châu)',
  'VPBank (Việt Nam Thịnh Vượng)',
  'TPBank (Tiên Phong)',
  'BIDV (Đầu Tư và Phát Triển)',
  'VietinBank (Công Thương)',
  'Agribank (Nông Nghiệp)',
  'Sacombank (Sài Gòn Thương Tín)',
  'MSB (Hàng Hải)',
  'OCB (Phương Đông)',
  'HDBank (Phát Triển TP.HCM)',
  'VIB (Quốc Tế)',
  'SHB (Sài Gòn - Hà Nội)',
  'Khác (Tự nhập tên ngân hàng)',
];

/**
 * Modal Biên Bản Kiểm Định và Quyết Toán Hoàn Cọc (Khách Hàng)
 */
export default function CustomerInspectionModal({ order, onClose, onUpdated }) {
  const [showPriceCatalog, setShowPriceCatalog] = useState(false);
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState('inspection'); // 'inspection' | 'bank_form'
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form thông tin tài khoản ngân hàng nhận hoàn cọc
  const [selectedBank, setSelectedBank] = useState('Vietcombank (VCB)');
  const [customBank, setCustomBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const defaultHolder = useMemo(() => {
    const raw = order.customerName || order.brideName || order.customer?.fullName || '';
    return raw.toUpperCase();
  }, [order]);
  const [accountHolder, setAccountHolder] = useState(defaultHolder);
  const [notes, setNotes] = useState(() => `Hoan coc don ${order.orderCode || order.id || ''}`);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getReturnInspection(order._id || order.id)
      .then((res) => {
        if (active) setInspection(res);
      })
      .catch((issue) => { if (active) setError(issue.message || 'Không tải được biên bản kiểm định.'); })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [order._id, order.id]);

  const customerStatus = inspection?.customerStatus || 'pending';
  const initialDeposit = inspection?.initialDeposit ?? order.totalDeposit ?? order.deposit ?? 0;
  const lateDays = inspection?.lateDays ?? 0;
  const lateFee = inspection?.latePenaltyFee ?? 0;
  const itemsCondition = inspection?.itemsCondition || [];
  const compensation = itemsCondition.reduce((sum, it) => sum + Number(it.repairFee || 0), 0);
  const totalDeduction = inspection?.totalDeduction ?? (lateFee + compensation);
  const finalRefund = inspection?.finalRefundAmount ?? Math.max(0, initialDeposit - totalDeduction);
  const needsBankDetails = finalRefund > 0;
  const evidencePhotos = inspection?.evidencePhotos || [];
  const refundBankDetails = inspection?.refundBankDetails || null;

  // Bước 2: Khách hàng điền xong STK và bấm xác nhận hoàn cọc
  const handleConfirmRefund = async (e) => {
    e?.preventDefault?.();
    if (loading || submitting || !inspection || customerStatus !== 'pending') return;
    const finalBank = selectedBank === 'Khác (Tự nhập tên ngân hàng)' ? customBank.trim() : selectedBank;
    if (needsBankDetails && !finalBank) {
      message.warning('Vui lòng chọn hoặc nhập tên ngân hàng thụ hưởng.');
      return;
    }
    if (needsBankDetails && !/^\d{6,30}$/.test(accountNumber.trim())) {
      message.warning('Số tài khoản cần gồm 6 đến 30 chữ số.');
      return;
    }
    if (needsBankDetails && !accountHolder.trim()) {
      message.warning('Vui lòng nhập tên chủ tài khoản nhận tiền.');
      return;
    }

    setSubmitting(true);
    try {
      const bankData = needsBankDetails ? {
        bankName: finalBank,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
        notes: notes.trim(),
      } : {};
      const res = await approveReturnInspection(order._id || order.id, bankData);
      if (!res?.inspection || res.inspection.customerStatus !== 'approved') throw new Error('Máy chủ chưa xác nhận biên bản. Vui lòng tải lại.');
      setInspection(res.inspection);
      message.success(needsBankDetails ? 'Đã duyệt biên bản. Đơn đã hoàn tất; khoản hoàn cọc đang chờ showroom xử lý.' : 'Đã duyệt biên bản và hoàn tất đơn. Không có khoản cọc cần hoàn.');
      setStep('inspection');
      if (onUpdated) onUpdated();
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Xác nhận hoàn cọc thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Khách hàng gửi đơn khiếu nại
  const handleSendDispute = async (e) => {
    e.preventDefault();
    if (loading || submitting || !inspection || customerStatus !== 'pending') return;
    if (!disputeReason.trim()) {
      message.warning('Vui lòng nhập lý do nàng muốn khiếu nại.');
      return;
    }
    setSubmitting(true);
    try {
      await disputeReturnInspection(order._id || order.id, { reason: disputeReason.trim() });
      message.success(
        'Đã gửi đơn khiếu nại thành công! Chuyên viên chăm sóc khách hàng của UniBridal sẽ liên hệ trực tiếp với nàng trong vòng 24h.'
      );
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Gửi khiếu nại thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestClose = () => {
    if (customerStatus === 'pending' && !inspection?.customerConfirmed) {
      Modal.confirm({
        title: 'Lưu ý bắt buộc xác nhận hoàn cọc',
        content: 'Đây là bước bắt buộc để showroom đối soát hiện trạng và giải ngân hoàn tiền cọc bảo lãnh về tài khoản của nàng. Nàng có chắc muốn đóng tạm thời không?',
        okText: 'Tiếp tục xem biên bản',
        cancelText: 'Đóng tạm thời',
        okButtonProps: { style: { backgroundColor: '#733F49', borderColor: '#733F49' } },
        onCancel: () => onClose(),
      });
      return;
    }
    onClose();
  };

  const getConditionLabel = (cond) => {
    const cat = getDamageCatalogItem(cond);
    if (cat.id === 'normal_wear' || cat.id === 'good') {
      return {
        label: '1. Hao mòn tự nhiên (Miễn phí)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        name: cat.name,
        desc: cat.description,
        feeLabel: cat.feeLabel,
      };
    }
    return {
      label: cat.name,
      color: cat.isAdminOnly
        ? 'text-rose-700 bg-rose-50 border-rose-200'
        : 'text-amber-800 bg-amber-50 border-amber-200',
      name: cat.name,
      desc: cat.description,
      feeLabel: cat.feeLabel,
    };
  };

  if (loading) return <Modal open title="Biên bản kiểm định" onCancel={onClose} footer={null}><p role="status">Đang tải biên bản kiểm định...</p></Modal>;
  if (error) return <Modal open title="Không tải được biên bản" onCancel={onClose} footer={null}><p role="alert">{error}</p></Modal>;
  if (!loading && !inspection) return <Modal open title="Biên bản kiểm định" onCancel={onClose} footer={null}>Showroom chưa lập biên bản cho đơn này.</Modal>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-jakarta animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#EFE5E1] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F0E6E2] bg-[#FFF8F6] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FDECEE] flex items-center justify-center text-[#B8737D] shrink-0">
              {step === 'bank_form' ? <CreditCard size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-playfair text-lg font-bold text-[#5F2B36] m-0">
                  {step === 'bank_form'
                    ? needsBankDetails ? 'Điền Tài Khoản Nhận Hoàn Cọc' : 'Xác Nhận Biên Bản Kiểm Định'
                    : 'Biên Bản Kiểm Định Trả Váy & Quyết Toán Cọc'}
                </h3>
                {customerStatus === 'pending' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                    <Crown size={10} />
                    <span>Cần xác nhận</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8C7D7E] m-0 mt-0.5">
                Đơn hàng #{order.orderCode || order.id} • {step === 'bank_form' ? 'Gửi thông tin để showroom xử lý hoàn cọc' : 'Lập bởi chuyên viên Atelier UniBridal'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPriceCatalog(true)}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#E0D0CA] text-[#733F49] hover:bg-[#FAF0EC] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Xem bảng giá niêm yết đền bù thiệt hại"
            >
              <FileSpreadsheet size={13} className="text-[#B8737D]" />
              <span className="hidden sm:inline">Bảng Giá Niêm Yết</span>
            </button>
            <button
              type="button"
              onClick={handleRequestClose}
              className="w-7 h-7 rounded-full bg-[#FAF2EE] text-[#7A6B6C] hover:text-[#5F2B36] flex items-center justify-center transition-colors cursor-pointer border-0"
              title="Đóng tạm thời"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Nội dung Modal */}
        <div className="p-4 sm:p-5 overflow-y-auto">
          {step === 'bank_form' ? (
            /* Form xác nhận và gửi thông tin để showroom xử lý hoàn cọc */
            <form onSubmit={handleConfirmRefund} className="space-y-4 text-xs animate-fadeIn">
              {/* Hộp tổng kết tiền hoàn cọc */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Số tiền đề nghị hoàn
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    (Tiền cọc ban đầu {formatVnd(initialDeposit)} - Khấu trừ {formatVnd(totalDeduction)})
                  </span>
                </div>
                <span className="font-playfair text-2xl font-bold text-[#15803D]">
                  {formatVnd(finalRefund)}
                </span>
              </div>

              {/* Thông tin điền Form */}
              {needsBankDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-[#FFFDFC] p-4 rounded-2xl border border-[#F2E5E0]">
                  {/* Chọn ngân hàng */}
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#4A3B3D] mb-1 flex items-center gap-1.5">
                      <Building2 size={13} className="text-[#B8737D]" />
                      <span>Ngân hàng thụ hưởng <span className="text-rose-500">*</span></span>
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E0D0CA] bg-white text-xs text-[#2C2523] outline-none focus:border-[#733F49] cursor-pointer"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    {selectedBank === 'Khác (Tự nhập tên ngân hàng)' && (
                      <input
                        type="text"
                        required
                        placeholder="Nhập tên ngân hàng..."
                        value={customBank}
                        onChange={(e) => setCustomBank(e.target.value)}
                        className="w-full mt-2 px-3 py-2 rounded-xl border border-[#E0D0CA] bg-white text-xs text-[#2C2523] outline-none focus:border-[#733F49]"
                      />
                    )}
                  </div>

                  {/* Số tài khoản (STK) */}
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#4A3B3D] mb-1 flex items-center gap-1.5">
                      <CreditCard size={13} className="text-[#B8737D]" />
                      <span>Số tài khoản (STK) <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6,30}"
                      minLength={6}
                      maxLength={30}
                      placeholder="Nhập số tài khoản ngân hàng"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 rounded-xl border border-[#E0D0CA] bg-white text-[13px] font-mono tracking-wider font-semibold text-[#2C2523] outline-none focus:border-[#733F49]"
                    />
                  </div>

                  {/* Tên chủ tài khoản */}
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#4A3B3D] mb-1 flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-[#B8737D]" />
                      <span>Tên chủ tài khoản (Viết in hoa) <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: NGUYEN QUYNH MAI"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-[#E0D0CA] bg-white text-xs font-bold uppercase text-[#2C2523] outline-none focus:border-[#733F49]"
                    />
                  </div>

                  {/* Ghi chú */}
                  <div>
                    <label className="block text-[11.5px] font-medium text-[#7A6B6C] mb-1">
                      Nội dung chuyển khoản / Ghi chú (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Nội dung chuyển khoản hoàn cọc"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E0D0CA] bg-white text-xs text-[#5F4E50] outline-none focus:border-[#733F49]"
                    />
                  </div>
                </div>
              )}

              {/* Thông báo cam kết */}
              <div className="p-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[11px] text-[#7A6B6C] flex items-center gap-2">
                <Crown size={14} className="text-[#B8737D] shrink-0" />
                {needsBankDetails ? (
                  <span>
                    Sau khi xác nhận, showroom đối soát và hoàn <strong className="text-emerald-700">{formatVnd(finalRefund)}</strong> về số tài khoản trên.
                  </span>
                ) : (
                  <span>Biên bản này không có khoản cọc cần hoàn. Nàng có thể xác nhận trực tiếp.</span>
                )}
              </div>

              {/* Buttons điều hướng */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('inspection')}
                  className="py-2.5 px-4 rounded-xl border border-[#E0D0CA] bg-white text-[#5F2B36] font-bold text-xs hover:bg-[#FAF2EE] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Xem Lại Biên Bản</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#1E8347] text-white font-bold text-xs hover:bg-[#166534] transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2 border-0 disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  <span>{submitting ? 'Đang gửi...' : needsBankDetails ? 'Xác Nhận & Gửi Thông Tin Nhận Tiền' : 'Xác Nhận Biên Bản'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= GIAO DIỆN XEM BIÊN BẢN KIỂM ĐỊNH HIỆN TRẠNG (2 CỘT GỌN 1 MÀN) ================= */
            <div className="space-y-3.5 text-xs">
              {/* Status Alert Banner (Gọn gàng 1 dòng ngang) */}
              {customerStatus === 'disputed' ? (
                <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between flex-wrap gap-2 text-[11.5px]">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <span>Nàng đã gửi khiếu nại: "{inspection?.disputeReason || 'Chưa đồng ý với khấu trừ'}"</span>
                  </div>
                  <span className="text-amber-700 text-[11px]">Showroom đang đối soát và sẽ liên hệ sớm.</span>
                </div>
              ) : customerStatus === 'approved' ? (
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between flex-wrap gap-2 text-[11.5px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-800">
                      Nàng đã duyệt biên bản kiểm định.
                    </span>
                    <span className="text-emerald-700">
                      {inspection?.isRefunded ? 'Đã hoàn cọc:' : 'Đề nghị hoàn:'} <strong>{formatVnd(finalRefund)}</strong>
                    </span>
                  </div>
                  {refundBankDetails?.accountNumber && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#2C2523] bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CreditCard size={12} className="text-emerald-700 shrink-0" />
                      <span>{refundBankDetails.bankName || 'Ngân hàng'}: <strong className="font-mono">{refundBankDetails.accountNumber}</strong> ({refundBankDetails.accountHolder})</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFF5F2] via-[#FFF9F6] to-[#FFF5F2] border border-[#E8BDB4] text-[#5F2B36] flex items-center justify-between flex-wrap gap-2 text-[11.5px]">
                  <div className="flex items-center gap-2 font-bold text-[#8C3A48]">
                    <AlertTriangle size={15} className="text-[#B8737D] shrink-0" />
                    <span>Yêu cầu kiểm tra & xác nhận biên bản để hoàn tất thủ tục hoàn cọc bảo lãnh</span>
                  </div>
                </div>
              )}

              {/* Bố cục 2 cột chính: Cột trái (Hiện trạng & Ảnh) | Cột phải (Quyết toán & Hành động) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
                {/* Cột 1: HIỆN TRẠNG LỄ PHỤC & ẢNH ĐỐI SOÁT */}
                <div className="flex flex-col gap-3">
                  <div className="flex-1 p-3.5 rounded-2xl border border-[#EFE5E1] bg-white space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#F5EBE7] pb-2">
                      <span className="font-bold text-[11.5px] uppercase tracking-wider text-[#8C7D7E]">
                        1. Hiện Trạng Lễ Phục Khi Trả
                      </span>
                      {itemsCondition.length > 0 && (
                        <span className="text-[11px] text-[#8C7D7E]">
                          {itemsCondition.length} lễ phục
                        </span>
                      )}
                    </div>

                    {itemsCondition.length === 0 ? (
                      <div className="p-3 rounded-xl border border-[#EFE5E1] bg-[#FAF5F2] text-center text-[#8C7D7E] text-[11px]">
                        Biên bản chưa ghi chi tiết hiện trạng từng lễ phục.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                        {itemsCondition.map((item, idx) => {
                          const cond = getConditionLabel(item.condition);
                          const fee = Number(item.repairFee || 0);
                          return (
                            <div key={idx} className="p-2.5 rounded-xl border border-[#F2E5E0] bg-[#FFFDFC] space-y-1.5 text-[11.5px]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-[12.5px] text-[#5F2B36] truncate">
                                  {order.items?.[idx]?.name || order.dress || `Lễ phục #${idx + 1}`}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${cond.color}`}>
                                  {cond.label}
                                </span>
                              </div>
                              {item.note && (
                                <p className="text-[11px] text-[#5F4E50] bg-[#FAF5F2] px-2 py-1.5 rounded-lg border border-[#F0E6E2] m-0 leading-snug">
                                  <strong className="text-[#8C7D7E]">Ghi chú:</strong> {item.note}
                                </p>
                              )}
                              <div className="flex justify-between items-center text-[11px] pt-0.5">
                                <span className="text-[#8C7D7E]">Mức khấu trừ hư hại:</span>
                                <span className={`font-bold ${fee > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {fee > 0 ? `-${formatVnd(fee)}` : '0 ₫'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Ảnh bằng chứng đối soát */}
                  {evidencePhotos.length > 0 && (
                    <div className="p-3 rounded-2xl border border-[#EFE5E1] bg-[#FAF8F7]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-[#8C7D7E] flex items-center gap-1.5">
                          <Camera size={13} className="text-[#733F49]" />
                          <span>Ảnh Đối Soát Hiện Trạng ({evidencePhotos.length})</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {evidencePhotos.map((photo, pIdx) => (
                          <a
                            key={pIdx}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E5D7D0] shrink-0 group hover:border-[#733F49] transition-colors"
                            title="Bấm để xem ảnh gốc"
                          >
                            <img src={photo} alt={`Chứng cứ ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cột 2: BẢNG QUYẾT TOÁN CỌC & HÀNH ĐỘNG */}
                <div className="flex flex-col justify-between gap-3 p-3.5 rounded-2xl border border-[#F2E5E0] bg-[#FFF9F6]">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#ECDCD6] pb-2">
                      <span className="font-bold text-[11.5px] uppercase tracking-wider text-[#8C7D7E]">
                        2. Bảng Quyết Toán Tiền Cọc
                      </span>
                    </div>

                    <div className="space-y-2 text-[12px]">
                      <div className="flex justify-between text-[#7A6B6C]">
                        <span>Tiền cọc bảo lãnh ban đầu:</span>
                        <span className="font-semibold text-[#2C2523]">{formatVnd(initialDeposit)}</span>
                      </div>
                      {lateDays > 0 && (
                        <div className={`flex justify-between ${lateDays > 5 ? 'text-rose-700 font-bold' : 'text-[#92400E]'}`}>
                          <span>Phí trễ hạn ({lateDays} ngày{lateDays > 5 ? ' - Quá 5 ngày: Tịch thu cọc' : ' - 50%/ngày'}):</span>
                          <span className="font-semibold">-{formatVnd(lateFee)}</span>
                        </div>
                      )}
                      {compensation > 0 && (
                        <div className="flex justify-between text-[#B84E5D]">
                          <span>Khấu trừ chi phí phục hồi hư hại:</span>
                          <span className="font-semibold">-{formatVnd(compensation)}</span>
                        </div>
                      )}

                      <div className="pt-2.5 mt-2 border-t border-[#ECDCD6] flex justify-between items-baseline">
                        <div>
                          <span className="font-bold text-[12.5px] text-[#5F2B36] block">
                            SỐ TIỀN CỌC HOÀN TRẢ NÀNG:
                          </span>
                          <span className="text-[10.5px] text-[#8C7D7E]">
                            Chuyển khoản trực tiếp về STK
                          </span>
                        </div>
                        <span className="font-playfair text-[22px] font-bold text-[#1E8347]">
                          {formatVnd(finalRefund)}
                        </span>
                      </div>
                    </div>

                    {/* Khiếu nại form (nếu đang bấm khiếu nại) */}
                    {isDisputing && customerStatus === 'pending' && (
                      <form onSubmit={handleSendDispute} className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2 animate-fadeIn mt-2">
                        <div className="flex items-center gap-1.5 font-bold text-rose-900 text-[11px]">
                          <MessageSquare size={13} />
                          <span>Nội dung khiếu nại:</span>
                        </div>
                        <textarea
                          required
                          rows={2}
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          placeholder="Nhập lý do chưa đồng ý..."
                          className="w-full p-2 rounded-lg border border-rose-200 bg-white text-[11.5px] outline-none focus:border-rose-400 text-[#2C2523]"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsDisputing(false)}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-800 bg-white font-semibold text-[11px] cursor-pointer hover:bg-rose-100"
                          >
                            Quay lại
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-3 py-1 rounded-lg bg-rose-700 text-white font-bold text-[11px] cursor-pointer hover:bg-rose-800 shadow-xs flex items-center gap-1"
                          >
                            <Send size={11} />
                            <span>{submitting ? 'Đang gửi...' : 'Gửi Khiếu Nại'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Hành động dưới modal */}
                  <div className="pt-2 border-t border-[#ECDCD6]">
                    {customerStatus === 'pending' && !isDisputing ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => setIsDisputing(true)}
                          className="py-2.5 px-3 rounded-xl border border-rose-200 bg-white text-rose-800 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer text-center"
                        >
                          Khiếu Nại
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep('bank_form')}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-[#1E8347] text-white font-bold text-xs hover:bg-[#166534] transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5 border-0"
                        >
                          <CheckCircle2 size={15} />
                          <span>{needsBankDetails ? 'Đồng Ý & Điền STK Hoàn Cọc' : 'Tôi Đồng Ý Biên Bản'}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-[#733F49] text-white font-bold text-xs hover:bg-[#5C3038] transition-colors border-0 cursor-pointer text-center"
                      >
                        Đóng Biên Bản
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Bảng Giá Niêm Yết Đền Bù Thiệt Hại */}
      {showPriceCatalog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#EFE5E1] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0E6E2] bg-gradient-to-r from-[#FFF8F6] via-[#FCF4F0] to-[#FFF8F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#733F49] border border-[#ECD9D3]">
                  <FileSpreadsheet size={16} />
                </div>
                <div>
                  <h3 className="font-playfair text-[16px] font-bold text-[#5F2B36] m-0">
                    Bảng Giá Đền Bù Thiệt Hại Niêm Yết
                  </h3>
                  <p className="text-[10.5px] text-[#8C7D7E] m-0">
                    Quy chuẩn Atelier Haute Couture minh bạch • Áp dụng thống nhất
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPriceCatalog(false)}
                className="w-8 h-8 rounded-full bg-white text-[#7A6B6C] hover:text-[#733F49] flex items-center justify-center border border-[#EFE5E1] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto">
              <div className="overflow-x-auto rounded-2xl border border-[#EFE5E1]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF5F2] text-[#5F2B36] border-b border-[#EFE5E1] text-[11.5px] font-bold">
                      <th className="py-2.5 px-3 whitespace-nowrap">Nhóm Lỗi Hư Hại</th>
                      <th className="py-2.5 px-3">Hiện Trạng Thực Tế</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Mức Phí Đền Bù Niêm Yết</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Thẩm Quyền Xử Lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2E5E0] text-[11.5px]">
                    {DAMAGE_PRICE_CATALOG.map((row) => (
                      <tr key={row.id} className="hover:bg-[#FFF9F6]">
                        <td className="py-2.5 px-3 font-bold text-[#2C2523] whitespace-nowrap">{row.name}</td>
                        <td className="py-2.5 px-3 text-[#5C4D4D]">{row.description}</td>
                        <td className="py-2.5 px-3 font-bold whitespace-nowrap" style={{ color: row.color }}>{row.feeLabel}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            row.authority === 'admin_only'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : row.authority === 'admin'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : row.authority === 'both'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {row.authorityLabel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[#F0E6E2] bg-[#FAF5F2] flex justify-end">
              <button
                type="button"
                onClick={() => setShowPriceCatalog(false)}
                className="px-4 py-1.5 rounded-xl bg-[#733F49] text-white text-xs font-bold hover:bg-[#5C3038] cursor-pointer"
              >
                Đã Hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

