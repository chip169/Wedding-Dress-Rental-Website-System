import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, ConfigProvider, Form, Input, InputNumber } from 'antd';
import { Ruler, IdCard, Sparkles, Lock } from 'lucide-react';
import AccountLayout from '../../components/layout/AccountLayout';
import { getProfile, saveProfile } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';

const measurementRules = [{
  validator: (_, value) => value == null || value === '' || (Number.isFinite(value) && value > 0 && value <= 500)
    ? Promise.resolve()
    : Promise.reject(new Error('Số đo phải lớn hơn 0 và không vượt quá 500.')),
}];

const measurementFields = [
  ['height', 'Chiều cao (cm)'],
  ['weight', 'Cân nặng (kg)'],
  ['bust', 'Vòng 1 - Ngực (cm)'],
  ['waist', 'Vòng 2 - Eo (cm)'],
  ['hips', 'Vòng 3 - Mông (cm)'],
  ['heel', 'Chiều cao giày cưới dự kiến (cm)'],
];

function MeasurementField({ name, label }) {
  const isHeel = name === 'heel';
  return (
    <Form.Item name={name} label={<span className="font-semibold uppercase tracking-wider text-[11px]">{label}</span>} rules={isHeel ? undefined : measurementRules}>
      <InputNumber mode="input" min={0} max={isHeel ? undefined : 500} step={1} size="large" className="!w-full !bg-[#fff8f6]" />
    </Form.Item>
  );
}

const profilePageStyles = `
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
.profile-form .ant-input:hover, .profile-form .ant-input:focus { border-color: #b8737d; }
@media (min-width: 1024px) {
  .profile-identity { padding-top: 14px; padding-bottom: 14px; }
  .profile-form .ant-form-item { margin-bottom: 12px; }
  .profile-form .ant-form-item-label, .profile-form .ant-form-item-label > label { line-height: 16px; }
}
@media (max-width: 1023px) { .profile-main { min-height: auto; } }
@media (max-width: 479px) {
  .profile-cancel { min-width: 95px; }
}
`;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const emptyProfile = {
    name: '',
    phone: '',
    email: '',
    gender: 'unspecified',
    birthday: '',
    avatar: '',
    address: '',
    idCard: '',
    weddingDate: '',
    height: '',
    weight: '',
    bust: '',
    waist: '',
    hips: '',
    heel: '',
  };
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [reload, setReload] = useState(0);
  const [saved, setSaved] = useState(user || emptyProfile);
  const [notice, setNotice] = useState(null);
  const [form] = Form.useForm();
  const noticeTimerRef = useRef(null);
  const avatar = saved.avatar || '';

  const notify = (type, text) => {
    setNotice({ type, text });
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => {
      setNotice(null);
    }, 4500);
  };

  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    setProfileError('');
    getProfile()
      .then((profile) => {
        if (!active) return;
        setSaved(profile);
        form.setFieldsValue(profile);
        updateUser(profile);
      })
      .catch((error) => {
        if (active) setProfileError(error.message || 'Không tải được thông tin hồ sơ.');
      }).finally(() => { if (active) setProfileLoading(false); });
    return () => {
      active = false;
    };
  }, [form, reload]);

  // Tự động cuộn đến mục số đo khi có hash #measurements
  useEffect(() => {
    if (location.hash === '#measurements') {
      setTimeout(() => {
        const el = document.getElementById('measurements');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 350);
    }
  }, [location.hash]);

  useEffect(() => () => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
  }, []);

  const today = new Date();
  const maxBirthday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cancel = () => {
    form.setFieldsValue(saved);
    notify('info', 'Đã khôi phục thông tin được lưu gần nhất.');
  };

  const submit = async (values) => {
    // Validate không cho phép sửa email đã đăng ký
    if (saved?.email && values.email && values.email.trim().toLowerCase() !== saved.email.trim().toLowerCase()) {
      notify('error', 'Không được phép thay đổi địa chỉ email đã đăng ký tài khoản.');
      return;
    }

    const profile = {
      ...saved,
      ...values,
      name: values.name?.trim(),
      email: saved?.email || values.email?.trim(), // Luôn bảo toàn email cố định
      phone: values.phone?.trim(),
      address: values.address?.trim(),
      idCard: values.idCard?.trim(),
      avatar,
    };
    setSaving(true);
    try {
      const updated = await saveProfile(profile);
      setSaved(updated);
      updateUser(updated);
      form.setFieldsValue(updated);
      notify('success', 'Đã cập nhật thông tin hồ sơ & số đo vóc dáng thành công.');
    } catch (error) {
      notify('error', error.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally { setSaving(false); }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#874e57',
          colorBorder: '#eee2df',
          borderRadius: 4,
          fontFamily: 'inherit',
          colorText: '#2c2221',
        },
        components: {
          InputNumber: { handleVisible: true },
        },
      }}
    >

      {/* Floating Notification Toast */}
      {notice && (
        <div className="fixed top-8 right-6 z-[9999] max-w-sm sm:max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="shadow-[0_12px_36px_rgba(44,36,36,0.18)] rounded-xl overflow-hidden backdrop-blur-md">
            <Alert
              type={notice.type}
              message={
                <div className="flex flex-col pr-2">
                  <span className="font-semibold text-[13px] text-[#2C2424]">
                    {notice.type === 'success'
                      ? 'Thành công'
                      : notice.type === 'error'
                        ? 'Lỗi'
                        : 'Thông báo'}
                  </span>
                  <span className="text-[12px] text-[#554543] mt-0.5 leading-snug">
                    {notice.text}
                  </span>
                </div>
              }
              showIcon
              closable
              onClose={() => setNotice(null)}
              className="border border-[#EADBCE] bg-[#FFFBF9]/95 rounded-xl px-4 py-3"
            />
          </div>
        </div>
      )}

      <style>{profilePageStyles}</style>
      <AccountLayout hideBreadcrumb={true} breadcrumb={[]}>
        <section className="profile-card rounded-2xl bg-white px-5 py-7 sm:px-8 border border-[#F0E5DC] shadow-[0_4px_24px_rgba(44,37,35,0.03)]" aria-labelledby="profile-title">
          <h1 id="profile-title" className="mt-1 font-playfair text-[26px] sm:text-[28px] font-semibold text-[#2C2523]">
            Hồ Sơ Người Dùng
          </h1>

          <div className="account-heading-rule mt-3" />
          {profileError && <p role="alert" className="mt-4 text-sm text-red-700">{profileError} <button type="button" onClick={() => setReload((value) => value + 1)} className="underline">Thử lại</button></p>}

          {/* Avatar */}
          <div className="profile-identity mt-6 flex flex-wrap items-center gap-5 border-b border-[#eee2df] pb-6">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#D498A0] bg-[#fff8f6] shadow-sm">
              {avatar ? (
                <img src={avatar} alt="Ảnh đại diện của nàng" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-playfair text-2xl text-[#874e57]">
                  {saved.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={saved}
            onFinish={submit}
            className="profile-form mt-6"
          >
            {/* 1. THÔNG TIN CƠ BẢN */}
            <div className="pb-3 mb-4">
              <h3 className="font-playfair text-[18px] font-semibold text-[#2C2523] mb-1">
                1. Thông Tin  Liên Hệ
              </h3>


              <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                <Form.Item
                  label={<span className="font-semibold uppercase tracking-wider text-[11px]">Họ và tên</span>}
                  name="name"
                  rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập họ và tên của bạn.' }]}
                >
                  <Input placeholder="Nhập họ và tên cô dâu..." size="large" />
                </Form.Item>

                <Form.Item
                  label={<span className="font-semibold uppercase tracking-wider text-[11px]">Số điện thoại</span>}
                  name="phone"
                  rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập số điện thoại liên lạc.' }]}
                >
                  <Input placeholder="Nhập số điện thoại liên hệ..." size="large" />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                <Form.Item
                  label={
                    <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span>Địa chỉ email</span>
                      <Lock size={12} className="text-[#874e57]" />
                      <span className="text-[10px] lowercase text-[#8C7A7B] font-normal tracking-normal">
                        (cố định theo tài khoản)
                      </span>
                    </span>
                  }
                  name="email"
                  tooltip="Địa chỉ email dùng để định danh tài khoản và nhận thông báo đơn hàng/biên bản, không thể thay đổi."
                  rules={[
                    { required: true, message: 'Vui lòng nhập địa chỉ email.' },
                    { type: 'email', message: 'Địa chỉ email không đúng định dạng.' },
                    () => ({
                      validator(_, value) {
                        if (saved?.email && value && value.trim().toLowerCase() !== saved.email.trim().toLowerCase()) {
                          return Promise.reject(new Error('Không được phép thay đổi địa chỉ email đã đăng ký.'));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input
                    placeholder="email@domain.com"
                    size="large"
                    disabled
                    className="!bg-[#F6EFEB] !text-[#6B5E5F] !cursor-not-allowed border-[#E5DAD4]"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="font-semibold uppercase tracking-wider text-[11px]">Ngày sinh</span>}
                  name="birthday"
                >
                  <Input type="date" max={maxBirthday} size="large" />
                </Form.Item>
              </div>
            </div>

            {/* 2. THÔNG TIN PHÁP LÝ & GIAO NHẬN LỄ PHỤC */}
            <div className="pt-5 border-t border-[#eee2df] pb-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <IdCard className="w-4 h-4 text-[#874e57]" />
                <h3 className="font-playfair text-[18px] font-semibold text-[#2C2523] m-0">
                  2. Thông Tin Pháp Lý
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                <Form.Item
                  label={<span className="font-semibold uppercase tracking-wider text-[11px]">Số CCCD / CMND</span>}
                  name="idCard"
                  rules={[{ pattern: /^(\d{9}|\d{12})$/, message: 'CCCD/CMND cần gồm 9 hoặc 12 chữ số.' }]}
                >
                  <Input placeholder="Nhập 12 số CCCD gắn chip..." size="large" />
                </Form.Item>


              </div>

              <Form.Item
                label={<span className="font-semibold uppercase tracking-wider text-[11px]">Địa chỉ</span>}
                name="address"
              >
                <Input placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..." size="large" />
              </Form.Item>
            </div>

            {/* 3. THÔNG SỐ VÓC DÁNG & SỐ ĐO CÔ DÂU (ANCHOR: #measurements) */}
            <div id="measurements" className="pt-5 border-t border-[#eee2df] pb-2 scroll-mt-24">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-[#874e57]" />
                  <h3 className="font-playfair text-[18px] font-semibold text-[#2C2523] m-0">
                    3. Thông Số Đo
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#2E7D32]" /> Tinh chỉnh may đo miễn phí
                </span>
              </div>


              <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
                {measurementFields.slice(0, 4).map(([name, label]) => <MeasurementField key={name} name={name} label={label} />)}
              </div>
              <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                {measurementFields.slice(4).map(([name, label]) => <MeasurementField key={name} name={name} label={label} />)}
              </div>
            </div>

            <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 mt-4">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Toàn bộ thông tin hồ sơ &amp; số đo vóc dáng được lưu trữ trực tiếp và đồng bộ trên cơ sở dữ liệu hệ thống.</span>
            </p>

            {/* Submit / Reset Actions */}
            <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-[#eee2df] pt-6">
              <button type="button" onClick={cancel} className="account-button-secondary">
                HỦY THAY ĐỔI
              </button>
              <button type="submit" disabled={saving || profileLoading || !!profileError} className="account-button-primary disabled:opacity-50">
                {saving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
              </button>
            </div>
          </Form>
        </section>
      </AccountLayout>
    </ConfigProvider>
  );
}
