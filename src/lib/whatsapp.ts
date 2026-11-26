import { getSiteContent, defaultFooterContent } from '@/services/content.service';

/** Digits-only WhatsApp number (with country code) customers message for orders and help. */
export async function getWhatsAppNumber() {
  const configured = process.env.WHATSAPP_ORDER_NUMBER;
  const raw = configured || (await getSiteContent('footer', defaultFooterContent)).contactPhone || '';
  const digits = raw.replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}
