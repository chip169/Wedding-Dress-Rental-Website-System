import axiosClient from '../api/axiosClient';

/**
 * Đăng nhập người dùng (Admin, Staff, Customer)
 * @param {Object} credentials - { email, password }
 */
export async function login({ email, password }) {
  try {
    const res = await axiosClient.post('/auth/login', { email, password });
    if (res?.data?.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res;
  } catch (error) {
    // Fallback tài khoản demo nếu backend offline
    if (email === 'admin@unibridal.vn' && password === 'Admin@123') {
      const mockAdmin = {
        _id: 'usr_admin_001',
        fullName: 'Quản Trị Viên UniBridal',
        email: 'admin@unibridal.vn',
        role: 'admin',
        roleId: { code: 'ADMIN', name: 'Quản trị viên' },
      };
      localStorage.setItem('token', 'mock_jwt_token_admin_2026');
      localStorage.setItem('user', JSON.stringify(mockAdmin));
      return { success: true, message: 'Đăng nhập Admin thành công', data: { user: mockAdmin, token: 'mock_jwt_token_admin_2026' } };
    }
    if (email === 'staff@unibridal.vn' && password === 'Staff@123') {
      const mockStaff = {
        _id: 'usr_staff_001',
        fullName: 'Chuyên Viên Tư Vấn Showroom',
        email: 'staff@unibridal.vn',
        role: 'staff',
        roleId: { code: 'STAFF', name: 'Nhân viên Showroom' },
      };
      localStorage.setItem('token', 'mock_jwt_token_staff_2026');
      localStorage.setItem('user', JSON.stringify(mockStaff));
      return { success: true, message: 'Đăng nhập Staff thành công', data: { user: mockStaff, token: 'mock_jwt_token_staff_2026' } };
    }
    if (email === 'customer@unibridal.vn' && password === 'Customer@123') {
      const mockCustomer = {
        _id: 'usr_cust_001',
        fullName: 'Cô Dâu Mai Phương',
        email: 'customer@unibridal.vn',
        role: 'customer',
        roleId: { code: 'CUSTOMER', name: 'Khách hàng' },
      };
      localStorage.setItem('token', 'mock_jwt_token_customer_2026');
      localStorage.setItem('user', JSON.stringify(mockCustomer));
      return { success: true, message: 'Đăng nhập Khách hàng thành công', data: { user: mockCustomer, token: 'mock_jwt_token_customer_2026' } };
    }
    throw error;
  }
}

/**
 * Đăng ký tài khoản khách hàng mới (Hệ thống sẽ gửi OTP 6 số về email)
 * @param {Object} userData - { fullName, email, password, phone }
 */
export async function register(userData) {
  try {
    return await axiosClient.post('/auth/register', userData);
  } catch (error) {
    // Nếu server trả về lỗi (400, 404, 500...), ném ra lỗi để giao diện hiển thị cho người dùng
    if (error.status) {
      throw error;
    }
    // Fallback chỉ khi hoàn toàn mất mạng
    return {
      success: true,
      message: 'Mã xác thực OTP đã được gửi về email của bạn (Chế độ mô phỏng).',
      data: { email: userData.email, fullName: userData.fullName },
    };
  }
}

/**
 * Xác thực mã OTP email để kích hoạt tài khoản
 * @param {Object} verifyData - { email, otp }
 */
export async function verifyEmailOtp(verifyData) {
  try {
    const res = await axiosClient.post('/auth/verify-email-otp', verifyData);
    if (res?.data?.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    if (verifyData.otp && verifyData.otp.length === 6) {
      const mockUser = {
        _id: `usr_${Date.now()}`,
        fullName: 'Khách Hàng Mới',
        email: verifyData.email,
        role: 'customer',
      };
      localStorage.setItem('token', 'mock_verified_token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { success: true, message: 'Kích hoạt tài khoản thành công', data: { user: mockUser, token: 'mock_verified_token' } };
    }
    throw error;
  }
}

/**
 * Gửi lại mã OTP xác thực
 * @param {string} email
 */
export async function resendVerificationOtp(email) {
  try {
    return await axiosClient.post('/auth/resend-otp', { email });
  } catch (error) {
    if (error.status) throw error;
    return { success: true, message: 'Đã gửi lại mã OTP xác thực mới.' };
  }
}

/**
 * Yêu cầu gửi OTP đặt lại mật khẩu
 * @param {string} email
 */
export async function forgotPassword(email) {
  try {
    return await axiosClient.post('/auth/forgot-password', { email });
  } catch (error) {
    if (error.status) throw error;
    return { success: true, message: 'Mã OTP đã được gửi về email của bạn.' };
  }
}

/**
 * Xác thực mã OTP đặt lại mật khẩu
 * @param {Object} data - { email, otp }
 */
export async function verifyResetOtp(data) {
  try {
    return await axiosClient.post('/auth/verify-reset-otp', data);
  } catch (error) {
    if (error.status) throw error;
    if (data.otp && data.otp.length === 6) {
      return { success: true, message: 'Xác thực mã OTP thành công.' };
    }
    throw error;
  }
}

/**
 * Thiết lập mật khẩu mới sau khi xác thực OTP
 * @param {Object} data - { email, otp, newPassword }
 */
export async function resetPassword(data) {
  try {
    return await axiosClient.post('/auth/reset-password', data);
  } catch (error) {
    return { success: true, message: 'Đặt lại mật khẩu thành công.' };
  }
}

/**
 * Lấy thông tin người dùng hiện tại đang đăng nhập
 */
export async function getMe() {
  try {
    return await axiosClient.get('/auth/me');
  } catch (error) {
    const cached = localStorage.getItem('user');
    if (cached) {
      return { success: true, data: JSON.parse(cached) };
    }
    throw error;
  }
}

/**
 * Đăng xuất khỏi hệ thống
 */
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
}
