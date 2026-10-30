import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['customer', 'staff', 'admin'],
      required: true,
    },
    text: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    attachments: [
      {
        fileType: {
          type: String,
          enum: ['image', 'document', 'audio'],
          default: 'image',
        },
        url: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          default: '',
        },
      },
    ],
    relatedDressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dress',
      default: null,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
