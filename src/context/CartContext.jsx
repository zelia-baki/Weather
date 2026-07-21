import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'nkusu_shop_cart';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        unit: product.unit,
        image: product.images?.[0] || null,
        quantity,
      }];
    });
  };

  const updateQuantity = (product_id, quantity) => {
    if (quantity <= 0) {
      removeItem(product_id);
      return;
    }
    setItems(prev => prev.map(i => i.product_id === product_id ? { ...i, quantity } : i));
  };

  const removeItem = (product_id) => {
    setItems(prev => prev.filter(i => i.product_id !== product_id));
  };

  const clearCart = () => setItems([]);

  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, updateQuantity, removeItem, clearCart, totalAmount, totalCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};