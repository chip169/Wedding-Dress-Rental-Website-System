import { useState } from 'react';
import './LoginPage.css';

// Sparkle Star Icon
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

// Diamond Gemstone Icon (Top right of right panel)
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
    <path d="M4 6.5V4a3 3 0 0 1 6 0v2.5" />
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

// UniBridal UB Monogram Emblem
const UBMonogramLogo = () => (
  <svg width="130" height="120" viewBox="0 0 130 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C28289" />
        <stop offset="100%" stopColor="#A8676E" />
      </linearGradient>
    </defs>
    
    {/* Letter U */}
    <path
      d="M20 28 C20 28 27 28 27 34 L27 64 C27 80 37 88 50 88 C60 88 68 81 72 72 C70 66 69 58 69 50 L69 34 C69 28 76 28 76 28 L76 25 L58 25 L58 28 C58 28 64 28 64 34 L64 54 C64 68 56 78 46 78 C36 78 32 70 32 58 L32 34 C32 28 38 28 38 28 L38 25 L20 25 Z"
      fill="url(#ubGrad)"
    />

    {/* Letter B */}
    <path
      d="M62 25 L92 25 C104 25 112 32 112 43 C112 51 106 57 99 60 C108 63 115 71 115 82 C115 95 105 103 90 103 L60 103 L60 99 C60 99 66 99 66 94 L66 34 C66 29 60 29 60 29 Z M72 32 L72 58 L89 58 C98 58 103 52 103 45 C103 37 97 32 89 32 Z M72 65 L72 95 L90 95 C99 95 106 89 106 80 C106 71 99 65 90 65 Z"
      fill="url(#ubGrad)"
    />

    {/* Bride Silhouette inside Monogram */}
    <g transform="translate(48, 26)">
      {/* Head */}
      <circle cx="12" cy="7" r="3.2" fill="#B9787F" />
      {/* Delicate Veil flowing back */}
      <path d="M10 6 C7 8 4 15 2 24 C5 21 9 15 11 10 Z" fill="#DDB2B6" opacity="0.85" />
      {/* Torso & Bodice */}
      <path d="M10 11 C10 11 8 16 9 20 C10 22 14 22 15 20 C16 16 14 11 14 11 Z" fill="#B9787F" />
      {/* Flowing Ballgown skirt */}
      <path d="M9 20 C6 28 1 44 -2 58 C4 57 12 58 18 57 C16 46 14 30 15 20 Z" fill="#C98A90" />
      <path d="M12 21 C15 32 19 46 24 57 C19 57 14 57 11 57 C13 46 13 32 12 21 Z" fill="#E8C5C8" opacity="0.9" />
      {/* Sparkle Star near bride's crown */}
      <path d="M18 3 L19.2 6.8 L23 8 L19.2 9.2 L18 13 L16.8 9.2 L13 8 L16.8 6.8 Z" fill="#BA7980" />
    </g>
  </svg>
);

export default function LoginPage() {
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
      <div className="ub-login-card">

        {/* ── LEFT PANEL ─────────────────────────────────────────── */}
        <div className="ub-panel-left">
          {/* Subtle warm aura blobs */}
          <div className="ub-aura ub-aura--top" />
          <div className="ub-aura ub-aura--bottom" />

          {/* Top Chips */}
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
              <UBMonogramLogo />
            </div>

            {/* Typography */}
            <h1 className="ub-brand-title">UNIBRIDAL</h1>
            <div className="ub-brand-subtitle-wrap">
              <span className="ub-dash">—</span>
              <span className="ub-brand-subtitle">HAUTE COUTURE</span>
              <span className="ub-dash">—</span>
            </div>
          </div>

          {/* Bottom Security Row */}
          <div className="ub-footer-row">
            <div className="ub-security-badge">
              <FootnoteLockIcon />
              <span className="ub-security-text">Bảo mật thông tin tuyệt đối</span>
            </div>
            <span className="ub-est-text">EST. 2026</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────── */}
        <div className="ub-panel-right">
          <div className="ub-form-container">

            {/* Diamond Badge on top right */}
            <div className="ub-diamond-badge" title="Haute Couture Privilege">
              <DiamondIcon />
            </div>

            {/* Form Header */}
            <div className="ub-header-group">
              <span className="ub-form-overhead">UNIBRIDAL HAUTE COUTURE</span>
              <h2 className="ub-form-heading">Đăng Nhập</h2>
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
                <span>ĐĂNG NHẬP TÀI KHOẢN →</span>
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

      </div>
    </div>
  );
}
