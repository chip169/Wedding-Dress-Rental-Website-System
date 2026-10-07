import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../../components/common/Logo';

// Sparkle Star Icon
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" />
  </svg>
);

// Diamond Gemstone Icon (Privilege Badge)
const DiamondIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#854F55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
    <path d="M2 9h20" />
    <path d="M10 3L6 9l6 12 6-12-4-6" />
  </svg>
);

// Input Icons
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A6663" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A6663" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

const FootnoteLockIcon = () => (
  <svg width="13" height="14" viewBox="0 0 14 16" fill="none" stroke="#7A6663" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="6.5" width="11" height="8.5" rx="1.5" />
    <path d="M4 6.5V4.5C4 2.84 5.34 1.5 7 1.5C8.66 1.5 10 2.84 10 4.5V6.5" />
  </svg>
);

const ArrowBackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        .ub-login-screen {
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

        .ub-login-screen .ub-bg-glow {
          position: absolute;
          width: 550px;
          height: 550px;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(100px);
          opacity: 0.6;
        }
        .ub-login-screen .ub-bg-glow--left {
          top: -150px;
          left: 5%;
          background: radial-gradient(circle, rgba(255, 218, 222, 0.7) 0%, rgba(255, 238, 230, 0) 70%);
        }
        .ub-login-screen .ub-bg-glow--right {
          bottom: -150px;
          right: 5%;
          background: radial-gradient(circle, rgba(245, 220, 205, 0.6) 0%, rgba(255, 240, 235, 0) 70%);
        }

        .ub-login-screen .ub-top-nav-bar {
          position: relative;
          z-index: 15;
          width: 1152px;
          max-width: 1152px;
          display: flex;
          align-items: center;
          margin-bottom: 14px;
        }

        .ub-login-screen .ub-back-btn {
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
        .ub-login-screen .ub-back-btn:hover {
          color: #854F55;
          transform: translateX(-3px);
        }

        .ub-login-card {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: row;
          width: 1152px;
          max-width: 1152px;
          height: 740px;
          background: #FFFFFF;
          border-radius: 16px;
          box-shadow:
            0 30px 60px -15px rgba(105, 50, 58, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.9),
            0 4px 16px -2px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }

        .ub-panel-form-left {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 576px;
          height: 740px;
          padding: 48px;
          background: #FFFFFF;
          box-sizing: border-box;
          animation: swapFormToLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes swapFormToLeft {
          0% {
            opacity: 0.2;
            transform: translateX(45px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .ub-panel-form-left .ub-diamond-badge {
          position: absolute;
          top: 40px;
          right: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: #FAF0EC;
          border: 1px solid rgba(133, 79, 85, 0.12);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .ub-panel-form-left .ub-diamond-badge:hover {
          background: #F3E0DB;
          border-color: rgba(133, 79, 85, 0.25);
          transform: rotate(8deg) scale(1.08);
          box-shadow: 0 4px 12px rgba(133, 79, 85, 0.15);
        }

        .ub-panel-form-left .ub-form-container {
          display: flex;
          flex-direction: column;
          width: 440px;
          max-width: 440px;
        }

        .ub-panel-form-left .ub-header-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 30px;
        }

        .ub-panel-form-left .ub-form-overhead {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          line-height: 14px;
          letter-spacing: 2.6px;
          text-transform: uppercase;
          color: #854F55;
          margin-bottom: 8px;
        }

        .ub-panel-form-left .ub-form-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 500;
          font-size: 36px;
          line-height: 44px;
          color: #1C1415;
          margin: 0;
          letter-spacing: -0.2px;
        }

        .ub-panel-form-left .ub-heading-ornament {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
        }

        .ub-panel-form-left .ub-ornament-line {
          width: 22px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(133, 79, 85, 0.35), transparent);
        }

        .ub-panel-form-left .ub-ornament-diamond {
          width: 4px;
          height: 4px;
          background: #C28288;
          transform: rotate(45deg);
          border-radius: 0.5px;
        }

        .ub-panel-form-left .ub-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          width: 100%;
        }

        .ub-panel-form-left .ub-field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
          width: 100%;
        }

        .ub-panel-form-left .ub-label-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .ub-panel-form-left .ub-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          line-height: 14px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: #4D3F41;
        }

        .ub-panel-form-left .ub-forgot-link {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          font-size: 12px;
          line-height: 16px;
          letter-spacing: 0.1px;
          color: #854F55;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .ub-panel-form-left .ub-forgot-link:hover {
          color: #633339;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .ub-panel-form-left .ub-input-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          height: 48px;
          background: #FDF3EF;
          border: 1px solid rgba(133, 79, 85, 0.12);
          border-radius: 6px;
          box-sizing: border-box;
          transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .ub-panel-form-left .ub-input-box:focus-within {
          background: #FFFFFF;
          border-color: #C28288;
          box-shadow: 0 0 0 3.5px rgba(194, 130, 136, 0.15);
        }

        .ub-panel-form-left .ub-input-icon {
          position: absolute;
          left: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .ub-panel-form-left .ub-input-box:focus-within .ub-input-icon {
          transform: scale(1.05);
        }

        .ub-panel-form-left .ub-input {
          width: 100%;
          height: 100%;
          padding: 13px 16px 13px 44px;
          background: transparent;
          border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          line-height: 20px;
          color: #1C1415;
          outline: none;
          box-sizing: border-box;
        }

        .ub-panel-form-left .ub-input::placeholder {
          color: rgba(81, 67, 68, 0.42);
          font-size: 13.5px;
        }

        .ub-panel-form-left .ub-input--pass {
          padding-right: 44px;
        }

        .ub-panel-form-left .ub-eye-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 6px;
          cursor: pointer;
          opacity: 0.75;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .ub-panel-form-left .ub-eye-toggle:hover {
          opacity: 1;
          transform: translateY(-50%) scale(1.1);
        }

        .ub-panel-form-left .ub-remember-row {
          display: flex;
          align-items: center;
          margin-top: 3px;
        }

        .ub-panel-form-left .ub-checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          user-select: none;
        }

        .ub-panel-form-left .ub-checkbox-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        .ub-panel-form-left .ub-custom-checkbox {
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
          box-shadow: 0 1px 3px rgba(100, 50, 60, 0.15);
        }

        .ub-panel-form-left .ub-checkbox-input:not(:checked) + .ub-custom-checkbox {
          background: #FDF3EF;
          border: 1.5px solid rgba(133, 79, 85, 0.35);
          box-shadow: none;
        }

        .ub-panel-form-left .ub-custom-checkbox::after {
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

        .ub-panel-form-left .ub-checkbox-input:not(:checked) + .ub-custom-checkbox::after {
          opacity: 0;
        }

        .ub-panel-form-left .ub-remember-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 400;
          font-size: 12.5px;
          line-height: 18px;
          color: #4D3F41;
        }

        .ub-panel-form-left .ub-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 48px;
          background: linear-gradient(135deg, #C58187 0%, #B36F75 100%);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 13px;
          line-height: 16px;
          letter-spacing: 1.3px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 8px 22px -3px rgba(179, 111, 117, 0.42);
          transition: all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
          margin-top: 6px;
        }

        .ub-panel-form-left .ub-submit-btn:hover {
          background: linear-gradient(135deg, #BE787E 0%, #A96269 100%);
          box-shadow: 0 10px 26px -2px rgba(179, 111, 117, 0.52);
          transform: translateY(-1px);
        }

        .ub-panel-form-left .ub-submit-btn:active {
          transform: translateY(0) scale(0.99);
        }

        .ub-panel-form-left .ub-submit-btn__arrow {
          font-size: 15px;
          transition: transform 0.2s ease;
        }
        .ub-panel-form-left .ub-submit-btn:hover .ub-submit-btn__arrow {
          transform: translateX(3px);
        }

        .ub-panel-form-left .ub-bottom-link-row {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 42px;
        }

        .ub-panel-form-left .ub-prompt-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 400;
          font-size: 13.5px;
          line-height: 20px;
          color: #4D3F41;
        }

        .ub-panel-form-left .ub-register-link {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 13.5px;
          line-height: 20px;
          color: #854F55;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: all 0.15s ease;
        }
        .ub-panel-form-left .ub-register-link:hover {
          color: #5C2F35;
          opacity: 0.9;
        }

        .ub-panel-brand-right {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 576px;
          height: 740px;
          padding: 44px 48px;
          background: radial-gradient(130% 130% at 80% 15%, #FFF6F3 0%, #FCEAE4 55%, #F7DDD5 100%);
          overflow: hidden;
          box-sizing: border-box;
          animation: swapBrandToRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes swapBrandToRight {
          0% {
            opacity: 0.2;
            transform: translateX(-45px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .ub-panel-brand-right .ub-aura {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(55px);
        }
        .ub-panel-brand-right .ub-aura--top {
          top: -70px;
          right: -70px;
          width: 320px;
          height: 320px;
          background: rgba(255, 215, 220, 0.55);
        }
        .ub-panel-brand-right .ub-aura--center {
          top: 35%;
          right: 20%;
          width: 280px;
          height: 280px;
          background: rgba(255, 240, 230, 0.5);
        }
        .ub-panel-brand-right .ub-aura--bottom {
          bottom: -80px;
          left: -80px;
          width: 340px;
          height: 340px;
          background: rgba(245, 222, 208, 0.65);
        }

        .ub-panel-brand-right .ub-couture-pattern {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(133, 79, 85, 0.03) 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.7;
        }

        .ub-panel-brand-right .ub-top-chips {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .ub-panel-brand-right .ub-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 9999px;
          user-select: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .ub-panel-brand-right .ub-chip:hover {
          transform: translateY(-1px);
        }

        .ub-panel-brand-right .ub-chip--white {
          padding: 7px 16px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(133, 79, 85, 0.12);
          box-shadow: 0 2px 8px rgba(100, 55, 60, 0.06);
          backdrop-filter: blur(8px);
        }

        .ub-panel-brand-right .ub-chip--blush {
          padding: 7px 16px;
          background: #F3E4DF;
          border: 1px solid rgba(133, 79, 85, 0.08);
        }

        .ub-panel-brand-right .ub-chip__icon {
          display: flex;
          align-items: center;
          color: #854F55;
          animation: pulseSparkle 3s ease-in-out infinite;
        }

        @keyframes pulseSparkle {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        .ub-panel-brand-right .ub-chip__text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          line-height: 14px;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          color: #854F55;
          white-space: nowrap;
        }

        .ub-panel-brand-right .ub-chip__text--taupe {
          color: #705B57;
        }

        .ub-panel-brand-right .ub-brand-center {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-top: -8px;
        }

        .ub-panel-brand-right .ub-emblem-card {
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
        .ub-panel-brand-right .ub-emblem-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 20px 42px -6px rgba(133, 79, 85, 0.22),
            0 6px 16px rgba(0, 0, 0, 0.05);
        }

        .ub-panel-brand-right .ub-emblem-inner-glow {
          position: absolute;
          inset: 2px;
          border-radius: 20px;
          border: 1px solid rgba(133, 79, 85, 0.06);
          pointer-events: none;
        }

        .ub-panel-brand-right .ub-emblem-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 2px 4px rgba(133, 79, 85, 0.08));
        }

        .ub-panel-brand-right .ub-brand-title {
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

        .ub-panel-brand-right .ub-brand-subtitle-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
        }

        .ub-panel-brand-right .ub-dash-line {
          width: 28px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(133, 79, 85, 0.4), transparent);
        }

        .ub-panel-brand-right .ub-brand-subtitle {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 13px;
          line-height: 18px;
          letter-spacing: 4.2px;
          text-transform: uppercase;
          color: #854F55;
        }

        .ub-panel-brand-right .ub-brand-tagline {
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

        .ub-panel-brand-right .ub-footer-row {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding-top: 8px;
        }

        .ub-panel-brand-right .ub-security-badge {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .ub-panel-brand-right .ub-security-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 400;
          font-size: 12px;
          line-height: 16px;
          letter-spacing: 0.1px;
          color: #6E5A56;
        }

        .ub-panel-brand-right .ub-est-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ub-panel-brand-right .ub-est-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #A0827E;
        }

        .ub-panel-brand-right .ub-est-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          line-height: 16px;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: #6E5A56;
        }

        @media (max-width: 1200px) {
          .ub-login-screen .ub-top-nav-bar {
            width: 100%;
          }
          .ub-login-card {
            width: 100vw;
            border-radius: 0;
          }
        }

        @media (max-width: 880px) {
          .ub-panel-brand-right {
            display: none;
          }
          .ub-panel-form-left {
            width: 100vw;
            height: 100vh;
            padding: 24px;
          }
          .ub-panel-form-left .ub-form-container {
            width: 100%;
            max-width: 380px;
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
              <Link to="/register" className="ub-register-link" id="register-link">
                Đăng ký ngay
              </Link>
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
