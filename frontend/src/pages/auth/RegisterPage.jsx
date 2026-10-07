import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import './RegisterPage.css';

// SVG Icons
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

const FootnoteLockIcon = () => (
  <svg width="13" height="14" viewBox="0 0 14 16" fill="none" stroke="#7A6663" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="6.5" width="11" height="8.5" rx="1.5" />
    <path d="M4 6.5V4a3.5 3.5 0 0 1 6 0v2.5" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(81, 67, 68, 0.55)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="13" viewBox="0 0 16 13" fill="none" stroke="rgba(81, 67, 68, 0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="0.8" y="0.8" width="14.4" height="11.4" rx="2" />
    <path d="M1.5 2L8 7.2L14.5 2" />
  </svg>
);

const EyeIcon = ({ visible }) => (
  <svg width="17" height="13" viewBox="0 0 18 14" fill="none" stroke="rgba(81, 67, 68, 0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 7C1 7 4 1.5 9 1.5C14 1.5 17 7 17 7C17 7 14 12.5 9 12.5C4 12.5 1 7 1 7Z" />
    <circle cx="9" cy="7" r="2.5" />
    {!visible && <line x1="2.5" y1="1" x2="15.5" y2="13" />}
  </svg>
);

const ArrowBackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export default function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Dynamic password strength evaluation (0 - 4 segments)
  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: 'Chưa nhập' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 1:
        return { level: 1, text: 'Yếu' };
      case 2:
        return { level: 2, text: 'Tiêu chuẩn' };
      case 3:
        return { level: 3, text: 'Khá' };
      case 4:
        return { level: 4, text: 'Mạnh' };
      default:
        return { level: 1, text: 'Yếu' };
    }
  };

  const strength = getPasswordStrength();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
      return;
    }
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    console.log('Registration submitted:', { fullName, phone, email, password });
  };

  return (
    <div className="ub-reg-screen">
      {/* Ambient background blur lights */}
      <div className="ub-bg-glow ub-bg-glow--left" />
      <div className="ub-bg-glow ub-bg-glow--right" />

      {/* Top Navigation Back Button */}
      <div className="ub-top-nav-bar">
        <button
          type="button"
          className="ub-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Quay lại"
        >
          <ArrowBackIcon />
          <span>QUAY LẠI</span>
        </button>
      </div>

      <div className="ub-reg-card">

        {/* ── LEFT PANEL (Haute Couture Brand Presentation) ───────── */}
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

        {/* ── RIGHT PANEL (Registration Form) ─────────────────────── */}
        <div className="ub-panel-right">
          <div className="ub-reg-form-container">

            {/* Form Header */}
            <div className="ub-header-group">
              <span className="ub-form-overhead">UNIBRIDAL HAUTE COUTURE</span>
              <h2 className="ub-form-heading">Đăng Ký Tài Khoản</h2>
              <p className="ub-form-description">
                Tạo tài khoản để lưu giữ danh sách váy cưới mơ ước, đặt lịch thử váy riêng tư và nhận đặc quyền độc bản.
              </p>
            </div>

            {/* Registration Form */}
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
                      placeholder="Nguyễn Mai Phương"
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
                      className="ub-input"
                      placeholder="090 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <span className="ub-input-icon ub-input-icon--right">
                      <PhoneIcon />
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Email Address */}
              <div className="ub-field-group">
                <label className="ub-label" htmlFor="reg-email">
                  Địa chỉ Email <span className="ub-required-star">*</span>
                </label>
                <div className="ub-input-box">
                  <input
                    id="reg-email"
                    type="email"
                    className="ub-input"
                    placeholder="maiphuong@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <span className="ub-input-icon ub-input-icon--right">
                    <MailIcon />
                  </span>
                </div>
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
                      placeholder="Tối thiểu 8 ký tự"
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
                      placeholder="Nhập lại mật khẩu"
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

            {/* Bottom Login Prompt */}
            <div className="ub-bottom-link-row">
              <span className="ub-prompt-text">Nàng đã có tài khoản tại UniBridal? </span>
              <Link to="/login" className="ub-login-link" id="login-link">
                Đăng nhập ngay
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
