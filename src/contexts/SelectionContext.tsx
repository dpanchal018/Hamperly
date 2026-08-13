'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicProduct } from '@/services/catalog.service';

export interface SelectedItem {
  product: PublicProduct;
  quantity: number;
}

interface SelectionContextType {
  items: SelectedItem[];
  addItem: (product: PublicProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearSelection: () => void;
  totalItems: number;
  totalPrice: number;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hamperly_selection');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse selection from local storage', e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('hamperly_selection', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = (product: PublicProduct) => {
    // Only allow in-stock products
    if (product.stock_quantity <= 0) return;

    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        // Prevent exceeding stock limit (assuming user can't select more than stock)
        if (existing.quantity >= product.stock_quantity) return prev;
        
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        // Cap at stock quantity
        const safeQuantity = Math.min(quantity, item.product.stock_quantity);
        return { ...item, quantity: safeQuantity };
      }
      return item;
    }));
  };

  const clearSelection = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  // Note: This is a frontend calculation for display only. Final price must be calculated by backend.
  const totalPrice = items.reduce((sum, item) => sum + (item.product.selling_price * item.quantity), 0);

  return (
    <SelectionContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearSelection,
      totalItems,
      totalPrice
    }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}
