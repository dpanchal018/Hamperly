'use server';

import { getPublicProducts, PublicProduct } from '@/services/catalog.service';

// Client-callable wrapper around getPublicProducts, used by the hamper builder
// to re-fetch the product list scoped to a chosen occasion/event.
export async function getBuilderProducts(occasionId?: string, eventId?: string): Promise<PublicProduct[]> {
  return getPublicProducts({ occasionId, eventId });
}
