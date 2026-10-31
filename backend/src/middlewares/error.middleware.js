export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.status || (error.code === 11000 || error.name === 'ValidationError' ? 400 : 500);
  const message = status === 500 ? 'Hệ thống gặp lỗi. Vui lòng thử lại sau.' : error.message;
  if (status === 500) console.error('API error:', error);
  return res.status(status).json({ success: false, message });
}
