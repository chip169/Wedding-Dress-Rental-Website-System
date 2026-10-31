import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, ConfigProvider, Form, Input, Select } from 'antd';
import { BadgeCheck, Camera, Check, IdCard, Upload } from 'lucide-react';
import AccountLayout from '../../components/layout/AccountLayout';
import emblemImg from '../../assets/images/unibridal-emblem-transparent.png';
import { getProfile, saveProfile } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';

const profileStyles = `
:where(.profile-page) :is(h1, h2, h3, h4, p) { margin: 0; }
:where(.profile-page) button { background-color: transparent; font-family: inherit; cursor: pointer; }
.profile-page { background: #fff8f6; }
.profile-main { min-height: 809.5px; }
.profile-page button, .profile-page a, .profile-page input { -webkit-tap-highlight-color: transparent; }
.profile-page :is(button, a, input):focus-visible { outline: 2px solid #874e57; outline-offset: 4px; }
.profile-form .ant-form-item { margin-bottom: 16px; }
.profile-form .ant-form-item-label { padding-bottom: 4px; }
.profile-form .ant-form-item-label > label { font-size: 11px; height: auto; color: #514344; }
.profile-form .ant-input { background: #fff8f6; }
.profile-form .ant-select { width: 100%; }
.profile-form .ant-select-selector { background: #fff8f6 !important; }
.profile-form .ant-input:hover, .profile-form .ant-input:focus { border-color: #b8737d; }
.profile-footer { background: #fff1ed; min-height: 378px; }
@media (min-width: 1024px) {
  .profile-identity { padding-top: 14px; padding-bottom: 14px; }
  .profile-contact-title { margin-bottom: 8px; }
  .profile-form .ant-form-item { margin-bottom: 9px; }
  .profile-form .ant-form-item-label, .profile-form .ant-form-item-label > label { line-height: 16px; }
  .profile-sidebar nav > button { padding-top: 8.5px; padding-bottom: 8.5px; }
  .profile-sidebar nav > button:last-child { padding-top: 9px; padding-bottom: 8px; }
}
@media (max-width: 1023px) { .profile-main { min-height: auto; } }
@media (max-width: 479px) {
  .profile-cancel { min-width: 95px; }
  .profile-card { padding-left: 18px; padding-right: 18px; }
}
`;

export default function ProfilePage() {
  const { user, logout: logoutAccount, updateUser } = useAuth();
  const emptyProfile = { name: '', phone: '', email: '', gender: 'unspecified', birthday: '', avatar: '' };
  const [saved, setSaved] = useState(user || emptyProfile);
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [notice, setNotice] = useState(null);
  const [avatarError, setAvatarError] = useState('');
  const [readingAvatar, setReadingAvatar] = useState(false);
  const [form] = Form.useForm();
  const uploadRef = useRef(null);
  const readerRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    getProfile().then((profile) => {
      if (!active) return;
      setSaved(profile); setAvatar(profile.avatar); form.setFieldsValue(profile); updateUser(profile);
    }).catch((error) => { if (active) setNotice({ type: 'error', text: error.message || 'Không tải được hồ sơ.' }); });
    return () => { active = false; };
  }, [form]);
  useEffect(() => () => { readerRef.current?.abort(); readerRef.current = null; }, []);
  const today = new Date();
  const maxBirthday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cancel = () => {
    readerRef.current?.abort();
    readerRef.current = null;
    setReadingAvatar(false);
    form.setFieldsValue(saved);
    form.setFields(['name', 'phone', 'email', 'gender', 'birthday'].map((name) => ({ name, errors: [] })));
    setAvatar(saved.avatar);
    setAvatarError('');
    setNotice({ type: 'info', text: 'Đã khôi phục thông tin được lưu gần nhất.' });
  };

  const submit = async (values) => {
    const profile = { ...saved, ...values, name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(), avatar };
    try {
      const updated = await saveProfile(profile);
      setSaved(updated); updateUser(updated); form.setFieldsValue(updated);
      setNotice({ type: 'success', text: 'Đã cập nhật hồ sơ.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Không thể cập nhật hồ sơ.' });
    }
  };

  const uploadAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    readerRef.current?.abort();
    setReadingAvatar(false);
    setAvatarError('');
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setAvatarError('Vui lòng chọn ảnh JPG hoặc PNG, dung lượng tối đa 5MB.');
      return;
    }
    setReadingAvatar(true);
    const reader = new FileReader();
    readerRef.current = reader;
    reader.onload = () => {
      const image = new Image();
      image.onload = () => { if (readerRef.current === reader) { setAvatar(reader.result); setReadingAvatar(false); } };
      image.onerror = () => { if (readerRef.current === reader) { setAvatarError('Tệp ảnh không hợp lệ hoặc đã bị hỏng.'); setReadingAvatar(false); } };
      image.src = reader.result;
    };
    reader.onerror = () => { setAvatarError('Không thể đọc ảnh. Vui lòng thử lại.'); setReadingAvatar(false); };
    reader.readAsDataURL(file);
  };

  const logout = () => {
    logoutAccount(); navigate('/login');
  };

  return <ConfigProvider theme={{ token: { colorPrimary: '#874e57', colorText: '#302725', colorBorder: '#eadbd8', borderRadius: 2, controlHeight: 44, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }, components: { Input: { activeShadow: '0 0 0 2px #b8737d20' }, Select: { selectorBg: '#fff8f6' } } }}>
    <AccountLayout onLogout={logout} breadcrumb={[{ label: 'Chỉnh Sửa Hồ Sơ' }]}>
          <style>{profileStyles}</style>
          <section className="profile-card rounded-lg bg-white px-5 py-8 sm:px-7" aria-labelledby="profile-title">
            <p className="mb-2 text-[11px] uppercase tracking-[1px] text-[#874e57]">Thông tin cá nhân</p>
            <h1 id="profile-title" className="font-playfair text-[23px] font-normal leading-tight">Chỉnh Sửa Hồ Sơ</h1>
            <p className="mb-3 mt-2 text-sm text-[#6c5b57]">Cập nhật thông tin liên hệ của bạn.</p>
            <div className="mb-7 h-0.5 w-12 bg-[#b8737d]" />
            {notice && <Alert className="mb-5" type={notice.type} showIcon title={notice.text} closable onClose={() => setNotice(null)} />}
            <>
              <div className="profile-identity mb-7 flex items-center gap-4 rounded-lg border border-[#f1e1dd] bg-[#fff8f6] p-4">
                <div className="relative shrink-0">
                  <img src={avatar || emblemImg} alt="Ảnh đại diện của bạn" className={`h-[84px] w-[84px] rounded-[18px] border-2 border-[#e6c9c9] bg-white ${avatar ? 'object-cover' : 'object-contain p-1'}`} />
                  <span className="absolute -bottom-0.5 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#874e57] text-white"><Camera size={11} /></span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h2 className="break-words text-lg font-semibold">{saved.name || 'Tài khoản của bạn'}</h2></div>
                  <p className="mb-2 mt-1 text-xs text-[#6c5b57]">Định dạng hỗ trợ: JPG, PNG tối đa 5MB</p>
                  <button type="button" onClick={() => uploadRef.current?.click()} disabled={readingAvatar} className="flex items-center gap-1.5 border border-[#eadbd8] bg-white px-3 py-1.5 text-[11px] text-[#874e57] hover:bg-[#f9ebe8] disabled:opacity-60"><Upload size={13} />{readingAvatar ? 'ĐANG ĐỌC ẢNH…' : 'ĐỔI ẢNH ĐẠI DIỆN'}</button>
                  <input ref={uploadRef} type="file" accept="image/jpeg,image/png" aria-label="Chọn ảnh đại diện" className="hidden" onChange={uploadAvatar} />
                </div>
              </div>
              {avatarError && <Alert type="error" showIcon title={avatarError} className="mb-4" />}
              <h2 className="profile-contact-title mb-4 flex items-center gap-2 border-b border-[#f0e9e6] pb-2 text-lg font-semibold"><IdCard size={18} className="text-[#874e57]" />1. Thông Tin Liên Hệ</h2>
              <Form form={form} layout="vertical" initialValues={saved} onFinish={submit} requiredMark={false} scrollToFirstError className="profile-form">
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                  <Form.Item name="name" label="HỌ VÀ TÊN" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên.' }, { max: 100, message: 'Họ và tên tối đa 100 ký tự.' }]}><Input autoComplete="name" maxLength={100} /></Form.Item>
                  <Form.Item name="phone" label="SỐ ĐIỆN THOẠI" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại.' }, { validator: (_, value) => !value || /^(0\d{9}|\+84\d{9})$/.test(value.replace(/[\s.-]/g, '')) ? Promise.resolve() : Promise.reject(new Error('Nhập số điện thoại Việt Nam hợp lệ.')) }]}><Input type="tel" autoComplete="tel" /></Form.Item>
                  <Form.Item name="email" label="ĐỊA CHỈ EMAIL" rules={[{ required: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Địa chỉ email chưa hợp lệ.' }]}><Input autoComplete="email" type="email" /></Form.Item>
                  <Form.Item name="gender" label="GIỚI TÍNH" rules={[{ required: true, message: 'Vui lòng chọn giới tính.' }]}><Select options={[{ value: 'female', label: 'Nữ' }, { value: 'male', label: 'Nam' }, { value: 'other', label: 'Khác' }, { value: 'unspecified', label: 'Không muốn chia sẻ' }]} /></Form.Item>
                  <Form.Item name="birthday" label="NGÀY SINH" className="sm:col-span-2" rules={[{ validator: (_, value) => !value || (value >= '1900-01-01' && value <= maxBirthday) ? Promise.resolve() : Promise.reject(new Error('Ngày sinh phải từ năm 1900 đến hôm nay.')) }]}><Input type="date" min="1900-01-01" max={maxBirthday} autoComplete="bday" /></Form.Item>
                </div>
                <div className="mt-3 flex flex-col gap-4 border-t border-[#f0e9e6] pt-4 xl:flex-row xl:items-center xl:justify-between">
                  <p className="flex items-center gap-2 text-xs text-[#6c5b57]"><BadgeCheck size={18} className="shrink-0 text-[#b8737d]" />Thông tin liên hệ và ảnh được đồng bộ; giới tính và ngày sinh lưu trên thiết bị này.</p>
                  <div className="flex gap-2"><button type="button" onClick={cancel} className="profile-cancel min-w-[126px] flex-1 border border-[#eadbd8] bg-white px-4 py-2.5 text-[13px] tracking-wider hover:bg-[#fff8f6]">HỦY BỎ</button><button type="submit" disabled={readingAvatar} className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-[#874e57] px-6 py-2.5 text-[13px] tracking-wider text-white hover:bg-[#703d45] disabled:opacity-50"><Check size={16} />LƯU THAY ĐỔI</button></div>
                </div>
              </Form>
            </>
          </section>
    </AccountLayout>
  </ConfigProvider>;
}
