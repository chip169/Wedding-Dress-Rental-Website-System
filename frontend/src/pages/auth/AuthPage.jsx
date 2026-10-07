import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import './AuthPage.css';

// ── SVG Icons ────────────────────────────────────────────────────────
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

const DiamondIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#854F55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 7-10 11L2 10l4-7z" />
    <path d="M2 10h20" />
    <path d="M12 21L8 10 11 3" />
    <path d="M12 21l4-11-3-7" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="13" viewBox="0 0 16 13" fill="none" stroke="rgba(81, 67, 68, 0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="0.8" y="0.8" width="14.4" height="11.4" rx="2" />
    <path d="M1.5 2L8 7.2L14.5 2" />
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="rgba(81, 67, 68, 0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="6.5" width="12" height="8.5" rx="2" />
    <path d="M3.5 6.5V4a3.5 3.5 0 0 1 7 0v2.5" />
    <circle cx="7" cy="10.5" r="1" fill="rgba(81, 67, 68, 0.55)" stroke="none" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(81, 67, 68, 0.55)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const FootnoteLockIcon = () => (
  <svg width="13" height="14" viewBox="0 0 14 16" fill="none" stroke="#7A6663" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="6.5" width="11" height="8.5" rx="1.5" />
    <path d="M4 6.5V4a3.5 3.5 0 0 1 6 0v2.5" />
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

export default function AuthPage({ defaultMode = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine mode from path or default prop
  const isPathRegister = location.pathname.includes('register');
  const [isSignUp, setIsSignUp] = useState(isPathRegister || defaultMode === 'register');

  useEffect(() => {
    setIsSignUp(location.pathname.includes('register'));
  }, [location.pathname]);

  // Smooth switch without page reload / flash
  const switchToRegister = (e) => {
    if (e) e.preventDefault();
    setIsSignUp(true);
    window.history.replaceState(null, '', '/register');
  };

  const switchToLogin = (e) => {
    if (e) e.preventDefault();
    setIsSignUp(false);
    window.history.replaceState(null, '', '/login');
  };

  // ── Login Form State ──────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', { loginEmail, loginPassword, rememberMe });
  };

  // ── Register Form State ───────────────────────────────────────────
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState(false);

  const getPasswordStrength = () => {
    if (!regPassword) return { level: 0, text: 'Chưa nhập' };
    let score = 0;
    if (regPassword.length >= 8) score++;
    if (/[A-Z]/.test(regPassword)) score++;
    if (/[0-9]/.test(regPassword)) score++;
    if (/[^A-Za-z0-9]/.test(regPassword)) score++;

    switch (score) {
      case 1: return { level: 1, text: 'Yếu' };
      case 2: return { level: 2, text: 'Tiêu chuẩn' };
      case 3: return { level: 3, text: 'Khá' };
      case 4: return { level: 4, text: 'Mạnh' };
      default: return { level: 1, text: 'Yếu' };
    }
  };

  const strength = getPasswordStrength();

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    // Trigger success feedback then smooth slide to login
    setRegSuccessMsg(true);
    setTimeout(() => {
      setRegSuccessMsg(false);
      switchToLogin();
    }, 1200);
  };

  return (
    <div className="ub-auth-screen">
      {/* Ambient background glow lights */}
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

      {/* 
        MAIN AUTH CONTAINER
        When isSignUp is true (Register):
          - Brand Overlay is on the LEFT (translateX: 0%)
          - Register Form is visible on the RIGHT
        When isSignUp is false (Login):
          - Brand Overlay slides smoothly to the RIGHT (translateX: 100%)
          - Login Form is visible on the LEFT
      */}
      <div className={`ub-auth-card ${isSignUp ? 'is-signup-mode' : 'is-login-mode'}`}>

        {/* ── 1. LOGIN FORM PANEL (Occupies Left half: 0 to 50%) ───── */}
        <div className={`ub-form-panel ub-form-panel--login ${!isSignUp ? 'is-active' : 'is-hidden'}`}>
          <div className="ub-form-inner">

            {/* Diamond Privilege Badge */}
            <div className="ub-diamond-badge" title="Haute Couture Member Access">
              <DiamondIcon />
            </div>

            {/* Header */}
            <div className="ub-header-group">
              <span className="ub-form-overhead">UNIBRIDAL HAUTE COUTURE</span>
              <h2 className="ub-form-heading">Đăng Nhập</h2>
              <div className="ub-heading-ornament">
                <span className="ub-ornament-line" />
                <span className="ub-ornament-diamond" />
                <span className="ub-ornament-line" />
              </div>
            </div>

            {/* Form */}
            <form className="ub-form" onSubmit={handleLoginSubmit} id="login-form">
              <div className="ub-field-group">
                <label className="ub-label" htmlFor="auth-login-identity">
                  SỐ ĐIỆN THOẠI HOẶC EMAIL
                </label>
                <div className="ub-input-box">
                  <span className="ub-input-icon">
                    <MailIcon />
                  </span>
                  <input
                    id="auth-login-identity"
                    type="text"
                    className="ub-input"
                    placeholder="marie@atelier.vn hoặc 090 123 4567"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="ub-field-group">
                <div className="ub-label-row">
                  <label className="ub-label" htmlFor="auth-login-password">
                    MẬT KHẨU
                  </label>
                  <a href="/forgot-password" className="ub-forgot-link" onClick={(e) => e.preventDefault()}>
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="ub-input-box">
                  <span className="ub-input-icon">
                    <LockIcon />
                  </span>
                  <input
                    id="auth-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    className="ub-input ub-input--pass"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="ub-eye-toggle"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <EyeIcon visible={showLoginPassword} />
                  </button>
                </div>
              </div>

              <div className="ub-remember-row">
                <label className="ub-checkbox-label" htmlFor="auth-login-remember">
                  <input
                    id="auth-login-remember"
                    type="checkbox"
                    className="ub-checkbox-input"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="ub-custom-checkbox" />
                  <span className="ub-remember-text">Ghi nhớ phiên đăng nhập</span>
                </label>
              </div>

              <button type="submit" className="ub-submit-btn" id="login-submit-btn">
                <span className="ub-submit-btn__text">ĐĂNG NHẬP TÀI KHOẢN</span>
                <span className="ub-submit-btn__arrow">→</span>
              </button>
            </form>

            <div className="ub-bottom-link-row">
              <span className="ub-prompt-text">Chưa có tài khoản? </span>
              <button
                type="button"
                className="ub-text-btn-link"
                onClick={switchToRegister}
              >
                Đăng ký ngay
              </button>
            </div>

          </div>
        </div>

        {/* ── 2. REGISTER FORM PANEL (Occupies Right half: 50% to 100%) */}
        <div className={`ub-form-panel ub-form-panel--register ${isSignUp ? 'is-active' : 'is-hidden'}`}>
          <div className="ub-form-inner ub-form-inner--register">

            <div className="ub-header-group">
              <span className="ub-form-overhead">UNIBRIDAL HAUTE COUTURE</span>
              <h2 className="ub-form-heading">Đăng Ký Tài Khoản</h2>
              <p className="ub-form-description">
                Tạo tài khoản để lưu giữ danh sách váy cưới mơ ước, đặt lịch thử váy riêng tư và nhận đặc quyền độc bản.
              </p>
            </div>

            {regSuccessMsg && (
              <div className="ub-success-toast">
                ✓ Đăng ký thành công! Đang chuyển sang màn hình đăng nhập...
              </div>
            )}

            <form className="ub-form" onSubmit={handleRegisterSubmit} id="register-form">
              <div className="ub-form-row">
                <div className="ub-field-group">
                  <label className="ub-label" htmlFor="auth-reg-fullname">
                    Họ và tên
                  </label>
                  <div className="ub-input-box">
                    <input
                      id="auth-reg-fullname"
                      type="text"
                      className="ub-input ub-input--no-icon"
                      placeholder="Nguyễn Mai Phương"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="ub-field-group">
                  <label className="ub-label" htmlFor="auth-reg-phone">
                    Số điện thoại <span className="ub-required-star">*</span>
                  </label>
                  <div className="ub-input-box">
                    <input
                      id="auth-reg-phone"
                      type="tel"
                      className="ub-input"
                      placeholder="090 123 4567"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                    />
                    <span className="ub-input-icon ub-input-icon--right">
                      <PhoneIcon />
                    </span>
                  </div>
                </div>
              </div>

              <div className="ub-field-group">
                <label className="ub-label" htmlFor="auth-reg-email">
                  Địa chỉ Email <span className="ub-required-star">*</span>
                </label>
                <div className="ub-input-box">
                  <input
                    id="auth-reg-email"
                    type="email"
                    className="ub-input"
                    placeholder="maiphuong@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                  <span className="ub-input-icon ub-input-icon--right">
                    <MailIcon />
                  </span>
                </div>
              </div>

              <div className="ub-form-row">
                <div className="ub-field-group">
                  <label className="ub-label" htmlFor="auth-reg-password">
                    Mật khẩu <span className="ub-required-star">*</span>
                  </label>
                  <div className="ub-input-box">
                    <input
                      id="auth-reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      className="ub-input"
                      placeholder="Tối thiểu 8 ký tự"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="ub-eye-toggle"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      aria-label={showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      <EyeIcon visible={showRegPassword} />
                    </button>
                  </div>
                </div>

                <div className="ub-field-group">
                  <label className="ub-label" htmlFor="auth-reg-confirm">
                    Xác nhận mật khẩu <span className="ub-required-star">*</span>
                  </label>
                  <div className="ub-input-box">
                    <input
                      id="auth-reg-confirm"
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      className="ub-input"
                      placeholder="Nhập lại mật khẩu"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="ub-eye-toggle"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      aria-label={showRegConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      <EyeIcon visible={showRegConfirmPassword} />
                    </button>
                  </div>
                </div>
              </div>

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

              <div className="ub-terms-row">
                <label className="ub-checkbox-label" htmlFor="auth-reg-terms">
                  <input
                    id="auth-reg-terms"
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

              <button type="submit" className="ub-submit-btn" id="register-submit-btn">
                <span className="ub-submit-btn__text">TẠO TÀI KHOẢN THÀNH VIÊN</span>
                <span className="ub-submit-btn__arrow">→</span>
              </button>
            </form>

            <div className="ub-bottom-link-row">
              <span className="ub-prompt-text">Nàng đã có tài khoản tại UniBridal? </span>
              <button
                type="button"
                className="ub-text-btn-link"
                onClick={switchToLogin}
              >
                Đăng nhập ngay
              </button>
            </div>

          </div>
        </div>

        {/* ── 3. SLIDING BRAND OVERLAY (The moving silk panel) ──────── */}
        <div className="ub-sliding-brand-overlay">
          {/* Ambient blurs */}
          <div className="ub-aura ub-aura--top" />
          <div className="ub-aura ub-aura--center" />
          <div className="ub-aura ub-aura--bottom" />
          <div className="ub-couture-pattern" />

          {/* Top Chips Row */}
          <div className="ub-top-chips">
            <div className="ub-chip ub-chip--white">
              <span className="ub-chip__icon">
                <SparkleIcon />
              </span>
              <span className="ub-chip__text">WEDDING DRESS RENTAL</span>
            </div>
            <div className="ub-chip ub-chip--blush">
              <span className="ub-chip__text ub-chip__text--taupe">ESPACE MEMBRE</span>
            </div>
          </div>

          {/* Center Brand Group */}
          <div className="ub-brand-center">
            <div className="ub-emblem-card">
              <div className="ub-emblem-inner-glow" />
              <Logo variant="emblem" className="ub-emblem-img" alt="UniBridal Emblem" />
            </div>

            <h1 className="ub-brand-title">UNIBRIDAL</h1>
            <div className="ub-brand-subtitle-wrap">
              <span className="ub-dash-line" />
              <span className="ub-brand-subtitle">HAUTE COUTURE</span>
              <span className="ub-dash-line" />
            </div>
            <p className="ub-brand-tagline">Atelier de Robes de Mariée & Sur-Mesure</p>
          </div>

          {/* Bottom Security Footer */}
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

      </div>
    </div>
  );
}
