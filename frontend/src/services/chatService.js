import axiosClient from '../api/axiosClient';

/**
 * Lấy hoặc khởi tạo cuộc hội thoại của chính khách hàng hiện tại
 */
export async function getMyConversation() {
  try {
    return await axiosClient.get('/conversations/my');
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Lấy danh sách các cuộc trò chuyện (Staff/Admin xem danh sách khách)
 * @param {Object} params - { status, search }
 */
export async function getConversations(params = {}) {
  try {
    return await axiosClient.get('/conversations', { params });
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Lỗi tải danh sách hội thoại',
      data: [],
    };
  }
}

/**
 * Lấy chi tiết cuộc hội thoại theo ID
 * @param {string} id
 */
export async function getConversationById(id) {
  try {
    return await axiosClient.get(`/conversations/${id}`);
  } catch (error) {
    return { success: false, message: 'Chưa kết nối máy chủ chat' };
  }
}

/**
 * Lấy lịch sử tin nhắn trong một cuộc hội thoại
 * @param {string} conversationId
 */
export async function getMessages(conversationId) {
  try {
    return await axiosClient.get(`/conversations/${conversationId}/messages`);
  } catch (error) {
    const cached = localStorage.getItem(`unibridal-msgs-${conversationId}`);
    return {
      success: true,
      data: cached ? JSON.parse(cached) : [],
    };
  }
}

/**
 * Gửi tin nhắn mới
 * @param {Object} messageData - { conversationId, text, attachments, relatedDressId }
 */
export async function sendMessage(messageData) {
  try {
    return await axiosClient.post('/messages', messageData);
  } catch (error) {
    const newMsg = {
      _id: `msg_${Date.now()}`,
      conversationId: messageData.conversationId,
      text: messageData.text,
      senderRole: 'customer',
      createdAt: new Date().toISOString(),
      attachments: messageData.attachments || [],
    };
    const key = `unibridal-msgs-${messageData.conversationId}`;
    const cached = JSON.parse(localStorage.getItem(key) || '[]');
    cached.push(newMsg);
    localStorage.setItem(key, JSON.stringify(cached));
    return { success: true, data: newMsg };
  }
}

/**
 * Đánh dấu tin nhắn đã đọc
 * @param {string} conversationId
 */
export async function markAsRead(conversationId) {
  try {
    return await axiosClient.patch(`/conversations/${conversationId}/read`);
  } catch (error) {
    return { success: true };
  }
}

/**
 * Ghim / Bỏ ghim hội thoại
 * @param {string} conversationId
 */
export async function togglePin(conversationId) {
  try {
    return await axiosClient.patch(`/conversations/${conversationId}/pin`);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

