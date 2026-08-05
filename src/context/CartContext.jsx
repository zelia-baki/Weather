import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// =============================================================================
//  src/context/CartContext.jsx — remplace ton fichier actuel
//
//  Ce qui change : la quantité n'est plus un entier libre.
//
//  Chaque ligne de panier porte désormais les CONTRAINTES du produit
//  (sale_mode, min_order_qty, order_step, stock_qty). Le panier applique donc
//  les mêmes règles que le serveur, et l'acheteur ne découvre plus au moment
//  de payer que sa commande est invalide.
//
//  Mode 'lot' : la quantité est figée sur le poids du lot. On ne peut ni
//  l'augmenter ni la diminuer — seulement retirer la ligne.
// =============================================================================

const CartContext = createContext(null);
const STORAGE_KEY = 'nkusu_shop_cart';

// Les quantités sont en Numeric(12,3) côté serveur. En JS, 0.1 + 0.2 vaut
// 0.30000000000000004 : sans arrondi, une addition de 12,5 kg finit par
// produire une quantité que le serveur refuse.
const round3 = (n) => Math.round((Number(n) + Number.EPSILON) * 1000) / 1000;

/**
 * Ramène une quantité à une valeur acceptable pour ce produit :
 * au moins le minimum, sur un multiple du pas, sans dépasser le stock.
 */
const clampQuantity = (item, qty) => {
  const min = Number(item.min_order_qty) || 1;
  const step = Number(item.order_step) || 1;
  const max = item.stock_qty != null ? Number(item.stock_qty) : Infinity;

  // Un lot est indivisible : la seule quantité valable est le lot entier.
  if (item.sale_mode === 'lot') return round3(max);

  if (!Number.isFinite(qty) || qty < min) return round3(min);

  const steps = Math.round((qty - min) / step);
  return round3(Math.min(max, Math.max(min, min + steps * step)));
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      // Un panier enregistré avant cette version n'a pas les contraintes.
      // On le repart de zéro plutôt que de manipuler des lignes incomplètes.
      return Array.isArray(parsed) && parsed.every(i => i.sale_mode) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* quota dépassé ou mode privé : le panier reste en mémoire */
    }
  }, [items]);

  const addItem = (product, quantity) => {
    const line = {
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      currency: product.currency,
      unit: product.unit,
      image: product.images?.[0] || null,
      // Les contraintes voyagent avec la ligne : le panier n'a plus besoin de
      // rappeler l'API pour savoir ce qui est autorisé.
      sale_mode: product.sale_mode || 'unit',
      min_order_qty: Number(product.min_order_qty) || 1,
      order_step: Number(product.order_step) || 1,
      stock_qty: Number(product.stock_qty) || 0,
      quantity: 0,
    };

    const asked = quantity != null ? Number(quantity) : line.min_order_qty;

    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);

      if (existing) {
        // Un lot déjà au panier ne se cumule pas : il n'y en a qu'un.
        if (existing.sale_mode === 'lot') return prev;
        const next = clampQuantity(existing, existing.quantity + asked);
        return prev.map(i =>
          i.product_id === product.id ? { ...i, quantity: next } : i
        );
      }

      return [...prev, { ...line, quantity: clampQuantity(line, asked) }];
    });
  };

  const updateQuantity = (product_id, quantity) => {
    setItems(prev => {
      const item = prev.find(i => i.product_id === product_id);
      if (!item) return prev;
      if (item.sale_mode === 'lot') return prev;   // figé

      const q = Number(quantity);
      const min = Number(item.min_order_qty) || 1;
      // Descendre sous le minimum revient à retirer la ligne — c'est ce que
      // l'utilisateur veut dire en cliquant « − » sur la quantité minimale.
      if (!Number.isFinite(q) || q < min) {
        return prev.filter(i => i.product_id !== product_id);
      }
      return prev.map(i =>
        i.product_id === product_id ? { ...i, quantity: clampQuantity(i, q) } : i
      );
    });
  };

  // À utiliser sur les boutons + / − : avance d'un PAS, pas d'une unité.
  const increment = (product_id) => {
    const item = items.find(i => i.product_id === product_id);
    if (!item) return;
    updateQuantity(product_id, item.quantity + (Number(item.order_step) || 1));
  };

  const decrement = (product_id) => {
    const item = items.find(i => i.product_id === product_id);
    if (!item) return;
    updateQuantity(product_id, item.quantity - (Number(item.order_step) || 1));
  };

  const removeItem = (product_id) =>
    setItems(prev => prev.filter(i => i.product_id !== product_id));

  const clearCart = () => setItems([]);

  const canIncrease = (item) =>
    item.sale_mode !== 'lot' &&
    item.quantity + (Number(item.order_step) || 1) <= Number(item.stock_qty);

  const canDecrease = (item) =>
    item.sale_mode !== 'lot' &&
    item.quantity - (Number(item.order_step) || 1) >= Number(item.min_order_qty);

  const totalAmount = useMemo(
    () => round3(items.reduce((sum, i) => sum + i.price * i.quantity, 0)),
    [items]
  );

  // Nombre de LIGNES, pas la somme des quantités : additionner 12,5 kg et
  // 3 sachets n'a aucun sens. C'est ce compteur qui s'affiche sur l'icône.
  const totalCount = items.length;

  // Le serveur refuse un panier multi-devises. Autant le signaler dans le
  // panier plutôt qu'au moment du paiement.
  const currencies = useMemo(
    () => [...new Set(items.map(i => i.currency).filter(Boolean))],
    [items]
  );
  const hasMixedCurrency = currencies.length > 1;
  const currency = currencies[0] || 'USD';

  return (
    <CartContext.Provider value={{
      items,
      addItem, updateQuantity, increment, decrement, removeItem, clearCart,
      canIncrease, canDecrease,
      totalAmount, totalCount, currency, currencies, hasMixedCurrency,
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