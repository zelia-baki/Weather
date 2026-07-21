import React from 'react';
import { Outlet } from 'react-router-dom';
import { CartProvider } from '../../context/CartContext';

const ShopLayout = () => {
  return (
    <CartProvider>
      <Outlet />
    </CartProvider>
  );
};

export default ShopLayout;