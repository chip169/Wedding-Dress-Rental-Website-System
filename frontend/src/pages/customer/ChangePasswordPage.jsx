import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, LockKeyhole, Shield, ShieldCheck } from 'lucide-react';
import AccountLayout from '../../components/layout/AccountLayout';
import { changePassword } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';

const initialValues = { current: '', next: '', confirm: '' };

export default function ChangePasswordPage() {
  const { updateToken } = useAuth();
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [touched, setTouched] = useState({ current: false, next: false, confirm: false });

  const rules = [
    { label: 'Tối thiểu 6 ký tự', pass: values.next.length >= 6 },
    { label: 'Chứa chữ hoa và chữ thường', pass: /[A-Z]/.test(values.next) && /[a-z]/.test(values.next) },
    { label: 'Chứa ít nhất một chữ số', pass: /\d/.test(values.next) },
    { label: 'Chứa ký tự đặc biệt (!@#$%...)', pass: /[^A-Za-z0-9]/.test(values.next) },
  ];

  const hasMinLength = rules[0].pass;
  const passedRules = rules.filter((rule) => rule.pass).length;
  const score = hasMinLength ? passedRules : Math.min(passedRules, 1);
  const label = score <= 1 ? 'YẾU' : score === 2 ? 'TRUNG BÌNH' : score === 3 ? 'KHÁ' : 'MẠNH (RẤT AN TOÀN)';
  const same = values.confirm && values.next === values.confirm;

  const change = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const blur = (key) => () => setTouched((current) => ({ ...current, [key]: true }));

  const reset = () => {
    setValues(initialValues);
    setVisible({ current: false, next: false, confirm: false });
    setTouched({ current: false, next: false, confirm: false });
  };

  const submit = async () => {
    setTouched({ current: true, next: true, confirm: true });
    if (!values.current || !hasMinLength || score < 2 || !same || values.next === values.current) {
      setNotice({ type: 'error', text: 'Vui lòng kiểm tra lại các trường mật khẩu.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const result = await changePassword({ currentPassword: values.current, newPassword: values.next });
      if (result.token) updateToken(result.token);
      reset();
      setNotice({ type: 'success', text: 'Đổi mật khẩu thành công. Hãy ghi nhớ mật khẩu mới của bạn!' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountLayout hideBreadcrumb={true} breadcrumb={[]}>
      <section className="profile-card rounded-lg bg-white px-5 py-7 sm:px-7" aria-labelledby="password-title">
        <p className="account-overline text-[#874e57]">Bảo mật tài khoản & sự riêng tư</p>
        <h1 id="password-title" className="mt-1 font-playfair text-[25px]">
          Đổi Mật Khẩu
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#6c5b57]">
          Cập nhật mật khẩu định kỳ để bảo vệ tài khoản thành viên, thông tin số đo may đo và lịch trình riêng tư phục vụ nàng.
        </p>
        <div className="account-heading-rule mt-3" />

        {notice && (
          <div
            className={`mt-4 rounded-md p-3 text-sm ${
              notice.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="mt-6 space-y-6">
          <div>
            <div className="flex items-end justify-between gap-3">
              <span className="account-overline mb-2 font-semibold">Mật khẩu hiện tại *</span>
              <Link to="/forgot-password" className="mb-2 text-xs text-[#874e57] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <span className="relative block">
              <LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#967c79]" />
              <input
                type={visible.current ? 'text' : 'password'}
                value={values.current}
                onChange={change('current')}
                onBlur={blur('current')}
                autoComplete="current-password"
                aria-label="Mật khẩu hiện tại"
                placeholder="Nhập mật khẩu đang dùng..."
                className="w-full border border-[#eadbd8] bg-[#fff8f6] py-3 pl-10 pr-12 text-sm outline-none focus:border-[#874e57]"
              />
              <button
                type="button"
                aria-label={visible.current ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                onClick={() => setVisible((current) => ({ ...current, current: !current.current }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#967c79]"
              >
                {visible.current ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
            {touched.current && !values.current && (
              <p className="mt-2 text-xs text-red-700">Vui lòng nhập mật khẩu hiện tại.</p>
            )}
          </div>

          <div>
            <label className="block">
              <span className="account-overline mb-2 block font-semibold">Mật khẩu mới *</span>
              <span className="relative block">
                <LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#967c79]" />
                <input
                  type={visible.next ? 'text' : 'password'}
                  value={values.next}
                  onChange={change('next')}
                  onBlur={blur('next')}
                  autoComplete="new-password"
                  aria-label="Mật khẩu mới"
                  placeholder="Nhập mật khẩu mới từ 6 ký tự..."
                  className="w-full border border-[#eadbd8] bg-[#fff8f6] py-3 pl-10 pr-12 text-sm outline-none focus:border-[#874e57]"
                />
                <button
                  type="button"
                  aria-label={visible.next ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                  onClick={() => setVisible((current) => ({ ...current, next: !current.next }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#967c79]"
                >
                  {visible.next ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-wider text-[#766966]">
              <span>Độ mạnh mật khẩu:</span>
              <strong className="text-[#874e57]">{values.next ? label : 'CHƯA NHẬP'}</strong>
            </div>

            <div className="mt-2 grid grid-cols-4 gap-1">
              {rules.map((rule, index) => (
                <span
                  key={rule.label}
                  className={`h-1.5 rounded-sm ${index < score ? 'bg-[#874e57]' : 'bg-[#eadbd8]'}`}
                />
              ))}
            </div>

            <div className="mt-3 rounded-sm bg-[#fff8f6] px-4 py-3">
              <p className="account-overline mb-3">Tiêu chuẩn mật khẩu an toàn UniBridal:</p>
              <div className="grid gap-2 text-xs text-[#766966] sm:grid-cols-2">
                {rules.map((rule) => (
                  <p key={rule.label} className={`flex items-center gap-2 ${rule.pass ? 'text-[#874e57]' : ''}`}>
                    <CheckCircle2 size={14} />
                    {rule.label}
                  </p>
                ))}
              </div>
            </div>

            {touched.next && !hasMinLength && (
              <p className="mt-2 text-xs text-red-700">Mật khẩu mới phải có tối thiểu 6 ký tự.</p>
            )}
            {touched.next && hasMinLength && score < 2 && (
              <p className="mt-2 text-xs text-red-700">Mật khẩu mới còn yếu. Hãy thêm chữ hoa, số hoặc ký tự đặc biệt.</p>
            )}
            {touched.next && values.next && values.next === values.current && (
              <p className="mt-2 text-xs text-red-700">Mật khẩu mới phải khác mật khẩu hiện tại.</p>
            )}
          </div>

          <div>
            <label className="block">
              <span className="account-overline mb-2 block font-semibold">Xác nhận mật khẩu mới *</span>
              <span className="relative block">
                <ShieldCheck size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#967c79]" />
                <input
                  type={visible.confirm ? 'text' : 'password'}
                  value={values.confirm}
                  onChange={change('confirm')}
                  onBlur={blur('confirm')}
                  autoComplete="new-password"
                  aria-label="Xác nhận mật khẩu mới"
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full border border-[#eadbd8] bg-[#fff8f6] py-3 pl-10 pr-12 text-sm outline-none focus:border-[#874e57]"
                />
                <button
                  type="button"
                  aria-label={visible.confirm ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                  onClick={() => setVisible((current) => ({ ...current, confirm: !current.confirm }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#967c79]"
                >
                  {visible.confirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            <p className={`mt-2 flex items-center gap-1 text-xs ${values.confirm && !same ? 'text-red-700' : 'text-[#874e57]'}`}>
              <CheckCircle2 size={14} />
              {same
                ? 'Mật khẩu xác nhận trùng khớp.'
                : values.confirm
                ? 'Mật khẩu xác nhận chưa trùng khớp.'
                : 'Nhập lại mật khẩu mới để xác nhận.'}
            </p>
          </div>

          <div className="flex gap-3 rounded-md bg-[#f8e9e4] p-4 text-sm">
            <Shield size={21} className="shrink-0 text-[#874e57]" />
            <div>
              <strong>Lưu ý an toàn từ UniBridal</strong>
              <p className="mt-2 text-xs leading-5 text-[#766966]">
                Không chia sẻ mật khẩu hoặc OTP cho bất kỳ ai. Chuyên viên tư vấn UniBridal tuyệt đối không bao giờ yêu cầu cung cấp mật khẩu qua điện thoại hoặc tin nhắn.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button type="button" onClick={reset} className="account-button-secondary">
              LÀM LẠI
            </button>
            <button type="button" disabled={saving} onClick={submit} className="account-button-primary">
              {saving ? 'ĐANG LƯU...' : 'LƯU MẬT KHẨU MỚI'}
            </button>
          </div>
        </div>
      </section>
    </AccountLayout>
  );
}
