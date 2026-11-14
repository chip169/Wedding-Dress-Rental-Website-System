import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search,
  Phone,
  Pin,
  Image as ImageIcon,
  Smile,
  SendHorizontal,
  ShieldCheck,
  Crown,
  X,
  ChevronLeft,
  ChevronDown,
  CheckCheck,
  ShoppingBag,
  Lock,
  LogIn } from 'lucide-react';
import { message } from 'antd';
import Header from '../../components/layout/Header';
import { addToCart } from '../../services/cartService';
import { useAuth } from '../../contexts/AuthContext';
import { getMyConversation, sendMessage, getMessages } from '../../services/chatService';
import RentSelectionModal from '../../components/common/RentSelectionModal';
import { DRESS_CATALOG } from '../../data/dressCatalog';

// Assets
import chibiBrideImg from '../../assets/chibi_bride_chat.jpg';
import card1Elysian from '../../assets/card1_elysian.jpg';

const STORAGE_KEY = 'unibridal_quick_chat_history';

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'staff',
    senderRole: 'staff',
    name: 'Mai Anh • Senior Stylist',
    time: 'Vừa xong',
    text: 'Xin chào quý cô! 🌸 Rất hân hạnh được đón tiếp quý cô tại UniBridal Haute Couture. Em có thể hỗ trợ quý cô tư vấn chọn phom dáng váy, bảng giá thuê hay đặt lịch thử váy tại showroom ạ?',
  },
];

const QUICK_SUGGESTIONS = [
  {
    id: 'price',
    label: '💎 Báo giá thuê váy',
    text: 'Cho mình xin bảng giá thuê các dòng váy cưới Haute Couture bên bạn nhé?',
    reply:
      'Dạ UniBridal có các gói thuê váy đa dạng: Dòng Tiêu Chuẩn từ 3.500.000₫ – 5.500.000₫, dòng Haute Couture đính kết Bespoke từ 8.000.000₫ – 18.000.000₫ / ngày. Giá đã bao gồm lúp đội đầu cao cấp, phụ kiện cưới và dịch vụ giặt hấp chuẩn bảo tàng nàng nhé!',
  },
  {
    id: 'silhouette',
    label: '👗 Tư vấn chọn phom dáng',
    text: 'Mình chưa biết dáng người của mình hợp với kiểu váy phom dáng nào?',
    reply:
      'UniBridal sở hữu công nghệ Corsetry siết eo định hình độc quyền: Nếu nàng muốn hóa thân công chúa lộng lẫy thì Ballgown xoè bồng là tuyệt nhất; nếu muốn tôn đường cong quyến rũ thì Mermaid đuôi cá; hoặc A-Line nhẹ nhàng thanh thoát cho mọi vóc dáng. Nàng có thể đặt lịch để chuyên viên trực tiếp đo đạc và tư vấn thử nhé!',
  },
  {
    id: 'booking',
    label: '📅 Đặt lịch thử VIP Fitting Suite',
    text: 'Mình muốn đặt lịch đến thử váy trực tiếp tại showroom vào cuối tuần.',
    reply:
      'Dạ tuyệt vời quá! UniBridal phục vụ phòng thử riêng tư Fitting Suite VIP 1-1 hoàn toàn miễn phí. Nàng có thể bấm nút "Đặt Lịch Thử Váy" trên thanh menu hoặc để lại Số Điện Thoại và Ngày mong muốn tại đây, chuyên viên sẽ liên hệ xác nhận lịch ngay ạ!',
  },
];

const popularEmojis = ['👰', '👗', '✨', '💍', '💖', '💕', '🌸', '🥰', '🪄', '👑', '🥂', '💐', '💌', '😍', '👏'];

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedDressForRent, setSelectedDressForRent] = useState(null);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(true);
  const [conversationId, setConversationId] = useState(null);

  // Yêu cầu đăng nhập trước khi khách vãng lai nhắn tin
  const requireAuth = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  // Danh sách mẫu váy để người dùng chọn hỏi tư vấn
  const filteredDresses = DRESS_CATALOG.filter((dress) => {
    if (!productSearchTerm.trim()) return true;
    const term = productSearchTerm.toLowerCase();
    return (
      dress.name?.toLowerCase().includes(term) ||
      dress.code?.toLowerCase().includes(term) ||
      dress.categoryName?.toLowerCase().includes(term)
    );
  });

  // Khởi tạo tin nhắn từ localStorage để đồng bộ với ChatWidget
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_MESSAGES;
  });

  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const isSelfDispatchingRef = useRef(false);
  const isAtBottomRef = useRef(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Cuộn lên đầu trang, khóa overflow body để giữ nguyên Header và focus ô nhập không giật trang
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 200);

    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(focusTimer);
    };
  }, []);

  // Lưu lịch sử tin nhắn vào localStorage và đồng bộ sang ChatWidget (tránh lặp vô tận)
  useEffect(() => {
    try {
      const currentSaved = localStorage.getItem(STORAGE_KEY);
      const newSaved = JSON.stringify(messages);
      if (currentSaved !== newSaved) {
        localStorage.setItem(STORAGE_KEY, newSaved);
        isSelfDispatchingRef.current = true;
        window.dispatchEvent(
          new CustomEvent('unibridal_chat_updated', {
            detail: { source: 'MessagesPage' },
          })
        );
        setTimeout(() => {
          isSelfDispatchingRef.current = false;
        }, 80);
      }
    } catch {
      // ignore
    }
  }, [messages]);

  // Lắng nghe cập nhật từ ChatWidget ở ngoài (bỏ qua nếu chính MessagesPage phát ra)
  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail?.source === 'MessagesPage' || isSelfDispatchingRef.current) return;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setMessages((prev) => {
            if (JSON.stringify(prev) === saved) return prev;
            return JSON.parse(saved);
          });
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('unibridal_chat_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('unibridal_chat_updated', handleSync);
    };
  }, []);

  // Đồng bộ cuộc hội thoại từ Backend Server
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const res = await getMyConversation();
        if (res?.data?.conversation) {
          setConversationId(res.data.conversation._id);
          if (Array.isArray(res.data.messages) && res.data.messages.length > 0) {
            const mapped = res.data.messages.map((m) => {
              const isRecalled = Boolean(m.isRecalled) || m.text === 'Tin nhắn đã được thu hồi';
              return {
                id: m._id || m.id,
                sender: m.senderRole === 'customer' ? 'user' : 'staff',
                senderRole: m.senderRole,
                name: m.senderRole === 'customer' ? (user?.fullName || 'Bạn') : 'Mai Anh • Senior Stylist',
                time: new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                text: isRecalled ? 'Tin nhắn đã được thu hồi' : m.text,
                image: isRecalled ? null : m.image,
                isRecalled,
              };
            });
            setMessages(mapped);
          }
        }
      } catch (err) {
        console.warn('Lỗi lấy hội thoại từ server:', err);
      }
    };

    fetchConversation();
  }, [user]);

  // Polling lấy tin nhắn mới mỗi 3.5s
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(async () => {
      try {
        const res = await getMessages(conversationId);
        if (res?.data && Array.isArray(res.data)) {
          const mapped = res.data.map((m) => ({
            id: m._id || m.id,
            sender: m.senderRole === 'customer' ? 'user' : 'staff',
            senderRole: m.senderRole,
            name: m.senderRole === 'customer' ? (user?.fullName || 'Bạn') : 'Mai Anh • Senior Stylist',
            time: new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            text: m.text,
          }));

          setMessages((prev) => {
            if (mapped.length > prev.length) {
              return mapped;
            }
            return prev;
          });
        }
      } catch {
        // ignore
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [conversationId, user]);

  // Tự động cuộn xuống đáy container chat (chỉ cuộn nếu người dùng đang ở đáy)
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Lắng nghe sự kiện người dùng cuộn chuột trong khung chat
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Nếu khoảng cách đến đáy < 80px, coi như đang ở đáy
    const atBottom = distanceToBottom < 80;
    isAtBottomRef.current = atBottom;
    setShowScrollToBottom(!atBottom);
  };

  // Khi đang lăn chuột lên trên, lập tức đánh dấu không ở đáy để không bị giật kéo xuống
  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      isAtBottomRef.current = false;
    }
  };

  // Cuộn xuống khi có thêm tin nhắn mới hoặc bot đang nhập (chỉ khi người dùng ở đáy)
  useEffect(() => {
    if (isAtBottomRef.current) {
      setTimeout(() => scrollToBottom('smooth'), 50);
    }
  }, [messages.length, isTyping]);

  // Lắng nghe yêu cầu tư vấn sản phẩm từ DressDetailPage
  useEffect(() => {
    if (location.state?.consultDress) {
      const dressData = location.state.consultDress;

      setMessages((prev) => {
        const alreadyAdded = prev.some(
          (m) => m.product?.id === dressData.id && m.isConsultInquiry
        );
        if (alreadyAdded) return prev;

        const currentTime = new Intl.DateTimeFormat('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date());

        const newConsultMsg = {
          id: Date.now(),
          sender: 'user',
          senderRole: 'customer',
          name: user?.fullName || 'Bạn',
          time: currentTime,
          type: 'product_recommendation',
          isConsultInquiry: true,
          text: `Chào Master Stylist Mai Anh! Mình đang xem mẫu váy "${dressData.name}" (${dressData.code || ''}) trên website và muốn được tư vấn may đo, chỉnh sửa số đo cũng như đặt lịch thử riêng tư cho mẫu này ạ ✨`,
          product: dressData,
        };

        return [...prev, newConsultMsg];
      });

      scrollToBottom('smooth');

      // Stylist phản hồi tự động
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const replyTime = new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date());

          const staffReply = {
            id: Date.now() + 1,
            sender: 'staff',
            senderRole: 'staff',
            name: 'Mai Anh • Senior Stylist',
            time: replyTime,
            type: 'text',
            text: `UniBridal chào nàng! Mẫu thiết kế "${dressData.name}" thuộc dòng Haute Couture cao cấp đang có sẵn bản toile và phom chuẩn tại Atelier VIP. Mai Anh đã giữ riêng slot thử và tư vấn 1-1 cho nàng vào cuối tuần này nhé! Nàng có thể nhắn số đo 3 vòng để stylist chuẩn bị trước ạ 💖`,
          };

          setMessages((prev) => [...prev, staffReply]);
        }, 1200);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [location.state, user]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (customText = null, isQuickSuggestion = false) => {
    if (!requireAuth()) return;
    const content = (customText !== null ? customText : inputText).trim();
    if (!content && !attachedImage) return;

    const currentTime = new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    const newMessage = {
      id: 'local_' + Date.now(),
      sender: 'user',
      senderRole: 'customer',
      name: user?.fullName || 'Bạn',
      time: currentTime,
      type: attachedImage ? 'image' : 'text',
      text: content,
      image: attachedImage,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
    setAttachedImage(null);
    setShowEmojiPicker(false);
    isAtBottomRef.current = true;
    setShowScrollToBottom(false);
    setTimeout(() => {
      scrollToBottom('smooth');
      inputRef.current?.focus({ preventScroll: true });
    }, 50);

    let currentConvId = conversationId;

    // Gửi tin nhắn lên Backend Server
    try {
      const res = await sendMessage({
        conversationId: currentConvId,
        text: content,
        senderRole: 'customer',
        guestName: user?.fullName || 'Khách hàng',
        guestPhone: user?.phone || '',
      });

      if (res?.data) {
        if (!currentConvId && res.data.conversationId) {
          currentConvId = res.data.conversationId;
          setConversationId(currentConvId);
        }
      }
    } catch (error) {
      console.warn('Lỗi gửi tin nhắn lên server:', error);
    }

    // Tự động trả lời
    if (isQuickSuggestion) {
      const matchedSuggestion = QUICK_SUGGESTIONS.find(
        (q) =>
          q.text.toLowerCase() === content.toLowerCase() ||
          content.toLowerCase().includes(q.label.toLowerCase())
      );

      if (matchedSuggestion) {
        setIsTyping(true);
        setTimeout(async () => {
          const staffMsg = {
            id: 'bot_' + Date.now(),
            sender: 'staff',
            senderRole: 'staff',
            name: 'Mai Anh • Senior Stylist',
            time: new Intl.DateTimeFormat('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date()),
            text: matchedSuggestion.reply,
          };

          setMessages((prev) => [...prev, staffMsg]);
          setIsTyping(false);

          try {
            await sendMessage({
              conversationId: currentConvId,
              text: matchedSuggestion.reply,
              senderRole: 'staff',
            });
          } catch {
            // ignore
          }
        }, 800);
      }
    } else {
      setIsTyping(true);
      setTimeout(async () => {
        const staffMsg = {
          id: 'bot_' + Date.now(),
          sender: 'staff',
          senderRole: 'staff',
          name: 'Mai Anh • Senior Stylist',
          time: new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date()),
          text: `Dạ UniBridal đã ghi nhận tin nhắn từ nàng: "${content}". Chuyên viên Mai Anh sẽ tư vấn may đo chuẩn phom dáng và liên hệ hỗ trợ nàng ngay nhé! ✨`,
        };

        setMessages((prev) => [...prev, staffMsg]);
        setIsTyping(false);

        try {
          await sendMessage({
            conversationId: currentConvId,
            text: staffMsg.text,
            senderRole: 'staff',
          });
        } catch {
          // ignore
        }
      }, 1200);
    }
  };

  // Handle Image Upload Selection
  const handleImageUpload = (e) => {
    if (!requireAuth()) return;
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAttachedImage(imageUrl);
      message.success('Đã tải hình ảnh đính kèm');
    }
  };

  // Handle Rent Now Click from Product Card - Mở Popup chọn màu sắc & kích thước chuẩn Ảnh 3
  const handleRentNow = (product) => {
    setSelectedDressForRent(product);
    setIsRentModalOpen(true);
  };

  // Người dùng chọn 1 sản phẩm váy cưới từ icon giỏ hàng để hỏi tư vấn
  const handleSelectProductToConsult = (dress) => {
    if (!requireAuth()) return;
    setShowProductPicker(false);

    const priceText = typeof dress.price === 'number'
      ? dress.price.toLocaleString('vi-VN') + '₫'
      : (dress.price || '5.200.000₫');

    const productPayload = {
      id: dress.id,
      code: dress.code || 'UB-001',
      name: dress.name,
      price: priceText,
      image: dress.image,
      description: dress.description || 'Tuyệt phẩm váy cưới Haute Couture tinh xảo UniBridal.',
      category: dress.categoryName || dress.category || 'Váy Cưới Cao Cấp',
    };

    const currentTime = new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    const userInquiryMsg = {
      id: 'local_' + Date.now(),
      sender: 'user',
      senderRole: 'customer',
      name: user?.fullName || 'Bạn',
      time: currentTime,
      type: 'product_inquiry',
      text: `Mình muốn hỏi về sản phẩm: ${dress.name}`,
      product: productPayload,
    };

    setMessages((prev) => [...prev, userInquiryMsg]);
    isAtBottomRef.current = true;
    setShowScrollToBottom(false);
    setTimeout(() => {
      scrollToBottom('smooth');
      inputRef.current?.focus({ preventScroll: true });
    }, 60);

    // Gửi lên server backend nếu có
    if (conversationId) {
      sendMessage({
        conversationId,
        text: `Mình muốn hỏi về sản phẩm: ${dress.name}`,
        senderRole: 'customer',
      }).catch(() => {});
    }

    // Chuyên viên stylist phản hồi tự động
    setIsTyping(true);
    setTimeout(async () => {
      const staffReply = {
        id: 'bot_' + Date.now(),
        sender: 'staff',
        senderRole: 'staff',
        name: 'Mai Anh • Senior Stylist',
        time: new Intl.DateTimeFormat('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date()),
        text: `Dạ UniBridal chào nàng! Mẫu thiết kế "${dress.name}" thuộc dòng Haute Couture cao cấp đang có sẵn tại Atelier VIP. Mẫu này may đo từ chất liệu ${dress.material || 'Lụa và Ren cao cấp'} với cấu trúc siết eo định hình cực kỳ tôn dáng. Nàng có muốn đặt lịch để trực tiếp thử váy riêng tư 1-1 miễn phí không ạ? ✨`,
      };

      setMessages((prev) => [...prev, staffReply]);
      setIsTyping(false);

      if (conversationId) {
        sendMessage({
          conversationId,
          text: staffReply.text,
          senderRole: 'staff',
        }).catch(() => {});
      }
    }, 1000);
  };

  // Tin nhắn cuối cùng để hiển thị ở hộp thoại bên trái
  const lastMsg = messages[messages.length - 1];

  // Lọc tin nhắn của cuộc hội thoại theo từ khóa tìm kiếm
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const displayedMessages = normalizedSearch
    ? messages.filter((m) => {
        const text = (m.text || '').toLowerCase();
        const productName = (m.product?.name || '').toLowerCase();
        const productDesc = (m.product?.description || '').toLowerCase();
        return (
          text.includes(normalizedSearch) ||
          productName.includes(normalizedSearch) ||
          productDesc.includes(normalizedSearch)
        );
      })
    : messages;

  return (
    <div className="fixed inset-0 z-10 bg-[#FDFBF7] text-[#2C2523] flex flex-col font-jakarta selection:bg-[#FCEEE9] selection:text-[#B8737D] overflow-hidden">
      {/* 1. Header Navigation */}
      <header className="shrink-0 z-30">
        <Header onOpenBooking={() => navigate('/dat-lich')} />
      </header>

      {/* 2. Top Ribbon Subheader */}
      <div className="border-b border-[#F0E6DE] bg-[#FFF9F7] py-2 px-4 sm:px-6 shrink-0">
        <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-1.5 sm:gap-4">
          <div className="flex items-center gap-2 text-[11px] sm:text-[12px] font-semibold text-[#8C5E64] uppercase tracking-[0.14em]">
            <span>TRÒ CHUYỆN CÙNG STAFF</span>
            <span className="text-[#C98A90]">•</span>
            <span className="hidden md:inline">TƯ VẤN PHOM DÁNG LỄ PHỤC</span>
            <span className="md:hidden">TƯ VẤN HAUTE COUTURE</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] sm:text-[12px] font-semibold text-[#735A5E]">
            <span className="hidden sm:inline text-[#E4D4CB]">|</span>
            <span className="text-[#8C5E64] font-medium">Mã Hồ Sơ Cô Dâu:</span>
            <span className="font-bold tracking-wide text-[#2C2523]">#UB-BRIDE-2025</span>
          </div>
        </div>
      </div>

      {/* 3. Main Chat Interface Container (Vừa vặn màn hình, tự do lăn chuột nội bộ) */}
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3.5 flex flex-col min-h-0 overflow-hidden">
        <div className="bg-white border border-[#EBE0D6] rounded-2xl shadow-[0_4px_30px_rgba(201,138,144,0.06)] overflow-hidden flex flex-1 h-full min-h-0">
          {/* ========================================================================= */}
          {/* LEFT SIDEBAR: HỘP THOẠI (CONVERSATIONS LIST)                              */}
          {/* ========================================================================= */}
          <aside
            className={`w-full md:w-[300px] lg:w-[330px] flex-shrink-0 border-r border-[#EFE5DB] bg-white flex flex-col h-full min-h-0 overflow-hidden transition-all duration-300 ${
              showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Sidebar Title và Search */}
            <div className="p-3.5 sm:p-4 border-b border-[#F2E8E0] shrink-0">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="font-playfair text-[20px] font-bold text-[#2C2523] m-0">
                  Hộp Thoại
                </h2>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#A89D9B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tin nhắn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F3] border border-[#EBE0D6] rounded-xl text-[12.5px] text-[#2C2523] placeholder:text-[#A89D9B] focus:outline-none focus:border-[#B8737D] focus:bg-white transition-all font-jakarta"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A89D9B] hover:text-[#2C2523] p-0.5 border-0 bg-transparent cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Item Đồng bộ với Chat Widget */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-0">
              {normalizedSearch && displayedMessages.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#9E908D] bg-[#FAF7F3] rounded-xl border border-dashed border-[#EAE0D6]">
                  Không tìm thấy tin nhắn nào trong cuộc trò chuyện này.
                </div>
              ) : (
                <div
                  onClick={() => setShowMobileChat(true)}
                  className="relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 select-none bg-[#FFF5F4] border border-[#F3D9DC] shadow-xs"
                >
                  {/* Avatar with status indicator */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={chibiBrideImg}
                      alt="UniBridal Concierge"
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs bg-[#FFF2F0]"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full ring-1 ring-emerald-300 animate-pulse" />
                  </div>

                  {/* Conversation Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-jakarta font-bold text-[14px] text-[#2C2523] truncate">
                          UniBridal Concierge
                        </span>
                        <span className="bg-[#FCEEE9] text-[#B8737D] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                          STAFF
                        </span>
                      </div>
                      <span className="text-[10.5px] text-[#9E908D] flex-shrink-0">
                        {lastMsg?.time || '10:41'}
                      </span>
                    </div>

                    <p className="font-jakarta text-[12px] text-[#8C7A7C] truncate m-0">
                      {normalizedSearch
                        ? `Tìm thấy ${displayedMessages.length} tin nhắn phù hợp`
                        : isTyping
                        ? 'Mai Anh đang nhập...'
                        : lastMsg?.text || 'Trò chuyện cùng Master Stylist Mai Anh...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Sub-info */}
            <div className="p-2.5 bg-[#FAF7F3] border-t border-[#F2E8E0] text-[10.5px] text-[#9E908D] text-center shrink-0">
              <span>Dữ liệu tư vấn được bảo mật theo tiêu chuẩn Atelier VIP.</span>
            </div>
          </aside>

          {/* ========================================================================= */}
          {/* RIGHT CHAT WINDOW: ĐỒNG BỘ TOÀN DIỆN VỚI CHAT WIDGET                      */}
          {/* ========================================================================= */}
          <section
            className={`flex-1 flex flex-col min-w-0 h-full min-h-0 bg-[#FDFBF9]/40 overflow-hidden relative ${
              !showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Chat Top Header (Thiết kế đồng bộ với tone Rose Gold và Chi tiết UniBridal Concierge) */}
            <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-[#9B5C66] via-[#B8737D] to-[#A35D67] text-white flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-1.5 -ml-1 text-white hover:bg-white/15 rounded-lg border-0 bg-transparent cursor-pointer"
                  title="Quay lại danh sách"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Avatar with online pulse badge */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chibiBrideImg}
                    alt="Stylist Mai Anh"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white/70 shadow-sm bg-[#FFF2F0]"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white ring-1 ring-emerald-300 animate-pulse" />
                </div>

                {/* Name và Online Status */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-playfair text-[15px] sm:text-[17px] font-bold text-white tracking-wide m-0 leading-tight">
                      UniBridal Concierge
                    </h3>
                    <Crown className="w-3.5 h-3.5 text-amber-200" />
                    <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                      SENIOR STYLIST
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-white/90 font-jakarta mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    <span>Trực tuyến • Phản hồi tức thì</span>
                  </div>
                </div>
              </div>

              {/* Chat Actions Right */}
              <div className="flex items-center gap-2">
                {/* Nút Gọi Hotline VIP */}
                <button
                  type="button"
                  onClick={() => setShowCallModal(true)}
                  className="p-1.5 text-white/90 hover:text-white hover:bg-white/15 rounded-full transition-colors border-0 bg-transparent cursor-pointer"
                  title="Hotline Stylist VIP"
                >
                  <Phone className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Sub-header Ribbon */}
            <div className="px-4 sm:px-5 py-1.5 bg-[#FFF7F4] border-b border-[#F2E6DF] flex items-center text-[11px] text-[#8C5D65] font-medium shrink-0">
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#B8737D]" />
                <span>Chuyên viên Mai Anh hỗ trợ tư vấn phom dáng và may đo lễ phục</span>
              </div>
            </div>

            {/* Search filter indicator banner (Nếu đang tìm kiếm tin nhắn) */}
            {normalizedSearch && (
              <div className="px-4 py-2 bg-[#FFF7F5] border-b border-[#F2DDD9] flex items-center justify-between text-xs text-[#733F49] shrink-0">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#B8737D]" />
                  <span>
                    Kết quả tìm kiếm cho: <strong>"{searchTerm}"</strong> (tìm thấy{' '}
                    <strong>{displayedMessages.length}</strong> tin nhắn)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-[#B8737D] hover:text-[#733F49] font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-0"
                >
                  <X className="w-3 h-3" />
                  <span>Bỏ lọc</span>
                </button>
              </div>
            )}

            {/* Chat Messages Body (Người dùng lăn chuột bên trong khung chat này) */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              onWheel={handleWheel}
              className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 bg-[#FCFBF9] min-h-0 [scrollbar-width:thin] [scrollbar-color:#D9A8AE_#FAF5F2]"
            >
              {/* Date Marker */}
              <div className="flex items-center justify-center my-2">
                <span className="px-3 py-1 bg-[#F5EFEB] text-[#8C7A7C] text-[10.5px] font-bold uppercase tracking-wider rounded-full shadow-2xs">
                  HÔM NAY • TƯ VẤN TRỰC TUYẾN 1-1
                </span>
              </div>

              {/* Message List */}
              {displayedMessages.length === 0 ? (
                <div className="py-12 text-center text-[#8C7A7C] text-sm">
                  <Search className="w-8 h-8 text-[#C9A9A4] mx-auto mb-2 opacity-50" />
                  <p>Không tìm thấy tin nhắn nào khớp với từ khóa "{searchTerm}".</p>
                </div>
              ) : (
                displayedMessages.map((msg, index) => {
                  const isUser = msg.sender === 'user' || msg.senderRole === 'customer';

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
                    >
                    {/* Header: Stylist Name và Time */}
                    {!isUser && (
                      <div className="flex items-center gap-2 text-[11.5px] text-[#7D6E6B] font-medium mb-1 px-1">
                        <img
                          src={chibiBrideImg}
                          alt="Stylist Mai Anh"
                          className="w-5 h-5 rounded-full object-cover border border-[#EADBD0]"
                        />
                        <span className="font-semibold text-[#8C5D65]">
                          {msg.name || 'Mai Anh • Senior Stylist'}
                        </span>
                        <span>•</span>
                        <span className="text-[10.5px] text-[#A89D9B]">{msg.time}</span>
                      </div>
                    )}

                    {/* Speech Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 sm:p-4 text-[13.5px] leading-relaxed shadow-xs transition-all ${
                        msg.isRecalled
                          ? 'bg-[#F5F2F0] text-[#9A8B8C] border border-dashed border-[#E3DBD7] italic'
                          : isUser
                          ? 'bg-[#7D4D54] text-white rounded-tr-xs shadow-[0_2px_12px_rgba(125,77,84,0.18)]'
                          : 'bg-white text-[#2C2523] border border-[#EDE4DB] rounded-tl-xs shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                      }`}
                    >
                      {/* Attached Image Preview if message is image */}
                      {msg.image && !msg.isRecalled && (
                        <div className="mb-2.5 rounded-xl overflow-hidden max-w-xs border border-white/20">
                          <img
                            src={msg.image}
                            alt="Ảnh đính kèm"
                            className="w-full h-auto object-cover max-h-60"
                          />
                        </div>
                      )}

                      {/* Text Content */}
                      <p className="m-0 font-jakarta whitespace-pre-wrap">{msg.text}</p>

                      {/* Product Recommendation Card (Nếu tin nhắn gắn kèm mẫu váy) */}
                      {msg.product && (
                        <div className="mt-2.5 bg-white rounded-2xl p-3 sm:p-3.5 border border-[#E5E7EB] shadow-xs flex gap-3 sm:gap-3.5 items-start text-[#2C2523] text-left">
                          {/* Product Image */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#FAF7F3] border border-[#F0E6DE]">
                            <img
                              src={msg.product.image || card1Elysian}
                              alt={msg.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-jakarta text-[14px] sm:text-[14.5px] font-bold text-[#111827] m-0 leading-snug">
                              {msg.product.name}
                            </h4>

                            <div className="mt-1 text-[13.5px] font-bold text-emerald-600 font-jakarta">
                              {typeof msg.product.price === 'number'
                                ? `${msg.product.price.toLocaleString('vi-VN')}₫`
                                : (msg.product.price ? `${msg.product.price}` : '5.200.000₫')}
                            </div>

                            <p className="font-jakarta text-[11.5px] text-[#6B7280] leading-normal m-0 mt-1 line-clamp-2">
                              {msg.product.description || 'Thiết kế cao cấp đính kết tinh xảo độc bản UniBridal.'}
                            </p>

                            {/* Link xem chi tiết sản phẩm */}
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/dresses/${msg.product.id || 1}`)}
                                className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#1F2937] hover:text-[#B8737D] underline transition-colors border-0 bg-transparent p-0 cursor-pointer"
                              >
                                <span>Xem chi tiết sản phẩm</span>
                                <span className="text-[13px] leading-none">↗</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRentNow(msg.product)}
                                className="px-3 py-1 bg-[#7D4D54] hover:bg-[#683C43] text-white rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95 border-0"
                              >
                                Thuê ngay
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* User Timestamp và Check status */}
                    {isUser && (
                      <div className="flex items-center gap-1 text-[10px] text-[#A89D9B] mt-1 px-1">
                        <span>{msg.time}</span>
                        <CheckCheck className="w-3 h-3 text-[#B8737D]" />
                      </div>
                    )}
                  </div>
                );
              }))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex flex-col items-start transition-all">
                  <div className="flex items-center gap-2 text-[11.5px] text-[#7D6E6B] font-medium mb-1">
                    <img
                      src={chibiBrideImg}
                      alt="Stylist Mai Anh"
                      className="w-5 h-5 rounded-full object-cover border border-[#EADBD0]"
                    />
                    <span>Chuyên viên Mai Anh đang soạn tin nhắn...</span>
                  </div>
                  <div className="bg-[#FAF8F7] border border-[#EADBDE] rounded-2xl rounded-tl-xs p-3 shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#B8737D] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#B8737D] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#B8737D] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Nút Cuộn Nhanh Xuống Đáy khi người dùng lăn chuột lên trên */}
            {showScrollToBottom && (
              <div className="absolute bottom-[115px] sm:bottom-[125px] right-6 z-20">
                <button
                  type="button"
                  onClick={() => {
                    isAtBottomRef.current = true;
                    scrollToBottom('smooth');
                    setShowScrollToBottom(false);
                  }}
                  className="px-3.5 py-1.5 bg-[#7D4D54] hover:bg-[#683C43] text-white text-[11px] font-bold rounded-full shadow-md flex items-center gap-1.5 border-0 cursor-pointer transition-all active:scale-95 animate-bounce"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Tin nhắn mới nhất</span>
                </button>
              </div>
            )}

            {/* Quick Suggestions Chips (Cố định ở dưới trước ô input) */}
            <div className="px-3.5 sm:px-5 py-1.5 bg-[#FAF8F7] border-t border-[#F0E6E8] flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none shrink-0">
              <span className="font-jakarta text-[10.5px] font-bold text-[#8C5D65] uppercase tracking-wider whitespace-nowrap mr-1">
                GỢI Ý NHANH:
              </span>

              {QUICK_SUGGESTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!requireAuth()) return;
                    handleSendMessage(item.text, true);
                  }}
                  className="whitespace-nowrap px-3 py-1 bg-white hover:bg-[#FFF2F0] hover:border-[#D498A0] border border-[#EADBDE] rounded-full text-[11.5px] font-medium text-[#7D535B] transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 active:scale-95 shadow-xs"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Chat Input Container */}
            <div className="p-2.5 sm:p-3.5 bg-white border-t border-[#F0E6DE] shrink-0">
              {/* Attached Image Preview if selected */}
              {attachedImage && (
                <div className="mb-2.5 inline-flex items-center gap-2 p-1.5 bg-[#FFF2F0] border border-[#F3D5DA] rounded-lg">
                  <img
                    src={attachedImage}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded"
                  />
                  <span className="text-[12px] text-[#8C5E64] font-medium">Ảnh đính kèm</span>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="text-[#8C5E64] hover:text-[#C33232] p-1 border-0 bg-transparent cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input Card Box */}
              <div className="relative">
                <div
                  onClick={() => {
                    if (!isLoggedIn) {
                      setShowLoginPrompt(true);
                    } else {
                      inputRef.current?.focus();
                    }
                  }}
                  className="flex items-center gap-2 bg-[#FAF8F7] border border-[#EADBDE] focus-within:border-[#B8737D] focus-within:ring-2 focus-within:ring-[#B8737D]/20 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xs transition-all cursor-text"
                >
                  {/* Main Text Input / Textarea */}
                  <textarea
                    ref={inputRef}
                    id="messages-chat-input"
                    name="chatMessage"
                    rows={1}
                    placeholder={isLoggedIn ? "Nhập tin nhắn tư vấn..." : "Vui lòng đăng nhập để gửi tin nhắn..."}
                    value={inputText}
                    onFocus={(e) => {
                      if (!isLoggedIn) {
                        e.target.blur();
                        setShowLoginPrompt(true);
                      }
                    }}
                    onClick={(e) => {
                      if (!isLoggedIn) {
                        e.preventDefault();
                        e.target.blur();
                        setShowLoginPrompt(true);
                      }
                    }}
                    onChange={(e) => {
                      if (!requireAuth()) return;
                      setInputText(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (!requireAuth()) {
                        e.preventDefault();
                        return;
                      }
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-transparent border-0 outline-none font-jakarta text-[13.5px] sm:text-[14px] text-[#2C2523] placeholder:text-[#A69B97] px-1 resize-none py-1 max-h-24 leading-normal"
                  />

                  {/* Product Picker Button (Icon giỏ hàng cạnh nút mặt cười) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!requireAuth()) return;
                      setShowProductPicker(!showProductPicker);
                      setShowEmojiPicker(false);
                    }}
                    className={`p-1.5 rounded-lg transition-colors border-0 bg-transparent cursor-pointer shrink-0 ${
                      showProductPicker
                        ? 'text-[#B8737D] bg-[#FFF2F0]'
                        : 'text-[#8C7E7E] hover:text-[#B8737D] hover:bg-[#FFF2F0]'
                    }`}
                    title="Chọn mẫu váy cưới để hỏi tư vấn"
                  >
                    <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
                  </button>

                  {/* File / Image Attachment Button (Đã chuyển sang cạnh icon giỏ hàng và mặt cười) */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!requireAuth()) return;
                      fileInputRef.current?.click();
                    }}
                    className="p-1.5 text-[#8C7E7E] hover:text-[#B8737D] hover:bg-[#FFF2F0] rounded-lg transition-colors border-0 bg-transparent cursor-pointer shrink-0"
                    title="Gửi hình ảnh mẫu váy"
                  >
                    <ImageIcon className="w-5 h-5 stroke-[1.8]" />
                  </button>

                  {/* Emoji Picker Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!requireAuth()) return;
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowProductPicker(false);
                    }}
                    className={`p-1.5 rounded-lg transition-colors border-0 bg-transparent cursor-pointer shrink-0 ${
                      showEmojiPicker
                        ? 'text-[#B8737D] bg-[#FFF2F0]'
                        : 'text-[#8C7E7E] hover:text-[#B8737D] hover:bg-[#FFF2F0]'
                    }`}
                    title="Biểu tượng cảm xúc"
                  >
                    <Smile className="w-5 h-5 stroke-[1.8]" />
                  </button>

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!requireAuth()) return;
                      handleSendMessage();
                    }}
                    disabled={!inputText.trim() && !attachedImage}
                    className="w-9 h-9 rounded-xl bg-[#7D4D54] hover:bg-[#683C43] text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs border-0 flex-shrink-0"
                    title="Gửi tin nhắn"
                  >
                    <SendHorizontal className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>

                {/* Product Picker Popover (Danh sách tất cả sản phẩm váy cưới để chọn hỏi) */}
                {showProductPicker && (
                  <div className="absolute right-0 bottom-full mb-2 bg-white rounded-2xl shadow-[0_16px_40px_rgba(44,37,35,0.18)] border border-[#EFE5DB] p-3.5 z-30 w-[330px] sm:w-[380px] max-w-[92vw]">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F2E8E0]">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-[#B8737D]" />
                        <span className="text-[12px] font-bold text-[#2C2523] uppercase tracking-wider font-jakarta">
                          Chọn váy cưới để hỏi ({filteredDresses.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowProductPicker(false)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#8C7A7C] hover:bg-[#FAF5F2] hover:text-[#2C2523] border-0 bg-transparent cursor-pointer"
                        title="Đóng"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Search Box */}
                    <div className="relative mb-2.5">
                      <Search className="w-3.5 h-3.5 text-[#A89D9B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm theo tên váy cưới..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-[#FAF8F7] border border-[#EBE0D6] rounded-xl text-[12px] text-[#2C2523] placeholder:text-[#A89D9B] focus:outline-none focus:border-[#B8737D] focus:bg-white transition-all font-jakarta"
                      />
                    </div>

                    {/* Products Scroll List */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 [scrollbar-width:thin] [scrollbar-color:#D9A8AE_#FAF5F2]">
                      {filteredDresses.map((dress) => (
                        <div
                          key={dress.id || dress.code}
                          onClick={() => handleSelectProductToConsult(dress)}
                          className="flex items-center gap-2.5 p-2 rounded-xl border border-[#F0E6DE] hover:border-[#B8737D] hover:bg-[#FFF8F7] transition-all cursor-pointer group bg-white shadow-2xs"
                        >
                          <img
                            src={dress.image}
                            alt={dress.name}
                            className="w-12 h-12 rounded-lg object-cover bg-[#FAF7F3] border border-[#F0E6DE] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            {dress.categoryName && (
                              <div className="text-[10px] text-[#8C7D7E] font-medium uppercase tracking-wider mb-0.5">
                                {dress.categoryName}
                              </div>
                            )}
                            <div className="font-jakarta font-bold text-[12.5px] text-[#2C2523] truncate group-hover:text-[#B8737D] transition-colors">
                              {dress.name}
                            </div>
                            <div className="text-[12px] font-bold text-emerald-600 font-jakarta">
                              {typeof dress.price === 'number' ? dress.price.toLocaleString('vi-VN') + '₫' : dress.price}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded-lg bg-[#B8737D]/10 text-[#B8737D] group-hover:bg-[#7D4D54] group-hover:text-white text-[10.5px] font-bold transition-all border-0 cursor-pointer shrink-0"
                          >
                            Hỏi
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                  <div className="absolute right-0 bottom-full mb-2 bg-white rounded-2xl shadow-[0_12px_36px_rgba(44,37,35,0.15)] border border-[#EFE5DB] p-3 z-30 w-64">
                    <div className="text-[11px] font-bold text-[#8C7A7C] uppercase tracking-wider mb-2">
                      Biểu tượng yêu thích
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 text-[20px]">
                      {popularEmojis.map((emoji, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setInputText((prev) => prev + emoji);
                            setShowEmojiPicker(false);
                            inputRef.current?.focus({ preventScroll: true });
                          }}
                          className="hover:bg-[#FAF6F2] rounded-lg p-1.5 transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-helper footnotes */}
              <div className="mt-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[#9E908D] gap-1 px-1">
                <span>Nhấn Enter để gửi tin • Shift + Enter để xuống dòng</span>
                <span className="flex items-center gap-1.5 text-[#8C7B7D] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B8737D]" />
                  <span>Hỗ trợ 24/7 từ Giám Đốc Sáng Tạo UniBridal</span>
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 4. VIP Call Hotline Modal */}
      {showCallModal && (
        <div
          onClick={() => setShowCallModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl p-6 max-w-sm w-full border border-[#EDE4DB] shadow-2xl text-center"
          >
            {/* Nút X ở góc trên bên phải */}
            <button
              type="button"
              onClick={() => setShowCallModal(false)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#FAF5F2] hover:bg-[#F2E6E2] text-[#8C7A7C] hover:text-[#2C2523] flex items-center justify-center transition-all border-0 cursor-pointer shadow-2xs"
              title="Đóng modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-full bg-[#FFF2F0] border border-[#F3D5DA] flex items-center justify-center mx-auto mb-4 text-[#B8737D]">
              <Phone className="w-6 h-6 stroke-[2] animate-bounce" />
            </div>
            <h3 className="font-playfair text-[20px] font-bold text-[#2C2523] mb-1">
              Đường Dây VIP Stylist 24/7
            </h3>
            <p className="font-jakarta text-[13px] text-[#695D5E] mb-4">
              Kết nối trực tiếp với Master Stylist Mai Anh tại Atelier TP. Hồ Chí Minh
            </p>
            <div className="bg-[#FAF7F3] p-3 rounded-xl border border-[#EAE0D6]">
              <span className="text-[12px] text-[#8C7D7E] block mb-0.5">Hotline Khách Hàng VIP</span>
              <a
                href="tel:0908123888"
                className="font-jakarta font-bold text-[18px] text-[#7D4D54] tracking-wider hover:underline"
              >
                0908 123 888
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Popup chọn màu sắc & kích thước chuẩn Ảnh 3 khi bấm Thuê Ngay */}
      <RentSelectionModal
        isOpen={isRentModalOpen}
        onClose={() => {
          setIsRentModalOpen(false);
          setSelectedDressForRent(null);
        }}
        dress={selectedDressForRent}
      />

      {/* Modal Yêu Cầu Đăng Nhập cho Khách Vãng Lai */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl border border-[#F2D6D8] text-center relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 border-0 bg-transparent cursor-pointer transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-[#FFF2F0] border-2 border-[#F7D4D7] flex items-center justify-center mx-auto mb-4 text-[#B8737D] shadow-sm">
              <Lock className="w-8 h-8 stroke-[2]" />
            </div>

            <h3 className="font-playfair text-xl sm:text-2xl font-bold text-[#2C2523] mb-2">
              Yêu Cầu Đăng Nhập
            </h3>
            <p className="text-sm text-[#6E6260] font-jakarta leading-relaxed mb-6 px-2">
              Nàng vui lòng đăng nhập hoặc tạo tài khoản để có thể gửi tin nhắn, nhận phác đồ tư vấn may đo và bảo mật toàn bộ lịch sử tư vấn cùng Stylist UniBridal nhé! ✨
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate('/login', { state: { from: { pathname: '/tin-nhan' } } });
                }}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#9B5C66] via-[#B8737D] to-[#A35D67] hover:opacity-95 text-white font-jakarta font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer border-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Ngay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate('/register');
                }}
                className="w-full py-2.5 px-5 rounded-2xl bg-[#FAF8F7] hover:bg-[#FFF2F0] text-[#7D535B] hover:text-[#B8737D] border border-[#EADBDE] hover:border-[#D498A0] font-jakarta font-medium text-sm active:scale-95 transition-all cursor-pointer"
              >
                Tạo Tài Khoản Mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
