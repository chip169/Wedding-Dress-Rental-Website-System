import ContractTemplate from '../models/ContractTemplate.model.js';

/**
 * Service quản lý Mẫu Hợp Đồng Thuê (Contract Templates)
 */

export const getAllTemplates = async (query = {}) => {
  const filter = {};
  if (query.category && query.category !== 'all') {
    filter.category = query.category;
  }
  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }

  const templates = await ContractTemplate.find(filter).sort({ isDefault: -1, createdAt: -1 });
  return templates;
};

export const getTemplateByIdOrCode = async (idOrCode) => {
  let template;
  if (idOrCode.match(/^[0-9a-fA-F]{24}$/)) {
    template = await ContractTemplate.findById(idOrCode);
  } else {
    template = await ContractTemplate.findOne({ code: idOrCode.toUpperCase() });
  }

  if (!template) {
    const error = new Error('Không tìm thấy mẫu hợp đồng yêu cầu');
    error.statusCode = 404;
    throw error;
  }
  return template;
};

export const getDefaultTemplate = async () => {
  let template = await ContractTemplate.findOne({ isDefault: true, status: 'active' });
  if (!template) {
    template = await ContractTemplate.findOne({ status: 'active' }).sort({ createdAt: -1 });
  }
  return template;
};

export const createTemplate = async (templateData) => {
  const existing = await ContractTemplate.findOne({ code: templateData.code?.toUpperCase() });
  if (existing) {
    const error = new Error(`Mã mẫu hợp đồng '${templateData.code}' đã tồn tại trong hệ thống`);
    error.statusCode = 400;
    throw error;
  }

  if (templateData.isDefault) {
    await ContractTemplate.updateMany({}, { isDefault: false });
  }

  const newTemplate = await ContractTemplate.create(templateData);
  return newTemplate;
};

export const updateTemplate = async (idOrCode, updateData) => {
  const query = idOrCode.match(/^[0-9a-fA-F]{24}$/) ? { _id: idOrCode } : { code: idOrCode.toUpperCase() };

  if (updateData.isDefault) {
    await ContractTemplate.updateMany({ ...query, isDefault: true }, { isDefault: false });
  }

  const updated = await ContractTemplate.findOneAndUpdate(query, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    const error = new Error('Không tìm thấy mẫu hợp đồng để cập nhật');
    error.statusCode = 404;
    throw error;
  }
  return updated;
};

export const deleteTemplate = async (idOrCode) => {
  const query = idOrCode.match(/^[0-9a-fA-F]{24}$/) ? { _id: idOrCode } : { code: idOrCode.toUpperCase() };
  const deleted = await ContractTemplate.findOneAndDelete(query);

  if (!deleted) {
    const error = new Error('Không tìm thấy mẫu hợp đồng để xóa');
    error.statusCode = 404;
    throw error;
  }
  return deleted;
};

export const duplicateTemplate = async (idOrCode) => {
  const original = await getTemplateByIdOrCode(idOrCode);
  const copyObj = original.toObject ? original.toObject() : { ...original };
  delete copyObj._id;
  delete copyObj.createdAt;
  delete copyObj.updatedAt;

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  copyObj.code = `TPL-COPY-${randomSuffix}`;
  copyObj.name = `${copyObj.name} (Bản sao)`;
  copyObj.status = 'draft';
  copyObj.badge = 'Bản sao nhân bản';
  copyObj.version = 'v1.0-draft';
  copyObj.isDefault = false;
  copyObj.appliedCount = 0;

  const duplicated = await ContractTemplate.create(copyObj);
  return duplicated;
};

