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
    console.error('Login error:', error);
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
    console.error('Register error:', error);
    throw error;
  }
}

/**
 * Helper tương thích với code của nhóm
 */
export const loginAccount = async (email, password) => (await axiosClient.post('/auth/login', { email, password })).data;
export const registerAccount = async (payload) => (await axiosClient.post('/auth/register', payload)).data;

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
    throw error;
  }
}

/**
 * Gửi lại mã OTP xác thực
 * @param {string} email
 */
export async function resendVerificationOtp(email) {
  return await axiosClient.post('/auth/resend-otp', { email });
}

/**
 * Yêu cầu gửi OTP đặt lại mật khẩu
 * @param {string} email
 */
export async function forgotPassword(email) {
  return await axiosClient.post('/auth/forgot-password', { email });
}

/**
 * Xác thực mã OTP đặt lại mật khẩu
 * @param {Object} data - { email, otp }
 */
export async function verifyResetOtp(data) {
  return await axiosClient.post('/auth/verify-reset-otp', data);
}

/**
 * Thiết lập mật khẩu mới sau khi xác thực OTP
 * @param {Object} data - { email, otp, newPassword }
 */
export async function resetPassword(data) {
  return await axiosClient.post('/auth/reset-password', data);
}

/**
 * Lấy thông tin người dùng hiện tại đang đăng nhập
 */
export async function getMe() {
  return await axiosClient.get('/auth/me');
}

/**
 * Đăng xuất khỏi hệ thống
 */
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
}
