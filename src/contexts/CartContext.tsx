'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CartItem {
  id: string; // Hamper ID or Product ID
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number;
  itemType?: 'HAMPER' | 'PRODUCT'; // Default is HAMPER if undefined
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, userId = 'guest' }: { children: React.ReactNode, userId?: string }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const storageKey = `hamperly_cart_${userId}`;

  // Load from local storage on mount or user change
  useEffect(() => {
    let currentItems: CartItem[] = [];

    // 1. Load the target user's cart
    const savedCart = localStorage.getItem(storageKey);
    if (savedCart) {
      try {
        currentItems = JSON.parse(savedCart);
      } catch (e) {
        console.error('Failed to parse cart from local storage', e);
      }
    }

    // 2. If logged in, check for a guest cart to merge
    if (userId !== 'guest') {
      const guestCartRaw = localStorage.getItem('hamperly_cart_guest');
      if (guestCartRaw) {
        try {
          const guestItems: CartItem[] = JSON.parse(guestCartRaw);
          if (guestItems.length > 0) {
            const mergedMap = new Map<string, CartItem>();
            currentItems.forEach(item => mergedMap.set(item.id, item));
            
            guestItems.forEach(guestItem => {
              if (mergedMap.has(guestItem.id)) {
                const existing = mergedMap.get(guestItem.id)!;
                existing.quantity = Math.min(existing.quantity + guestItem.quantity, existing.maxQuantity);
              } else {
                mergedMap.set(guestItem.id, guestItem);
              }
            });
            
            currentItems = Array.from(mergedMap.values());
            // Clear the guest cart after merging
            localStorage.removeItem('hamperly_cart_guest');
          }
        } catch (e) {
          console.error('Failed to parse guest cart for merging', e);
        }
      }
    }

    setItems(currentItems);
    setIsInitialized(true);
  }, [storageKey, userId]);

  // Save to local storage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, isInitialized, storageKey]);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === newItem.id);
      
      if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + quantity, existingItem.maxQuantity);
        return prevItems.map(item => 
          item.id === newItem.id ? { ...item, quantity: newQuantity } : item
        );
      }
      
      return [...prevItems, { ...newItem, quantity: Math.min(quantity, newItem.maxQuantity) }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems(prevItems => {
      if (quantity < 1) {
        return prevItems.filter(item => item.id !== id);
      }
      return prevItems.map(item => {
        if (item.id === id) {
          const validQuantity = Math.min(quantity, item.maxQuantity);
          return { ...item, quantity: validQuantity };
        }
        return item;
      });
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      isCartOpen,
      setIsCartOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
