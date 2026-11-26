// Maps real catalogue products and packaging choices to the 3D shapes the hamper studio draws.

export type ItemKind =
  | 'candle' | 'diffuser' | 'mug' | 'truffles' | 'jar' | 'flowers' | 'diya' | 'frame'
  | 'card' | 'tin' | 'soap' | 'bottle' | 'toy' | 'box' | 'eye' | 'gift';

export type ContainerKind = 'blush' | 'kraft' | 'velvet' | 'wicker';

export interface StudioItem {
  /** Stable per-copy key: productId#copyIndex */
  key: string;
  kind: ItemKind;
  /** Accent colour (label, lid, wrapper) as 0xRRGGBB */
  accent: number;
  /** Secondary colour (jar fill, box body) as 0xRRGGBB */
  fill: number;
}

const PALETTE = [0xb83d72, 0xc99a3e, 0x7fb3f0, 0x6e8b3d, 0x8e2a57, 0xe77fa0, 0x4e7a4a, 0xc9b6e4];

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/** Colour hints from scent/flavour words in the product name, else a stable palette pick */
function accentFor(name: string): number {
  const n = name.toLowerCase();
  if (/rose|pink|strawberry/.test(n)) return 0xe77fa0;
  if (/lavender|purple|berry/.test(n)) return 0x9c7fc9;
  if (/vanilla|cream|white|jasmine|milk/.test(n)) return 0xf3e3cf;
  if (/sandal|wood|coffee|arabica|walnut/.test(n)) return 0x8b5a2b;
  if (/dark|truffle|brownie/.test(n)) return 0x4a2318;
  if (/green|tea|herbal|pistachio/.test(n)) return 0x6e8b3d;
  if (/gold|brass|honey|almond|cashew/.test(n)) return 0xc99a3e;
  if (/christmas|red|crimson/.test(n)) return 0xb3202e;
  if (/blue|evil eye/.test(n)) return 0x2b5db8;
  return PALETTE[hash(name) % PALETTE.length];
}

function fillFor(name: string, category: string): number {
  const n = `${name} ${category}`.toLowerCase();
  if (/bath salt|lavender/.test(n)) return 0xc9b6e4;
  if (/granola|trail|oat/.test(n)) return 0xb8763a;
  if (/honey/.test(n)) return 0xe0a33a;
  if (/chocolate|truffle|fudge|brownie|praline/.test(n)) return 0x4a2318;
  if (/tea|chai|herbal/.test(n)) return 0x2f6b4f;
  if (/coffee/.test(n)) return 0x3b2a1e;
  if (/snack|chips|biscuit|cookie/.test(n)) return 0xe8c27a;
  if (/dry fruit|nut|walnut|almond|cashew|pistachio/.test(n)) return 0xc99a3e;
  return 0xfbeaf0;
}

export function kindForProduct(name: string, category?: string | null): ItemKind {
  const n = name.toLowerCase();
  const c = (category || '').toLowerCase();
  if (/evil ?eye|nazar/.test(n)) return 'eye';
  if (/tealight|diya/.test(n)) return 'diya';
  if (/diffuser/.test(n)) return 'diffuser';
  if (/candle/.test(n)) return 'candle';
  if (/mug|cup/.test(n)) return 'mug';
  if (/truffle|praline|assorted chocolates?$|chocolate selection/.test(n)) return 'truffles';
  if (/jar/.test(n)) return 'jar';
  if (/bouquet|flower|floral/.test(n)) return 'flowers';
  if (/frame/.test(n)) return 'frame';
  if (/card|tag set|greeting/.test(n)) return 'card';
  if (/\btin\b/.test(n)) return 'tin';
  if (/soap/.test(n)) return 'soap';
  if (/mist|cream|bath|spa|lotion|serum|oil/.test(n)) return 'bottle';
  if (/block|toy|rattle/.test(n) || /baby|kids/.test(c)) return 'toy';
  if (/tea|coffee|chai|sweet|mithai|fudge|biscuit|cookie|dry fruit|walnut|box|pack|candy|cake|brownie|chips|trail|chocolate/.test(n)) return 'box';
  if (/chocolates|snacks|beverages|dry fruits/.test(c)) return 'box';
  return 'gift';
}

export function studioItemsFromSelection(
  selected: { product: { id: string; name: string; categories?: { name?: string | null } | null }; quantity: number }[],
  maxShown = 12
): { items: StudioItem[]; hidden: number } {
  const items: StudioItem[] = [];
  let total = 0;
  for (const s of selected) {
    const category = s.product.categories?.name || '';
    for (let i = 0; i < s.quantity; i++) {
      total++;
      if (items.length >= maxShown) continue;
      items.push({
        key: `${s.product.id}#${i}`,
        kind: kindForProduct(s.product.name, category),
        accent: accentFor(s.product.name),
        fill: fillFor(s.product.name, category),
      });
    }
  }
  return { items, hidden: Math.max(0, total - items.length) };
}

export function containerForOption(optionName?: string | null): ContainerKind {
  const n = (optionName || '').toLowerCase();
  if (/basket|wicker|woven/.test(n)) return 'wicker';
  if (/kraft|eco/.test(n)) return 'kraft';
  if (/velvet/.test(n)) return 'velvet';
  return 'blush';
}

export function ribbonForOption(optionName: string | null | undefined, container: ContainerKind): number {
  const n = (optionName || '').toLowerCase();
  if (/gold/.test(n)) return 0xc99a3e;
  if (/red|crimson/.test(n)) return 0xb3202e;
  if (/pink|rose/.test(n)) return 0xe77fa0;
  if (/jute|twine/.test(n)) return 0xb08b5a;
  return { blush: 0xb83d72, kraft: 0x3a1230, velvet: 0xc99a3e, wicker: 0x4e7a4a }[container];
}
