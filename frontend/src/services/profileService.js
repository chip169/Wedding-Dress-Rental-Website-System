import axiosClient from '../api/axiosClient';
const extrasKey = (id) => `unibridal.profile.extras.${id}`;
const addressText = (address) => typeof address === 'string' ? address : ['street', 'ward', 'district', 'city'].map((key) => address?.[key]).filter(Boolean).join(', ');
const measurementKeys = ['height', 'weight', 'bust', 'waist', 'hips', 'heel'];

function localExtras(id) {
    try {
        const extras = JSON.parse(localStorage.getItem(extrasKey(id)) || '{}');
        return extras && typeof extras === 'object' && !Array.isArray(extras) ? extras : {};
    } catch {
        return {};
    }
}

function normalize(profile) {
    if (!profile) return {};
    const id = profile.id || profile._id || '';
    const extras = id ? localExtras(id) : {};
    return {
        ...profile,
        name: profile.name || profile.fullName || '',
        address: addressText(profile.address),
        addressParts: profile.address,
        ...Object.fromEntries(measurementKeys.map((key) => [key, profile.measurements?.[key] ?? ''])),
        gender: profile.gender ?? extras.gender ?? 'unspecified',
        birthday: profile.birthday ? String(profile.birthday).split('T')[0] : (extras.birthday || ''),
        weddingDate: profile.weddingDate ? String(profile.weddingDate).split('T')[0] : (extras.weddingDate || ''),
        heel: profile.measurements?.heel != null && profile.measurements?.heel !== ''
            ? String(profile.measurements.heel)
            : (extras.heel ?? ''),
    };
}

export const getProfile = async () => normalize((await axiosClient.get('/profile')).data);

export const saveProfile = async (profile) => {
    const address = profile.address === addressText(profile.addressParts)
        ? profile.addressParts : { street: profile.address || '', ward: '', district: '', city: '' };
    const measurements = Object.fromEntries(
        measurementKeys.map((key) => [key, profile[key] === '' || profile[key] == null ? null : Number(profile[key])])
    );
    const res = await axiosClient.put('/profile', {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        avatar: profile.avatar,
        address,
        idCard: profile.idCard,
        gender: profile.gender,
        birthday: profile.birthday || null,
        weddingDate: profile.weddingDate || null,
        measurements,
    });
    // Cache hỗ trợ phiên bản API cũ; dữ liệu server luôn được ưu tiên.
    const extras = Object.fromEntries(['gender', 'birthday', 'weddingDate', 'heel'].map((key) => [key, profile[key] ?? '']));
    try {
        localStorage.setItem(extrasKey(res.data.id || res.data._id), JSON.stringify(extras));
    } catch { /* Server save remains successful when device storage is full. */ }
    const updated = normalize(res.data);
    try {
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(updated));
    } catch { /* AuthContext also keeps the current profile in memory. */ }
    return updated;
};

export const changePassword = async (payload) => (await axiosClient.patch('/profile/password', payload)).data;
export const clearProfile = () => { };
