import chatService from '../services/chat.service.js';

class ChatController {
  /**
   * Lấy hoặc khởi tạo cuộc hội thoại của khách hàng hiện tại
   */
  async getMyConversation(req, res, next) {
    try {
      const user = req.user || null;
      const guestSessionId = req.headers['x-guest-session-id'] || req.query.guestSessionId;
      const guestName = req.query.guestName;
      const guestPhone = req.query.guestPhone;

      if (!user && !guestSessionId) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng đăng nhập hoặc cung cấp guestSessionId để bắt đầu trò chuyện.',
        });
      }

      const result = await chatService.getOrCreateCustomerConversation({
        user,
        guestSessionId,
        guestName,
        guestPhone,
      });

      return res.status(200).json({
        success: true,
        message: 'Lấy dữ liệu cuộc hội thoại thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách toàn bộ hội thoại (Dành cho Admin / Staff)
   */
  async getConversations(req, res, next) {
    try {
      const { status, search } = req.query;
      const conversations = await chatService.getAllConversations({ status, search });

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách cuộc trò chuyện thành công',
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy chi tiết cuộc hội thoại theo ID
   */
  async getConversationById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await chatService.getConversationById(id);

      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin hội thoại thành công',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy danh sách tin nhắn theo Conversation ID
   */
  async getMessages(req, res, next) {
    try {
      const { id } = req.params;
      const messages = await chatService.getMessages(id);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách tin nhắn thành công',
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gửi tin nhắn mới
   */
  async sendMessage(req, res, next) {
    try {
      const { conversationId, text, image, attachments, guestSessionId, guestName, guestPhone, senderRole: requestedRole } = req.body;
      const user = req.user || null;

      // Ưu tiên requestedRole được client gửi lên (ChatWidget gửi 'customer', Admin portal gửi 'staff')
      let senderRole = requestedRole || 'customer';
      let senderId = user ? user._id : null;

      if (!requestedRole) {
        if (user) {
          const roleCode = (user.role || user.roleId?.code || '').toUpperCase();
          if (roleCode === 'ADMIN' || roleCode === 'STAFF') {
            senderRole = 'staff';
          } else {
            senderRole = 'customer';
          }
        } else {
          senderRole = 'customer';
        }
      }

      if (!text && !image && (!attachments || attachments.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Nội dung tin nhắn hoặc hình ảnh không được để trống.',
        });
      }

      const newMsg = await chatService.sendMessage({
        conversationId,
        senderId,
        senderRole,
        text,
        image,
        attachments,
        guestSessionId: guestSessionId || req.headers['x-guest-session-id'],
        guestName,
        guestPhone,
      });

      return res.status(201).json({
        success: true,
        message: 'Gửi tin nhắn thành công',
        data: newMsg,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đánh dấu cuộc hội thoại đã đọc
   */
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user || null;
      const roleCode = (user?.role || user?.roleId?.code || '').toUpperCase();
      const userRole = roleCode === 'ADMIN' || roleCode === 'STAFF' ? 'staff' : 'customer';

      const conversation = await chatService.markAsRead(id, userRole);

      return res.status(200).json({
        success: true,
        message: 'Đã đánh dấu đã đọc',
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ghim / Bỏ ghim hội thoại
   */
  async togglePin(req, res, next) {
    try {
      const { id } = req.params;
      const conversation = await chatService.togglePin(id);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái ghim thành công',
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ChatController();
