import jwt from 'jsonwebtoken';
import { User, Role } from '../models/index.js';
import { sendVerificationEmail, sendResetPasswordEmail } from '../utils/sendEmail.js';

// Sinh mã OTP 6 chữ số
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// Thời hạn hiệu lực của mã OTP: 3 phút (180 giây)
const OTP_EXPIRES_MS = 3 * 60 * 1000;

// Tạo JWT Token
const generateToken = (user, roleCode) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: roleCode,
    },
    process.env.JWT_SECRET || 'unibridal_jwt_secret_key_2026_wdp301',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

export const authService = {
  /**
   * Đăng ký tài khoản mới & gửi OTP xác thực email
   */
  async register({ fullName, email, password, phone }) {
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      const err = new Error('Họ và tên không hợp lệ. Vui lòng nhập tối thiểu 2 ký tự');
      err.statusCode = 400;
      throw err;
    }

    if (!email || typeof email !== 'string') {
      const err = new Error('Vui lòng cung cấp địa chỉ email');
      err.statusCode = 400;
      throw err;
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      const err = new Error('Địa chỉ email không đúng định dạng (Ví dụ: name@gmail.com)');
      err.statusCode = 400;
      throw err;
    }

    if (!phone || typeof phone !== 'string') {
      const err = new Error('Vui lòng cung cấp số điện thoại liên hệ');
      err.statusCode = 400;
      throw err;
    }

    const cleanPhone = phone.replace(/[\s.-]/g, '');
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      const err = new Error('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84)');
      err.statusCode = 400;
      throw err;
    }

    if (!password || String(password).length < 6) {
      const err = new Error('Mật khẩu phải có tối thiểu 6 ký tự');
      err.statusCode = 400;
      throw err;
    }

    // 1. Kiểm tra tài khoản đã tồn tại chưa
    let existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser && existingUser.isEmailVerified) {
      const err = new Error('Email này đã được đăng ký tài khoản');
      err.statusCode = 400;
      throw err;
    }

    // 2. Lấy role CUSTOMER mặc định
    const customerRole = await Role.findOne({ code: 'CUSTOMER' });
    if (!customerRole) {
      const err = new Error('Không tìm thấy vai trò khách hàng trong hệ thống');
      err.statusCode = 500;
      throw err;
    }

    // 3. Sinh OTP 6 số (hết hạn sau 60 giây)
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + OTP_EXPIRES_MS);

    if (existingUser && !existingUser.isEmailVerified) {
      // Cập nhật thông tin và cấp lại OTP
      existingUser.fullName = fullName.trim();
      existingUser.phone = cleanPhone;
      existingUser.password = password;
      existingUser.emailVerificationOtp = otp;
      existingUser.emailVerificationExpires = otpExpires;
      await existingUser.save();
    } else {
      existingUser = await User.create({
        fullName: fullName.trim(),
        email: cleanEmail,
        password,
        phone: cleanPhone,
        roleId: customerRole._id,
        isEmailVerified: false,
        emailVerificationOtp: otp,
        emailVerificationExpires: otpExpires,
      });
    }

    // 4. Gửi email xác thực
    const emailResult = await sendVerificationEmail(cleanEmail, otp, fullName.trim());
    const isRealEmailSent = !emailResult?.simulated && !emailResult?.error;

    return {
      email: cleanEmail,
      fullName: fullName.trim(),
      devOtp: !isRealEmailSent ? otp : undefined,
      isRealEmailSent,
      message: isRealEmailSent
        ? `Mã xác thực OTP đã được gửi tới email ${cleanEmail}. Vui lòng kiểm tra hộp thư.`
        : `Mã xác thực OTP đã được tạo cho ${cleanEmail}. Vui lòng nhập mã để kích hoạt.`,
    };
  },

  /**
   * Xác thực mã OTP để kích hoạt tài khoản
   */
  async verifyEmailOtp({ email, otp }) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).populate('roleId');

    if (!user) {
      const err = new Error('Tài khoản không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    if (user.isEmailVerified) {
      const roleCode = user.roleId?.code || 'CUSTOMER';
      const token = generateToken(user, roleCode);
      return { user, token, message: 'Tài khoản đã được kích hoạt trước đó' };
    }

    if (!user.emailVerificationOtp || user.emailVerificationOtp !== String(otp).trim()) {
      const err = new Error('Mã OTP không chính xác');
      err.statusCode = 400;
      throw err;
    }

    if (new Date() > new Date(user.emailVerificationExpires)) {
      const err = new Error('Mã OTP đã hết hiệu lực. Vui lòng bấm gửi lại mã mới');
      err.statusCode = 400;
      throw err;
    }

    // Kích hoạt tài khoản
    user.isEmailVerified = true;
    user.emailVerificationOtp = null;
    user.emailVerificationExpires = null;
    await user.save();

    const roleCode = user.roleId?.code || 'CUSTOMER';
    const token = generateToken(user, roleCode);

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: roleCode.toLowerCase(),
        roleId: user.roleId,
      },
      token,
      message: 'Kích hoạt tài khoản thành công',
    };
  },

  /**
   * Gửi lại mã OTP xác thực email
   */
  async resendVerificationOtp(email) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const err = new Error('Không tìm thấy tài khoản với email này');
      err.statusCode = 404;
      throw err;
    }

    if (user.isEmailVerified) {
      const err = new Error('Tài khoản này đã được kích hoạt');
      err.statusCode = 400;
      throw err;
    }

    const otp = generateOtp();
    user.emailVerificationOtp = otp;
    user.emailVerificationExpires = new Date(Date.now() + OTP_EXPIRES_MS);
    await user.save();

    const emailResult = await sendVerificationEmail(cleanEmail, otp, user.fullName);
    const isRealEmailSent = !emailResult?.simulated && !emailResult?.error;

    return {
      email: cleanEmail,
      devOtp: !isRealEmailSent ? otp : undefined,
      isRealEmailSent,
      message: isRealEmailSent
        ? 'Đã gửi lại mã OTP xác thực mới qua email.'
        : `Mã OTP mới của bạn là: ${otp}`,
    };
  },

  /**
   * Đăng nhập người dùng
   */
  async login({ email, password }) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password').populate('roleId');

    if (!user) {
      const err = new Error('Email hoặc mật khẩu không chính xác');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Email hoặc mật khẩu không chính xác');
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
      err.statusCode = 403;
      throw err;
    }

    // Kiểm tra đã xác thực email chưa
    if (!user.isEmailVerified) {
      // Tự động sinh OTP mới gửi cho khách nếu chưa xác thực
      const otp = generateOtp();
      user.emailVerificationOtp = otp;
      user.emailVerificationExpires = new Date(Date.now() + OTP_EXPIRES_MS);
      await user.save();
      await sendVerificationEmail(cleanEmail, otp, user.fullName);

      const err = new Error('Tài khoản chưa được kích hoạt email. Chúng tôi đã gửi mã OTP mới về email của bạn.');
      err.statusCode = 403;
      err.code = 'EMAIL_NOT_VERIFIED';
      err.email = cleanEmail;
      throw err;
    }

    const roleCode = user.roleId?.code || 'CUSTOMER';
    const token = generateToken(user, roleCode);

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: roleCode.toLowerCase(),
        roleId: user.roleId,
        avatar: user.avatar,
        measurements: user.measurements,
        address: user.address,
      },
      token,
    };
  },

  /**
   * Yêu cầu đặt lại mật khẩu (Gửi OTP về email)
   */
  async forgotPassword(email) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const err = new Error('Không tìm thấy tài khoản với email này');
      err.statusCode = 404;
      throw err;
    }

    const otp = generateOtp();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = new Date(Date.now() + OTP_EXPIRES_MS);
    await user.save();

    const emailResult = await sendResetPasswordEmail(cleanEmail, otp, user.fullName);
    const isRealEmailSent = !emailResult?.simulated && !emailResult?.error;

    return {
      email: cleanEmail,
      devOtp: !isRealEmailSent ? otp : undefined,
      isRealEmailSent,
      message: isRealEmailSent
        ? 'Mã xác thực đặt lại mật khẩu đã được gửi đến email của bạn.'
        : `Mã OTP đặt lại mật khẩu của bạn là: ${otp}`,
    };
  },

  /**
   * Xác thực mã OTP đặt lại mật khẩu
   */
  async verifyResetOtp({ email, otp }) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const err = new Error('Tài khoản không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== String(otp).trim()) {
      const err = new Error('Mã OTP không chính xác');
      err.statusCode = 400;
      throw err;
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      const err = new Error('Mã OTP đã hết hiệu lực. Vui lòng bấm gửi lại mã mới');
      err.statusCode = 400;
      throw err;
    }

    return { message: 'Xác thực OTP thành công, bạn có thể nhập mật khẩu mới' };
  },

  /**
   * Thiết lập mật khẩu mới sau khi xác thực OTP
   */
  async resetPassword({ email, otp, newPassword }) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const err = new Error('Tài khoản không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== String(otp).trim()) {
      const err = new Error('Mã OTP không hợp lệ hoặc đã qua sử dụng');
      err.statusCode = 400;
      throw err;
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      const err = new Error('Mã OTP đã hết hiệu lực');
      err.statusCode = 400;
      throw err;
    }

    // Đổi mật khẩu
    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.' };
  },

  /**
   * Lấy thông tin tài khoản hiện tại
   */
  async getMe(userId) {
    const user = await User.findById(userId).populate({
      path: 'roleId',
      populate: { path: 'permissions' },
    });

    if (!user) {
      const err = new Error('Không tìm thấy thông tin người dùng');
      err.statusCode = 404;
      throw err;
    }

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.roleId?.code?.toLowerCase() || 'customer',
      roleId: user.roleId,
      avatar: user.avatar,
      measurements: user.measurements,
      address: user.address,
      idCard: user.idCard,
      isEmailVerified: user.isEmailVerified,
    };
  },
};

