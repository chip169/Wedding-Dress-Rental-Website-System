import Category from '../models/categoryModel.js';
import Dress from '../models/dressModel.js';

// Helper tạo slug tự động từ tên tiếng Việt
function createSlug(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Lấy danh sách tất cả danh mục kèm số lượng mẫu váy tương ứng
 */
export async function getAllCategories({ includeInactive = true, search = '' } = {}) {
  const query = {};
  if (!includeInactive) {
    query.isActive = true;
  }
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { slug: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const categories = await Category.find(query).sort({ createdAt: 1 }).lean();

  // Đếm số lượng váy thuộc từng danh mục (chỉ đếm váy đang lưu hành / khả dụng, loại trừ váy đã xóa retired)
  const counts = await Dress.aggregate([
    {
      $match: {
        status: { $ne: 'retired' },
      },
    },
    {
      $group: {
        _id: '$categoryId',
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = {};
  counts.forEach((c) => {
    if (c._id) {
      countMap[String(c._id)] = c.count;
    }
  });

  return categories.map((cat) => ({
    ...cat,
    dressCount: countMap[String(cat._id)] || 0,
  }));
}

/**
 * Lấy chi tiết 1 danh mục theo ID
 */
export async function getCategoryById(id) {
  const category = await Category.findById(id).lean();
  if (!category) {
    throw new Error('Không tìm thấy thông tin danh mục.');
  }

  const dressCount = await Dress.countDocuments({ categoryId: category._id, status: { $ne: 'retired' } });
  return { ...category, dressCount };
}

/**
 * Tạo danh mục mới
 */
export async function createCategory(data) {
  const name = (data.name || '').trim();
  if (!name) {
    throw new Error('Tên danh mục không được để trống.');
  }

  let slug = (data.slug || '').trim();
  if (!slug) {
    slug = createSlug(name);
  } else {
    slug = createSlug(slug);
  }

  const existing = await Category.findOne({ slug });
  if (existing) {
    throw new Error(`Slug danh mục "${slug}" đã tồn tại. Vui lòng chọn slug khác.`);
  }

  const newCategory = await Category.create({
    name,
    slug,
    description: (data.description || '').trim(),
    image: (data.image || '').trim(),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
  });

  return newCategory;
}

/**
 * Cập nhật danh mục
 */
export async function updateCategory(id, data) {
  const category = await Category.findById(id);
  if (!category) {
    throw new Error('Không tìm thấy danh mục để cập nhật.');
  }

  if (data.name && data.name.trim()) {
    category.name = data.name.trim();
  }

  if (data.slug && data.slug.trim()) {
    const nextSlug = createSlug(data.slug.trim());
    if (nextSlug !== category.slug) {
      const existing = await Category.findOne({ slug: nextSlug, _id: { $ne: id } });
      if (existing) {
        throw new Error(`Slug danh mục "${nextSlug}" đã bị trùng lặp.`);
      }
      category.slug = nextSlug;
    }
  }

  if (data.description !== undefined) {
    category.description = (data.description || '').trim();
  }

  if (data.image !== undefined) {
    category.image = (data.image || '').trim();
  }

  if (data.isActive !== undefined) {
    category.isActive = Boolean(data.isActive);
  }

  await category.save();
  return category;
}

/**
 * Chuyển đổi trạng thái hiển thị (Bật/Tắt kích hoạt)
 */
export async function toggleCategoryStatus(id) {
  const category = await Category.findById(id);
  if (!category) {
    throw new Error('Không tìm thấy danh mục.');
  }

  category.isActive = !category.isActive;
  await category.save();
  return category;
}

/**
 * Xóa danh mục
 */
export async function deleteCategory(id) {
  const category = await Category.findById(id);
  if (!category) {
    throw new Error('Không tìm thấy danh mục để xóa.');
  }

  // Kiểm tra xem danh mục có đang chứa váy cưới hay không (loại trừ váy đã xóa retired)
  const dressCount = await Dress.countDocuments({ categoryId: id, status: { $ne: 'retired' } });
  if (dressCount > 0) {
    throw new Error(`Không thể xóa: Danh mục đang có ${dressCount} mẫu váy cưới liên kết.`);
  }

  await Category.findByIdAndDelete(id);
  return { message: 'Đã xóa danh mục thành công.' };
}

