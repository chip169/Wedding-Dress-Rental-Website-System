import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart as addServiceCart, removeFromCart as removeServiceCart, clearCart as clearServiceCart, CART_EVENT } from '../services/cartService';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => getCart());

  useEffect(() => {
    const handleCartUpdate = () => {
      setCart(getCart());
    };
    window.addEventListener(CART_EVENT, handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);
    return () => {
      window.removeEventListener(CART_EVENT, handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  const addToCart = (product) => {
    const updated = addServiceCart(product);
    setCart(updated);
    return updated;
  };

  const removeFromCart = (id) => {
    const updated = removeServiceCart(id);
    setCart(updated);
    return updated;
  };

  const clearCart = () => {
    clearServiceCart();
    setCart([]);
  };

  const cartCount = cart.length;

  return (
    <CartContext.Provider value={{ cart, cartCount, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
