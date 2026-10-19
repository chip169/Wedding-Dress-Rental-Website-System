const PROFILE_KEY = 'unibridal.demoProfile.v1';

export const DEFAULT_PROFILE = {
  name: 'Nguyễn Mai Phương',
  phone: '0908 123 888',
  email: 'mai.phuong@unibridal.com',
  gender: 'female',
  birthday: '1998-08-15',
  avatar: '',
};

// Local preview only. Replace this adapter with the profile API when available.
export function loadProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    if (!stored) return { profile: { ...DEFAULT_PROFILE } };
    const profile = Object.fromEntries(Object.entries(DEFAULT_PROFILE).map(([key, value]) => [key, typeof stored[key] === 'string' ? stored[key] : value]));
    if (!/^data:image\/(png|jpeg);base64,/.test(profile.avatar)) profile.avatar = '';
    return { profile };
  } catch {
    return { profile: { ...DEFAULT_PROFILE }, error: 'Không thể đọc dữ liệu đã lưu trên trình duyệt. Đang hiển thị hồ sơ mẫu.' };
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
}
