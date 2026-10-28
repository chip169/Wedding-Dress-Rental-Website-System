import { authService } from '../services/auth.service.js';

export const authController = {
  /**
   * Đăng ký tài khoản
   */
  async register(req, res, next) {
    try {
      const { fullName, email, password, phone } = req.body;
      if (!fullName || !email || !password || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ họ tên, email, mật khẩu và số điện thoại',
        });
      }

      const result = await authService.register({ fullName, email, password, phone });
      return res.status(201).json({
        success: true,
        message: result.message,
        data: {
          email: result.email,
          fullName: result.fullName,
          devOtp: result.devOtp,
          isRealEmailSent: result.isRealEmailSent,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Xác thực mã OTP email
   */
  async verifyEmailOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp email và mã OTP 6 chữ số',
        });
      }

      const result = await authService.verifyEmailOtp({ email, otp });
      return res.status(200).json({
        success: true,
        message: result.message,
        data: { user: result.user, token: result.token },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Gửi lại mã OTP xác thực
   */
  async resendOtp(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp địa chỉ email',
        });
      }

      const result = await authService.resendVerificationOtp(email);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          email: result.email,
          devOtp: result.devOtp,
          isRealEmailSent: result.isRealEmailSent,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Đăng nhập
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập email và mật khẩu',
        });
      }

      const result = await authService.login({ email, password });
      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Quên mật khẩu - gửi OTP
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp email tài khoản',
        });
      }

      const result = await authService.forgotPassword(email);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          email: result.email,
          devOtp: result.devOtp,
          isRealEmailSent: result.isRealEmailSent,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Kiểm tra OTP đặt lại mật khẩu
   */
  async verifyResetOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp email và mã OTP',
        });
      }

      const result = await authService.verifyResetOtp({ email, otp });
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Thiết lập lại mật khẩu mới
   */
  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ email, mã OTP và mật khẩu mới',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có tối thiểu 6 ký tự',
        });
      }

      const result = await authService.resetPassword({ email, otp, newPassword });
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lấy thông tin tài khoản hiện tại
   */
  async getMe(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await authService.getMe(userId);
      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin tài khoản thành công',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};

