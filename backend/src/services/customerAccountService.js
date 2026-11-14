import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Contract from '../models/contractModel.js';
import ReturnInspection from '../models/returnInspectionModel.js';
import {
    RETURN_REVIEW_STATUSES, completeReturnedOrder, getDepositPayments,
    inspectionRefundState, refundBankDetails,
} from './returnRefundService.js';
const fail = (status, message) => { throw Object.assign(new Error(message), { statusCode: status }); };
// Profile contacts are editable and cannot prove ownership of a guest order.
// Personal endpoints only expose orders explicitly assigned to this account.
async function ownerFilter(userId) {
    const user = await User.findById(userId).select('_id').lean();
    if (!user)
        fail(401, 'Vui lòng đăng nhập lại.');
    return { customerId: userId };
}
async function ownOrder(userId, identifier) {
    const identity = mongoose.isValidObjectId(identifier) ? { _id: identifier } : { orderCode: String(identifier).toUpperCase() };
    const order = await Order.findOne({ $and: [identity, await ownerFilter(userId)] });
    if (!order)
        fail(404, 'Không tìm thấy đơn thuê thuộc tài khoản của bạn.');
    return order;
}
export async function assertOrderAccess(user, identifier) {
    if (!user?._id)
        fail(401, 'Vui lòng đăng nhập để xem thông tin đơn thuê.');
    const role = String(user.role || '').toUpperCase();
    if (!['ADMIN', 'STAFF'].includes(role))
        await ownOrder(user._id, identifier);
}
export async function listOrders(userId) {
    const orders = await Order.find(await ownerFilter(userId)).sort({ createdAt: -1 }).lean();
    const orderIds = orders.map((order) => order._id);
    const [inspections, refunds] = await Promise.all([
        ReturnInspection.find({ orderId: { $in: orderIds } }).lean(),
        getDepositPayments(orderIds),
    ]);
    const byOrder = new Map(inspections.map((inspection) => [String(inspection.orderId), inspection]));
    return orders.map((order) => {
        const id = String(order._id);
        const insp = inspectionRefundState(order, byOrder.get(id), refunds.get(id));
        const items = (order.items || []).map((it) => ({
            ...it,
        }));
        return { ...order, items, inspection: insp };
    });
}
export async function orderDetail(userId, identifier) {
    const order = await ownOrder(userId, identifier);
    // Viewing a saved contract must never create one or infer a signature.
    const [inspection, contract] = await Promise.all([
        inspectionForOrder(order),
        Contract.findOne({ orderId: order._id })
            .select('contractCode templateName customerName phone idCard status signedAt signedMethod contractPdfUrl clauses contractSignature')
            .lean(),
    ]);
    const orderObj = order.toObject();
    const items = (orderObj.items || []).map((it) => ({
        ...it,
    }));
    return { ...orderObj, items, inspection, contract };
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
async function inspectionForOrder(order) {
    const [inspection, refunds] = await Promise.all([
        ReturnInspection.findOne({ orderId: order._id }).lean(),
        getDepositPayments([order._id]),
    ]);
    return inspectionRefundState(order, inspection, refunds.get(String(order._id)));
}
export async function getInspection(userId, identifier) {
    return inspectionForOrder(await ownOrder(userId, identifier));
}
export async function confirmInspection(userId, identifier, bankData = {}) {
    const order = await ownOrder(userId, identifier);
    const inspection = await ReturnInspection.findOne({ orderId: order._id }).lean();
    if (!inspection) fail(404, 'Đơn chưa có biên bản kiểm định.');
    if (!RETURN_REVIEW_STATUSES.includes(order.status)) {
        fail(409, 'Chỉ có thể duyệt biên bản của đơn đã trả váy.');
    }

    if (inspection.customerStatus === 'approved' || (!inspection.customerStatus && inspection.customerConfirmed === true)) {
        const completed = await completeReturnedOrder(order);
        return { order: completed.toObject(), inspection: await inspectionForOrder(completed) };
    }
    if (inspection.customerStatus !== 'pending') fail(409, 'Biên bản đang chờ showroom xử lý.');

    const details = refundBankDetails(bankData, inspection.finalRefundAmount > 0);
    const updated = await ReturnInspection.updateOne(
        { _id: inspection._id, customerStatus: 'pending' },
        { $set: { customerStatus: 'approved', customerConfirmedAt: new Date(), refundBankDetails: details } },
    );
    if (!updated.matchedCount) fail(409, 'Biên bản vừa thay đổi. Vui lòng tải lại.');

    // Khách duyệt thì đơn hoàn tất. Giao dịch hoàn cọc được xác nhận riêng.
    const completed = await completeReturnedOrder(order);
    return { order: completed.toObject(), inspection: await inspectionForOrder(completed) };
}

export async function disputeInspection(userId, identifier, reason) {
    const order = await ownOrder(userId, identifier);
    const disputableStatuses = ['returned', 'waiting_refund', 'disputed'];
    if (!disputableStatuses.includes(order.status)) fail(409, 'Đơn hiện không chờ phản hồi biên bản.');
    const disputeReason = String(reason || '').trim();
    if (!disputeReason) fail(400, 'Vui lòng nhập lý do khiếu nại.');
    const existingDispute = { orderId: order._id, customerStatus: 'disputed', disputeReason };
    const inspection = await ReturnInspection.findOne(existingDispute) ?? await ReturnInspection.findOneAndUpdate(
        { orderId: order._id, customerStatus: 'pending' },
        { $set: { customerStatus: 'disputed', disputeReason, disputeCreatedAt: new Date() } },
        { returnDocument: 'after', runValidators: true },
    ) ?? await ReturnInspection.findOne(existingDispute);
    if (!inspection) fail(409, 'Biên bản không tồn tại hoặc đã được xử lý.');
    const disputed = await Order.findOneAndUpdate(
        { _id: order._id, status: { $in: disputableStatuses } },
        { $set: { status: 'disputed' } },
        { returnDocument: 'after' },
    );
    if (!disputed) fail(409, 'Đơn vừa thay đổi. Vui lòng tải lại biên bản.');
    return { order: disputed.toObject(), inspection };
}
