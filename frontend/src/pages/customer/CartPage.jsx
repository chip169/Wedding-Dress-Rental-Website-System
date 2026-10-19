import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, Heart, LockKeyhole, Minus, Phone, Plus, ShieldCheck, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { CART_CATALOG, CART_EVENT, addToCart, getCart, getWishlist, removeFromCart, resolveCartItem, toggleWishlist, updateCartDays } from '../../services/cartService';
import './CartPage.css';

const money = (amount) => `${Number(amount || 0).toLocaleString('vi-VN')}đ`;
const recommendations = [CART_CATALOG['preview-seraphina-royal'], CART_CATALOG['preview-genevieve-ethereal'], CART_CATALOG['preview-juliette-floral']];

function CartItem({ item, onUpdate, onRemove, onWishlist, isWishlisted }) {
  const isElysian = item.id === '1';
  const total = Number(item.price || 0) + (item.days - 1) * 800000;
  const ProductImage = item.detailHref === null ? 'div' : Link;
  return (
    <article className="cart-product">
      {item.location && <span className="cart-product-ribbon">✥ {item.location}</span>}
      <ProductImage className="cart-product-image" {...(item.detailHref === null ? {} : { to: item.detailHref || `/dresses/${item.id}`, 'aria-label': `Xem ${item.name}` })}>
        <img src={item.image} alt={item.name} />
        {item.code && <span>{item.code}</span>}
      </ProductImage>
      <div className="cart-product-body">
        <div className="cart-product-heading">
          <div>
            <span className="cart-eyebrow">{item.collection || 'HAUTE COUTURE'}</span>
            <h3>{item.detailHref === null ? item.name : <Link to={item.detailHref || `/dresses/${item.id}`}>{item.name}</Link>}</h3>
          </div>
          <div className="cart-product-price"><strong>{money(total)}</strong><small>/ {item.days} ngày thuê</small></div>
        </div>
        <div className="cart-tags"><span>✦ Size {item.size || 'Theo tư vấn'}</span><span>✦ {item.fabric || 'Ivory couture'}</span><span>{item.style || 'Gói thuê cao cấp'}</span></div>
        <div className="cart-schedule">
          <p><CalendarDays size={13} /> {isElysian ? 'Lịch thử & nhận váy sẽ được xác nhận sau tư vấn' : 'Lịch may đo và nhận váy theo tư vấn atelier'}</p>
          <small>Tiền cọc bảo lãnh: {money(item.deposit)} (Hoàn 100% trong 2 giờ sau khi trả váy)</small>
        </div>
        <div className="cart-product-notes">
          <span><CheckCircle2 size={13} /> {isElysian ? 'Fitting tinh chỉnh chuẩn số đo 3 ngày trước lễ' : 'Tư vấn trực tiếp 1:1 cùng Giám đốc Thiết kế'}</span>
          <span><CheckCircle2 size={13} /> {isElysian ? 'Tặng kèm: Voan Cathedral lụa Pháp & Vải bảo hộ Haute Couture' : 'Giặt hấp sinh học Paris & bàn giao trang phục tận nơi'}</span>
        </div>
        <div className="cart-product-bottom">
          <div className="cart-days"><span>Thời gian thuê:</span><div className="cart-stepper"><button type="button" onClick={() => onUpdate(item.id, item.days - 1)} disabled={item.days <= 1} aria-label={`Giảm ngày thuê ${item.name}`}><Minus size={13} /></button><strong>{item.days} Ngày</strong><button type="button" onClick={() => onUpdate(item.id, item.days + 1)} disabled={item.days >= 14} aria-label={`Tăng ngày thuê ${item.name}`}><Plus size={13} /></button></div><em>+800k/ngày gia hạn</em></div>
          <div className="cart-item-actions"><button type="button" aria-pressed={isWishlisted} onClick={() => onWishlist(item)}><Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} /> {isWishlisted ? 'Đã lưu yêu thích' : 'Lưu yêu thích'}</button><button type="button" className="cart-remove" onClick={() => onRemove(item.id)}><Trash2 size={14} /> Xóa</button></div>
        </div>
      </div>
    </article>
  );
}

function ConsultationDialog({ selectedProduct, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="cart-dialog-backdrop" onMouseDown={onClose}>
      <section className="cart-dialog" role="dialog" aria-modal="true" aria-labelledby="cart-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="cart-dialog-close" type="button" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
        <span className="cart-eyebrow">UNI BRIDAL PRIVATE ATELIER</span>
        <h2 id="cart-dialog-title">Tư Vấn Đặt Thuê</h2>
        {selectedProduct && <p className="cart-dialog-product">Nàng đang quan tâm: <strong>{selectedProduct.name}</strong></p>}
        <p>Giỏ hàng hiện được lưu trên thiết bị này. Để xác nhận lịch thử váy, giá thuê và tình trạng mẫu, nàng vui lòng liên hệ trực tiếp với atelier.</p>
        <a className="cart-dialog-call" href="tel:18008998"><Phone size={18} /> Gọi 1800 8998</a>
        <p className="cart-dialog-note">Chưa có yêu cầu đặt lịch hay đơn thuê nào được gửi. Chưa phát sinh thanh toán.</p>
      </section>
    </div>
  );
}

export default function CartPage() {
  const [storedItems, setStoredItems] = useState(getCart);
  const [wishlist, setWishlist] = useState(getWishlist);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState('');
  const items = useMemo(() => storedItems.map(resolveCartItem), [storedItems]);
  const rentalFee = items.reduce((sum, item) => sum + Number(item.price || 0) + (item.days - 1) * 800000, 0);
  const deposit = items.reduce((sum, item) => sum + Number(item.deposit || 0), 0);

  useEffect(() => {
    const refresh = () => setStoredItems(getCart());
    const refreshStorage = () => { refresh(); setWishlist(getWishlist()); };
    window.addEventListener(CART_EVENT, refresh);
    window.addEventListener('storage', refreshStorage);
    return () => { window.removeEventListener(CART_EVENT, refresh); window.removeEventListener('storage', refreshStorage); };
  }, []);

  const showMessage = (text) => { setMessage(text); window.setTimeout(() => setMessage(''), 3200); };
  const handleAdd = (dress) => showMessage(addToCart(dress) ? `Đã thêm ${dress.name} vào giỏ thuê váy.` : `${dress.name} đã có trong giỏ thuê váy.`);
  const handleWishlist = (dress) => {
    const result = toggleWishlist(dress);
    setWishlist(result.items);
    showMessage(result.saved ? `Đã lưu ${dress.name} vào danh sách yêu thích.` : `Đã bỏ ${dress.name} khỏi danh sách yêu thích.`);
  };
  const isWishlisted = (id) => wishlist.some((dress) => dress.id === String(id));
  const handleRent = (dress) => { addToCart(dress); setSelectedProduct(dress); setIsConsultationOpen(true); };

  return (
    <div className="cart-page">
      <Header onOpenBooking={() => { setSelectedProduct(null); setIsConsultationOpen(true); }} />
      <main>
        <section className="cart-hero" aria-labelledby="cart-title">
          <span className="cart-hero-label"><Sparkles size={13} /> WEDDING DRESS RENTAL</span>
          <h1 id="cart-title">Giỏ Hàng Của Nàng</h1>
          <p>Lưu giữ những tác phẩm Haute Couture hoàn mỹ cho khoảnh khắc bước vào lễ đường vĩnh cửu.</p>
          <span className="cart-hero-rule" />
        </section>

        <div className="cart-content">
          <section className="cart-saved" aria-labelledby="cart-saved-title">
            <div className="cart-section-bar"><h2 id="cart-saved-title">Tác phẩm trong giỏ thuê</h2><span><LockKeyhole size={13} /> Lịch thuê được xác nhận sau khi tư vấn</span></div>
            {items.length ? <div className="cart-items">{items.map((item) => <CartItem key={item.id} item={item} onUpdate={updateCartDays} onRemove={removeFromCart} onWishlist={handleWishlist} isWishlisted={isWishlisted(item.id)} />)}</div> : <div className="cart-empty"><ShoppingBag size={38} strokeWidth={1.3} /><h3>Giỏ thuê của nàng đang trống</h3><p>Khám phá những tuyệt tác được tuyển chọn dành riêng cho ngày trọng đại.</p><Link to="/collection">Khám phá bộ sưu tập <ArrowRight size={16} /></Link></div>}
            {wishlist.length > 0 && <div className="cart-wishlist" id="cart-wishlist"><h3><Heart size={17} fill="currentColor" /> Danh sách yêu thích ({wishlist.length})</h3><div>{wishlist.map((dress) => <div className="cart-wishlist-item" key={dress.id}><img src={dress.image} alt="" /><span>{dress.name}</span><button type="button" onClick={() => handleWishlist(dress)} aria-label={`Bỏ ${dress.name} khỏi yêu thích`}><X size={16} /></button></div>)}</div></div>}
          </section>

          <aside className="cart-aside" aria-label="Tóm tắt đơn thuê">
            <div className="cart-summary">
              <span className="cart-eyebrow">TÓM TẮT ĐƠN THUÊ & ĐẶT CỌC</span>
              <h2>Chi Phí Tạm Tính</h2>
              <div className="cart-summary-line"><span>Tổng phí thuê váy ({items.length} tác phẩm)</span><strong>{money(rentalFee)}</strong></div>
              <div className="cart-summary-line"><span>Vải bảo hộ & Giao nhận tận nơi</span><strong className="cart-rose">0đ</strong></div>
              <div className="cart-summary-subtotal"><span>Thành tiền thuê lễ phục:</span><strong>{money(rentalFee)}</strong></div>
              <div className="cart-deposit"><div><ShieldCheck size={15} /><strong>Tiền cọc bảo lãnh hoàn lại:</strong><b>{money(deposit)}</b></div><p>UniBridal cam kết hoàn tiền 100% vào tài khoản cô dâu trong 2 giờ sau khi kiểm tra tình trạng váy lúc hoàn trả.</p></div>
              <Link
                to="/checkout"
                className={`cart-checkout ${!items.length ? 'opacity-50 pointer-events-none' : ''}`}
              >
                TIẾN HÀNH ĐẶT THUÊ & KÝ HỢP ĐỒNG <ArrowRight size={16} />
              </Link>
              <p className="cart-checkout-note">Xác thực số đo, chính sách đặt cọc và hợp đồng bảo chứng số.</p>
              <Link className="cart-continue" to="/collection">TIẾP TỤC KHÁM PHÁ BỘ SƯU TẬP</Link>
            </div>
            <div className="cart-promises"><h2><ShieldCheck size={19} /> CAM KẾT ĐỘC QUYỀN</h2><ul><li><strong>Hoàn cọc từ 100%</strong><span>Giải ngân tự động qua ngân hàng trong vòng 2 giờ sau khi kiểm tra lễ phục.</span></li><li><strong>Hợp đồng điện tử ký số</strong><span>Minh bạch điều khoản, bảo vệ toàn diện quyền lợi và số đo của cô dâu.</span></li><li><strong>Bảo hiểm lỗi sợi & hạt đính</strong><span>Miễn trừ trách nhiệm với các vết dơ thông thường và hạt rơi nhẹ khi khiêu vũ.</span></li><li><strong>Đổi dáng váy miễn phí</strong><span>Được chuyển đổi mẫu váy khác cùng phân khúc trước ngày cưới 15 ngày.</span></li></ul><p>Cần hỗ trợ lựa chọn? <a href="tel:18008998"><Phone size={13} /> Hotline 1800 8998 (24/7)</a></p></div>
          </aside>
        </div>

        <section className="cart-recommendations" aria-labelledby="cart-recommend-title"><div className="cart-recommend-head"><div><span className="cart-eyebrow">RECOMMENDED FOR YOU</span><h2 id="cart-recommend-title">Có Thể Nàng Cũng Yêu Thích</h2><p>Những tuyệt tác váy cưới và phụ kiện độc bản được tuyển chọn riêng dựa trên gu thẩm mỹ của nàng.</p></div><Link to="/collection">KHÁM PHÁ THÊM <ArrowRight size={15} /></Link></div><div className="cart-recommend-grid">{recommendations.map((dress) => <article className="cart-recommend-card" key={dress.id}><div className="cart-recommend-image"><div><img src={dress.image} alt={dress.name} /></div><span>{dress.collection}</span><button type="button" aria-label={`${isWishlisted(dress.id) ? 'Bỏ' : 'Lưu'} ${dress.name} ${isWishlisted(dress.id) ? 'khỏi' : 'vào'} yêu thích`} aria-pressed={isWishlisted(dress.id)} onClick={() => handleWishlist(dress)}><Heart size={19} fill={isWishlisted(dress.id) ? 'currentColor' : 'none'} /></button></div><div className="cart-recommend-body"><div className="cart-recommend-meta"><span>{dress.style}</span><span>✦ SIZE {dress.size}</span></div><h3>{dress.name}</h3><p>{dress.id === 'preview-seraphina-royal' ? 'Váy cưới công chúa xếp tầng voan bồng bềnh, đính kết ren Chantilly Pháp và cúp ngực corsetry siết eo.' : dress.id === 'preview-genevieve-ethereal' ? 'Lễ phục bồng xòe vương giả với tùng váy đa tầng organza tơ tằm, đính ngọc trai thủ công rạng ngời.' : 'Dáng chữ A thanh nhã thêu ren chim tinh tế, có xẻ V quyến rũ kết hợp tay ren dài cảm giác tiểu thư Paris.'}</p><div className="cart-recommend-price"><strong>{money(dress.price)}</strong><span>/ 1 ngày</span></div><div className="cart-recommend-actions"><button type="button" onClick={() => handleAdd(dress)}><ShoppingBag size={14} /> Thêm Vào Giỏ</button><button type="button" onClick={() => handleRent(dress)}>Liên hệ thuê</button></div></div></article>)}</div></section>
      </main>
      <Footer />
      {message && <div className="cart-toast" role="status">{message}</div>}
      {isConsultationOpen && <ConsultationDialog selectedProduct={selectedProduct} onClose={() => setIsConsultationOpen(false)} />}
    </div>
  );
}
