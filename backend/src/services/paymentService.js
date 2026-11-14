import Payment from '../models/paymentModel.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import { sendDepositSuccessEmail } from '../utils/sendEmail.js';

// Cấu hình tài khoản thụ hưởng mặc định của UniBridal
const VIETQR_CONFIG = {
  bankId: process.env.VIETQR_BANK_ID || 'TCB', // Techcombank
  bankName: 'Techcombank (Ngân hàng TMCP Kỹ Thương Việt Nam)',
  accountNo: process.env.VIETQR_ACCOUNT_NO || '19038899220088',
  accountName: process.env.VIETQR_ACCOUNT_NAME || 'CONG TY TNHH UNIBRIDAL',
  template: 'compact2',
};

/**
 * Sinh mã VietQR động theo chuẩn NAPAS 24/7
 * @param {Object} data - { amount, orderCode, customerPhone }
 */
export const generateVietQR = (data = {}) => {
  const { amount = 0, orderCode = '', customerPhone = '' } = data;
  const transferContent = `UB COC ${orderCode.replace(/[^a-zA-Z0-9]/g, '')} ${customerPhone.replace(/\s/g, '')}`.trim();
  const encodedContent = encodeURIComponent(transferContent);
  const encodedName = encodeURIComponent(VIETQR_CONFIG.accountName);

  const qrImageUrl = `https://img.vietqr.io/image/${VIETQR_CONFIG.bankId}-${VIETQR_CONFIG.accountNo}-${VIETQR_CONFIG.template}.png?amount=${amount}&addInfo=${encodedContent}&accountName=${encodedName}`;

  return {
    qrImageUrl,
    bankId: VIETQR_CONFIG.bankId,
    bankName: VIETQR_CONFIG.bankName,
    accountNo: VIETQR_CONFIG.accountNo,
    accountName: VIETQR_CONFIG.accountName,
    amount: Number(amount),
    transferContent,
  };
};

/**
 * Mô phỏng thanh toán thử VietQR thành công (Sandbox Simulator)
 * @param {Object} data - { orderId, orderCode, amount, transactionCode, senderName }
 */
export const simulateVietQRPayment = async (data = {}) => {
  const { orderId, orderCode, amount, senderName } = data;

  let order = null;
  if (orderId) {
    order = await Order.findById(orderId);
  } else if (orderCode) {
    order = await Order.findOne({ orderCode });
  }

  if (!order) {
    throw new Error('Không tìm thấy đơn hàng cần thanh toán.');
  }

  const generatedTxCode = `FT26${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;

  // Tạo bản ghi Payment
  const payment = new Payment({
    orderId: order._id,
    customerId: order.customerId || null,
    transactionType: 'deposit_payment',
    amount: Number(amount) || order.depositPaidAmount || order.totalDeposit,
    method: 'VIETQR',
    transactionCode: generatedTxCode,
    status: 'success',
    paidAt: new Date(),
  });
  await payment.save();

  // Cập nhật trạng thái đơn hàng sang deposit_paid
  order.status = 'deposit_paid';
  order.depositPaidAmount = payment.amount;
  await order.save();

  // Tự động kích hoạt gửi email thông báo đặt cọc thành công
  try {
    const targetEmail = order.customerEmail || order.email;
    if (targetEmail) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      sendDepositSuccessEmail({
        to: targetEmail,
        fullName: order.customerName || senderName || 'Quý cô dâu',
        orderCode: order.orderCode,
        contractCode: order.contractCode,
        items: order.items,
        rentalStartDate: order.rentalStartDate,
        rentalEndDate: order.rentalEndDate,
        rentalDays: order.rentalDays,
        totalRentPrice: order.totalRentPrice,
        totalDeposit: order.totalDeposit,
        depositPaidAmount: order.depositPaidAmount,
        remainingAmount: Math.max(0, order.totalPayment - order.depositPaidAmount),
        deliveryMethod: order.deliveryMethod,
        shippingAddress: order.shippingAddress,
        orderDetailUrl: `${clientUrl}/profile/orders`,
      }).catch((err) => console.error('[EMAIL VIETQR DEPOSIT SEND ERROR]', err.message));
    }
  } catch (err) {
    console.error('[SIMULATE PAYMENT EMAIL ERROR]', err.message);
  }

  return {
    success: true,
    message: 'Mô phỏng thanh toán VietQR thành công.',
    order,
    payment,
    transactionCode: generatedTxCode,
  };
};

/**
 * Kiểm tra trạng thái giao dịch của đơn hàng theo thời gian thực
 * @param {string} orderCode
 */
export const checkPaymentStatus = async (orderCode) => {
  const order = await Order.findOne({ orderCode }).lean();
  if (!order) {
    return { paid: false, status: 'not_found' };
  }

  const isPaid = order.status === 'deposit_paid' || order.status === 'delivered' || order.status === 'renting';
  return {
    paid: isPaid,
    status: order.status,
    depositPaidAmount: order.depositPaidAmount,
    orderCode: order.orderCode,
  };
};

