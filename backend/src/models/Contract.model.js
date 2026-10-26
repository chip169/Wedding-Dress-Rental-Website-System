import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema(
  {
    contractCode: {
      type: String,
      required: [true, 'Mã số hợp đồng không được để trống'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContractTemplate',
      default: null,
    },
    customerName: {
      type: String,
      required: [true, 'Tên khách hàng không được để trống'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại liên hệ không được để trống'],
      trim: true,
    },
    idCard: {
      type: String,
      default: '',
      trim: true, // Số Căn cước công dân gắn chip để xác thực pháp lý
    },
    dressInfo: {
      dressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dress',
      },
      name: { type: String, required: true },
      code: { type: String, required: true },
      size: { type: String, default: '' },
      image: { type: String, default: '' },
    },
    templateName: {
      type: String,
      default: 'Hợp đồng Thuê Váy Cưới Tiêu Chuẩn',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rentalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending_signature', 'active', 'completed', 'disputed', 'cancelled'],
      default: 'pending_signature',
      index: true,
    },
    signedAt: {
      type: Date,
      default: null,
    },
    signedMethod: {
      type: String,
      default: 'Chờ khách hàng ký OTP', // 'SmartOTP eID', 'Chữ ký điện tử VNPT CA', 'Ký giấy showroom'
    },
    staffInCharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    packageType: {
      type: String,
      default: 'Gói 3 Ngày Tiêu Chuẩn',
    },
    note: {
      type: String,
      default: '',
    },
    contractPdfUrl: {
      type: String,
      default: '',
    },
    clauses: [
      {
        id: Number,
        title: String,
        content: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Contract = mongoose.model('Contract', contractSchema);
export default Contract;
