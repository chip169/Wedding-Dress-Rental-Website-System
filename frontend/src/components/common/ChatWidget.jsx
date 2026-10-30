import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  SendHorizontal,
  ExternalLink,
  Sparkles,
  Calendar,
  CheckCheck,
} from 'lucide-react';
import aboutFounderImg from '../../assets/about_founder_portrait.jpg';
import chibiBrideImg from '../../assets/chibi_bride_chat.jpg';
import chibiBride3DImg from '../../assets/chibi_bride_3d.png';
import chibiBride3DWinkImg from '../../assets/chibi_bride_3d_wink.png';
import { useAuth } from '../../contexts/AuthContext';
import { getMyConversation, sendMessage, getMessages } from '../../services/chatService';

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
  {
    id: 'booking',
    label: '📅 Đặt lịch thử váy VIP',
    text: 'Mình muốn đặt lịch đến thử váy trực tiếp tại showroom vào cuối tuần.',
    reply:
      'Dạ tuyệt vời quá! UniBridal phục vụ phòng thử riêng tư Fitting Suite VIP 1-1 hoàn toàn miễn phí. Nàng có thể bấm nút "Đặt Lịch Thử Váy" trên thanh menu hoặc để lại Số Điện Thoại & Ngày mong muốn tại đây, chuyên viên sẽ liên hệ xác nhận lịch ngay ạ!',
  },
];

// Biểu tượng ngôi sao 4 cánh (FourPointStar) chuẩn theo hình ảnh người dùng
function FourPointStar({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" />
    </svg>
  );
}

export default function ChatWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showGreetingBubble, setShowGreetingBubble] = useState(true);
  const [autoShowBubble, setAutoShowBubble] = useState(true);
  const [isWinking, setIsWinking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationId, setConversationId] = useState(null);
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
            const mapped = res.data.messages.map((m) => ({
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

    // Chỉ tự động trả lời nếu người dùng bấm vào các nút Gợi ý Nhanh (FAQ)
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
    }
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
          className="fixed z-50 w-[350px] sm:w-[380px] h-[500px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.25)] border border-[#EADBDE] flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
          style={{ bottom: '100px', right: '24px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#9B5C66] via-[#B8737D] to-[#A35D67] text-white p-3.5 px-4 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={chibiBrideImg}
                  alt="Stylist Mai Anh"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/70 shadow-sm bg-[#FFF2F0]"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white ring-1 ring-emerald-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-playfair text-[15.5px] font-bold text-white tracking-wide m-0 leading-tight">
                    UniBridal Concierge
                  </h3>
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                </div>
                <div className="flex items-center gap-1.5 text-[11.5px] text-white/85 font-jakarta">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  <span>Trực tuyến • Phản hồi tức thì</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/tin-nhan');
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors border-0 bg-transparent cursor-pointer"
                title="Mở toàn màn hình"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors border-0 bg-transparent cursor-pointer"
                title="Thu nhỏ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader Banner */}
          <div className="bg-[#FFF5F6] border-b border-[#F5E6E8] px-3.5 py-1.5 flex items-center justify-between text-[11px] text-[#8C5D65] font-jakarta">
            <span>✨ Chuyên viên cao cấp Mai Anh đang hỗ trợ bạn</span>
            <Link
              to="/appointment"
              onClick={() => setIsOpen(false)}
              className="font-semibold text-[#B8737D] hover:underline flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              <span>Đặt lịch</span>
            </Link>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto bg-gradient-to-b from-[#FAF8F7] to-white text-[13px] font-jakarta">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user' || msg.senderRole === 'customer';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  {!isUser && (
                    <span className="text-[10.5px] text-[#A69B97] mb-1 pl-1">
                      {msg.name || 'Chuyên viên UniBridal'}
                    </span>
                  )}
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl shadow-xs leading-relaxed break-words ${
                      isUser
                        ? 'bg-gradient-to-r from-[#B8737D] to-[#A8646E] text-white rounded-br-xs'
                        : 'bg-white text-[#2C2523] border border-[#EADBDE] rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#B0A6A3] mt-0.5 px-1">
                    <span>{msg.time}</span>
                    {isUser && <CheckCheck className="w-3 h-3 text-[#B8737D]" />}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-stone-500 text-[12px] bg-white border border-[#EADBDE] px-3 py-2 rounded-2xl rounded-bl-xs w-fit shadow-xs">
                <span className="text-[11px] text-[#8C5D65]">Mai Anh đang nhập</span>
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
          <div className="px-3 py-2 bg-[#FAF8F7] border-t border-[#F0E6E8] overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
            {QUICK_SUGGESTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSendMessage(item.text, true)}
                className="text-[11px] font-medium text-[#7D535B] bg-white hover:bg-[#FFF2F0] hover:border-[#D498A0] border border-[#EADBDE] rounded-full px-2.5 py-1 whitespace-nowrap transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Footer Input Area */}
          <div className="p-2.5 bg-white border-t border-[#EADBDE] shrink-0">
            <div className="flex items-center gap-2 bg-[#FAF8F7] border border-[#EADBDE] focus-within:border-[#B8737D] focus-within:ring-2 focus-within:ring-[#B8737D]/20 rounded-xl px-3 py-1.5 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn tư vấn..."
                className="flex-1 bg-transparent border-0 outline-none text-[13px] text-[#2C2523] placeholder-[#A69B97]"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border-0 cursor-pointer ${
                  inputText.trim()
                    ? 'bg-[#B8737D] text-white hover:bg-[#a35d67] shadow-sm active:scale-95'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
                title="Gửi tin nhắn"
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Nút Chat Nổi 3D Chibi Bride Không Viền Tròn (Floating 3D Cutout Figure) */}
      <aside aria-label="Tư vấn trực tuyến" className="fixed bottom-3 right-3 sm:bottom-4 sm:right-5 z-50 flex items-end group/chibi">
        {/* Lời chào Speech Bubble (Hiện tự động 6s đầu hoặc khi trỏ chuột vào Hover) */}
        {!isOpen && (
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
        )}

        {/* 3D Character Figure (Không viền tròn, bồng bềnh 3D, ngôi sao 4 cánh, không chớp sáng) */}
        <div className="relative select-none animate-chibi-float">
          {/* Chỉ hiển thị ngôi sao 4 cánh theo đúng mẫu */}
          <span className="absolute -top-1 left-2 w-4 h-4 text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] pointer-events-none animate-sparkle-1 select-none">
            <FourPointStar className="w-full h-full" />
          </span>
          <span className="absolute top-2 right-2 w-4 h-4 text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] pointer-events-none animate-sparkle-2 select-none">
            <FourPointStar className="w-full h-full" />
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
            title={isOpen ? 'Đóng hộp chat' : 'Trò chuyện cùng chuyên viên tư vấn UniBridal'}
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

            {/* Badge nút tròn góc dưới (X khi mở, icon Chat khi đóng) */}
            <span
              className={`absolute bottom-0 right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md transition-all duration-300 z-20 ${
                isOpen
                  ? 'bg-[#804E55] text-white hover:bg-[#6D3940]'
                  : 'bg-[#B8737D] text-white group-hover/btn:bg-[#a35d67]'
              }`}
            >
              {isOpen ? (
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <MessageSquare className="w-3 h-3 stroke-[2.2]" />
              )}
            </span>

            {/* Online status green dot */}
            {!isOpen && (
              <span className="absolute bottom-4 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white shadow-xs animate-pulse z-20" />
            )}

            {/* Unread badge nếu có tin nhắn mới */}
            {!isOpen && unreadCount > 0 && (
              <span className="absolute top-2 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm z-30 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

