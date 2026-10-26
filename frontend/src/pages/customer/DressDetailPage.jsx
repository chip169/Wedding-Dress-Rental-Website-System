import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, Star, ShieldCheck, Sparkles, Scissors,
  Ruler, Calendar, Clock, Phone, MessageCircle,
  ChevronRight, ChevronLeft, Check, CheckCircle2, Info, ArrowRight, Share2,
  Sparkle, X, ShoppingBag, Headphones
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import BookingModal from '../../components/common/BookingModal';
import { getDressById, getRelatedDresses, formatCurrencyVND } from '../../services/dressService';
import { addToCart } from '../../services/cartService';
import { isWishlisted as checkWishlisted, toggleWishlist, WISHLIST_EVENT } from '../../services/wishlistService';

// Import local photos for feedbacks
import card1 from '../../assets/card1_elysian.jpg';
import card2 from '../../assets/card2_celeste.jpg';
import card3 from '../../assets/card3_lumiere.jpg';
import card4 from '../../assets/card4_monet.jpg';
import card5 from '../../assets/card5_aurora.jpg';
import card6Seraphina from '../../assets/card6_seraphina.jpg';
import card6Tiered from '../../assets/card6_tiered_princess.jpg';
import card7 from '../../assets/card7_vivienne.jpg';
import card8Juliette from '../../assets/card8_juliette.jpg';
import card8Lace from '../../assets/card8_lace_dream.jpg';
import card9Genevieve from '../../assets/card9_genevieve.jpg';
import card9Mannequin from '../../assets/card9_mannequin_atelier.jpg';
import heroBride from '../../assets/hero_bride.jpg';
import laceDetail from '../../assets/lace_detail.jpg';

// 48 distinct high-resolution bridal photos (14 local assets + 34 distinct Unsplash photos)
const DISTINCT_FEEDBACK_IMAGES = [
  card8Lace,
  heroBride,
  card7,
  card1,
  card2,
  card3,
  card4,
  card5,
  card6Seraphina,
  card6Tiered,
  card8Juliette,
  card9Genevieve,
  card9Mannequin,
  laceDetail,
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519225429980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546804784-896d0dca3805?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1525772764-672584d43615?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1545232979-fbf68fe9b1af?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502637098811-fa9526d2b659?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524863479829-916d8e77f114?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1549416878-b9ca35c2d47b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1550005809-91ad75fb315f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
];

// Helper tạo danh sách trang có dấu ... (ví dụ: 1, 2, ..., trang cuối)
const getPaginationItems = (current, total) => {
  if (total <= 4) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current === 1) {
    return [1, 2, '...', total];
  }
  if (current === 2) {
    return [1, 2, 3, '...', total];
  }
  if (current === 3) {
    return [1, 2, 3, 4, '...', total];
  }
  if (current === total) {
    return [1, '...', total - 1, total];
  }
  if (current === total - 1) {
    return [1, '...', total - 2, total - 1, total];
  }
  if (current === total - 2) {
    return [1, '...', total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
};

export default function DressDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dress, setDress] = useState(null);
  const [relatedDresses, setRelatedDresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // User interactive selections
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState('S');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [rentNotification, setRentNotification] = useState('');

  // Feedback pagination state
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const feedbacksPerPage = 6;

  // Rental date calculations
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 9);
    return d.toISOString().split('T')[0];
  });

  // Load dress data whenever URL parameter `id` changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const targetId = id || '1';
      const result = await getDressById(targetId);
      const related = await getRelatedDresses(result.data ? result.data.id : targetId);

      if (isMounted) {
        if (result.success && result.data) {
          setDress(result.data);
          setSelectedImageIndex(0);
          setSelectedColor(result.data.colors?.[0] || null);
          setSelectedSize(result.data.sizes?.[1]?.id || 'S');
          setIsWishlisted(checkWishlisted(result.data.id));
        }
        if (related.success) {
          setRelatedDresses(related.data);
        }
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Lắng nghe sự kiện đồng bộ Wishlist
  useEffect(() => {
    const syncWishlist = () => {
      if (dress?.id) {
        setIsWishlisted(checkWishlisted(dress.id));
      }
    };
    window.addEventListener(WISHLIST_EVENT, syncWishlist);
    window.addEventListener('storage', syncWishlist);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, syncWishlist);
      window.removeEventListener('storage', syncWishlist);
    };
  }, [dress?.id]);

  // Calculate rental duration in days
  const rentalDays = useMemo(() => {
    if (!startDate || !endDate) return 4;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [startDate, endDate]);

  // Calculate total price based on rental days and base price
  const pricing = useMemo(() => {
    if (!dress) return { base: 0, deposit: 0, total: 0 };
    const basePrice = dress.price || 5200000;
    const deposit = dress.depositAmount || 15000000;

    // Package 4 days = 100% base price. Additional days = 20% of base price per day
    let rentalFee = basePrice;
    if (rentalDays > 4) {
      rentalFee = basePrice + (rentalDays - 4) * (basePrice * 0.2);
    }

    return {
      base: rentalFee,
      deposit: deposit,
      total: rentalFee + deposit,
    };
  }, [dress, rentalDays]);

  // Chuẩn bị danh sách 48 phản hồi thực tế của các nàng dâu
  const allFeedbacks = useMemo(() => {
    if (!dress?.realBrides || dress.realBrides.length === 0) return [];

    const sampleReviews = [
      { quote: "Váy đẹp xuất sắc! Cả hội trường cưới ai cũng khen lộng lẫy. Form siết eo tôn dáng cực kỳ mà mặc rất thoải mái suốt cả ngày dài.", name: "Cô dâu Hà My & Lê Anh", date: "15/10/2026" },
      { quote: "Đuôi váy dài thướt tha khi bước vào lễ đường tạo cảm giác như một nàng công chúa đích thực. Cảm ơn UniBridal rất nhiều!", name: "Cô dâu Thục Quyên", date: "02/10/2026" },
      { quote: "Mặc vào cảm thấy mình như một nữ hoàng trong buổi tiệc tối! Từng đường đính kết bắt sáng lung linh dưới ánh đèn sân khấu. Đáng giá từng đồng!", name: "Cô dâu Lan Chi", date: "28/09/2026" },
      { quote: "Thiết kế corsetry siết eo kỳ diệu, giấu khuyết điểm bụng cực đỉnh. Mình chụp phóng sự cưới góc nào cũng thấy eo thon gọn.", name: "Cô dâu Bích Phương", date: "20/09/2026" },
      { quote: "Chất ren Chantilly cao cấp sờ mướt tay, váy nhẹ và bồng bềnh tự nhiên chứ không hề bị nặng hay ngứa như các nơi khác.", name: "Cô dâu Minh Thư", date: "14/09/2026" },
      { quote: "Dịch vụ thử váy VIP Suite riêng tư và chu đáo. Chuyên viên chỉnh sửa số đo vừa khít từng centimet trước ngày trao váy.", name: "Cô dâu Hoàng Yến", date: "05/09/2026" },
      { quote: "Chú rể nhìn thấy mình trong lễ đường xúc động đến rơi nước mắt. Cảm ơn chiếc váy cưới trong mơ từ UniBridal!", name: "Cô dâu Khánh Linh", date: "29/08/2026" },
      { quote: "Gói phụ kiện đi kèm voan cưới dài quét sàn và găng tay ren đồng bộ lên hình sang trọng chuẩn phong cách Hoàng Gia.", name: "Cô dâu Thảo My", date: "22/08/2026" },
      { quote: "Váy được giặt hấp sinh học thơm tho, phẳng phiu đóng vali cẩn thận. Trải nghiệm thuê đồ 10/10 không có điểm gì chê.", name: "Cô dâu Tú Uyên", date: "15/08/2026" },
      { quote: "Hạt pha lê Swarovski bắt sáng tuyệt đẹp khi khiêu vũ first dance. Quan khách hai họ ai cũng trầm trồ khen ngợi.", name: "Cô dâu Phương Thảo", date: "08/08/2026" },
      { quote: "Chính sách bảo lãnh cọc hoàn trả tức thì sau khi trả váy khiến mình và gia đình vô cùng an tâm tin tưởng.", name: "Cô dâu Ánh Dương", date: "30/07/2026" },
      { quote: "Form váy ôm trọn vòng 1 và tôn lưng trần kiêu sa. Đến tận bây giờ xem lại album cưới vẫn thấy mê mẩn thiết kế này.", name: "Cô dâu Kiều Oanh", date: "22/07/2026" },
    ];

    const fullList = [];
    for (let i = 0; i < 48; i++) {
      const template = sampleReviews[i % sampleReviews.length];
      // Mỗi feedback sử dụng một ảnh riêng biệt không trùng lặp
      const brideImg = DISTINCT_FEEDBACK_IMAGES[i] || dress.realBrides[i % dress.realBrides.length]?.image;
      fullList.push({
        id: i + 1,
        brideName: i < 12 ? template.name : `${template.name.split(' ')[0]} ${template.name.split(' ')[1]} & Chú rể #${i + 1}`,
        date: template.date,
        image: brideImg,
        quote: template.quote,
        rating: 5.0,
      });
    }
    return fullList;
  }, [dress]);

  const totalFeedbackPages = Math.ceil(allFeedbacks.length / feedbacksPerPage);

  const displayedFeedbacks = useMemo(() => {
    if (!showAllFeedbacks) {
      return allFeedbacks.slice(0, 3);
    }
    const startIndex = (feedbackPage - 1) * feedbacksPerPage;
    return allFeedbacks.slice(startIndex, startIndex + feedbacksPerPage);
  }, [allFeedbacks, showAllFeedbacks, feedbackPage, feedbacksPerPage]);

  const handleDirectRent = () => {
    addToCart({
      ...dress,
      size: selectedSize,
      rentalDays: rentalDays,
      startDate: startDate,
      endDate: endDate,
    });
    navigate(`/checkout?dressId=${dress.id}&size=${selectedSize}&startDate=${startDate}&endDate=${endDate}&days=${rentalDays}`);
  };

  const handleOnlineRent = () => {
    const added = addToCart(dress);
    setRentNotification(
      added
        ? `Đã thêm "${dress?.name}" vào giỏ thuê thành công! (Gói ${rentalDays} ngày từ ${startDate} đến ${endDate})`
        : `"${dress?.name}" đã có trong giỏ thuê váy.`
    );
    setTimeout(() => {
      setRentNotification('');
    }, 4500);
  };

  const handleConsultStylist = () => {
    if (!dress) return;

    const consultData = {
      id: dress.id,
      code: dress.code || `MÃ: #UB-${dress.id}`,
      name: dress.name,
      category: dress.silhouette || dress.category || 'HAUTE COUTURE',
      tag: 'ĐANG TƯ VẤN',
      price: typeof dress.rentalPrice === 'number'
        ? `${dress.rentalPrice.toLocaleString('vi-VN')}₫`
        : (dress.price || '5.200.000₫'),
      priceUnit: '/ 1 ngày',
      depositInfo: dress.depositPrice
        ? `Tiền cọc bảo lãnh: ${typeof dress.depositPrice === 'number' ? dress.depositPrice.toLocaleString('vi-VN') : dress.depositPrice}₫`
        : 'Tiền cọc bảo lãnh: 15.000.000₫',
      image: (dress.images && dress.images[selectedImageIndex || 0]) || dress.image || (dress.images && dress.images[0]) || '',
      description: dress.description || 'Thiết kế thủ công tinh xảo chuẩn Haute Couture UniBridal',
    };

    navigate('/tin-nhan', {
      state: { consultDress: consultData },
    });
  };

  const handleToggleWishlist = () => {
    if (!dress?.id) return;
    const result = toggleWishlist(dress.id);
    setIsWishlisted(result.isAdded);
    setRentNotification(
      result.isAdded
        ? `Đã lưu "${dress?.name}" vào tủ đồ trong mơ ♥`
        : `Đã xóa "${dress?.name}" khỏi tủ đồ trong mơ`
    );
    setTimeout(() => {
      setRentNotification('');
    }, 3800);
  };

  if (loading || !dress) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center font-jakarta">
        <div className="w-12 h-12 border-3 border-[#B8737D] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#5A4B4B] text-[15px] tracking-wide">Đang tải tuyệt tác váy cưới...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#2C2523] flex flex-col font-jakarta selection:bg-[#FCEEE9] selection:text-[#B8737D]">
      {/* 1. Header */}
      <Header onOpenBooking={() => setIsBookingOpen(true)} />

      {/* Toast Notification */}
      {rentNotification && (
        <div className="fixed top-20 right-6 z-50 bg-[#2C2523] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-[#B8737D]/30 animate-fade-in max-w-[420px]">
          <ShoppingBag className="w-5 h-5 text-[#E8B6BC] shrink-0" />
          <p className="text-[13px] leading-snug m-0 font-medium">{rentNotification}</p>
          <button
            type="button"
            onClick={() => setRentNotification('')}
            className="text-white/60 hover:text-white p-1 ml-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Breadcrumb Navigation */}
      <div className="w-full bg-[#FAF7F5] border-b border-[#EFE5E2]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-[12.5px] text-[#7A6B6A] flex-wrap">
            <Link to="/" className="hover:text-[#B26B74] transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#C4B6B4]" />
            <Link to="/" className="hover:text-[#B26B74] transition-colors">
              Váy Cưới
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#C4B6B4]" />
            <span className="text-[#7A6B6A] font-normal">{dress.silhouetteCategory}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#C4B6B4]" />
            <span className="text-[#231A19] font-medium truncate max-w-[240px] sm:max-w-none">
              {dress.name}
            </span>
          </nav>
        </div>
      </div>

      {/* 3. Main Product Details View */}
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-5 sm:px-8 pt-8 sm:pt-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ================= LEFT COLUMN: IMAGES & HIGHLIGHTS (Col 7) ================= */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Main Stage Image */}
            <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] max-h-[740px] rounded-[24px] overflow-hidden bg-[#F6ECE8] shadow-[0_8px_30px_rgba(44,37,35,0.06)] border border-[#EAE0DC] group">
              <img
                src={dress.images[selectedImageIndex] || dress.images[0]}
                alt={dress.imageAlts?.[selectedImageIndex] || dress.name}
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>

            {/* Thumbnail Gallery (4 thumbnails) */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {dress.images.map((imgSrc, idx) => {
                const isActive = selectedImageIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-square rounded-[14px] overflow-hidden border-2 transition-all cursor-pointer p-0 bg-[#F6ECE8] group/thumb ${isActive
                      ? 'border-[#B26B74] ring-2 ring-[#B26B74]/20 shadow-md scale-[1.02]'
                      : 'border-[#EAE0DC] hover:border-[#CFA5AC] opacity-80 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={imgSrc}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover object-top group-hover/thumb:scale-110 transition-transform duration-300"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-[#B26B74]/10 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 3 Key Highlight Badges (Below Thumbnails) */}
            <div className="mt-2 bg-white border border-[#EAE0DC] rounded-[20px] p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE0DC] gap-4 sm:gap-2">
              {dress.highlights?.map((hl, idx) => (
                <div key={idx} className="flex items-start gap-3 px-2 pt-2 sm:pt-0">
                  <div className="w-9 h-9 rounded-full bg-[#FFF5F3] border border-[#F4DDD8] flex items-center justify-center text-[#B26B74] shrink-0">
                    {hl.icon === 'diamond' && <Sparkles className="w-4 h-4" />}
                    {hl.icon === 'ruler' && <Ruler className="w-4 h-4" />}
                    {hl.icon === 'sparkles' && <Sparkle className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="block font-jakarta text-[11px] font-medium uppercase tracking-wider text-[#8A7978]">
                      {hl.label}
                    </span>
                    <strong className="block font-jakarta text-[13.5px] font-semibold text-[#231A19] leading-snug mt-0.5">
                      {hl.value}
                    </strong>
                    <span className="block font-jakarta text-[11.5px] text-[#A08E8D] mt-0.5">
                      {hl.sub}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: PRODUCT DETAILS & BOOKING (Col 5) ================= */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Header info */}
            <div>
              <span className="font-jakarta font-bold text-[11.5px] tracking-[2.5px] uppercase text-[#B8737D] block mb-1.5">
                {dress.collectionTag || 'THE HAUTE COUTURE BRIDAL 2026'}
              </span>
              <h1 className="font-playfair text-[32px] sm:text-[38px] leading-[1.2] font-semibold text-[#231A19] m-0 mb-3">
                {dress.name}
              </h1>

              {/* Rating and SKU row */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EAE0DC] text-[13px]">
                <div className="flex items-center gap-1.5 text-[#B26B74]">
                  <div className="flex text-[#B26B74]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="font-bold ml-1 text-[#231A19]">{dress.rating}</span>
                  <span className="text-[#8A7978]">({dress.rentCount})</span>
                </div>
                <div className="text-[#8A7978] tracking-wider text-[12px] font-medium">
                  MÃ SẢN PHẨM: <span className="text-[#231A19] font-bold">{dress.code}</span>
                </div>
              </div>
            </div>

            {/* Color selection */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[13.5px] font-medium text-[#231A19]">
                  Màu sắc: <strong className="text-[#B26B74] font-semibold">{selectedColor?.name || 'Mặc định'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                {dress.colors?.map((col, idx) => {
                  const isColorActive = selectedColor?.name === col.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      title={col.name}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${isColorActive
                        ? 'border-[#B26B74] bg-[#FFF5F3] shadow-xs'
                        : 'border-[#EAE0DC] bg-white hover:border-[#C4A5AA]'
                        }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-xs"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className={`text-[12.5px] font-medium ${isColorActive ? 'text-[#B26B74]' : 'text-[#5A4848]'}`}>
                        {col.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size selection */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[13.5px] font-medium text-[#231A19]">
                  Kích thước có sẵn
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-[12.5px] text-[#B26B74] hover:underline font-medium flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Hướng dẫn chọn size
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {dress.sizes?.map((sz) => {
                  const isSizeActive = selectedSize === sz.id;
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setSelectedSize(sz.id)}
                      className={`py-2.5 px-3 rounded-[12px] border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${isSizeActive
                        ? 'border-[#B26B74] bg-[#B26B74] text-white shadow-xs'
                        : 'border-[#EAE0DC] bg-white text-[#231A19] hover:border-[#B26B74]'
                        }`}
                    >
                      <span className="font-semibold text-[13.5px] leading-tight">{sz.label}</span>
                      <span
                        className={`text-[10.5px] leading-tight mt-0.5 ${isSizeActive ? 'text-white/80' : 'text-[#8A7978]'
                          }`}
                      >
                        {sz.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rental Period & Cost Breakdown Box */}
            <div className="border border-[#F2DDD9] bg-[#FFF8F6] rounded-[20px] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#F0D5D0]">
                <h3 className="font-playfair text-[18px] font-semibold text-[#231A19] m-0">
                  Chọn ngày thuê & trả váy
                </h3>
                <span className="text-[12px] font-semibold text-[#B26B74] bg-[#FCEEE9] px-2.5 py-1 rounded-full">
                  Gói {rentalDays} ngày
                </span>
              </div>

              {/* Date pickers row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                <div className="bg-white border border-[#EAE0DC] rounded-[12px] p-3">
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#8A7978] mb-1">
                    NGÀY BẮT ĐẦU THUÊ
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-[13.5px] font-medium text-[#231A19] border-0 outline-none p-0 bg-transparent cursor-pointer"
                  />
                </div>

                <div className="bg-white border border-[#EAE0DC] rounded-[12px] p-3">
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#8A7978] mb-1">
                    NGÀY TRẢ DỰ KIẾN
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-[13.5px] font-medium text-[#231A19] border-0 outline-none p-0 bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              {/* Price Breakdown items */}
              <div className="flex flex-col gap-2.5 text-[12.5px] pt-1 pb-3">
                <div className="flex items-center justify-between text-[#5A4848]">
                  <span>Giá thuê cơ bản (gói {rentalDays} ngày):</span>
                  <strong className="text-[#231A19] font-semibold">{formatCurrencyVND(pricing.base)}</strong>
                </div>

                <div className="flex items-center justify-between text-[#5A4848]">
                  <span>Tiền cọc bảo lãnh hoàn lại:</span>
                  <strong className="text-[#231A19] font-semibold">{formatCurrencyVND(pricing.deposit)}</strong>
                </div>

                <div className="flex items-center justify-between text-[#5A4848]">
                  <span>Phụ kiện tặng kèm (Voan, găng tay, tùng):</span>
                  <span className="text-[#B26B74] font-semibold bg-[#FDF2F0] px-2 py-0.5 rounded text-[11px]">
                    ĐÃ BAO GỒM
                  </span>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="pt-3.5 border-t border-dashed border-[#E8CECB]">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-jakarta font-bold text-[13px] uppercase tracking-wide text-[#231A19]">
                    TỔNG THANH TOÁN TẠM TÍNH
                  </span>
                  <span className="font-playfair font-bold text-[28px] text-[#B26B74]">
                    {formatCurrencyVND(pricing.total)}
                  </span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-[#7A6B6A] m-0">
                  (Đã bao gồm tiền cọc bảo lãnh {formatCurrencyVND(pricing.deposit)} sẽ hoàn trả 100% khi nhận lại váy nguyên vẹn)
                </p>
              </div>
            </div>

            {/* Action Buttons - Khớp 100% với Hình 2 */}
            <div className="flex flex-col gap-2.5">
              {/* Row 1: ĐẶT THUÊ NGAY & Wishlist */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDirectRent}
                  className="flex-1 h-[48px] px-5 rounded-[4px] bg-[#70484E] hover:bg-[#5E3B40] text-white font-jakarta text-[13.5px] font-medium tracking-[1.2px] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer border-0 active:scale-[0.99]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a2 2 0 0 0-2 2c0 .7.4 1.3 1 1.7L8 10h8l-3-3.3c.6-.4 1-1 1-1.7a2 2 0 0 0-2-2Z" />
                    <path d="M8 10 5 21h14l-3-11" />
                    <path d="M9 14h6" />
                  </svg>
                  ĐẶT THUÊ NGAY (KÝ HỢP ĐỒNG & CỌC)
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`w-[48px] h-[48px] rounded-[4px] border flex items-center justify-center transition-colors cursor-pointer ${isWishlisted
                    ? 'bg-[#FFF2F0] border-[#70484E] text-[#70484E]'
                    : 'bg-white border-[#D6C7C3] text-[#70484E] hover:border-[#70484E]'
                    }`}
                  title={isWishlisted ? 'Đã yêu thích' : 'Lưu vào danh sách yêu thích'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} strokeWidth={1.75} />
                </button>
              </div>

              {/* Row 2: ĐIỀN PHIẾU THUÊ & THỬ VÁY (GUEST) */}
              <button
                type="button"
                onClick={() => navigate(`/thue-nhanh?dressId=${dress.id}`)}
                className="w-full h-[48px] px-5 rounded-[4px] bg-[#FAF4EE] hover:bg-[#F2E8DF] border border-[#E0D0C4] text-[#70484E] font-jakarta text-[13px] font-semibold tracking-[0.8px] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Calendar className="w-4 h-4 text-[#70484E]" />
                ĐIỀN PHIẾU THUÊ & THỬ VÁY (DÀNH CHO GUEST)
              </button>

              {/* Row 3: ĐẶT LỊCH THỬ VÁY TẠI SHOWROOM */}
              <button
                type="button"
                onClick={() => navigate(`/dat-lich?dressId=${dress.id}`)}
                className="w-full h-[46px] px-5 rounded-[4px] bg-white hover:bg-[#FAF4F3] border border-[#D6C7C3] text-[#5A4848] font-jakarta text-[12.5px] font-medium tracking-[0.5px] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Clock className="w-4 h-4 text-[#70484E]" />
                CHỈ ĐẶT LỊCH THỬ VÁY PRIVATE SUITE (MIỄN PHÍ)
              </button>

              {/* Row 3: THÊM VÀO GIỎ HÀNG */}
              <button
                type="button"
                onClick={handleOnlineRent}
                className="w-full h-[48px] px-5 rounded-[4px] bg-white hover:bg-[#FAF4F3] border border-[#70484E] text-[#70484E] font-jakarta text-[13px] font-semibold tracking-[0.8px] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <ShoppingBag className="w-4 h-4" strokeWidth={1.8} />
                THÊM VÀO GIỎ HÀNG
              </button>

              {/* Row 4: TƯ VẤN TRỰC TIẾP VỚI CHUYÊN VIÊN ATELIER */}
              <button
                type="button"
                onClick={handleConsultStylist}
                className="w-full h-[46px] px-5 rounded-[4px] bg-[#FDF6F4] hover:bg-[#F9ECE8] border border-[#F2DDD9] text-[#553C40] font-jakarta text-[12.5px] font-medium tracking-[0.5px] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Headphones className="w-4 h-4 text-[#70484E]" strokeWidth={1.8} />
                TƯ VẤN TRỰC TIẾP VỚI CHUYÊN VIÊN ATELIER
              </button>
            </div>

            {/* Commitments & Trust Signals - Khớp 100% với Hình 2 */}
            <div className="pt-4 border-t border-[#EAE0DC] flex flex-col gap-2.5 text-[12.5px] text-[#4A3B3D]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#70484E] shrink-0 mt-0.5" strokeWidth={1.75} />
                <span>Chỉnh sửa số đo vừa khít vóc dáng 3 ngày trước hôn lễ (Miễn phí).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#70484E] shrink-0 mt-0.5" strokeWidth={1.75} />
                <span>Hợp đồng điện tử ký số bảo lãnh cọc minh bạch, hoàn trả tức thì.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-[#70484E] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 .9.5 1.7 1.3 2.1L3 13a1 1 0 0 0 .5 1.5h17a1 1 0 0 0 .5-1.5L13.2 7.6c.8-.4 1.3-1.2 1.3-2.1A2.5 2.5 0 0 0 12 3Z" />
                  <path d="M12 14.5V20" />
                  <path d="M9 20h6" />
                </svg>
                <span>Hấp khử khuẩn vô trùng chuyên dụng haute couture trước giờ trao gửi.</span>
              </div>
            </div>

          </div>

        </div>

        {/* ================= SECTION 2: CÂU CHUYỆN THIẾT KẾ ================= */}
        {dress.story && (
          <section className="mt-20 pt-14 border-t border-[#EAE0DC]">
            {/* Header Tab Title: Câu Chuyện Thiết Kế */}
            <div className="mb-10 border-b border-[#EAE0DC]">
              <div className="inline-block border-b-2 border-[#70484E] pb-3 -mb-[2px]">
                <h3 className="font-playfair text-[24px] sm:text-[28px] font-normal text-[#5A4045] m-0 tracking-wide">
                  Câu Chuyện Thiết Kế
                </h3>
              </div>
            </div>

            <div className="w-full">
              {/* Title */}
              <h2 className="font-playfair text-[30px] sm:text-[36px] leading-[1.25] font-semibold text-[#231A19] mb-6 max-w-[850px]">
                {dress.story.title || 'Vẻ Đẹp Kiêu Hãnh Của Đóa Hồng Trong Sương Sớm'}
              </h2>

              {/* Story Content */}
              <div className="space-y-4 font-jakarta text-[14px] sm:text-[14.5px] leading-[26px] text-[#5A4848] mb-10 font-normal max-w-[1100px]">
                {dress.story.content.map((p, idx) => (
                  <p key={idx} className="m-0">
                    {p}
                  </p>
                ))}
              </div>

              {/* 3 Stats Cards - Căn ra giữa mục */}
              <div className="w-full flex justify-center pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 w-full max-w-[900px]">
                  {(dress.story.stats && dress.story.stats.length > 0 ? dress.story.stats : [
                    { value: '420h', label: 'ĐÍNH KẾT THỦ CÔNG' },
                    { value: '1.800+', label: 'PHA LÊ SWAROVSKI' },
                    { value: '12 Lớp', label: 'LỤA TULLE PHÁP SIÊU NHẸ' },
                  ]).map((st, idx) => (
                    <div key={idx} className="bg-white px-6 py-5 rounded-[16px] border border-[#EAE0DC] shadow-[0_2px_12px_rgba(44,37,35,0.02)] flex flex-col justify-center">
                      <span className="font-playfair font-semibold text-[24px] sm:text-[26px] text-[#70484E] block leading-tight mb-1.5">
                        {st.value}
                      </span>
                      <span className="font-jakarta text-[11px] font-medium uppercase tracking-[0.6px] text-[#8A7978] block">
                        {st.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= SECTION 3: TRẢI NGHIỆM NÀNG DÂU THỰC TẾ ================= */}
        {allFeedbacks && allFeedbacks.length > 0 && (
          <section id="feedback-section" className="mt-20 pt-16 border-t border-[#EAE0DC]">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="font-jakarta font-bold text-[11px] tracking-[2.5px] uppercase text-[#B8737D] block mb-1">
                  BRIDAL FEEDBACK & MOMENTS
                </span>
                <h2 className="font-playfair text-[30px] sm:text-[36px] leading-tight font-semibold text-[#231A19] m-0">
                  Trải Nghiệm Nàng Dâu Thực Tế
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAllFeedbacks(!showAllFeedbacks);
                  setFeedbackPage(1);
                  if (showAllFeedbacks) {
                    document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-[13px] font-medium text-[#B26B74] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
              >
                {showAllFeedbacks ? 'Thu gọn ←' : `Xem tất cả (${allFeedbacks.length}) →`}
              </button>
            </div>

            {/* Grid 3 cột x 2 hàng (tối đa 6 items khi mở rộng, hoặc 3 items mặc định) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayedFeedbacks.map((review) => (
                <div
                  key={review.id}
                  className="bg-white border border-[#EAE0DC] rounded-[20px] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="relative h-[290px] overflow-hidden bg-[#F6ECE8]">
                    <img
                      src={review.image}
                      alt={review.brideName}
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#B26B74] flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> 5.0
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <p className="font-jakarta text-[13px] leading-[22px] text-[#5A4848] italic mb-4">
                      "{review.quote}"
                    </p>
                    <div className="pt-3 border-t border-[#EAE0DC] flex items-center justify-between text-[12px]">
                      <strong className="font-semibold text-[#231A19]">{review.brideName}</strong>
                      <span className="text-[#8A7978]">Ngày cưới: {review.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Phân trang khi mở rộng Xem tất cả */}
            {showAllFeedbacks && totalFeedbackPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  type="button"
                  disabled={feedbackPage === 1}
                  onClick={() => {
                    setFeedbackPage((prev) => Math.max(prev - 1, 1));
                    document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-9 h-9 rounded-[8px] flex items-center justify-center border transition-colors ${feedbackPage === 1
                      ? 'border-[#EAE0DC] text-[#C4B4B0] cursor-not-allowed bg-transparent'
                      : 'border-[#EAE0DC] bg-white text-[#70484E] hover:border-[#70484E] cursor-pointer'
                    }`}
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPaginationItems(feedbackPage, totalFeedbackPages).map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-9 h-9 flex items-center justify-center text-[#8A7978] font-bold text-[14px] tracking-widest select-none"
                      >
                        ...
                      </span>
                    );
                  }
                  const pNum = Number(item);
                  const isActive = feedbackPage === pNum;
                  return (
                    <button
                      key={`page-${pNum}`}
                      type="button"
                      onClick={() => {
                        setFeedbackPage(pNum);
                        document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-9 h-9 rounded-[8px] flex items-center justify-center font-jakarta text-[13px] font-medium transition-colors cursor-pointer ${isActive
                          ? 'bg-[#70484E] text-white shadow-xs'
                          : 'bg-white border border-[#EAE0DC] text-[#5A4848] hover:border-[#70484E] hover:text-[#70484E]'
                        }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={feedbackPage === totalFeedbackPages}
                  onClick={() => {
                    setFeedbackPage((prev) => Math.min(prev + 1, totalFeedbackPages));
                    document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-9 h-9 rounded-[8px] flex items-center justify-center border transition-colors ${feedbackPage === totalFeedbackPages
                      ? 'border-[#EAE0DC] text-[#C4B4B0] cursor-not-allowed bg-transparent'
                      : 'border-[#EAE0DC] bg-white text-[#70484E] hover:border-[#70484E] cursor-pointer'
                    }`}
                  aria-label="Trang kế tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>
        )}

        {/* ================= SECTION 4: CÓ THỂ NÀNG CŨNG YÊU THÍCH ================= */}
        {relatedDresses && relatedDresses.length > 0 && (
          <section className="mt-20 pt-16 border-t border-[#EAE0DC]">
            <div className="text-center max-w-[680px] mx-auto mb-12">
              <span className="font-jakarta font-bold text-[11px] tracking-[2.5px] uppercase text-[#B8737D] block mb-1">
                HAUTE COUTURE SELECTIONS
              </span>
              <h2 className="font-playfair text-[32px] sm:text-[38px] leading-tight font-semibold text-[#231A19] mb-3">
                Có Thể Nàng Cũng Yêu Thích
              </h2>
              <p className="text-[14px] text-[#7A6B6A] m-0 font-normal">
                Những tuyệt tác váy cưới được tuyển chọn kỹ lưỡng cùng phong cách dành riêng cho nàng
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedDresses.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/dresses/${item.id}`)}
                  className="bg-white border border-[#EAE0DC] rounded-[22px] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] bg-[#FCEEE9] overflow-hidden">
                    <img
                      src={item.images?.[0]}
                      alt={item.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[#B26B74] text-[10.5px] font-bold tracking-wider uppercase">
                      {item.collectionTag?.split(' ')?.[0] || 'COUTURE'}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] text-[#8A7978] block mb-1">
                        {item.silhouetteCategory}
                      </span>
                      <h4 className="font-playfair text-[18px] font-semibold text-[#231A19] m-0 mb-3 group-hover:text-[#B26B74] transition-colors leading-snug">
                        {item.name}
                      </h4>
                    </div>

                    <div className="pt-3 border-t border-[#EAE0DC] flex items-center justify-between">
                      <div>
                        <span className="font-playfair font-semibold text-[20px] text-[#B26B74]">
                          {formatCurrencyVND(item.price)}
                        </span>
                        <span className="text-[11.5px] text-[#8A7978] ml-1">/ ngày</span>
                      </div>
                      <span className="text-[12px] font-medium text-[#B26B74] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                        Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* 4. Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-[620px] bg-white rounded-2xl shadow-2xl border border-[#E6DAC8] overflow-hidden">
            <div className="px-6 py-4 bg-[#FAF7F5] border-b border-[#EAE0DC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[#B26B74]" />
                <h3 className="font-playfair text-[19px] font-semibold text-[#231A19] m-0">
                  Bảng Hướng Dẫn Chọn Size Chuẩn Haute Couture
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A6B6A] hover:bg-[#F2DDD9] transition-colors border-0 bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-[13px] text-[#5A4848] mb-4">
                Tất cả váy cưới tại UniBridal đều được trang bị hệ thống dây đan Corset thông minh phía sau, cho phép tùy chỉnh nới hoặc siết từ 2 - 4cm theo vóc dáng thực tế của cô dâu:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px] border-collapse">
                  <thead>
                    <tr className="bg-[#FFF5F3] text-[#B26B74] border-b border-[#EAE0DC]">
                      <th className="py-2.5 px-3 font-semibold">Size</th>
                      <th className="py-2.5 px-3 font-semibold">Cân nặng</th>
                      <th className="py-2.5 px-3 font-semibold">Vòng ngực</th>
                      <th className="py-2.5 px-3 font-semibold">Vòng eo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE0DC] text-[#231A19]">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-[#B26B74]">XS</td>
                      <td className="py-2.5 px-3">Dưới 46kg</td>
                      <td className="py-2.5 px-3">80 – 82 cm</td>
                      <td className="py-2.5 px-3">58 – 62 cm</td>
                    </tr>
                    <tr className="bg-[#FAF7F5]">
                      <td className="py-2.5 px-3 font-bold text-[#B26B74]">S</td>
                      <td className="py-2.5 px-3">46 – 52kg</td>
                      <td className="py-2.5 px-3">83 – 86 cm</td>
                      <td className="py-2.5 px-3">63 – 67 cm</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-[#B26B74]">M</td>
                      <td className="py-2.5 px-3">52 – 58kg</td>
                      <td className="py-2.5 px-3">87 – 90 cm</td>
                      <td className="py-2.5 px-3">68 – 73 cm</td>
                    </tr>
                    <tr className="bg-[#FAF7F5]">
                      <td className="py-2.5 px-3 font-bold text-[#B26B74]">L</td>
                      <td className="py-2.5 px-3">58 – 65kg</td>
                      <td className="py-2.5 px-3">91 – 95 cm</td>
                      <td className="py-2.5 px-3">74 – 78 cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-5 p-3.5 bg-[#FFF8F6] border border-[#F2DDD9] rounded-xl text-[12px] text-[#7A6B6A] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#B26B74] shrink-0 mt-0.5" />
                <span>
                  Nếu nàng chưa chắc chắn về số đo, chuyên viên UniBridal sẽ hỗ trợ đo trực tiếp và điều chỉnh váy vừa in trong buổi thử váy tại Showroom.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedProduct={dress}
      />

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}
