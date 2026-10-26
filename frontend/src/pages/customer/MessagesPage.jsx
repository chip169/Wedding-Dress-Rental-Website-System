import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Phone,
  Pin,
  MoreVertical,
  Image as ImageIcon,
  Smile,
  SendHorizontal,
  ShieldCheck,
  Gem,
  Sparkles,
  Scissors,
  Calendar,
  X,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  ShoppingBag,
  ArrowRight,
  Info,
  Clock,
  MapPin,
  Trash2,
  Bell
} from 'lucide-react';
import { message, Modal } from 'antd';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import BookingModal from '../../components/common/BookingModal';
import { addToCart } from '../../services/cartService';

// Assets
import card1Elysian from '../../assets/card1_elysian.jpg';
import aboutFounderImg from '../../assets/about_founder_portrait.jpg';

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('mai-anh');
  const [pinnedConsultProduct, setPinnedConsultProduct] = useState(
    location.state?.consultDress || null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pinnedIds, setPinnedIds] = useState(['mai-anh']);
  const isPinned = pinnedIds.includes(activeTab);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [isStaffTyping, setIsStaffTyping] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(true);

  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const prevActiveTabRef = useRef(activeTab);
  const prevMessagesCountRef = useRef(null);

  // Cuộn lên đầu trang khi vào trang tin nhắn
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // List of conversations
  const conversations = [
    {
      id: 'mai-anh',
      name: 'Mai Anh',
      role: 'STAFF',
      avatar: aboutFounderImg,
      isOnline: true,
      lastTime: '10:41',
      lastMessage: 'Mai Anh đang nhập...',
      isTyping: true,
      unreadCount: 0,
    },
    {
      id: 'hoang-hung',
      name: 'Hoàng Hưng',
      role: 'STAFF',
      iconType: 'diamond',
      isOnline: true,
      lastTime: '24/10',
      lastMessage: 'Xác nhận lịch thử váy tại UniBridal shop',
      isTyping: false,
      unreadCount: 0,
    },
    {
      id: 'chuyen-vien',
      name: 'Chuyên viên',
      role: 'STAFF',
      iconType: 'dress',
      isOnline: false,
      lastTime: '22/10',
      lastMessage: '...',
      isTyping: false,
      unreadCount: 0,
    },
  ];

  // Conversation messages state
  const [messages, setMessages] = useState({
    'mai-anh': [
      {
        id: 1,
        sender: 'staff',
        authorName: 'Master Stylist Mai Anh',
        avatar: aboutFounderImg,
        time: '10:35',
        type: 'text',
        text: 'Chào nàng dâu Quỳnh Anh! Tôi đã xem qua hồ sơ và phom dáng lễ phục bạn chọn cho lễ cưới tháng 11. Rất vui được đồng hành để giúp bạn tỏa sáng trọn vẹn nhất trong khoảnh khắc thiêng liêng.',
      },
      {
        id: 2,
        sender: 'staff',
        authorName: 'Master Stylist Mai Anh',
        avatar: aboutFounderImg,
        time: '10:36',
        type: 'product_recommendation',
        text: 'Mẫu Elysian Rose Ballgown rất phù hợp với chiều cao và vóc dáng của bạn. Chúng tôi có thể điều chỉnh đường siết eo corset và hạ đuôi ren theo đúng số đo chuẩn.',
        product: {
          id: 1,
          code: 'MÃ: #UB-ELY-2025',
          category: 'HAUTE COUTURE • MAY ĐO BESPOKE',
          tag: 'HAUTE COUTURE',
          name: 'Elysian Rose Ballgown',
          description: 'Ren Alençon Pháp thêu tay kết hợp 7 tầng voan tơ xếp tầng bồng bềnh',
          price: '5.200.000₫',
          priceUnit: '/ 1 ngày',
          depositInfo: 'Tiền cọc bảo lãnh: 15.000.000₫ (Hoàn tất sau ngày trả váy)',
          image: card1Elysian,
        },
      },
      {
        id: 3,
        sender: 'user',
        authorName: 'Nàng Quỳnh Anh',
        initials: 'QA',
        time: '10:39',
        type: 'text',
        text: 'Chào Mai Anh, mình muốn vòng eo được thắt corset chặt hơn một chút và kiểm tra thời gian thử toile đầu tiên vào cuối tuần này được không?',
      },
      {
        id: 4,
        sender: 'staff',
        authorName: 'Master Stylist Mai Anh',
        avatar: aboutFounderImg,
        time: '10:41',
        type: 'text',
        text: 'Hoàn toàn khả thi nàng nhé! Hệ thống gọng corset xương cá tơ tằm của UniBridal có thể giảm từ 4-7cm vòng eo nhưng vẫn mang lại cảm giác êm ái khi di chuyển. Mình đã đặt phòng Fitting Suite VIP vào 15:00 Thứ Bảy cho nàng rồi nhé!',
      },
    ],
    'hoang-hung': [
      {
        id: 101,
        sender: 'staff',
        authorName: 'Stylist Hoàng Hưng',
        time: '24/10 - 09:15',
        type: 'text',
        text: 'Chào Quỳnh Anh, mình phụ trách điều phối lịch thử lễ phục tại UniBridal Atelier TP. Hồ Chí Minh.',
      },
      {
        id: 102,
        sender: 'staff',
        authorName: 'Stylist Hoàng Hưng',
        time: '24/10 - 09:18',
        type: 'text',
        text: 'Xác nhận lịch thử váy tại UniBridal shop vào cuối tuần này. Chuyên viên may đo và stylist riêng đã chuẩn bị sẵn mẫu thiết kế cho bạn.',
      },
    ],
    'chuyen-vien': [
      {
        id: 201,
        sender: 'staff',
        authorName: 'Chuyên viên tư vấn',
        time: '22/10 - 14:00',
        type: 'text',
        text: 'Cảm ơn nàng đã gửi yêu cầu tư vấn gói thuê Haute Couture 2026. Chuyên viên phụ trách sẽ hỗ trợ giải đáp mọi thắc mắc của bạn.',
      },
    ],
  });

  const quickPrompts = [
    {
      id: 'phom-dang',
      icon: '👗',
      label: 'Tư vấn phom dáng theo vóc dáng',
      question: 'Nhờ Stylist tư vấn chi tiết phom váy Ballgown và Mermaid phù hợp nhất với vóc dáng của mình?',
      response: 'Dạ nàng ơi! Với số đo và tỉ lệ cơ thể của nàng, phom Ballgown siết eo corset tôn ngực hoặc phom Drop Waist sẽ giúp kéo dài phần thân và tạo hiệu ứng vòng eo đồng hồ cát cực kỳ quyến rũ!',
    },
    {
      id: 'so-do',
      icon: '📐',
      label: 'Hướng dẫn lấy số đo cô dâu',
      question: 'Cho mình xin bảng hướng dẫn chi tiết cách lấy 3 vòng và hạ eo chuẩn nhất nhé?',
      response: 'UniBridal gửi nàng bảng chỉ số vàng chuẩn Haute Couture: Nàng vui lòng đo sát chân ngực, vòng eo nhỏ nhất (trên rốn 2-3cm) và vòng nở mông lớn nhất khi mang giày cao gót bằng chiều cao ngày cưới nhé!',
    },
    {
      id: 'dat-hen',
      icon: '📅',
      label: 'Đặt hẹn thử váy tại VIP Fitting Suite',
      question: 'Mình muốn book một buổi thử váy riêng tư tại Private Suite VIP cuối tuần này.',
      response: 'Dạ tuyệt vời quá! UniBridal đã giữ phòng Private VIP Suite với trà hoa cao cấp và stylist 1-1 cho nàng. Nàng có thể nhấn nút "Đặt Lịch" ngay trên thanh menu để chọn khung giờ chính xác nhé!',
    },
  ];

  const popularEmojis = ['👰', '👗', '✨', '💍', '💖', '💕', '🌸', '🥰', '🪄', '👑', '🥂', '💐', '💌', '😍', '👏'];

  // Quản lý cuộn tin nhắn:
  // 1. Khi bấm chuyển sang cuộc trò chuyện khác (activeTab đổi): giữ nguyên ở đầu cuộc trò chuyện (scrollTop = 0), không kéo trang xuống và không cuộn xuống cuối
  // 2. Chỉ cuộn mượt xuống đáy container khi có TIN NHẮN MỚI trong cùng một cuộc trò chuyện
  useEffect(() => {
    // Lần đầu mount: lưu số lượng tin nhắn ban đầu và đảm bảo ở đầu đoạn chat
    if (prevMessagesCountRef.current === null) {
      prevMessagesCountRef.current = messages[activeTab]?.length || 0;
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = 0;
      }
      return;
    }

    // Trường hợp đổi cuộc trò chuyện: giữ ở đầu chat, tuyệt đối không cuộn trang web
    if (prevActiveTabRef.current !== activeTab) {
      prevActiveTabRef.current = activeTab;
      prevMessagesCountRef.current = messages[activeTab]?.length || 0;
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = 0;
      }
      return;
    }

    // Trường hợp cùng cuộc trò chuyện: chỉ cuộn container chat khi có tin nhắn mới hoặc staff đang gõ
    const currentCount = messages[activeTab]?.length || 0;
    if (currentCount > prevMessagesCountRef.current || isStaffTyping) {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
    prevMessagesCountRef.current = currentCount;
  }, [activeTab, messages, isStaffTyping]);

  // Lắng nghe yêu cầu tư vấn sản phẩm từ DressDetailPage
  useEffect(() => {
    if (location.state?.consultDress) {
      const dressData = location.state.consultDress;
      setPinnedConsultProduct(dressData);
      setActiveTab('mai-anh');

      setMessages((prev) => {
        const maiAnhMessages = prev['mai-anh'] || [];
        const alreadyAdded = maiAnhMessages.some(
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
          authorName: 'Nàng Quỳnh Anh',
          initials: 'QA',
          time: currentTime,
          type: 'product_recommendation',
          isConsultInquiry: true,
          text: `Chào Master Stylist Mai Anh! Mình đang xem mẫu váy "${dressData.name}" (${dressData.code}) trên website và muốn được tư vấn may đo, chỉnh sửa số đo cũng như đặt lịch thử riêng tư cho mẫu này ạ ✨`,
          product: dressData,
        };

        return {
          ...prev,
          'mai-anh': [...maiAnhMessages, newConsultMsg],
        };
      });

      // Tự động cuộn xuống đáy container chat khi nhận sản phẩm tư vấn
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 150);

      // Phản hồi tự động từ Stylist Mai Anh
      const timer = setTimeout(() => {
        setIsStaffTyping(true);
        setTimeout(() => {
          setIsStaffTyping(false);
          const replyTime = new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date());

          const staffReply = {
            id: Date.now() + 1,
            sender: 'staff',
            authorName: 'Master Stylist Mai Anh',
            avatar: aboutFounderImg,
            time: replyTime,
            type: 'text',
            text: `UniBridal chào nàng Quỳnh Anh! Mẫu thiết kế "${dressData.name}" thuộc dòng Haute Couture cao cấp đang có sẵn bản toile và phom chuẩn tại Atelier VIP. Mai Anh đã giữ riêng slot thử và tư vấn 1-1 cho nàng vào cuối tuần này nhé! Nàng có thể nhắn số đo 3 vòng để stylist chuẩn bị trước ạ 💖`,
          };

          setMessages((prev) => ({
            ...prev,
            'mai-anh': [...(prev['mai-anh'] || []), staffReply],
          }));
        }, 1500);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Handle Send Message
  const handleSendMessage = (customText = null) => {
    const textToSend = (customText !== null ? customText : inputText).trim();
    if (!textToSend && !attachedImage) return;

    const currentTime = new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    const newMessage = {
      id: Date.now(),
      sender: 'user',
      authorName: 'Nàng Quỳnh Anh',
      initials: 'QA',
      time: currentTime,
      type: attachedImage ? 'image' : 'text',
      text: textToSend,
      image: attachedImage,
    };

    setMessages((prev) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), newMessage],
    }));

    setInputText('');
    setAttachedImage(null);
    setShowEmojiPicker(false);

    // Simulate auto response from Stylist if messaging Mai Anh
    if (activeTab === 'mai-anh') {
      setIsStaffTyping(true);
      setTimeout(() => {
        setIsStaffTyping(false);
        const replyTime = new Intl.DateTimeFormat('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date());

        const staffReply = {
          id: Date.now() + 1,
          sender: 'staff',
          authorName: 'Master Stylist Mai Anh',
          avatar: aboutFounderImg,
          time: replyTime,
          type: 'text',
          text: 'Dạ em đã ghi nhận mong muốn của nàng rồi ạ! Em sẽ phối hợp trực tiếp với Master Tailor tại xưởng may để hoàn thiện phom dáng chuẩn nhất cho nàng trước buổi thử nhé ✨',
        };

        setMessages((prev) => ({
          ...prev,
          [activeTab]: [...(prev[activeTab] || []), staffReply],
        }));
      }, 1600);
    }
  };

  // Handle Quick Prompt Click
  const handleQuickPromptClick = (prompt) => {
    const currentTime = new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      authorName: 'Nàng Quỳnh Anh',
      initials: 'QA',
      time: currentTime,
      type: 'text',
      text: prompt.question,
    };

    setMessages((prev) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), userMsg],
    }));

    setIsStaffTyping(true);
    setTimeout(() => {
      setIsStaffTyping(false);
      const replyTime = new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());

      const staffReply = {
        id: Date.now() + 1,
        sender: 'staff',
        authorName: 'Master Stylist Mai Anh',
        avatar: aboutFounderImg,
        time: replyTime,
        type: 'text',
        text: prompt.response,
      };

      setMessages((prev) => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), staffReply],
      }));
    }, 1200);
  };

  // Handle Image Upload Selection
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAttachedImage(imageUrl);
      message.success('Đã tải hình ảnh đính kèm');
    }
  };

  // Handle Rent Now Click from Product Card
  const handleRentNow = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: 5200000,
      image: product.image,
      rentalDays: 1,
      size: 'S',
    });
    message.success(`Đã thêm "${product.name}" vào giỏ thuê thành công!`);
    navigate('/cart');
  };

  // Handle Pin/Unpin Conversation
  const handleTogglePin = () => {
    if (pinnedIds.includes(activeTab)) {
      setPinnedIds((prev) => prev.filter((id) => id !== activeTab));
      message.success('Đã bỏ ghim cuộc trò chuyện');
    } else {
      setPinnedIds((prev) => [activeTab, ...prev.filter((id) => id !== activeTab)]);
      message.success('Đã ghim cuộc trò chuyện lên đầu danh sách');
    }
  };

  // Sort conversations so pinned conversations are always on top
  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id);
    const bPinned = pinnedIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    if (aPinned && bPinned) {
      return pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id);
    }
    return 0;
  });

  // Filter conversations based on search
  const filteredConversations = sortedConversations.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentMessages = messages[activeTab] || [];
  const activeConversation = conversations.find((c) => c.id === activeTab) || conversations[0];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2523] flex flex-col font-jakarta selection:bg-[#FCEEE9] selection:text-[#B8737D]">
      {/* 1. Header Navigation */}
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      {/* 2. Top Ribbon Subheader */}
      <div className="border-b border-[#F0E6DE] bg-[#FFF9F7] py-2.5 px-4 sm:px-6">
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

      {/* 3. Main Chat Interface Container */}
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-3 sm:px-6 py-4 sm:py-6 lg:py-8 flex flex-col">
        <div className="bg-white border border-[#EBE0D6] rounded-2xl shadow-[0_4px_30px_rgba(201,138,144,0.06)] overflow-hidden flex flex-1 min-h-[640px] md:min-h-[720px]">

          {/* ========================================================================= */}
          {/* LEFT SIDEBAR: HỘP THOẠI (CONVERSATIONS LIST)                              */}
          {/* ========================================================================= */}
          <aside
            className={`w-full md:w-[320px] lg:w-[350px] flex-shrink-0 border-r border-[#EFE5DB] bg-[#FFFFFF] flex flex-col transition-all duration-300 ${showMobileChat ? 'hidden md:flex' : 'flex'
              }`}
          >
            {/* Sidebar Title & Search */}
            <div className="p-5 border-b border-[#F2E8E0]">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="font-playfair text-[22px] font-bold text-[#2C2523] m-0">
                  Hộp Thoại
                </h2>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#A89D9B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tin nhắn, chuyên viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF7F3] border border-[#EBE0D6] rounded-xl text-[13px] text-[#2C2523] placeholder:text-[#A89D9B] focus:outline-none focus:border-[#B8737D] focus:bg-white transition-all font-jakarta"
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

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-transparent">
              {filteredConversations.map((chat) => {
                const isActive = activeTab === chat.id;

                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setActiveTab(chat.id);
                      setShowMobileChat(true);
                    }}
                    className={`relative p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 select-none ${isActive
                      ? 'bg-[#FFF5F4] border border-[#F3D9DC] shadow-xs'
                      : 'hover:bg-[#FAF7F3] border border-transparent'
                      }`}
                  >
                    {/* Avatar with status indicator */}
                    <div className="relative flex-shrink-0">
                      {chat.avatar ? (
                        <img
                          src={chat.avatar}
                          alt={chat.name}
                          className="w-11 h-11 rounded-full object-cover border border-[#EADBD0]"
                        />
                      ) : chat.iconType === 'diamond' ? (
                        <div className="w-11 h-11 rounded-full bg-[#FFF2F0] border border-[#F5D5DA] flex items-center justify-center text-[#B8737D]">
                          <Gem className="w-5 h-5 stroke-[1.8]" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[#F5EFEA] border border-[#E5D8CD] flex items-center justify-center text-[#8C7A78]">
                          <Scissors className="w-5 h-5 stroke-[1.8]" />
                        </div>
                      )}

                      {/* Online dot */}
                      {chat.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Chat Text Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`font-jakarta text-[14.5px] truncate ${isActive ? 'font-bold text-[#2C2523]' : 'font-semibold text-[#2C2523]'}`}>
                            {chat.name}
                          </span>
                          <span className="bg-[#FCEEE9] text-[#B8737D] text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {chat.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-1">
                          {pinnedIds.includes(chat.id) && (
                            <Pin className="w-3 h-3 text-[#B8737D] fill-[#B8737D]/20 -rotate-45 flex-shrink-0" />
                          )}
                          <span className="text-[11px] text-[#A89F9E] whitespace-nowrap font-medium">
                            {chat.lastTime}
                          </span>
                        </div>
                      </div>

                      <div className="truncate">
                        {chat.id === 'mai-anh' && isStaffTyping ? (
                          <span className="text-[12px] text-[#B8737D] font-medium italic flex items-center gap-1">
                            <span>Mai Anh đang nhập</span>
                            <span className="inline-flex gap-0.5">
                              <span className="w-1 h-1 rounded-full bg-[#B8737D] animate-bounce" />
                              <span className="w-1 h-1 rounded-full bg-[#B8737D] animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1 h-1 rounded-full bg-[#B8737D] animate-bounce [animation-delay:0.4s]" />
                            </span>
                          </span>
                        ) : (
                          <span
                            className={`text-[12.5px] truncate block ${chat.id === 'mai-anh'
                              ? 'text-[#8C7A7C] font-normal italic'
                              : 'text-[#7A6E6D]'
                              }`}
                          >
                            {chat.lastMessage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredConversations.length === 0 && (
                <div className="py-8 text-center text-[#9E908D] text-[13px]">
                  Không tìm thấy cuộc trò chuyện phù hợp.
                </div>
              )}
            </div>

            {/* Sidebar Footnote */}
            <div className="p-3.5 bg-[#FAF7F3] border-t border-[#F2E8E0] text-[11px] text-[#8C7A78] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B8737D] flex-shrink-0" />
              <span>Dữ liệu tư vấn được bảo mật theo tiêu chuẩn Atelier VIP.</span>
            </div>
          </aside>

          {/* ========================================================================= */}
          {/* RIGHT CHAT WINDOW: ACTIVE CONVERSATION                                    */}
          {/* ========================================================================= */}
          <section
            className={`flex-1 flex flex-col min-w-0 bg-[#FDFBF9]/40 ${!showMobileChat ? 'hidden md:flex' : 'flex'
              }`}
          >
            {/* Chat Top Header */}
            <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-[#EFE5DB] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-1.5 -ml-1 text-[#2C2523] hover:text-[#B8737D] border-0 bg-transparent cursor-pointer"
                  title="Quay lại danh sách"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Staff Avatar with online badge */}
                <div className="relative flex-shrink-0">
                  {activeConversation.avatar ? (
                    <img
                      src={activeConversation.avatar}
                      alt={activeConversation.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#EADBD0]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#FFF2F0] border border-[#F5D5DA] flex items-center justify-center text-[#B8737D]">
                      <Gem className="w-5 h-5 stroke-[1.8]" />
                    </div>
                  )}
                  {activeConversation.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Name & Online Status */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-jakarta font-bold text-[15.5px] text-[#2C2523]">
                      {activeConversation.name}
                    </span>
                    <span className="bg-[#FCEEE9] text-[#B8737D] text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {activeConversation.role}
                    </span>
                  </div>
                  <div className="text-[12px] text-emerald-600 font-medium">
                    <span>{activeConversation.isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}</span>
                  </div>
                </div>
              </div>

              {/* Chat Actions Right */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Call Button */}
                <button
                  type="button"
                  onClick={() => setShowCallModal(true)}
                  className="p-2 text-[#786D6B] hover:text-[#B8737D] hover:bg-[#FAF6F2] rounded-full transition-colors border-0 bg-transparent cursor-pointer"
                  title="Gọi thoại trực tiếp"
                >
                  <Phone className="w-4 h-4 stroke-[2]" />
                </button>

                {/* Pin Button */}
                <button
                  type="button"
                  onClick={handleTogglePin}
                  className={`p-2 rounded-full transition-colors border-0 bg-transparent cursor-pointer ${isPinned ? 'text-[#B8737D] bg-[#FFF2F0]' : 'text-[#786D6B] hover:text-[#B8737D] hover:bg-[#FAF6F2]'
                    }`}
                  title={isPinned ? 'Bỏ ghim cuộc trò chuyện' : 'Ghim cuộc trò chuyện lên đầu'}
                >
                  <Pin className="w-4 h-4 stroke-[2]" />
                </button>

                {/* More Options Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="p-2 text-[#786D6B] hover:text-[#B8737D] hover:bg-[#FAF6F2] rounded-full transition-colors border-0 bg-transparent cursor-pointer"
                    title="Tùy chọn khác"
                  >
                    <MoreVertical className="w-4 h-4 stroke-[2]" />
                  </button>

                  {showMoreMenu && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-[0_10px_30px_rgba(44,37,35,0.12)] border border-[#F0E6DE] py-1.5 z-20 text-[13px]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setIsBookingOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F3] text-[#2C2523] flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 text-[#B8737D]" />
                        <span>Đặt lịch thử váy VIP</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          navigate('/collection');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F3] text-[#2C2523] flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-[#B8737D]" />
                        <span>Khám phá bộ sưu tập</span>
                      </button>
                      <div className="border-t border-[#F0E6DE] my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          message.info('Đã lưu lịch sử tin nhắn của bạn.');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#FAF7F3] text-[#7A6E6D] flex items-center gap-2 border-0 bg-transparent cursor-pointer"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Tải xuống lịch sử chat</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pinned Consultation Product Banner (Ghim Sản Phẩm Tư Vấn) */}
            {pinnedConsultProduct && (
              <div className="px-4 sm:px-6 py-2.5 bg-[#FFF8F7] border-b border-[#F2DDD9] flex items-center justify-between gap-3 shadow-2xs select-none">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#B8737D] uppercase tracking-wider flex-shrink-0">
                    <Pin className="w-3.5 h-3.5 fill-[#B8737D]/20 -rotate-45" />
                    <span className="hidden sm:inline">Đang tư vấn:</span>
                  </div>
                  <img
                    src={pinnedConsultProduct.image}
                    alt={pinnedConsultProduct.name}
                    className="w-9 h-9 rounded-md object-cover border border-[#E8D7D3] flex-shrink-0 bg-white"
                  />
                  <div className="truncate">
                    <span className="font-playfair font-bold text-[13.5px] text-[#2C2523] truncate mr-2 block sm:inline">
                      {pinnedConsultProduct.name}
                    </span>
                    <span className="text-[12px] font-bold text-[#7E4A52]">
                      {pinnedConsultProduct.price}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/dresses/${pinnedConsultProduct.id}`)}
                    className="px-2.5 py-1 text-[11px] font-bold text-[#7D4D54] hover:bg-[#FBECEB] rounded-lg border border-[#E8D3D6] transition-colors bg-white cursor-pointer tracking-wider uppercase"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinnedConsultProduct(null)}
                    className="p-1 text-[#9E908D] hover:text-[#2C2523] rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                    title="Bỏ ghim sản phẩm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Chat Messages Stream */}
            <div
              ref={messagesContainerRef}
              className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[580px] min-h-[440px]"
            >
              {/* Date Separator Pill */}
              <div className="flex justify-center">
                <span className="px-4 py-1.5 bg-[#F4EFEA] text-[#8C7F7D] font-jakarta text-[11px] font-semibold tracking-wider uppercase rounded-full select-none">
                  HÔM NAY, 25 THÁNG 10, 2024
                </span>
              </div>

              {/* Messages Render */}
              {currentMessages.map((msg) => {
                const isUser = msg.sender === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
                  >
                    {/* Author line and timestamp */}
                    <div
                      className={`flex items-center gap-2 text-[11.5px] text-[#7D6E6B] font-medium mb-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'
                        }`}
                    >
                      {/* Avatar preview */}
                      {!isUser && (
                        <img
                          src={msg.avatar || aboutFounderImg}
                          alt={msg.authorName}
                          className="w-6 h-6 rounded-full object-cover border border-[#EADBD0]"
                        />
                      )}
                      {isUser && (
                        <div className="w-6 h-6 rounded-full bg-[#CCA0A6] text-white font-bold text-[10px] flex items-center justify-center">
                          {msg.initials || 'QA'}
                        </div>
                      )}
                      <span>
                        {msg.authorName} • {msg.time}
                      </span>
                    </div>

                    {/* Chat Bubble */}
                    <div
                      className={`rounded-2xl text-[13.5px] leading-relaxed p-4 transition-all shadow-2xs ${isUser
                        ? 'bg-[#BC7C85] text-white rounded-tr-xs max-w-[92%] sm:max-w-[70%]'
                        : 'bg-[#F7F3EE] text-[#2C2523] rounded-tl-xs max-w-[94%] sm:max-w-[75%]'
                        }`}
                    >
                      {/* Text content */}
                      {msg.text && <p className="m-0 whitespace-pre-wrap">{msg.text}</p>}

                      {/* Image attached if any */}
                      {msg.image && (
                        <div className="mt-2.5 rounded-lg overflow-hidden border border-[#EBE0D6] max-w-[320px]">
                          <img
                            src={msg.image}
                            alt="Attached"
                            className="w-full h-auto object-cover max-h-[260px]"
                          />
                        </div>
                      )}

                      {/* Product Recommendation Card (For Mai Anh's second message) */}
                      {msg.type === 'product_recommendation' && msg.product && (
                        <div className="mt-3.5 bg-white rounded-xl p-3 sm:p-4 border border-[#EDE4DB] shadow-sm flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-start text-[#2C2523]">
                          {/* Product Image */}
                          <div className="relative w-full sm:w-[130px] h-[160px] sm:h-[150px] rounded-lg overflow-hidden flex-shrink-0 bg-[#FAF7F3]">
                            <img
                              src={msg.product.image}
                              alt={msg.product.name}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 left-2 bg-[#2C2523]/90 text-white text-[8px] font-bold tracking-wider px-2 py-0.5 rounded uppercase">
                              {msg.product.tag}
                            </span>
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase mb-1">
                              <span className="text-[#A87980]">
                                {msg.product.category}
                              </span>
                              <span className="text-[#9E908D]">
                                {msg.product.code}
                              </span>
                            </div>

                            <h4 className="font-playfair text-[17px] font-bold text-[#2C2523] m-0 leading-snug">
                              {msg.product.name}
                            </h4>

                            <p className="font-jakarta text-[11.5px] text-[#695D5E] leading-normal m-0 mt-1 line-clamp-2">
                              {msg.product.description}
                            </p>

                            {/* Price */}
                            <div className="mt-2.5 flex items-baseline gap-1.5">
                              <span className="font-jakarta font-bold text-[16px] text-[#7E4A52]">
                                {msg.product.price}
                              </span>
                              <span className="text-[11.5px] text-[#8C7D7E] font-normal">
                                {msg.product.priceUnit}
                              </span>
                            </div>

                            <p className="font-jakarta text-[10.5px] text-[#8C7D7E] m-0 mt-0.5">
                              {msg.product.depositInfo}
                            </p>

                            {/* Action Buttons */}
                            <div className="mt-3 flex items-center gap-2 sm:gap-2.5">
                              <button
                                type="button"
                                onClick={() => navigate(`/dresses/${msg.product.id}`)}
                                className="flex-1 sm:flex-none px-3.5 py-1.5 border border-[#DACDC3] hover:border-[#B8737D] hover:text-[#B8737D] rounded-lg text-[11px] font-bold uppercase tracking-wider text-[#2C2523] bg-white transition-all cursor-pointer"
                              >
                                XEM CHI TIẾT
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRentNow(msg.product)}
                                className="flex-1 sm:flex-none px-4 py-1.5 bg-[#7D4D54] hover:bg-[#683C43] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 border-0"
                              >
                                THUÊ NGAY
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isStaffTyping && (
                <div className="flex flex-col items-start transition-all">
                  <div className="flex items-center gap-2 text-[11.5px] text-[#7D6E6B] font-medium mb-1.5">
                    <img
                      src={activeConversation.avatar || aboutFounderImg}
                      alt="Stylist"
                      className="w-6 h-6 rounded-full object-cover border border-[#EADBD0]"
                    />
                    <span>Master Stylist Mai Anh đang soạn tin nhắn...</span>
                  </div>
                  <div className="bg-[#F7F3EE] rounded-2xl rounded-tl-xs p-3.5 shadow-2xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#B8737D] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#B8737D] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#B8737D] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Suggestion Chips (Gợi Ý Nhanh) */}
            <div className="px-4 sm:px-6 py-2.5 bg-white border-t border-[#F2E8E0] flex items-center gap-2 overflow-x-auto no-scrollbar select-none">
              <span className="font-jakarta text-[11px] font-bold text-[#8C7A7C] uppercase tracking-wider whitespace-nowrap mr-1">
                GỢI Ý NHANH:
              </span>

              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => handleQuickPromptClick(prompt)}
                  className="whitespace-nowrap px-3 py-1.5 bg-[#FAF7F4] hover:bg-[#FFF4F2] hover:border-[#B8737D] hover:text-[#B8737D] border border-[#EAE0D7] rounded-full text-[12px] font-medium text-[#4A3D3E] transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 active:scale-95"
                >
                  <span>{prompt.icon}</span>
                  <span>{prompt.label}</span>
                </button>
              ))}
            </div>

            {/* Chat Input Container */}
            <div className="p-3.5 sm:p-5 bg-white border-t border-[#F0E6DE]">
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
                <div className="flex items-center gap-2 bg-white border border-[#E2D6CB] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xs focus-within:border-[#B8737D] focus-within:ring-2 focus-within:ring-[#B8737D]/15 transition-all">
                  {/* File / Image Attachment Button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-[#8C7E7E] hover:text-[#B8737D] hover:bg-[#FAF5F2] rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                    title="Gửi hình ảnh mẫu váy"
                  >
                    <ImageIcon className="w-5 h-5 stroke-[1.8]" />
                  </button>

                  {/* Main Text Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Nhắn tin cho staff..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-transparent border-0 outline-none font-jakarta text-[13.5px] sm:text-[14px] text-[#2C2523] placeholder:text-[#A89D9B] px-1"
                  />

                  {/* Emoji Picker Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 text-[#8C7E7E] hover:text-[#B8737D] hover:bg-[#FAF5F2] rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                    title="Biểu tượng cảm xúc"
                  >
                    <Smile className="w-5 h-5 stroke-[1.8]" />
                  </button>

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() && !attachedImage}
                    className="w-9 h-9 rounded-xl bg-[#7D4D54] hover:bg-[#683C43] text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs border-0 flex-shrink-0"
                    title="Gửi tin nhắn"
                  >
                    <SendHorizontal className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>

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
                            inputRef.current?.focus();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#EDE4DB] shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#FFF2F0] border border-[#F3D5DA] flex items-center justify-center mx-auto mb-4 text-[#B8737D]">
              <Phone className="w-6 h-6 stroke-[2] animate-bounce" />
            </div>
            <h3 className="font-playfair text-[20px] font-bold text-[#2C2523] mb-1">
              Đường Dây VIP Stylist 24/7
            </h3>
            <p className="font-jakarta text-[13px] text-[#695D5E] mb-4">
              Kết nối trực tiếp với Master Stylist Mai Anh tại Atelier TP. Hồ Chí Minh
            </p>
            <div className="bg-[#FAF7F3] p-3 rounded-xl border border-[#EAE0D6] mb-5">
              <span className="text-[12px] text-[#8C7D7E] block mb-0.5">Hotline Khách Hàng VIP</span>
              <a
                href="tel:0908123888"
                className="font-jakarta font-bold text-[18px] text-[#7D4D54] tracking-wider hover:underline"
              >
                0908 123 888
              </a>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#DACDC3] text-[13px] font-semibold text-[#2C2523] hover:bg-[#FAF7F3] transition cursor-pointer bg-white"
              >
                Đóng
              </button>
              <a
                href="tel:0908123888"
                onClick={() => setShowCallModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#7D4D54] hover:bg-[#683C43] text-white text-[13px] font-semibold transition text-center no-underline shadow-xs"
              >
                Gọi Ngay
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 5. Booking Modal Integration */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />

      {/* 6. Footer Navigation */}
      <Footer />
    </div>
  );
}
