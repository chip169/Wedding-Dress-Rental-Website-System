import mongoose from 'mongoose';

const itemConditionSchema = new mongoose.Schema({
  dressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dress',
    required: true,
  },
  condition: {
    type: String,
    enum: ['good', 'minor_stain', 'heavy_damage', 'torn_lace'],
    default: 'good',
  },
  note: {
    type: String,
    default: '',
  },
  repairFee: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const returnInspectionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    returnedAt: {
      type: Date,
      default: Date.now,
    },
    lateDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    latePenaltyFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    itemsCondition: [itemConditionSchema],
    totalDeduction: {
      type: Number,
      default: 0,
      min: 0, // Tổng khấu trừ = Tiền phạt trễ + Tiền khắc phục hư hại
    },
    initialDeposit: {
      type: Number,
      required: true,
      min: 0,
    },
    finalRefundAmount: {
      type: Number,
      required: true, // Tiền hoàn trả khách = Cọc ban đầu - Tổng khấu trừ
    },
    isRefunded: {
      type: Boolean,
      default: false,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ReturnInspection = mongoose.model('ReturnInspection', returnInspectionSchema);
export default ReturnInspection;
