import Order from '../models/orderModel.js';
import Payment from '../models/paymentModel.js';
import Dress from '../models/dressModel.js';
import User from '../models/userModel.js';
import Appointment from '../models/appointmentModel.js';
import ReturnInspection from '../models/returnInspectionModel.js';
import {
    reportBounds, previousBounds, reportBuckets, isInPeriod, paymentDate, sumPayments, growthRate,
    revenueChart, rankedDresses, depositBalance, retainedDepositCharges, revenueTotals,
} from '../utils/adminReportMetrics.js';
const DEPOSIT_ORDER_STATUSES = ['deposit_paid', 'preparing', 'delivered', 'renting', 'returned', 'completed', 'complete'];
const effectiveDateFilter = (start, end) => ({ $or: [{ paidAt: { ...(start ? { $gte: start } : {}), $lt: end } }, { paidAt: null, createdAt: { ...(start ? { $gte: start } : {}), $lt: end } }] });
export async function revenueReport(period = 'month') {
    if (!['week', 'month', 'quarter', 'year'].includes(period))
        period = 'month';
    const { start, end } = reportBounds(period);
    const previous = previousBounds(period, start);
    const [successful, payments, orders, dresses, inspections] = await Promise.all([
        Payment.find({ status: 'success', ...effectiveDateFilter(null, end) }).populate('orderId', 'orderCode items customerName shippingAddress totalRentPrice').select('orderId transactionType amount paidAt createdAt').lean(),
        // Load the complete selected period; client pagination and CSV use the same data.
        Payment.find(effectiveDateFilter(start, end)).sort({ paidAt: -1, createdAt: -1 }).populate('orderId', 'orderCode items customerName shippingAddress').populate('customerId', 'fullName').lean(),
        Order.find({ createdAt: { $gte: start, $lt: end } }).select('orderCode status items totalRentPrice createdAt').lean(),
        Dress.find({}).select('code name images').lean(),
        ReturnInspection.find({
            customerStatus: 'approved',
            totalDeduction: { $gt: 0 },
            $or: [{ customerConfirmedAt: { $lt: end } }, { customerConfirmedAt: null, refundedAt: { $lt: end } }],
        }).select('orderId totalDeduction latePenaltyFee customerConfirmedAt refundedAt').lean(),
    ]);
    const selected = successful.filter((p) => isInPeriod(paymentDate(p), start, end));
    const prior = successful.filter((p) => isInPeriod(paymentDate(p), previous.start, previous.end));
    const charges = retainedDepositCharges(successful, inspections);
    const selectedCharges = charges.filter((charge) => isInPeriod(charge.date, start, end));
    const priorCharges = charges.filter((charge) => isInPeriod(charge.date, previous.start, previous.end));
    const totals = revenueTotals(selected, selectedCharges);
    const priorTotals = revenueTotals(prior, priorCharges);
    const depositPayment = sumPayments(selected, ['deposit_payment']);
    const retained = charges.reduce((sum, charge) => sum + charge.damagePayment + charge.latePenaltyRevenue, 0);
    const depositsHeld = Math.max(0, depositBalance(successful) - retained);
    const percent = (value) => totals.revenue > 0 ? value / totals.revenue * 100 : 0;
    const activeOrders = orders.filter((o) => DEPOSIT_ORDER_STATUSES.includes(o.status));
    const recorded = new Set((await Payment.distinct('orderId', { orderId: { $in: activeOrders.map((o) => o._id) }, transactionType: 'deposit_payment', status: 'success' })).map(String));
    return { period, ...totals, depositPayment, depositsHeld,
        orders: orders.length, activeOrdersCount: activeOrders.length,
        orderValue: activeOrders.reduce((s, o) => s + o.totalRentPrice, 0), growthRate: growthRate(totals.revenue, priorTotals.revenue),
        financialBreakdown: {
            rentalRevenue: totals.rentalRevenue,
            damagePayment: totals.damagePayment,
            latePenaltyRevenue: totals.latePenaltyRevenue,
            rentalPercentage: percent(totals.rentalRevenue),
            damagePercentage: percent(totals.damagePayment),
            latePenaltyPercentage: percent(totals.latePenaltyRevenue),
        },
        topDresses: rankedDresses(selected, dresses), chart: revenueChart(selected, orders, period, start, end, selectedCharges),
        ordersMissingDepositTransaction: activeOrders.filter((o) => !recorded.has(String(o._id))).map((o) => o.orderCode),
        transactions: payments.map((p) => ({ id: String(p._id), code: p.transactionCode || `TXN-${String(p._id).slice(-8).toUpperCase()}`,
            date: paymentDate(p) ? new Date(paymentDate(p)).toISOString() : null,
            customer: p.orderId?.customerName || p.customerId?.fullName || p.orderId?.shippingAddress?.recipientName || 'Khách vãng lai',
            orderCode: p.orderId?.orderCode || '', dress: p.orderId?.items?.map((item) => item.name).filter(Boolean).join(', ') || 'Lễ phục',
            type: p.transactionType, amount: p.amount, method: p.method, status: p.status })),
    };
}
export async function dashboard(period = 'month') {
    if (!['week', 'month', 'quarter', 'year'].includes(period))
        period = 'month';
    const { start, end } = reportBounds(period);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [report, orders, maintenance, totalAppointments, todayAppointments, totalUsers, members] = await Promise.all([
        revenueReport(period), Order.find({ createdAt: { $gte: start, $lt: end } }).select('status totalRentPrice createdAt').lean(),
        Dress.countDocuments({ status: 'maintenance' }),
        Appointment.countDocuments({ appointmentDate: { $gte: start, $lt: end }, status: { $ne: 'cancelled' } }),
        Appointment.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } }),
        User.countDocuments({}),
        User.countDocuments({ role: 'customer', isActive: true }),
    ]);
    const buckets = reportBuckets(period, start, end);
    const ordersPipeline = Object.fromEntries(['deposit_paid', 'preparing', 'delivered', 'renting', 'returned', 'completed'].map((status) => [status, orders.filter((order) => order.status === status || status === 'completed' && order.status === 'complete').length]));
    return { period, revenue: report.revenue, growthRate: report.growthRate, orderValue: report.orderValue, totalOrders: orders.length, completedOrders: ordersPipeline.completed,
        maintenance, members, totalUsers, totalAppointments, todayAppointments, ordersPipeline, ordersMissingDepositTransaction: report.ordersMissingDepositTransaction.length,
        chart: report.chart.map((bucket, index) => ({ ...bucket, orderValue: orders.filter((order) => DEPOSIT_ORDER_STATUSES.includes(order.status) && isInPeriod(order.createdAt, buckets[index].start, buckets[index].end)).reduce((sum, order) => sum + order.totalRentPrice, 0) })),
    };
}
