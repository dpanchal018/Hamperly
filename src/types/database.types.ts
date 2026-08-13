export type UserRole = 'CUSTOMER' | 'ADMIN';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type HamperStatus = 'draft' | 'generated' | 'purchased';
export type AIGenerationStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
export type AIValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Occasion {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Note: Cost and Margin are NOT in this type to enforce security at the type level
export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  stock_quantity: number;
  status: ProductStatus;
  selling_price: number;
  created_at: string;
  updated_at: string;
}

// Admin only
export interface ProductPricing {
  product_id: string;
  cost_price: number;
  target_margin: number;
  created_at: string;
  updated_at: string;
}

export interface CustomHamper {
  id: string;
  user_id: string | null;
  occasion_id: string;
  theme: string | null;
  color_preference: string | null;
  packaging_preference: string | null;
  recipient_type: string | null;
  custom_message: string | null;
  status: HamperStatus;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface CustomHamperItem {
  id: string;
  hamper_id: string;
  product_id: string;
  quantity: number;
  unit_price: number; // authoritative snapshot
  created_at: string;
}

export interface AIDesign {
  id: string;
  hamper_id: string;
  prompt_used: string | null;
  image_url: string | null;
  generation_status: AIGenerationStatus;
  validation_status: AIValidationStatus;
  created_at: string;
  updated_at: string;
}
