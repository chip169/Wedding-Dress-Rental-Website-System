import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { register as apiRegister, verifyEmailOtp, resendVerificationOtp } from '../../services/authService';
import { Sparkles, Lock, Mail, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Logo from '../../components/common/Logo';

// Icons using lucide-react
const SparkleIcon = () => <Sparkles size={12} fill="currentColor" stroke="none" />;
const FootnoteLockIcon = () => <Lock size={13} strokeWidth={1.3} color="#7A6663" />;
const MailIcon = () => <Mail size={16} strokeWidth={1.8} color="#7A6663" />;
const PhoneIcon = () => <Phone size={16} strokeWidth={1.8} color="#7A6663" />;
const EyeIcon = ({ visible }) => (
  visible ? <Eye size={16} strokeWidth={1.8} color="#7A6663" /> : <EyeOff size={16} strokeWidth={1.8} color="#7A6663" />
);
const ArrowBackIcon = () => <ArrowLeft size={14} strokeWidth={2} />;

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuth } = useAuth();

  // Multi-step states: 1 = Register Form, 2 = Verify Email OTP, 3 = Success
  const [step, setStep] = useState(() => location.state?.step || 1);
  const [email, setEmail] = useState(() => location.state?.verifyEmail || '');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // OTP & Feedback states
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(() => location.state?.verifyEmail ? 'Tài khoản chưa kích hoạt. Mã OTP mới đã được gửi về email của bạn.' : '');
  const [countdown, setCountdown] = useState(60); // Đếm ngược gửi lại mã: 60s
  const [canResend, setCanResend] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(180); // Hiệu lực mã OTP: 3 phút (180s)

  const otpInputRefs = useRef([]);

  // Hàm định dạng thời gian mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  // Hàm validate số điện thoại di động Việt Nam
  const validatePhone = (val) => {
    const clean = (val || '').replace(/[\s.-]/g, '');
    if (!clean) return 'Vui lòng nhập số điện thoại liên hệ.';
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(clean)) {
      return 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84).';
    }
    return '';
  };

  // Hàm validate email / gmail
  const validateEmail = (val) => {
    const clean = (val || '').trim().toLowerCase();
    if (!clean) return 'Vui lòng nhập địa chỉ Email.';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(clean)) {
      return 'Địa chỉ Email không đúng định dạng (Ví dụ: name@gmail.com).';
    }
    return '';
  };

  // Countdown cho việc gửi lại mã (60s)
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Countdown thời hạn hiệu lực của mã OTP (3 phút = 180s)
  useEffect(() => {
    let timer;
    if (step === 2 && otpExpiresIn > 0) {
      timer = setInterval(() => {
        setOtpExpiresIn((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpExpiresIn]);

  // Evaluate password strength (0 to 4)
  const getPasswordStrength = (pass) => {
    if (!pass) return { level: 0, text: 'Chưa nhập' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { level: 1, text: 'Yếu' };
    if (score === 2) return { level: 2, text: 'Trung bình' };
    if (score === 3) return { level: 3, text: 'Tốt' };
    return { level: 4, text: 'Rất mạnh' };
  };

  const strength = getPasswordStrength(password);

  // Xử lý gửi form đăng ký (Step 1)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // 1. Validate Họ và tên
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Vui lòng nhập họ và tên của bạn (tối thiểu 2 ký tự).');
      return;
    }

    // 2. Validate Số điện thoại
    const pErr = validatePhone(phone);
    if (pErr) {
      setError(pErr);
      setPhoneError(pErr);
      return;
    }
    setPhoneError('');

    // 3. Validate Gmail / Email
    const eErr = validateEmail(email);
    if (eErr) {
      setError(eErr);
      setEmailError(eErr);
      return;
    }
    setEmailError('');

    // 4. Validate Mật khẩu
    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
      return;
    }
    if (!agreedToTerms) {
      setError('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.');
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/[\s.-]/g, '');
      const cleanEmail = email.trim().toLowerCase();
      const res = await apiRegister({ fullName: fullName.trim(), phone: cleanPhone, email: cleanEmail, password });
      setIsLoading(false);
      setStep(2);
      setCountdown(60);
      setOtpExpiresIn(180);
      setCanResend(false);
      if (res?.data?.devOtp) {
        setDevOtp(res.data.devOtp);
      }
      setSuccessMsg(res.message || 'Mã xác thực 6 số đã được gửi tới email của bạn.');
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  // Xử lý khi nhập từng ô OTP (Step 2)
  const handleOtpChange = (index, val) => {
    if (val && !/^\d+$/.test(val)) return;
    const next = [...otp];
    next[index] = val ? val.slice(-1) : '';
    setOtp(next);

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (paste.length > 0) {
      const arr = paste.slice(0, 6).split('');
      while (arr.length < 6) arr.push('');
      setOtp(arr);
      const focusIndex = Math.min(paste.length, 5);
      otpInputRefs.current[focusIndex]?.focus();
    }
  };

  // Xử lý xác thực OTP (Step 2)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpExpiresIn === 0) {
      setError('Mã OTP đã hết hiệu lực (sau 3 phút). Vui lòng bấm "Gửi lại mã OTP mới" bên dưới.');
      return;
    }
    const cleanOtp = Array.isArray(otp) ? otp.join('').trim() : String(otp).trim();
    if (cleanOtp.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã xác thực OTP.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await verifyEmailOtp({ email: email.trim().toLowerCase(), otp: cleanOtp });
      setIsLoading(false);
      if (res?.data?.user && res?.data?.token) {
        setAuth(res.data.user, res.data.token);
      }
      setStep(3);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hiệu lực.');
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await resendVerificationOtp(email.trim().toLowerCase());
      setIsLoading(false);
      setCountdown(60);
      setOtpExpiresIn(180);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      if (res?.data?.devOtp) {
        setDevOtp(res.data.devOtp);
      }
      setSuccessMsg(res.message || 'Đã gửi lại mã OTP mới về email của bạn.');
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Lỗi gửi lại mã OTP. Vui lòng thử lại.');
    }
  };

  return (
    <div className="ub-reg-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        .ub-reg-screen {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          max-height: 100vh;
          width: 100vw;
          background-color: #EFE7E3;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          box-sizing: border-box;
          padding: clamp(6px, 1.8vh, 18px) 24px;
          overflow: hidden;
        }

        .ub-reg-screen .ub-bg-glow {
          position: absolute;
          width: 550px;
          height: 550px;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(100px);
          opacity: 0.6;
        }
        .ub-reg-screen .ub-bg-glow--left {
          top: -150px;
          left: 5%;
          background: radial-gradient(circle, rgba(255, 218, 222, 0.7) 0%, rgba(255, 238, 230, 0) 70%);
        }
        .ub-reg-screen .ub-bg-glow--right {
          bottom: -150px;
          right: 5%;
          background: radial-gradient(circle, rgba(245, 220, 205, 0.6) 0%, rgba(255, 240, 235, 0) 70%);
        }

        .ub-reg-screen .ub-top-nav-bar {
          position: relative;
          z-index: 15;
          width: min(1152px, 94vw);
          max-width: 1152px;
          display: flex;
          align-items: center;
          margin-bottom: clamp(6px, 1.2vh, 12px);
        }

        .ub-reg-screen .ub-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 11.5px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #6E5A5D;
          cursor: pointer;
          padding: 6px 0;
          transition: all 0.2s ease;
        }
        .ub-reg-screen .ub-back-btn:hover {
          color: #854F55;
          transform: translateX(-3px);
        }

        .ub-reg-card {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: row;
          width: min(1152px, 94vw);
          max-width: 1152px;
          height: min(650px, calc(100vh - 56px));
          max-height: calc(100vh - 56px);
          min-height: 0;
          background: #FFFFFF;
          border-radius: 16px;
          box-shadow:
            0 30px 60px -15px rgba(105, 50, 58, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.9),
            0 4px 16px -2px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }

        .ub-reg-card .ub-panel-left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 50%;
          height: 100%;
          min-height: 0;
          padding: clamp(20px, 3.2vh, 40px) clamp(24px, 3.5vw, 48px);
          background: radial-gradient(130% 130% at 20% 15%, #FFF6F3 0%, #FCEAE4 55%, #F7DDD5 100%);
          overflow: hidden;
          box-sizing: border-box;
          animation: swapBrandToLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes swapBrandToLeft {
          0% {
            opacity: 0.2;
            transform: translateX(45px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .ub-reg-card .ub-aura {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(55px);
        }
        .ub-reg-card .ub-aura--top {
          top: -70px;
          left: -70px;
          width: 320px;
          height: 320px;
          background: rgba(255, 215, 220, 0.55);
        }
        .ub-reg-card .ub-aura--center {
          top: 35%;
          left: 20%;
          width: 280px;
          height: 280px;
          background: rgba(255, 240, 230, 0.5);
        }
        .ub-reg-card .ub-aura--bottom {
          bottom: -80px;
          right: -80px;
          width: 340px;
          height: 340px;
          background: rgba(245, 222, 208, 0.65);
        }

        .ub-reg-card .ub-top-chips {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
        }

        .ub-reg-card .ub-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 9999px;
          user-select: none;
          transition: transform 0.2s ease;
        }
        .ub-reg-card .ub-chip:hover {
          transform: translateY(-1px);
        }

        .ub-reg-card .ub-chip--white {
          padding: 7px 16px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(133, 79, 85, 0.12);
          box-shadow: 0 2px 8px rgba(100, 55, 60, 0.06);
          backdrop-filter: blur(8px);
        }

        .ub-reg-card .ub-chip__icon {
          display: flex;
          align-items: center;
          color: #854F55;
        }

        .ub-reg-card .ub-chip__text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          line-height: 14px;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          color: #854F55;
          white-space: nowrap;
        }

        .ub-reg-card .ub-brand-center {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-top: -8px;
        }

        .ub-reg-card .ub-emblem-card {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(100px, 13vh, 134px);
          height: clamp(92px, 12vh, 124px);
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            0 16px 36px -8px rgba(133, 79, 85, 0.16),
            0 4px 12px rgba(0, 0, 0, 0.03);
          margin-bottom: clamp(10px, 1.8vh, 20px);
          padding: 12px;
          box-sizing: border-box;
          transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease;
        }
        .ub-reg-card .ub-emblem-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 20px 42px -6px rgba(133, 79, 85, 0.22),
            0 6px 16px rgba(0, 0, 0, 0.05);
        }

        .ub-reg-card .ub-emblem-inner-glow {
          position: absolute;
          inset: 2px;
          border-radius: 20px;
          border: 1px solid rgba(133, 79, 85, 0.06);
          pointer-events: none;
        }

        .ub-reg-card .ub-emblem-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(133, 79, 85, 0.08));
        }

        .ub-reg-card .ub-brand-title {
          font-family: 'Cinzel', 'Playfair Display', serif;
          font-weight: 500;
          font-size: clamp(26px, 3.8vh, 36px);
          line-height: 1.2;
          letter-spacing: clamp(5px, 0.8vw, 8px);
          text-transform: uppercase;
          color: #1E1617;
          margin: 0;
          text-align: center;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.04));
        }

        .ub-reg-card .ub-brand-subtitle-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
        }

        .ub-reg-card .ub-dash-line {
          width: 28px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(133, 79, 85, 0.4), transparent);
        }

        .ub-reg-card .ub-brand-subtitle {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 13px;
          line-height: 18px;
          letter-spacing: 4.2px;
          text-transform: uppercase;
          color: #854F55;
        }

        .ub-reg-card .ub-brand-tagline {
          font-family: 'Cormorant Garamond', 'Playfair Display', serif;
          font-style: italic;
          font-size: 13px;
          line-height: 18px;
          letter-spacing: 0.8px;
          color: #8E6D72;
          margin: 8px 0 0;
          text-align: center;
          opacity: 0.9;
        }

        .ub-reg-card .ub-footer-row {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding-top: 8px;
        }

        .ub-reg-card .ub-security-badge {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .ub-reg-card .ub-security-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 400;
          font-size: 12px;
          line-height: 16px;
          letter-spacing: 0.1px;
          color: #6E5A56;
        }

        .ub-reg-card .ub-est-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ub-reg-card .ub-est-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #A0827E;
        }

        .ub-reg-card .ub-est-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          line-height: 16px;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: #6E5A56;
        }

        .ub-reg-card .ub-panel-right {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 50%;
          height: 100%;
          min-height: 0;
          padding: clamp(16px, 2.8vh, 32px) clamp(24px, 3.5vw, 48px);
          background: #FFFFFF;
          box-sizing: border-box;
          overflow-y: auto;
          animation: swapFormToRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes swapFormToRight {
          0% {
            opacity: 0.2;
            transform: translateX(-45px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .ub-reg-form-container {
          display: flex;
          flex-direction: column;
          width: 480px;
          max-width: 480px;
        }

        .ub-reg-form-container .ub-header-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: clamp(8px, 1.6vh, 16px);
        }

        .ub-reg-form-container .ub-form-overhead {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          line-height: 14px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #854F55;
          margin-bottom: 4px;
        }

        .ub-reg-form-container .ub-form-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 500;
          font-size: clamp(24px, 3.2vh, 30px);
          line-height: 1.2;
          color: #1C1415;
          margin: 0 0 4px;
          letter-spacing: -0.2px;
        }

        .ub-form-description {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          line-height: 16px;
          color: #6E5A5D;
          margin: 0;
          text-align: center;
          max-width: 430px;
        }

        .ub-reg-form-container .ub-form {
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 1.4vh, 12px);
          width: 100%;
        }

        .ub-form-row {
          display: flex;
          flex-direction: row;
          gap: 12px;
          width: 100%;
        }

        .ub-form-row .ub-field-group {
          flex: 1;
        }

        .ub-reg-form-container .ub-field-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }

        .ub-reg-form-container .ub-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          line-height: 14px;
          letter-spacing: 0.4px;
          color: #4D3F41;
        }

        .ub-required-star {
          color: #B8737D;
          font-weight: bold;
        }

        .ub-reg-form-container .ub-input-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          height: clamp(38px, 4.6vh, 42px);
          background: #FDF3EF;
          border: 1px solid rgba(133, 79, 85, 0.12);
          border-radius: 6px;
          box-sizing: border-box;
          transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .ub-reg-form-container .ub-input-box:focus-within {
          background: #FFFFFF;
          border-color: #C28288;
          box-shadow: 0 0 0 3.5px rgba(194, 130, 136, 0.15);
        }

        .ub-reg-form-container .ub-input {
          width: 100%;
          height: 100%;
          padding: 11px 40px 11px 14px;
          background: transparent;
          border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13.5px;
          line-height: 18px;
          color: #1C1415;
          outline: none;
          box-sizing: border-box;
        }

        .ub-reg-form-container .ub-input--no-icon {
          padding-right: 14px;
        }

        .ub-reg-form-container .ub-input::placeholder {
          color: rgba(81, 67, 68, 0.40);
          font-size: 13px;
        }

        .ub-input-icon--right {
          position: absolute;
          right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .ub-reg-form-container .ub-eye-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          opacity: 0.75;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .ub-reg-form-container .ub-eye-toggle:hover {
          opacity: 1;
          transform: translateY(-50%) scale(1.1);
        }

        .ub-strength-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: -2px;
          margin-bottom: 2px;
        }

        .ub-strength-bars {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ub-strength-bar {
          display: inline-block;
          width: 58px;
          height: 3.5px;
          border-radius: 2px;
          background: #EFE4E0;
          transition: background-color 0.25s ease;
        }

        .ub-strength-bar.is-active {
          background: #BD7B82;
        }

        .ub-strength-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          font-size: 11.5px;
          line-height: 14px;
          color: #6E5A5D;
        }

        .ub-terms-row {
          display: flex;
          align-items: flex-start;
          margin-top: 2px;
        }

        .ub-checkbox-label {
          display: inline-flex;
          align-items: flex-start;
          gap: 9px;
          cursor: pointer;
          user-select: none;
        }

        .ub-checkbox-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        .ub-custom-checkbox {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 17px;
          height: 17px;
          background: #64363F;
          border-radius: 4px;
          transition: all 0.18s ease;
          flex-shrink: 0;
          margin-top: 1px;
          box-shadow: 0 1px 3px rgba(100, 50, 60, 0.15);
        }

        .ub-checkbox-input:not(:checked) + .ub-custom-checkbox {
          background: #FDF3EF;
          border: 1.5px solid rgba(133, 79, 85, 0.35);
          box-shadow: none;
        }

        .ub-custom-checkbox::after {
          content: '';
          width: 8.5px;
          height: 4.8px;
          border-left: 2px solid #FFFFFF;
          border-bottom: 2px solid #FFFFFF;
          transform: rotate(-45deg) translateY(-0.8px);
          display: block;
          opacity: 1;
          transition: opacity 0.15s ease;
        }

        .ub-checkbox-input:not(:checked) + .ub-custom-checkbox::after {
          opacity: 0;
        }

        .ub-terms-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 400;
          font-size: 12px;
          line-height: 17px;
          color: #5A484A;
        }

        .ub-terms-link {
          color: #854F55;
          text-decoration: underline;
          text-underline-offset: 2.5px;
          transition: color 0.15s ease;
        }
        .ub-terms-link:hover {
          color: #5C2F35;
        }

        .ub-reg-form-container .ub-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: clamp(38px, 4.6vh, 44px);
          background: linear-gradient(135deg, #C58187 0%, #B36F75 100%);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 13px;
          line-height: 16px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 8px 22px -3px rgba(179, 111, 117, 0.42);
          transition: all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
          margin-top: 4px;
        }

        .ub-reg-form-container .ub-submit-btn:hover {
          background: linear-gradient(135deg, #BE787E 0%, #A96269 100%);
          box-shadow: 0 10px 26px -2px rgba(179, 111, 117, 0.52);
          transform: translateY(-1px);
        }

        .ub-reg-form-container .ub-submit-btn:active {
          transform: translateY(0) scale(0.99);
        }

        .ub-reg-form-container .ub-submit-btn__arrow {
          font-size: 15px;
          transition: transform 0.2s ease;
        }
        .ub-reg-form-container .ub-submit-btn:hover .ub-submit-btn__arrow {
          transform: translateX(3px);
        }

        .ub-reg-form-container .ub-bottom-link-row {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: clamp(8px, 1.6vh, 16px);
          padding-top: 8px;
          border-top: 1px solid rgba(133, 79, 85, 0.08);
          width: 100%;
        }

        .ub-prompt-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 400;
          font-size: 13px;
          line-height: 18px;
          color: #4D3F41;
        }

        .ub-login-link {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 13px;
          line-height: 18px;
          color: #854F55;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: all 0.15s ease;
        }
        .ub-login-link:hover {
          color: #5C2F35;
        }

        @media (max-width: 1200px) {
          .ub-reg-screen .ub-top-nav-bar {
            width: 100%;
          }
          .ub-reg-card {
            width: 100vw;
            border-radius: 0;
          }
        }

        @media (max-width: 880px) {
          .ub-reg-card .ub-panel-left {
            display: none;
          }
          .ub-reg-card .ub-panel-right {
            width: 100vw;
            padding: 32px 20px;
          }
          .ub-reg-form-container {
            width: 100%;
          }
          .ub-form-row {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>

      {/* Decorative ambient background blur lights */}
      <div className="ub-bg-glow ub-bg-glow--left" />
      <div className="ub-bg-glow ub-bg-glow--right" />

      {/* Top Navigation Back Button */}
      <div className="ub-top-nav-bar">
        <button
          type="button"
          className="ub-back-btn"
          onClick={() => navigate('/')}
          aria-label="Quay lại trang chủ"
        >
          <ArrowBackIcon />
          <span>QUAY LẠI</span>
        </button>
      </div>

      {/* Main Dual-Panel Luxury Card */}
      <div className="ub-reg-card">

        {/* ── LEFT PANEL: Brand Presentation ─────────────────────── */}
        <div className="ub-panel-left">
          {/* Subtle silk ambient blurs */}
          <div className="ub-aura ub-aura--top" />
          <div className="ub-aura ub-aura--center" />
          <div className="ub-aura ub-aura--bottom" />

          {/* Top Chips Row */}
          <div className="ub-top-chips">
            <div className="ub-chip ub-chip--white">
              <span className="ub-chip__icon">
                <SparkleIcon />
              </span>
              <span className="ub-chip__text">WEDDING DRESS RENTAL</span>
            </div>
          </div>

          {/* Center Brand Group */}
          <div className="ub-brand-center">
            {/* White Monogram Emblem Card */}
            <div className="ub-emblem-card">
              <div className="ub-emblem-inner-glow" />
              <Logo variant="emblem" className="ub-emblem-img" alt="UniBridal Emblem" />
            </div>

            {/* Haute Couture Typography */}
            <h1 className="ub-brand-title">UNIBRIDAL</h1>
            <div className="ub-brand-subtitle-wrap">
              <span className="ub-dash-line" />
              <span className="ub-brand-subtitle">HAUTE COUTURE</span>
              <span className="ub-dash-line" />
            </div>
            <p className="ub-brand-tagline">Atelier de Robes de Mariée & Sur-Mesure</p>
          </div>

          {/* Bottom Security & Est Footer */}
          <div className="ub-footer-row">
            <div className="ub-security-badge">
              <FootnoteLockIcon />
              <span className="ub-security-text">Bảo mật thông tin tuyệt đối</span>
            </div>
            <div className="ub-est-group">
              <span className="ub-est-dot" />
              <span className="ub-est-text">EST. 2026</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Registration Form ─────────────────────── */}
        <div className="ub-panel-right">
          <div className="ub-reg-form-container">

            {/* STEP 1: Registration Form */}
            {step === 1 && (
              <>
                <div className="ub-header-group">
                  <span className="ub-form-overhead">UNIBRIDAL HAUTE COUTURE</span>
                  <h2 className="ub-form-heading">Đăng Ký Tài Khoản</h2>
                  <p className="ub-form-description">
                    Tạo tài khoản để lưu giữ danh sách váy cưới mơ ước, đặt lịch thử váy riêng tư và nhận đặc quyền độc bản.
                  </p>
                </div>

                {error && (
                  <div style={{ background: '#FFF0F0', border: '1px solid #FFC2C2', color: '#D32F2F', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                    ⚠️ {error}
                  </div>
                )}

                <form className="ub-form" onSubmit={handleSubmit} id="register-form">

                  {/* Row 1: Full Name & Phone Number */}
                  <div className="ub-form-row">
                    <div className="ub-field-group">
                      <label className="ub-label" htmlFor="reg-fullname">
                        Họ và tên
                      </label>
                      <div className="ub-input-box">
                        <input
                          id="reg-fullname"
                          type="text"
                          className="ub-input ub-input--no-icon"
                          placeholder="Họ và tên của bạn"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="ub-field-group">
                      <label className="ub-label" htmlFor="reg-phone">
                        Số điện thoại <span className="ub-required-star">*</span>
                      </label>
                      <div className="ub-input-box">
                        <input
                          id="reg-phone"
                          type="tel"
                          className={`ub-input ${phoneError ? 'border-red-400' : ''}`}
                          placeholder="Số điện thoại di động"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (phoneError) setPhoneError(validatePhone(e.target.value));
                          }}
                          onBlur={(e) => setPhoneError(validatePhone(e.target.value))}
                          required
                        />
                        <span className="ub-input-icon ub-input-icon--right">
                          <PhoneIcon />
                        </span>
                      </div>
                      {phoneError && (
                        <div style={{ color: '#D32F2F', fontSize: '11.5px', marginTop: '4px', textAlign: 'left' }}>
                          ✕ {phoneError}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Email Address */}
                  <div className="ub-field-group">
                    <label className="ub-label" htmlFor="reg-email">
                      Địa chỉ Email / Gmail <span className="ub-required-star">*</span>
                    </label>
                    <div className="ub-input-box">
                      <input
                        id="reg-email"
                        type="email"
                        className={`ub-input ${emailError ? 'border-red-400' : ''}`}
                        placeholder="Địa chỉ Email chính thức"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError(validateEmail(e.target.value));
                        }}
                        onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                        required
                      />
                      <span className="ub-input-icon ub-input-icon--right">
                        <MailIcon />
                      </span>
                    </div>
                    {emailError && (
                      <div style={{ color: '#D32F2F', fontSize: '11.5px', marginTop: '4px', textAlign: 'left' }}>
                        ✕ {emailError}
                      </div>
                    )}
                  </div>

                  {/* Row 3: Password & Confirm Password */}
                  <div className="ub-form-row">
                    <div className="ub-field-group">
                      <label className="ub-label" htmlFor="reg-password">
                        Mật khẩu <span className="ub-required-star">*</span>
                      </label>
                      <div className="ub-input-box">
                        <input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          className="ub-input"
                          placeholder="Mật khẩu bảo mật"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="ub-eye-toggle"
                          id="toggle-reg-password"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          <EyeIcon visible={showPassword} />
                        </button>
                      </div>
                    </div>

                    <div className="ub-field-group">
                      <label className="ub-label" htmlFor="reg-confirm-password">
                        Xác nhận mật khẩu <span className="ub-required-star">*</span>
                      </label>
                      <div className="ub-input-box">
                        <input
                          id="reg-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="ub-input"
                          placeholder="Xác nhận lại mật khẩu"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="ub-eye-toggle"
                          id="toggle-reg-confirm-password"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          <EyeIcon visible={showConfirmPassword} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Indicator Row */}
                  <div className="ub-strength-row">
                    <div className="ub-strength-bars">
                      <span className={`ub-strength-bar ${strength.level >= 1 ? 'is-active' : ''}`} />
                      <span className={`ub-strength-bar ${strength.level >= 2 ? 'is-active' : ''}`} />
                      <span className={`ub-strength-bar ${strength.level >= 3 ? 'is-active' : ''}`} />
                      <span className={`ub-strength-bar ${strength.level >= 4 ? 'is-active' : ''}`} />
                    </div>
                    <span className="ub-strength-text">
                      Độ bảo mật: {strength.text}
                    </span>
                  </div>

                  {/* Terms and Policies Agreement */}
                  <div className="ub-terms-row">
                    <label className="ub-checkbox-label" htmlFor="reg-terms">
                      <input
                        id="reg-terms"
                        type="checkbox"
                        className="ub-checkbox-input"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        required
                      />
                      <span className="ub-custom-checkbox" />
                      <span className="ub-terms-text">
                        Tôi đồng ý với{' '}
                        <a href="/terms" className="ub-terms-link" onClick={(e) => e.preventDefault()}>
                          Điều khoản dịch vụ
                        </a>{' '}
                        và{' '}
                        <a href="/privacy" className="ub-terms-link" onClick={(e) => e.preventDefault()}>
                          Chính sách bảo mật
                        </a>{' '}
                        của UniBridal Haute Couture.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="ub-submit-btn" id="register-submit-btn">
                    <span className="ub-submit-btn__text">TẠO TÀI KHOẢN THÀNH VIÊN</span>
                    <span className="ub-submit-btn__arrow">→</span>
                  </button>
                </form>

              </>
            )}

            {/* STEP 2: Email OTP Verification */}
            {step === 2 && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                {/* Luxury Icon Badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: '#FFF5F4', border: '1px solid #F3DDDB', color: '#B8737D', marginBottom: '16px', boxShadow: '0 4px 14px rgba(184, 115, 125, 0.10)' }}>
                  <Mail size={24} strokeWidth={1.8} />
                </div>

                <div className="ub-header-group" style={{ marginBottom: '18px' }}>
                  <span className="ub-form-overhead">BẢO MẬT &amp; KÍCH HOẠT</span>
                  <h2 className="ub-form-heading" style={{ margin: '6px 0 8px' }}>Xác Thực Địa Chỉ Email</h2>
                  <p className="ub-form-description" style={{ maxWidth: '380px', margin: '0 auto', lineHeight: '1.5', fontSize: '13.5px' }}>
                    Mã xác thực gồm 6 chữ số đã được gửi tới:
                  </p>
                  <div style={{ display: 'inline-block', background: '#F8F1EE', color: '#733F49', padding: '4px 14px', borderRadius: '20px', fontWeight: 600, fontSize: '13px', marginTop: '6px', border: '1px solid #EADBDA' }}>
                    {email}
                  </div>
                </div>

                {devOtp && (
                  <div style={{ background: '#FFF9E6', border: '1px solid #FFE58F', color: '#D48806', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px', textAlign: 'left', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>🔔 [Môi trường thử nghiệm] Mã OTP kích hoạt:</div>
                    Mã OTP của bạn là: <strong style={{ fontSize: '18px', letterSpacing: '3px', color: '#AD4E00', background: '#FFF1B8', padding: '2px 8px', borderRadius: '4px' }}>{devOtp}</strong>
                    <div style={{ fontSize: '11.5px', color: '#874D00', marginTop: '6px' }}>
                      * Hệ thống chưa cấu hình EMAIL_USER &amp; EMAIL_PASS trong backend/.env nên mã hiển thị tại đây để bạn kiểm thử ngay.
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ background: '#FFF0F0', border: '1px solid #FFC2C2', color: '#D32F2F', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
                    ⚠️ {error}
                  </div>
                )}

                {successMsg && (
                  <div style={{ background: '#F0FFF4', border: '1px solid #B7EB8F', color: '#389E0D', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
                    ✓ {successMsg}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '0 4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#7A6663' }}>
                        NHẬP 6 CHỮ SỐ XÁC THỰC
                      </label>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: otpExpiresIn <= 30 ? (otpExpiresIn === 0 ? '#D32F2F' : '#E65100') : '#854F55', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>⏱️</span>
                        <span>
                          {otpExpiresIn > 0 ? `Hiệu lực: ${formatTime(otpExpiresIn)}` : 'Đã hết hạn!'}
                        </span>
                      </div>
                    </div>

                    {/* 6 Individual Digit Boxes */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onPaste={handleOtpPaste}>
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          placeholder={digit ? '' : '•'}
                          autoFocus={idx === 0}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          style={{
                            width: '48px',
                            height: '56px',
                            textAlign: 'center',
                            fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
                            fontVariantNumeric: 'tabular-nums',
                            fontSize: '24px',
                            fontWeight: 700,
                            background: digit ? '#FFFFFF' : '#FAF8F7',
                            border: digit ? '2px solid #854F55' : '1.5px solid #E5DCD8',
                            borderRadius: '12px',
                            color: '#2C2523',
                            outline: 'none',
                            boxShadow: digit ? '0 2px 8px rgba(133, 79, 85, 0.12)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      ))}
                    </div>

                    {/* Resend Timer right below boxes */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', color: '#7A6663', marginTop: '14px' }}>
                      <span>{otpExpiresIn === 0 ? 'Mã đã hết hạn?' : 'Chưa nhận được mã?'}</span>
                      <button
                        type="button"
                        disabled={!canResend || isLoading}
                        onClick={handleResendOtp}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: canResend ? '#854F55' : '#A39290',
                          cursor: canResend ? 'pointer' : 'not-allowed',
                          fontWeight: 700,
                          textDecoration: canResend ? 'underline' : 'none',
                          padding: 0,
                          fontSize: '13px',
                        }}
                      >
                        {canResend ? 'Gửi lại mã OTP mới' : `Gửi lại mã (${countdown}s)`}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpExpiresIn === 0}
                    className="ub-submit-btn"
                    style={{ width: '100%', cursor: (isLoading || otpExpiresIn === 0) ? 'not-allowed' : 'pointer', opacity: otpExpiresIn === 0 ? 0.6 : 1 }}
                  >
                    <span className="ub-submit-btn__text">
                      {isLoading ? 'ĐANG KÍCH HOẠT...' : otpExpiresIn === 0 ? 'MÃ ĐÃ HẾT HẠN - HÃY GỬI LẠI' : 'XÁC NHẬN & KÍCH HOẠT TÀI KHOẢN'}
                    </span>
                    <span className="ub-submit-btn__arrow">→</span>
                  </button>
                </form>

                {/* Back to Edit Registration Info */}
                <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #F0E6E8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#7A6663' }}>Nhập sai email hoặc thông tin?</span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#854F55',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Quay lại chỉnh sửa
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Success Screen */}
            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#F0FFF4', border: '2px solid #52C41A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#52C41A' }}>
                  <CheckCircle2 size={36} />
                </div>
                <span className="ub-form-overhead">XÁC THỰC THÀNH CÔNG</span>
                <h2 className="ub-form-heading" style={{ margin: '10px 0 14px' }}>Chào Mừng Nàng Đến UniBridal!</h2>
                <p className="ub-form-description" style={{ marginBottom: '28px' }}>
                  Tài khoản của nàng đã được kích hoạt hoàn tất. Hãy bắt đầu khám phá hơn 72 tuyệt tác váy cưới Haute Couture và đặt lịch thử váy riêng tư tại phòng fitting VIP.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/', { replace: true })}
                  className="ub-submit-btn"
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  <span className="ub-submit-btn__text">BẮT ĐẦU TRẢI NGHIỆM</span>
                  <span className="ub-submit-btn__arrow">→</span>
                </button>
              </div>
            )}

            {/* Bottom Login Prompt (Chỉ hiển thị tại Step 1) */}
            {step === 1 && (
              <div className="ub-bottom-link-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span className="ub-prompt-text">Bạn đã có tài khoản tại UniBridal?</span>
                <Link to="/login" className="ub-login-link" id="login-link">
                  Đăng nhập ngay
                </Link>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
