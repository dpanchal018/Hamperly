const fs = require('fs');
let content = fs.readFileSync('src/contexts/CartContext.tsx', 'utf8');

// 1. Add imports
content = content.replace(
  `import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';`,
  `import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCartFromCloud, saveCartToCloud } from '@/actions/cart.actions';`
);

// 2. Modify load useEffect
const oldLoadEffect = `  // Load from local storage on mount or user change
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
  }, [storageKey, userId]);`;

const newLoadEffect = `  // Load from local storage on mount or user change
  useEffect(() => {
    async function loadCart() {
      let currentItems: CartItem[] = [];

      // 1. Load the target user's cart from local storage first (fast)
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        try {
          currentItems = JSON.parse(savedCart);
        } catch (e) {
          console.error('Failed to parse cart from local storage', e);
        }
      }

      // 2. If logged in, fetch cloud cart and merge guest cart
      if (userId !== 'guest') {
        // Fetch cloud cart
        const cloudRes = await fetchCartFromCloud();
        const cloudItems = (cloudRes.success && cloudRes.items) ? cloudRes.items : [];
        
        const mergedMap = new Map<string, CartItem>();
        // Add cloud items first
        cloudItems.forEach((item: CartItem) => mergedMap.set(item.id, item));
        
        // Add local items (if any exist before login that weren't caught by guest cart)
        currentItems.forEach(item => {
          if (!mergedMap.has(item.id)) {
             mergedMap.set(item.id, item);
          }
        });

        // Merge guest cart
        const guestCartRaw = localStorage.getItem('hamperly_cart_guest');
        if (guestCartRaw) {
          try {
            const guestItems: CartItem[] = JSON.parse(guestCartRaw);
            if (guestItems.length > 0) {
              guestItems.forEach(guestItem => {
                if (mergedMap.has(guestItem.id)) {
                  const existing = mergedMap.get(guestItem.id)!;
                  existing.quantity = Math.min(existing.quantity + guestItem.quantity, existing.maxQuantity);
                } else {
                  mergedMap.set(guestItem.id, guestItem);
                }
              });
              // Clear the guest cart after merging
              localStorage.removeItem('hamperly_cart_guest');
            }
          } catch (e) {
            console.error('Failed to parse guest cart for merging', e);
          }
        }
        
        currentItems = Array.from(mergedMap.values());
      }

      setItems(currentItems);
      setIsInitialized(true);
    }
    
    loadCart();
  }, [storageKey, userId]);`;

content = content.replace(oldLoadEffect, newLoadEffect);

// 3. Modify save useEffect
const oldSaveEffect = `  // Save to local storage on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, isInitialized, storageKey]);`;

const newSaveEffect = `  // Save to local storage & cloud on change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(storageKey, JSON.stringify(items));
      if (userId !== 'guest') {
        // Fire & forget cloud sync
        saveCartToCloud(items).catch(err => console.error('Cloud sync failed:', err));
      }
    }
  }, [items, isInitialized, storageKey, userId]);`;

content = content.replace(oldSaveEffect, newSaveEffect);

fs.writeFileSync('src/contexts/CartContext.tsx', content, 'utf8');
console.log('CartContext patched successfully!');
