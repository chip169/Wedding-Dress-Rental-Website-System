import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWishlistIds, toggleWishlist as toggleServiceWishlist, isWishlisted, WISHLIST_EVENT } from '../services/wishlistService';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlistIds, setWishlistIds] = useState(() => getWishlistIds());

  useEffect(() => {
    const handleUpdate = () => {
      setWishlistIds(getWishlistIds());
    };
    window.addEventListener(WISHLIST_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const toggle = (id) => {
    const result = toggleServiceWishlist(id);
    setWishlistIds(getWishlistIds());
    return result;
  };

  const wishlistCount = wishlistIds.length;

  return (
    <WishlistContext.Provider value={{ wishlistIds, wishlistCount, toggleWishlist: toggle, isInWishlist: isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
