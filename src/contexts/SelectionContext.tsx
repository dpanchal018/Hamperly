'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PublicProduct } from '@/services/catalog.service';
import { validateAndCalculateHamper, HamperValidationIssue, ValidatedHamperItem } from '@/actions/hamper.actions';

import { PersonalizationData } from '@/types/personalization.types';
import { DEFAULT_PERSONALIZATION } from '@/config/personalization.config';

export interface SelectedItem {
  product: PublicProduct;
  quantity: number;
  lineTotal?: number; // Added from validation
}

interface SelectionContextType {
  items: SelectedItem[];
  addItem: (product: PublicProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearSelection: () => void;
  totalItems: number;
  totalPrice: number;
  isValidating: boolean;
  issues: HamperValidationIssue[];
  personalization: PersonalizationData;
  setPersonalization: (data: Partial<PersonalizationData>) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [personalization, setPersonalizationState] = useState<PersonalizationData>(DEFAULT_PERSONALIZATION);
  const [isInitialized, setIsInitialized] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [issues, setIssues] = useState<HamperValidationIssue[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem('hamperly_selection');
    const savedPersonalization = localStorage.getItem('hamperly_personalization');
    
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (e) {
        console.error('Failed to parse selection from local storage', e);
      }
    }
    
    if (savedPersonalization) {
      try {
        setPersonalizationState(JSON.parse(savedPersonalization));
      } catch (e) {
        console.error('Failed to parse personalization from local storage', e);
      }
    }
    
    setIsInitialized(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('hamperly_selection', JSON.stringify(items));
      localStorage.setItem('hamperly_personalization', JSON.stringify(personalization));
    }
  }, [items, personalization, isInitialized]);

  const setPersonalization = useCallback((data: Partial<PersonalizationData>) => {
    setPersonalizationState(prev => ({ ...prev, ...data }));
  }, []);

  // Sync with backend validation whenever items change
  useEffect(() => {
    if (!isInitialized) return;

    const syncWithBackend = async () => {
      setIsValidating(true);
      try {
        const requestItems = items.map(i => ({ productId: i.product.id, quantity: i.quantity }));
        const response = await validateAndCalculateHamper(requestItems);
        
        setTotalPrice(response.subtotal);
        setIssues(response.issues);
        
        let needsUpdate = false;
        
        // Check if we need to update the local state to match authoritative state
        const newItems: SelectedItem[] = [];
        for (const item of items) {
          const validated = response.items.find(v => v.product.id === item.product.id);
          if (validated && validated.validatedQuantity > 0) {
            newItems.push({
              ...item,
              product: validated.product,
              quantity: validated.validatedQuantity,
              lineTotal: validated.lineTotal
            });
            // If quantity changed due to stock limits or line total wasn't set, we need to update
            if (validated.validatedQuantity !== item.quantity || validated.lineTotal !== item.lineTotal || validated.product.selling_price !== item.product.selling_price) {
              needsUpdate = true;
            }
          } else {
            // Item was removed by backend
            needsUpdate = true;
          }
        }

        if (needsUpdate || newItems.length !== items.length) {
          setItems(newItems);
        }

      } catch (error) {
        console.error('Failed to validate hamper', error);
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(syncWithBackend, 300);
    return () => clearTimeout(timeoutId);
  }, [items, isInitialized]);

  const addItem = (product: PublicProduct) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
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
    setItems(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearSelection = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearSelection,
    totalItems,
    totalPrice,
    isValidating,
    issues,
    personalization,
    setPersonalization
  };

  return (
    <SelectionContext.Provider value={value}>
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

