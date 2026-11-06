import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, Heart, LockKeyhole, Minus, Phone, Plus, ShieldCheck, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { CART_EVENT, addToCart, clearCart, getCart, refreshCartWithDresses, removeFromCart, resolveCartItem, updateCartDays } from '../../services/cartService';
import { getWishlistIds, toggleWishlist, WISHLIST_EVENT } from '../../services/wishlistService';
import { getDressesFromApi } from '../../services/dressApiService';
import logoEmblemImg from '../../assets/logo_emblem.png';

import { formatCurrencyVND } from '../../utils/formatCurrency';
const cartPageStyles = `
.cart-page {
  background:#fff8f6;
  color:#2c2523;
  font-family:'Plus Jakarta Sans',sans-serif;
  min-height:100vh
}

.cart-page main {
  max-width:1280px;
  margin:auto;
  padding:0 32px 42px
}

.cart-hero {
  text-align:center;
  padding:42px 0 57px
}

.cart-hero-label {
  display:inline-flex;
  align-items:center;
  gap:7px;
  background:#f6eae7;
  border-radius:999px;
  padding:5px 13px;
  color:#985c65;
  font-size:10px;
  letter-spacing:1.7px;
  font-weight:700
}

.cart-hero h1 {
  font-family:'Playfair Display',Georgia,serif;
  font-size:40px;
  font-weight:500;
  line-height:1.12;
  margin:13px 0 5px
}

.cart-hero p {
  max-width:650px;
  margin:0 auto;
  color:#796b67;
  font-size:13px;
  line-height:1.7
}

.cart-hero-rule {
  display:block;
  width:92px;
  height:2px;
  margin:17px auto 0;
  background:linear-gradient(90deg,transparent,#b8737d,transparent)
}

.cart-content {
  display:grid;
  grid-template-columns:minmax(0,1.48fr) minmax(330px,1fr);
  gap:38px
}

.cart-section-bar {
  display:flex;
  justify-content:space-between;
  gap:12px;
  align-items:center;
  margin-bottom:24px;
  border-bottom:1px solid #efdfdc;
  padding-bottom:10px
}

.cart-section-bar h2 {
  font-size:16px;
  font-weight:700;
  margin:0
}

.cart-section-bar span {
  display:flex;
  align-items:center;
  gap:4px;
  font-size:11px;
  color:#95765d
}

.cart-items {
  display:grid;
  gap:24px
}

.cart-product {
  position:relative;
  background:#fff;
  border:1px solid #f2e7e3;
  border-radius:8px;
  padding:25px;
  display:grid;
  grid-template-columns:220px minmax(0,1fr);
  gap:18px;
  min-height:0;
  box-shadow:0 4px 14px rgba(90,51,51,.025)
}

.cart-product-ribbon {
  position:absolute;
  right:0;
  top:0;
  background:#faf0e2;
  color:#9a7555;
  padding:6px 12px;
  font-size:10px;
  font-weight:700;
  border-radius:0 8px 0 5px
}

.cart-product-image {
  display:block;
  position:relative;
  overflow:hidden;
  border-radius:4px;
  height:275px;
  min-height:0
}

.cart-product-image img {
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center 22%;
  transition:transform .4s
}

.cart-product-image:hover img {
  transform:scale(1.04)
}

.cart-product-image span {
  position:absolute;
  bottom:6px;
  left:6px;
  background:#fff;
  letter-spacing:.4px;
  font-size:10px;
  font-weight:700;
  padding:4px 6px;
  border-radius:2px
}

.cart-product-body {
  min-width:0;
  display:flex;
  flex-direction:column;
  padding-top:6px
}

.cart-product-heading {
  display:flex;
  justify-content:space-between;
  gap:12px;
  align-items:flex-start
}

.cart-eyebrow {
  font-size:10px;
  color:#9a5963;
  font-weight:700;
  letter-spacing:1.5px
}

.cart-product h3 {
  font-family:'Playfair Display',Georgia,serif;
  font-size:22px;
  font-weight:500;
  line-height:1.2;
  margin:6px 0 9px
}

.cart-product h3 a:hover,.cart-recommend h3 a:hover {
  color:#a9626d
}

.cart-product-price {
  text-align:right;
  white-space:nowrap;
  margin-top:4px
}

.cart-product-price strong {
  display:block;
  color:#9a5963;
  font-size:18px
}

.cart-product-price small {
  font-size:10px;
  color:#796b67
}

.cart-tags {
  display:flex;
  flex-wrap:wrap;
  gap:4px;
  margin-bottom:8px
}

.cart-tags span {
  background:#faf0ed;
  padding:4px 7px;
  color:#80535a;
  font-size:10px;
  letter-spacing:.45px;
  line-height:1.25
}

.cart-schedule {
  background:#fbf1ee;
  padding:8px 9px;
  color:#77524f;
  margin-bottom:8px
}

.cart-schedule p {
  margin:0 0 3px;
  font-size:10.5px;
  display:flex;
  align-items:center;
  gap:4px
}

.cart-schedule small {
  font-size:10px;
  line-height:1.4;
  display:block
}

.cart-product-notes {
  display:grid;
  gap:4px;
  color:#685d5b;
  font-size:10.5px;
  line-height:1.3
}

.cart-product-notes span {
  display:flex;
  gap:5px;
  align-items:flex-start
}

.cart-product-notes svg {
  color:#a65d68;
  flex:none
}

.cart-product-bottom {
  margin-top:12px;
  padding-top:14px
}

.cart-days {
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
  font-size:10px;
  color:#685d5b
}

.cart-stepper {
  display:inline-flex;
  align-items:center;
  background:#f8eeeb;
  color:#845059;
  border-radius:3px;
  height:32px
}

.cart-stepper button {
  display:grid;
  place-items:center;
  width:30px;
  height:32px;
  cursor:pointer
}

.cart-stepper button:disabled {
  opacity:.35;
  cursor:not-allowed
}

.cart-stepper strong {
  font-size:11px;
  padding:0 8px
}

.cart-days em {
  font-size:9px;
  color:#a28168
}

.cart-item-actions {
  display:flex;
  gap:14px;
  margin-top:9px
}

.cart-item-actions button {
  display:inline-flex;
  align-items:center;
  gap:4px;
  font-size:11px;
  color:#705f5c;
  cursor:pointer
}

.cart-item-actions button:hover {
  color:#9a5963
}

.cart-item-actions .cart-remove {
  color:#b84f58
}

.cart-aside {
  padding-top:0
}

.cart-summary {
  background:#fff;
  border:1px solid #f2e8e5;
  border-radius:8px;
  padding:30px 27px;
  box-shadow:0 5px 18px rgba(96,52,52,.05)
}

.cart-summary h2 {
  font:500 24px/1.15 'Playfair Display',Georgia,serif;
  margin:8px 0 17px
}

.cart-summary-line,.cart-summary-subtotal,.cart-grand-total {
  display:flex;
  justify-content:space-between;
  align-items:baseline;
  gap:10px
}

.cart-summary-line {
  font-size:12px;
  color:#625958;
  margin:12px 0
}

.cart-summary-line strong {
  color:#322727;
  font-size:12px;
  white-space:nowrap
}

.cart-summary-line .cart-rose {
  color:#a35a65
}

.cart-summary-subtotal {
  border-top:1px solid #f0e7e4;
  padding-top:12px;
  margin-top:15px;
  font-size:15px;
  font-weight:700
}

.cart-summary-subtotal strong {
  color:#a35a65;
  white-space:nowrap
}

.cart-deposit {
  background:#fbefec;
  padding:12px 13px;
  margin-top:12px;
  color:#7b5647
}

.cart-deposit div {
  display:flex;
  align-items:center;
  gap:4px;
  font-size:11px
}

.cart-deposit b {
  margin-left:auto;
  font-size:15px;
  white-space:nowrap
}

.cart-deposit p {
  margin:5px 0 0;
  font-size:10px;
  line-height:1.5
}

.cart-grand-total {
  margin:23px 0 17px;
  border-top:1px solid #e9ddd9;
  padding-top:17px;
  font-size:15px;
  font-weight:700
}

.cart-grand-total strong {
  font:700 27px/1 'Playfair Display',Georgia,serif;
  white-space:nowrap
}

.cart-checkout {
  height:45px;
  width:100%;
  background:#89545e;
  color:#fff;
  border-radius:3px;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  font-size:11px;
  font-weight:700;
  letter-spacing:1px;
  cursor:pointer;
  box-shadow:0 2px 4px #63364040
}

.cart-checkout:hover:not(:disabled),.cart-recommend-actions button:last-child:hover {
  background:#70414b
}

.cart-checkout:disabled {
  opacity:.5;
  cursor:not-allowed
}

.cart-checkout-note {
  font-size:10px;
  text-align:center;
  color:#8c7773;
  line-height:1.5;
  margin:10px 0 5px
}

.cart-continue {
  display:block;
  text-align:center;
  color:#675857;
  font-weight:700;
  font-size:10px;
  letter-spacing:.5px;
  margin-top:8px
}

.cart-continue:hover {
  color:#9a5963
}

.cart-promises {
  background:#fbefec;
  border-radius:7px;
  padding:20px 18px;
  margin-top:14px
}

.cart-promises h2 {
  display:flex;
  gap:7px;
  align-items:center;
  font-size:16px;
  font-weight:700;
  margin:0 0 12px
}

.cart-promises h2 svg {
  color:#9a5963
}

.cart-promises ul {
  list-style:none;
  padding:0;
  margin:0;
  display:grid;
  gap:9px
}

.cart-promises li {
  position:relative;
  padding-left:23px;
  font-size:10px;
  line-height:1.35
}

.cart-promises li:before {
  content:'✥';
  position:absolute;
  left:0;
  top:0;
  color:#9a5963;
  font-size:14px
}

.cart-promises li strong,.cart-promises li span {
  display:block
}

.cart-promises li span {
  color:#716461
}

.cart-promises>p {
  display:flex;
  justify-content:space-between;
  gap:6px;
  font-size:10px;
  color:#716461;
  margin:20px 0 0
}

.cart-promises a {
  display:inline-flex;
  align-items:center;
  gap:3px;
  color:#a35a65;
  font-weight:700
}

.cart-empty {
  border:1px dashed #ddc6c2;
  border-radius:8px;
  background:#fff;
  text-align:center;
  padding:65px 22px;
  color:#8d6870
}

.cart-empty svg {
  margin:auto
}

.cart-empty h3 {
  font:500 24px 'Playfair Display',Georgia,serif;
  margin:12px 0 5px;
  color:#2c2523
}

.cart-empty p {
  font-size:13px;
  color:#786966
}

.cart-empty a {
  display:inline-flex;
  align-items:center;
  gap:6px;
  margin-top:12px;
  background:#89545e;
  color:#fff;
  padding:12px 17px;
  border-radius:4px;
  font-size:12px
}

.cart-recommendations {
  border-top:1px solid #eedbd7;
  margin-top:70px;
  padding:28px 0 0
}

.cart-recommend-head {
  display:flex;
  justify-content:space-between;
  align-items:end;
  gap:16px;
  margin-bottom:25px
}

.cart-recommend-head h2 {
  font:500 30px/1.2 'Playfair Display',Georgia,serif;
  margin:4px 0 3px
}

.cart-recommend-head p {
  font-size:12px;
  color:#796b67;
  margin:0
}

.cart-recommend-head>a {
  display:flex;
  align-items:center;
  gap:3px;
  white-space:nowrap;
  color:#a35a65;
  font-size:11px;
  font-weight:700
}

.cart-recommend-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:24px;
  max-width:1120px;
  margin:auto
}

.cart-recommend-card {
  background:#fff;
  border:1px solid #f2e9e6;
  border-radius:6px;
  overflow:hidden;
  display:flex;
  flex-direction:column
}

.cart-recommend-image {
  position:relative;
  height:380px;
  overflow:hidden
}

.cart-recommend-image>div,.cart-recommend-image img {
  display:block;
  width:100%;
  height:100%
}

.cart-recommend-image img {
  object-fit:cover;
  object-position:center 28%;
  transition:transform .5s
}

.cart-recommend-image:hover img {
  transform:scale(1.035)
}

.cart-recommend-image>span {
  position:absolute;
  left:13px;
  top:14px;
  background:#fff;
  padding:5px 8px;
  color:#9a5963;
  font-size:9px;
  letter-spacing:.7px;
  font-weight:700
}

.cart-recommend-image>button {
  position:absolute;
  right:14px;
  top:14px;
  background:#fff;
  color:#9a5963;
  border-radius:7px;
  width:34px;
  height:34px;
  display:grid;
  place-items:center;
  cursor:pointer
}

.cart-recommend-body {
  padding:20px 24px 23px;
  display:flex;
  flex-direction:column;
  flex:1
}

.cart-recommend-meta {
  display:flex;
  justify-content:space-between;
  gap:8px;
  color:#8b6c68;
  font-size:9px;
  letter-spacing:1px;
  text-transform:uppercase
}

.cart-recommend h3,.cart-recommend-card h3 {
  font:500 21px/1.25 'Playfair Display',Georgia,serif;
  margin:6px 0
}

.cart-recommend-body>p {
  color:#766967;
  font-size:11px;
  line-height:1.5;
  margin:0;
  min-height:48px
}

.cart-recommend-price {
  margin-top:auto;
  padding-top:8px;
  display:flex;
  align-items:baseline;
  gap:4px
}

.cart-recommend-price strong {
  color:#a35a65;
  font-size:17px
}

.cart-recommend-price span {
  color:#766967;
  font-size:10px
}

.cart-recommend-actions {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  margin-top:10px
}

.cart-recommend-actions button {
  height:34px;
  border:1px solid #ba7a83;
  border-radius:5px;
  color:#a35a65;
  display:flex;
  justify-content:center;
  align-items:center;
  gap:5px;
  font-size:11px;
  cursor:pointer;
  white-space:nowrap
}

.cart-recommend-actions button:first-child:hover {
  background:#fff4f1
}

.cart-recommend-actions button:last-child {
  background:#89545e;
  color:#fff;
  border-color:#89545e
}

.cart-toast {
  position:fixed;
  right:22px;
  bottom:22px;
  z-index:70;
  background:#3b292c;
  color:#fff;
  padding:13px 18px;
  border-radius:6px;
  box-shadow:0 10px 24px #34242840;
  font-size:12px
}

.cart-wishlist {
  margin-top:20px;
  padding:18px;
  background:#fff;
  border:1px solid #efdfdc;
  border-radius:7px
}
.cart-wishlist h3 {
  display:flex;
  align-items:center;
  gap:8px;
  margin:0 0 12px;
  color:#8d5360;
  font-size:14px
}
.cart-wishlist>div {
  display:grid;
  gap:8px
}
.cart-wishlist-item {
  display:flex;
  align-items:center;
  gap:10px;
  font-size:12px
}
.cart-wishlist-item img {
  width:38px;
  height:42px;
  object-fit:cover;
  border-radius:3px
}
.cart-wishlist-item span {
  flex:1
}
.cart-wishlist-item button {
  color:#9a5963;
  cursor:pointer;
  padding:5px
}
.cart-dialog-backdrop {
  position:fixed;
  inset:0;
  z-index:100;
  background:#2d1d21a8;
  display:grid;
  place-items:center;
  padding:20px
}
.cart-dialog {
  width:min(100%,450px);
  position:relative;
  padding:36px;
  background:#fff8f6;
  border:1px solid #ead7d1;
  border-radius:9px;
  box-shadow:0 24px 70px #26171b55
}
.cart-dialog-close {
  position:absolute;
  top:12px;
  right:12px;
  padding:6px;
  color:#89545e;
  cursor:pointer
}
.cart-dialog h2 {
  margin:8px 0 15px;
  font:500 30px/1.2 'Playfair Display',Georgia,serif
}
.cart-dialog p {
  color:#685d5b;
  font-size:13px;
  line-height:1.65
}
.cart-dialog .cart-dialog-product {
  color:#8d5360
}
.cart-dialog-call {
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  width:100%;
  padding:12px;
  margin-top:20px;
  background:#89545e;
  color:white;
  border-radius:5px;
  font-size:14px;
  font-weight:700
}
.cart-dialog .cart-dialog-note {
  text-align:center;
  font-size:11px;
  margin-bottom:0
}

@media(max-width:1050px) {
  .cart-content {
    grid-template-columns:minmax(0,1.3fr) minmax(300px,1fr);
    gap:20px
  }
  .cart-product {
    grid-template-columns:155px minmax(0,1fr);
    padding:18px;
    gap:14px
  }
  .cart-product-image {
    height:260px
  }
  .cart-product-heading {
    display:block
  }
  .cart-product-price {
    text-align:left;
    margin:0 0 8px
  }
  .cart-product-price strong,.cart-product-price small {
    display:inline;
    margin-right:5px
  }
  .cart-recommend-image {
    height:310px
  }
  .cart-recommend-body {
    padding:16px
  }
}

@media(max-width:800px) {
  .cart-page main {
    padding:0 20px 32px
  }
  .cart-content {
    grid-template-columns:1fr
  }
  .cart-aside {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:14px;
    align-items:start
  }
  .cart-promises {
    margin-top:0
  }
  .cart-recommend-grid {
    gap:12px
  }
  .cart-recommend-image {
    height:250px
  }
  .cart-recommend-actions {
    grid-template-columns:1fr
  }
}

@media(max-width:620px) {
  .cart-page main {
    padding:0 15px 28px
  }
  .cart-hero {
    padding:32px 0 36px
  }
  .cart-hero h1 {
    font-size:33px
  }
  .cart-hero p {
    font-size:12px
  }
  .cart-section-bar {
    align-items:flex-start;
    flex-direction:column;
    gap:4px
  }
  .cart-product {
    grid-template-columns:110px minmax(0,1fr);
    grid-template-areas:'image heading' 'tags tags' 'schedule schedule' 'notes notes' 'bottom bottom';
    padding:14px;
    column-gap:13px;
    row-gap:10px;
    min-height:0
  }
  .cart-product-image {
    grid-area:image;
    height:145px;
    min-height:0
  }
  .cart-product-body {
    display:contents
  }
  .cart-product-heading {
    grid-area:heading;
    padding-top:16px
  }
  .cart-tags {
    grid-area:tags;
    margin:0
  }
  .cart-schedule {
    grid-area:schedule;
    margin:0
  }
  .cart-product-notes {
    grid-area:notes
  }
  .cart-product-bottom {
    grid-area:bottom;
    margin:0;
    padding:0
  }
  .cart-product h3 {
    font-size:20px
  }
  .cart-product-price strong {
    font-size:16px
  }
  .cart-eyebrow {
    font-size:10px
  }
  .cart-tags span {
    font-size:11px
  }
  .cart-schedule p,.cart-schedule small,.cart-product-notes {
    font-size:12px;
    line-height:1.5
  }
  .cart-days em {
    display:inline
  }
  .cart-aside {
    grid-template-columns:1fr
  }
  .cart-promises {
    margin-top:0
  }
  .cart-recommend-head {
    align-items:flex-start
  }
  .cart-recommend-head h2 {
    font-size:25px
  }
  .cart-recommend-head p {
    font-size:11px
  }
  .cart-recommend-head>a {
    font-size:9px
  }
  .cart-recommend-grid {
    grid-template-columns:1fr;
    gap:17px;
    max-width:380px
  }
  .cart-recommend-image {
    height:380px
  }
  .cart-recommend-actions {
    grid-template-columns:1fr 1fr
  }
}

@media(max-width:390px) {
  .cart-product {
    grid-template-columns:100px minmax(0,1fr)
  }
  .cart-product-image {
    height:140px
  }
  .cart-product-heading {
    padding-right:0
  }
}
`;

const money = (amount) => formatCurrencyVND(amount);

function CartItem({ item, onUpdate, onRemove, onWishlist, isWishlisted }) {
  const days = Math.max(1, Number(item.days || 1)); const total = Number(item.price || 0) * days;
  const ProductImage = item.detailHref === null ? 'div' : Link;
  return (
    <article className="cart-product">
      <ProductImage className="cart-product-image" {...(item.detailHref === null ? {} : { to: item.detailHref || `/dresses/${item.id}`, 'aria-label': `Xem ${item.name}` })}>
        <img src={item.image} alt={item.name} />
        {item.code && <span>{item.code}</span>}
        <div style={{ position: 'absolute', bottom: '6px', right: '6px', zIndex: 10, pointerEvents: 'none', userSelect: 'none' }} title="UniBridal Haute Couture">
          <img src={logoEmblemImg} alt="UniBridal Emblem" style={{ width: '30px', height: '30px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.35))' }} />
        </div>
      </ProductImage>
      <div className="cart-product-body">
        <div className="cart-product-heading">
          <div>
            <span className="cart-eyebrow">{item.collection || 'HAUTE COUTURE'}</span>
            <h3>{item.detailHref === null ? item.name : <Link to={item.detailHref || `/dresses/${item.id}`}>{item.name}</Link>}</h3>
          </div>
          <div className="cart-product-price"><strong>{item.unavailable ? 'Cần kiểm tra' : money(total)}</strong><small>{days} ngày x {money(item.price)}</small></div>
        </div>
        <div className="cart-tags"><span>✦ Size {item.size || 'Theo tư vấn'}</span>{item.fabric && <span>✦ {item.fabric}</span>}{item.style && <span>{item.style}</span>}{item.unavailable && <span>Mẫu không còn trong danh sách hiện có</span>}</div>
        <div className="cart-schedule">
          <p><CalendarDays size={13} /> Lịch thử và thời gian thuê sẽ được xác nhận khi đặt váy.</p>
          <small>Tiền cọc theo giá niêm yết: {money(item.deposit)}</small>
        </div>
        <div className="cart-product-notes">
          <span><CheckCircle2 size={13} /> Tình trạng váy được cập nhật từ hệ thống.</span>
          <span><CheckCircle2 size={13} /> Giá cuối cùng được xác nhận trước khi đặt thuê.</span>
        </div>
        <div className="cart-product-bottom">
          <div className="cart-days"><span>Thời gian thuê dự kiến:</span><div className="cart-stepper"><button type="button" onClick={() => onUpdate(item.id, item.days - 1)} disabled={item.days <= 1} aria-label={`Giảm ngày thuê ${item.name}`}><Minus size={13} /></button><strong>{item.days} Ngày</strong><button type="button" onClick={() => onUpdate(item.id, item.days + 1)} disabled={item.days >= 14} aria-label={`Tăng ngày thuê ${item.name}`}><Plus size={13} /></button></div><em>Giá theo số ngày xác nhận sau tư vấn</em></div>
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
        <p>Giỏ hàng được lưu trên thiết bị này; giá và tình trạng mẫu được cập nhật từ hệ thống. Để xác nhận lịch thử váy, nàng vui lòng liên hệ atelier.</p>
        <a className="cart-dialog-call" href="tel:18008998"><Phone size={18} /> Gọi 1800 8998</a>
        <p className="cart-dialog-note">Chưa có yêu cầu đặt lịch hay đơn thuê nào được gửi. Chưa phát sinh thanh toán.</p>
      </section>
    </div>
  );
}

export default function CartPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [storedItems, setStoredItems] = useState(getCart);
  const [wishlistIds, setWishlistIds] = useState(getWishlistIds);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    getDressesFromApi().then((dresses) => {
      if (!active) return;
      refreshCartWithDresses(dresses);
      setCatalog(dresses);
      setRecommendations(dresses.filter((dress) => dress.status === 'available').slice(0, 3).map((dress) => ({ ...dress, price: dress.rentPrice, deposit: dress.depositAmount, collection: dress.collectionTag, size: dress.sizes?.join(' / ') || 'Theo tư vấn', style: dress.code, detailHref: `/dresses/${dress.id}` })));
    }).catch((issue) => { if (active) setCatalogError(issue.message || 'Không cập nhật được giá váy. Vui lòng tải lại.'); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, []);
  const items = useMemo(() => storedItems.map(resolveCartItem), [storedItems]);
  const rentalFee = items.reduce((sum, item) => sum + (item.unavailable ? 0 : Number(item.price || 0) * Math.max(1, Number(item.days || 1))), 0);
  const deposit = items.reduce((sum, item) => sum + (item.unavailable ? 0 : Number(item.deposit || 0)), 0);
  const hasUnavailable = items.some((item) => item.unavailable);

  useEffect(() => {
    const refresh = () => setStoredItems(getCart());
    const refreshStorage = () => { refresh(); setWishlistIds(getWishlistIds()); };
    const refreshWishlist = () => setWishlistIds(getWishlistIds());
    window.addEventListener(WISHLIST_EVENT, refreshWishlist);
    window.addEventListener(CART_EVENT, refresh);
    window.addEventListener('storage', refreshStorage);
    return () => { window.removeEventListener(WISHLIST_EVENT, refreshWishlist); window.removeEventListener(CART_EVENT, refresh); window.removeEventListener('storage', refreshStorage); };
  }, []);

  const showMessage = (text) => { setMessage(text); window.setTimeout(() => setMessage(''), 3200); };
  const handleAdd = (dress) => showMessage(addToCart(dress) ? `Đã thêm ${dress.name} vào giỏ thuê váy.` : `${dress.name} đã có trong giỏ thuê váy.`);
  const wishlistKey = (dress) => {
    const legacyId = Number(/(?:UB|WDR)-(\d+)/.exec(dress.code || '')?.[1]);
    return wishlistIds.find((id) => String(id) === String(dress.id) || Number(id) === legacyId) ?? dress.id;
  };
  const wishlist = catalog.filter((dress) => wishlistIds.some((id) => String(id) === String(wishlistKey(dress))));
  const handleWishlist = (dress) => {
    const result = toggleWishlist(wishlistKey(dress));
    setWishlistIds(result.items);
    showMessage(result.isAdded ? `Đã lưu ${dress.name} vào danh sách yêu thích.` : `Đã bỏ ${dress.name} khỏi danh sách yêu thích.`);
  };
  const isWishlisted = (id) => {
    const dress = catalog.find((item) => String(item.id) === String(id)) || items.find((item) => String(item.id) === String(id)) || {id};
    return wishlistIds.some((value) => String(value) === String(wishlistKey(dress)));
  };
  // One order uses a single rental window; selected days must agree across items.
  const selectedDays = [...new Set(items.map((item) => Math.max(1, Number(item.days || 1))))];
  const mismatchedDays = selectedDays.length > 1;
  const checkoutBlocked = !items.length || hasUnavailable || catalogLoading || !!catalogError || mismatchedDays;
  const handleRent = (dress) => { addToCart(dress); setSelectedProduct(dress); setIsConsultationOpen(true); };
  const handleClearCart = () => { if (!items || items.length === 0) return; clearCart(); setStoredItems([]); showMessage("Đã xóa tất cả sản phẩm khỏi giỏ thuê váy."); };

  return (
    <div className="cart-page">
      <style>{cartPageStyles}</style>
      <Header onOpenBooking={() => { setSelectedProduct(null); setIsConsultationOpen(true); }} />
      <main>
        <section className="cart-hero" aria-labelledby="cart-title">
          <span className="cart-hero-label"><Sparkles size={13} /> THUÊ VÁY CƯỚI CAO CẤP</span>
          <h1 id="cart-title">Giỏ Hàng Của Nàng</h1>
          <p>Lưu giữ những tác phẩm Haute Couture hoàn mỹ cho khoảnh khắc bước vào lễ đường vĩnh cửu.</p>
          <span className="cart-hero-rule" />
        </section>

        {catalogError && <p role="alert" className="mb-4 text-sm text-red-700">{catalogError}</p>}
        {mismatchedDays && <p role="alert" className="mb-4 text-sm text-amber-800">Các váy trong cùng đơn cần chọn cùng số ngày thuê. Vui lòng điều chỉnh trước khi đặt thuê.</p>}
        <div className="cart-content">
          <section className="cart-saved" aria-labelledby="cart-saved-title">
            <div className="cart-section-bar"><div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}><h2 id="cart-saved-title">Tác phẩm trong giỏ thuê {items.length > 0 ? `(${items.length})` : ""}</h2>{items.length > 0 && (<button type="button" onClick={handleClearCart} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "999px", backgroundColor: "#fff", border: "1px solid #e0bcbc", color: "#b84f58", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fff0f0"; e.currentTarget.style.color = "#963740"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.color = "#b84f58"; }} title="Xóa tất cả sản phẩm khỏi giỏ thuê"><Trash2 size={13} /><span>Xóa tất cả</span></button>)}</div><span><LockKeyhole size={13} /> Lịch thuê được xác nhận sau khi tư vấn</span></div>
            {items.length ? <div className="cart-items">{items.map((item) => <CartItem key={item.id} item={item} onUpdate={updateCartDays} onRemove={removeFromCart} onWishlist={handleWishlist} isWishlisted={isWishlisted(item.id)} />)}</div> : <div className="cart-empty"><ShoppingBag size={38} strokeWidth={1.3} /><h3>Giỏ thuê của nàng đang trống</h3><p>Khám phá những tuyệt tác được tuyển chọn dành riêng cho ngày trọng đại.</p><Link to="/collection">Khám phá bộ sưu tập <ArrowRight size={16} /></Link></div>}
            {wishlist.length > 0 && <div className="cart-wishlist" id="cart-wishlist"><h3><Heart size={17} fill="currentColor" /> Danh sách yêu thích ({wishlist.length})</h3><div>{wishlist.map((dress) => <div className="cart-wishlist-item" key={dress.id}><img src={dress.image} alt="" /><span>{dress.name}</span><button type="button" onClick={() => handleWishlist(dress)} aria-label={`Bỏ ${dress.name} khỏi yêu thích`}><X size={16} /></button></div>)}</div></div>}
          </section>

          <aside className="cart-aside" aria-label="Tóm tắt đơn thuê">
            <div className="cart-summary">
              <span className="cart-eyebrow">TÓM TẮT ĐƠN THUÊ & ĐẶT CỌC</span>
              <h2>Chi Phí Tạm Tính</h2>
              <div className="cart-summary-line"><span>Tổng phí thuê váy ({items.length} tác phẩm)</span><strong>{money(rentalFee)}</strong></div>
              <div className="cart-summary-line"><span>Phí giao nhận</span><strong className="cart-rose">Xác nhận sau</strong></div>
              <div className="cart-summary-subtotal"><span>Thành tiền thuê lễ phục:</span><strong>{money(rentalFee)}</strong></div>
              <div className="cart-deposit"><div><ShieldCheck size={15} /><strong>Tiền cọc theo giá niêm yết:</strong><b>{money(deposit)}</b></div><p>Điều kiện hoàn cọc sẽ được xác nhận trong đơn thuê và hợp đồng.</p></div>
              <Link
                to={`/checkout?days=${selectedDays[0] || 1}`}
                aria-disabled={checkoutBlocked}
                tabIndex={checkoutBlocked ? -1 : 0}
                onClick={(event) => { if (checkoutBlocked) event.preventDefault(); }}
                className={`cart-checkout ${checkoutBlocked ? 'opacity-50 pointer-events-none' : ''}`}
              >
                TIẾN HÀNH ĐẶT THUÊ & KÝ HỢP ĐỒNG <ArrowRight size={16} />
              </Link>
              <p className="cart-checkout-note">Xác thực số đo, chính sách đặt cọc và hợp đồng bảo chứng số.</p>
              <Link className="cart-continue" to="/collection">TIẾP TỤC KHÁM PHÁ BỘ SƯU TẬP</Link>
            </div>
            <div className="cart-promises"><h2><ShieldCheck size={19} /> CAM KẾT ĐỘC QUYỀN</h2><ul><li><strong>Hoàn cọc theo biên bản</strong><span>Showroom đối soát sau kiểm định và xử lý khoản hoàn theo hợp đồng đã ký.</span></li><li><strong>Hợp đồng điện tử ký số</strong><span>Minh bạch điều khoản, bảo vệ toàn diện quyền lợi và số đo của cô dâu.</span></li><li><strong>Bảo hiểm lỗi sợi & hạt đính</strong><span>Miễn trừ trách nhiệm với các vết dơ thông thường và hạt rơi nhẹ khi khiêu vũ.</span></li><li><strong>Đổi dáng váy miễn phí</strong><span>Được chuyển đổi mẫu váy khác cùng phân khúc trước ngày cưới 15 ngày.</span></li></ul><p>Cần hỗ trợ lựa chọn? <a href="tel:18008998"><Phone size={13} /> Hotline 1800 8998 (24/7)</a></p></div>
          </aside>
        </div>

        <section className="cart-recommendations" aria-labelledby="cart-recommend-title"><div className="cart-recommend-head"><div><span className="cart-eyebrow">RECOMMENDED FOR YOU</span><h2 id="cart-recommend-title">Có Thể Nàng Cũng Yêu Thích</h2><p>Ba mẫu váy hiện có trong bộ sưu tập UniBridal.</p></div><Link to="/collection">KHÁM PHÁ THÊM <ArrowRight size={15} /></Link></div><div className="cart-recommend-grid">{recommendations.map((dress) => <article className="cart-recommend-card" key={dress.id}><div className="cart-recommend-image"><div><img src={dress.image} alt={dress.name} /></div><div style={{ position: 'absolute', bottom: '10px', right: '12px', zIndex: 10, pointerEvents: 'none', userSelect: 'none' }} title="UniBridal Haute Couture"><img src={logoEmblemImg} alt="UniBridal Emblem" style={{ width: '36px', height: '36px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.35))' }} /></div><span>{dress.collection}</span><button type="button" aria-label={`${isWishlisted(dress.id) ? 'Bỏ' : 'Lưu'} ${dress.name} ${isWishlisted(dress.id) ? 'khỏi' : 'vào'} yêu thích`} aria-pressed={isWishlisted(dress.id)} onClick={() => handleWishlist(dress)}><Heart size={19} fill={isWishlisted(dress.id) ? 'currentColor' : 'none'} /></button></div><div className="cart-recommend-body"><div className="cart-recommend-meta"><span>{dress.style}</span><span>✦ SIZE {dress.size}</span></div><h3>{dress.name}</h3><p>Mẫu váy đang có trong bộ sưu tập UniBridal.</p><div className="cart-recommend-price"><strong>{money(dress.price)}</strong><span>/ giá niêm yết</span></div><div className="cart-recommend-actions"><button type="button" onClick={() => handleAdd(dress)}><ShoppingBag size={14} /> Thêm Vào Giỏ</button><button type="button" onClick={() => handleRent(dress)}>Liên hệ thuê</button></div></div></article>)}</div></section>
      </main>
      <Footer />
      {message && <div className="cart-toast" role="status">{message}</div>}
      {isConsultationOpen && <ConsultationDialog selectedProduct={selectedProduct} onClose={() => setIsConsultationOpen(false)} />}
    </div>
  );
}
