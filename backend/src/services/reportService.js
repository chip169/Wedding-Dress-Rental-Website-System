import Order from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';
import Dress from '../models/Dress.model.js';
import User from '../models/User.model.js';
import Role from '../models/Role.model.js';

const REVENUE_TYPES = ['rental_payment', 'damage_compensation'];
const ACTIVE_ORDER_STATUSES = ['deposit_paid', 'preparing', 'delivered', 'renting', 'returned', 'completed'];
const amount = (rows, predicate = () => true) => rows.filter(predicate).reduce((sum, row) => sum + row.amount, 0);
const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

function periodBounds(period = 'month', now = new Date()) {
  const end = new Date(now);
  let start;
  if (period === 'week') {
    start = dayStart(now);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  } else if (period === 'quarter') start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  else if (period === 'year') start = new Date(now.getFullYear(), 0, 1);
  else start = new Date(now.getFullYear(), now.getMonth(), 1);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function buckets(period, start, end) {
  const entries = [];
  let cursor = new Date(start);
  while (cursor <= end && entries.length < 53) {
    let next = new Date(cursor);
    if (period === 'week') next.setDate(next.getDate() + 1);
    else if (period === 'month') next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    entries.push({ start: new Date(cursor), end: next, label: period === 'week' ? cursor.toLocaleDateString('vi-VN', { weekday: 'short' }) : period === 'month' ? `${cursor.getDate()}/${cursor.getMonth() + 1}` : `${cursor.getMonth() + 1}/${cursor.getFullYear()}` });
    cursor = next;
  }
  return entries;
}

export async function dashboard(role, period = 'month') {
  if (!['week', 'month', 'quarter', 'year'].includes(period)) period = 'month';
  const { start, end } = periodBounds(period);
  const [orders, payments, maintenance, roleCustomer] = await Promise.all([
    Order.find({ createdAt: { $gte: start, $lte: end } }).select('status createdAt rentalStartDate totalRentPrice').lean(),
    Payment.find({ status: 'success', paidAt: { $gte: start, $lte: end } }).select('transactionType amount paidAt').lean(),
    Dress.countDocuments({ status: 'maintenance' }),
    Role.findOne({ code: 'CUSTOMER' }).select('_id').lean(),
  ]);
  const members = roleCustomer ? await User.countDocuments({ roleId: roleCustomer._id, isActive: true }) : 0;
  const activeOrders = orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status));
  const recordedDeposits = activeOrders.length ? await Payment.distinct('orderId', {
    orderId: { $in: activeOrders.map((order) => order._id) }, transactionType: 'deposit_payment', status: 'success',
  }) : [];
  const recordedDepositIds = new Set(recordedDeposits.map(String));
  const today = dayStart(new Date());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const todayDeliveries = await Order.countDocuments({ rentalStartDate: { $gte: today, $lt: tomorrow }, status: { $in: ['deposit_paid', 'preparing', 'delivered'] } });
  const chart = buckets(period, start, end).map((bucket) => ({
    label: bucket.label,
    orders: orders.filter((order) => order.createdAt >= bucket.start && order.createdAt < bucket.end).length,
    completed: orders.filter((order) => order.createdAt >= bucket.start && order.createdAt < bucket.end && order.status === 'completed').length,
    revenue: amount(payments, (payment) => payment.paidAt >= bucket.start && payment.paidAt < bucket.end && REVENUE_TYPES.includes(payment.transactionType)),
    orderValue: orders.filter((order) => order.createdAt >= bucket.start && order.createdAt < bucket.end && ACTIVE_ORDER_STATUSES.includes(order.status)).reduce((sum, order) => sum + order.totalRentPrice, 0),
  }));
  return {
    period, totalOrders: orders.length, completedOrders: orders.filter((item) => item.status === 'completed').length,
    todayDeliveries, maintenance, members,
    revenue: amount(payments, (payment) => REVENUE_TYPES.includes(payment.transactionType)),
    orderValue: activeOrders.reduce((sum, order) => sum + order.totalRentPrice, 0),
    ordersMissingDepositTransaction: activeOrders.filter((order) => !recordedDepositIds.has(String(order._id))).length,
    chart,
  };
}

export async function revenueReport(period = 'month') {
  if (!['week', 'month', 'quarter', 'year'].includes(period)) period = 'month';
  const { start, end } = periodBounds(period);
  const [payments, successful, orders] = await Promise.all([
    Payment.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).limit(100).populate('orderId', 'orderCode items shippingAddress').populate('customerId', 'fullName').lean(),
    Payment.find({ status: 'success' }).select('transactionType amount paidAt').lean(),
    Order.find({ createdAt: { $gte: start, $lte: end } }).select('orderCode status totalRentPrice').lean(),
  ]);
  const activeOrders = orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status));
  const recordedDeposits = activeOrders.length ? await Payment.distinct('orderId', {
    orderId: { $in: activeOrders.map((order) => order._id) }, transactionType: 'deposit_payment', status: 'success',
  }) : [];
  const recordedDepositIds = new Set(recordedDeposits.map(String));
  const inPeriod = successful.filter((item) => item.paidAt >= start && item.paidAt <= end);
  const depositsHeld = amount(successful, (item) => item.transactionType === 'deposit_payment') - amount(successful, (item) => item.transactionType === 'deposit_refund');
  const chart = buckets(period, start, end).map((bucket) => ({
    label: bucket.label,
    revenue: amount(inPeriod, (payment) => payment.paidAt >= bucket.start && payment.paidAt < bucket.end && REVENUE_TYPES.includes(payment.transactionType)),
  }));
  return {
    period, revenue: amount(inPeriod, (item) => REVENUE_TYPES.includes(item.transactionType)),
    rentalRevenue: amount(inPeriod, (item) => item.transactionType === 'rental_payment'),
    depositsHeld: Math.max(0, depositsHeld), orders: orders.length, chart,
    orderValue: activeOrders.reduce((sum, order) => sum + order.totalRentPrice, 0),
    ordersMissingDepositTransaction: activeOrders.filter((order) => !recordedDepositIds.has(String(order._id))).map((order) => order.orderCode),
    transactions: payments.map((item) => ({
      id: String(item._id), code: item.transactionCode || String(item._id).slice(-8).toUpperCase(),
      date: item.paidAt || item.createdAt, customer: item.customerId?.fullName || item.orderId?.shippingAddress?.recipientName || 'Khách vãng lai',
      orderCode: item.orderId?.orderCode || '', dress: item.orderId?.items?.[0]?.name || '',
      type: item.transactionType, amount: item.amount, method: item.method, status: item.status,
    })),
  };
}
