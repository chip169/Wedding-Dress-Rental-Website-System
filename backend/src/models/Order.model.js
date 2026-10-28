import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  dressId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  rentPrice: {
    type: Number,
    required: true,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customerName: {
      type: String,
      default: '',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    customerEmail: {
      type: String,
      default: '',
    },
    customerCccd: {
      type: String,
      default: '',
    },
    contractCode: {
      type: String,
      default: '',
    },
    contractSignature: {
      type: String,
      default: '',
    },
    measurements: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    items: [orderItemSchema],
    rentalStartDate: {
      type: Date,
      required: [true, 'Ngày bắt đầu thuê không được để trống'],
      index: true,
    },
    rentalEndDate: {
      type: Date,
      required: [true, 'Ngày hẹn trả váy không được để trống'],
      index: true,
    },
    rentalDays: {
      type: Number,
      default: 4,
      min: 1,
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
    totalRentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDeposit: {
      type: Number,
      required: true,
      min: 0,
    },
    depositPaidAmount: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalPayment: {
      type: Number,
      required: true,
      min: 0, // Tổng thanh toán ban đầu = Tiền thuê + Tiền cọc + Ship - Giảm giá
    },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'deposit_paid',
        'active',
        'confirmed',
        'preparing',
        'delivered',
        'renting',
        'returned',
        'complete',
        'completed',
        'cancelled',
      ],
      default: 'deposit_paid',
      index: true,
    },
    shippingAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    deliveryMethod: {
      type: String,
      default: 'showroom',
    },
    rentalAgreementAccepted: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index kép hỗ trợ query kiểm tra trùng lịch thuê (overlap check)
orderSchema.index({ 'items.dressId': 1, rentalStartDate: 1, rentalEndDate: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
