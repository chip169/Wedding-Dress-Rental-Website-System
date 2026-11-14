import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Contract from '../models/contractModel.js';
import Payment from '../models/paymentModel.js';
import ReturnInspection from '../models/returnInspectionModel.js';
import User from '../models/userModel.js';
import { sendRefundConfirmationEmail } from '../utils/sendEmail.js';

export const CLOSED_ORDER_STATUSES = ['completed', 'complete'];
// The Order schema normalizes the legacy value when casting string filters.
export const CLOSED_ORDER_STATUS_FILTER = ['completed', /^complete$/];
export const RETURN_REVIEW_STATUSES = ['returned', 'waiting_refund', ...CLOSED_ORDER_STATUSES];
export const returnError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

export async function getDepositPayments(orderIds, session) {
  const paymentsByOrder = new Map();
  if (!orderIds.length) return paymentsByOrder;
  const payments = await Payment.find({
    orderId: { $in: orderIds },
    transactionType: { $in: ['deposit_payment', 'deposit_refund'] },
    status: 'success',
  }).select('orderId amount transactionType paidAt createdAt transactionCode').session(session ?? null).lean();
  for (const payment of payments) {
    const key = String(payment.orderId);
    const summary = paymentsByOrder.get(key) ?? { collected: 0, refunded: 0, date: null, reference: '' };
    const amount = Number(payment.amount) || 0;
    if (payment.transactionType === 'deposit_payment') {
      summary.collected += amount;
    } else {
      summary.refunded += amount;
      const date = payment.paidAt || payment.createdAt;
      if (date && (!summary.date || date >= summary.date)) {
        summary.date = date;
        summary.reference = payment.transactionCode;
      }
    }
    paymentsByOrder.set(key, summary);
  }
  return paymentsByOrder;
}

function depositCollected(order, inspection, payments) {
  const depositLimit = Math.min(Number(order.totalDeposit ?? Infinity), Number(inspection.initialDeposit ?? Infinity));
  return Math.max(0, Math.min(payments?.collected ?? 0, depositLimit));
}

export function inspectionRefundState(order, inspection, payments) {
  if (!inspection) return null;
  const approved = inspection.customerStatus === 'approved'
    || (!inspection.customerStatus && inspection.customerConfirmed === true);
  const amount = Number(inspection.finalRefundAmount);
  const expected = inspection.finalRefundAmount != null && Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
  const paid = payments?.refunded ?? 0;
  const collected = depositCollected(order, inspection, payments);
  const remaining = expected === null ? null : Math.max(0, expected - paid);
  const disputed = order.status === 'disputed' || inspection.customerStatus === 'disputed';
  const conflict = expected !== null && paid > expected ? 'refund_exceeds_agreement'
    : expected !== null && approved && expected > collected ? 'insufficient_deposit' : null;
  const isRefunded = approved && !disputed && !conflict && expected > 0 && remaining === 0;
  let refundStatus = 'pending_review';
  if (disputed) refundStatus = 'disputed';
  else if (approved && conflict) refundStatus = 'reconciliation_required';
  else if (approved && expected === 0) refundStatus = 'not_required';
  else if (isRefunded) refundStatus = 'refunded';
  else if (approved && expected > 0) refundStatus = 'pending';

  return {
    ...inspection,
    customerStatus: disputed ? 'disputed' : approved ? 'approved' : inspection.customerStatus || 'pending',
    isRefunded,
    refundedAt: isRefunded ? payments?.date : null,
    refundReference: isRefunded ? payments?.reference : '',
    refundStatus,
    refundConflict: conflict,
    depositCollected: collected,
    refundedAmount: paid,
    refundRemaining: remaining,
    refundNeedsReconciliation: refundStatus === 'pending' && inspection.isRefunded === true,
    canConfirmRefund: approved && !disputed && !conflict && expected !== null
      && RETURN_REVIEW_STATUSES.includes(order.status)
      && (remaining > 0 || !CLOSED_ORDER_STATUSES.includes(order.status)),
  };
}

export async function completeReturnedOrder(order, now = new Date()) {
  const completed = await Order.findOneAndUpdate(
    { _id: order._id, status: { $in: ['returned', 'waiting_refund', ...CLOSED_ORDER_STATUS_FILTER] } },
    [{ $set: {
      status: { $cond: [{ $in: ['$status', CLOSED_ORDER_STATUSES] }, '$status', 'completed'] },
      completedAt: { $ifNull: ['$completedAt', now] },
      maintenanceUntil: { $ifNull: ['$maintenanceUntil', {
        $add: [{ $ifNull: ['$completedAt', now] }, 86_400_000],
      }] },
    } }],
    { returnDocument: 'after', updatePipeline: true },
  );
  if (!completed) throw returnError(409, 'Trạng thái đơn đã thay đổi. Vui lòng tải lại.');
  await Contract.updateMany(
    {
      $or: [{ orderId: order._id }, ...(order.contractCode ? [{ contractCode: order.contractCode }] : [])],
      status: { $ne: 'completed' },
    },
    { $set: { status: 'completed' } },
  );
  return completed;
}

export function refundBankDetails(value, needsRefund) {
  const details = Object.fromEntries(
    ['bankName', 'accountNumber', 'accountHolder', 'notes'].map((key) => [key, String(value?.[key] ?? '').trim()]),
  );
  if (needsRefund && (!details.bankName || !/^\d{6,30}$/.test(details.accountNumber) || !details.accountHolder)) {
    throw returnError(400, 'Vui lòng nhập ngân hàng, số tài khoản (6–30 chữ số) và tên chủ tài khoản hợp lệ.');
  }
  return details;
}

export function refundTransactionCode(value) {
  const reference = String(value ?? '').trim().toUpperCase();
  if (!reference || reference.length > 100) throw returnError(400, 'Nhập mã giao dịch chuyển khoản để ghi nhận hoàn cọc.');
  return reference;
}

export async function validateRefundPayment(order, inspection, payments, { transactionCode, expectedAmount }, session) {
  const expected = Number(inspection.finalRefundAmount);
  const paid = payments?.refunded ?? 0;
  if (!Number.isSafeInteger(expected) || expected < 0) throw returnError(409, 'Số tiền hoàn trên biên bản không hợp lệ.');
  if (paid > expected) throw returnError(409, 'Giao dịch đã hoàn vượt số tiền trên biên bản. Vui lòng đối soát.');
  if (expected > depositCollected(order, inspection, payments)) {
    throw returnError(409, 'Tiền hoàn theo biên bản vượt số cọc đã thu thành công. Vui lòng đối soát giao dịch thu cọc.');
  }
  const remaining = expected - paid;
  if (remaining === 0) {
    const reference = String(transactionCode ?? '').trim().toUpperCase();
    if (reference && reference !== String(payments?.reference ?? '').trim().toUpperCase()) {
      throw returnError(409, 'Đơn đã được quyết toán. Vui lòng kiểm tra mã giao dịch đã ghi nhận.');
    }
    return null;
  }
  if (expectedAmount !== undefined && expectedAmount !== remaining) {
    throw returnError(409, 'Số tiền cần hoàn đã thay đổi. Vui lòng tải lại biên bản để đối soát.');
  }
  const reference = refundTransactionCode(transactionCode);
  const escapedReference = reference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const used = await Payment.exists({
    transactionType: 'deposit_refund', status: 'success',
    transactionCode: new RegExp(`^\\s*${escapedReference}\\s*$`, 'i'),
  }).session(session ?? null);
  if (used) throw returnError(409, 'Mã giao dịch hoàn cọc đã được ghi nhận. Vui lòng kiểm tra lại sao kê.');
  return { reference, remaining };
}

// Standalone MongoDB is used for local development. Serialize its refund writes within this API process.
let localRefundQueue = Promise.resolve();
async function recordRefund(operation) {
  try {
    return await mongoose.connection.transaction(operation);
  } catch (error) {
    if (error.code === 11000) return mongoose.connection.transaction(operation);
    if (error.code !== 20 || !error.message?.includes('Transaction numbers are only allowed')) throw error;
    const pending = localRefundQueue.then(() => operation());
    localRefundQueue = pending.catch(() => {});
    return pending;
  }
}

export async function confirmDepositRefund(idOrCode, data = {}, user) {
  const identity = /^[0-9a-fA-F]{24}$/.test(idOrCode) ? { _id: idOrCode } : { orderCode: idOrCode.toUpperCase() };
  const now = new Date();
  const { order, saved, inserted } = await recordRefund(async (session) => {
    const order = await Order.findOne(identity).session(session ?? null).lean();
    if (!order) throw returnError(404, 'Không tìm thấy đơn thuê.');
    if (!RETURN_REVIEW_STATUSES.includes(order.status)) throw returnError(409, 'Đơn chưa sẵn sàng để hoàn cọc.');
    const inspection = await ReturnInspection.findOne({ orderId: order._id }).session(session ?? null).lean();
    const payments = (await getDepositPayments([order._id], session)).get(String(order._id));
    const state = inspectionRefundState(order, inspection, payments);
    if (!state || !['pending', 'refunded', 'not_required', 'reconciliation_required'].includes(state.refundStatus)) {
      throw returnError(409, 'Cần biên bản kiểm định đã duyệt và có số tiền hợp lệ để quyết toán.');
    }
    const draft = await validateRefundPayment(order, inspection, payments, data, session);
    if (draft) {
      // The existing MongoDB _id index guards concurrent use of the same normalized bank reference.
      const paymentId = createHash('sha256').update(`deposit_refund:${draft.reference}`).digest('hex').slice(0, 24);
      await new Payment({
        _id: paymentId, orderId: order._id, customerId: order.customerId || null,
        transactionType: 'deposit_refund', amount: draft.remaining, method: 'VIETQR',
        transactionCode: draft.reference, status: 'success', processedBy: user._id, paidAt: now,
      }).save({ session });
    }

    const note = String(data.notes ?? '').trim();
    // Updating this inspection also serializes concurrent refunds with different references for the same order.
    const saved = await ReturnInspection.findOneAndUpdate(
      { _id: inspection._id, customerStatus: inspection.customerStatus ?? null, finalRefundAmount: inspection.finalRefundAmount },
      { $set: {
        isRefunded: Boolean(draft) || state.isRefunded,
        refundedAt: draft ? now : state.refundedAt,
        ...(draft && note ? { 'refundBankDetails.notes': note } : {}),
      } },
      { returnDocument: 'after', session },
    ).lean();
    if (!saved) throw returnError(409, 'Biên bản đã thay đổi. Vui lòng tải lại.');
    return { order, saved, inserted: Boolean(draft) };
  });
  const completed = await completeReturnedOrder(order, now);

  if (inserted) {
    try {
      const customer = !order.customerEmail && !order.email && order.customerId
        ? await User.findById(order.customerId).select('email fullName').lean()
        : null;
      const to = order.customerEmail || order.email || customer?.email;
      if (to) {
        sendRefundConfirmationEmail({
          to,
          fullName: order.customerName || customer?.fullName,
          orderCode: order.orderCode,
          finalRefundAmount: saved.finalRefundAmount,
          bankDetails: saved.refundBankDetails,
          negotiationNote: saved.adminNegotiationNotes,
        }).catch((error) => console.error('[REFUND EMAIL]', error.message));
      }
    } catch (error) {
      console.error('[REFUND EMAIL]', error.message);
    }
  }
  const payments = (await getDepositPayments([order._id])).get(String(order._id));
  return { order: completed, inspection: inspectionRefundState(completed, saved, payments) };
}
