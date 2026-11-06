import React, { useState, useEffect, useMemo } from 'react';
import { message, Modal } from 'antd';
import { CheckCircle2, AlertTriangle, Camera, ShieldCheck, Clock, X, Send, MessageSquare, Building2, CreditCard, ArrowLeft, Sparkles } from 'lucide-react';
import { formatVnd } from '../../services/orderService';
import { getReturnInspection, approveReturnInspection, disputeReturnInspection } from '../../services/customerOrderService';

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
 * Modal Biên Bản Kiểm Định & Quyết Toán Hoàn Cọc (Khách Hàng)
 */
export default function CustomerInspectionModal({ order, onClose, onUpdated }) {
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
    switch (cond) {
      case 'good':
        return { label: 'Tốt (100% nguyên vẹn)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'minor_stain':
        return { label: 'Vết bẩn nhỏ', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'heavy_damage':
        return { label: 'Hư hỏng nặng', color: 'text-rose-700 bg-rose-50 border-rose-200' };
      case 'torn_lace':
        return { label: 'Rách ren / đính kết', color: 'text-rose-700 bg-rose-50 border-rose-200' };
      default:
        return { label: 'Đạt chuẩn', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
  };

  if (loading) return <Modal open title="Biên bản kiểm định" onCancel={onClose} footer={null}><p role="status">Đang tải biên bản kiểm định...</p></Modal>;
  if (error) return <Modal open title="Không tải được biên bản" onCancel={onClose} footer={null}><p role="alert">{error}</p></Modal>;
  if (!loading && !inspection) return <Modal open title="Biên bản kiểm định" onCancel={onClose} footer={null}>Showroom chưa lập biên bản cho đơn này.</Modal>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-jakarta animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#EFE5E1]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#F0E6E2] bg-[#FFF8F6] rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FDECEE] flex items-center justify-center text-[#B8737D] shrink-0">
              {step === 'bank_form' ? <CreditCard size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              {customerStatus === 'pending' && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Sparkles size={11} />
                  <span>Bắt Buộc Xác Nhận</span>
                </div>
              )}
              <h3 className="font-playfair text-xl font-bold text-[#5F2B36] m-0">
                {step === 'bank_form'
                  ? needsBankDetails ? 'Điền Tài Khoản Nhận Hoàn Cọc' : 'Xác Nhận Biên Bản Kiểm Định'
                  : 'Biên Bản Kiểm Định Trả Váy & Quyết Toán Cọc'}
              </h3>
              <p className="text-xs text-[#8C7D7E] m-0 mt-0.5">
                Đơn hàng #{order.orderCode || order.id} • {step === 'bank_form' ? 'Gửi thông tin để showroom đối soát và xử lý hoàn cọc' : 'Lập bởi chuyên viên Atelier UniBridal'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="w-8 h-8 rounded-full bg-[#FAF2EE] text-[#7A6B6C] hover:text-[#5F2B36] flex items-center justify-center transition-colors cursor-pointer border-0"
            title="Đóng tạm thời"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nội dung Modal */}
        {step === 'bank_form' ? (
          /* Form xác nhận và gửi thông tin để showroom xử lý hoàn cọc */
          <form onSubmit={handleConfirmRefund} className="p-6 space-y-5 text-xs animate-fadeIn">
            {/* Hộp tổng kết tiền hoàn cọc */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-between flex-wrap gap-3">
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
            {needsBankDetails && <div className="space-y-4 bg-[#FFFDFC] p-5 rounded-2xl border border-[#F2E5E0]">
              {/* Chọn ngân hàng */}
              <div>
                <label className="block text-[12px] font-bold text-[#4A3B3D] mb-1.5 flex items-center gap-1.5">
                  <Building2 size={14} className="text-[#B8737D]" />
                  <span>Ngân hàng thụ hưởng <span className="text-rose-500">*</span></span>
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0D0CA] bg-white text-xs text-[#2C2523] outline-none focus:border-[#733F49] cursor-pointer"
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
                    placeholder="Nhập tên ngân hàng của nàng (VD: Timo, Cake, PVcomBank...)"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2.5 rounded-xl border border-[#E0D0CA] bg-white text-xs text-[#2C2523] outline-none focus:border-[#733F49]"
                  />
                )}
              </div>

              {/* Số tài khoản (STK) */}
              <div>
                <label className="block text-[12px] font-bold text-[#4A3B3D] mb-1.5 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-[#B8737D]" />
                  <span>Số tài khoản (STK) <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6,30}"
                  minLength={6}
                  maxLength={30}
                  placeholder="Nhập số tài khoản ngân hàng của nàng"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0D0CA] bg-white text-[14px] font-mono tracking-wider font-semibold text-[#2C2523] outline-none focus:border-[#733F49]"
                />
              </div>

              {/* Tên chủ tài khoản */}
              <div>
                <label className="block text-[12px] font-bold text-[#4A3B3D] mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#B8737D]" />
                  <span>Tên chủ tài khoản (Viết in hoa) <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: NGUYEN QUYNH MAI"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0D0CA] bg-white text-xs font-bold uppercase text-[#2C2523] outline-none focus:border-[#733F49]"
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-[12px] font-medium text-[#7A6B6C] mb-1">
                  Nội dung chuyển khoản / Ghi chú (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Nội dung chuyển khoản hoàn cọc"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E0D0CA] bg-white text-xs text-[#5F4E50] outline-none focus:border-[#733F49]"
                />
              </div>
            </div>}

            {/* Thông báo cam kết */}
            <div className="p-3.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[11.5px] text-[#7A6B6C] flex items-start gap-2">
              <Sparkles size={16} className="text-[#B8737D] shrink-0 mt-0.5" />
              {needsBankDetails ? <span>
                Sau khi nàng xác nhận, showroom sẽ đối soát và xử lý số tiền đề nghị hoàn{' '}
                <strong className="text-emerald-700">{formatVnd(finalRefund)}</strong> về số tài khoản trên. Gửi xác nhận chưa đồng nghĩa với việc đã chuyển tiền hoàn cọc.
              </span> : <span>Biên bản này không có khoản cọc cần hoàn. Nàng có thể xác nhận mà không cần cung cấp tài khoản ngân hàng.</span>}
            </div>

            {/* Buttons điều hướng */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('inspection')}
                className="py-3 px-4 rounded-xl border border-[#E0D0CA] bg-white text-[#5F2B36] font-bold text-xs hover:bg-[#FAF2EE] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>Xem Lại Biên Bản</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-5 rounded-xl bg-[#1E8347] text-white font-bold text-xs hover:bg-[#166534] transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2 border-0 disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>{submitting ? 'Đang gửi xác nhận...' : needsBankDetails ? 'Xác Nhận Biên Bản & Gửi Thông Tin Nhận Tiền' : 'Xác Nhận Biên Bản'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* ================= GIAO DIỆN XEM BIÊN BẢN KIỂM ĐỊNH HIỆN TRẠNG ================= */
          <div className="p-6 space-y-5 text-xs">
            {/* Status Alert Banner */}
            {customerStatus === 'disputed' ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[13px] text-amber-800">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span>Nàng đã gửi khiếu nại về biên bản này</span>
                </div>
                <p className="italic bg-white p-2.5 rounded-xl border border-amber-100 text-[#4A3B3D] text-xs">
                  "{inspection?.disputeReason || 'Nàng chưa đồng ý với mức bồi thường khấu trừ'}"
                </p>
                <p className="text-[11.5px] text-amber-700 m-0">
                  Chuyên viên chăm sóc khách hàng của UniBridal đang đối soát lại hồ sơ và sẽ liên hệ hỗ trợ nàng sớm nhất.
                </p>
              </div>
            ) : customerStatus === 'approved' ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  <p className="font-bold text-[13.5px] text-emerald-800 m-0">
                    Nàng đã đồng ý với biên bản kiểm định.
                  </p>
                </div>
                <p className="text-[12px] text-emerald-700 m-0">
                  {!needsBankDetails ? 'Biên bản không có khoản cọc cần hoàn.' : <>{inspection?.isRefunded ? 'Đã ghi nhận hoàn cọc:' : 'Số tiền đề nghị hoàn, đang chờ showroom xử lý:'} <strong>{formatVnd(finalRefund)}</strong>.</>}
                </p>
                {/* Chi tiết tài khoản đã nhận tiền hoàn cọc nếu có */}
                {refundBankDetails?.accountNumber && (
                  <div className="mt-2 p-3 bg-white/80 rounded-xl border border-emerald-200 text-[11.5px] text-[#2C2523] space-y-1">
                    <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                      <CreditCard size={13} className="text-emerald-700" />
                      <span>Tài khoản thụ hưởng nhận tiền cọc:</span>
                    </div>
                    <div>• Ngân hàng: <strong>{refundBankDetails.bankName || 'Ngân hàng nội địa'}</strong></div>
                    <div>• Số tài khoản (STK): <strong className="font-mono text-[12.5px]">{refundBankDetails.accountNumber}</strong></div>
                    <div>• Chủ tài khoản: <strong>{refundBankDetails.accountHolder}</strong></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFF5F2] via-[#FFF9F6] to-[#FFF5F2] border-2 border-[#E8BDB4] text-[#5F2B36] space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-[13.5px] text-[#8C3A48]">
                  <AlertTriangle size={17} className="text-[#B8737D] shrink-0" />
                  <span>⚡ Yêu Cầu Bắt Buộc: Xác Nhận Biên Bản Kiểm Định & Quyết Toán Hoàn Cọc</span>
                </div>
                <p className="text-[12px] text-[#6B5A5C] m-0 leading-relaxed">
                  Quý khách bắt buộc kiểm tra hiện trạng lễ phục và bấm xác nhận biên bản để showroom hoàn tất đơn hàng và giải ngân hoàn tiền cọc bảo lãnh về tài khoản; nếu có điểm chưa đồng ý, quý khách có thể bấm gửi khiếu nại trực tiếp.
                </p>
              </div>
            )}

            {/* Chi tiết hiện trạng từng lễ phục */}
            <div>
              <h4 className="font-bold text-[13px] text-[#2C2523] mb-3 uppercase tracking-wider text-[11px] text-[#8C7D7E]">
                1. Hiện Trạng Lễ Phục Khi Bàn Giao Trả
              </h4>
              {itemsCondition.length === 0 ? (
                <div className="p-4 rounded-xl border border-[#EFE5E1] bg-[#FAF5F2] text-center text-[#8C7D7E]">
                  Biên bản chưa ghi chi tiết hiện trạng từng lễ phục.
                </div>
              ) : (
                <div className="space-y-3">
                  {itemsCondition.map((item, idx) => {
                    const cond = getConditionLabel(item.condition);
                    const fee = Number(item.repairFee || 0);
                    return (
                      <div key={idx} className="p-4 rounded-2xl border border-[#EFE5E1] bg-white space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-bold text-[13.5px] text-[#5F2B36]">
                            {order.items?.[idx]?.name || order.dress || `Lễ phục #${idx + 1}`}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cond.color}`}>
                            {cond.label}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-[12px] text-[#5F4E50] bg-[#FAF5F2] p-2.5 rounded-xl border border-[#F0E6E2] m-0">
                            <strong className="text-[#8C7D7E]">Ghi chú thẩm định:</strong> {item.note}
                          </p>
                        )}
                        <div className="flex justify-between items-center pt-1 text-[12px]">
                          <span className="text-[#8C7D7E]">Mức khấu trừ phục hồi hư hại:</span>
                          <span className={`font-bold ${fee > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {fee > 0 ? `-${formatVnd(fee)}` : '0 ₫ (Không khấu trừ)'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ảnh bằng chứng hiện trạng váy */}
            {evidencePhotos.length > 0 && (
              <div>
                <h4 className="font-bold text-[13px] text-[#2C2523] mb-2 uppercase tracking-wider text-[11px] text-[#8C7D7E] flex items-center gap-1.5">
                  <Camera size={14} className="text-[#733F49]" />
                  <span>Ảnh Chụp Đối Soát Hiện Trạng Tại Showroom ({evidencePhotos.length} ảnh)</span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {evidencePhotos.map((photo, pIdx) => (
                    <div key={pIdx} className="relative aspect-square rounded-xl overflow-hidden border border-[#E5D7D0]">
                      <img src={photo} alt={`Chứng cứ ${pIdx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bảng tính quyết toán tiền cọc */}
            <div>
              <h4 className="font-bold text-[13px] text-[#2C2523] mb-2.5 uppercase tracking-wider text-[11px] text-[#8C7D7E]">
                2. Bảng Quyết Toán Tiền Cọc Bảo Lãnh
              </h4>
              <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#F2E5E0] space-y-2.5 text-[12.5px]">
                <div className="flex justify-between text-[#7A6B6C]">
                  <span>Tiền cọc bảo lãnh ban đầu của đơn:</span>
                  <span className="font-semibold text-[#2C2523]">{formatVnd(initialDeposit)}</span>
                </div>
                {lateDays > 0 && (
                  <div className="flex justify-between text-[#92400E]">
                    <span>Phí trễ hạn ({lateDays} ngày):</span>
                    <span className="font-semibold">-{formatVnd(lateFee)}</span>
                  </div>
                )}
                {compensation > 0 && (
                  <div className="flex justify-between text-[#B84E5D]">
                    <span>Khấu trừ chi phí phục hồi / hư hại:</span>
                    <span className="font-semibold">-{formatVnd(compensation)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-[#ECDCD6]">
                  <div>
                    <span className="font-bold text-[14px] text-[#5F2B36] block">
                      SỐ TIỀN CỌC HOÀN TRẢ NÀNG:
                    </span>
                    <span className="text-[11px] text-[#8C7D7E]">
                      Chuyển khoản trực tiếp về tài khoản ngân hàng (STK)
                    </span>
                  </div>
                  <span className="font-playfair text-[22px] font-bold text-[#1E8347]">
                    {formatVnd(finalRefund)}
                  </span>
                </div>
              </div>
            </div>

            {/* Form gửi khiếu nại (nếu khách bấm khiếu nại) */}
            {isDisputing && customerStatus === 'pending' && (
              <form onSubmit={handleSendDispute} className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-xs">
                  <MessageSquare size={16} />
                  <span>Nội dung khiếu nại về biên bản kiểm định:</span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="VD: Tôi thấy khoản trừ hư hỏng 500.000đ chưa hợp lý vì vết nhỏ ở chân gấu váy đã có từ trước khi nhận váy..."
                  className="w-full p-3 rounded-xl border border-rose-200 bg-white text-xs outline-none focus:border-rose-400 text-[#2C2523]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDisputing(false)}
                    className="px-4 py-2 rounded-xl border border-rose-200 text-rose-800 bg-white font-semibold text-xs cursor-pointer hover:bg-rose-100"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-rose-700 text-white font-bold text-xs cursor-pointer hover:bg-rose-800 shadow-xs flex items-center gap-1.5"
                  >
                    <Send size={13} />
                    <span>{submitting ? 'Đang gửi...' : 'Gửi Đơn Khiếu Nại'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Hành động dưới modal */}
            <div className="pt-2">
              {customerStatus === 'pending' && !isDisputing ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDisputing(true)}
                    className="py-3 px-4 rounded-xl border border-rose-200 bg-white text-rose-800 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer text-center"
                  >
                    Tôi Có Thắc Mắc / Gửi Khiếu Nại
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('bank_form')}
                    className="flex-1 py-3 px-5 rounded-xl bg-[#1E8347] text-white font-bold text-xs hover:bg-[#166534] transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2 border-0"
                  >
                    <CheckCircle2 size={16} />
                    <span>{needsBankDetails ? 'Tôi Đồng Ý Biên Bản & Điền STK Nhận Hoàn Cọc' : 'Tôi Đồng Ý Biên Bản'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-[#733F49] text-white font-bold text-xs hover:bg-[#5C3038] transition-colors border-0 cursor-pointer text-center"
                >
                  Đóng Biên Bản
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

