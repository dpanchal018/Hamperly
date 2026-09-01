'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PublicProduct } from '@/services/catalog.service';
import { validateAndCalculateHamper, HamperValidationIssue } from '@/actions/hamper.actions';
import { PersonalizationData } from '@/types/personalization.types';
import { DEFAULT_PERSONALIZATION } from '@/config/personalization.config';

export interface SelectedItem {
  product: PublicProduct;
  quantity: number;
  lineTotal?: number;
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
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load from local storage on mount (checking both hamperly_selection and hamperly_builder_draft_v2)
  useEffect(() => {
    let initialItems: SelectedItem[] = [];

    const savedDraft = localStorage.getItem('hamperly_builder_draft_v2');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        if (Array.isArray(parsedDraft.selectedProducts) && parsedDraft.selectedProducts.length > 0) {
          initialItems = parsedDraft.selectedProducts;
        }
      } catch (e) {
        console.error('Failed to parse builder draft', e);
      }
    }

    if (initialItems.length === 0) {
      const savedItems = localStorage.getItem('hamperly_selection');
      if (savedItems) {
        try {
          initialItems = JSON.parse(savedItems);
        } catch (e) {
          console.error('Failed to parse selection', e);
        }
      }
    }

    if (isMountedRef.current) {
      setItems(initialItems);

      const savedPersonalization = localStorage.getItem('hamperly_personalization');
      if (savedPersonalization) {
        try {
          setPersonalizationState(JSON.parse(savedPersonalization));
        } catch (e) {
          console.error('Failed to parse personalization', e);
        }
      }
      
      setIsInitialized(true);
    }
  }, []);

  // Save to local storage on change and sync with hamperly_builder_draft_v2
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('hamperly_selection', JSON.stringify(items));
      localStorage.setItem('hamperly_personalization', JSON.stringify(personalization));

      // Sync into builder draft
      const currentDraftRaw = localStorage.getItem('hamperly_builder_draft_v2');
      let currentDraft = currentDraftRaw ? JSON.parse(currentDraftRaw) : {};
      currentDraft.selectedProducts = items;
      localStorage.setItem('hamperly_builder_draft_v2', JSON.stringify(currentDraft));
    } catch (e) {
      console.error('Failed to sync selection storage', e);
    }
  }, [items, personalization, isInitialized]);

  const setPersonalization = useCallback((data: Partial<PersonalizationData>) => {
    setPersonalizationState(prev => ({ ...prev, ...data }));
  }, []);

  // Sync with backend validation whenever items change
  useEffect(() => {
    if (!isInitialized) return;
    let isActive = true;

    const syncWithBackend = async () => {
      if (!isActive || !isMountedRef.current) return;
      setIsValidating(true);
      try {
        const requestItems = items.map(i => ({ productId: i.product.id, quantity: i.quantity }));
        if (requestItems.length === 0) {
          if (isActive && isMountedRef.current) {
            setTotalPrice(0);
            setIssues([]);
          }
          return;
        }

        const response = await validateAndCalculateHamper(requestItems);
        if (!isActive || !isMountedRef.current) return;

        setTotalPrice(response.subtotal);
        setIssues(response.issues);
        
        let needsUpdate = false;
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
            if (validated.validatedQuantity !== item.quantity || validated.lineTotal !== item.lineTotal || validated.product.selling_price !== item.product.selling_price) {
              needsUpdate = true;
            }
          } else {
            needsUpdate = true;
          }
        }

        if (isActive && isMountedRef.current && (needsUpdate || newItems.length !== items.length)) {
          setItems(newItems);
        }
      } catch (error) {
        console.error('Failed to validate hamper', error);
      } finally {
        if (isActive && isMountedRef.current) {
          setIsValidating(false);
        }
      }
    };

    const timeoutId = setTimeout(syncWithBackend, 300);
    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
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
