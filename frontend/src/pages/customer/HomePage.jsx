import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../../components/layout/Header';
import HeroSection from '../../components/HeroSection';
import SilhouetteShowcase from '../../components/SilhouetteShowcase';
import TrendingCollection from '../../components/TrendingCollection';
import RealBridesGallery from '../../components/RealBridesGallery';
import Footer from '../../components/layout/Footer';
import BookingModal from '../../components/common/BookingModal';

export default function HomePage() {
  const location = useLocation();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState([1, 2]);

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
    setWishlistedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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
