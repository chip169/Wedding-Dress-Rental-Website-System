import axiosClient from '../api/axiosClient';

// Danh mục mặc định dự phòng khi Backend Offline / Demo
const INITIAL_CATEGORIES = [
  {
    _id: 'cat-ballgown',
    name: 'Công Chúa Bồng Xòe (Ballgown)',
    slug: 'ballgown',
    description: 'Phom dáng bồng xòe cổ điển xếp nhiều tầng voan Tulle, tôn vinh vẻ đẹp lộng lẫy và kiêu sa của cô dâu trong ngày hôn lễ chính thức.',
    image: '/assets/dresses/dress_01.jpg',
    isActive: true,
    dressCount: 12,
    createdAt: '2026-01-15T08:00:00.000Z',
  },
  {
    _id: 'cat-mermaid',
    name: 'Đuôi Cá Điêu Khắc (Mermaid)',
    slug: 'mermaid',
    description: 'Thiết kế ôm sát tỷ lệ vàng tôn 3 vòng quyến rũ, cúp ngực corsetry siết eo thon gọn cùng đuôi váy ren Pháp trải dài uyển chuyển.',
    image: '/assets/dresses/dress_02.jpg',
    isActive: true,
    dressCount: 8,
    createdAt: '2026-01-16T08:00:00.000Z',
  },
  {
    _id: 'cat-aline',
    name: 'Chữ A Thanh Lịch (A-line)',
    slug: 'a-line',
    description: 'Phom chữ A nhẹ nhàng, thanh thoát phù hợp với mọi vóc dáng cô dâu và không gian tiệc cưới từ khán phòng sang trọng đến tiệc ngoài trời.',
    image: '/assets/dresses/dress_03.jpg',
    isActive: true,
    dressCount: 10,
    createdAt: '2026-01-17T08:00:00.000Z',
  },
  {
    _id: 'cat-silk-gown',
    name: 'Lụa Satin Tối Giản (Silk Gown)',
    slug: 'silk-gown',
    description: 'Chất liệu lụa Mikado Ý và Satin tơ tằm nguyên bản, đường cắt tối giản sang trọng theo chuẩn phong cách Modern Royal.',
    image: '/assets/dresses/dress_04.jpg',
    isActive: true,
    dressCount: 7,
    createdAt: '2026-01-18T08:00:00.000Z',
  },
  {
    _id: 'cat-princess',
    name: 'Váy Cưới Hoàng Gia (Princess)',
    slug: 'princess',
    description: 'Đính kết hàng ngàn hạt pha lê Swarovski và ren đắp nổi 3D tinh xảo, tái hiện vẻ đẹp vương giả hoàng gia Châu Âu.',
    image: '/assets/dresses/dress_05.jpg',
    isActive: true,
    dressCount: 9,
    createdAt: '2026-01-19T08:00:00.000Z',
  },
  {
    _id: 'cat-traditional',
    name: 'Áo Dài Cưới Truyền Thống (Traditional)',
    slug: 'traditional',
    description: 'Nét đẹp di sản văn hóa Việt thêu tay Long Phụng, hoa sen thủ công trên nền gấm tơ tằm thượng hạng cho lễ vu quy và rước dâu.',
    image: '/assets/dresses/dress_06.jpg',
    isActive: true,
    dressCount: 6,
    createdAt: '2026-01-20T08:00:00.000Z',
  },
];

const LOCAL_STORAGE_KEY = 'unibridal_admin_categories';

function getStoredCategories() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading stored categories:', err);
  }
  return INITIAL_CATEGORIES;
}

function saveStoredCategories(cats) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cats));
  } catch (err) {
    console.error('Error saving categories:', err);
  }
}

/**
 * Lấy danh sách danh mục (API + Offline Fallback)
 */
export async function getCategoriesApi(params = {}) {
  try {
    const res = await axiosClient.get('/categories', { params });
    if (res && res.data && Array.isArray(res.data)) {
      saveStoredCategories(res.data);
      return res.data;
    }
    if (res && res.success && Array.isArray(res.data)) {
      saveStoredCategories(res.data);
      return res.data;
    }
  } catch (error) {
    console.warn('API /categories error, using fallback storage:', error.message);
  }

  // Fallback storage
  let list = getStoredCategories();
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
    );
  }
  if (params.includeInactive === false) {
    list = list.filter((c) => c.isActive);
  }
  return list;
}

/**
 * Tạo mới danh mục
 */
export async function createCategoryApi(payload) {
  try {
    const res = await axiosClient.post('/categories', payload);
    if (res?.data) {
      const list = getStoredCategories();
      saveStoredCategories([res.data, ...list]);
      return res.data;
    }
  } catch (error) {
    console.warn('API error, saving locally:', error.message);
  }

  const list = getStoredCategories();
  const newCat = {
    _id: `cat-${Date.now()}`,
    name: payload.name,
    slug: payload.slug || payload.name.toLowerCase().replace(/\s+/g, '-'),
    description: payload.description || '',
    image: payload.image || '/assets/dresses/dress_01.jpg',
    isActive: payload.isActive !== undefined ? payload.isActive : true,
    dressCount: 0,
    createdAt: new Date().toISOString(),
  };
  saveStoredCategories([newCat, ...list]);
  return newCat;
}

/**
 * Cập nhật danh mục
 */
export async function updateCategoryApi(id, payload) {
  try {
    const res = await axiosClient.put(`/categories/${id}`, payload);
    if (res?.data) {
      const list = getStoredCategories().map((c) => (c._id === id || c.id === id ? { ...c, ...res.data } : c));
      saveStoredCategories(list);
      return res.data;
    }
  } catch (error) {
    console.warn('API error, updating locally:', error.message);
  }

  const list = getStoredCategories().map((c) => {
    if (c._id === id || c.id === id) {
      return { ...c, ...payload };
    }
    return c;
  });
  saveStoredCategories(list);
  return list.find((c) => c._id === id || c.id === id);
}

/**
 * Chuyển đổi trạng thái hiển thị (Bật / Tắt)
 */
export async function toggleCategoryStatusApi(id) {
  try {
    const res = await axiosClient.patch(`/categories/${id}/toggle-status`);
    if (res?.data) {
      const list = getStoredCategories().map((c) => (c._id === id || c.id === id ? { ...c, ...res.data } : c));
      saveStoredCategories(list);
      return res.data;
    }
  } catch (error) {
    console.warn('API error, toggling locally:', error.message);
  }

  const list = getStoredCategories().map((c) => {
    if (c._id === id || c.id === id) {
      return { ...c, isActive: !c.isActive };
    }
    return c;
  });
  saveStoredCategories(list);
  return list.find((c) => c._id === id || c.id === id);
}

/**
 * Xóa danh mục
 */
export async function deleteCategoryApi(id) {
  try {
    await axiosClient.delete(`/categories/${id}`);
  } catch (error) {
    console.warn('API error, deleting locally:', error.message);
  }

  const list = getStoredCategories().filter((c) => c._id !== id && c.id !== id);
  saveStoredCategories(list);
  return { success: true };
}

