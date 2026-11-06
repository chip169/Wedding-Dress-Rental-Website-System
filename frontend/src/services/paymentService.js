import axiosClient from '../api/axiosClient';

/**
 * Tầng Service giao tiếp API Thanh Toán VietQR
 */

/**
 * Tạo link mã VietQR động chuẩn NAPAS 24/7
 * @param {Object} data - { amount, orderCode, customerPhone }
 */
export async function generateVietQRApi(data) {
  try {
    const res = await axiosClient.post('/payment/vietqr/generate', data);
    return res.data?.data || res.data;
  } catch (error) {
    // Fallback offline nếu server không kết nối
    const { amount = 0, orderCode = '', customerPhone = '' } = data || {};
    const transferContent = `UB COC ${orderCode.replace(/[^a-zA-Z0-9]/g, '')} ${customerPhone.replace(/\s/g, '')}`.trim();
    return {
      qrImageUrl: `https://img.vietqr.io/image/TCB-19038899220088-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=CONG%20TY%20TNHH%20UNIBRIDAL`,
      bankId: 'TCB',
      bankName: 'Techcombank (Ngân hàng TMCP Kỹ Thương Việt Nam)',
      accountNo: '19038899220088',
      accountName: 'CONG TY TNHH UNIBRIDAL',
      amount: Number(amount),
      transferContent,
    };
  }
}

/**
 * Mô phỏng thanh toán thử nghiệm VietQR (Sandbox Test Mode)
 * @param {Object} data - { orderId, orderCode, amount, senderName }
 */
export async function simulateVietQRPaymentApi(data) {
  try {
    const res = await axiosClient.post('/payment/vietqr/simulate', data);
    return res.data?.data || res.data;
  } catch (error) {
    // Fallback simulation nếu offline
    return {
      success: true,
      simulated: true,
      transactionCode: `FT26${Date.now().toString().slice(-8)}888`,
      message: 'Mô phỏng thanh toán VietQR thành công (Offline Mode)',
    };
  }
}

/**
 * Kiểm tra trạng thái thanh toán thời gian thực
 * @param {string} orderCode
 */
export async function checkPaymentStatusApi(orderCode) {
  try {
    const res = await axiosClient.get(`/payment/check-status/${orderCode}`);
    return res.data?.data || res.data;
  } catch (error) {
    return { paid: false, status: 'pending' };
  }
}

