import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  dressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dress',
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
      required: true,
      index: true,
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
        'pending_payment', // Chờ thanh toán cọc
        'deposit_paid',    // Đã thanh toán cọc thành công, giữ váy
        'preparing',       // Đang chuẩn bị / là ủi váy
        'delivered',       // Khách đã nhận đồ
        'renting',         // Trong thời gian thuê
        'returned',        // Đã trả váy về showroom
        'completed',       // Đã kiểm tra và hoàn cọc xong, đóng đơn
        'cancelled',       // Đã hủy đơn
      ],
      default: 'pending_payment',
      index: true,
    },
    shippingAddress: {
      recipientName: { type: String, required: true },
      recipientPhone: { type: String, required: true },
      street: String,
      ward: String,
      district: String,
      city: String,
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
