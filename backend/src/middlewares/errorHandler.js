/**
 * Middleware bắt lỗi tập trung (Centralized Error Handler)
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  // Xử lý lỗi trùng lặp MongoDB (Unique index)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Thông tin';
    return res.status(400).json({
      success: false,
      message: `${field} đã tồn tại trong hệ thống`,
    });
  }

  // Xử lý lỗi validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi phát sinh từ hệ thống server',
    ...(err.code && { code: err.code }),
    ...(err.email && { email: err.email }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

