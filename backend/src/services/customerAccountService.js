import mongoose from 'mongoose';
import Order from '../models/Order.model.js';
import User from '../models/User.model.js';
import Contract from '../models/Contract.model.js';
import ReturnInspection from '../models/ReturnInspection.model.js';
import Payment from '../models/Payment.model.js';
const fail = (status, message) => { throw Object.assign(new Error(message), { statusCode: status }); };
// Profile contacts are editable and cannot prove ownership of a guest order.
// Personal endpoints only expose orders explicitly assigned to this account.
async function ownerFilter(userId) {
    const user = await User.findById(userId).select('_id').lean();
    if (!user)
        fail(401, 'Vui lòng đăng nhập lại.');
    return { customerId: userId };
}
async function ownOrder(userOrId, identifier) {
    const identity = mongoose.isValidObjectId(identifier) ? { _id: identifier } : { orderCode: String(identifier).toUpperCase() };
    const role = typeof userOrId === 'object' ? String(userOrId?.roleId?.code || userOrId?.role || '').toUpperCase() : '';
    if (['ADMIN', 'STAFF', 'MANAGER'].includes(role)) {
        const order = await Order.findOne(identity);
        if (!order) fail(404, 'Không tìm thấy thông tin đơn thuê.');
        return order;
    }
    const userId = typeof userOrId === 'object' ? userOrId?._id : userOrId;
    const order = await Order.findOne({ $and: [identity, await ownerFilter(userId)] });
    if (!order)
        fail(404, 'Không tìm thấy đơn thuê thuộc tài khoản của bạn.');
    return order;
}
export async function assertOrderAccess(user, identifier) {
    if (!user?._id)
        fail(401, 'Vui lòng đăng nhập để xem thông tin đơn thuê.');
    const role = String(user.roleId?.code || user.role || '').toUpperCase();
    if (!['ADMIN', 'STAFF'].includes(role))
        await ownOrder(user._id, identifier);
}
export async function listOrders(userId) {
    const orders = await Order.find(await ownerFilter(userId)).sort({ createdAt: -1 }).lean();
    const inspections = await ReturnInspection.find({ orderId: { $in: orders.map((order) => order._id) } }).lean();
    const refunds = await Payment.find({ orderId: { $in: orders.map((order) => order._id) }, transactionType: 'deposit_refund', status: 'success' }).select('orderId amount').lean();
    const paid = new Map();
    refunds.forEach((payment) => paid.set(String(payment.orderId), (paid.get(String(payment.orderId)) || 0) + payment.amount));
    const byOrder = new Map(inspections.map((inspection) => [String(inspection.orderId), { ...inspection, isRefunded: inspection.finalRefundAmount <= 0 || (paid.get(String(inspection.orderId)) || 0) >= inspection.finalRefundAmount }]));
    return orders.map((order) => {
        const insp = byOrder.get(String(order._id)) || null;
        let status = order.status;
        const isCustomerApproved = insp?.customerStatus === 'approved' || insp?.customerConfirmed;
        if (isCustomerApproved && status !== 'completed' && status !== 'complete') {
            status = 'completed';
            Order.updateOne({ _id: order._id }, { $set: { status: 'completed' } }).catch(() => {});
        }
        return { ...order, status, inspection: insp };
    });
}
export async function orderDetail(userId, identifier) {
    const order = await ownOrder(userId, identifier);
    // Viewing a saved contract must never create one or infer a signature.
    const [inspection, contract] = await Promise.all([
        getInspection(userId, identifier),
        Contract.findOne({ orderId: order._id })
            .select('contractCode templateName customerName phone idCard status signedAt signedMethod contractPdfUrl clauses')
            .lean(),
    ]);
    const orderObj = order.toObject();
    const isCustomerApproved = inspection?.customerStatus === 'approved' || inspection?.customerConfirmed;
    if (isCustomerApproved && orderObj.status !== 'completed' && orderObj.status !== 'complete') {
        orderObj.status = 'completed';
        Order.updateOne({ _id: order._id }, { $set: { status: 'completed' } }).catch(() => {});
    }
    return { ...orderObj, inspection, contract };
}
export async function cancelOrder(userId, identifier) {
    const order = await ownOrder(userId, identifier);
    if (!['pending_payment', 'deposit_paid'].includes(order.status))
        fail(409, 'Đơn đã chuẩn bị hoặc bàn giao; vui lòng liên hệ showroom để yêu cầu hủy.');
    const updated = await Order.findOneAndUpdate({ _id: order._id, status: order.status }, { $set: { status: 'cancelled' } }, { new: true, runValidators: true });
    if (!updated)
        fail(409, 'Trạng thái đơn vừa thay đổi. Vui lòng tải lại.');
    return { ...updated.toObject(), inspection: null };
}
export async function getInspection(userId, identifier) {
    const order = await ownOrder(userId, identifier);
    const inspection = await ReturnInspection.findOne({ orderId: order._id }).lean();
    if (!inspection)
        return null;
    const refunds = await Payment.find({ orderId: order._id, transactionType: 'deposit_refund', status: 'success' }).select('amount').lean();
    const confirmed = refunds.reduce((sum, payment) => sum + payment.amount, 0);
    return { ...inspection, isRefunded: inspection.finalRefundAmount <= 0 || confirmed >= inspection.finalRefundAmount };
}
export async function confirmInspection(userId, identifier, bankData = {}) {
    const order = await ownOrder(userId, identifier);
    const inspection = await ReturnInspection.findOne({ orderId: order._id });
    if (!inspection)
        fail(404, 'Đơn chưa có biên bản kiểm định.');
    if (!['returned', 'completed', 'complete'].includes(order.status))
        fail(409, 'Chỉ có thể duyệt biên bản của đơn đã trả váy. Vui lòng tải lại hoặc liên hệ showroom.');
    if (inspection.customerStatus === 'approved') {
        if (order.status !== 'completed' && order.status !== 'complete') {
            order.status = 'completed';
            await order.save();
        }
        return { order: order.toObject(), inspection: await getInspection(userId, identifier) };
    }
    if (inspection.finalRefundAmount > 0 && (!String(bankData.bankName || '').trim() || !/^\d{6,30}$/.test(String(bankData.accountNumber || '').trim()) || !String(bankData.accountHolder || '').trim())) {
        fail(400, 'Vui lòng nhập ngân hàng, số tài khoản (6–30 chữ số) và tên chủ tài khoản hợp lệ.');
    }
    const updated = await ReturnInspection.findOneAndUpdate({ _id: inspection._id, customerStatus: inspection.customerStatus }, { $set: {
            customerStatus: 'approved', customerConfirmedAt: new Date(),
            refundBankDetails: Object.fromEntries(['bankName', 'accountNumber', 'accountHolder', 'notes'].map((key) => [key, String(bankData[key] || '').trim()])),
        } }, { new: true, runValidators: true });
    if (!updated)
        fail(409, 'Biên bản vừa thay đổi. Vui lòng tải lại.');
    // Khi khách ấn duyệt -> cập nhật đơn hàng thành hoàn tất (completed)
    order.status = 'completed';
    await order.save();
    // Completing the rental does not create a refund transaction.
    return { order: order.toObject(), inspection: await getInspection(userId, identifier) };
}
export async function disputeInspection(userId, identifier, reason) {
    const order = await ownOrder(userId, identifier);
    if (!String(reason || '').trim())
        fail(400, 'Vui lòng nhập lý do khiếu nại.');
    const inspection = await ReturnInspection.findOneAndUpdate({ orderId: order._id, customerStatus: { $ne: 'approved' } }, { $set: { customerStatus: 'disputed', disputeReason: String(reason).trim(), disputeCreatedAt: new Date() } }, { new: true, runValidators: true });
    if (!inspection)
        fail(409, 'Biên bản không tồn tại hoặc đã được xác nhận.');
    return { order: order.toObject(), inspection };
}
