import elysianImage from '../assets/card9_mannequin_atelier.jpg';
import monetImage from '../assets/card8_lace_dream.jpg';
import seraphinaImage from '../assets/card6_tiered_princess.jpg';
import genevieveImage from '../assets/hero_bride.jpg';
import julietteImage from '../assets/card4_monet.jpg';

const CART_KEY = 'unibridal-rental-cart';
const WISHLIST_KEY = 'unibridal-wishlist';
export const CART_EVENT = 'unibridal-cart-updated';

export const CART_CATALOG = {
  '1': { id: '1', name: 'Elysian Rose Ballgown', price: 5200000, deposit: 15000000, image: elysianImage, code: 'UB-HC-2025-01', collection: 'HAUTE NOUVEAUTÉ 2025', size: 'S (Eo 64–68cm)', fabric: 'Champagne Rose', style: 'Gói 3 Ngày Tiêu Chuẩn', location: 'SUITE SÀI GÒN' },
  '4': { id: '4', name: 'Monet 3D Floral Couture', price: 5500000, deposit: 15000000, image: monetImage, code: 'UB-HC-2025-04', collection: 'ARTISAN HAND-CRAFTED', size: 'May đo chuẩn dáng cá nhân', fabric: 'Ivory Cream', style: 'Gói 3 Ngày', location: 'MAY ĐO BESPOKE' },
  'preview-seraphina-royal': { id: 'preview-seraphina-royal', detailHref: null, name: 'Seraphina Royal Ballgown', price: 6200000, deposit: 18000000, image: seraphinaImage, code: 'UB-HC-2025-06', collection: 'BESPOKE COUTURE', size: 'S / M', fabric: 'Ivory', style: 'Dáng bồng xòe hoàng gia' },
  'preview-genevieve-ethereal': { id: 'preview-genevieve-ethereal', detailHref: null, name: 'Geneviève Ethereal Gown', price: 7500000, deposit: 20000000, image: genevieveImage, code: 'UB-HC-2025-09', collection: 'HAUTE CATHEDRAL', size: 'M', fabric: 'Ivory', style: 'Lễ phục dạ tầng cổ điển' },
  'preview-juliette-floral': { id: 'preview-juliette-floral', detailHref: null, name: 'Juliette Floral A-Line', price: 5800000, deposit: 17000000, image: julietteImage, code: 'UB-HC-2025-08', collection: 'PARISIAN ROMANCE', size: 'S / M', fabric: 'Blush', style: 'Dáng chữ A thanh nhã' },
};

const LEGACY_PREVIEW_IDS = {
  '6:Seraphina Royal Ballgown': 'preview-seraphina-royal',
  '9:Geneviève Ethereal Gown': 'preview-genevieve-ethereal',
  '8:Juliette Floral A-Line': 'preview-juliette-floral',
};

const STARTER_CART = [{ id: '1', days: 1 }, { id: '4', days: 1 }];

function storage() {
  try { return window.localStorage; } catch { return null; }
}

function migratePreviewIds(items, store, key) {
  let changed = false;
  const migrated = items.map((item) => {
    const id = LEGACY_PREVIEW_IDS[`${item.id}:${item.name}`];
    if (!id) return item;
    changed = true;
    return { ...item, id, detailHref: null };
  });
  if (changed) store?.setItem(key, JSON.stringify(migrated));
  return migrated;
}

export function getCart() {
  const store = storage();
  if (!store) return STARTER_CART;
  try {
    const raw = store.getItem(CART_KEY);
    if (raw === null) {
      store.setItem(CART_KEY, JSON.stringify(STARTER_CART));
      return STARTER_CART;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? migratePreviewIds(parsed, store, CART_KEY) : [];
  } catch { return []; }
}

function saveCart(items) {
  storage()?.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
  return items;
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  return Number(String(value ?? '').replace(/[^\d]/g, '')) || 0;
}

export function addToCart(dress) {
  const id = String(dress.id ?? dress._id);
  const current = getCart();
  if (current.some((item) => item.id === id)) return false;
  const item = {
    id,
    days: 1,
    name: dress.name,
    price: parseMoney(dress.priceNumber ?? dress.rentPrice ?? dress.price),
    deposit: parseMoney(dress.depositAmount ?? dress.deposit),
    image: dress.image ?? dress.images?.[0],
    size: dress.size ?? dress.sizes?.[0]?.label ?? 'Theo tư vấn',
    collection: dress.collectionTag ?? dress.collection ?? 'HAUTE COUTURE',
    detailHref: Object.hasOwn(dress, 'detailHref') ? dress.detailHref : `/dresses/${id}`,
  };
  saveCart([...current, item]);
  return true;
}

export function updateCartDays(id, days) {
  return saveCart(getCart().map((item) => item.id === String(id) ? { ...item, days: Math.max(1, Math.min(14, days)) } : item));
}

export function removeFromCart(id) {
  return saveCart(getCart().filter((item) => item.id !== String(id)));
}

export function resolveCartItem(item) {
  return { ...CART_CATALOG[item.id], ...item };
}

export function getWishlist() {
  try {
    const saved = JSON.parse(storage()?.getItem(WISHLIST_KEY) || '[]');
    return Array.isArray(saved) ? migratePreviewIds(saved, storage(), WISHLIST_KEY) : [];
  } catch { return []; }
}

export function toggleWishlist(dress) {
  const id = String(dress.id);
  const current = getWishlist();
  const alreadySaved = current.some((item) => item.id === id);
  const updated = alreadySaved
    ? current.filter((item) => item.id !== id)
    : [...current, { id, name: dress.name, image: dress.image, price: dress.price }];
  storage()?.setItem(WISHLIST_KEY, JSON.stringify(updated));
  return { saved: !alreadySaved, items: updated };
}
