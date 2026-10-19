import mongoose from 'mongoose';

const dressSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã sản phẩm (SKU) không được để trống'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tên sản phẩm không được để trống'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug không được để trống'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Danh mục không được để trống'],
      index: true,
    },
    silhouette: {
      type: String,
      enum: ['Ballgown', 'Mermaid', 'A-Line', 'Silk Gown', 'Princess', 'Traditional', 'Tuxedo', 'Other'],
      default: 'Other',
    },
    description: {
      type: String,
      default: '',
    },
    material: {
      type: String,
      default: '', // Vải ren Pháp, Lụa tơ tằm Ý, Satin
    },
    color: {
      type: String,
      default: 'Trắng',
    },
    sizes: [
      {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'FreeSize'],
        default: ['S', 'M'],
      },
    ],
    images: [
      {
        type: String,
      },
    ],
    rentPrice: {
      type: Number,
      required: [true, 'Giá thuê không được để trống'],
      min: [0, 'Giá thuê không được âm'],
    },
    depositAmount: {
      type: Number,
      required: [true, 'Tiền cọc bảo lãnh không được để trống'],
      min: [0, 'Tiền cọc không được âm'],
    },
    originalPrice: {
      type: Number,
      default: 0, // Giá trị thực tế của mẫu váy
    },
    status: {
      type: String,
      enum: ['available', 'renting', 'maintenance', 'retired'],
      default: 'available',
      index: true,
    },
    rentCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    collectionTag: {
      type: String,
      default: 'THE HAUTE COUTURE BRIDAL 2026',
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    highlights: [
      {
        icon: { type: String, default: 'diamond' },
        label: { type: String, default: '' },
        value: { type: String, default: '' },
        sub: { type: String, default: '' },
      },
    ],
    colorOptions: [
      {
        name: { type: String },
        hex: { type: String },
        border: { type: String },
      },
    ],
    story: {
      collectionName: { type: String, default: '' },
      title: { type: String, default: '' },
      content: [{ type: String }],
      atelierImage: { type: String, default: '' },
      stats: [
        {
          value: { type: String },
          label: { type: String },
        },
      ],
    },
    realBrides: [
      {
        brideName: { type: String },
        date: { type: String },
        image: { type: String },
        quote: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index tìm kiếm theo tên và chất liệu
dressSchema.index({ name: 'text', description: 'text', material: 'text' });

const Dress = mongoose.model('Dress', dressSchema);
export default Dress;
