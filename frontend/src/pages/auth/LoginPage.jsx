import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import './LoginPage.css';

// Sparkle Star Icon
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

// Diamond Gemstone Icon (Privilege Badge)
const DiamondIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#854F55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 7-10 11L2 10l4-7z" />
    <path d="M2 10h20" />
    <path d="M12 21L8 10 11 3" />
    <path d="M12 21l4-11-3-7" />
  </svg>
);

// Mail Icon
const MailIcon = () => (
  <svg width="16" height="13" viewBox="0 0 16 13" fill="none" stroke="rgba(81, 67, 68, 0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="0.8" y="0.8" width="14.4" height="11.4" rx="2" />
    <path d="M1.5 2L8 7.2L14.5 2" />
  </svg>
);

// Lock Icon
const LockIcon = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="rgba(81, 67, 68, 0.55)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="6.5" width="12" height="8.5" rx="2" />
    <path d="M3.5 6.5V4a3.5 3.5 0 0 1 7 0v2.5" />
    <circle cx="7" cy="10.5" r="1" fill="rgba(81, 67, 68, 0.55)" stroke="none" />
  </svg>
);

// Small Lock Icon for footnote
const FootnoteLockIcon = () => (
  <svg width="13" height="14" viewBox="0 0 14 16" fill="none" stroke="#7A6663" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="6.5" width="11" height="8.5" rx="1.5" />
    <path d="M4 6.5V4a3.5 3.5 0 0 1 6 0v2.5" />
  </svg>
);

// Eye Icon
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

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', { email, password, rememberMe });
  };

  return (
    <div className="ub-login-screen">
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

      {/* 
        Reverse Layout Card: 
        Left = Form Đăng Nhập
        Right = Khối Thương Hiệu (Brand Presentation)
      */}
      <div className="ub-login-card ub-login-card--reverse">

        {/* ── LEFT PANEL: Login Form (Đã đảo sang bên trái) ───────── */}
        <div className="ub-panel-form-left">
          <div className="ub-form-container">

            {/* Diamond Privilege Badge */}
            <div className="ub-diamond-badge" title="Haute Couture Member Access">
              <DiamondIcon />
            </div>

            {/* Form Header */}
            <div className="ub-header-group">
              <span className="ub-form-overhead">UNIBRIDAL HAUTE COUTURE</span>
              <h2 className="ub-form-heading">Đăng Nhập</h2>
              <div className="ub-heading-ornament">
                <span className="ub-ornament-line" />
                <span className="ub-ornament-diamond" />
                <span className="ub-ornament-line" />
              </div>
            </div>

            {/* Main Form */}
            <form className="ub-form" onSubmit={handleSubmit} id="login-form">

              {/* Field 1: Phone / Email */}
              <div className="ub-field-group">
                <label className="ub-label" htmlFor="login-identity">
                  SỐ ĐIỆN THOẠI HOẶC EMAIL
                </label>
                <div className="ub-input-box">
                  <span className="ub-input-icon">
                    <MailIcon />
                  </span>
                  <input
                    id="login-identity"
                    type="text"
                    className="ub-input"
                    placeholder="marie@atelier.vn hoặc 090 123 4567"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="ub-field-group">
                <div className="ub-label-row">
                  <label className="ub-label" htmlFor="login-password">
                    MẬT KHẨU
                  </label>
                  <a href="/forgot-password" className="ub-forgot-link" id="forgot-password-link">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="ub-input-box">
                  <span className="ub-input-icon">
                    <LockIcon />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="ub-input ub-input--pass"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="ub-eye-toggle"
                    id="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              {/* Checkbox: Ghi nhớ phiên đăng nhập */}
              <div className="ub-remember-row">
                <label className="ub-checkbox-label" htmlFor="login-remember">
                  <input
                    id="login-remember"
                    type="checkbox"
                    className="ub-checkbox-input"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="ub-custom-checkbox" />
                  <span className="ub-remember-text">Ghi nhớ phiên đăng nhập</span>
                </label>
              </div>

              {/* Submit Button */}
              <button type="submit" className="ub-submit-btn" id="login-submit-btn">
                <span className="ub-submit-btn__text">ĐĂNG NHẬP TÀI KHOẢN</span>
                <span className="ub-submit-btn__arrow">→</span>
              </button>
            </form>

            {/* Bottom Register Prompt */}
            <div className="ub-bottom-link-row">
              <span className="ub-prompt-text">Chưa có tài khoản? </span>
              <a href="/register" className="ub-register-link" id="register-link">
                Đăng ký ngay
              </a>
            </div>

          </div>
        </div>

        {/* ── RIGHT PANEL: Brand Presentation (Đã đảo sang bên phải) ─ */}
        <div className="ub-panel-brand-right">
          {/* Subtle silk ambient blurs */}
          <div className="ub-aura ub-aura--top" />
          <div className="ub-aura ub-aura--center" />
          <div className="ub-aura ub-aura--bottom" />

          {/* Delicate couture watermark ornament */}
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

      </div>
    </div>
  );
}
