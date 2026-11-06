import axiosClient from '../api/axiosClient';
import { DRESS_CATALOG } from '../data/dressCatalog';
import { getDressById, formatCurrencyVND } from './dressService';

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

export const WISHLIST_KEY = 'unibridal_wishlist_ids';
export const WISHLIST_EVENT = 'unibridal:wishlist-updated';

// 3 thiết kế mặc định đầu tiên làm fallback
export const DEFAULT_WISHLIST_IDS = Array.isArray(DRESS_CATALOG) && DRESS_CATALOG.length > 0
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
export function getCurrentUserIdentifier() {
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
export function getWishlistStorageKey() {
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
export function addToWishlist(id) {
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
 */
export function getWishlistDresses() {
  const ids = getWishlistIds();

  return ids.map((id) => {
    let strId = String(id);
    if (LEGACY_REC_MAP[strId]) strId = LEGACY_REC_MAP[strId];
    const numId = Number(strId);
    const inCatalog = DRESS_CATALOG.find((d) => String(d.id) === strId || (d.code && String(d.code) === strId)) || (Number.isInteger(numId) && numId > 0 ? DRESS_CATALOG[numId - 1] : null);
    if (inCatalog) {
      return {
        ...inCatalog,
        id,
        categoryBadge: inCatalog.categoryName ? inCatalog.categoryName.toUpperCase() : 'VÁY CƯỚI CAO CẤP',
        priceFormatted: inCatalog.price || (inCatalog.priceNumber ? formatCurrencyVND(inCatalog.priceNumber) : '5.200.000₫'),
      };
    }

    const inRec = RECOMMENDED_DRESSES.find((d) => String(d.id) === strId);
    if (inRec) return inRec;

    // Fallback nếu không tìm thấy mẫu trong 25 váy
    return {
      id: strId,
      name: `Váy Cưới Thiết Kế #${strId.slice(-4)}`,
      categoryBadge: 'VÁY CƯỚI CAO CẤP',
      size: 'SIZE S / M',
      priceNumber: 5200000,
      priceFormatted: '5.200.000₫',
      image: card1Img,
    };
  });
}
