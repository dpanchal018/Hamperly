export type ThemeValue = 'elegant' | 'traditional' | 'premium' | 'minimal' | 'festive' | 'romantic';
export type ColorPaletteValue = 'gold' | 'red' | 'pink' | 'blue' | 'green' | 'pastel' | 'neutral';
export type PackagingValue = 'premium-gift-box' | 'hamper-basket' | 'wooden-tray' | 'decorative-box';
export type RibbonValue = 'gold' | 'red' | 'white' | 'pink' | 'satin-neutral' | 'none';
export type RecipientValue = 'family' | 'friend' | 'partner' | 'parent' | 'colleague' | 'corporate';

export interface PersonalizationData {
  theme: ThemeValue;
  colorPalette: ColorPaletteValue;
  packaging: PackagingValue;
  ribbon: RibbonValue;
  recipient: RecipientValue;
  personalMessage: string;
}

export interface Phase6HandoffContract {
  hamperId: string;
  occasion: {
    id: string;
    slug: string;
    name: string;
  } | null;
  products: {
    productId: string;
    quantity: number;
    unitPrice: number;
    name: string;
  }[];
  personalization: PersonalizationData;
}
