import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Dress from '../models/Dress.model.js';
import Category from '../models/Category.model.js';

async function syncCatalog() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');

  const dresses = await Dress.find().sort({ code: 1 }).populate('categoryId').lean();
  console.log('Fetched dresses from DB:', dresses.length);

  const formattedCatalog = dresses.map(d => {
    const priceNum = d.rentPrice;
    let priceCat = '5-10';
    if (priceNum < 5000000) priceCat = 'under-5';
    else if (priceNum <= 10000000) priceCat = '5-10';
    else if (priceNum <= 20000000) priceCat = '10-20';
    else priceCat = 'vip';

    const catSlug = (d.categoryId?.slug || d.silhouette.toLowerCase().replace(/\s+/g, '-'));

    return {
      id: d._id.toString(),
      code: d.code,
      name: d.name,
      badgeMain: d.collectionTag || 'HAUTE COUTURE',
      badgeSub: 'Size: ' + (d.sizes || []).join(' - '),
      rating: (d.rating || 5.0).toFixed(1),
      rentCount: (d.rentCount || 20) + ' lượt thuê',
      size: 'Size: ' + (d.sizes || []).join(' - '),
      sizes: d.sizes || [],
      priceNumber: priceNum,
      price: priceNum.toLocaleString('vi-VN') + '₫',
      depositAmount: (d.depositAmount || 0).toLocaleString('vi-VN') + '₫',
      category: catSlug,
      categoryName: d.silhouette,
      material: d.material,
      priceCategory: priceCat,
      image: d.images?.[0] || '/assets/dresses/dress_01.jpg',
      images: d.images && d.images.length > 0 ? d.images : [
        d.images?.[0] || '/assets/dresses/dress_01.jpg',
        (d.images?.[0] || '/assets/dresses/dress_01.jpg').replace('.jpg', '_mannequin.jpg'),
        (d.images?.[0] || '/assets/dresses/dress_01.jpg').replace('.jpg', '_left.jpg'),
        (d.images?.[0] || '/assets/dresses/dress_01.jpg').replace('.jpg', '_right.jpg'),
      ],
      description: d.description || '',
    };
  });

  const targetPath = path.resolve(__dirname, '../../../frontend/src/data/dressCatalog.js');
  const fileContent = '// Danh mục 25 bộ váy cưới cao cấp UniBridal Haute Couture 2026 (Đồng bộ với MongoDB & Logo)\n\nexport const DRESS_CATALOG = ' + JSON.stringify(formattedCatalog, null, 2) + ';\n';
  fs.writeFileSync(targetPath, fileContent, 'utf8');
  console.log('Successfully updated ' + targetPath + ' with ' + formattedCatalog.length + ' dresses!');
  await mongoose.disconnect();
}

syncCatalog().catch(err => {
  console.error(err);
  process.exit(1);
});

