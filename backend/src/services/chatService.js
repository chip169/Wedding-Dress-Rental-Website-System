import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';

// Danh sách mẫu hội thoại khởi tạo cho hệ thống (đảm bảo admin có sẵn dữ liệu quản lý)
const DEFAULT_INITIAL_CONVERSATIONS = [
  {
    customerName: 'Nguyễn Thảo Linh',
    customerPhone: '0912345678',
    lastMessageText: 'Em muốn chỉnh hạ eo thêm 1.5cm cho mẫu Elysian Rose...',
    messages: [
      {
        senderRole: 'staff',
        text: 'Chị gửi Linh ảnh cận cảnh mũi thêu đính kết cườm hoa hồng 3D xưởng vừa lên khung xong trưa nay nhé!',
      },
      {
        senderRole: 'customer',
        text: 'Dạ tuyệt quá chị ơi! Vậy chị chốt lưu số đo chỉnh hạ eo thêm 1.5cm cho mẫu Elysian Rose giúp em vào hợp đồng nhé ạ! Hôm 15/11 em đến thử trực tiếp nha.',
      },
    ],
  },
  {
    customerName: 'Lê Hoàng Yến',
    customerPhone: '0987654321',
    lastMessageText: 'Cho em xin thông tin chuyển cọc hợp đồng #HD-2025-089',
    unreadStaffCount: 1,
    messages: [
      {
        senderRole: 'customer',
        text: 'Cho em xin thông tin chuyển cọc hợp đồng #HD-2025-089 với ạ, em chuyển khoản qua Vietcombank nha chị.',
      },
    ],
  },
  {
    customerName: 'Trần Mai Phương',
    customerPhone: '0933221144',
    lastMessageText: 'Bộ voan cài đầu Cathedral có sẵn ở showroom Nam Kỳ...',
    unreadStaffCount: 1,
    messages: [
      {
        senderRole: 'customer',
        text: 'Bộ voan cài đầu Cathedral có sẵn ở showroom Nam Kỳ Khởi Nghĩa không chị ơi?',
      },
    ],
  },
  {
    customerName: 'Đặng Ngọc Hà',
    customerPhone: '0977889900',
    lastMessageText: 'Lịch fitting ngày 20/11 em có thể đổi sang buổi chiều...',
    unreadStaffCount: 1,
    messages: [
      {
        senderRole: 'customer',
        text: 'Lịch fitting ngày 20/11 em có thể đổi sang buổi chiều khoảng 15h được không ạ?',
      },
    ],
  },
  {
    customerName: 'Bùi Phương Anh',
    customerPhone: '0909556677',
    lastMessageText: 'Dạ em đã nhận được vali váy cưới rồi, đẹp xuất sắc luôn ạ!',
    messages: [
      {
        senderRole: 'customer',
        text: 'Dạ em đã nhận được vali váy cưới rồi, đẹp xuất sắc luôn ạ! Cảm ơn đội ngũ UniBridal rất nhiều!',
      },
    ],
  },
];

class ChatService {
  /**
   * Tự động khởi tạo hội thoại mẫu nếu database chưa có
   */
  async seedInitialConversationsIfEmpty() {
    const count = await Conversation.countDocuments();
    if (count > 0) return;

    for (const item of DEFAULT_INITIAL_CONVERSATIONS) {
      const conv = await Conversation.create({
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        unreadStaffCount: item.unreadStaffCount || 0,
        lastMessage: {
          text: item.lastMessageText,
          senderRole: item.messages[item.messages.length - 1].senderRole,
          createdAt: new Date(),
          isRead: !item.unreadStaffCount,
        },
      });

      for (const msg of item.messages) {
        await Message.create({
          conversationId: conv._id,
          senderRole: msg.senderRole,
          text: msg.text,
          status: 'sent',
        });
      }
    }
  }

  /**
   * Tự động xóa sạch toàn bộ tin nhắn & cuộc hội thoại của khách vãng lai
   * Chỉ giữ lại các cuộc hội thoại của khách hàng có tài khoản và đầy đủ thông tin
   */
  async cleanupGuestConversations() {
    try {
      // 1. Tìm các cuộc hội thoại không có customerId hoặc tên mặc định "Khách hàng"
      const guestConversations = await Conversation.find({
        $or: [
          { customerId: null },
          { customerId: { $exists: false } },
          { customerName: { $regex: /^khách\s*hàng$/i } },
          { customerName: '' },
          { customerName: null },
          { guestSessionId: { $ne: null } },
        ],
      }).select('_id');

      const guestConvIds = guestConversations.map((c) => c._id);

      // 2. Kiểm tra các conversation khác xem customerId có còn tồn tại tài khoản User thực tế hay không
      const otherConvs = await Conversation.find({ _id: { $nin: guestConvIds } }).populate('customerId', '_id fullName email phone role');
      for (const conv of otherConvs) {
        if (!conv.customerId || !conv.customerId._id) {
          guestConvIds.push(conv._id);
        } else {
          const name = (conv.customerId.fullName || conv.customerName || '').trim();
          if (!name || name.toLowerCase() === 'khách hàng') {
            guestConvIds.push(conv._id);
          }
        }
      }

      // 3. Xóa toàn bộ tin nhắn của các cuộc hội thoại khách vãng lai
      if (guestConvIds.length > 0) {
        await Message.deleteMany({ conversationId: { $in: guestConvIds } });
        // 4. Xóa vĩnh viễn các cuộc hội thoại khách vãng lai
        await Conversation.deleteMany({ _id: { $in: guestConvIds } });
      }
    } catch (err) {
      console.warn('Lỗi dọn dẹp hội thoại khách vãng lai:', err);
    }
  }

  /**
   * Lấy hoặc tạo mới cuộc hội thoại cho khách hàng hiện tại (Chỉ dành cho khách hàng đã có tài khoản)
   */
  async getOrCreateCustomerConversation({ user, guestSessionId, guestName, guestPhone }) {
    // Chỉ tạo hoặc lấy cuộc hội thoại nếu khách hàng đã đăng nhập có tài khoản
    if (!user?._id) {
      return {
        conversation: null,
        messages: [],
      };
    }

    let conversation = null;

    if (user?._id) {
      // 1. Tìm hội thoại đã gắn với tài khoản của người dùng
      conversation = await Conversation.findOne({ customerId: user._id }).populate('customerId', 'fullName email phone avatar');

      // 2. Nếu chưa có, kiểm tra xem có hội thoại guestSessionId của phiên hiện tại không để liên kết tài khoản
      if (!conversation && guestSessionId) {
        conversation = await Conversation.findOne({ guestSessionId });
        if (conversation) {
          conversation.customerId = user._id;
          conversation.customerName = user.fullName || conversation.customerName;
          conversation.customerPhone = user.phone || conversation.customerPhone;
          conversation.customerAvatar = user.avatar || conversation.customerAvatar;
          await conversation.save();
        }
      }
    } else if (guestSessionId) {
      conversation = await Conversation.findOne({ guestSessionId });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        customerId: user?._id || null,
        guestSessionId: user ? null : guestSessionId,
        customerName: user?.fullName || guestName || 'Khách hàng',
        customerPhone: user?.phone || guestPhone || '',
        customerAvatar: user?.avatar || '',
        unreadStaffCount: 0,
        unreadCustomerCount: 0,
        lastMessage: {
          text: 'Xin chào quý cô! 🌸 Rất hân hạnh được đón tiếp quý cô tại UniBridal Haute Couture.',
          senderRole: 'staff',
          createdAt: new Date(),
          isRead: true,
        },
      });

      // Tạo tin nhắn chào mừng ban đầu từ Stylist
      await Message.create({
        conversationId: conversation._id,
        senderRole: 'staff',
        text: 'Xin chào quý cô! 🌸 Rất hân hạnh được đón tiếp quý cô tại UniBridal Haute Couture. Em có thể hỗ trợ quý cô tư vấn chọn phom dáng váy, bảng giá thuê hay đặt lịch thử váy tại showroom ạ?',
        status: 'delivered',
      });
    } else {
      // Cập nhật lại họ tên và số điện thoại mới nhất từ tài khoản người dùng
      if (user) {
        let changed = false;
        if (!conversation.customerId || conversation.customerId.toString() !== user._id.toString()) {
          conversation.customerId = user._id;
          changed = true;
        }
        if (user.fullName && conversation.customerName !== user.fullName) {
          conversation.customerName = user.fullName;
          changed = true;
        }
        if (user.phone && conversation.customerPhone !== user.phone) {
          conversation.customerPhone = user.phone;
          changed = true;
        }
        if (user.avatar && conversation.customerAvatar !== user.avatar) {
          conversation.customerAvatar = user.avatar;
          changed = true;
        }
        if (changed) {
          await conversation.save();
        }
      }
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    return {
      conversation,
      messages,
    };
  }

  /**
   * Lấy danh sách toàn bộ hội thoại cho Quản trị viên / Nhân viên Showroom
   * Đã tự động xóa sạch các tin nhắn của khách vãng lai
   */
  async getAllConversations(params = {}) {
    // 1. Tự động xóa sạch toàn bộ tin nhắn & cuộc hội thoại của khách vãng lai
    await this.cleanupGuestConversations();

    const query = {
      customerId: { $ne: null, $exists: true },
    };

    if (params.status && params.status !== 'all') {
      if (params.status === 'unread') {
        query.unreadStaffCount = { $gt: 0 };
      } else {
        query.status = params.status;
      }
    }

    if (params.search) {
      const searchRegex = new RegExp(params.search, 'i');
      query.$or = [
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { 'lastMessage.text': searchRegex },
      ];
    }

    // Tự động dọn dẹp các hội thoại thử nghiệm do tài khoản Admin/Staff tạo nhầm nếu có
    try {
      await Conversation.deleteMany({
        $or: [
          { customerName: { $regex: /quản\s*trị|chuyên\s*viên|administrator/i } },
        ],
      });
    } catch {
      // bỏ qua lỗi nếu không xóa được
    }

    const conversations = await Conversation.find(query)
      .populate('customerId', 'fullName email phone avatar role')
      .populate('staffId', 'fullName email phone avatar')
      .sort({ isPinned: -1, updatedAt: -1 });

    // Chỉ giữ lại hội thoại của KHÁCH HÀNG CÓ TÀI KHOẢN VÀ THÔNG TIN (loại trừ tài khoản Admin / Staff và Khách vãng lai)
    const customerOnly = conversations.filter((c) => {
      if (!c.customerId || !c.customerId._id) return false;
      const userRole = (c.customerId?.role || '').toLowerCase();
      if (userRole === 'admin' || userRole === 'staff') return false;

      const name = (c.customerId?.fullName || c.customerName || '').trim();
      if (!name || name.toLowerCase() === 'khách hàng') return false;

      const lowerName = name.toLowerCase();
      if (
        lowerName.includes('quản trị') ||
        lowerName.includes('administrator') ||
        lowerName.includes('chuyên viên') ||
        lowerName.includes('staff')
      ) {
        return false;
      }
      return true;
    });

    return customerOnly;
  }

  /**
   * Xóa một cuộc hội thoại và toàn bộ tin nhắn bên trong
   */
  async deleteConversation(id) {
    await Message.deleteMany({ conversationId: id });
    const deleted = await Conversation.findByIdAndDelete(id);
    return deleted;
  }

  /**
   * Lấy chi tiết một cuộc hội thoại kèm danh sách tin nhắn
   */
  async getConversationById(id) {
    const conversation = await Conversation.findById(id)
      .populate('customerId', 'fullName email phone avatar')
      .populate('staffId', 'fullName email phone avatar');

    if (!conversation) {
      throw new Error('Không tìm thấy cuộc hội thoại');
    }

    const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 });
    return { conversation, messages };
  }

  /**
   * Lấy danh sách tin nhắn của một cuộc hội thoại
   */
  async getMessages(conversationId) {
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    return messages;
  }

  /**
   * Gửi tin nhắn mới (Khách gửi hoặc Nhân viên/Admin gửi)
   */
  async sendMessage({ conversationId, senderId, senderRole, text, image, attachments, guestSessionId, guestName, guestPhone }) {
    let conversation = null;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    // Nếu khách gửi mà chưa có conversationId
    if (!conversation && (senderId || guestSessionId)) {
      const result = await this.getOrCreateCustomerConversation({
        user: senderId ? await User.findById(senderId) : null,
        guestSessionId,
        guestName,
        guestPhone,
      });
      conversation = result.conversation;
    }

    if (!conversation) {
      throw new Error('Không tìm thấy cuộc hội thoại để gửi tin nhắn');
    }

    if (senderRole === 'customer') {
      if (senderId) {
        const senderUser = await User.findById(senderId);
        if (senderUser) {
          conversation.customerId = senderUser._id;
          conversation.customerName = senderUser.fullName;
          if (senderUser.phone) conversation.customerPhone = senderUser.phone;
          if (senderUser.avatar) conversation.customerAvatar = senderUser.avatar;
        }
      } else if (guestName && guestName !== 'Khách hàng') {
        conversation.customerName = guestName;
        if (guestPhone) conversation.customerPhone = guestPhone;
      }
    }

    const newMsg = await Message.create({
      conversationId: conversation._id,
      senderId: senderId || null,
      senderRole: senderRole || 'customer',
      text: (text || '').trim(),
      image: image || '',
      attachments: attachments || [],
      status: 'sent',
    });

    const isCustomerMsg = senderRole === 'customer';

    conversation.lastMessage = {
      text: newMsg.text || (newMsg.image ? 'Đã gửi một hình ảnh' : ''),
      senderId: senderId || null,
      senderRole: senderRole || 'customer',
      createdAt: new Date(),
      isRead: false,
    };

    if (isCustomerMsg) {
      conversation.unreadStaffCount = (conversation.unreadStaffCount || 0) + 1;
    } else {
      conversation.unreadCustomerCount = (conversation.unreadCustomerCount || 0) + 1;
    }

    await conversation.save();

    return newMsg;
  }

  /**
   * Đánh dấu cuộc hội thoại đã đọc
   */
  async markAsRead(conversationId, userRole = 'staff') {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return null;

    if (userRole === 'customer') {
      conversation.unreadCustomerCount = 0;
    } else {
      conversation.unreadStaffCount = 0;
    }

    if (conversation.lastMessage) {
      conversation.lastMessage.isRead = true;
    }

    await conversation.save();
    return conversation;
  }

  /**
   * Ghim / Bỏ ghim hội thoại
   */
  async togglePin(conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error('Không tìm thấy cuộc hội thoại');

    conversation.isPinned = !conversation.isPinned;
    await conversation.save();
    return conversation;
  }

  /**
   * Thu hồi tin nhắn
   */
  async recallMessage(messageId) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error('Không tìm thấy tin nhắn');

    message.isRecalled = true;
    message.recalledAt = new Date();
    message.text = 'Tin nhắn đã được thu hồi';
    message.image = '';
    message.attachments = [];
    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      if (
        conversation.pinnedMessage?.messageId &&
        conversation.pinnedMessage.messageId.toString() === message._id.toString()
      ) {
        conversation.pinnedMessage = null;
      }
      if (
        conversation.lastMessage?.text &&
        conversation.lastMessage.createdAt &&
        Math.abs(new Date(conversation.lastMessage.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000
      ) {
        conversation.lastMessage.text = 'Tin nhắn đã được thu hồi';
      }
      await conversation.save();
    }

    return message;
  }

  /**
   * Ghim / Bỏ ghim một tin nhắn cụ thể
   */
  async togglePinMessage(conversationId, messageId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error('Không tìm thấy cuộc hội thoại');

    const message = await Message.findById(messageId);
    if (!message) throw new Error('Không tìm thấy tin nhắn');

    const isCurrentPinned =
      conversation.pinnedMessage?.messageId &&
      conversation.pinnedMessage.messageId.toString() === message._id.toString();

    if (isCurrentPinned) {
      // Đang ghim -> Bỏ ghim
      message.isPinned = false;
      await message.save();
      conversation.pinnedMessage = null;
      await conversation.save();
      return { pinned: false, conversation, message };
    } else {
      // Ghim tin nhắn mới -> Bỏ ghim các tin trước đó trong cùng hội thoại
      await Message.updateMany({ conversationId }, { isPinned: false });
      message.isPinned = true;
      await message.save();

      conversation.pinnedMessage = {
        messageId: message._id,
        text: message.text || (message.image ? '[Hình ảnh]' : ''),
        senderRole: message.senderRole,
        pinnedAt: new Date(),
      };
      await conversation.save();
      return { pinned: true, conversation, message };
    }
  }

  /**
   * Bỏ ghim tin nhắn của hội thoại
   */
  async unpinMessage(conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error('Không tìm thấy cuộc hội thoại');

    await Message.updateMany({ conversationId }, { isPinned: false });
    conversation.pinnedMessage = null;
    await conversation.save();
    return conversation;
  }
}

export default new ChatService();
