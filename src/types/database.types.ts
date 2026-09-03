export type UserRole = 'CUSTOMER' | 'ADMIN';
export type AdminPermission = 'manage_products' | 'manage_content' | 'manage_users' | 'manage_settings' | 'manage_orders';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type HamperStatus = 'draft' | 'generated' | 'purchased';
export type AIGenerationStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
export type AIValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  permissions?: AdminPermission[];
  is_super_admin: boolean;
  telegram_chat_id: string | null;
  receives_daily_summary: boolean;
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

export interface PreMadeHamper {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  stock_quantity: number;
  selling_price: number;
  actual_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  hamper_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

// Shape returned by list/read queries that join hamper + reviewer name
export interface ReviewWithDetails extends Review {
  hamper: { id: string; name: string; image_url: string | null };
  reviewer_name: string;
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

export type PurchaseStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
export type PaymentMode = 'CASH' | 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'OTHER';
export type SaleSource = 'WEBSITE' | 'EXHIBITION' | 'WALK_IN' | 'WHATSAPP' | 'PHONE' | 'OTHER';

export type NotificationType = 
  | 'ACCOUNT_WELCOME'
  | 'PURCHASE_CREATED'
  | 'ORDER_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_COMPLETED'
  | 'ORDER_PREPARING'
  | 'ORDER_READY'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED';

export interface Notification {
  id: string;
  customer_id: string;
  purchase_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  metadata: any | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  customer_reference: string | null;
  full_name: string;
  mobile_number: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  pincode: string | null;
    cart_state: any | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  customer_id: string;
  hamper_id: string | null;
  occasion_id: string | null;
  purchase_date: string;
  sale_source: SaleSource;
  
  subtotal: number;
  discount: number;
  final_amount: number;
  amount_paid: number;
  amount_due: number;
  
  payment_mode: PaymentMode | null;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  
  status: PurchaseStatus;
  notes: string | null;
  
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  category_snapshot: string | null;
  quantity: number;
  catalog_unit_price: number;
  actual_unit_price: number;
  line_total: number;
  created_at: string;
}
export interface StoreSettings {
  id: number;
  store_name: string;
  support_email: string | null;
  support_phone: string | null;
  store_announcement: string | null;
  enable_ai_designer: boolean;
  accept_new_orders: boolean;
  maintenance_mode: boolean;
  updated_at: string;
}

export interface SiteContent {
  section_id: string;
  content: any;
  updated_at: string;
}


export interface HeaderContent {
  logoText: string;
  navLinks: { name: string; href: string }[];
}

export interface FooterContent {
  logoText: string;
  description: string;
  socialLinks: { platform: string; url: string }[];
  columns: {
    title: string;
    links: { name: string; href: string }[];
  }[];
  contactEmail?: string;
  contactPhone?: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  hamper_id: string | null;
  product_id: string | null;
  created_at: string;
}
