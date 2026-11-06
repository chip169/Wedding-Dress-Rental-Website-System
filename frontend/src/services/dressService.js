import axiosClient from '../api/axiosClient';
// Import hình ảnh asset để đảm bảo hiển thị sắc nét trong bundle của Vite
import card1Elysian from '../assets/card1_elysian.jpg';
import card2Celeste from '../assets/card2_celeste.jpg';
import card3Lumiere from '../assets/card3_lumiere.jpg';
import card4Monet from '../assets/card4_monet.jpg';
import card5Aurora from '../assets/card5_aurora.jpg';
import card6Seraphina from '../assets/card6_seraphina.jpg';
import card7Vivienne from '../assets/card7_vivienne.jpg';
import card8LaceDream from '../assets/card8_lace_dream.jpg';
import card9MannequinAtelier from '../assets/card9_mannequin_atelier.jpg';
import laceDetail from '../assets/lace_detail.jpg';
import heroBride from '../assets/hero_bride.jpg';
import { DRESS_CATALOG } from '../data/dressCatalog';

/**
 * Chuyển đổi một phần tử trong DRESS_CATALOG (72 mẫu) thành đối tượng Dress hoàn chỉnh
 */
export function convertCatalogItemToDress(item) {
  if (!item) return null;

  const priceNum = item.priceNumber || (typeof item.price === 'number' ? item.price : parseInt(String(item.price || '5200000').replace(/\D/g, ''), 10)) || 5200000;
  const depositNum = parseInt(String(item.depositAmount || '15000000').replace(/\D/g, ''), 10) || 15000000;
  const rentCountNum = parseInt(String(item.rentCount || '89').replace(/\D/g, ''), 10) || 89;

  return {
    id: item.id,
    code: `WD-${202600 + item.id}`,
    name: item.name,
    slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    categorySlug: item.category || 'ballgown',
    silhouette: item.categoryName || 'Váy Cưới Cao Cấp',
    silhouetteCategory: item.categoryName || 'Váy Cưới Thiết Kế Hoàng Gia',
    description: `Tuyệt phẩm ${item.name} là mẫu thiết kế Haute Couture độc bản năm 2026. Được may đo tinh xảo với cấu trúc siết eo corsetry Pháp tôn trọn vóc dáng kiều diễm, kết hợp chất liệu ${item.material || 'lụa Mikado Ý'} thượng hạng.`,
    material: item.material || 'Lụa Mikado Ý và Ren Chantilly',
    color: 'Trắng Ngọc Tinh Khôi',
    sizes: [
      { id: 'XS', label: 'XS', note: 'Dưới 46kg', bust: '80-82cm', waist: '58-62cm' },
      { id: 'S', label: 'S', note: '46 - 52kg', bust: '83-86cm', waist: '63-67cm' },
      { id: 'M', label: 'M', note: '52 - 58kg', bust: '87-90cm', waist: '68-73cm' },
      { id: 'L', label: 'L', note: '58 - 65kg', bust: '91-95cm', waist: '74-78cm' },
    ],
    images: (item.images && item.images.length >= 4) ? item.images : [
      item.image,
      item.image?.replace('.jpg', '_mannequin.jpg') || card9MannequinAtelier,
      item.image?.replace('.jpg', '_left.jpg') || laceDetail,
      item.image?.replace('.jpg', '_right.jpg') || heroBride,
    ],
    price: priceNum,
    depositAmount: depositNum,
    originalPrice: priceNum * 12,
    status: 'available',
    rentCount: rentCountNum,
    isFeatured: true,
    collectionTag: item.badgeMain || 'THE HAUTE COUTURE BRIDAL 2026',
    rating: parseFloat(item.rating) || 4.9,
    reviewCount: 48,
    highlights: [
      {
        icon: 'diamond',
        label: 'Chất Liệu Cao Cấp',
        value: item.material || 'Lụa Mikado Ý',
        sub: 'Tơ tằm tự nhiên 100%',
      },
      {
        icon: 'ruler',
        label: 'Phom Dáng Thiết Kế',
        value: item.categoryName || 'Dáng Váy Chuẩn Hoàng Gia',
        sub: 'Cấu trúc siết eo corsetry Pháp',
      },
      {
        icon: 'sparkles',
        label: 'Kỹ Thuật Hoàn Thiện',
        value: 'Đính Kết Thủ Công Độc Bản',
        sub: 'Hạt pha lê Swarovski cao cấp',
      },
    ],
    colors: [
      { name: 'Trắng Ngọc Tinh Khôi', hex: '#FFFFFF', border: '#D9D9D9' },
      { name: 'Trắng Kem Ivory', hex: '#FDFBF7', border: '#E7DEC8' },
      { name: 'Hồng Pastel Nhẹ Nhàng', hex: '#F5D6D8', border: '#E8B6BC' },
    ],
    story: {
      collection: `BỘ SƯU TẬP ${item.name.toUpperCase()}`,
      title: `Vẻ Đẹp Quý Phái và Thuần Khiết Của ${item.name}`,
      content: [
        `Mỗi đường kim mũi chỉ trên thiết kế ${item.name} kết tinh hơn 380 giờ miệt mài may đo đính kết từ những nghệ nhân thủ công bậc thầy.`,
        `Chất vải ${item.material || 'thượng hạng'} rủ mềm tôn vinh tối đa những bước đi uyển chuyển, kiêu sa của nàng dâu trong giây phút thiêng liêng bước vào lễ đường thành hôn.`,
      ],
      atelierImage: card9MannequinAtelier,
      stats: [
        { value: '380h', label: 'ĐÍNH KẾT THỦ CÔNG' },
        { value: '1.600+', label: 'HẠT SWAROVSKI' },
        { value: '100%', label: 'LỤA TƠ TẰM NHẬP KHẨU' },
      ],
    },
    realBrides: [
      {
        brideName: 'Cô dâu Hà My và Lê Anh',
        date: '15/10/2026',
        image: card8LaceDream,
        quote: `Váy ${item.name} đẹp xuất sắc! Cả hội trường cưới ai cũng khen lộng lẫy. Form siết eo tôn dáng cực kỳ.`,
      },
      {
        brideName: 'Cô dâu Thục Quyên',
        date: '02/10/2026',
        image: heroBride,
        quote: 'Đuôi váy dài thướt tha khi bước vào lễ đường tạo cảm giác như một nàng công chúa đích thực.',
      },
      {
        brideName: 'Cô dâu Lan Chi',
        date: '28/09/2026',
        image: card7Vivienne,
        quote: 'Mặc vào cảm thấy mình như một nữ hoàng trong buổi tiệc tối! Từng đường đính kết bắt sáng lung linh dưới ánh đèn.',
      },
    ],
  };
}

/**
 * Lấy chi tiết mẫu váy cưới theo ID hoặc Slug
 */

const SIZE_MAP = {
  XS: { id: 'XS', label: 'XS', note: 'Dưới 46kg', bust: '80-82cm', waist: '58-62cm' },
  S: { id: 'S', label: 'S', note: '46 - 52kg', bust: '83-86cm', waist: '63-67cm' },
  M: { id: 'M', label: 'M', note: '52 - 58kg', bust: '87-90cm', waist: '68-73cm' },
  L: { id: 'L', label: 'L', note: '58 - 65kg', bust: '91-95cm', waist: '74-78cm' },
  XL: { id: 'XL', label: 'XL', note: '65 - 72kg', bust: '96-102cm', waist: '79-85cm' },
  FreeSize: { id: 'FreeSize', label: 'FreeSize', note: 'Dây đan corset linh hoạt', bust: '82-96cm', waist: '60-80cm' },
};

function formatDressSizes(rawSizes) {
  if (Array.isArray(rawSizes) && rawSizes.length > 0) {
    return rawSizes.map(s => {
      const key = typeof s === 'string' ? s : s?.id || s?.label;
      return SIZE_MAP[key] || { id: key, label: key, note: 'Chuẩn dáng UniBridal' };
    });
  }
  return [SIZE_MAP.S, SIZE_MAP.M];
}


/**
 * Lấy chi tiết mẫu váy cưới theo ID hoặc Slug (Ưu tiên API Backend, fallback Catalog)
 */
export async function getDressById(idOrSlug) {
  try {
    const res = await axiosClient.get(`/dresses/${idOrSlug}`);
    if (res?.data) {
      const d = res.data;
      return {
        success: true,
        data: {
          ...d,
          id: String(d._id || d.id),
          code: d.code || 'UB-001',
          name: d.name,
          slug: d.slug,
          price: d.rentPrice || d.price,
          priceNumber: d.rentPrice || d.price,
          depositAmount: d.depositAmount || 15000000,
          image: (d.images && d.images[0]) || d.image || '/assets/dresses/dress_01.jpg',
          images: (Array.isArray(d.images) && d.images.length > 0) ? (
            ((['UB-025', 'UB-024', 'UB-023', 'UB-022', 'UB-021', 'UB-020', 'UB-019', 'UB-018', 'UB-017', 'UB-016', 'UB-015', 'UB-014', 'UB-013', 'UB-012', 'UB-010', 'UB-001'].includes(d.code) || (d.images[0] && (d.images[0].includes('dress_25') || d.images[0].includes('dress_24') || d.images[0].includes('dress_23') || d.images[0].includes('dress_22') || d.images[0].includes('dress_21') || d.images[0].includes('dress_20') || d.images[0].includes('dress_19') || d.images[0].includes('dress_18') || d.images[0].includes('dress_17') || d.images[0].includes('dress_16') || d.images[0].includes('dress_15') || d.images[0].includes('dress_14') || d.images[0].includes('dress_13') || d.images[0].includes('dress_12')))) && !d.images.some(img => img.includes('banquet')))
              ? [...d.images, (d.code === 'UB-025' || d.images[0]?.includes('dress_25')) ? '/assets/dresses/dress_25_banquet.jpg' : (d.code === 'UB-024' || d.images[0]?.includes('dress_24')) ? '/assets/dresses/dress_24_banquet.jpg' : (d.code === 'UB-023' || d.images[0]?.includes('dress_23')) ? '/assets/dresses/dress_23_banquet.jpg' : (d.code === 'UB-022' || d.images[0]?.includes('dress_22')) ? '/assets/dresses/dress_22_banquet.jpg' : (d.code === 'UB-021' || d.images[0]?.includes('dress_21')) ? '/assets/dresses/dress_21_banquet.jpg' : (d.code === 'UB-020' || d.images[0]?.includes('dress_20')) ? '/assets/dresses/dress_20_banquet.jpg' : (d.code === 'UB-019' || d.images[0]?.includes('dress_19')) ? '/assets/dresses/dress_19_banquet.jpg' : (d.code === 'UB-018' || d.images[0]?.includes('dress_18')) ? '/assets/dresses/dress_18_banquet.jpg' : (d.code === 'UB-017' || d.images[0]?.includes('dress_17')) ? '/assets/dresses/dress_17_banquet.jpg' : (d.code === 'UB-016' || d.images[0]?.includes('dress_16')) ? '/assets/dresses/dress_16_banquet.jpg' : (d.code === 'UB-015' || d.images[0]?.includes('dress_15')) ? '/assets/dresses/dress_15_banquet.jpg' : (d.code === 'UB-014' || d.images[0]?.includes('dress_14')) ? '/assets/dresses/dress_14_banquet.jpg' : (d.code === 'UB-013' || d.images[0]?.includes('dress_13')) ? '/assets/dresses/dress_13_banquet.jpg' : '/assets/dresses/dress_12_banquet.jpg']
              : d.images
          ) : [
            (d.images && d.images[0]) || d.image || '/assets/dresses/dress_01.jpg',
            ((d.images && d.images[0]) || d.image || '/assets/dresses/dress_01.jpg').replace('.jpg', '_mannequin.jpg'),
            ((d.images && d.images[0]) || d.image || '/assets/dresses/dress_01.jpg').replace('.jpg', '_left.jpg'),
            ((d.images && d.images[0]) || d.image || '/assets/dresses/dress_01.jpg').replace('.jpg', '_right.jpg'),
            ...(((d.code === 'UB-012' || (d.image && d.image.includes('dress_12')))) ? ['/assets/dresses/dress_12_banquet.jpg'] : []),
            ...(((d.code === 'UB-013' || (d.image && d.image.includes('dress_13')))) ? ['/assets/dresses/dress_13_banquet.jpg'] : []),
            ...(((d.code === 'UB-014' || (d.image && d.image.includes('dress_14')))) ? ['/assets/dresses/dress_14_banquet.jpg'] : []),
            ...(((d.code === 'UB-015' || (d.image && d.image.includes('dress_15')))) ? ['/assets/dresses/dress_15_banquet.jpg'] : []),
            ...(((d.code === 'UB-016' || (d.image && d.image.includes('dress_16')))) ? ['/assets/dresses/dress_16_banquet.jpg'] : []),
            ...(((d.code === 'UB-017' || (d.image && d.image.includes('dress_17')))) ? ['/assets/dresses/dress_17_banquet.jpg'] : []),
            ...(((d.code === 'UB-018' || (d.image && d.image.includes('dress_18')))) ? ['/assets/dresses/dress_18_banquet.jpg'] : []),
            ...(((d.code === 'UB-019' || (d.image && d.image.includes('dress_19')))) ? ['/assets/dresses/dress_19_banquet.jpg'] : []),
            ...(((d.code === 'UB-020' || (d.image && d.image.includes('dress_20')))) ? ['/assets/dresses/dress_20_banquet.jpg'] : []),
            ...(((d.code === 'UB-021' || (d.image && d.image.includes('dress_21')))) ? ['/assets/dresses/dress_21_banquet.jpg'] : []),
            ...(((d.code === 'UB-022' || (d.image && d.image.includes('dress_22')))) ? ['/assets/dresses/dress_22_banquet.jpg'] : []),
            ...(((d.code === 'UB-023' || (d.image && d.image.includes('dress_23')))) ? ['/assets/dresses/dress_23_banquet.jpg'] : []),
            ...(((d.code === 'UB-024' || (d.image && d.image.includes('dress_24')))) ? ['/assets/dresses/dress_24_banquet.jpg'] : []),
            ...(((d.code === 'UB-025' || (d.image && d.image.includes('dress_25')))) ? ['/assets/dresses/dress_25_banquet.jpg'] : []),
          ],
          sizes: formatDressSizes(d.sizes),
          colors: d.colorOptions && d.colorOptions.length > 0 ? d.colorOptions : [
            { name: d.color || 'Trắng Tinh Khôi', hex: '#FFFFFF', border: '#D9D9D9' },
            { name: 'Trắng Kem Ivory', hex: '#FDFBF7', border: '#E7DEC8' },
          ],
        },
      };
    }
  } catch (error) {
    console.warn('Lỗi kết nối API/MongoDB khi tải váy cưới, kích hoạt fallback sang DRESS_CATALOG:', error?.message || error);
  }

  // Fallback an toàn sang DRESS_CATALOG theo ID, Code (UB-001...), Index hoặc Slug
  const strQuery = String(idOrSlug || '').trim();
  const numQuery = Number(strQuery);
  const foundCatalogItem = DRESS_CATALOG.find((item) => {
    if (String(item.id) === strQuery) return true;
    if (item.code && String(item.code).toLowerCase() === strQuery.toLowerCase()) return true;
    if (item.name && item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(strQuery.toLowerCase())) return true;
    return false;
  }) || (Number.isInteger(numQuery) && numQuery > 0 && numQuery <= DRESS_CATALOG.length ? DRESS_CATALOG[numQuery - 1] : null);

  if (foundCatalogItem) {
    return {
      success: true,
      data: convertCatalogItemToDress(foundCatalogItem),
    };
  }

  return {
    success: false,
    data: null,
    message: 'Không tìm thấy mẫu váy cưới trong cơ sở dữ liệu.',
  };
}

/**
 * Lấy danh sách mẫu váy tương tự
 */
export async function getRelatedDresses(currentId) {
  const targetId = String(currentId || '');
  let allDresses = [];

  try {
    const res = await getAllDresses();
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      allDresses = res.data;
    }
  } catch (err) {
    // fallback to local catalog
  }

  if (!allDresses || allDresses.length === 0) {
    allDresses = DRESS_CATALOG.map((item) => convertCatalogItemToDress(item));
  }

  const currentItem = allDresses.find((d) => String(d.id) === targetId || String(d.code) === targetId);
  const currentCategory = currentItem?.category || currentItem?.silhouetteCategory;

  let related = allDresses.filter(
    (d) => String(d.id) !== targetId && String(d.code) !== targetId && (!currentCategory || d.category === currentCategory || d.silhouetteCategory === currentCategory)
  );

  if (related.length < 4) {
    const remaining = allDresses.filter(
      (d) => String(d.id) !== targetId && String(d.code) !== targetId && !related.some((r) => String(r.id) === String(d.id))
    );
    related = [...related, ...remaining];
  }

  return {
    success: true,
    data: related.slice(0, 4),
  };
}

/**
 * Lấy tất cả mẫu váy cưới (toàn bộ 50 thiết kế từ API / DB)
 */
export async function getAllDresses(params = {}) {
  try {
    const res = await axiosClient.get('/dresses', { params });
    const rawList = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : [];
    const mapped = rawList.map((d) => {
      const pNum = typeof d.rentPrice === 'number'
        ? d.rentPrice
        : typeof d.priceNumber === 'number'
        ? d.priceNumber
        : typeof d.price === 'number'
        ? d.price
        : (parseInt(String(d.price || d.rentPrice || '5200000').replace(/\D/g, ''), 10) || 5200000);

      let pCat = '5-10';
      if (pNum < 5000000) pCat = 'under-5';
      else if (pNum <= 10000000) pCat = '5-10';
      else if (pNum <= 20000000) pCat = '10-20';
      else pCat = 'vip';

      return {
        ...d,
        id: String(d._id || d.id),
        name: d.name,
        rentPrice: pNum,
        priceNumber: pNum,
        price: formatCurrencyVND(pNum),
        depositAmount: d.depositAmount ? (typeof d.depositAmount === 'string' && d.depositAmount.includes('₫') ? d.depositAmount : formatCurrencyVND(d.depositAmount)) : '15.000.000₫',
        priceCategory: pCat,
        image: (d.images && d.images[0]) || d.image || '/assets/dresses/dress_01.jpg',
        badgeMain: d.collectionTag || (pCat === 'vip' ? 'HAUTE COUTURE VIP' : 'HAUTE COUTURE'),
        badgeSub: d.sizes?.length ? `Size: ${d.sizes.join(' - ')}` : 'Đủ size',
        size: d.sizes?.length ? `Size: ${d.sizes.join(' - ')}` : 'Size: S - M',
        sizes: d.sizes,
        material: d.material || 'Lụa Mikado Ý & Ren Pháp',
        silhouette: d.silhouette || 'Ballgown',
        category: (d.silhouette || 'ballgown').toLowerCase().replace(/\s+/g, '-'),
        categoryName: d.silhouette || 'Ballgown',
      };
    });
    return { success: true, data: mapped };
  } catch (error) {
    console.warn('Lỗi kết nối getAllDresses từ MongoDB, kích hoạt fallback sang DRESS_CATALOG:', error?.message || error);
    return {
      success: true,
      data: DRESS_CATALOG,
      message: 'Tải danh sách áo cưới thành công từ bộ sưu tập tĩnh.',
    };
  }
}

export function formatCurrencyVND(amount) {
  if (amount === undefined || amount === null || amount === '') return '0 ₫';
  const num = typeof amount === 'number' ? amount : Number(String(amount).replace(/[^0-9]/g, ''));
  if (isNaN(num)) return '0 ₫';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫';
}


/**
 * Lấy danh mục áo cưới
 */
export async function getCategories() {
  try {
    return await axiosClient.get('/categories');
  } catch (error) {
    return {
      success: true,
      data: [
        { slug: 'ballgown', name: 'Công Chúa Bồng Xòe (Ballgown)' },
        { slug: 'mermaid', name: 'Đuôi Cá Điêu Khắc (Mermaid)' },
        { slug: 'a-line', name: 'Chữ A Thanh Lịch (A-Line)' },
        { slug: 'sheath', name: 'Satin Suông Tối Giản (Minimal Slip)' },
      ],
    };
  }
}

/**
 * Thêm mới mẫu váy cưới (Admin)
 */
export async function createDress(data) {
  return await axiosClient.post('/dresses', data);
}

/**
 * Cập nhật thông tin váy cưới (Admin)
 */
export async function updateDress(id, data) {
  return await axiosClient.put(`/dresses/${id}`, data);
}

/**
 * Xóa hoặc ẩn váy cưới (Admin)
 */
export async function deleteDress(id) {
  return await axiosClient.delete(`/dresses/${id}`);
}
