import * as paymentService from '../services/paymentService.js';

/**
 * Controller xử lý thanh toán VietQR
 */

export const generateVietQR = async (req, res, next) => {
  try {
    const data = paymentService.generateVietQR(req.body);
    return res.status(200).json({
      success: true,
      message: 'Tạo mã VietQR động thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const simulatePayment = async (req, res, next) => {
  try {
    const result = await paymentService.simulateVietQRPayment(req.body);
    return res.status(200).json({
      success: true,
      message: 'Mô phỏng thanh toán VietQR thành công',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const checkPaymentStatus = async (req, res, next) => {
  try {
    const result = await paymentService.checkPaymentStatus(req.params.orderCode);
    return res.status(200).json({
      success: true,
      message: 'Lấy trạng thái thanh toán thành công',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

