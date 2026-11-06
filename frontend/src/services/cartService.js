import elysianImage from '../assets/card9_mannequin_atelier.jpg';
import monetImage from '../assets/card8_lace_dream.jpg';
import seraphinaImage from '../assets/card6_tiered_princess.jpg';
import genevieveImage from '../assets/hero_bride.jpg';
import julietteImage from '../assets/card4_monet.jpg';
import { dressImage } from './dressApiService';

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

function rentalDays(value) {
  const days = Number(value);
  return Number.isFinite(days) ? Math.max(1, Math.min(14, Math.trunc(days))) : 1;
}

export function getCart() {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(CART_KEY);
    if (raw === null || raw === '[{"id":"1","days":1},{"id":"4","days":1}]') return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter((item) => item && ['string', 'number'].includes(typeof item.id));
    return migratePreviewIds(valid, store, CART_KEY).map((item) => ({ ...item, days: rentalDays(item.days) }));
  } catch { return []; }
}

function saveCart(items) {
  storage()?.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
  return items;
}

const isDatabaseId = (id) => /^[a-f\d]{24}$/i.test(String(id));

export function refreshCartWithDresses(dresses) {
  const byId = new Map(dresses.map((dress) => [String(dress._id || dress.id), dress]));
  const byCode = new Map(dresses.filter((dress) => dress.code).map((dress) => [dress.code, dress]));
  const byName = new Map();
  dresses.forEach((dress) => {
    // A legacy name is usable only when it identifies a single catalog item.
    byName.set(dress.name, byName.has(dress.name) ? null : dress);
  });
  const normalized = [];
  const positions = new Map();
  getCart().forEach((item) => {
    const existing = CART_CATALOG[item.id];
    const dress = byId.get(String(item.id)) || byCode.get(item.code || existing?.code) ||
      (!isDatabaseId(item.id) && byName.get(item.name || existing?.name));
    if (!dress) {
      normalized.push({ ...item, unavailable: true });
      return;
    }
    const id = String(dress._id || dress.id);
    const days = rentalDays(item.days);
    if (positions.has(id)) {
      const previous = normalized[positions.get(id)];
      previous.days = Math.max(previous.days, days);
      return;
    }
    positions.set(id, normalized.length);
    normalized.push({ ...item, id, days, detailHref: `/dresses/${id}`, code: dress.code, name: dress.name,
      image: dressImage(dress), price: dress.rentPrice, deposit: dress.depositAmount,
      status: dress.status, unavailable: dress.status !== 'available' });
  });
  return saveCart(normalized);
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  return Number(String(value ?? '').replace(/[^\d]/g, '')) || 0;
}

export function addToCart(dress) {
  const id = String(dress._id ?? dress.id);
  const current = getCart();
  if (current.some((item) => String(item.id) === id || (item.code && item.code === dress.code) ||
    (!isDatabaseId(item.id) && (item.name || CART_CATALOG[item.id]?.name) === dress.name))) return false;
  const item = {
    id,
    days: 1,
    name: dress.name,
    price: parseMoney(dress.priceNumber ?? dress.rentPrice ?? dress.price),
    deposit: parseMoney(dress.depositAmount ?? dress.deposit),
    image: dressImage(dress),
    code: dress.code,
    size: dress.size ?? dress.sizes?.[0]?.label ?? 'Theo tư vấn',
    collection: dress.collectionTag ?? dress.collection ?? 'HAUTE COUTURE',
    detailHref: Object.hasOwn(dress, 'detailHref') ? dress.detailHref : `/dresses/${id}`,
  };
  saveCart([...current, item]);
  return true;
}

export function updateCartDays(id, days) {
  return saveCart(getCart().map((item) => String(item.id) === String(id) ? { ...item, days: rentalDays(days) } : item));
}

export function removeFromCart(id) {
  return saveCart(getCart().filter((item) => String(item.id) !== String(id)));
}

export function clearCart() {
  return saveCart([]);
}

export function resolveCartItem(item) {
  const resolved = { ...CART_CATALOG[item.id], ...item };
  const catalogId = /^WDR-(\d{3})$/.exec(resolved.code || '')?.[1];
  return { ...resolved, image: dressImage(resolved), detailHref: resolved.detailHref !== undefined ? resolved.detailHref : catalogId ? `/dresses/${Number(catalogId)}` : undefined };
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
