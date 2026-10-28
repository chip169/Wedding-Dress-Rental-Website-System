import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Crown,
  Heart,
  Home,
  Check
} from 'lucide-react';
import heroBrideImg from '../../assets/hero_bride.jpg';
import { forgotPassword as apiForgotPassword, verifyResetOtp, resetPassword } from '../../services/authService';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  // Multi-step states: 1 = Enter Gmail, 2 = Enter OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [countdown, setCountdown] = useState(60); // Đếm ngược gửi lại: 60s
  const [canResend, setCanResend] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(180); // Hiệu lực mã OTP: 3 phút (180s)

  const otpInputRefs = useRef([]);

  // Hàm định dạng thời gian mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  // Countdown timer cho việc gửi lại mã (60s)
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

  // Countdown timer cho thời hạn hiệu lực OTP (180s = 3 phút)
  useEffect(() => {
    let timer;
    if (step === 2 && otpExpiresIn > 0) {
      timer = setInterval(() => {
        setOtpExpiresIn((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpExpiresIn]);

  // General Back Handler: Goes to previous step, or back to login if at Step 1 or 4
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setFeedback({ type: '', text: '' });
    } else if (step === 3) {
      setStep(2);
      setFeedback({ type: '', text: '' });
    } else {
      navigate('/login');
    }
  };

  // Mask email for privacy
  const getMaskedEmail = (raw) => {
    if (!raw) return '***@gmail.com';
    const parts = raw.split('@');
    if (parts.length < 2) return raw;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
  };

  // Password strength logic
  const getStrength = (pass) => {
    if (!pass) return { score: 0, text: 'Chưa nhập', color: 'bg-neutral-200', textCol: 'text-neutral-400' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, text: 'Yếu', color: 'bg-amber-400', textCol: 'text-amber-600' };
      case 2:
        return { score: 2, text: 'Trung bình', color: 'bg-amber-500', textCol: 'text-amber-600' };
      case 3:
        return { score: 3, text: 'Tốt', color: 'bg-[#B8737D]', textCol: 'text-[#B8737D]' };
      case 4:
      default:
        return { score: 4, text: 'Rất an toàn', color: 'bg-emerald-600', textCol: 'text-emerald-600' };
    }
  };

  const strength = getStrength(newPassword);

  // STEP 1: Handle Send OTP via Gmail
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setFeedback({ type: 'error', text: 'Vui lòng nhập địa chỉ Gmail của bạn.' });
      return;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(cleanEmail)) {
      setFeedback({ type: 'error', text: 'Địa chỉ Gmail không đúng định dạng. Vui lòng kiểm tra lại.' });
      return;
    }

    setIsLoading(true);
    setFeedback({ type: '', text: '' });

    try {
      const res = await apiForgotPassword(cleanEmail);
      setIsLoading(false);
      setStep(2);
      setCountdown(60);
      setOtpExpiresIn(180);
      setCanResend(false);
      if (res?.data?.devOtp) {
        setDevOtp(res.data.devOtp);
      }
      setFeedback({
        type: 'success',
        text: res.message || `Mã bảo mật gồm 6 chữ số đã được gửi tới ${cleanEmail}.`,
      });
    } catch (err) {
      setIsLoading(false);
      setFeedback({
        type: 'error',
        text: err.message || 'Không tìm thấy tài khoản liên kết với địa chỉ email này.',
      });
    }
  };

  // STEP 2: Handle OTP input
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
    const paste = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(paste)) {
      const arr = paste.split('');
      setOtp(arr);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setIsLoading(true);
    try {
      const res = await apiForgotPassword(email.trim().toLowerCase());
      setIsLoading(false);
      setCountdown(60);
      setOtpExpiresIn(180);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      if (res?.data?.devOtp) {
        setDevOtp(res.data.devOtp);
      }
      setFeedback({ type: 'success', text: res.message || 'Đã gửi lại mã xác thực mới vào hộp thư của bạn.' });
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setIsLoading(false);
      setFeedback({ type: 'error', text: err.message || 'Lỗi gửi lại mã OTP.' });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpExpiresIn === 0) {
      setFeedback({ type: 'error', text: 'Mã OTP đã hết hiệu lực (sau 3 phút). Vui lòng bấm "Gửi lại mã" bên dưới.' });
      return;
    }
    const code = otp.join('');
    if (code.length < 6) {
      setFeedback({ type: 'error', text: 'Vui lòng nhập đủ 6 chữ số mã xác thực OTP.' });
      return;
    }

    setIsLoading(true);
    setFeedback({ type: '', text: '' });

    try {
      const res = await verifyResetOtp({ email: email.trim(), otp: code });
      setIsLoading(false);
      setStep(3);
      setFeedback({ type: 'success', text: res.message || 'Xác thực OTP thành công. Hãy thiết lập mật khẩu mới.' });
    } catch (err) {
      setIsLoading(false);
      setFeedback({ type: 'error', text: err.message || 'Mã OTP không chính xác hoặc đã hết hạn.' });
    }
  };

  // STEP 3: Handle Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setFeedback({ type: 'error', text: 'Mật khẩu phải có tối thiểu 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setIsLoading(true);
    setFeedback({ type: '', text: '' });

    try {
      const code = otp.join('');
      await resetPassword({ email: email.trim(), otp: code, newPassword });
      setIsLoading(false);
      setStep(4);
    } catch (err) {
      setIsLoading(false);
      setFeedback({ type: 'error', text: err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.' });
    }
  };

  return (
    <div className="h-screen max-h-screen w-full flex flex-col lg:flex-row bg-[#FAF8F5] text-[#2C2523] font-jakarta selection:bg-[#FCEEE9] selection:text-[#B8737D] relative overflow-hidden">
      
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: HIGH-FASHION EDITORIAL VISUAL (Visible on lg+)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-5/12 h-screen max-h-screen overflow-hidden bg-neutral-900 flex-col justify-between p-8 xl:p-12 text-white">
        {/* Background Wedding Dress Hero Image */}
        <img
          src={heroBrideImg}
          alt="UniBridal Haute Couture"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 scale-105 transition-transform duration-1000 ease-out hover:scale-100"
        />

        {/* Sophisticated Luxury Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/40 pointer-events-none" />

        {/* Top Header Section */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 group text-white/90 hover:text-white transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Crown className="w-5 h-5 text-[#E6DAC8]" />
            </div>
            <div>
              <span className="font-playfair font-semibold text-lg tracking-[3px] uppercase block leading-none">
                UniBridal
              </span>
              <span className="text-[10px] tracking-[2px] text-[#E6DAC8] uppercase font-light">
                Haute Couture Atelier
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-medium tracking-wider uppercase text-white/90">
            <Sparkles className="w-3.5 h-3.5 text-[#E6DAC8]" />
            <span>Dịch Vụ Thuê Cao Cấp</span>
          </div>
        </div>

        {/* Middle Editorial Quote */}
        <div className="relative z-10 my-auto py-4 xl:py-8 max-w-lg">
          <div className="w-12 h-[1px] bg-[#E6DAC8] mb-6" />
          <span className="text-[12px] font-medium tracking-[3px] uppercase text-[#E6DAC8] mb-3 block">
            Đẳng cấp thuê trang phục cưới Haute Couture
          </span>
          <h2 className="font-playfair text-3xl xl:text-4xl leading-tight font-normal mb-6 text-white drop-shadow-sm">
            Tuyệt tác váy cưới độc bản, <br />
            <span className="italic text-[#E6DAC8] font-light">
              trọn vẹn từng khoảnh khắc.
            </span>
          </h2>
          <p className="text-sm font-light leading-relaxed text-white/85 max-w-md">
            UniBridal tự hào là thương hiệu cho thuê váy cưới cao cấp uy tín hàng đầu, mang đến hơn 70+ thiết kế độc quyền với chất liệu ren Pháp thượng hạng, phom corset tôn dáng chuẩn mực và quy trình giặt hấp, kiểm định chuẩn bảo tàng sau mỗi lần sử dụng.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 pt-6 border-t border-white/15 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-[#E6DAC8]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Chất lượng Haute Couture</p>
              <p className="text-[11px] text-white/70">Ren Pháp &amp; pha lê đính kết thủ công</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#E6DAC8]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Uy tín dịch vụ 100%</p>
              <p className="text-[11px] text-white/70">Bảo chứng độ mới &amp; chỉnh sửa số đo</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: MODERN LUXURY INTERACTIVE RECOVERY FORM
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 xl:p-10 h-screen max-h-screen relative overflow-y-auto lg:overflow-hidden">
        {/* Soft Ambient Radial Lights */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-[rgba(184,115,125,0.06)] blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-[rgba(230,218,200,0.15)] blur-[80px] pointer-events-none" />

        {/* Top Action Bar (Mobile & Right Panel Header) */}
        <div className="flex items-center justify-between mb-4 xl:mb-6 relative z-10">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-xs font-semibold tracking-wider text-[#685355] hover:text-[#B8737D] border border-[#EADBDA] shadow-[0_2px_8px_rgba(184,115,125,0.06)] hover:shadow-md transition-all duration-200 cursor-pointer group select-none"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#B8737D] transition-transform group-hover:-translate-x-0.5" />
            <span>
              {step === 2
                ? 'QUAY LẠI BƯỚC 1'
                : step === 3
                ? 'QUAY LẠI BƯỚC 2'
                : 'VỀ ĐĂNG NHẬP'}
            </span>
          </button>

          {/* Mobile Brand Label */}
          <div className="lg:hidden flex items-center gap-2">
            <Crown className="w-4 h-4 text-[#B8737D]" />
            <span className="font-playfair font-semibold text-sm tracking-[2px] uppercase text-[#2C2523]">
              UniBridal
            </span>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white text-xs font-medium text-[#685355] hover:text-[#B8737D] border border-[#EADBDA] shadow-[0_2px_8px_rgba(184,115,125,0.06)] hover:shadow-md transition-all duration-200 no-underline cursor-pointer group select-none"
          >
            <Home className="w-3.5 h-3.5 text-[#B8737D] transition-transform group-hover:scale-110" />
            <span>Về Trang chủ</span>
          </Link>
        </div>

        {/* Center Main Card Container */}
        <div className="w-full max-w-[460px] mx-auto my-auto relative z-10 py-1">
          
          {/* Stepper Indicator (for Steps 1, 2, 3) */}
          {step < 4 && (
            <div className="flex justify-center mb-5 xl:mb-7">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3.5 sm:px-5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EADBDA] shadow-[0_4px_16px_rgba(184,115,125,0.06)]">
                {[
                  { num: 1, label: 'Gmail' },
                  { num: 2, label: 'Xác thực OTP' },
                  { num: 3, label: 'Mật khẩu mới' },
                ].map((s, idx) => {
                  const isActive = step === s.num;
                  const isCompleted = step > s.num;
                  return (
                    <React.Fragment key={s.num}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-r from-[#C58187] to-[#B36F75] text-white shadow-md shadow-[#B8737D]/30 ring-3 ring-[#B8737D]/20'
                              : isCompleted
                              ? 'bg-[#FAF0F1] text-[#854F55] border border-[#B8737D]/40'
                              : 'bg-[#F2ECE8] text-[#9A8688]'
                          }`}
                        >
                          {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.num}
                        </div>
                        <span
                          className={`text-[11.5px] sm:text-xs transition-colors ${
                            isActive
                              ? 'text-[#2C2523] font-bold tracking-wide'
                              : isCompleted
                              ? 'text-[#854F55] font-semibold'
                              : 'text-[#9A8688]'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {idx < 2 && (
                        <div
                          className={`w-5 sm:w-8 h-[2px] rounded-full transition-colors duration-300 ${
                            step > s.num ? 'bg-gradient-to-r from-[#B8737D] to-[#D498A0]' : 'bg-[#EADBDA]'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alert Message Banner */}
          {feedback.text && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 mb-6 border animate-fadeIn ${
                feedback.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {feedback.type === 'error' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 1: ENTER GMAIL ADDRESS
          ══════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="bg-white/90 backdrop-blur-xl border border-[#F0E4DE] rounded-3xl p-8 sm:p-9 shadow-[0_20px_50px_rgba(184,115,125,0.07)]">
              {/* Heading */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFF5F4] border border-[#F3DDDB] text-[#B8737D] mb-4 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <h1 className="font-playfair text-2xl sm:text-3xl text-[#2C2523] font-normal mb-2">
                  Khôi Phục Mật Khẩu
                </h1>
                <p className="text-xs sm:text-[13px] text-[#6E5A56] leading-relaxed max-w-sm mx-auto">
                  Vui lòng nhập địa chỉ <strong>Gmail</strong> đã đăng ký. Hệ thống sẽ gửi mã xác thực OTP 6 số để bạn thiết lập lại mật khẩu.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label
                    htmlFor="email-input"
                    className="block text-[11px] font-semibold tracking-wider uppercase text-[#5A4647] mb-2"
                  >
                    Địa Chỉ Gmail Liên Kết
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A49491]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email-input"
                      type="email"
                      required
                      autoFocus
                      placeholder="Địa chỉ Email đã đăng ký"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 bg-[#FDFBF9] hover:bg-white focus:bg-white border border-[#EADBDA] rounded-xl text-sm text-[#2C2523] placeholder-[#A49491] focus:outline-none focus:border-[#B8737D] focus:ring-4 focus:ring-[#B8737D]/10 transition-all duration-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#B8737D] hover:bg-[#A35E68] text-white font-medium text-xs tracking-[2px] uppercase shadow-[0_8px_20px_rgba(184,115,125,0.28)] hover:shadow-[0_12px_28px_rgba(184,115,125,0.36)] transition-all duration-300 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ĐANG GỬI MÃ XÁC THỰC...</span>
                    </>
                  ) : (
                    <span>GỬI MÃ XÁC THỰC QUA GMAIL</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 2: ENTER OTP CODE (6 DIGITS)
          ══════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="bg-white/90 backdrop-blur-xl border border-[#F0E4DE] rounded-3xl p-8 sm:p-9 shadow-[0_20px_50px_rgba(184,115,125,0.07)]">
              {/* Heading */}
              <div className="text-center mb-7">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFF5F4] border border-[#F3DDDB] text-[#B8737D] mb-4 shadow-sm">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="font-playfair text-2xl sm:text-3xl text-[#2C2523] font-normal mb-2">
                  Xác Thực Mã OTP
                </h1>
                <p className="text-xs sm:text-[13px] text-[#6E5A56] leading-relaxed max-w-sm mx-auto">
                  Mã số xác nhận đã gửi đến hộp thư Gmail <br />
                  <span className="font-semibold text-[#2C2523]">{getMaskedEmail(email)}</span>
                </p>
              </div>

              {devOtp && (
                <div style={{ background: '#FFF9E6', border: '1px solid #FFE58F', color: '#D48806', padding: '12px 16px', borderRadius: '14px', fontSize: '13px', marginBottom: '20px', textAlign: 'left', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>🔔 [Môi trường thử nghiệm] Mã OTP:</div>
                  Mã OTP đặt lại mật khẩu là: <strong style={{ fontSize: '18px', letterSpacing: '3px', color: '#AD4E00', background: '#FFF1B8', padding: '2px 8px', borderRadius: '4px' }}>{devOtp}</strong>
                  <div style={{ fontSize: '11px', color: '#874D00', marginTop: '4px' }}>
                    * Hệ thống chưa cấu hình EMAIL_USER &amp; EMAIL_PASS trong backend/.env nên mã hiển thị tại đây để bạn kiểm thử.
                  </div>
                </div>
              )}

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase text-[#5A4647] mb-3 text-center">
                    NHẬP 6 CHỮ SỐ XÁC THỰC
                  </label>
                  
                  {/* 6 Digits Boxes */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        autoFocus={idx === 0}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-13 sm:w-12 sm:h-14 text-center font-jakarta text-2xl font-bold bg-[#FDFBF9] hover:bg-white focus:bg-white border-2 border-[#EADBDA] focus:border-[#854F55] rounded-xl text-[#2C2523] focus:outline-none focus:ring-4 focus:ring-[#B8737D]/20 transition-all duration-200"
                      />
                    ))}
                  </div>

                  {/* Resend & Countdown */}
                  <div className="flex items-center justify-between text-xs text-[#7A6663] mt-4 px-1">
                    <span>
                      {otpExpiresIn > 0 ? (
                        <>
                          Hiệu lực còn:{' '}
                          <span className="font-semibold text-[#B8737D]">
                            {formatTime(otpExpiresIn)}
                          </span>
                        </>
                      ) : (
                        <span className="text-rose-600 font-medium">Mã OTP đã hết hạn</span>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={!canResend || isLoading}
                      className="font-semibold text-[#B8737D] hover:text-[#8E4953] disabled:text-[#C5B4B2] disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {canResend ? 'Gửi lại mã OTP mới' : `Gửi lại mã (${countdown}s)`}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setFeedback({ type: '', text: '' });
                    }}
                    className="py-3.5 px-4 rounded-xl border border-[#EADBDA] hover:bg-[#FDFBF9] text-[#6E5A56] hover:text-[#2C2523] text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || otpExpiresIn === 0}
                    className="flex-1 py-3.5 px-6 rounded-xl bg-[#B8737D] hover:bg-[#A35E68] text-white font-medium text-xs tracking-[2px] uppercase shadow-[0_8px_20px_rgba(184,115,125,0.28)] hover:shadow-[0_12px_28px_rgba(184,115,125,0.36)] transition-all duration-300 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>ĐANG XÁC THỰC...</span>
                      </>
                    ) : otpExpiresIn === 0 ? (
                      <span>MÃ ĐÃ HẾT HẠN</span>
                    ) : (
                      <span>XÁC NHẬN MÃ OTP</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 3: CREATE NEW PASSWORD
          ══════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="bg-white/90 backdrop-blur-xl border border-[#F0E4DE] rounded-3xl p-8 sm:p-9 shadow-[0_20px_50px_rgba(184,115,125,0.07)]">
              {/* Heading */}
              <div className="text-center mb-7">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFF5F4] border border-[#F3DDDB] text-[#B8737D] mb-4 shadow-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="font-playfair text-2xl sm:text-3xl text-[#2C2523] font-normal mb-2">
                  Thiết Lập Mật Khẩu
                </h1>
                <p className="text-xs sm:text-[13px] text-[#6E5A56] leading-relaxed max-w-sm mx-auto">
                  Tạo mật khẩu mới an toàn để tiếp tục sử dụng các đặc quyền tại UniBridal Atelier.
                </p>
              </div>

              {/* Password Form */}
              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* Field 1: New password */}
                <div>
                  <label
                    htmlFor="new-password-input"
                    className="block text-[11px] font-semibold tracking-wider uppercase text-[#5A4647] mb-2"
                  >
                    Mật Khẩu Mới
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A49491]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="new-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="Mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3.5 bg-[#FDFBF9] hover:bg-white focus:bg-white border border-[#EADBDA] rounded-xl text-sm text-[#2C2523] placeholder-[#A49491] focus:outline-none focus:border-[#B8737D] focus:ring-4 focus:ring-[#B8737D]/10 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A49491] hover:text-[#B8737D] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1.5 h-1.5 w-full">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          bar <= strength.score ? strength.color : 'bg-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-[#7A6663]">
                    <span>
                      Độ an toàn: <span className={`font-semibold ${strength.textCol}`}>{strength.text}</span>
                    </span>
                    <span>Tối thiểu 8 ký tự, có số & chữ</span>
                  </div>
                </div>

                {/* Field 2: Confirm password */}
                <div>
                  <label
                    htmlFor="confirm-password-input"
                    className="block text-[11px] font-semibold tracking-wider uppercase text-[#5A4647] mb-2"
                  >
                    Xác Nhận Mật Khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A49491]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirm-password-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Xác nhận lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3.5 bg-[#FDFBF9] hover:bg-white focus:bg-white border border-[#EADBDA] rounded-xl text-sm text-[#2C2523] placeholder-[#A49491] focus:outline-none focus:border-[#B8737D] focus:ring-4 focus:ring-[#B8737D]/10 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A49491] hover:text-[#B8737D] transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(2);
                      setFeedback({ type: '', text: '' });
                    }}
                    className="py-3.5 px-4 rounded-xl border border-[#EADBDA] hover:bg-[#FDFBF9] text-[#6E5A56] hover:text-[#2C2523] text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3.5 px-6 rounded-xl bg-[#B8737D] hover:bg-[#A35E68] text-white font-medium text-xs tracking-[2px] uppercase shadow-[0_8px_20px_rgba(184,115,125,0.28)] hover:shadow-[0_12px_28px_rgba(184,115,125,0.36)] transition-all duration-300 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>ĐANG CẬP NHẬT...</span>
                      </>
                    ) : (
                      <span>LƯU MẬT KHẨU MỚI</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              STEP 4: SUCCESS CONFIRMATION
          ══════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="bg-white/95 backdrop-blur-xl border border-[#F0E4DE] rounded-3xl p-8 sm:p-10 text-center shadow-[0_20px_50px_rgba(184,115,125,0.1)] animate-fadeIn">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 mb-6 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="inline-block px-3 py-1 rounded-full bg-[#FAF0F1] text-[#B8737D] text-[11px] font-semibold tracking-wider uppercase mb-3">
                Hoàn tất bảo mật
              </div>

              <h1 className="font-playfair text-2xl sm:text-3xl text-[#2C2523] font-normal mb-3">
                Cập Nhật Thành Công!
              </h1>

              <p className="text-xs sm:text-[13px] text-[#6E5A56] leading-relaxed max-w-sm mx-auto mb-8">
                Mật khẩu mới của quý khách đã được lưu an toàn trên hệ thống. Bây giờ quý khách có thể đăng nhập và tiếp tục hành trình chuẩn bị cho ngày cưới hoàn mỹ.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#B8737D] hover:bg-[#A35E68] text-white font-medium text-xs tracking-[2px] uppercase shadow-[0_8px_20px_rgba(184,115,125,0.28)] hover:shadow-[0_12px_28px_rgba(184,115,125,0.36)] transition-all duration-300 cursor-pointer"
                >
                  ĐĂNG NHẬP NGAY BÂY GIỜ
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full py-3 px-6 rounded-xl border border-[#EADBDA] hover:bg-neutral-50 text-[#6E5A56] font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Về Trang Chủ
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 pt-2 text-center text-[11px] text-[#A08E8F]">
          © {new Date().getFullYear()} UniBridal Haute Couture. Bảo lưu mọi quyền.
        </div>
      </div>
    </div>
  );
}
