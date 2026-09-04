import { CustomizationCategory } from '@/types/customization.types';

export const DEFAULT_CUSTOMIZATION_CATEGORIES: CustomizationCategory[] = [
  {
    id: 'cat-packaging',
    name: 'Packaging & Box',
    description: 'Select the primary presentation container for your hamper.',
    is_required: true,
    allow_multiple: false,
    display_order: 1,
    is_active: true,
    options: [
      {
        id: 'opt-box-classic',
        category_id: 'cat-packaging',
        name: 'Classic Rigid Gift Box',
        description: 'Sturdy matte finish gift box with secure lid.',
        price: 100,
        image_url: null,
        display_order: 1,
        is_active: true,
        max_items: 6
      },
      {
        id: 'opt-box-velvet',
        category_id: 'cat-packaging',
        name: 'Premium Velvet Keepsake Box',
        description: 'Luxurious velvet-lined box designed to be cherished.',
        price: 200,
        image_url: null,
        display_order: 2,
        is_active: true,
        max_items: 8
      },
      {
        id: 'opt-box-basket',
        category_id: 'cat-packaging',
        name: 'Handcrafted Wooden Basket',
        description: 'Artisanal wicker and pine basket with handle.',
        price: 350,
        image_url: null,
        display_order: 3,
        is_active: true,
        max_items: 12
      },
      {
        id: 'opt-box-kraft',
        category_id: 'cat-packaging',
        name: 'Eco Minimalist Kraft Box',
        description: '100% recycled biodegradable earthy gift container.',
        price: 80,
        image_url: null,
        display_order: 4,
        is_active: true,
        max_items: 5
      }
    ]
  },
  {
    id: 'cat-mood',
    name: 'Mood & Style',
    description: 'Choose the visual aesthetic for styling your hamper.',
    is_required: false,
    allow_multiple: false,
    display_order: 2,
    is_active: true,
    options: [
      {
        id: 'opt-mood-elegant',
        category_id: 'cat-mood',
        name: 'Elegant & Timeless',
        description: 'Subtle ivory, gold accents, and clean symmetry.',
        price: 0,
        image_url: null,
        display_order: 1,
        is_active: true
      },
      {
        id: 'opt-mood-festive',
        category_id: 'cat-mood',
        name: 'Festive Celebration',
        description: 'Vibrant celebratory tones and joyful presentation.',
        price: 0,
        image_url: null,
        display_order: 2,
        is_active: true
      },
      {
        id: 'opt-mood-romantic',
        category_id: 'cat-mood',
        name: 'Romantic & Warm',
        description: 'Blush hues, soft textures, and intimate warmth.',
        price: 0,
        image_url: null,
        display_order: 3,
        is_active: true
      },
      {
        id: 'opt-mood-minimal',
        category_id: 'cat-mood',
        name: 'Modern Minimalist',
        description: 'Monochrome accents with sleek editorial styling.',
        price: 0,
        image_url: null,
        display_order: 4,
        is_active: true
      }
    ]
  },
  {
    id: 'cat-ribbon',
    name: 'Ribbon & Tie',
    description: 'Add a handcrafted ribbon bow to finish the packaging.',
    is_required: false,
    allow_multiple: false,
    display_order: 3,
    is_active: true,
    options: [
      {
        id: 'opt-ribbon-gold',
        category_id: 'cat-ribbon',
        name: 'Satin Gold Ribbon Bow',
        description: 'Double-sided shimmering metallic gold ribbon.',
        price: 50,
        image_url: null,
        display_order: 1,
        is_active: true
      },
      {
        id: 'opt-ribbon-red',
        category_id: 'cat-ribbon',
        name: 'Crimson Red Silk Ribbon',
        description: 'Bold royal crimson silk bow.',
        price: 50,
        image_url: null,
        display_order: 2,
        is_active: true
      },
      {
        id: 'opt-ribbon-pink',
        category_id: 'cat-ribbon',
        name: 'Rose Pink Organza Ribbon',
        description: 'Delicate sheer pastel pink ribbon.',
        price: 50,
        image_url: null,
        display_order: 3,
        is_active: true
      },
      {
        id: 'opt-ribbon-jute',
        category_id: 'cat-ribbon',
        name: 'Handwoven Natural Jute Cord',
        description: 'Rustic twine tie for an organic artisanal feel.',
        price: 30,
        image_url: null,
        display_order: 4,
        is_active: true
      },
      {
        id: 'opt-ribbon-none',
        category_id: 'cat-ribbon',
        name: 'No Ribbon (Clean Box)',
        description: 'Keep the outer box unadorned.',
        price: 0,
        image_url: null,
        display_order: 5,
        is_active: true
      }
    ]
  },
  {
    id: 'cat-card',
    name: 'Greeting Card',
    description: 'Select a premium card to carry your personal message.',
    is_required: false,
    allow_multiple: false,
    display_order: 4,
    is_active: true,
    options: [
      {
        id: 'opt-card-calligraphy',
        category_id: 'cat-card',
        name: 'Hand-Lettered Calligraphy Card',
        description: 'Heavyweight textured cardstock with bespoke lettering.',
        price: 60,
        image_url: null,
        display_order: 1,
        is_active: true
      },
      {
        id: 'opt-card-goldfoil',
        category_id: 'cat-card',
        name: 'Gold Foil Embossed Card',
        description: 'Hot-stamped gold foil design with matching envelope.',
        price: 40,
        image_url: null,
        display_order: 2,
        is_active: true
      },
      {
        id: 'opt-card-floral',
        category_id: 'cat-card',
        name: 'Botanical Illustrated Card',
        description: 'Watercolour floral design on cotton rag paper.',
        price: 40,
        image_url: null,
        display_order: 3,
        is_active: true
      },
      {
        id: 'opt-card-standard',
        category_id: 'cat-card',
        name: 'Standard Hamperly Note Card',
        description: 'Clean branded gift message card.',
        price: 0,
        image_url: null,
        display_order: 4,
        is_active: true
      }
    ]
  },
  {
    id: 'cat-finishing',
    name: 'Finishing Touches',
    description: 'Add special sensory details inside the hamper.',
    is_required: false,
    allow_multiple: true,
    display_order: 5,
    is_active: true,
    options: [
      {
        id: 'opt-finish-potpourri',
        category_id: 'cat-finishing',
        name: 'Scented Botanical Potpourri',
        description: 'Aromatic dried rose petals and cinnamon lining.',
        price: 75,
        image_url: null,
        display_order: 1,
        is_active: true
      },
      {
        id: 'opt-finish-fairylights',
        category_id: 'cat-finishing',
        name: 'Warm Fairy Lights Wrap',
        description: 'Battery-operated warm LED string lights woven inside.',
        price: 120,
        image_url: null,
        display_order: 2,
        is_active: true
      },
      {
        id: 'opt-finish-waxseal',
        category_id: 'cat-finishing',
        name: 'Custom Wax Seal Envelope',
        description: 'Hand-pressed wax seal stamp sealing your note.',
        price: 90,
        image_url: null,
        display_order: 3,
        is_active: true
      },
      {
        id: 'opt-finish-lavender',
        category_id: 'cat-finishing',
        name: 'Fragrant French Lavender Sprig',
        description: 'Fresh dried lavender sprig tucked in ribbon.',
        price: 50,
        image_url: null,
        display_order: 4,
        is_active: true
      }
    ]
  }
];
