import axiosClient from '../api/axiosClient';

const extrasKey = (id) => `unibridal.profile.extras.${id}`;
function localExtras(id) {
  try { return JSON.parse(localStorage.getItem(extrasKey(id)) || '{}'); } catch { return {}; }
}

export const getProfile = async () => {
  const profile = (await axiosClient.get('/profile')).data;
  return { ...profile, gender: 'unspecified', birthday: '', ...localExtras(profile.id) };
};
export const saveProfile = async (profile) => {
  const updated = (await axiosClient.put('/profile', { name: profile.name, email: profile.email, phone: profile.phone, avatar: profile.avatar })).data;
  const extras = { gender: profile.gender || 'unspecified', birthday: profile.birthday || '' };
  localStorage.setItem(extrasKey(updated.id), JSON.stringify(extras));
  return { ...updated, ...extras };
};
export const changePassword = async (payload) => (await axiosClient.patch('/profile/password', payload)).data;
