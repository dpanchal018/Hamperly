import { 
  ThemeValue, 
  ColorPaletteValue, 
  PackagingValue, 
  RibbonValue, 
  RecipientValue 
} from '@/types/personalization.types';

export const THEMES = [
  { value: 'elegant', label: 'Elegant', description: 'Sophisticated and refined.' },
  { value: 'traditional', label: 'Traditional', description: 'Classic and culturally rich.' },
  { value: 'premium', label: 'Premium', description: 'Luxurious and high-end.' },
  { value: 'minimal', label: 'Minimal', description: 'Clean, modern, and simple.' },
  { value: 'festive', label: 'Festive', description: 'Bright, joyous, and celebratory.' },
  { value: 'romantic', label: 'Romantic', description: 'Soft, intimate, and loving.' }
] as const;

export const COLOR_PALETTES = [
  { value: 'gold', label: 'Gold', hex: '#D4AF37' },
  { value: 'red', label: 'Red', hex: '#E32636' },
  { value: 'pink', label: 'Pink', hex: '#FFC0CB' },
  { value: 'blue', label: 'Blue', hex: '#003366' },
  { value: 'green', label: 'Green', hex: '#008000' },
  { value: 'pastel', label: 'Pastel', hex: '#FDFD96' },
  { value: 'neutral', label: 'Neutral', hex: '#F5F5DC' }
] as const;

export const PACKAGING_OPTIONS = [
  { value: 'premium-gift-box', label: 'Premium Gift Box', icon: 'Box' },
  { value: 'hamper-basket', label: 'Hamper Basket', icon: 'ShoppingBasket' },
  { value: 'wooden-tray', label: 'Wooden Tray', icon: 'Layout' },
  { value: 'decorative-box', label: 'Decorative Box', icon: 'Package' }
] as const;

export const RIBBON_OPTIONS = [
  { value: 'gold', label: 'Gold Ribbon', colorClass: 'bg-yellow-500' },
  { value: 'red', label: 'Red Ribbon', colorClass: 'bg-red-600' },
  { value: 'white', label: 'White Ribbon', colorClass: 'bg-white' },
  { value: 'pink', label: 'Pink Ribbon', colorClass: 'bg-pink-400' },
  { value: 'satin-neutral', label: 'Satin Neutral', colorClass: 'bg-stone-300' },
  { value: 'none', label: 'No Ribbon', colorClass: 'bg-transparent' }
] as const;

export const RECIPIENT_OPTIONS = [
  { value: 'family', label: 'Family' },
  { value: 'friend', label: 'Friend' },
  { value: 'partner', label: 'Partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'corporate', label: 'Corporate' }
] as const;

export const OCCASION_RECOMMENDATIONS: Record<string, { theme: ThemeValue, colorPalette: ColorPaletteValue }> = {
  'diwali': { theme: 'traditional', colorPalette: 'gold' },
  'anniversary': { theme: 'romantic', colorPalette: 'red' },
  'corporate-gifting': { theme: 'premium', colorPalette: 'neutral' },
  'birthday': { theme: 'festive', colorPalette: 'pink' },
  'self-care': { theme: 'minimal', colorPalette: 'pastel' },
  'default': { theme: 'elegant', colorPalette: 'gold' }
};

export const DEFAULT_PERSONALIZATION = {
  theme: 'elegant' as ThemeValue,
  colorPalette: 'gold' as ColorPaletteValue,
  packaging: 'premium-gift-box' as PackagingValue,
  ribbon: 'gold' as RibbonValue,
  recipient: 'family' as RecipientValue,
  personalMessage: ''
};
