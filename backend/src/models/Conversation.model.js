import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    pinnedDressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dress',
      default: null,
    },
    lastMessage: {
      text: { type: String, default: '' },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      senderRole: { type: String, enum: ['customer', 'staff', 'admin'] },
      createdAt: { type: Date, default: Date.now },
      isRead: { type: Boolean, default: false },
    },
    unreadCustomerCount: {
      type: Number,
      default: 0,
    },
    unreadStaffCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'archived'],
      default: 'active',
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index đảm bảo tìm nhanh đoạn chat giữa khách và nhân viên
conversationSchema.index({ customerId: 1, staffId: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
