export type UserRole = 'CUSTOMER' | 'ADMIN';
export type AdminPermission = 'manage_products' | 'manage_content' | 'manage_users' | 'manage_settings' | 'manage_orders';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type HamperStatus = 'draft' | 'generated' | 'purchased';
export type AIGenerationStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
export type AIValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** 
 * Cart item type — determines which inventory pool is deducted at checkout:
 * PRE_MADE       → deducts from hampers.stock_quantity
 * CUSTOM         → deducts per-product from products.stock_quantity
 * STANDALONE     → deducts from products.stock_quantity (single product, no bundle)
 */
export type CartItemType = 'PRE_MADE' | 'CUSTOM' | 'STANDALONE_PRODUCT';

/** Occasion top-level families */
export type OccasionType =
  | 'FESTIVAL'
  | 'CORPORATE'
  | 'WEDDING'
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'MILESTONE'
  | 'BABY_SHOWER'
  | 'JUST_BECAUSE'
  | 'GENERAL';

// ─────────────────────────────────────────────
// LOOKUP TABLES (Admin-extensible, no code changes needed)
// ─────────────────────────────────────────────

/** Admin-managed gender lookup (MALE | FEMALE | UNISEX | KIDS | ...) */
export interface Gender {
  id: number;
  name: string;
}

/**
 * Admin-managed recipient tags (Wife, Husband, Boss, Baby, etc.)
 * Fully extensible through Admin UI without code changes.
 */
export interface RecipientTag {
  id: number;
  name: string;
}

/** Admin-managed packaging type lookup (Base Box | Potli | Basket | ...) */
export interface PackagingType {
  id: number;
  name: string;
}

// ─────────────────────────────────────────────
// CORE ENTITIES
// ─────────────────────────────────────────────

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

/**
 * Occasion — supports hierarchical taxonomy via parent_id.
 * Top-level: Festivals, Corporate, Wedding, etc.
 * Child-level: Mehendi (under Wedding), Diwali (under Festivals), etc.
 */
export interface Occasion {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  /** Self-referencing FK — null means this is a top-level occasion */
  parent_id: string | null;
  /** Broad family this occasion belongs to */
  occasion_type: OccasionType;
  created_at: string;
  updated_at: string;
}

/** Occasion with its parent resolved (used in nested Admin tree views) */
export interface OccasionWithParent extends Occasion {
  parent: Occasion | null;
  children?: Occasion[];
}

// Note: Cost and Margin are NOT in this type to enforce security at the type level
export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  /** NULL = unlimited stock. 0 = out of stock. */
  stock_quantity: number | null;
  status: ProductStatus;
  selling_price: number;
  /** Unique Stock Keeping Unit — DB-enforced unique constraint */
  sku: string | null;
  gender_id: number | null;
  is_customizable: boolean;
  min_quantity: number;
  weight_grams: number | null;
  /** Stored as 'LxWxH' string e.g. '20x15x10' */
  dimensions_cm: string | null;
  /** Free-form search/filter tags */
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Public-facing product shape returned by storefront catalog queries.
 * Extends core Product but makes new Phase-1 columns optional so DB rows
 * created before the migration remain fully compatible.
 * `status` is omitted — only active products are returned by the catalog service.
 */
export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  selling_price: number;
  /** NULL = unlimited stock. 0 = out of stock. */
  stock_quantity: number | null;
  created_at: string;
  updated_at: string;
  /** Joined fields from catalog.service queries */
  primary_image_url: string | null;
  category: { name: string; slug: string } | null;
  // Phase 1 new columns — optional for backwards compatibility
  sku?: string | null;
  gender_id?: number | null;
  is_customizable?: boolean;
  min_quantity?: number;
  weight_grams?: number | null;
  dimensions_cm?: string | null;
  tags?: string[] | null;
  product_occasions?: { occasions: { name: string } }[];
}

/** Product enriched with joined lookup data for display */
export interface ProductWithDetails extends Product {
  gender: Gender | null;
  recipient_tags: RecipientTag[];
  occasions: Occasion[];
  images: ProductImage[];
  category: Category | null;
}

// Admin only
export interface ProductPricing {
  product_id: string;
  cost_price: number;
  target_margin: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

/**
 * Junction table: Product ↔ RecipientTag (Many-to-Many)
 * Enables filtering "show me products suitable for Wife"
 */
export interface ProductRecipientTag {
  product_id: string;
  recipient_tag_id: number;
}

/**
 * Junction table: Product ↔ Occasion (Many-to-Many)
 * One product (e.g. Scented Candle) can appear across Diwali, Christmas, Birthday, etc.
 */
export interface ProductOccasion {
  product_id: string;
  occasion_id: string;
}

// ─────────────────────────────────────────────
// PRE-MADE HAMPERS
// ─────────────────────────────────────────────

/**
 * Pre-made Hamper — a curated, fixed bundle sold as a single unit.
 * Inventory is tracked at the hamper level (assembled boxes on a shelf).
 * NULL stock_quantity = unlimited.
 */
export interface PreMadeHamper {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  /** NULL = unlimited pre-made stock. Independent from Product inventory pool. */
  stock_quantity: number | null;
  selling_price: number;
  actual_cost: number;
  is_active: boolean;
  occasion_id: string | null;
  packaging_type_id: number | null;
  gender_id: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

/** Pre-made Hamper enriched with recipe and joined lookups */
export interface PreMadeHamperWithDetails extends PreMadeHamper {
  occasion: Occasion | null;
  packaging_type: PackagingType | null;
  gender: Gender | null;
  recipient_tags: RecipientTag[];
  /** The ordered list of products inside this hamper */
  items: HamperItemWithProduct[];
}

/**
 * Recipe row: one product inside a pre-made hamper.
 * quantity handles multiples (e.g. 3 Scrunchies).
 * is_required prevents the customer from removing this item when customizing.
 */
export interface HamperItem {
  id: string;
  hamper_id: string;
  product_id: string;
  quantity: number;
  is_required: boolean;
  min_qty: number;
  max_qty: number | null;
  sort_order: number;
  created_at: string;
}

/** HamperItem with the full Product record joined in (for "What's Inside" display) */
export interface HamperItemWithProduct extends HamperItem {
  product: Product;
}

/**
 * Product fields actually selected by getHamperById()'s recipe join —
 * a deliberate subset of Product, plus the aliased image join.
 */
export interface HamperRecipeProduct {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  stock_quantity: number | null;
  selling_price: number;
  primary_image_url: { image_url: string }[];
}

/** Recipe row shape returned by getHamperById() — narrower than HamperItemWithProduct */
export interface HamperRecipeItem extends HamperItem {
  product: HamperRecipeProduct;
}

/**
 * Exact shape returned by getHamperById(): PreMadeHamper plus the specific
 * joins that query selects (occasion name/slug, recipe items). Deliberately
 * narrower than PreMadeHamperWithDetails, which also expects packaging_type,
 * gender, and recipient_tags — none of which getHamperById() fetches.
 */
export interface HamperDetailView extends PreMadeHamper {
  occasion: { name: string; slug: string } | null;
  items: HamperRecipeItem[];
}

/** Shape returned by getPublicHampers() — PreMadeHamper plus its recipient tag ids */
export interface PublicHamper extends PreMadeHamper {
  hamper_recipient_tags: { recipient_tag_id: number }[];
}

/**
 * Junction table: Hamper ↔ RecipientTag (Many-to-Many)
 * Enables filtering "show me hampers suitable for Bridesmaid"
 */
export interface HamperRecipientTag {
  hamper_id: string;
  recipient_tag_id: number;
}

// ─────────────────────────────────────────────
// CUSTOM HAMPERS (user-built from the Hamper Builder)
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// CART (client-side state, not persisted to DB)
// ─────────────────────────────────────────────

/**
 * A single item in the customer's cart.
 * cart_item_uuid is generated client-side so multiple
 * personalized versions of the same hamper can coexist.
 */
export interface CartItem {
  cart_item_uuid: string;
  type: CartItemType;
  /** Set when type = PRE_MADE */
  hamper_id?: string;
  hamper_name?: string;
  /** Set when type = CUSTOM or PRE_MADE (after customization) */
  products?: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }>;
  /** Personalization metadata */
  custom_message?: string | null;
  occasion_id?: string | null;
  packaging_type_id?: number | null;
  quantity: number;
  /** The price the customer is paying. Server will re-validate at checkout. */
  display_price: number;
}

// ─────────────────────────────────────────────
// ORDERS & SNAPSHOTS
// ─────────────────────────────────────────────

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

/**
 * PurchaseItem — records each item in an order.
 * item_snapshot is an IMMUTABLE JSON copy of the exact state at purchase time.
 * Historical receipts are always accurate, regardless of future catalog changes.
 */
export interface PurchaseItem {
  id: string;
  purchase_id: string;
  /** FK to live product — may be null if product was soft-deleted */
  product_id: string | null;
  /** FK to live hamper — may be null if hamper was soft-deleted */
  hamper_id: string | null;
  /** PRE_MADE | CUSTOM | STANDALONE_PRODUCT */
  item_type: CartItemType;
  product_name_snapshot: string;
  category_snapshot: string | null;
  quantity: number;
  catalog_unit_price: number;
  actual_unit_price: number;
  line_total: number;
  /**
   * Immutable point-in-time snapshot frozen at checkout.
   * Shape: { name, sku, price_paid, recipe?: [...], customizations?: {...} }
   * Never mutated post-creation.
   */
  item_snapshot: Record<string, any> | null;
  created_at: string;
}

// ─────────────────────────────────────────────
// STORE CONFIG & CONTENT
// ─────────────────────────────────────────────

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

export interface ReviewWithDetails extends Review {
  hamper: { id: string; name: string; image_url: string | null };
  reviewer_name: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  hamper_id: string | null;
  product_id: string | null;
  created_at: string;
}
