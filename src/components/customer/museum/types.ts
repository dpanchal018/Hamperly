export interface MuseumExhibit {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  imageUrl: string | null;
  occasionName: string | null;
  items: { productId: string; name: string; category: string | null; quantity: number }[];
  rating: number | null;
  reviewCount: number;
  /** Up to 3, each with a non-empty comment */
  reviews: { id: string; rating: number; comment: string; author: string }[];
}
