import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Dress from '../models/dressModel.js';
import Category from '../models/categoryModel.js';

export const DRESS_DATA_25 = [
  // 1. BALLGOWN (5 mẫu)
  {
    code: 'UB-001',
    name: 'Elysian Rose Ballgown',
    silhouette: 'Ballgown',
    categorySlug: 'ballgown',
    material: 'Ren 3D Floral',
    color: 'Hồng Pastel',
    rentPrice: 5200000,
    depositAmount: 15000000,
    originalPrice: 85000000,
    sizes: ['XS', 'S'],
    collectionTag: 'BALLGOWN VIP',
    image: '/assets/dresses/dress_01.jpg',
    description: 'Vẻ đẹp kiêu hãnh của đóa hồng trong sương sớm. Thiết kế bồng bềnh hoàng gia với cấu trúc siết eo corsetry Pháp.',
  },
  {
    code: 'UB-006',
    name: 'Seraphina Feather Romance',
    silhouette: 'Ballgown',
    categorySlug: 'ballgown',
    material: 'Lụa Mikado Ý',
    color: 'Hồng Phấn Ánh Trắng',
    rentPrice: 6800000,
    depositAmount: 18000000,
    originalPrice: 98000000,
    sizes: ['S', 'M'],
    collectionTag: 'SIGNATURE PIECE',
    image: '/assets/dresses/dress_06.jpg',
    description: 'Sự kết hợp giữa lụa Mikado thượng hạng và viền lông vũ bồng bềnh, tạo nên từng chuyển động nhẹ nhàng như thiên thần.',
  },
  {
    code: 'UB-010',
    name: 'Ophelia Sparkling Star',
    silhouette: 'Ballgown',
    categorySlug: 'ballgown',
    material: 'Satin Tơ Tằm Tự Nhiên',
    color: 'Xanh Khói Ánh Kim',
    rentPrice: 6200000,
    depositAmount: 17000000,
    originalPrice: 92000000,
    sizes: ['XS', 'M', 'L'],
    collectionTag: 'STARLIGHT BRIDAL',
    image: '/assets/dresses/dress_10.jpg',
    description: 'Lung linh như một dải thiên hà lấp lánh dưới ánh đèn lễ đường, phong cách cổ tích hoàng gia kiêu sa.',
  },
  {
    code: 'UB-014',
    name: 'Helena Cathedral Veil',
    silhouette: 'Ballgown',
    categorySlug: 'ballgown',
    material: 'Đính Kết Pha Lê Swarovski',
    color: 'Trắng Sữa',
    rentPrice: 15000000,
    depositAmount: 35000000,
    originalPrice: 120000000,
    sizes: ['L', 'XL'],
    collectionTag: 'CATHEDRAL SPECIAL',
    image: '/assets/dresses/dress_14.jpg',
    description: 'Đuôi váy dài 3 mét phong cách thánh đường lộng lẫy, đính kết pha lê Swarovski tỉ mỉ cùng khăn voan dài chạm đất.',
  },
  {
    code: 'UB-017',
    name: 'Anastasia Czarina Ballgown',
    silhouette: 'Ballgown',
    categorySlug: 'ballgown',
    material: 'Ren 3D Floral',
    color: 'Bạch Kim Hoàng Kim',
    rentPrice: 24000000,
    depositAmount: 50000000,
    originalPrice: 140000000,
    sizes: ['M', 'L'],
    collectionTag: 'ROYAL BALLROOM',
    image: '/assets/dresses/dress_17.jpg',
    description: 'Lấy cảm hứng từ trang phục vũ hội hoàng triều châu Âu, đính pha lê Swarovski viền cổ và eo corset siết tôn dáng.',
  },

  // 2. MERMAID (5 mẫu)
  {
    code: 'UB-002',
    name: 'Celeste Royal Mermaid',
    silhouette: 'Mermaid',
    categorySlug: 'mermaid',
    material: 'Satin Tơ Tằm Tự Nhiên',
    color: 'Trắng Kem (Ivory)',
    rentPrice: 6500000,
    depositAmount: 18000000,
    originalPrice: 95000000,
    sizes: ['M', 'L'],
    collectionTag: 'HAUTE COUTURE',
    image: '/assets/dresses/dress_02.jpg',
    description: 'Đuôi cá điêu khắc ôm trọn đường cong quyến rũ, kết hợp satin tơ tằm tự nhiên cùng kỹ thuật dựng phom điêu luyện.',
  },
  {
    code: 'UB-009',
    name: 'Genevieve French Chantilly',
    silhouette: 'Mermaid',
    categorySlug: 'mermaid',
    material: 'Ren 3D Floral',
    color: 'Trắng Tinh Khiết',
    rentPrice: 5900000,
    depositAmount: 16000000,
    originalPrice: 88000000,
    sizes: ['S', 'L'],
    collectionTag: 'PARISIAN CHIC',
    image: '/assets/dresses/dress_09.jpg',
    description: 'Toàn bộ thân váy dệt ren 3D hoa nổi thượng hạng nhập khẩu, khoét lưng chữ V sâu quyến rũ kiêu kỳ.',
  },
  {
    code: 'UB-013',
    name: 'Valerie Rose Gold Embellished',
    silhouette: 'Mermaid',
    categorySlug: 'mermaid',
    material: 'Đính Kết Pha Lê Swarovski',
    color: 'Rose Gold Ánh Bạc',
    rentPrice: 16500000,
    depositAmount: 38000000,
    originalPrice: 105000000,
    sizes: ['S', 'M', 'L'],
    collectionTag: 'ROSE GOLD LUXURY',
    image: '/assets/dresses/dress_13.jpg',
    description: 'Sắc vàng hồng độc quyền tôn nước da cô dâu châu Á, họa tiết đính kết pha lê Swarovski uốn lượn tỉ lệ vàng.',
  },
  {
    code: 'UB-016',
    name: 'Penelope Feathered Train',
    silhouette: 'Mermaid',
    categorySlug: 'mermaid',
    material: 'Lụa Mikado Ý',
    color: 'Trắng Tinh Khôi',
    rentPrice: 22000000,
    depositAmount: 48000000,
    originalPrice: 96000000,
    sizes: ['S', 'M'],
    collectionTag: 'MODERN COUTURE',
    image: '/assets/dresses/dress_16.jpg',
    description: 'Phom dáng đuôi cá cắt cúp điêu nghệ trên nền lụa Mikado Ý, xòe phồng từ đầu gối bằng tầng tầng lông vũ thiên nga.',
  },
  {
    code: 'UB-019',
    name: 'Adeline Silk Crepe Mermaid',
    silhouette: 'Mermaid',
    categorySlug: 'mermaid',
    material: 'Lụa Mikado Ý và Satin Tơ Tằm Tự Nhiên',
    color: 'Trắng Kem Nhạt',
    rentPrice: 5600000,
    depositAmount: 16000000,
    originalPrice: 86000000,
    sizes: ['XS', 'S', 'M'],
    collectionTag: 'CREPE ATELIER',
    image: '/assets/dresses/dress_19.jpg',
    description: 'Chất liệu lụa Mikado và satin tơ tằm đứng phom rũ mượt, lưng hở ren mỏng manh tôn lên sống lưng thanh tú của cô dâu.',
  },

  // 3. A-LINE (5 mẫu)
  {
    code: 'UB-004',
    name: 'Monet 3D Floral Couture',
    silhouette: 'A-Line',
    categorySlug: 'a-line',
    material: 'Ren 3D Floral',
    color: 'Trắng Tinh Khôi',
    rentPrice: 5500000,
    depositAmount: 15000000,
    originalPrice: 78000000,
    sizes: ['S', 'M', 'L'],
    collectionTag: 'NEW SEASON 2026',
    image: '/assets/dresses/dress_04.jpg',
    description: 'Tái hiện khu vườn Monet lãng mạn qua hàng ngàn cánh hoa ren 3D dập nổi thủ công bay bổng.',
  },
  {
    code: 'UB-007',
    name: 'Vivienne Vintage Lace',
    silhouette: 'A-Line',
    categorySlug: 'a-line',
    material: 'Lụa Mikado Ý',
    color: 'Trắng Ngà Vintage',
    rentPrice: 4600000,
    depositAmount: 12000000,
    originalPrice: 65000000,
    sizes: ['L', 'XL'],
    collectionTag: 'VINTAGE HERITAGE',
    image: '/assets/dresses/dress_07.jpg',
    description: 'Cảm hứng từ phong cách quý phái thập niên 1920 trên nền lụa Mikado Ý, cổ áo vát nhẹ và tay bồng thanh thoát.',
  },
  {
    code: 'UB-015',
    name: 'Rosalie Blossom Gown',
    silhouette: 'A-Line',
    categorySlug: 'a-line',
    material: 'Satin Tơ Tằm Tự Nhiên',
    color: 'Hồng Nhạt Phấn Hoa',
    rentPrice: 4800000,
    depositAmount: 14000000,
    originalPrice: 72000000,
    sizes: ['XS', 'L'],
    collectionTag: 'SPRING BLOSSOM',
    image: '/assets/dresses/dress_15.jpg',
    description: 'Thơ mộng và nữ tính với satin tơ tằm tự nhiên óng ả, hoa anh đào thêu chỉ tơ bóng, lý tưởng cho tiệc cưới mùa xuân.',
  },
  {
    code: 'UB-022',
    name: 'Clara Ethereal Chiffon',
    silhouette: 'A-Line',
    categorySlug: 'a-line',
    material: 'Đính Kết Pha Lê Swarovski',
    color: 'Trắng Mây',
    rentPrice: 4300000,
    depositAmount: 12000000,
    originalPrice: 62000000,
    sizes: ['S', 'M', 'L'],
    collectionTag: 'ETHEREAL DREAM',
    image: '/assets/dresses/dress_22.jpg',
    description: 'Nhẹ tựa làn sương sớm, đính kết pha lê Swarovski điểm xuyết tinh tế bay bổng theo từng bước di chuyển.',
  },
  {
    code: 'UB-024',
    name: 'Guinevere Renaissance Gown',
    silhouette: 'A-Line',
    categorySlug: 'a-line',
    material: 'Satin Tơ Tằm Tự Nhiên',
    color: 'Trắng Ngà',
    rentPrice: 12500000,
    depositAmount: 30000000,
    originalPrice: 125000000,
    sizes: ['S', 'M', 'L'],
    collectionTag: 'RENAISSANCE LUXE',
    image: '/assets/dresses/dress_24.jpg',
    description: 'Phong cách Phục Hưng quý phái với sự phối hợp giữa ren 3D hoa nổi và satin tơ tằm cao cấp, tay áo rũ dài tháo rời.',
  },

  // 4. SILK GOWN (5 mẫu)
  {
    code: 'UB-003',
    name: 'Lumière Minimal Silk',
    silhouette: 'Silk Gown',
    categorySlug: 'silk-gown',
    material: 'Lụa Mikado Ý',
    color: 'Trắng Sữa',
    rentPrice: 3800000,
    depositAmount: 10000000,
    originalPrice: 55000000,
    sizes: ['XS'],
    collectionTag: 'TƠ TẰM Ý',
    image: '/assets/dresses/dress_03.jpg',
    description: 'Vẻ đẹp tinh giản đương đại, đường cắt may chuẩn xác tôn vinh chất liệu lụa Mikado thượng hạng sáng bóng.',
  },
  {
    code: 'UB-008',
    name: 'Juliette Pure Silk',
    silhouette: 'Silk Gown',
    categorySlug: 'silk-gown',
    material: 'Satin Tơ Tằm Tự Nhiên',
    color: 'Trắng Ngọc Trai',
    rentPrice: 4200000,
    depositAmount: 12000000,
    originalPrice: 60000000,
    sizes: ['XS', 'S', 'M'],
    collectionTag: 'MINIMAL COUTURE',
    image: '/assets/dresses/dress_08.jpg',
    description: 'Thiết kế satin tơ tằm tự nhiên xẻ đùi tinh tế cùng nếp gấp draping thủ công quanh eo tạo hiệu ứng thon gọn tuyệt đối.',
  },
  {
    code: 'UB-012',
    name: 'Camille Pearl Satin',
    silhouette: 'Silk Gown',
    categorySlug: 'silk-gown',
    material: 'Ren 3D Floral',
    color: 'Trắng Kem Ivory',
    rentPrice: 4500000,
    depositAmount: 13000000,
    originalPrice: 68000000,
    sizes: ['XS', 'S'],
    collectionTag: 'PEARL ATELIER',
    image: '/assets/dresses/dress_12.jpg',
    description: 'Viền cổ ren 3D floral kết hợp chuỗi hạt ngọc trai nước ngọt sáng bóng, thiết kế cúp ngực trái tim ngọt ngào.',
  },
  {
    code: 'UB-018',
    name: 'Diane Parisian Minimalist',
    silhouette: 'Silk Gown',
    categorySlug: 'silk-gown',
    material: 'Đính Kết Pha Lê Swarovski',
    color: 'Trắng Sữa Thuần Khiết',
    rentPrice: 3900000,
    depositAmount: 11000000,
    originalPrice: 58000000,
    sizes: ['S', 'M'],
    collectionTag: 'PARIS MINIMAL',
    image: '/assets/dresses/dress_18.jpg',
    description: 'Tinh thần thời trang Paris thanh lịch: lụa mềm mượt đính kết pha lê Swarovski nhẹ nhàng tại thắt lưng hoàn mỹ.',
  },
  {
    code: 'UB-023',
    name: 'Eleanor Sovereign Silk',
    silhouette: 'Silk Gown',
    categorySlug: 'silk-gown',
    material: 'Lụa Mikado Ý',
    color: 'Trắng Kim Cương',
    rentPrice: 14000000,
    depositAmount: 32000000,
    originalPrice: 79000000,
    sizes: ['XS', 'S', 'M'],
    collectionTag: 'VIETNAMESE SILK',
    image: '/assets/dresses/dress_23.jpg',
    description: 'Sử dụng lụa Mikado Ý cao cấp phối dải pha lê Swarovski sau lưng, mang lại cảm giác mát lạnh và mềm mượt bậc nhất.',
  },

  // 5. PRINCESS (5 mẫu)
  {
    code: 'UB-005',
    name: 'Aurora Crystal Princess',
    silhouette: 'Princess',
    categorySlug: 'princess',
    material: 'Đính Kết Pha Lê Swarovski',
    color: 'Trắng Kim Cương',
    rentPrice: 25000000,
    depositAmount: 55000000,
    originalPrice: 110000000,
    sizes: ['M'],
    collectionTag: 'ROYAL ATELIER',
    image: '/assets/dresses/dress_05.jpg',
    description: 'Dáng công chúa đính kết pha lê Swarovski lấp lánh như cực quang đêm bắc cực, tùng váy 12 lớp xòe rộng 2m uy nghi.',
  },
  {
    code: 'UB-011',
    name: 'Isabella Royal Court',
    silhouette: 'Princess',
    categorySlug: 'princess',
    material: 'Ren 3D Floral',
    color: 'Trắng Hoàng Gia',
    rentPrice: 18000000,
    depositAmount: 40000000,
    originalPrice: 135000000,
    sizes: ['M', 'L', 'XL'],
    collectionTag: 'IMPERIAL COLLECTION',
    image: '/assets/dresses/dress_11.jpg',
    description: 'Dành cho các buổi tiệc cưới quy mô đại lễ, hoa văn ren 3D dệt nổi hoàng gia cùng tùng váy thêu tay công phu.',
  },
  {
    code: 'UB-020',
    name: 'Margot Corset Royal',
    silhouette: 'Princess',
    categorySlug: 'princess',
    material: 'Lụa Mikado Ý',
    color: 'Trắng Ngà',
    rentPrice: 6400000,
    depositAmount: 18000000,
    originalPrice: 97000000,
    sizes: ['S', 'M'],
    collectionTag: 'CORSET COUTURE',
    image: '/assets/dresses/dress_20.jpg',
    description: 'Cấu trúc siết eo 16 gọng thép Đức trên nền lụa Mikado Ý chuẩn Haute Couture giúp thu nhỏ 5-8cm vòng eo êm ái.',
  },
  {
    code: 'UB-021',
    name: 'Beatrice Imperial Lace',
    silhouette: 'Princess',
    categorySlug: 'princess',
    material: 'Satin Tơ Tằm Tự Nhiên',
    color: 'Trắng Bạch Kim',
    rentPrice: 7500000,
    depositAmount: 22000000,
    originalPrice: 115000000,
    sizes: ['M', 'L'],
    collectionTag: 'IMPERIAL BRIDAL',
    image: '/assets/dresses/dress_21.jpg',
    description: 'Chất liệu satin tơ tằm tự nhiên cùng tùng xòe bề thế, mẫu váy dành riêng cho nàng dâu thích vẻ lộng lẫy cổ điển.',
  },
  {
    code: 'UB-025',
    name: 'Sylvie Champagne Tulle',
    silhouette: 'Princess',
    categorySlug: 'princess',
    material: 'Ren 3D Floral và Đính Kết Pha Lê Swarovski',
    color: 'Champagne Ánh Hồng',
    rentPrice: 5800000,
    depositAmount: 16000000,
    originalPrice: 89000000,
    sizes: ['M', 'L'],
    collectionTag: 'CHAMPAGNE MAGIC',
    image: '/assets/dresses/dress_25.jpg',
    description: 'Sắc rượu champagne ấm áp kết hợp ren 3D và pha lê Swarovski làm bừng sáng mọi sảnh tiệc phương Tây.',
  },
];

export async function seed25Dresses() {
  try {
    console.log('Connecting to MongoDB...');
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 4000 });
    } catch (e) {
      console.warn('Atlas connection failed or timed out. Connecting to local MongoDB...');
      await mongoose.connect('mongodb://127.0.0.1:27017/wedding_dress_rental');
    }
    console.log('Connected to MongoDB successfully!');

    // 1. Delete traditional và tuxedo categories
    console.log('Removing traditional and tuxedo categories...');
    const catDeleteRes = await Category.deleteMany({ slug: { $in: ['traditional', 'tuxedo'] } });
    console.log(`Deleted ${catDeleteRes.deletedCount} traditional/tuxedo categories.`);

    // 2. Ensure only 5 core silhouettes exist
    const categoryMap = {
      ballgown: { name: 'Váy Cưới Công Chúa (Ballgown)', silhouette: 'Ballgown' },
      mermaid: { name: 'Váy Cưới Đuôi Cá (Mermaid)', silhouette: 'Mermaid' },
      'a-line': { name: 'Váy Cưới Chữ A (A-Line)', silhouette: 'A-Line' },
      'silk-gown': { name: 'Váy Cưới Lụa Tối Giản (Silk Gown)', silhouette: 'Silk Gown' },
      princess: { name: 'Váy Cưới Hoàng Gia (Princess)', silhouette: 'Princess' },
    };

    const categoriesInDb = {};
    for (const [slug, val] of Object.entries(categoryMap)) {
      let cat = await Category.findOne({ slug });
      if (!cat) {
        cat = await Category.create({
          name: val.name,
          slug,
          description: `Danh mục ${val.name} thương hiệu UniBridal Atelier`,
          isActive: true,
        });
      }
      categoriesInDb[slug] = cat._id;
    }

    // 3. Delete ALL existing dresses
    console.log('Deleting existing dresses from MongoDB...');
    const dressDeleteRes = await Dress.deleteMany({});
    console.log(`Deleted ${dressDeleteRes.deletedCount} old dresses.`);

    // 4. Insert exactly 25 dresses
    const dressesToInsert = DRESS_DATA_25.map((item, index) => {
      const code = item.code;
      const slug = item.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      return {
        code,
        name: item.name,
        slug: `${slug}-${code.toLowerCase()}`,
        categoryId: categoriesInDb[item.categorySlug],
        silhouette: item.silhouette,
        material: item.material,
        color: item.color,
        rentPrice: item.rentPrice,
        depositAmount: item.depositAmount,
        originalPrice: item.originalPrice,
        sizes: item.sizes,
        images: {
          'UB-001': [
            '/assets/dresses/dress_01.jpg',
            '/assets/dresses/dress_01_mannequin.jpg',
            '/assets/dresses/dress_01_left.jpg',
            '/assets/dresses/dress_01_right.jpg',
            '/assets/dresses/dress_01_banquet.jpg'
          ],
          'UB-002': [
            '/assets/dresses/dress_02.jpg',
            '/assets/dresses/dress_02_mannequin.jpg',
            '/assets/dresses/dress_02_left.jpg',
            '/assets/dresses/dress_02_right.jpg',
            '/assets/dresses/dress_02_conservatory.jpg'
          ],
          'UB-003': [
            '/assets/dresses/dress_03.jpg',
            '/assets/dresses/dress_03_v1.jpg',
            '/assets/dresses/dress_03_v2.jpg',
            '/assets/dresses/dress_03_v3.jpg',
            '/assets/dresses/dress_03_v4.jpg'
          ],
          'UB-004': [
            '/assets/dresses/dress_04.jpg',
            '/assets/dresses/dress_04_v1.jpg',
            '/assets/dresses/dress_04_v2.jpg',
            '/assets/dresses/dress_04_v3.jpg',
            '/assets/dresses/dress_04_v4.jpg'
          ],
          'UB-005': [
            '/assets/dresses/dress_05.jpg',
            '/assets/dresses/dress_05_v1.jpg',
            '/assets/dresses/dress_05_v2.jpg',
            '/assets/dresses/dress_05_v3.jpg',
            '/assets/dresses/dress_05_v4.jpg'
          ],
          'UB-006': [
            '/assets/dresses/dress_06.jpg',
            '/assets/dresses/dress_06_v1.jpg',
            '/assets/dresses/dress_06_v2.jpg',
            '/assets/dresses/dress_06_v3.jpg',
            '/assets/dresses/dress_06_v4.jpg'
          ],
          'UB-007': [
            '/assets/dresses/dress_07.jpg',
            '/assets/dresses/dress_07_v1.jpg',
            '/assets/dresses/dress_07_v2.jpg',
            '/assets/dresses/dress_07_v3.jpg',
            '/assets/dresses/dress_07_v4.jpg'
          ],
          'UB-008': [
            '/assets/dresses/dress_08.jpg',
            '/assets/dresses/dress_08_v1.jpg',
            '/assets/dresses/dress_08_v2.jpg',
            '/assets/dresses/dress_08_v3.jpg',
            '/assets/dresses/dress_08_v4.jpg'
          ],
          'UB-009': [
            '/assets/dresses/dress_09.jpg',
            '/assets/dresses/dress_09_v1.jpg',
            '/assets/dresses/dress_09_v2.jpg'
          ],
          'UB-010': [
            '/assets/dresses/dress_10.jpg',
            '/assets/dresses/dress_10_mannequin.jpg',
            '/assets/dresses/dress_10_left.jpg',
            '/assets/dresses/dress_10_right.jpg',
            '/assets/dresses/dress_10_banquet.jpg'
          ],
          'UB-011': [
            '/assets/dresses/dress_11.jpg',
            '/assets/dresses/dress_11_mannequin.jpg',
            '/assets/dresses/dress_11_left.jpg',
            '/assets/dresses/dress_11_right.jpg'
          ],
        }[item.code] || [
          item.image,
          item.image.replace('.jpg', '_mannequin.jpg'),
          item.image.replace('.jpg', '_left.jpg'),
          item.image.replace('.jpg', '_right.jpg'),
        ],
        status: 'available',
        rentCount: 20 + index * 3,
        isFeatured: index < 6,
        collectionTag: item.collectionTag,
        rating: Number((4.8 + (index % 3) * 0.1).toFixed(1)),
        reviewCount: 15 + index * 2,
        description: item.description,
        highlights: [
          {
            icon: 'diamond',
            label: 'Chất Liệu Thượng Hạng',
            value: item.material.split('&')[0].trim(),
            sub: 'Độc quyền Atelier UniBridal',
          },
          {
            icon: 'sparkles',
            label: 'Đính Kết Thủ Công',
            value: 'Pha Lê và Chỉ Tơ Kim',
            sub: '100% chế tác tay tỉ mỉ',
          },
          {
            icon: 'shield',
            label: 'Bảo Quản Chuẩn Atelier',
            value: 'Hấp nhiệt và Tiệt trùng UV',
            sub: 'Đóng gói vali chuyên dụng',
          },
        ],
        colorOptions: [
          { name: item.color, hex: '#FDFBF7', border: '#E7DEC8' },
          { name: 'Trắng Kem Ivory', hex: '#F6EFEB', border: '#D8C3BE' },
        ],
        story: {
          collectionName: item.collectionTag,
          title: item.name,
          content: [
            `Mẫu thiết kế ${item.name} được lấy cảm hứng từ vẻ đẹp tinh tế của thời trang Haute Couture Paris kết hợp cùng kỹ thuật may đo tỉ mỉ của nghệ nhân UniBridal.`,
            `Với chất liệu ${item.material}, chiếc váy giúp tôn vinh hoàn hảo đường nét yêu kiều của nàng dâu trong từng khoảnh khắc bước lên lễ đường thiêng liêng.`,
          ],
          atelierImage: item.image.replace('.jpg', '_mannequin.jpg'),
          stats: [
            { value: `${200 + index * 10}h`, label: 'CHẾ TÁC THỦ CÔNG' },
            { value: '100%', label: 'CHẤT LIỆU CAO CẤP' },
            { value: `${item.sizes.length} Size`, label: 'SỐ LƯỢNG KÍCH CỠ' },
          ],
        },
      };
    });

    console.log(`Inserting exactly 25 dresses into database...`);
    const inserted = await Dress.insertMany(dressesToInsert);
    console.log(`Successfully seeded ${inserted.length} dresses into MongoDB!`);

    await mongoose.disconnect();
    console.log('MongoDB disconnected cleanly.');
    return inserted;
  } catch (err) {
    console.error('Error seeding 25 dresses:', err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed25Dresses.js')) {
  seed25Dresses();
}

