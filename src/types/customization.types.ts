export interface CustomizationOption {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  price: number; // Fixed ₹ selling price (can be 0)
  image_url?: string | null;
  display_order: number;
  is_active: boolean;
}

export interface CustomizationCategory {
  id: string;
  name: string;
  description?: string | null;
  is_required: boolean; // Required vs Optional
  allow_multiple: boolean; // Single vs Multi-select
  display_order: number;
  is_active: boolean;
  options?: CustomizationOption[];
}

export interface SelectedCustomizationDetail {
  categoryId: string;
  categoryName: string;
  optionId: string;
  optionName: string;
  price: number;
}
