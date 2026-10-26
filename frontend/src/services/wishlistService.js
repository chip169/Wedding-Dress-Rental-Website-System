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

export const WISHLIST_KEY = 'unibridal_wishlist_ids';
export const WISHLIST_EVENT = 'unibridal:wishlist-updated';

// 6 thiết kế mặc định chuẩn 100% theo thiết kế giao diện Figma Tủ Đồ Trong Mơ
export const DEFAULT_WISHLIST_IDS = [1, 2, 4, 3, 5, 7];

// Danh sách 3 mẫu váy trong phần "Có Thể Nàng Cũng Yêu Thích" (RECOMMENDED FOR YOU)
export const RECOMMENDED_DRESSES = [
  {
    id: 6,
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
    id: 9,
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
    id: 8,
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

export function getWishlistIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (raw === null) {
      // Khởi tạo mặc định lần đầu tiên người dùng vào web
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(DEFAULT_WISHLIST_IDS));
      return [...DEFAULT_WISHLIST_IDS];
    }
    if (!raw.trim()) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === 'object' && item !== null ? Number(item?.id) : Number(item)))
        .filter((id) => !Number.isNaN(id) && id > 0);
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
  const targetId = Number(id);
  const ids = getWishlistIds();
  return ids.some((itemId) => Number(itemId) === targetId);
}

/**
 * Lưu danh sách ID mới vào localStorage và kích hoạt sự kiện đồng bộ
 */
function saveWishlistIds(ids) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: ids }));
  } catch (err) {
    console.warn('Lỗi khi lưu wishlist vào localStorage:', err);
  }
}

/**
 * Thêm một sản phẩm vào danh sách yêu thích
 */
export function addToWishlist(id) {
  const numId = Number(id);
  const current = getWishlistIds();
  if (!current.includes(numId)) {
    const updated = [numId, ...current];
    saveWishlistIds(updated);
    return true;
  }
  return false;
}

/**
 * Xóa một sản phẩm khỏi danh sách yêu thích
 */
export function removeFromWishlist(id) {
  const numId = Number(id);
  const current = getWishlistIds();
  const updated = current.filter((item) => Number(item) !== numId && String(item) !== String(id));
  saveWishlistIds(updated);
  return updated;
}

/**
 * Xóa toàn bộ sản phẩm khỏi danh sách yêu thích
 */
export function clearWishlist() {
  saveWishlistIds([]);
  return [];
}

/**
 * Đảo trạng thái yêu thích (Thêm nếu chưa có, Xóa nếu đã có)
 */
export function toggleWishlist(id) {
  const numId = Number(id);
  const current = getWishlistIds();
  const exists = current.includes(numId) || current.includes(String(id));

  let updated;
  if (exists) {
    updated = current.filter((item) => Number(item) !== numId && String(item) !== String(id));
  } else {
    updated = [numId, ...current];
  }

  saveWishlistIds(updated);
  return { isAdded: !exists, items: updated };
}

/**
 * Lấy danh sách chi tiết các đối tượng váy trong Wishlist
 */
export function getWishlistDresses() {
  const ids = getWishlistIds();

  // Khớp với DRESS_CATALOG hoặc RECOMMENDED_DRESSES
  return ids.map((id) => {
    const numId = Number(id);
    const inCatalog = DRESS_CATALOG.find((d) => d.id === numId);
    if (inCatalog) {
      return {
        ...inCatalog,
        categoryBadge: inCatalog.categoryName ? inCatalog.categoryName.toUpperCase() : 'VÁY CƯỚI CAO CẤP',
        priceFormatted: inCatalog.price || (inCatalog.priceNumber ? formatCurrencyVND(inCatalog.priceNumber) : '5.200.000₫'),
      };
    }

    const inRec = RECOMMENDED_DRESSES.find((d) => d.id === numId);
    if (inRec) return inRec;

    // Fallback cơ bản nếu không tìm thấy
    return {
      id: numId,
      name: `Váy Cưới Thiết Kế #${numId}`,
      categoryBadge: 'VÁY CƯỚI CAO CẤP',
      size: 'SIZE S / M',
      priceNumber: 5200000,
      priceFormatted: '5.200.000₫',
      image: card1Img,
    };
  });
}
