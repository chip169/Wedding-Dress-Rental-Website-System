import Order from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';
import Dress from '../models/Dress.model.js';
import User from '../models/User.model.js';
import Role from '../models/Role.model.js';
import Appointment from '../models/Appointment.model.js';
import { reportBounds, previousBounds, reportBuckets, isInPeriod, paymentDate, sumPayments, growthRate, revenueChart, rankedDresses } from '../utils/adminReportMetrics.js';
const REVENUE_TYPES = ['rental_payment', 'damage_compensation'];
const DEPOSIT_ORDER_STATUSES = ['deposit_paid', 'preparing', 'delivered', 'renting', 'returned', 'completed', 'complete'];
const effectiveDateFilter = (start, end) => ({ $or: [{ paidAt: { ...(start ? { $gte: start } : {}), $lt: end } }, { paidAt: null, createdAt: { ...(start ? { $gte: start } : {}), $lt: end } }] });
export async function revenueReport(period = 'month') {
    if (!['week', 'month', 'quarter', 'year'].includes(period))
        period = 'month';
    const { start, end } = reportBounds(period);
    const previous = previousBounds(period, start);
    const [successful, payments, orders, dresses] = await Promise.all([
        Payment.find({ status: 'success', ...effectiveDateFilter(null, end) }).populate('orderId', 'orderCode items customerName shippingAddress totalRentPrice').select('orderId transactionType amount paidAt createdAt').lean(),
        // Load the complete selected period; client pagination and CSV use the same data.
        Payment.find(effectiveDateFilter(start, end)).sort({ paidAt: -1, createdAt: -1 }).populate('orderId', 'orderCode items customerName shippingAddress').populate('customerId', 'fullName').lean(),
        Order.find({ createdAt: { $gte: start, $lt: end } }).select('orderCode status items totalRentPrice createdAt').lean(),
        Dress.find({}).select('code name images').lean(),
    ]);
    const selected = successful.filter((p) => isInPeriod(paymentDate(p), start, end));
    const prior = successful.filter((p) => isInPeriod(paymentDate(p), previous.start, previous.end));
    const revenue = sumPayments(selected, REVENUE_TYPES);
    const rentalRevenue = sumPayments(selected, ['rental_payment']);
    const depositPayment = sumPayments(selected, ['deposit_payment']);
    const damagePayment = sumPayments(selected, ['damage_compensation']);
    const depositsHeld = Math.max(0, sumPayments(successful, ['deposit_payment']) - sumPayments(successful, ['deposit_refund']));
    const inflow = rentalRevenue + depositPayment + damagePayment;
    const percent = (value) => inflow ? Math.round(value / inflow * 100) : 0;
    const activeOrders = orders.filter((o) => DEPOSIT_ORDER_STATUSES.includes(o.status));
    const recorded = new Set((await Payment.distinct('orderId', { orderId: { $in: activeOrders.map((o) => o._id) }, transactionType: 'deposit_payment', status: 'success' })).map(String));
    return { period, revenue, rentalRevenue, depositPayment, damagePayment, depositsHeld,
        orders: orders.length, activeOrdersCount: activeOrders.length,
        orderValue: activeOrders.reduce((s, o) => s + o.totalRentPrice, 0), growthRate: growthRate(revenue, sumPayments(prior, REVENUE_TYPES)),
        financialBreakdown: { rentalRevenue, depositPayment, damagePayment, depositsHeld, rentalPercentage: percent(rentalRevenue), depositPercentage: percent(depositPayment), damagePercentage: percent(damagePayment) },
        topDresses: rankedDresses(selected, dresses), chart: revenueChart(selected, orders, period, start, end),
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
    const [report, orders, customerRole, maintenance, totalAppointments, todayAppointments, totalUsers] = await Promise.all([
        revenueReport(period), Order.find({ createdAt: { $gte: start, $lt: end } }).select('status totalRentPrice createdAt').lean(),
        Role.findOne({ code: 'CUSTOMER' }).select('_id').lean(), Dress.countDocuments({ status: 'maintenance' }),
        Appointment.countDocuments({ appointmentDate: { $gte: start, $lt: end }, status: { $ne: 'cancelled' } }),
        Appointment.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } }),
        User.countDocuments({}),
    ]);
    const members = customerRole ? await User.countDocuments({ roleId: customerRole._id, isActive: true }) : 0;
    const buckets = reportBuckets(period, start, end);
    const ordersPipeline = Object.fromEntries(['deposit_paid', 'preparing', 'delivered', 'renting', 'returned', 'completed'].map((status) => [status, orders.filter((order) => order.status === status || status === 'completed' && order.status === 'complete').length]));
    return { period, revenue: report.revenue, growthRate: report.growthRate, orderValue: report.orderValue, totalOrders: orders.length, completedOrders: ordersPipeline.completed,
        maintenance, members, totalUsers, totalAppointments, todayAppointments, ordersPipeline, ordersMissingDepositTransaction: report.ordersMissingDepositTransaction.length,
        chart: report.chart.map((bucket, index) => ({ ...bucket, orderValue: orders.filter((order) => DEPOSIT_ORDER_STATUSES.includes(order.status) && isInPeriod(order.createdAt, buckets[index].start, buckets[index].end)).reduce((sum, order) => sum + order.totalRentPrice, 0) })),
    };
}
