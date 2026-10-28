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

export default function ChatWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  // Lưu lịch sử tin nhắn vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

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

  const handleSendMessage = (textToSend) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: content,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Kiểm tra câu trả lời khớp hoặc mô phỏng phản hồi từ Stylist
    setIsTyping(true);
    setTimeout(() => {
      let replyText = '';
      const lower = content.toLowerCase();

      const matchedSuggestion = QUICK_SUGGESTIONS.find(
        (q) => lower.includes(q.label.toLowerCase()) || lower === q.text.toLowerCase()
      );

      if (matchedSuggestion) {
        replyText = matchedSuggestion.reply;
      } else if (lower.includes('giá') || lower.includes('thuê') || lower.includes('nhiêu')) {
        replyText =
          'Giá thuê váy cưới tại UniBridal dao động từ 3.500.000₫ đến 18.000.000₫ tuỳ bộ sưu tập. Tất cả đều bao gồm phụ kiện, lúp voan Pháp và chỉnh sửa chuẩn ni đo của nàng.';
      } else if (lower.includes('lịch') || lower.includes('thử') || lower.includes('hẹn')) {
        replyText =
          'UniBridal rất sẵn lòng đón tiếp nàng! Nàng muốn thử váy vào ngày giờ nào hay ghé showroom để được fitting suite 1-1 ạ?';
      } else if (lower.includes('địa chỉ') || lower.includes('ở đâu') || lower.includes('showroom')) {
        replyText =
          'Showroom UniBridal tọa lạc tại số 72 Tràng Tiền, Quận Hoàn Kiếm, Hà Nội. Mở cửa từ 9:00 - 21:00 hàng ngày nàng nhé!';
      } else {
        replyText =
          'Cảm ơn nàng đã gửi lời nhắn! Chuyên viên tư vấn Mai Anh đã nhận được thông tin và sẽ phản hồi chi tiết cho nàng ngay ít phút nữa nhé. 💕';
      }

      const staffMsg = {
        id: Date.now() + 1,
        sender: 'staff',
        name: 'Mai Anh • Senior Stylist',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        text: replyText,
      };

      setMessages((prev) => [...prev, staffMsg]);
      setIsTyping(false);

      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    }, 900);
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
          style={{ bottom: '88px', right: '24px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#9B5C66] via-[#B8737D] to-[#A35D67] text-white p-3.5 px-4 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={aboutFounderImg}
                  alt="Stylist Mai Anh"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white/70 shadow-sm"
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
              const isUser = msg.sender === 'user';
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
                onClick={() => handleSendMessage(item.text)}
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

      {/* 2. Nút Chat Nổi Tròn Góc Phải (Floating Launcher Button) */}
      <aside aria-label="Tư vấn trực tuyến" className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          id="floating-chat-toggle"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group relative flex items-center justify-center w-14 h-14 sm:w-[58px] sm:h-[58px] rounded-full text-white shadow-[0_8px_25px_rgba(184,115,125,0.45)] hover:shadow-[0_12px_35px_rgba(184,115,125,0.7)] hover:scale-108 active:scale-95 transition-all duration-300 border-2 border-white/70 backdrop-blur-sm cursor-pointer ${
            isOpen
              ? 'bg-[#2C2523] hover:bg-stone-800'
              : 'bg-gradient-to-tr from-[#9B5C66] via-[#B8737D] to-[#D498A0]'
          }`}
          title={isOpen ? 'Đóng hộp chat' : 'Trò chuyện trực tuyến cùng chuyên viên'}
        >
          {/* Ping animation effect khi đóng */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-[#B8737D] opacity-35 animate-ping group-hover:opacity-10 pointer-events-none" />
          )}

          {/* Icon Chuyển Đổi: Chat hoặc Đóng */}
          {isOpen ? (
            <X className="w-6 h-6 stroke-[2.2] text-white transition-transform duration-300 rotate-0 group-hover:rotate-90 relative z-10" />
          ) : (
            <MessageSquare className="w-6 h-6 stroke-[2] text-white transition-transform duration-300 group-hover:rotate-6 relative z-10" />
          )}

          {/* Online Status Dot hoặc Unread Badge */}
          {!isOpen && unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-sm z-20">
              {unreadCount}
            </span>
          ) : (
            !isOpen && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm ring-2 ring-emerald-400/30 animate-pulse z-20" />
            )
          )}

          {/* Tooltip Capsule khi Hover (chỉ khi đóng) */}
          {!isOpen && (
            <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-[#2C2523]/95 text-white text-[12px] font-medium tracking-wide rounded-full shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tư vấn trực tuyến</span>
            </div>
          )}
        </button>
      </aside>
    </>
  );
}

