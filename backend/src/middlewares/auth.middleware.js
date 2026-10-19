import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Role from '../models/Role.model.js';
import Permission from '../models/Permission.model.js';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'unibridal_jwt_secret_key_2026_wdp301');

    // Tìm kiếm user và nạp thông tin Role kèm danh sách Permissions
    const user = await User.findById(decoded.id)
      .populate({
        path: 'roleId',
        populate: {
          path: 'permissions',
          model: 'Permission',
        },
      })
      .populate('customPermissions');

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
      error: error.message,
    });
  }
};

/**
 * Middleware phân quyền theo Role Code (Ví dụ: 'ADMIN', 'STAFF')
 * @param  {...string} allowedRoles - Danh sách các mã vai trò được phép
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roleId) {
      return res.status(403).json({
        success: false,
        message: 'Không tìm thấy vai trò của người dùng.',
      });
    }

    const userRoleCode = req.user.roleId.code;

    // Quản trị viên ADMIN luôn có toàn quyền
    if (userRoleCode === 'ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(userRoleCode)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập chức năng này (Yêu cầu vai trò: ${allowedRoles.join(', ')}).`,
      });
    }

    next();
  };
};

/**
 * Middleware phân quyền chi tiết theo Mã Quyền (Permission Code)
 * @param {string} requiredPermissionCode - Mã quyền (Ví dụ: 'DRESS_MANAGE', 'ORDER_INSPECT_RETURN')
 */
export const checkPermission = (requiredPermissionCode) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roleId) {
      return res.status(403).json({
        success: false,
        message: 'Không tìm thấy vai trò của người dùng.',
      });
    }

    const userRole = req.user.roleId;

    // Quản trị viên ADMIN mặc định có toàn bộ quyền
    if (userRole.code === 'ADMIN') {
      return next();
    }

    // Lấy danh sách các mã quyền từ Role
    const rolePermissions = userRole.permissions?.map((p) => p.code) || [];

    // Lấy thêm các quyền đặc cách (nếu có)
    const customPermissions = req.user.customPermissions?.map((p) => p.code) || [];

    const allUserPermissions = [...new Set([...rolePermissions, ...customPermissions])];

    if (!allUserPermissions.includes(requiredPermissionCode)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện thao tác này (${requiredPermissionCode}).`,
      });
    }

    next();
  };
};
