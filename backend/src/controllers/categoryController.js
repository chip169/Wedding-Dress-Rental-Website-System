import * as categoryService from '../services/categoryService.js';

/**
 * Lấy danh sách danh mục
 */
export async function getCategories(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === 'true' || req.query.all === 'true';
    const search = req.query.search || req.query.q || '';
    const categories = await categoryService.getAllCategories({ includeInactive, search });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách danh mục thành công.',
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Lấy chi tiết danh mục
 */
export async function getCategoryDetail(req, res, next) {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết danh mục thành công.',
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Tạo mới danh mục
 */
export async function createCategory(req, res, next) {
  try {
    const newCategory = await categoryService.createCategory(req.body);

    return res.status(201).json({
      success: true,
      message: 'Tạo danh mục mới thành công.',
      data: newCategory,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Cập nhật danh mục
 */
export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await categoryService.updateCategory(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Chuyển đổi trạng thái kích hoạt danh mục
 */
export async function toggleCategoryStatus(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await categoryService.toggleCategoryStatus(id);

    return res.status(200).json({
      success: true,
      message: `Đã ${updated.isActive ? 'kích hoạt' : 'tạm ẩn'} danh mục "${updated.name}".`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Xóa danh mục
 */
export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const result = await categoryService.deleteCategory(id);

    return res.status(200).json({
      success: true,
      message: result.message || 'Xóa danh mục thành công.',
    });
  } catch (err) {
    next(err);
  }
}

