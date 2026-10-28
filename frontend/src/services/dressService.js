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

export const MOCK_DRESSES = [
  {
    id: 1,
    code: 'BGW-2026',
    name: 'Elysian Rose Ballgown',
    slug: 'elysian-rose-ballgown',
    categorySlug: 'ballgown',
    silhouette: 'Ballgown',
    silhouetteCategory: 'Váy Cưới Công Chúa (Ballgown)',
    description: 'Vẻ đẹp kiêu hãnh của đóa hồng trong sương sớm. Thiết kế bồng bềnh hoàng gia với cấu trúc siết eo corsetry Pháp.',
    material: 'Ren Chantilly Pháp và Lót tơ tằm Ý',
    color: 'Hồng Pastel',
    sizes: [
      { id: 'XS', label: 'XS', note: 'Dưới 46kg', bust: '80-82cm', waist: '58-62cm' },
      { id: 'S', label: 'S', note: '46 - 52kg', bust: '83-86cm', waist: '63-67cm' },
      { id: 'M', label: 'M', note: '52 - 58kg', bust: '87-90cm', waist: '68-73cm' },
      { id: 'L', label: 'L', note: '58 - 65kg', bust: '91-95cm', waist: '74-78cm' },
    ],
    images: [card1Elysian, laceDetail, card6Seraphina, heroBride],
    price: 5200000,
    depositAmount: 15000000,
    originalPrice: 85000000,
    status: 'available',
    rentCount: 128,
    isFeatured: true,
    collectionTag: 'THE HAUTE COUTURE BRIDAL 2026',
    rating: 4.9,
    reviewCount: 48,
    highlights: [
      {
        icon: 'diamond',
        label: 'Chất Liệu Cao Cấp',
        value: 'Ren Chantilly Pháp',
        sub: 'Lót tơ tằm Ý 100%',
      },
      {
        icon: 'ruler',
        label: 'Độ Dài Đuôi Váy',
        value: 'Đuôi Cung Điện 150cm',
        sub: 'Thiết kế nút cài gọn gàng',
      },
      {
        icon: 'sparkles',
        label: 'Kỹ Thuật Đính Kết',
        value: 'Pha Lê và Kim Sa 100% Thủ Công',
        sub: 'Hạt Swarovski bắt sáng',
      },
    ],
    colors: [
      { name: 'Hồng Pastel', hex: '#F5D6D8', border: '#E8B6BC' },
      { name: 'Trắng Kem', hex: '#FDFBF7', border: '#E7DEC8' },
      { name: 'Trắng Ngọc', hex: '#FFFFFF', border: '#D9D9D9' },
    ],
    story: {
      collection: 'INSPIRATION FROM PARIS BOTANICAL GARDEN',
      title: 'Vẻ Đẹp Kiêu Hãnh Của Đóa Hồng Trong Sương Sớm',
      content: [
        'Lấy cảm hứng từ những đóa hồng hé nở trong khu vườn Jardin des Plantes tại Paris lúc bình minh, thiết kế Elysian Rose Ballgown kết tinh hơn 420 giờ kim chỉ thủ công từ những nghệ nhân thêu đính lành nghề.',
        'Hơn 1.800 hạt pha lê Swarovski và ngọc trai nước ngọt được rải tinh tế dọc thân áo và lan tỏa dần xuống các nếp gấp tùng váy, tạo hiệu ứng phát sáng lộng lẫy theo từng nhịp bước cô dâu tiến vào lễ đường.',
      ],
      atelierImage: card9MannequinAtelier,
      stats: [
        { value: '420h', label: 'ĐÍNH KẾT THỦ CÔNG' },
        { value: '1.800+', label: 'PHA LÊ SWAROVSKI' },
        { value: '12 Lớp', label: 'LỤA TULLE PHÁP SIÊU NHẸ' },
      ],
    },
    realBrides: [
      {
        brideName: 'Cô dâu Hà My và Lê Anh',
        date: '15/10/2026',
        image: card8LaceDream,
        quote: 'Váy đẹp xuất sắc! Cả hội trường cưới ai cũng khen lộng lẫy. Form siết eo tôn dáng cực kỳ mà mặc rất thoải mái suốt cả ngày dài.',
      },
      {
        brideName: 'Cô dâu Thục Quyên',
        date: '02/10/2026',
        image: heroBride,
        quote: 'Đuôi váy dài thướt tha khi bước vào lễ đường tạo cảm giác như một nàng công chúa đích thực. Cảm ơn UniBridal rất nhiều!',
      },
      {
        brideName: 'Cô dâu Lan Chi',
        date: '28/09/2026',
        image: card7Vivienne,
        quote: 'Mặc vào cảm thấy mình như một nữ hoàng trong buổi tiệc tối! Từng đường đính kết bắt sáng lung linh dưới ánh đèn sân khấu. Đáng giá từng đồng!',
      },
    ],
  },
  {
    id: 2,
    code: 'MMD-2026',
    name: 'Celeste Royal Mermaid',
    slug: 'celeste-royal-mermaid',
    categorySlug: 'mermaid',
    silhouette: 'Mermaid',
    silhouetteCategory: 'Váy Cưới Đuôi Cá (Mermaid)',
    description: 'Bản giao hưởng giữa kỹ thuật corset siết eo hoàng gia và chất liệu thượng hạng từ Ý và Pháp.',
    material: 'Lụa Mikado và Ren Ý',
    color: 'Trắng Ngà Tinh Khôi',
    sizes: [
      { id: 'XS', label: 'XS', note: 'Dưới 46kg', bust: '80-82cm', waist: '58-62cm' },
      { id: 'S', label: 'S', note: '46 - 52kg', bust: '83-86cm', waist: '63-67cm' },
      { id: 'M', label: 'M', note: '52 - 58kg', bust: '87-90cm', waist: '68-73cm' },
      { id: 'L', label: 'L', note: '58 - 65kg', bust: '91-95cm', waist: '74-78cm' },
    ],
    images: [card2Celeste, laceDetail, card7Vivienne, heroBride],
    price: 6500000,
    depositAmount: 18000000,
    originalPrice: 95000000,
    status: 'available',
    rentCount: 89,
    isFeatured: true,
    collectionTag: 'THE HAUTE COUTURE BRIDAL 2026',
    rating: 5.0,
    reviewCount: 36,
    highlights: [
      {
        icon: 'diamond',
        label: 'Chất Liệu Cao Cấp',
        value: 'Lụa Mikado và Ren Ý',
        sub: 'Ôm dáng tuyệt đối',
      },
      {
        icon: 'ruler',
        label: 'Độ Dài Đuôi Váy',
        value: 'Đuôi Cá Điêu Khắc 120cm',
        sub: 'Gọn gàng dễ di chuyển',
      },
      {
        icon: 'sparkles',
        label: 'Kỹ Thuật Đính Kết',
        value: 'Ngọc Trai Biển và Pha Lê',
        sub: 'Đính viền cúp ngực tinh xảo',
      },
    ],
    colors: [
      { name: 'Trắng Ngà Tinh Khôi', hex: '#FAF7F2', border: '#E4D5BE' },
      { name: 'Trắng Sữa Ánh Nhũ', hex: '#FFFFFF', border: '#D0D0D0' },
    ],
    story: {
      collection: 'BỘ SƯU TẬP MEDITERRANEAN GODDESS',
      title: 'Tuyệt Tác Corsetry Điêu Khắc Tôn Vinh Đường Cong Nữ Thần',
      content: [
        'Celeste Royal Mermaid được mệnh danh là bản hòa ca của sự quyến rũ và kiêu hãnh. Phom váy đuôi cá được dựng khung corset 16 gọng xương cá chuẩn tỷ lệ vàng của Pháp, ôm sát eo và tôn bật hông cong nuột nà.',
        'Mỗi chi tiết ren được cắt tỉa hoa văn thủ công bằng kéo đầu kim và đính kết đối xứng hoàn hảo dọc theo sườn váy để tạo hiệu ứng thị giác thon gọn và cao ráo tối đa.',
      ],
      atelierImage: card9MannequinAtelier,
      stats: [
        { value: '280h', label: 'Thời gian đính kết' },
        { value: '16 gọng', label: 'Khung Corset định hình' },
        { value: '8.000+', label: 'Hạt ngọc trai biển' },
      ],
    },
    realBrides: [
      {
        brideName: 'Cô dâu Bích Phương',
        date: '08/10/2026',
        image: card7Vivienne,
        quote: 'Dáng đuôi cá của Celeste mặc lên eo con kiến thực sự! Bạn bè ai cũng trầm trồ hỏi thuê ở đâu.',
      },
      {
        brideName: 'Cô dâu Minh Thư',
        date: '25/09/2026',
        image: heroBride,
        quote: 'Đường ren sắc nét, chất vải cao cấp không hề bị nhăn suốt cả buổi đón khách.',
      },
    ],
  },
  {
    id: 3,
    code: 'SLK-2026',
    name: 'Lumière Minimal Silk',
    slug: 'lumiere-minimal-silk',
    categorySlug: 'silk-gown',
    silhouette: 'Silk Gown',
    silhouetteCategory: 'Váy Cưới Lụa Tối Giản (Silk Gown)',
    description: 'Vẻ đẹp đương đại từ lụa tơ tằm nguyên bản, thuần khiết và sang trọng.',
    material: 'Lụa Satin Tơ Tằm Como Ý',
    color: 'Trắng Ngọc Trai',
    sizes: [
      { id: 'XS', label: 'XS', note: 'Dưới 46kg', bust: '80-82cm', waist: '58-62cm' },
      { id: 'S', label: 'S', note: '46 - 52kg', bust: '83-86cm', waist: '63-67cm' },
      { id: 'M', label: 'M', note: '52 - 58kg', bust: '87-90cm', waist: '68-73cm' },
      { id: 'L', label: 'L', note: '58 - 65kg', bust: '91-95cm', waist: '74-78cm' },
    ],
    images: [card3Lumiere, card9MannequinAtelier, heroBride, card8LaceDream],
    price: 3800000,
    depositAmount: 10000000,
    originalPrice: 62000000,
    status: 'available',
    rentCount: 94,
    isFeatured: true,
    collectionTag: 'THE HAUTE COUTURE BRIDAL 2026',
    rating: 4.8,
    reviewCount: 32,
    highlights: [
      {
        icon: 'diamond',
        label: 'Chất Liệu Cao Cấp',
        value: 'Lụa Satin Tơ Tằm Como Ý',
        sub: 'Bề mặt bắt sáng dịu nhẹ',
      },
      {
        icon: 'ruler',
        label: 'Độ Dài Đuôi Váy',
        value: 'Đuôi Quét Sàn 80cm',
        sub: 'Cực kỳ nhẹ nhàng và linh hoạt',
      },
      {
        icon: 'sparkles',
        label: 'Kỹ Thuật Cắt May',
        value: 'Draping Nghệ Thuật 3D',
        sub: 'Đường cắt xéo Bias-cut bay bổng',
      },
    ],
    colors: [
      { name: 'Trắng Ngọc Trai', hex: '#FBF9F5', border: '#E1D9C9' },
      { name: 'Champagne Warm', hex: '#F7EFE3', border: '#DFCEB5' },
    ],
    story: {
      collection: 'BỘ SƯU TẬP MODERN TIMELESS SILK',
      title: 'Đỉnh Cao Của Vẻ Đẹp Tối Giản Và Tinh Khiết',
      content: [
        'Không cần đính kết cầu kỳ, Lumière Minimal Silk chinh phục mọi ánh nhìn bằng chất liệu lụa Como dệt tay từ miền Bắc nước Ý, nơi khởi nguồn của những thước lụa đắt đỏ nhất thế giới.',
        'Mỗi đường may giấu chỉ tinh tế và kỹ thuật xếp nếp draping tự nhiên ôm khéo léo phần lưng trần, tôn vinh nét đẹp thanh tao, thuần khiết của người phụ nữ hiện đại.',
      ],
      atelierImage: card9MannequinAtelier,
      stats: [
        { value: '100%', label: 'Lụa tơ tằm Como' },
        { value: '180h', label: 'Kỹ thuật may giấu mũi' },
        { value: '0.8kg', label: 'Trọng lượng siêu nhẹ' },
      ],
    },
    realBrides: [
      {
        brideName: 'Cô dâu Khánh Linh',
        date: '12/10/2026',
        image: heroBride,
        quote: 'Váy nhẹ tênh, di chuyển chụp hình cả ngày không hề thấy mệt. Chất lụa lên hình bóng mượt và sang vô cùng!',
      },
    ],
  },
  {
    id: 4,
    code: 'FLR-2026',
    name: 'Monet 3D Floral Couture',
    slug: 'monet-3d-floral-couture',
    categorySlug: 'a-line',
    silhouette: 'A-Line',
    silhouetteCategory: 'Váy Cưới Chữ A (A-Line)',
    description: 'Hàng ngàn cánh hoa 3D thủ công nở rộ trên tùng váy chữ A bay bổng.',
    material: 'Tulle Pháp và Organza Thêu Hoa',
    color: 'Trắng Ngà Kem',
    sizes: [
      { id: 'XS', label: 'XS', note: 'Dưới 46kg', bust: '80-82cm', waist: '58-62cm' },
      { id: 'S', label: 'S', note: '46 - 52kg', bust: '83-86cm', waist: '63-67cm' },
      { id: 'M', label: 'M', note: '52 - 58kg', bust: '87-90cm', waist: '68-73cm' },
      { id: 'L', label: 'L', note: '58 - 65kg', bust: '91-95cm', waist: '74-78cm' },
    ],
    images: [card4Monet, laceDetail, card6Seraphina, card7Vivienne],
    price: 5500000,
    depositAmount: 15000000,
    originalPrice: 80000000,
    status: 'available',
    rentCount: 62,
    isFeatured: true,
    collectionTag: 'THE HAUTE COUTURE BRIDAL 2026',
    rating: 4.9,
    reviewCount: 28,
    highlights: [
      {
        icon: 'diamond',
        label: 'Chất Liệu Cao Cấp',
        value: 'Tulle Pháp và Organza Thêu Hoa',
        sub: 'Bồng bềnh tự nhiên không nặng',
      },
      {
        icon: 'ruler',
        label: 'Độ Dài Đuôi Váy',
        value: 'Đuôi Chapel 130cm',
        sub: 'Cân đối thanh thoát',
      },
      {
        icon: 'sparkles',
        label: 'Kỹ Thuật Đính Kết',
        value: 'Hoa Nổi 3D Khắc Laser',
        sub: 'Từng cánh hoa uốn nhiệt thủ công',
      },
    ],
    colors: [
      { name: 'Trắng Ngà Kem', hex: '#FAF8F4', border: '#E3D8C6' },
      { name: 'Phấn Hồng Nhạt', hex: '#F9ECE8', border: '#E7C8BF' },
    ],
    story: {
      collection: 'BỘ SƯU TẬP GIVERNY GARDEN ROMANCE',
      title: 'Khu Vườn Cổ Tích Của Danh Họa Monet Trên Nền Váy Cưới',
      content: [
        'Monet 3D Floral Couture được tạo nên từ tình yêu với những bức tranh phong cảnh rực rỡ của Claude Monet. Hơn 500 cánh hoa organza và lụa được cắt khắc laser tỉ mỉ, sau đó uốn cong bằng nhiệt thủ công để đạt độ bung cánh sống động như hoa tươi.',
      ],
      atelierImage: card9MannequinAtelier,
      stats: [
        { value: '500+', label: 'Bông hoa 3D thủ công' },
        { value: '250h', label: 'Thời gian đính kết' },
        { value: '6 lớp', label: 'Tulle mềm mại bồng bềnh' },
      ],
    },
    realBrides: [
      {
        brideName: 'Cô dâu Phương Thảo',
        date: '10/10/2026',
        image: heroBride,
        quote: 'Cánh hoa 3D xinh xỉu! Chụp ảnh cận cảnh hay từ xa đều thấy rõ độ tinh xảo.',
      },
    ],
  },
  {
    id: 5,
    code: 'SHT-2026',
    name: 'Aurora Pearl Sheath',
    slug: 'aurora-pearl-sheath',
    categorySlug: 'silk-gown',
    silhouette: 'Other',
    silhouetteCategory: 'Váy Cưới Suông Đính Ngọc Trai',
    description: 'Dáng suông thanh mảnh đính ngọc trai nước ngọt chuyển sắc gradient.',
    material: 'Crepe Lụa Pháp và Tulle Mịn',
    color: 'Trắng Ngọc Trai',
    sizes: [
      { id: 'XS', label: 'XS', note: 'Dưới 46kg', bust: '80-82cm', waist: '58-62cm' },
      { id: 'S', label: 'S', note: '46 - 52kg', bust: '83-86cm', waist: '63-67cm' },
      { id: 'M', label: 'M', note: '52 - 58kg', bust: '87-90cm', waist: '68-73cm' },
      { id: 'L', label: 'L', note: '58 - 65kg', bust: '91-95cm', waist: '74-78cm' },
    ],
    images: [card5Aurora, laceDetail, card8LaceDream, heroBride],
    price: 4800000,
    depositAmount: 12000000,
    originalPrice: 70000000,
    status: 'available',
    rentCount: 78,
    isFeatured: true,
    collectionTag: 'THE HAUTE COUTURE BRIDAL 2026',
    rating: 4.8,
    reviewCount: 24,
    highlights: [
      {
        icon: 'diamond',
        label: 'Chất Liệu Cao Cấp',
        value: 'Crepe Lụa Pháp và Tulle Mịn',
        sub: 'Độ rũ mềm mượt tôn dáng',
      },
      {
        icon: 'ruler',
        label: 'Độ Dài Đuôi Váy',
        value: 'Đuôi Sweep 60cm',
        sub: 'Tuyệt hảo cho tiệc khiêu vũ',
      },
      {
        icon: 'sparkles',
        label: 'Kỹ Thuật Đính Kết',
        value: 'Mưa Ngọc Trai Gradient',
        sub: 'Từ ngực rải nhẹ xuống gấu váy',
      },
    ],
    colors: [
      { name: 'Trắng Ngọc Trai', hex: '#FAF9F6', border: '#E4DDD0' },
      { name: 'Trắng Sữa', hex: '#FFFFFF', border: '#DCDCDC' },
    ],
    story: {
      collection: 'BỘ SƯU TẬP AURORA BOREALIS',
      title: 'Ánh Sáng Cực Quang Kỳ Ảo Khắc Họa Trên Nền Váy Suông',
      content: [
        'Aurora Pearl Sheath sinh ra để dành cho những quý cô yêu chuộng sự tinh giản, thanh thoát nhưng vẫn muốn để lại dấu ấn khó quên trong mắt quan khách.',
      ],
      atelierImage: card9MannequinAtelier,
      stats: [
        { value: '4.500+', label: 'Hạt ngọc trai nước ngọt' },
        { value: '200h', label: 'Thời gian đính kết' },
        { value: 'Silk Crepe', label: 'Chất liệu lụa rũ cao cấp' },
      ],
    },
    realBrides: [
      {
        brideName: 'Cô dâu Cẩm Tú',
        date: '04/10/2026',
        image: heroBride,
        quote: 'Thiết kế suông đơn giản mà đính ngọc cực sang. Nhảy first dance siêu thoải mái!',
      },
    ],
  },
];

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
    images: [
      item.image,
      laceDetail,
      card9MannequinAtelier,
      heroBride,
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
export async function getDressById(idOrSlug) {
  try {
    const res = await axiosClient.get(`/dresses/${idOrSlug}`);
    if (res?.data) return res;
  } catch (error) {
    // Fallback
  }
  const target = String(idOrSlug || '1').trim().toLowerCase();

  // 1. Tìm trong MOCK_DRESSES (mục 1-5 có chi tiết thủ công)
  let found = MOCK_DRESSES.find(
    (d) =>
      String(d.id).toLowerCase() === target ||
      String(d.code).toLowerCase() === target ||
      String(d.slug).toLowerCase() === target
  );

  // 2. Tìm trong DRESS_CATALOG (toàn bộ 72 thiết kế)
  if (!found) {
    const catalogItem = DRESS_CATALOG.find(
      (item) =>
        String(item.id).toLowerCase() === target ||
        String(item.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === target
    );
    if (catalogItem) {
      found = convertCatalogItemToDress(catalogItem);
    }
  }

  // 3. Dự phòng mặc định
  if (!found) {
    found = convertCatalogItemToDress(DRESS_CATALOG[0]) || MOCK_DRESSES[0];
  }

  return {
    success: true,
    data: found,
  };
}

/**
 * Lấy danh sách mẫu váy tương tự
 */
export async function getRelatedDresses(currentId) {
  const targetId = Number(currentId) || 1;
  const currentItem = DRESS_CATALOG.find((d) => d.id === targetId);
  const currentCategory = currentItem?.category;

  // Lọc sản phẩm cùng phom dáng trước
  let related = DRESS_CATALOG.filter(
    (d) => d.id !== targetId && (!currentCategory || d.category === currentCategory)
  );

  if (related.length < 4) {
    const remaining = DRESS_CATALOG.filter(
      (d) => d.id !== targetId && !related.some((r) => r.id === d.id)
    );
    related = [...related, ...remaining];
  }

  const selected = related.slice(0, 4).map((item) => {
    const mock = MOCK_DRESSES.find((m) => m.id === item.id);
    return mock || convertCatalogItemToDress(item);
  });

  return {
    success: true,
    data: selected,
  };
}

/**
 * Lấy tất cả mẫu váy cưới (toàn bộ 72 thiết kế)
 */
export async function getAllDresses(params = {}) {
  try {
    const res = await axiosClient.get('/dresses', { params });
    if (res?.data?.length) return res;
  } catch (error) {
    // Fallback
  }
  const all = DRESS_CATALOG.map((item) => {
    const mock = MOCK_DRESSES.find((m) => m.id === item.id);
    return mock || convertCatalogItemToDress(item);
  });
  return {
    success: true,
    data: all,
  };
}

/**
 * Định dạng tiền tệ VND chuẩn Việt Nam
 */
export function formatCurrencyVND(amount) {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
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
