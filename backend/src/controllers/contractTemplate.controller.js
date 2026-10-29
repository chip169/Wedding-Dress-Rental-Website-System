import * as templateService from '../services/contractTemplate.service.js';

export const getTemplates = async (req, res, next) => {
  try {
    const templates = await templateService.getAllTemplates(req.query);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách mẫu hợp đồng thành công',
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (req, res, next) => {
  try {
    const template = await templateService.getTemplateByIdOrCode(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết mẫu hợp đồng thành công',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const getDefaultTemplate = async (req, res, next) => {
  try {
    const template = await templateService.getDefaultTemplate();
    res.status(200).json({
      success: true,
      message: 'Lấy mẫu hợp đồng mặc định thành công',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const newTemplate = await templateService.createTemplate(req.body);
    res.status(201).json({
      success: true,
      message: 'Tạo mới mẫu hợp đồng thành công',
      data: newTemplate,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const updated = await templateService.updateTemplate(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Cập nhật mẫu hợp đồng thành công',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
