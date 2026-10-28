import mongoose from 'mongoose';

const clauseSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề điều khoản không được để trống'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Nội dung điều khoản không được để trống'],
  },
});

const contractTemplateSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã mẫu hợp đồng không được để trống'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tên mẫu hợp đồng không được để trống'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Phân loại hợp đồng không được để trống'],
      trim: true, // Haute Couture, Bespoke First-Wear, Áo dài truyền thống, Vest chú rể
    },
    badge: {
      type: String,
      default: 'Tiêu chuẩn',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active',
      index: true,
    },
    version: {
      type: String,
      default: 'v1.0',
    },
    updatedBy: {
      type: String,
      default: 'Ban Giám Đốc Atelier',
    },
    appliedCount: {
      type: Number,
      default: 0,
    },
    defaultDuration: {
      type: String,
      default: '3 ngày 2 đêm',
    },
    depositRate: {
      type: String,
      default: '100% giá trị váy hoặc cọc bảo lãnh niêm yết',
    },
    overdueFee: {
      type: String,
      default: '500.000 VNĐ / ngày trễ',
    },
    description: {
      type: String,
      default: '',
    },
    // File văn bản mẫu hợp đồng tải lên (.doc, .docx, .pdf)
    documentFile: {
      url: { type: String, default: '' },
      name: { type: String, default: '' },
      size: { type: String, default: '' },
      uploadedAt: { type: Date, default: null },
    },
    clauses: {
      type: [clauseSchema],
      default: [],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ContractTemplate = mongoose.model('ContractTemplate', contractTemplateSchema);
export default ContractTemplate;
