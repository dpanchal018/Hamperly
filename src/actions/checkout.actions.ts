'use server';

import { createPurchase, prepareOrder, type GuestDetails } from '@/services/checkout.service';

export type { GuestDetails };

/**
 * Places the order once contact and delivery details are complete. Payment is collected
 * afterwards: the shopper shares the Order ID on WhatsApp and we send them a payment QR.
 */
export async function placeCustomerOrder(
  cartItems: any[],
  deliveryAddress?: string,
  pincode?: string,
  guestDetails?: GuestDetails,
  contactPhone?: string
): Promise<{ success: true; purchaseId: string } | { success: false; error: string }> {
  try {
    const { customer, snapshot } = await prepareOrder(cartItems, deliveryAddress, pincode, guestDetails, contactPhone);
    const purchaseId = await createPurchase(customer.id, snapshot);
    return { success: true, purchaseId };
  } catch (error: any) {
    console.error("placeCustomerOrder error:", error);
    return { success: false, error: error.message || "An unexpected error occurred while placing your order." };
  }
}
