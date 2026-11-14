import axiosClient from '../api/axiosClient';
import { DRESS_CATALOG } from '../data/dressCatalog';
import { getAllDresses, getDressById, formatCurrencyVND } from './dressService';

// Module-level cache lưu danh sách váy từ backend API
let _dressesCache = Array.isArray(DRESS_CATALOG) ? [...DRESS_CATALOG] : [];

function setWishlistCatalogCache(dresses) {
  if (Array.isArray(dresses) && dresses.length > 0) {
    const map = new Map();
    dresses.forEach((d) => {
      const key = String(d._id || d.id || d.code || '');
      if (key) map.set(key, d);
    });
    DRESS_CATALOG.forEach((d) => {
      const key = String(d.id || d._id || d.code || '');
      if (key && !map.has(key)) map.set(key, d);
    });
    _dressesCache = Array.from(map.values());
  }
}

// Tự động tải trước danh sách từ backend để chuẩn hóa ID MongoDB
if (typeof window !== 'undefined') {
  getAllDresses()
    .then((res) => {
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setWishlistCatalogCache(res.data);
      }
    })
    .catch(() => {});
}

// Import images for recommended and fallback dresses
import card1Img from '../assets/card1_elysian.jpg';
import card2Img from '../assets/card2_celeste.jpg';
import card3Img from '../assets/card3_lumiere.jpg';
import card4Img from '../assets/card4_monet.jpg';
import card5Img from '../assets/card5_aurora.jpg';
import card6TieredImg from '../assets/card6_tiered_princess.jpg';
import card7Img from '../assets/card7_vivienne.jpg';
import card8JulietteImg from '../assets/card8_juliette.jpg';
import heroBrideImg from '../assets/hero_bride.jpg';

const LEGACY_REC_MAP = {
  'rec_01': '6aeb0ad4e1e74eee06062bf7', // Seraphina Feather Romance
  'rec_02': '6aeb0ad4e1e74eee06062c24', // Genevieve French Chantilly
  'rec_03': '6aeb0ad4e1e74eee06062c7e', // Juliette Pure Silk
};

const WISHLIST_KEY = 'unibridal_wishlist_ids';
export const WISHLIST_EVENT = 'unibridal:wishlist-updated';

// 3 thiết kế mặc định đầu tiên làm fallback
const DEFAULT_WISHLIST_IDS = Array.isArray(DRESS_CATALOG) && DRESS_CATALOG.length > 0
  ? DRESS_CATALOG.slice(0, 3).map((d) => String(d.id))
  : [];

// Danh sách 3 mẫu váy trong phần "Có Thể Nàng Cũng Yêu Thích" (RECOMMENDED FOR YOU)
export const RECOMMENDED_DRESSES = [
  {
    id: 'rec_01',
    name: 'Seraphina Royal Ballgown',
    categoryBadge: 'DÁNG BỒNG XÒE HOÀNG GIA',
    size: 'SIZE S / M',
    priceNumber: 6200000,
    priceFormatted: '6.200.000₫',
    depositAmount: '18.000.000₫',
    description: 'Váy cưới công chúa xếp tầng cung điện lộng lẫy, chất liệu voan Ý thượng hạng bồng bềnh như mây trời.',
    image: card6TieredImg,
  },
  {
    id: 'rec_02',
    name: 'Geneviève Ethereal Gown',
    categoryBadge: 'LỄ PHỤC DẠ TẦNG CỔ ĐIỂN',
    size: 'SIZE M',
    priceNumber: 7600000,
    priceFormatted: '7.600.000₫',
    depositAmount: '20.000.000₫',
    description: 'Lễ phục dạ tầng mang phong cách quý tộc Pháp sang trọng, tôn trọn vóc dáng thanh mảnh của nàng dâu.',
    image: heroBrideImg,
  },
  {
    id: 'rec_03',
    name: 'Juliette Floral A-Line',
    categoryBadge: 'DÁNG CHỮ A THANH NHÃ',
    size: 'SIZE S / M',
    priceNumber: 5800000,
    priceFormatted: '5.800.000₫',
    depositAmount: '16.000.000₫',
    description: 'Dáng chữ A thêu hoa nổi 3D tinh xảo, thiết kế may đo hoàn hảo cho những lễ cưới thân mật ngoài trời.',
    image: card8JulietteImg,
  },
];

/**
 * Xác định định danh người dùng hiện tại (ID, email hoặc guest) để lưu wishlist riêng biệt từng tài khoản
 */
function getCurrentUserIdentifier() {
  if (typeof window === 'undefined') return 'guest';
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('unibridal.authUser') || sessionStorage.getItem('unibridal.authUser');
    if (raw) {
      const u = JSON.parse(raw);
      const id = u?._id || u?.id || u?.email;
      if (id) return String(id);
    }
  } catch (err) {
    // ignore
  }
  return 'guest';
}

/**
 * Tạo key lưu trữ localStorage tương ứng với từng tài khoản: unibridal_wishlist_ids_{userId}
 */
function getWishlistStorageKey() {
  const userKey = getCurrentUserIdentifier();
  return `unibridal_wishlist_ids_${userKey}`;
}

/**
 * Lấy danh sách ID váy yêu thích của tài khoản đang đăng nhập
 */
export function getWishlistIds() {
  if (typeof window === 'undefined') return [];
  try {
    const storageKey = getWishlistStorageKey();
    const raw = localStorage.getItem(storageKey);

    if (raw === null) {
      // Nếu tài khoản mới chưa có key riêng, kiểm tra xem có wishlist cũ trên máy để di chuyển
      const legacyRaw = localStorage.getItem(WISHLIST_KEY);
      if (legacyRaw && legacyRaw.trim()) {
        try {
          const parsedLegacy = JSON.parse(legacyRaw);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            const cleanIds = parsedLegacy
              .map((item) => (typeof item === 'object' && item !== null ? String(item?.id) : String(item)))
              .filter((id) => Boolean(id && id !== 'null' && id !== 'undefined' && id !== 'NaN'));
            localStorage.setItem(storageKey, JSON.stringify(cleanIds));
            return cleanIds;
          }
        } catch {
          // ignore
        }
      }

      // Khởi tạo mảng rỗng cho tài khoản mới
      localStorage.setItem(storageKey, JSON.stringify([]));
      return [];
    }

    if (!raw.trim()) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === 'object' && item !== null ? String(item?.id ?? item?._id ?? item) : String(item)))
        .filter((id) => Boolean(id && id !== 'null' && id !== 'undefined' && id !== 'NaN'));
    }
    return [];
  } catch (err) {
    console.warn('Lỗi khi đọc wishlist từ localStorage:', err);
    return [];
  }
}

/**
 * Kiểm tra một sản phẩm đã có trong wishlist hay chưa
 */
export function isWishlisted(id) {
  if (!id) return false;
  const targetId = String(id);
  const ids = getWishlistIds();
  return ids.some((itemId) => String(itemId) === targetId);
}

/**
 * Lưu danh sách ID mới vào localStorage của tài khoản hiện tại và kích hoạt đồng bộ
 */
function saveWishlistIds(ids) {
  try {
    const storageKey = getWishlistStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(ids));
    // Giữ khóa phụ tương thích
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: ids }));

    // Tự động đồng bộ lên máy chủ nếu đã đăng nhập
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      axiosClient.put('/profile/wishlist', { dressIds: ids }).catch((err) => {
        console.warn('Không thể đồng bộ wishlist lên server:', err?.message || err);
      });
    }
  } catch (err) {
    console.warn('Lỗi khi lưu wishlist vào localStorage:', err);
  }
}

/**
 * Đồng bộ danh sách yêu thích từ tài khoản máy chủ về LocalStorage
 */
export async function syncUserWishlistFromBackend(preferredUser) {
  if (typeof window === 'undefined') return [];
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('accessToken');
  if (!token) return getWishlistIds();

  try {
    if (preferredUser?.wishlist && Array.isArray(preferredUser.wishlist)) {
      const ids = preferredUser.wishlist.map(String).filter(Boolean);
      const storageKey = getWishlistStorageKey();
      const localIds = getWishlistIds();
      const combined = Array.from(new Set([...ids, ...localIds]));
      localStorage.setItem(storageKey, JSON.stringify(combined));
      window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: combined }));
      return combined;
    }

    const res = await axiosClient.get('/profile/wishlist');
    if (res?.success && Array.isArray(res.data)) {
      const backendIds = res.data.map(String).filter(Boolean);
      const storageKey = getWishlistStorageKey();
      const localIds = getWishlistIds();
      const combined = Array.from(new Set([...backendIds, ...localIds]));
      localStorage.setItem(storageKey, JSON.stringify(combined));
      window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: combined }));

      if (combined.length > backendIds.length) {
        axiosClient.put('/profile/wishlist', { dressIds: combined }).catch(() => {});
      }
      return combined;
    }
  } catch (err) {
    console.warn('Không thể đồng bộ wishlist từ backend:', err?.message || err);
  }
  return getWishlistIds();
}

/**
 * Thêm một sản phẩm vào danh sách yêu thích của tài khoản
 */
function addToWishlist(id) {
  if (!id) return false;
  const targetId = String(id);
  const current = getWishlistIds();
  if (!current.includes(targetId)) {
    const updated = [targetId, ...current];
    saveWishlistIds(updated);
    return true;
  }
  return false;
}

/**
 * Xóa một sản phẩm khỏi danh sách yêu thích của tài khoản
 */
export function removeFromWishlist(id) {
  if (!id) return getWishlistIds();
  const targetId = String(id);
  const current = getWishlistIds();
  const updated = current.filter((item) => String(item) !== targetId);
  saveWishlistIds(updated);
  return updated;
}

/**
 * Xóa toàn bộ sản phẩm khỏi danh sách yêu thích của tài khoản
 */
export function clearWishlist() {
  saveWishlistIds([]);
  return [];
}

/**
 * Đảo trạng thái yêu thích (Thêm nếu chưa có, Xóa nếu đã có)
 */
export function toggleWishlist(id) {
  if (!id) return { isAdded: false, items: [] };
  const targetId = String(id);
  const current = getWishlistIds();
  const exists = current.some((item) => String(item) === targetId);

  let updated;
  if (exists) {
    updated = current.filter((item) => String(item) !== targetId);
  } else {
    updated = [targetId, ...current];
  }

  saveWishlistIds(updated);
  return { isAdded: !exists, items: updated };
}

/**
 * Lấy danh sách chi tiết các đối tượng váy trong Wishlist của tài khoản
 * Hỗ trợ truyền catalog tùy chọn hoặc tự động tìm từ cache API / DRESS_CATALOG
 */
export function getWishlistDresses(customCatalog = null) {
  const ids = getWishlistIds();
  const pool = Array.isArray(customCatalog) && customCatalog.length > 0
    ? customCatalog
    : (_dressesCache.length > 0 ? _dressesCache : DRESS_CATALOG);

  return ids.map((id, index) => {
    const strId = String(id || '').trim();
    if (!strId) return null;
    const mappedId = LEGACY_REC_MAP[strId] || strId;
    const numId = Number(mappedId);

    // 1. Tìm trong pool (API/MongoDB dresses tải động hoặc cache)
    let found = pool.find((d) => {
      if (!d) return false;
      const dId = String(d.id || d._id || '');
      if (dId === strId || dId === mappedId) return true;
      if (d.code && (String(d.code).toLowerCase() === strId.toLowerCase() || String(d.code).toLowerCase() === mappedId.toLowerCase())) return true;
      if (d.slug && (String(d.slug).toLowerCase() === strId.toLowerCase() || String(d.slug).toLowerCase() === mappedId.toLowerCase())) return true;
      return false;
    });

    // 2. Tìm trong DRESS_CATALOG (25 mẫu thiết kế tĩnh) nếu pool chưa có
    if (!found) {
      found = DRESS_CATALOG.find((d) => {
        if (!d) return false;
        const dId = String(d.id || d._id || '');
        if (dId === strId || dId === mappedId) return true;
        if (d.code && (String(d.code).toLowerCase() === strId.toLowerCase() || String(d.code).toLowerCase() === mappedId.toLowerCase())) return true;
        if (d.slug && (String(d.slug).toLowerCase() === strId.toLowerCase() || String(d.slug).toLowerCase() === mappedId.toLowerCase())) return true;
        return false;
      });
    }

    // 3. Nếu ID là số nguyên (1, 2, 3...)
    if (!found && Number.isInteger(numId) && numId > 0 && numId <= DRESS_CATALOG.length) {
      found = DRESS_CATALOG[numId - 1];
    }

    // 4. Tìm trong RECOMMENDED_DRESSES
    if (!found) {
      found = RECOMMENDED_DRESSES.find((d) => String(d.id) === strId || String(d.id) === mappedId);
    }

    // 5. Khớp tên mềm nếu có
    if (!found) {
      found = pool.find((d) => d?.name && d.name.toLowerCase().includes(strId.toLowerCase()))
        || DRESS_CATALOG.find((d) => d?.name && d.name.toLowerCase().includes(strId.toLowerCase()));
    }

    // Nếu tìm thấy: chuẩn hóa và trả về đối tượng đầy đủ
    if (found) {
      const pNum = found.rentPrice || found.priceNumber || (typeof found.price === 'number' ? found.price : parseInt(String(found.price || '5200000').replace(/\D/g, ''), 10)) || 5200000;
      const displayPrice = found.priceFormatted || (typeof found.price === 'string' && found.price.includes('₫') ? found.price : formatCurrencyVND(pNum));
      return {
        ...found,
        id: strId, // giữ nguyên ID đã lưu để các thao tác xóa / chuyển trang hoạt động chính xác
        _id: found._id || found.id || strId,
        name: found.name,
        categoryBadge: found.categoryBadge || (found.categoryName ? found.categoryName.toUpperCase() : (found.silhouette ? found.silhouette.toUpperCase() : 'VÁY CƯỚI CAO CẤP')),
        size: found.size || (found.sizes?.length ? `SIZE: ${found.sizes.join(' - ')}` : 'SIZE S / M'),
        priceNumber: pNum,
        priceFormatted: displayPrice,
        price: displayPrice,
        image: (found.images && found.images[0]) || found.image || card1Img,
      };
    }

    // 6. Fallback an toàn: Dùng danh mục DRESS_CATALOG xoay vòng theo index để không bị trùng lặp giao diện
    const fallbackTemplate = DRESS_CATALOG[index % DRESS_CATALOG.length] || {};
    return {
      ...fallbackTemplate,
      id: strId,
      name: fallbackTemplate.name || `Váy Cưới Thiết Kế #${strId.slice(-4)}`,
      categoryBadge: fallbackTemplate.categoryName?.toUpperCase() || 'VÁY CƯỚI CAO CẤP',
      size: fallbackTemplate.size || 'SIZE S / M',
      priceNumber: fallbackTemplate.priceNumber || 5200000,
      priceFormatted: fallbackTemplate.price || '5.200.000₫',
      price: fallbackTemplate.price || '5.200.000₫',
      image: fallbackTemplate.image || card1Img,
    };
  }).filter(Boolean);
}
