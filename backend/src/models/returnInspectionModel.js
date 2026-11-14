import mongoose from 'mongoose';

const itemConditionSchema = new mongoose.Schema({
  dressId: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  condition: {
    type: String,
    default: 'good',
  },
  damageName: {
    type: String,
    default: '',
  },
  feeLabel: {
    type: String,
    default: '',
  },
  note: {
    type: String,
    default: '',
  },
  damageNotes: {
    type: String,
    default: '',
  },
  repairFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  compensation: {
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
      default: null,
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
    evidencePhotos: [{ type: String }],
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
    refundBankDetails: {
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      accountHolder: { type: String, default: '' },
      notes: { type: String, default: '' },
    },
    isRefunded: {
      type: Boolean,
      default: false,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    customerStatus: {
      type: String,
      enum: ['pending', 'approved', 'disputed'],
      default: 'pending',
    },
    customerConfirmedAt: {
      type: Date,
      default: null,
    },
    disputeReason: {
      type: String,
      default: '',
    },
    disputeCreatedAt: {
      type: Date,
      default: null,
    },
    negotiatedByAdmin: {
      type: Boolean,
      default: false,
    },
    adminNegotiatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adminNegotiatorName: {
      type: String,
      default: '',
    },
    adminNegotiationNotes: {
      type: String,
      default: '',
    },
    agreedPenaltyFee: {
      type: Number,
      default: 0,
    },
    adminSettledAt: {
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
