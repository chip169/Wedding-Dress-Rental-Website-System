import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import Header from '../../components/layout/Header';
import HeroSection from '../../components/home/HeroSection';
import SilhouetteShowcase from '../../components/home/SilhouetteShowcase';
import TrendingCollection from '../../components/home/TrendingCollection';
import RealBridesGallery from '../../components/home/RealBridesGallery';
import Footer from '../../components/layout/Footer';
import BookingModal from '../../components/common/BookingModal';
import { getWishlistIds, toggleWishlist, WISHLIST_EVENT } from '../../services/wishlistService';

export default function HomePage() {
  const location = useLocation();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState(() => getWishlistIds());
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Đồng bộ trạng thái yêu thích với toàn hệ thống
  useEffect(() => {
    const refresh = () => setWishlistedIds(getWishlistIds());
    window.addEventListener(WISHLIST_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Tự động cuộn đến mục khi URL có hash (ví dụ: /#collection, /#silhouettes, /#brides)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, [location]);

  const handleOpenBooking = (product = null) => {
    setSelectedProduct(product);
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setSelectedProduct(null);
  };

  const handleToggleWishlist = (id) => {
    const result = toggleWishlist(id);
    showToast(
      result?.isAdded
        ? 'Đã thêm váy vào danh sách yêu thích ♥'
        : 'Đã xóa váy khỏi danh sách yêu thích'
    );
  };

  const handleSelectSilhouette = (silhouette) => {
    // Scroll smoothly to trending collection with silhouette context
    const collectionElem = document.getElementById('collection');
    if (collectionElem) {
      collectionElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FDFBF7] text-[#2C2523] flex flex-col font-jakarta selection:bg-[#FCEEE9] selection:text-[#B8737D]">
      {/* 1. Header Navigation */}
      <Header
        onOpenBooking={() => handleOpenBooking(null)}
        wishlistCount={wishlistedIds.length}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 bg-[#2C2523] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#E6DAC8]/40 animate-bounce text-[13px] font-medium">
          <Sparkles className="w-4 h-4 text-[#B8737D]" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white ml-2 bg-transparent border-0 cursor-pointer p-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Main Page Content */}
      <main className="flex-1 w-full">
        {/* Section - HERO SECTION */}
        <HeroSection onOpenBooking={() => handleOpenBooking(null)} />

        {/* Section - SILHOUETTE SHOWCASE */}
        <SilhouetteShowcase onSelectSilhouette={handleSelectSilhouette} />

        {/* Section - TRENDING COLLECTION 2026 (4-COLUMN PRODUCT GRID) */}
        <TrendingCollection
          onBookProduct={(item) => handleOpenBooking(item)}
          onToggleWishlist={handleToggleWishlist}
          wishlistedIds={wishlistedIds}
        />

        {/* Section - REAL BRIDES GALLERY & TESTIMONIALS */}
        <RealBridesGallery />
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Interactive Consultation / Fitting Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        preselectedProduct={selectedProduct}
      />
    </div>
  );
}
