import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X,
  SendHorizontal,
  ExternalLink,
  Crown,
  Calendar,
  CheckCheck,
  ShoppingBag,
  Smile,
  Search,
  Lock,
  LogIn } from 'lucide-react';
import aboutFounderImg from '../../assets/about_founder_portrait.jpg';
import chibiBrideImg from '../../assets/chibi_bride_chat.jpg';
import chibiBride3DImg from '../../assets/chibi_bride_3d.png';
import chibiBride3DWinkImg from '../../assets/chibi_bride_3d_wink.png';
import card1Elysian from '../../assets/card1_elysian.jpg';
import { useAuth } from '../../contexts/AuthContext';
import { getMyConversation, sendMessage, getMessages } from '../../services/chatService';
import { DRESS_CATALOG } from '../../data/dressCatalog';

const STORAGE_KEY = 'unibridal_quick_chat_history';

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'staff',
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
];

export default function ChatWidget() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showGreetingBubble, setShowGreetingBubble] = useState(true);
  const [autoShowBubble, setAutoShowBubble] = useState(true);
  const [isWinking, setIsWinking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationId, setConversationId] = useState(null);

  // Yêu cầu đăng nhập trước khi khách vãng lai nhắn tin
  const requireAuth = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const popularEmojis = ['👰', '👗', '✨', '💍', '💖', '💕', '🌸', '🥰', '🪄', '👑', '🥂', '💐', '💌', '😍', '👏'];

  const filteredDresses = DRESS_CATALOG.filter((dress) => {
    if (!productSearchTerm.trim()) return true;
    const term = productSearchTerm.toLowerCase();
    return (
      dress.name?.toLowerCase().includes(term) ||
      dress.code?.toLowerCase().includes(term) ||
      dress.categoryName?.toLowerCase().includes(term)
    );
  });
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_MESSAGES;
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Lưu lịch sử tin nhắn vào localStorage và đồng bộ tức thì với trang /tin-nhan
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Lắng nghe sự kiện cập nhật từ trang phóng to /tin-nhan
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setMessages(JSON.parse(saved));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('unibridal_chat_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('unibridal_chat_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Tự động hiện lời chào 6 giây đầu khi người dùng vào trang để gây chú ý tự nhiên
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoShowBubble(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Preload cả 2 ảnh nhân vật để nháy mắt lập tức, không bị giật hay chớp sáng
  useEffect(() => {
    const img1 = new Image();
    img1.src = chibiBride3DImg;
    const img2 = new Image();
    img2.src = chibiBride3DWinkImg;
  }, []);

  // Hiệu ứng thỉnh thoảng nháy 1 mắt tinh nghịch (mỗi 3.8s - 5.5s nháy mắt trong 320ms)
  useEffect(() => {
    let timeoutId;
    let isMounted = true;

    const scheduleWink = () => {
      const delay = Math.random() * 1800 + 3800;
      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        setIsWinking(true);
        setTimeout(() => {
          if (!isMounted) return;
          setIsWinking(false);
          scheduleWink();
        }, 320);
      }, delay);
    };

    scheduleWink();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Đồng bộ cuộc hội thoại từ server khi component mount hoặc khi user thay đổi
  useEffect(() => {
    setConversationId(null);
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

  // Polling lấy tin nhắn mới mỗi 3.5 giây để đồng bộ real-time với phản hồi từ Admin/Staff
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
            if (mapped.length > prev.length && !isOpen) {
              setUnreadCount((c) => c + (mapped.length - prev.length));
            }
            return mapped;
          });
        }
      } catch {
        // bỏ qua lỗi polling
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [conversationId, isOpen, user]);

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom('instant');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom('smooth');
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend, isQuickSuggestion = false) => {
    if (!requireAuth()) return;
    const content = (textToSend || inputText).trim();
    if (!content) return;

    const userMsg = {
      id: 'local_' + Date.now(),
      sender: 'user',
      senderRole: 'customer',
      name: user?.fullName || 'Bạn',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: content,
    };

    // Tin nhắn của người dùng lập tức hiển thị bên phải (sender: 'user')
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setTimeout(() => inputRef.current?.focus(), 50);

    let currentConvId = conversationId;

    // Gửi tin nhắn lên Backend MongoDB với vai trò 'customer'
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

    // Tự động trả lời nếu người dùng bấm vào các nút Gợi ý Nhanh (FAQ) hoặc nhập tin nhắn tư vấn
    if (isQuickSuggestion) {
      const matchedSuggestion = QUICK_SUGGESTIONS.find(
        (q) => q.text.toLowerCase() === content.toLowerCase() || content.toLowerCase().includes(q.label.toLowerCase())
      );

      if (matchedSuggestion) {
        setIsTyping(true);
        setTimeout(async () => {
          const staffMsg = {
            id: 'bot_' + Date.now(),
            sender: 'staff',
            senderRole: 'staff',
            name: 'Mai Anh • Senior Stylist',
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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
      // Phản hồi tự động chuyên nghiệp cho tin nhắn do khách gõ
      setIsTyping(true);
      setTimeout(async () => {
        const staffMsg = {
          id: 'bot_' + Date.now(),
          sender: 'staff',
          senderRole: 'staff',
          name: 'Mai Anh • Senior Stylist',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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

    const userInquiryMsg = {
      id: 'local_' + Date.now(),
      sender: 'user',
      senderRole: 'customer',
      name: user?.fullName || 'Bạn',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      type: 'product_inquiry',
      text: `Mình muốn hỏi về sản phẩm: ${dress.name}`,
      product: productPayload,
    };

    setMessages((prev) => [...prev, userInquiryMsg]);
    setTimeout(() => {
      scrollToBottom('smooth');
      inputRef.current?.focus();
    }, 60);

    if (conversationId) {
      sendMessage({
        conversationId,
        text: `Mình muốn hỏi về sản phẩm: ${dress.name}`,
        senderRole: 'customer',
      }).catch(() => {});
    }

    setIsTyping(true);
    setTimeout(async () => {
      const staffReply = {
        id: 'bot_' + Date.now(),
        sender: 'staff',
        senderRole: 'staff',
        name: 'Mai Anh • Senior Stylist',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* 1. Hộp Chat Mini (Small Chat Box Widget) */}
      {isOpen && (
        <aside
          aria-label="Cửa sổ tư vấn trực tuyến"
          className="fixed z-50 w-[285px] sm:w-[300px] h-[385px] sm:h-[395px] max-h-[calc(100vh-50px)] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.22)] border border-[#EADBDE] flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
          style={{ bottom: '20px', right: '20px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#9B5C66] via-[#B8737D] to-[#A35D67] text-white py-2 px-3 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={chibiBrideImg}
                  alt="Stylist Mai Anh"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white/70 shadow-sm bg-[#FFF2F0]"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-white ring-1 ring-emerald-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="font-playfair text-[13px] sm:text-[13.5px] font-bold text-white tracking-wide m-0 leading-tight">
                    UniBridal Concierge
                  </h3>
                  <Crown className="w-3 h-3 text-amber-200" />
                </div>
                <div className="flex items-center gap-1 text-[9.5px] sm:text-[10px] text-white/85 font-jakarta">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  <span>Trực tuyến • Phản hồi tức thì</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/tin-nhan');
                }}
                className="w-6 h-6 rounded-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors border-0 bg-transparent cursor-pointer"
                title="Mở toàn màn hình"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors border-0 bg-transparent cursor-pointer"
                title="Thu nhỏ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subheader Banner */}
          <div className="bg-[#FFF5F6] border-b border-[#F5E6E8] px-3 py-1 flex items-center justify-between text-[10.5px] text-[#8C5D65] font-jakarta">
            <span>✨ Chuyên viên Mai Anh hỗ trợ</span>
            <Link
              to="/appointment"
              onClick={() => setIsOpen(false)}
              className="font-semibold text-[#B8737D] hover:underline flex items-center gap-0.5"
            >
              <Calendar className="w-2.5 h-2.5" />
              <span>Đặt lịch</span>
            </Link>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3 space-y-2.5 overflow-y-auto bg-gradient-to-b from-[#FAF8F7] to-white text-[12px] font-jakarta">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user' || msg.senderRole === 'customer';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {!isUser && (
                    <span className="text-[10px] text-[#A69B97] mb-0.5 pl-1">
                      {msg.name || 'Chuyên viên UniBridal'}
                    </span>
                  )}
                  <div
                    className={`max-w-[84%] px-3 py-2 rounded-2xl shadow-xs leading-relaxed break-words ${
                      msg.isRecalled
                        ? 'bg-[#F5F2F0] text-[#9A8B8C] border border-dashed border-[#E3DBD7] italic'
                        : isUser
                        ? 'bg-gradient-to-r from-[#B8737D] to-[#A8646E] text-white rounded-br-xs'
                        : 'bg-white text-[#2C2523] border border-[#EADBDE] rounded-bl-xs'
                    }`}
                  >
                    {msg.text}

                    {/* Product Inquiry Card */}
                    {msg.product && (
                      <div className="mt-2 bg-white rounded-xl p-2.5 border border-[#E5E7EB] shadow-xs flex gap-2.5 items-start text-[#2C2523] text-left">
                        <img
                          src={msg.product.image || card1Elysian}
                          alt={msg.product.name}
                          className="w-14 h-14 rounded-lg object-cover bg-[#FAF7F3] border border-[#F0E6DE] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-jakarta font-bold text-[12px] text-[#111827] leading-snug truncate">
                            {msg.product.name}
                          </div>
                          <div className="mt-0.5 text-[11.5px] font-bold text-emerald-600 font-jakarta">
                            {typeof msg.product.price === 'number'
                              ? `${msg.product.price.toLocaleString('vi-VN')}₫`
                              : (msg.product.price ? `${msg.product.price}` : '5.200.000₫')}
                          </div>
                          <Link
                            to={`/dresses/${msg.product.id || 1}`}
                            onClick={() => setIsOpen(false)}
                            className="mt-1.5 inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-[#1F2937] hover:text-[#B8737D] underline transition-colors"
                          >
                            <span>Xem chi tiết sản phẩm</span>
                            <span className="text-[11px] leading-none">↗</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[9.5px] text-[#B0A6A3] mt-0.5 px-1">
                    <span>{msg.time}</span>
                    {isUser && <CheckCheck className="w-2.5 h-2.5 text-[#B8737D]" />}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 text-stone-500 text-[11px] bg-white border border-[#EADBDE] px-2.5 py-1.5 rounded-2xl rounded-bl-xs w-fit shadow-xs">
                <span className="text-[10.5px] text-[#8C5D65]">Mai Anh đang nhập</span>
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8737D] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8737D] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8737D] animate-bounce" />
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div
            className="px-2.5 py-1.5 bg-[#FAF8F7] border-t border-[#F0E6E8] overflow-x-auto flex gap-1.5 no-scrollbar shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {QUICK_SUGGESTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!requireAuth()) return;
                  handleSendMessage(item.text, true);
                }}
                className="text-[10.5px] font-medium text-[#7D535B] bg-white hover:bg-[#FFF2F0] hover:border-[#D498A0] border border-[#EADBDE] rounded-full px-2 py-0.5 whitespace-nowrap transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Footer Input Area */}
          <div className="p-2 bg-white border-t border-[#EADBDE] shrink-0 relative">
            <div
              onClick={() => {
                if (!isLoggedIn) {
                  setShowLoginPrompt(true);
                } else {
                  inputRef.current?.focus();
                }
              }}
              className="flex items-center gap-1 bg-[#FAF8F7] border border-[#EADBDE] focus-within:border-[#B8737D] focus-within:ring-2 focus-within:ring-[#B8737D]/20 rounded-xl px-2 py-1 transition-all cursor-text"
            >
              <input
                ref={inputRef}
                type="text"
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
                  handleKeyDown(e);
                }}
                placeholder={isLoggedIn ? "Nhập tin nhắn tư vấn..." : "Vui lòng đăng nhập để gửi tin nhắn..."}
                className="flex-1 bg-transparent border-0 outline-none text-[12px] text-[#2C2523] placeholder-[#A69B97] min-w-0"
              />

              {/* Emoji Picker Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!requireAuth()) return;
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className={`p-1 rounded-md transition-colors border-0 bg-transparent cursor-pointer shrink-0 ${
                  showEmojiPicker
                    ? 'text-[#B8737D] bg-[#FFF2F0]'
                    : 'text-[#8C7E7E] hover:text-[#B8737D] hover:bg-[#FFF2F0]'
                }`}
                title="Biểu tượng cảm xúc"
              >
                <Smile className="w-4 h-4 stroke-[1.8]" />
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!requireAuth()) return;
                  handleSendMessage();
                }}
                disabled={!inputText.trim()}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border-0 cursor-pointer shrink-0 ${
                  inputText.trim()
                    ? 'bg-[#B8737D] text-white hover:bg-[#a35d67] shadow-sm active:scale-95'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
                title="Gửi tin nhắn"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Emoji Picker Popover (Mini) */}
            {showEmojiPicker && (
              <div className="absolute right-2 bottom-full mb-2 bg-white rounded-2xl shadow-[0_12px_36px_rgba(44,37,35,0.2)] border border-[#EFE5DB] p-2.5 z-30 w-56">
                <div className="text-[10px] font-bold text-[#8C7A7C] uppercase tracking-wider mb-1.5">
                  Biểu tượng cảm xúc
                </div>
                <div className="grid grid-cols-5 gap-1 text-[17px]">
                  {popularEmojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                        inputRef.current?.focus();
                      }}
                      className="hover:bg-[#FAF6F2] rounded-md p-1 transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal / Dialog Yêu cầu Đăng nhập dành cho Khách vãng lai */}
          {showLoginPrompt && (
            <div
              onClick={() => {
                setShowLoginPrompt(false);
                setIsOpen(false);
              }}
              className="absolute inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-3 animate-in fade-in duration-200"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-4 w-full max-w-[265px] shadow-2xl border border-[#F2D6D8] text-center relative animate-in zoom-in-95 duration-200"
              >
                {/* Nút đóng - Trả về lại nhân vật chibi nổi */}
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginPrompt(false);
                    setIsOpen(false);
                  }}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 border-0 bg-transparent cursor-pointer transition-colors"
                  title="Đóng và thu nhỏ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Biểu tượng ổ khóa */}
                <div className="w-11 h-11 rounded-full bg-[#FFF2F0] border border-[#F7D4D7] flex items-center justify-center mx-auto mb-2 text-[#B8737D] shadow-xs">
                  <Lock className="w-5 h-5 stroke-[2]" />
                </div>

                <h4 className="font-playfair text-[14px] font-bold text-[#2C2523] mb-1 leading-snug">
                  Đăng Nhập Để Trò Chuyện
                </h4>
                <p className="text-[11px] text-[#6E6260] font-jakarta leading-relaxed mb-3">
                  Nàng vui lòng đăng nhập để bắt đầu nhắn tin và nhận tư vấn riêng tư 1-1 từ Stylist UniBridal nhé! ✨
                </p>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginPrompt(false);
                      setIsOpen(false);
                      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#9B5C66] via-[#B8737D] to-[#A35D67] hover:opacity-95 text-white font-jakarta font-semibold text-[11.5px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer border-0"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Đăng Nhập Ngay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginPrompt(false);
                      setIsOpen(false);
                      navigate('/register');
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-[#FAF8F7] hover:bg-[#FFF2F0] text-[#7D535B] hover:text-[#B8737D] border border-[#EADBDE] hover:border-[#D498A0] font-jakarta font-medium text-[11px] active:scale-95 transition-all cursor-pointer"
                  >
                    Tạo Tài Khoản Mới
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginPrompt(false);
                      setIsOpen(false);
                    }}
                    className="text-[10.5px] text-[#A69B97] hover:text-[#5C504E] font-jakarta transition-colors cursor-pointer border-0 bg-transparent pt-0.5 block mx-auto"
                  >
                    Để sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* 2. Nút Chat Nổi 3D Chibi Bride Không Viền Tròn (Floating 3D Cutout Figure) - Ẩn khi hộp chat đang mở để không che ô nhập tin nhắn */}
      {!isOpen && (
        <aside aria-label="Tư vấn trực tuyến" className="fixed bottom-3 right-3 sm:bottom-4 sm:right-5 z-50 flex items-end group/chibi">
          {/* Lời chào Speech Bubble (Hiện tự động 6s đầu hoặc khi trỏ chuột vào Hover) */}
          <div
            onClick={() => setIsOpen(true)}
            className={`relative -mr-2 sm:-mr-2.5 mb-10 sm:mb-12 cursor-pointer select-none transition-all duration-300 z-10 ${
              autoShowBubble
                ? 'opacity-100 translate-x-0 pointer-events-auto'
                : 'opacity-0 translate-x-2 pointer-events-none group-hover/chibi:opacity-100 group-hover/chibi:translate-x-0 group-hover/chibi:pointer-events-auto'
            }`}
          >
            <div className="relative bg-white/95 backdrop-blur-md border border-[#D498A0] rounded-[14px] rounded-br-[3px] px-2.5 py-1.5 shadow-[0_4px_18px_rgba(218,142,150,0.32)] text-center hover:scale-105 transition-transform duration-300">
              {/* Mũi nhọn speech bubble trỏ sang nhân vật */}
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-t border-r border-[#D498A0] transform rotate-45" />

              <p className="font-jakarta text-[11.5px] font-medium text-[#4A3E3F] leading-[15.5px] m-0">
                Bạn cần tư vấn<br />về váy cưới nào ạ?
              </p>
            </div>
          </div>

          {/* 3D Character Figure (Không viền tròn, bồng bềnh 3D, ngôi sao 4 cánh, không chớp sáng) */}
          <div className="relative select-none animate-chibi-float">
            {/* Chỉ hiển thị ngôi sao 4 cánh theo đúng mẫu */}
            <span className="absolute -top-1 left-2 w-4 h-4 text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] pointer-events-none animate-sparkle-1 select-none">
              <Crown className="w-full h-full" />
            </span>
            <span className="absolute top-2 right-2 w-4 h-4 text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] pointer-events-none animate-sparkle-2 select-none">
              <Crown className="w-full h-full" />
            </span>

            <button
              type="button"
              id="floating-chat-toggle"
              onClick={() => setIsOpen((prev) => !prev)}
              onMouseDown={(e) => e.preventDefault()}
              className="relative p-0 border-0 bg-transparent cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group/btn outline-none focus:outline-none focus-visible:outline-none active:outline-none ring-0 focus:ring-0 focus-visible:ring-0 select-none"
              style={{
                outline: 'none',
                boxShadow: 'none',
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                userSelect: 'none',
              }}
              title="Trò chuyện cùng chuyên viên tư vấn UniBridal"
            >
              {/* Ảnh nhân vật 3D (Đổi ảnh trực tiếp 1 thẻ img, hoàn toàn không bị chớp sáng) */}
              <img
                src={isWinking ? chibiBride3DWinkImg : chibiBride3DImg}
                alt="UniBridal 3D Chibi Bride"
                draggable={false}
                className="w-[90px] h-auto sm:w-[106px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.14)] select-none pointer-events-none"
                style={{
                  outline: 'none',
                  userSelect: 'none',
                  WebkitUserDrag: 'none',
                }}
              />
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

