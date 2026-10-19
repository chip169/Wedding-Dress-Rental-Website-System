import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    dressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dress',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Nội dung nhận xét không được để trống'],
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Một đơn hàng với một mẫu váy chỉ đánh giá 1 lần
reviewSchema.index({ dressId: 1, orderId: 1, customerId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
