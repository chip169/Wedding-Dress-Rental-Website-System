import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../../components/common/Logo';

// SVG Icons
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

const FootnoteLockIcon = () => (
  <svg width="13" height="14" viewBox="0 0 14 16" fill="none" stroke="#7A6663" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="6.5" width="11" height="8.5" rx="1.5" />
    <path d="M4 6.5V4.5C4 2.84 5.34 1.5 7 1.5C8.66 1.5 10 2.84 10 4.5V6.5" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A6663" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A6663" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const EyeIcon = ({ visible }) => (
  visible ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A6663" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A6663" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
);

const ArrowBackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

export default function RegisterPage() {
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
      return;
    }
    if (!agreedToTerms) {
      alert('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.');
      return;
    }
    console.log('Register submitted:', { fullName, phone, email, password });
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
          min-height: 100vh;
          width: 100vw;
          background-color: #EFE7E3;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          box-sizing: border-box;
          padding: 24px;
          overflow-x: hidden;
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
          width: 1152px;
          max-width: 1152px;
          display: flex;
          align-items: center;
          margin-bottom: 14px;
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
          width: 1152px;
          max-width: 1152px;
          min-height: 740px;
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
          width: 576px;
          min-height: 740px;
          padding: 44px 48px;
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
          width: 144px;
          height: 134px;
          background: #FFFFFF;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            0 16px 36px -8px rgba(133, 79, 85, 0.16),
            0 4px 12px rgba(0, 0, 0, 0.03);
          margin-bottom: 24px;
          padding: 16px;
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
          font-size: 38px;
          line-height: 44px;
          letter-spacing: 8px;
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
          width: 576px;
          padding: 36px 48px;
          background: #FFFFFF;
          box-sizing: border-box;
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
          margin-bottom: 24px;
        }

        .ub-reg-form-container .ub-form-overhead {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          line-height: 14px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: #854F55;
          margin-bottom: 6px;
        }

        .ub-reg-form-container .ub-form-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 500;
          font-size: 32px;
          line-height: 40px;
          color: #1C1415;
          margin: 0 0 8px;
          letter-spacing: -0.2px;
        }

        .ub-form-description {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12.5px;
          line-height: 18px;
          color: #6E5A5D;
          margin: 0;
          text-align: center;
          max-width: 430px;
        }

        .ub-reg-form-container .ub-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .ub-form-row {
          display: flex;
          flex-direction: row;
          gap: 14px;
          width: 100%;
        }

        .ub-form-row .ub-field-group {
          flex: 1;
        }

        .ub-reg-form-container .ub-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
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
          height: 44px;
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
          height: 46px;
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
          margin-top: 24px;
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
