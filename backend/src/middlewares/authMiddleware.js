import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'unibridal_jwt_secret_key_2026_wdp301';

/**
 * Middleware xác thực Access Token (JWT)
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Lấy token từ Authorization Header (Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập. Vui lòng cung cấp token hợp lệ.',
      });
    }

    // Giải mã token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Tìm kiếm user trực tiếp từ Database (loại trừ mật khẩu)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản liên kết với token này không tồn tại.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
      });
    }

    // Gán thông tin người dùng vào request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn.',
    });
  }
};

/**
 * Middleware xác thực Access Token tùy chọn (nếu có thì gán req.user, không có thì cho qua)
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
    // Bỏ qua lỗi token đối với request không bắt buộc đăng nhập (guest checkout)
  }
  next();
};

/**
 * Middleware phân quyền theo Vai trò người dùng (Ví dụ: 'admin', 'staff', 'customer')
 * @param  {...string} allowedRoles - Danh sách các vai trò được phép
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập hoặc không tìm thấy thông tin tài khoản.',
      });
    }

    const userRole = (req.user.role || 'customer').toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    // Quản trị viên ADMIN luôn có toàn quyền
    if (userRole === 'admin' || normalizedAllowed.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Bạn không có quyền truy cập chức năng này (Yêu cầu vai trò: ${allowedRoles.join(', ')}).`,
    });
  };
};
