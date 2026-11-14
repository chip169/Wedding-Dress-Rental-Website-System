import React, { useState, useRef, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { message, Dropdown, Popconfirm } from 'antd';
import {
  Search,
  Pin,
  Image,
  Smile,
  Send,
  Crown,
  X,
  MessageSquare,
  Check,
  CheckCircle2,
  ArrowDown,
  MoreVertical,
  RotateCcw,
  Ban,
  Zap,
  Trash2,
} from 'lucide-react';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  togglePin,
  recallMessage,
  togglePinMessage,
  unpinMessage,
  deleteConversation,
} from '../../services/chatService';

import card1Elysian from '../../assets/card1_elysian.jpg';
import card2Celeste from '../../assets/card2_celeste.jpg';
import card3Lumiere from '../../assets/card3_lumiere.jpg';
import card4Monet from '../../assets/card4_monet.jpg';
import heroBride from '../../assets/hero_bride.jpg';

const WEDDING_EMOJIS = [
  '😊', '🥰', '👰', '💍', '👗', '✨', '💐', '💖',
  '🤍', '🌸', '👑', '🥂', '🎉', '💌', '🎀', '💎',
  '🕊️', '🌹', '❤️', '👏', '🙏', '👍', '😍', '😘'
];

// Danh sách câu lệnh mẫu nhanh (gõ / trong ô chat)
const SLASH_COMMANDS = [
  {
    command: '/chinh-eo',
    label: 'Xác nhận chỉnh eo 1.5cm',
    desc: 'Xác nhận hạ eo 1.5cm cho mẫu Elysian Rose vào phụ lục',
    text: 'Xác nhận chỉnh hạ eo thêm 1.5cm cho mẫu Elysian Rose vào phụ lục hợp đồng.',
  },
  {
    command: '/vip',
    label: 'Hướng dẫn thử váy VIP',
    desc: 'Gửi cẩm nang & quy trình phòng thử VIP 1-1',
    text: 'UniBridal gửi nàng cẩm nang và hướng dẫn thử váy VIP tại phòng thử riêng Fitting Suite 1-1.',
  },
  {
    command: '/coc',
    label: 'Bảo lãnh cọc thẻ tín dụng',
    desc: 'Phương thức bảo lãnh cọc qua hạn mức thẻ tín dụng',
    text: 'Quý khách có thể sử dụng phương thức bảo lãnh đặt cọc qua hạn mức thẻ tín dụng linh hoạt.',
  },
  {
    command: '/hen',
    label: 'Mời đặt lịch hẹn thử váy',
    desc: 'Hỏi ngày giờ mong muốn tiếp đón cô dâu tại showroom',
    text: 'Dạ nàng ơi, nàng dự định đến thử váy vào ngày nào và khung giờ nào để UniBridal chuẩn bị sẵn phòng thử VIP đón nàng chu đáo nhất ạ?',
  },
  {
    command: '/gia',
    label: 'Báo khoảng giá thuê váy cưới',
    desc: 'Mức giá các dòng váy Luxury và Haute Couture',
    text: 'Dạ giá thuê váy cưới tại UniBridal dao động từ 3.800.000đ - 25.000.000đ tùy theo BST Luxury, Haute Couture và số ngày giữ váy của nàng ạ.',
  },
  {
    command: '/phu-kien',
    label: 'Tặng phụ kiện kèm váy',
    desc: 'Trọn bộ voan cài đầu, găng tay và vương miện',
    text: 'Khi thuê váy cưới tại UniBridal, nàng sẽ được tặng kèm trọn bộ: Voan cài đầu cao cấp, găng tay satin, vương miện tiara và tùng phồng tạo dáng chuẩn form.',
  },
  {
    command: '/chuyen-khoan',
    label: 'Thông tin tài khoản ngân hàng',
    desc: 'STK thanh toán chính thức của showroom UniBridal',
    text: 'Thông tin thanh toán UniBridal: MBBank - STK: 999988888888 - Chủ TK: CTY TNHH UNIBRIDAL VIETNAM - Nội dung: [Mã hợp đồng] [Họ tên].',
  },
  {
    command: '/cam-on',
    label: 'Lời cảm ơn cô dâu',
    desc: 'Cảm ơn nàng dâu đã lựa chọn và tin tưởng',
    text: 'UniBridal chân thành cảm ơn nàng dâu đã gửi trọn niềm tin. Chúc nàng có những khoảnh khắc lộng lẫy và hạnh phúc nhất trong ngày trọng đại!',
  },
];

export default function CustomerCareManagement() {
  const [conversations, setConversations] = useState([]);
  const [aptError, setAptError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // all | unread
  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSlashCommands, setShowSlashCommands] = useState(false);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [pinnedMessage, setPinnedMessage] = useState(null);

  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const textInputRef = useRef(null);
  const slashMenuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const prevSelectedIdRef = useRef(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Avatar presets cho các hội thoại
  const AVATAR_LIST = [card1Elysian, card2Celeste, card3Lumiere, card4Monet, heroBride];

  // Hàm tải danh sách hội thoại từ máy chủ
  const fetchConversationsList = useCallback(async () => {
    try {
      const res = await getConversations({
        status: filterTab,
        search: searchTerm.trim() || undefined,
      });

      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        // Chỉ hiển thị tin nhắn của KHÁCH HÀNG CÓ TÀI KHOẢN VÀ ĐẦY ĐỦ THÔNG TIN (loại bỏ hoàn toàn khách vãng lai và tài khoản admin/staff)
        const customerOnly = res.data.filter((c) => {
          // Bắt buộc phải có tài khoản customerId
          if (!c.customerId || !c.customerId._id) return false;

          const roleCode = (c.customerId?.roleId?.code || c.customerId?.role || '').toUpperCase();
          if (roleCode === 'ADMIN' || roleCode === 'STAFF') return false;

          const customerName = (c.customerId?.fullName || c.customerName || '').trim();
          if (!customerName || customerName.toLowerCase() === 'khách hàng') return false;

          const name = customerName.toLowerCase();
          return !(
            name.includes('quản trị') ||
            name.includes('administrator') ||
            name.includes('chuyên viên') ||
            name.includes('staff')
          );
        });

        let localPinnedConvs = [];
        try {
          localPinnedConvs = JSON.parse(localStorage.getItem('unibridal_pinned_convs') || '[]');
        } catch {}

        const mapped = customerOnly.map((c, index) => {
          const isPinned = Boolean(c.isPinned) || localPinnedConvs.includes(String(c._id));
          return {
            id: c._id,
            name: c.customerId?.fullName || c.customerName || 'Khách hàng',
            phone: c.customerId?.phone || c.customerPhone || '',
            avatar: c.customerAvatar || c.customerId?.avatar || AVATAR_LIST[index % AVATAR_LIST.length],
            online: true,
            time: new Date(c.lastMessage?.createdAt || c.updatedAt).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            lastMessage: c.lastMessage?.text || 'Bắt đầu cuộc trò chuyện',
            unread: (c.unreadStaffCount || 0) > 0,
            unreadCount: c.unreadStaffCount || 0,
            isPinned,
            pinnedMessage: c.pinnedMessage || null,
            messages: [],
          };
        });

        // Đưa các hội thoại được ghim lên đầu danh sách
        mapped.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });

        setConversations(mapped);
        setSelectedId((current) => {
          if (current && mapped.some((m) => m.id === current)) return current;
          return mapped[0]?.id || null;
        });
      } else {
        setConversations([]);
        setSelectedId(null);
        setActiveMessages([]);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách hội thoại:', err);
    }
  }, [filterTab, searchTerm]);

  // Hàm tải danh sách tin nhắn của hội thoại đang chọn
  const fetchActiveMessages = useCallback(async (convId) => {
    if (!convId || convId.startsWith?.('init_')) return;

    try {
      const res = await getMessages(convId);
      if (res?.data && Array.isArray(res.data)) {
        let recalledIds = [];
        try {
          recalledIds = JSON.parse(localStorage.getItem('unibridal_recalled_msgs') || '[]');
        } catch {}

        const mapped = res.data.map((m) => {
          const isRecalled = Boolean(m.isRecalled) || recalledIds.includes(String(m._id || m.id));
          return {
            id: m._id || m.id,
            sender: m.senderRole === 'customer' ? 'customer' : 'staff',
            text: isRecalled ? 'Tin nhắn đã được thu hồi' : m.text,
            image: isRecalled ? null : m.image,
            isRecalled,
            isPinned: Boolean(m.isPinned),
            time: new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            status: m.status === 'read' ? 'Đã xem' : 'Đã gửi',
          };
        });

        // Kiểm tra tin nhắn được ghim
        const pinnedInList = mapped.find((m) => m.isPinned && !m.isRecalled);
        if (pinnedInList) {
          setPinnedMessage({
            id: pinnedInList.id,
            text: pinnedInList.text,
            sender: pinnedInList.sender,
          });
          localStorage.setItem(
            `unibridal_pinned_${convId}`,
            JSON.stringify({
              id: pinnedInList.id,
              text: pinnedInList.text,
              sender: pinnedInList.sender,
            })
          );
        }

        setActiveMessages((prev) => {
          // So sánh nếu số lượng và id/text/status/isRecalled/isPinned không đổi thì giữ nguyên prev để tránh re-render và auto-scroll
          if (
            prev.length === mapped.length &&
            prev.every(
              (pMsg, idx) =>
                pMsg.id === mapped[idx]?.id &&
                pMsg.status === mapped[idx]?.status &&
                pMsg.text === mapped[idx]?.text &&
                pMsg.image === mapped[idx]?.image &&
                pMsg.isRecalled === mapped[idx]?.isRecalled &&
                pMsg.isPinned === mapped[idx]?.isPinned
            )
          ) {
            return prev;
          }
          return mapped;
        });
      }
      // Đánh dấu đã đọc
      markAsRead(convId).catch(() => {});
    } catch (err) {
      console.warn('Lỗi tải tin nhắn:', err);
    }
  }, []);

  // Tự động cuộn xuống đáy container chat
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, []);

  // Lắng nghe người dùng cuộn chuột trong khung chat
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Nếu cách đáy < 80px coi như đang ở đáy
    const atBottom = distanceToBottom < 80;
    isAtBottomRef.current = atBottom;
    setShowScrollBottomBtn(!atBottom);
  };

  // Khi đang lăn chuột lên trên, lập tức đánh dấu không ở đáy để không bị giật kéo xuống
  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      isAtBottomRef.current = false;
      setShowScrollBottomBtn(true);
    }
  };

  // Lần đầu mount và khi search/filter thay đổi
  useEffect(() => {
    fetchConversationsList();
  }, [fetchConversationsList]);

  // Khi selectedId thay đổi
  useEffect(() => {
    if (selectedId) {
      fetchActiveMessages(selectedId);
      const conv = conversations.find((c) => c.id === selectedId);
      const localPinned = localStorage.getItem(`unibridal_pinned_${selectedId}`);
      if (localPinned) {
        try {
          setPinnedMessage(JSON.parse(localPinned));
        } catch {
          setPinnedMessage(null);
        }
      } else if (conv?.pinnedMessage?.text) {
        setPinnedMessage({
          id: conv.pinnedMessage.messageId,
          text: conv.pinnedMessage.text,
          sender: conv.pinnedMessage.senderRole,
        });
      } else {
        setPinnedMessage(null);
      }
    } else {
      setPinnedMessage(null);
    }
  }, [selectedId, fetchActiveMessages, conversations]);

  // Polling chu kỳ 3.5s để cập nhật tin nhắn mới từ khách hàng
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversationsList();
      if (selectedId) {
        fetchActiveMessages(selectedId);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [fetchConversationsList, fetchActiveMessages, selectedId]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    // Nếu vừa đổi cuộc hội thoại, luôn cuộn xuống đáy
    if (prevSelectedIdRef.current !== selectedId) {
      prevSelectedIdRef.current = selectedId;
      isAtBottomRef.current = true;
      setShowScrollBottomBtn(false);
      setTimeout(() => scrollToBottom('instant'), 40);
      return;
    }

    // Nếu đang ở cuộc trò chuyện hiện tại và có tin nhắn mới:
    // CHỈ tự động cuộn xuống nếu nhân viên đang ở sát đáy (isAtBottomRef.current === true)
    // Nếu nhân viên đang lướt lên xem tin cũ, TUYỆT ĐỐI KHÔNG cuộn giật xuống!
    if (isAtBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [activeMessages, selectedId, scrollToBottom]);

  // Close emoji picker and slash command menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (
        slashMenuRef.current &&
        !slashMenuRef.current.contains(event.target) &&
        textInputRef.current &&
        !textInputRef.current.contains(event.target)
      ) {
        setShowSlashCommands(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeConv = conversations.find((c) => c.id === selectedId) || conversations[0] || null;

  const filteredConversations = conversations
    .filter((c) => {
      // Đảm bảo chỉ khách hàng mới xuất hiện trong danh sách trò chuyện
      const lowerName = (c.name || '').toLowerCase();
      if (
        lowerName.includes('quản trị') ||
        lowerName.includes('administrator') ||
        lowerName.includes('chuyên viên') ||
        lowerName.includes('staff')
      ) {
        return false;
      }
      if (filterTab === 'unread' && !c.unread) return false;
      if (searchTerm.trim()) {
        return (
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Cuộc trò chuyện đã ghim luôn hiển thị lên đầu cột bên trái
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setSelectedImage(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  // Lọc câu lệnh nhanh khi gõ /
  const slashQuery = inputText.startsWith('/') ? inputText.slice(1).toLowerCase().trim() : '';
  const filteredCommands = SLASH_COMMANDS.filter((cmd) => {
    if (!slashQuery) return true;
    return (
      cmd.command.toLowerCase().includes(slashQuery) ||
      cmd.label.toLowerCase().includes(slashQuery) ||
      cmd.desc.toLowerCase().includes(slashQuery) ||
      cmd.text.toLowerCase().includes(slashQuery)
    );
  });

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (val.startsWith('/')) {
      setShowSlashCommands(true);
      setSelectedSlashIndex(0);
    } else {
      setShowSlashCommands(false);
    }
  };

  const handleApplySlashCommand = (cmd) => {
    if (!cmd) return;
    setInputText(cmd.text);
    setShowSlashCommands(false);
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  const handleInputKeyDown = (e) => {
    if (showSlashCommands && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selectedCmd = filteredCommands[selectedSlashIndex] || filteredCommands[0];
        if (selectedCmd) {
          handleApplySlashCommand(selectedCmd);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashCommands(false);
        return;
      }
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    const textToSend = inputText.trim();
    const imageToSend = selectedImage;

    const newMsg = {
      id: Date.now(),
      sender: 'staff',
      text: textToSend,
      image: imageToSend,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'Đã gửi',
    };

    setActiveMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setSelectedImage(null);
    isAtBottomRef.current = true;
    setShowScrollBottomBtn(false);
    setTimeout(() => scrollToBottom('smooth'), 40);

    // Gửi tin nhắn lên server
    if (selectedId && !selectedId.startsWith?.('init_')) {
      try {
        await sendMessage({
          conversationId: selectedId,
          text: textToSend,
          image: imageToSend,
          senderRole: 'staff',
        });
        fetchConversationsList();
      } catch (err) {
        console.error('Lỗi gửi tin nhắn từ Admin:', err);
      }
    }
  };

  // Xử lý Ghim / Bỏ ghim một tin nhắn
  const handleTogglePinMessage = async (msg) => {
    if (!msg || msg.isRecalled) return;

    const isCurrentlyPinned = pinnedMessage?.id === msg.id || msg.isPinned;

    if (isCurrentlyPinned) {
      // Bỏ ghim
      setPinnedMessage(null);
      if (selectedId) {
        localStorage.removeItem(`unibridal_pinned_${selectedId}`);
      }
      setActiveMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isPinned: false } : m))
      );
      message.info('Đã bỏ ghim tin nhắn');

      if (selectedId && !selectedId.startsWith?.('init_')) {
        unpinMessage(selectedId).catch(() => {});
      }
    } else {
      // Ghim tin nhắn mới
      const pinObj = {
        id: msg.id,
        text: msg.text || (msg.image ? '[Hình ảnh đính kèm]' : ''),
        sender: msg.sender,
      };
      setPinnedMessage(pinObj);
      if (selectedId) {
        localStorage.setItem(`unibridal_pinned_${selectedId}`, JSON.stringify(pinObj));
      }
      setActiveMessages((prev) =>
        prev.map((m) => ({
          ...m,
          isPinned: m.id === msg.id,
        }))
      );
      message.success('Đã ghim tin nhắn');

      if (selectedId && !selectedId.startsWith?.('init_') && msg.id) {
        togglePinMessage(selectedId, msg.id).catch(() => {});
      }
    }
  };

  // Xử lý Bỏ ghim tin nhắn từ nút X trên thanh Pinned banner
  const handleUnpinMessage = async () => {
    setPinnedMessage(null);
    if (selectedId) {
      localStorage.removeItem(`unibridal_pinned_${selectedId}`);
    }
    setActiveMessages((prev) => prev.map((m) => ({ ...m, isPinned: false })));
    message.info('Đã bỏ ghim tin nhắn');

    if (selectedId && !selectedId.startsWith?.('init_')) {
      unpinMessage(selectedId).catch(() => {});
    }
  };

  // Xử lý Ghim / Bỏ ghim cuộc trò chuyện lên đầu danh sách cột bên trái (thay thế nút gọi)
  const handleTogglePinConversation = async (convId) => {
    if (!convId) return;

    let isNowPinned = false;

    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id === convId) {
          isNowPinned = !c.isPinned;
          return { ...c, isPinned: !c.isPinned };
        }
        return c;
      });

      return updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    });

    try {
      const stored = JSON.parse(localStorage.getItem('unibridal_pinned_convs') || '[]');
      let nextStored;
      if (isNowPinned) {
        nextStored = Array.from(new Set([...stored, String(convId)]));
        message.success('Đã ghim cuộc trò chuyện lên đầu danh sách');
      } else {
        nextStored = stored.filter((id) => id !== String(convId));
        message.info('Đã bỏ ghim cuộc trò chuyện');
      }
      localStorage.setItem('unibridal_pinned_convs', JSON.stringify(nextStored));
    } catch {}

    if (convId && typeof convId === 'string' && !convId.startsWith?.('init_')) {
      try {
        await togglePin(convId);
      } catch (err) {
        console.warn('Lỗi gọi API togglePin:', err);
      }
    }
  };

  // Xử lý Xóa vĩnh viễn cuộc trò chuyện (Staff / Admin)
  const handleDeleteConversation = async (convId) => {
    if (!convId) return;
    try {
      if (typeof convId === 'string' && !convId.startsWith?.('init_')) {
        await deleteConversation(convId);
      }
      message.success('Đã xóa vĩnh viễn cuộc trò chuyện thành công');
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      setSelectedId(null);
      setActiveMessages([]);
    } catch (err) {
      console.warn('Lỗi xóa cuộc trò chuyện:', err);
      message.error('Không thể xóa cuộc trò chuyện');
    }
  };

  // Xử lý Thu hồi tin nhắn
  const handleRecallMessage = async (msg) => {
    if (!msg) return;

    // Cập nhật ngay lập tức trên UI
    setActiveMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? { ...m, isRecalled: true, text: 'Tin nhắn đã được thu hồi', image: null, isPinned: false }
          : m
      )
    );

    // Nếu tin nhắn này đang được ghim thì bỏ ghim luôn
    if (pinnedMessage?.id === msg.id) {
      setPinnedMessage(null);
      if (selectedId) {
        localStorage.removeItem(`unibridal_pinned_${selectedId}`);
      }
    }

    // Lưu ID tin nhắn đã thu hồi vào localStorage để không bị polling đè lại
    try {
      const recalledList = JSON.parse(localStorage.getItem('unibridal_recalled_msgs') || '[]');
      if (!recalledList.includes(String(msg.id))) {
        recalledList.push(String(msg.id));
        localStorage.setItem('unibridal_recalled_msgs', JSON.stringify(recalledList));
      }
    } catch {}

    message.success('Đã thu hồi tin nhắn');

    // Gửi request thu hồi lên server
    if (msg.id && typeof msg.id === 'string' && !msg.id.startsWith?.('msg_')) {
      recallMessage(msg.id).catch((err) => {
        console.warn('Lỗi gọi API thu hồi:', err);
      });
    }
  };

  // Cấu hình menu 3 chấm cho từng tin nhắn
  const getMessageMenuItems = (msg) => {
    const isThisMsgPinned = pinnedMessage?.id === msg.id || msg.isPinned;

    if (msg.isRecalled) {
      return [
        {
          key: 'recalled',
          disabled: true,
          label: <span className="text-xs text-stone-400 italic">Tin nhắn đã được thu hồi</span>,
        },
      ];
    }

    return [
      {
        key: 'pin',
        icon: (
          <Pin
            size={13}
            className={isThisMsgPinned ? 'text-[#863E4B] fill-[#863E4B] -rotate-45' : 'text-stone-500'}
          />
        ),
        label: (
          <span className="text-xs font-medium text-stone-700">
            {isThisMsgPinned ? 'Bỏ ghim tin nhắn' : 'Ghim tin nhắn'}
          </span>
        ),
        onClick: () => handleTogglePinMessage(msg),
      },
      {
        type: 'divider',
      },
      {
        key: 'recall',
        danger: true,
        icon: <RotateCcw size={13} className="text-rose-500" />,
        label: <span className="text-xs font-medium text-rose-600">Thu hồi tin nhắn</span>,
        onClick: () => handleRecallMessage(msg),
      },
    ];
  };

  const handleQuickReply = (text) => {
    setInputText(text);
    setShowSlashCommands(false);
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  return (
    <AdminLayout activeMenu="customer-care" headerTitle="Chăm Sóc Khách Hàng">
      {/* Main Container Chat */}
      <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-140px)] min-h-[620px]">
        {/* Left Card: Conversation List Panel */}
        <div className="w-full lg:w-[350px] shrink-0 bg-white rounded-2xl border border-[#EFE5E1] shadow-xs overflow-hidden flex flex-col">
          {/* Search và Filter Header */}
          <div className="p-4 border-b border-[#F5EBE7] flex flex-col gap-3">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8B8C]"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên cô dâu, SĐT, mã hợp đồng..."
                className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-[#EFE5E1] text-xs text-[#2C2523] placeholder:text-[#9A8B8C] outline-none focus:border-[#C98A90] shadow-2xs transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all border-0 cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-[#733F49] text-white shadow-2xs'
                    : 'bg-[#FAF2EE] text-[#7A6B6C] hover:bg-[#F2E5E0]'
                }`}
              >
                Tất cả ({conversations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('unread')}
                className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all border-0 cursor-pointer ${
                  filterTab === 'unread'
                    ? 'bg-[#733F49] text-white shadow-2xs'
                    : 'bg-[#FAF2EE] text-[#7A6B6C] hover:bg-[#F2E5E0]'
                }`}
              >
                Chưa đọc ({conversations.filter((c) => c.unread).length})
              </button>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {filteredConversations.map((c) => {
              const isSelected = c.id === selectedId;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#FDF4F0] border border-[#F2E3DC] shadow-2xs'
                      : c.isPinned
                        ? 'bg-[#FCF7F4] hover:bg-[#F9EFEA] border border-[#F3E2DB]'
                        : 'hover:bg-[#FAF5F2] border border-transparent'
                  }`}
                >
                  {/* Active vertical accent bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#733F49] rounded-l-2xl" />
                  )}

                  {/* Rounded square avatar */}
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-full h-full object-cover"
                    />
                    {c.online && (
                      <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-2 ring-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`text-[13px] truncate ${c.unread ? 'font-bold text-[#733F49]' : 'font-bold text-[#2C2523]'}`}>
                          {c.name}
                        </span>
                        {c.unread && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                        )}
                        {c.isPinned && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-[#FAF0EC] text-[#733F49] text-[10px] font-bold border border-[#F2D8D4] shrink-0"
                            title="Cuộc trò chuyện đã ghim lên đầu danh sách"
                          >
                            <Pin size={9} className="fill-[#733F49] -rotate-45" />
                            <span>Đã ghim</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#9A8B8C] shrink-0 ml-1">
                        {c.time}
                      </span>
                    </div>
                    <p className={`text-xs truncate leading-snug ${c.unread ? 'font-semibold text-[#2C2523]' : 'text-[#6A5B5D]'}`}>
                      {c.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: Active Chat View */}
        {activeConv ? (
          <div className="flex-1 bg-white rounded-2xl border border-[#EFE5E1] shadow-xs overflow-hidden flex flex-col justify-between min-h-0">
            {/* Chat Header */}
            <div className="py-2 px-4 sm:py-2.5 sm:px-5 bg-[#FAF2EE] border-b border-[#F0E4DF] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shrink-0 shadow-xs border border-white ring-1 ring-[#E8D8D0]">
                  <img
                    src={activeConv.avatar}
                    alt={activeConv.name}
                    className="w-full h-full object-cover"
                  />
                  {activeConv.online && (
                    <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#22C55E] ring-1.5 ring-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-serif text-[17px] sm:text-[19px] font-bold text-[#2C2523] leading-none m-0">
                    {activeConv.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8C7D7E] mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                    <span>Đang hoạt động</span>
                    {activeConv.phone && (
                      <>
                        <span>•</span>
                        <span>{activeConv.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePinConversation(activeConv.id)}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all shadow-2xs cursor-pointer ${
                    activeConv.isPinned
                      ? 'bg-[#733F49] border-[#733F49] text-white hover:bg-[#5C323A]'
                      : 'bg-white border-[#E8DDD8] text-[#733F49] hover:bg-[#FAF0EC]'
                  }`}
                  title={
                    activeConv.isPinned
                      ? 'Bỏ ghim cuộc trò chuyện này khỏi đầu danh sách'
                      : 'Ghim cuộc trò chuyện này lên đầu danh sách'
                  }
                >
                  <Pin
                    size={15}
                    className={`transition-transform shrink-0 ${
                      activeConv.isPinned ? 'fill-white -rotate-45 text-white' : 'text-[#733F49]'
                    }`}
                  />
                </button>

                <Popconfirm
                  title="Xóa cuộc trò chuyện"
                  description="Bạn có chắc chắn muốn xóa vĩnh viễn cuộc trò chuyện này và toàn bộ tin nhắn?"
                  okText="Xóa vĩnh viễn"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDeleteConversation(activeConv.id)}
                >
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg border border-[#E8DDD8] bg-white text-stone-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                    title="Xóa vĩnh viễn cuộc trò chuyện này"
                  >
                    <Trash2 size={15} />
                  </button>
                </Popconfirm>
              </div>
            </div>

            {/* Pinned Message Alert (Active when a message is pinned) */}
            {pinnedMessage && pinnedMessage.text && (
              <div className="bg-[#FFF9F6] border-b border-[#F2E5E0] px-5 py-2.5 flex items-center justify-between text-xs text-[#5C4549] animate-in fade-in duration-200">
                <div className="flex items-center gap-2 truncate">
                  <Pin size={13} className="text-[#863E4B] shrink-0 fill-[#863E4B] -rotate-45" />
                  <span className="font-bold text-[#863E4B] shrink-0">Tin nhắn đã ghim:</span>
                  <span className="truncate italic text-[#4A3B3D]">
                    "{pinnedMessage.text}"
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleUnpinMessage}
                  className="bg-transparent border-0 text-[#9A8B8C] hover:text-[#733F49] cursor-pointer p-0.5 text-xs font-semibold shrink-0 ml-2"
                  title="Bỏ ghim tin nhắn này"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Messages Stream Container */}
            <div className="relative flex-1 min-h-0 flex flex-col">
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                onWheel={handleWheel}
                className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-white"
              >
                {activeMessages.length === 0 ? (
                  <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center text-[#9A8B8C] py-8">
                    <div className="w-12 h-12 rounded-full bg-[#FAF2EE] flex items-center justify-center text-[#BA7A83] mb-3">
                      <Crown size={20} />
                    </div>
                    <p className="text-xs font-semibold text-[#7A6B6C]">Chưa có tin nhắn trong cuộc hội thoại này.</p>
                    <p className="text-[11px] text-[#A89899] mt-0.5">Nhập phản hồi hoặc bấm câu trả lời nhanh bên dưới để tư vấn nàng dâu.</p>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isStaff = msg.sender === 'staff';
                    const isThisPinned = pinnedMessage?.id === msg.id || msg.isPinned;

                    if (isStaff) {
                      return (
                        <div key={msg.id} className="flex flex-col items-end group">
                          <div className="flex items-center gap-1.5 flex-row-reverse max-w-lg">
                            {/* Message Bubble */}
                            <div
                              className={`text-[13.5px] leading-relaxed p-3.5 sm:p-4 rounded-2xl rounded-tr-xs shadow-2xs transition-all ${
                                msg.isRecalled
                                  ? 'bg-[#FAF3F0] text-[#9A8B8C] border border-dashed border-[#E8DDD8] italic'
                                  : 'bg-[#733F49] text-white'
                              }`}
                            >
                              {/* Pinned Badge if this message is pinned */}
                              {isThisPinned && !msg.isRecalled && (
                                <div className="flex items-center gap-1 text-[11px] text-[#FBDADF] font-semibold mb-1.5 pb-1.5 border-b border-white/20">
                                  <Pin size={11} className="fill-[#FBDADF] -rotate-45" />
                                  <span>Tin nhắn đang được ghim</span>
                                </div>
                              )}

                              {msg.image && !msg.isRecalled && (
                                <img
                                  src={msg.image}
                                  alt="Ảnh đính kèm"
                                  className="rounded-xl max-w-full max-h-56 object-cover mb-2 border border-white/20"
                                />
                              )}

                              {msg.isRecalled ? (
                                <div className="flex items-center gap-1.5 text-xs text-[#8C7A7B]">
                                  <Ban size={13} className="text-[#A89899] shrink-0" />
                                  <span>Tin nhắn đã được thu hồi</span>
                                </div>
                              ) : (
                                <div>{msg.text}</div>
                              )}
                            </div>

                            {/* 3 dots action menu button (left of staff bubble) */}
                            {!msg.isRecalled && (
                              <Dropdown
                                menu={{ items: getMessageMenuItems(msg) }}
                                trigger={['click']}
                                placement="bottomRight"
                              >
                                <button
                                  type="button"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-[#9A8B8C] hover:text-[#733F49] hover:bg-[#FAF2EE] cursor-pointer border-0 bg-transparent shrink-0"
                                  title="Tùy chọn tin nhắn"
                                >
                                  <MoreVertical size={16} />
                                </button>
                              </Dropdown>
                            )}
                          </div>
                          <span className="text-[11px] text-[#9A8B8C] mt-1 mr-1">
                            {msg.time} • {msg.isRecalled ? 'Đã thu hồi' : msg.status}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className="flex items-start gap-3 group">
                        <img
                          src={activeConv.avatar}
                          alt={activeConv.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-[#EFE5E1] shadow-2xs"
                        />
                        <div className="flex flex-col items-start max-w-xl">
                          <div className="flex items-center gap-1.5">
                            {/* Message Bubble */}
                            <div
                              className={`text-[13.5px] leading-relaxed p-3.5 sm:p-4 rounded-2xl rounded-tl-xs ${
                                msg.isRecalled
                                  ? 'bg-[#F7F4F2] text-[#9A8B8C] border border-dashed border-[#E3DBD7] italic'
                                  : 'bg-[#FAF5F2] text-[#2C2523] border border-[#F0E6E2]'
                              }`}
                            >
                              {/* Pinned Badge if this message is pinned */}
                              {isThisPinned && !msg.isRecalled && (
                                <div className="flex items-center gap-1 text-[11px] text-[#863E4B] font-semibold mb-1.5 pb-1.5 border-b border-[#EFE5E1]">
                                  <Pin size={11} className="fill-[#863E4B] -rotate-45" />
                                  <span>Tin nhắn đang được ghim</span>
                                </div>
                              )}

                              {msg.image && !msg.isRecalled && (
                                <img
                                  src={msg.image}
                                  alt="Ảnh đính kèm"
                                  className="rounded-xl max-w-full max-h-56 object-cover mb-2 border border-[#EFE5E1]"
                                />
                              )}

                              {msg.isRecalled ? (
                                <div className="flex items-center gap-1.5 text-xs text-[#8C7A7B]">
                                  <Ban size={13} className="text-[#A89899] shrink-0" />
                                  <span>Tin nhắn đã được thu hồi</span>
                                </div>
                              ) : (
                                <div>{msg.text}</div>
                              )}
                            </div>

                            {/* 3 dots action menu button (right of customer bubble) */}
                            {!msg.isRecalled && (
                              <Dropdown
                                menu={{ items: getMessageMenuItems(msg) }}
                                trigger={['click']}
                                placement="bottomLeft"
                              >
                                <button
                                  type="button"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-[#9A8B8C] hover:text-[#733F49] hover:bg-[#FAF2EE] cursor-pointer border-0 bg-transparent shrink-0"
                                  title="Tùy chọn tin nhắn"
                                >
                                  <MoreVertical size={16} />
                                </button>
                              </Dropdown>
                            )}
                          </div>
                          <span className="text-[11px] text-[#9A8B8C] mt-1 ml-1">
                            {msg.time} • {msg.isRecalled ? 'Đã thu hồi' : msg.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              <div ref={messagesEndRef} />
            </div>

            {/* Nút nổi cuộn xuống tin nhắn mới nhất khi đang lướt lên xem tin cũ */}
            {showScrollBottomBtn && (
              <button
                type="button"
                onClick={() => {
                  isAtBottomRef.current = true;
                  setShowScrollBottomBtn(false);
                  scrollToBottom('smooth');
                }}
                className="absolute bottom-4 right-6 z-10 bg-white/95 backdrop-blur-sm border border-[#E8DDD8] text-[#733F49] hover:bg-[#FAF0EC] shadow-md hover:shadow-lg rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer animate-fade-in"
                title="Cuộn xuống tin nhắn mới nhất"
              >
                <ArrowDown size={13} className="animate-bounce" />
                <span>Xuống tin nhắn mới nhất</span>
              </button>
            )}
          </div>

          {/* Chat Footer và Input */}
          <div className="border-t border-[#F0E6E2] p-3.5 sm:p-4 bg-white space-y-2.5 shrink-0">
            {/* Quick Replies Row & Slash Commands Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] font-bold tracking-wider text-[#8C7D7E] uppercase flex items-center gap-1 shrink-0">
                  <Crown size={12} className="text-[#B8737D]" />
                  PHẢN HỒI NHANH:
                </span>
                {SLASH_COMMANDS.slice(0, 3).map((cmd) => (
                  <button
                    key={cmd.command}
                    type="button"
                    onClick={() => handleQuickReply(cmd.text)}
                    className="px-3 py-1 rounded-full bg-white border border-[#EFE5E1] text-xs text-[#5A4B4D] hover:bg-[#FAF2EE] hover:text-[#733F49] transition-colors cursor-pointer"
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setInputText('/');
                  setShowSlashCommands(true);
                  setSelectedSlashIndex(0);
                  setTimeout(() => textInputRef.current?.focus(), 50);
                }}
                className="text-[11px] text-[#8C7D7E] hover:text-[#733F49] flex items-center gap-1 cursor-pointer bg-transparent border-0 transition-colors"
                title="Bấm hoặc gõ / vào ô nhập để gọi danh sách câu lệnh nhanh"
              >
                <span className="px-1.5 py-0.5 rounded bg-[#FAF2EE] font-mono text-[10px] font-bold text-[#733F49] border border-[#F2D8D4]">/</span>
                <span>Gõ / để gọi câu lệnh nhanh</span>
              </button>
            </div>

            {/* Selected Image Preview (if any) */}
            {selectedImage && (
              <div className="relative inline-block">
                <img
                  src={selectedImage}
                  alt="Ảnh đã chọn"
                  className="w-16 h-16 rounded-xl object-cover border border-[#EFE5E1] shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#733F49] text-white flex items-center justify-center hover:bg-[#5C3038] shadow-xs border-0 cursor-pointer"
                  title="Xóa ảnh"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Message Input, Image Attachment, Emoji, and Send Button Row */}
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
              {/* Slash Command Popover Menu */}
              {showSlashCommands && filteredCommands.length > 0 && (
                <div
                  ref={slashMenuRef}
                  className="absolute bottom-full mb-2 left-0 w-full sm:w-[460px] max-w-[calc(100vw-32px)] bg-white border border-[#EFE5E1] rounded-2xl shadow-2xl p-2.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#F5EBE7] mb-1.5">
                    <span className="text-xs font-bold text-[#733F49] uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={14} className="text-[#B8737D]" />
                      Câu lệnh mẫu phản hồi nhanh ({filteredCommands.length})
                    </span>
                    <span className="text-[10px] text-[#9A8B8C] hidden sm:inline">
                      ↑ ↓ di chuyển • Enter chọn • Esc đóng
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 p-0.5 no-scrollbar">
                    {filteredCommands.map((cmd, idx) => {
                      const isHighlighted = idx === selectedSlashIndex;
                      return (
                        <div
                          key={cmd.command}
                          onClick={() => handleApplySlashCommand(cmd)}
                          onMouseEnter={() => setSelectedSlashIndex(idx)}
                          className={`p-2 rounded-xl cursor-pointer transition-all flex items-start gap-2.5 ${
                            isHighlighted
                              ? 'bg-[#FAF0EC] text-[#733F49]'
                              : 'hover:bg-[#FCF7F4] text-[#4A3B3D]'
                          }`}
                        >
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold shrink-0 transition-colors ${
                              isHighlighted
                                ? 'bg-[#733F49] text-white'
                                : 'bg-[#FAF2EE] text-[#733F49] border border-[#F2D8D4]'
                            }`}
                          >
                            {cmd.command}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold leading-tight truncate">
                              {cmd.label}
                            </div>
                            <div className="text-[11px] text-[#7A6B6C] truncate mt-0.5">
                              {cmd.desc || cmd.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Text Input */}
              <div className="relative flex-1">
                <input
                  ref={textInputRef}
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Nhập tin nhắn tư vấn nàng dâu (gõ / để mở câu lệnh nhanh)..."
                  className="w-full bg-[#FDF4F0] border border-[#F2E5E0] rounded-xl px-4 py-2.5 text-sm text-[#2C2523] placeholder:text-[#B5A5A2] outline-none focus:border-[#C98A90] focus:bg-white transition-all shadow-2xs"
                />
              </div>

              {/* Upload Image Button - Nằm bên cạnh ô nhập / cạnh nút gửi */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl border border-[#EFE5E1] bg-white text-[#7A6B6C] hover:text-[#733F49] hover:bg-[#FAF2EE] hover:border-[#E8DDD8] transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                title="Đính kèm hình ảnh"
              >
                <Image size={18} />
              </button>

              {/* Emoji Picker Button & Popover - Nằm bên cạnh ô nhập / cạnh nút gửi */}
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs transition-colors cursor-pointer ${
                    showEmojiPicker
                      ? 'bg-[#FAF2EE] text-[#733F49] border-[#E8DDD8]'
                      : 'bg-white border-[#EFE5E1] text-[#7A6B6C] hover:text-[#733F49] hover:bg-[#FAF2EE]'
                  }`}
                  title="Chèn biểu tượng cảm xúc"
                >
                  <Smile size={18} />
                </button>

                {/* Floating Emoji Popover (Mở ngược lên trên) */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-2 right-0 bg-white border border-[#EFE5E1] rounded-2xl shadow-xl p-3 z-30 w-64 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F5EBE7]">
                      <span className="text-xs font-bold text-[#733F49] flex items-center gap-1">
                        <Crown size={12} />
                        Biểu tượng cảm xúc
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="bg-transparent border-0 text-[#9A8B8C] hover:text-[#733F49] cursor-pointer p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1.5 max-h-44 overflow-y-auto p-1">
                      {WEDDING_EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectEmoji(emoji)}
                          className="w-8 h-8 rounded-lg hover:bg-[#FAF2EE] flex items-center justify-center text-lg transition-transform hover:scale-125 bg-transparent border-0 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Nút GỬI */}
              <button
                type="submit"
                className="bg-[#733F49] hover:bg-[#5C3038] text-white font-bold text-xs px-5 h-10 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer border-0"
              >
                <span>GỬI</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
        ) : (
          <div className="flex-1 bg-white rounded-2xl border border-[#EFE5E1] shadow-xs p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF2EE] flex items-center justify-center text-[#BA7A83] mb-4 shadow-2xs">
              <MessageSquare size={28} />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2C2523] mb-1">Chưa có hội thoại tư vấn</h3>
            <p className="text-xs text-[#7A6B6C] max-w-sm leading-relaxed">
              Khi khách hàng nhắn tin hoặc đặt lịch hẹn thử váy qua hệ thống, các cuộc trò chuyện tư vấn trực tiếp sẽ hiển thị tại đây.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
