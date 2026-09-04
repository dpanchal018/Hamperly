'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PublicProduct } from '@/services/catalog.service';
import { CustomizationCategory } from '@/types/customization.types';
import { Occasion } from '@/types/database.types';

export interface SelectedHamperProduct {
  product: PublicProduct;
  quantity: number;
}

export interface HamperBuilderState {
  draftId: string;
  editingCartId: string | null;
  occasion: Occasion | null;
  selectedProducts: SelectedHamperProduct[];
  selectedCustomizations: Record<string, string[]>; // categoryId -> array of optionIds
  personalMessage: string;
  recipient: string;
  currentStep: number; // 1 to 5
}

interface HamperBuilderContextType {
  draftId: string;
  editingCartId: string | null;
  occasion: Occasion | null;
  selectedProducts: SelectedHamperProduct[];
  selectedCustomizations: Record<string, string[]>;
  personalMessage: string;
  recipient: string;
  currentStep: number;
  isInitialized: boolean;
  
  // Pricing
  productsSubtotal: number;
  customizationsSubtotal: number;
  totalPrice: number;
  totalProductsCount: number;

  // Actions
  setOccasion: (occasion: Occasion | null) => void;
  addProduct: (product: PublicProduct, quantity?: number) => void;
  updateProductQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  toggleCustomization: (categoryId: string, optionId: string, allowMultiple: boolean) => void;
  setPersonalMessage: (message: string) => void;
  setRecipient: (recipient: string) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  loadFromCartItem: (cartItem: any) => void;
  loadFromCartLooseItems: (cartItems: any[], allProducts: any[]) => void;
  resetBuilder: () => void;
}

const HamperBuilderContext = createContext<HamperBuilderContextType | undefined>(undefined);

const STORAGE_KEY = 'hamperly_builder_draft_v2';
const SELECTION_STORAGE_KEY = 'hamperly_selection';

export function HamperBuilderProvider({ 
  children, 
  customizationCategories = [] 
}: { 
  children: React.ReactNode;
  customizationCategories?: CustomizationCategory[];
}) {
  const [draftId, setDraftId] = useState<string>(() => `draft-${Date.now()}`);
  const [editingCartId, setEditingCartId] = useState<string | null>(null);
  const [occasion, setOccasionState] = useState<Occasion | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedHamperProduct[]>([]);
  const [selectedCustomizations, setSelectedCustomizations] = useState<Record<string, string[]>>({});
  const [personalMessage, setPersonalMessageState] = useState<string>('');
  const [recipient, setRecipientState] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // 1. Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let loadedProducts: SelectedHamperProduct[] = [];

      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.draftId) setDraftId(parsed.draftId);
        if (parsed.editingCartId) setEditingCartId(parsed.editingCartId);
        if (parsed.occasion) setOccasionState(parsed.occasion);
        if (Array.isArray(parsed.selectedProducts)) {
          loadedProducts = parsed.selectedProducts;
          setSelectedProducts(parsed.selectedProducts);
        }
        if (parsed.selectedCustomizations) setSelectedCustomizations(parsed.selectedCustomizations);
        if (parsed.personalMessage) setPersonalMessageState(parsed.personalMessage);
        if (parsed.recipient) setRecipientState(parsed.recipient);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
      }

      // If draft products are empty, check if user picked products on /products page (hamperly_selection)
      if (loadedProducts.length === 0) {
        const legacySelection = localStorage.getItem(SELECTION_STORAGE_KEY);
        if (legacySelection) {
          const parsedLegacy = JSON.parse(legacySelection);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            setSelectedProducts(parsedLegacy);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load draft from localStorage:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. Persist to local storage & sync selection storage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      const stateToSave = {
        draftId,
        editingCartId,
        occasion,
        selectedProducts,
        selectedCustomizations,
        personalMessage,
        recipient,
        currentStep
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(selectedProducts));
    } catch (e) {
      console.error('Failed to save draft to localStorage:', e);
    }
  }, [draftId, editingCartId, occasion, selectedProducts, selectedCustomizations, personalMessage, recipient, currentStep, isInitialized]);

  // Product operations
  const setOccasion = useCallback((occ: Occasion | null) => {
    setOccasionState(occ);
  }, []);

  const addProduct = useCallback((product: PublicProduct, quantity = 1) => {
    setSelectedProducts(prev => {
      const existing = prev.find(p => p.product.id === product.id);
      // NULL stock = unlimited; use Infinity as cap so Math.min always passes through
      const maxStock = product.stock_quantity ?? Infinity;
      if (existing) {
        return prev.map(p => 
          p.product.id === product.id 
            ? { ...p, quantity: Math.min(p.quantity + quantity, maxStock) }
            : p
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, maxStock) }];
    });
  }, []);

  const updateProductQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedProducts(prev => prev.filter(p => p.product.id !== productId));
      return;
    }
    setSelectedProducts(prev => prev.map(p => {
      if (p.product.id !== productId) return p;
      const maxStock = p.product.stock_quantity ?? Infinity;
      return { ...p, quantity: Math.min(quantity, maxStock) };
    }));
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.product.id !== productId));
  }, []);

  // Customization operations
  const toggleCustomization = useCallback((categoryId: string, optionId: string, allowMultiple: boolean) => {
    setSelectedCustomizations(prev => {
      const currentList = prev[categoryId] || [];
      if (allowMultiple) {
        if (currentList.includes(optionId)) {
          return { ...prev, [categoryId]: currentList.filter(id => id !== optionId) };
        } else {
          return { ...prev, [categoryId]: [...currentList, optionId] };
        }
      } else {
        return { ...prev, [categoryId]: [optionId] };
      }
    });
  }, []);

  const setPersonalMessage = useCallback((msg: string) => {
    if (msg.length <= 250) {
      setPersonalMessageState(msg);
    }
  }, []);

  const setRecipient = useCallback((rec: string) => {
    setRecipientState(rec);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Load an existing hamper from cart item to edit
  const loadFromCartItem = useCallback((cartItem: any) => {
    if (!cartItem) return;
    setEditingCartId(cartItem.id);
    setDraftId(cartItem.id);
    if (cartItem.occasion) {
      setOccasionState({
        id: cartItem.occasion.id,
        name: cartItem.occasion.name,
        slug: cartItem.occasion.slug || '',
        description: null,
        image_url: null,
        is_active: true,
        display_order: 1,
        parent_id: null,
        occasion_type: 'GENERAL',
        created_at: '',
        updated_at: ''
      });
    }

    if (Array.isArray(cartItem.products)) {
      const reconstructed: SelectedHamperProduct[] = cartItem.products.map((p: any) => ({
        product: {
          id: p.id,
          name: p.name,
          slug: '',
          description: null,
          category_id: '',
          category: null,
          stock_quantity: 99,
          status: 'active' as any,
          selling_price: p.price,
          created_at: '',
          updated_at: '',
          primary_image_url: p.imageUrl
        },
        quantity: p.quantity
      }));
      setSelectedProducts(reconstructed);
    }

    if (Array.isArray(cartItem.customizations)) {
      const mappedCustomizations: Record<string, string[]> = {};
      cartItem.customizations.forEach((c: any) => {
        if (!mappedCustomizations[c.categoryId]) mappedCustomizations[c.categoryId] = [];
        mappedCustomizations[c.categoryId].push(c.optionId);
      });
      setSelectedCustomizations(mappedCustomizations);
    }

    setPersonalMessageState(cartItem.personalMessage || '');
    setRecipientState(cartItem.recipient || '');
    setCurrentStep(5); // Land on review for quick confirmation
  }, []);

  const loadFromCartLooseItems = useCallback((cartItems: any[], allProducts: PublicProduct[]) => {
    const looseItems = cartItems.filter(i => i.itemType === 'PRODUCT');
    if (looseItems.length === 0) return;
    
    const reconstructed: SelectedHamperProduct[] = looseItems.map(item => {
      const dbProduct = allProducts.find(p => p.id === item.id);
      return {
        product: dbProduct || {
          id: item.id,
          name: item.name,
          slug: '',
          description: null,
          category_id: '',
          category: null,
          stock_quantity: item.maxQuantity,
          status: 'active' as any,
          selling_price: item.price,
          created_at: '',
          updated_at: '',
          primary_image_url: item.imageUrl
        },
        quantity: item.quantity
      };
    });
    
    setSelectedProducts(prev => {
      // Merge with existing avoiding duplicates
      const existingIds = new Set(prev.map(p => p.product.id));
      const newItems = reconstructed.filter(r => !existingIds.has(r.product.id));
      return [...prev, ...newItems];
    });
    setCurrentStep(2); // Jump to products
  }, []);

  const resetBuilder = useCallback(() => {
    setDraftId(`draft-${Date.now()}`);
    setEditingCartId(null);
    setOccasionState(null);
    setSelectedProducts([]);
    setSelectedCustomizations({});
    setPersonalMessageState('');
    setRecipientState('');
    setCurrentStep(1);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SELECTION_STORAGE_KEY);
    } catch {}
  }, []);

  // Calculate live totals
  const productsSubtotal = selectedProducts.reduce((sum, item) => {
    return sum + (item.product.selling_price * item.quantity);
  }, 0);

  const totalProductsCount = selectedProducts.reduce((sum, item) => sum + item.quantity, 0);

  let customizationsSubtotal = 0;
  if (customizationCategories && customizationCategories.length > 0) {
    customizationCategories.forEach(cat => {
      const selectedOptionIds = selectedCustomizations[cat.id] || [];
      selectedOptionIds.forEach(optId => {
        const option = (cat.options || []).find(o => o.id === optId);
        if (option) {
          customizationsSubtotal += Number(option.price) || 0;
        }
      });
    });
  }

  const totalPrice = productsSubtotal + customizationsSubtotal;

  return (
    <HamperBuilderContext.Provider value={{
      draftId,
      editingCartId,
      occasion,
      selectedProducts,
      selectedCustomizations,
      personalMessage,
      recipient,
      currentStep,
      isInitialized,
      productsSubtotal,
      customizationsSubtotal,
      totalPrice,
      totalProductsCount,
      setOccasion,
      addProduct,
      updateProductQuantity,
      removeProduct,
      toggleCustomization,
      setPersonalMessage,
      setRecipient,
      setCurrentStep,
      nextStep,
      prevStep,
      loadFromCartItem,
      loadFromCartLooseItems,
      resetBuilder
    }}>
      {children}
    </HamperBuilderContext.Provider>
  );
}

export function useHamperBuilder() {
  const context = useContext(HamperBuilderContext);
  if (!context) {
    throw new Error('useHamperBuilder must be used within a HamperBuilderProvider');
  }
  return context;
}
