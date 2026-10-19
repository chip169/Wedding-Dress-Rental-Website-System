import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, FileLock2, Info, LockKeyhole, Shield, ShieldCheck } from 'lucide-react';
import AccountLayout from '../../components/layout/AccountLayout';
import './AccountPages.css';

const initialValues = { current: '', next: '', confirm: '' };

export default function ChangePasswordPage() {
  const [values, setValues] = useState(initialValues);
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [logoutOthers, setLogoutOthers] = useState(false);
  const [touched, setTouched] = useState({ current: false, next: false, confirm: false });
  const rules = [
    { label: 'Tối thiểu 8 ký tự', pass: values.next.length >= 8 },
    { label: 'Chứa chữ hoa và chữ thường', pass: /[A-Z]/.test(values.next) && /[a-z]/.test(values.next) },
    { label: 'Chứa ít nhất một chữ số', pass: /\d/.test(values.next) },
    { label: 'Chứa ký tự đặc biệt (!@#$%...)', pass: /[^A-Za-z0-9]/.test(values.next) },
  ];
  const score = rules.filter((rule) => rule.pass).length;
  const label = score <= 1 ? 'YẾU' : score === 2 ? 'TRUNG BÌNH' : score === 3 ? 'KHÁ' : 'MẠNH (RẤT AN TOÀN)';
  const same = values.confirm && values.next === values.confirm;
  const change = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const blur = (key) => () => setTouched((current) => ({ ...current, [key]: true }));
  const reset = () => { setValues(initialValues); setVisible({ current: false, next: false, confirm: false }); setLogoutOthers(false); setTouched({ current: false, next: false, confirm: false }); };

  return <AccountLayout breadcrumb={[{ label: 'Đổi mật khẩu' }]}>
    <section className="profile-card rounded-lg bg-white px-5 py-7 sm:px-7" aria-labelledby="password-title">
      <p className="account-overline text-[#874e57]">Bảo mật tài khoản & sự riêng tư</p>
      <h1 id="password-title" className="mt-1 font-playfair text-[25px]">Đổi Mật Khẩu</h1>
      <p className="mt-2 text-sm leading-6 text-[#6c5b57]">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản thành viên, thông tin số đo may đo và lịch trình riêng tư phục vụ nàng.</p>
      <div className="account-heading-rule mt-3" />
      <div className="mt-6 space-y-6">
        <div><div className="flex items-end justify-between gap-3"><span className="account-overline mb-2 font-semibold">Mật khẩu hiện tại *</span><Link to="/forgot-password" className="mb-2 text-xs text-[#874e57] hover:underline">Quên mật khẩu?</Link></div><span className="relative block"><LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#967c79]" /><input type={visible.current ? 'text' : 'password'} value={values.current} onChange={change('current')} onBlur={blur('current')} autoComplete="current-password" aria-label="Mật khẩu hiện tại" className="w-full border border-[#eadbd8] bg-[#fff8f6] py-3 pl-10 pr-12 text-sm outline-none focus:border-[#874e57]" /><button type="button" aria-label={visible.current ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'} onClick={() => setVisible((current) => ({ ...current, current: !current.current }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#967c79]">{visible.current ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>{touched.current && !values.current && <p className="mt-2 text-xs text-red-700">Vui lòng nhập mật khẩu hiện tại.</p>}</div>
        <div><label className="block"><span className="account-overline mb-2 block font-semibold">Mật khẩu mới *</span><span className="relative block"><LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#967c79]" /><input type={visible.next ? 'text' : 'password'} value={values.next} onChange={change('next')} onBlur={blur('next')} autoComplete="new-password" aria-label="Mật khẩu mới" className="w-full border border-[#eadbd8] bg-[#fff8f6] py-3 pl-10 pr-12 text-sm outline-none focus:border-[#874e57]" /><button type="button" aria-label={visible.next ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'} onClick={() => setVisible((current) => ({ ...current, next: !current.next }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#967c79]">{visible.next ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label><div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-wider text-[#766966]"><span>Độ mạnh mật khẩu:</span><strong className="text-[#874e57]">{values.next ? label : 'CHƯA NHẬP'}</strong></div><div aria-label={`Độ mạnh mật khẩu: ${values.next ? label : 'chưa nhập'}`} className="mt-2 grid grid-cols-4 gap-1">{rules.map((rule, index) => <span key={rule.label} className={`h-1.5 rounded-sm ${index < score ? 'bg-[#874e57]' : 'bg-[#eadbd8]'}`} />)}</div><div className="mt-3 rounded-sm bg-[#fff8f6] px-4 py-3"><p className="account-overline mb-3">Tiêu chuẩn mật khẩu an toàn UniBridal:</p><div className="grid gap-2 text-xs text-[#766966] sm:grid-cols-2">{rules.map((rule) => <p key={rule.label} className={`flex items-center gap-2 ${rule.pass ? 'text-[#874e57]' : ''}`}><CheckCircle2 size={14} />{rule.label}</p>)}</div></div>{touched.next && values.next && score < 4 && <p className="mt-2 text-xs text-red-700">Mật khẩu mới chưa đáp ứng đủ tiêu chuẩn.</p>}{touched.next && values.next && values.next === values.current && <p className="mt-2 text-xs text-red-700">Mật khẩu mới cần khác mật khẩu hiện tại.</p>}</div>
        <div><label className="block"><span className="account-overline mb-2 block font-semibold">Xác nhận mật khẩu mới *</span><span className="relative block"><ShieldCheck size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#967c79]" /><input type={visible.confirm ? 'text' : 'password'} value={values.confirm} onChange={change('confirm')} onBlur={blur('confirm')} autoComplete="new-password" aria-label="Xác nhận mật khẩu mới" className="w-full border border-[#eadbd8] bg-[#fff8f6] py-3 pl-10 pr-12 text-sm outline-none focus:border-[#874e57]" /><button type="button" aria-label={visible.confirm ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'} onClick={() => setVisible((current) => ({ ...current, confirm: !current.confirm }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#967c79]">{visible.confirm ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label><p className={`mt-2 flex items-center gap-1 text-xs ${values.confirm && !same ? 'text-red-700' : 'text-[#874e57]'}`}><CheckCircle2 size={14} />{same ? 'Mật khẩu xác nhận trùng khớp.' : values.confirm ? 'Mật khẩu xác nhận chưa trùng khớp.' : 'Nhập lại mật khẩu mới để xác nhận.'}</p></div>
        <div className="border-t border-[#f0e9e6] pt-5"><p className="account-overline mb-3 text-[#874e57]">Thiết lập bảo mật bổ sung</p><label className="flex cursor-pointer items-start gap-3 rounded-sm border border-[#f1e4e1] bg-[#fff8f6] p-4"><input type="checkbox" checked={logoutOthers} onChange={(event) => setLogoutOthers(event.target.checked)} className="mt-1 accent-[#874e57]" /><span><strong className="text-sm">Đăng xuất khỏi tất cả các thiết bị khác</strong><small className="mt-1 block text-xs leading-5 text-[#766966]">Tự động kết thúc phiên làm việc trên các trình duyệt hoặc máy tính khác để đảm bảo an toàn tuyệt đối.</small></span></label></div>
        <div className="flex gap-3 rounded-md bg-[#f8e9e4] p-4 text-sm"><Shield size={21} className="shrink-0 text-[#874e57]" /><div><strong>Lưu ý an toàn từ UniBridal</strong><p className="mt-2 text-xs leading-5 text-[#766966]">Không chia sẻ mật khẩu hoặc OTP cho bất kỳ ai. Chuyên viên tư vấn UniBridal tuyệt đối không bao giờ yêu cầu cung cấp mật khẩu qua điện thoại hoặc tin nhắn.</p></div></div>
        <div className="border-t border-[#f0e9e6] pt-5"><p className="mb-4 flex items-start gap-2 text-xs leading-5 text-[#766966]"><Info size={16} className="shrink-0 text-[#874e57]" />Chưa thể lưu mật khẩu vì hệ thống xác thực chưa được kết nối. Thông tin nhập ở đây không được gửi đi hoặc lưu lại.</p><div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={reset} className="account-button-secondary">HỦY BỎ</button><button type="button" disabled className="account-button-primary cursor-not-allowed opacity-60"><FileLock2 size={14} className="mr-1 inline" /> LƯU THAY ĐỔI MẬT KHẨU</button></div></div>
      </div>
    </section>
  </AccountLayout>;
}

