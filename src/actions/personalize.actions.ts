'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  PersonalizationData, 
  Phase6HandoffContract 
} from '@/types/personalization.types';
import { 
  THEMES, 
  COLOR_PALETTES, 
  PACKAGING_OPTIONS, 
  RIBBON_OPTIONS, 
  RECIPIENT_OPTIONS 
} from '@/config/personalization.config';
import { validateAndCalculateHamper, HamperItemRequest } from './hamper.actions';

export interface GenerateHamperRequest {
  hamperId?: string; // Optional for guests who haven't saved to DB yet
  occasionId?: string; // Optional, defaults to general if not provided
  items: HamperItemRequest[];
  personalization: PersonalizationData;
}

export interface GenerateHamperResponse {
  success: boolean;
  handoffPayload?: Phase6HandoffContract;
  error?: string;
  issues?: any[];
}

export async function validatePersonalization(data: PersonalizationData): Promise<{ isValid: boolean, error?: string }> {
  // 1. Validate Enums against config
  if (!THEMES.some(t => t.value === data.theme)) return { isValid: false, error: 'Invalid theme selected.' };
  if (!COLOR_PALETTES.some(c => c.value === data.colorPalette)) return { isValid: false, error: 'Invalid color palette selected.' };
  if (!PACKAGING_OPTIONS.some(p => p.value === data.packaging)) return { isValid: false, error: 'Invalid packaging selected.' };
  if (!RIBBON_OPTIONS.some(r => r.value === data.ribbon)) return { isValid: false, error: 'Invalid ribbon selected.' };
  if (!RECIPIENT_OPTIONS.some(r => r.value === data.recipient)) return { isValid: false, error: 'Invalid recipient selected.' };

  // 2. Validate Message Size
  if (data.personalMessage && data.personalMessage.length > 250) {
    return { isValid: false, error: 'Personal message exceeds the maximum allowed length of 250 characters.' };
  }

  // 3. Basic XSS/Markup sanitization (React escapes by default, but we reject HTML tags explicitly as requested)
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(data.personalMessage);
  if (hasHtmlTags) {
    return { isValid: false, error: 'HTML markup is not allowed in the personal message.' };
  }

  return { isValid: true };
}

export async function generateHamper(request: GenerateHamperRequest): Promise<GenerateHamperResponse> {
  // 1. Validate Personalization
  const validation = await validatePersonalization(request.personalization);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  // 2. Validate current hamper/products (Pricing, Stock, Integrity)
  const hamperValidation = await validateAndCalculateHamper(request.items);
  if (hamperValidation.status === 'REVALIDATION_REQUIRED' || hamperValidation.issues.length > 0) {
    return { 
      success: false, 
      error: 'Your hamper needs to be updated. Some products may have changed in price or stock.',
      issues: hamperValidation.issues
    };
  }

  const supabase = await createClient();

  // 3. Persist Personalization (if authenticated and hamperId is provided)
  // For guests, we skip DB persistence and just generate the handoff payload
  let occasionDetails = null;

  if (request.occasionId) {
    const { data: occasionData } = await supabase
      .from('occasions')
      .select('id, slug, name')
      .eq('id', request.occasionId)
      .single();
    if (occasionData) {
      occasionDetails = occasionData;
    }
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (userId) {
    let finalHamperId = request.hamperId;

    if (!finalHamperId) {
      // Attempt to create a new hamper for the authenticated user if they don't have one
      const { data: newHamper, error: insertError } = await supabase
        .from('custom_hampers')
        .insert({
          user_id: userId,
          status: 'DRAFT',
        })
        .select('id')
        .single();

      if (!insertError && newHamper) {
        finalHamperId = newHamper.id;
      }
    }

    if (finalHamperId) {
      // Authorized persistence
      const { error: updateError } = await supabase
        .from('custom_hampers')
        .update({
          theme: request.personalization.theme,
          color_preference: request.personalization.colorPalette,
          packaging_preference: request.personalization.packaging,
          ribbon_preference: request.personalization.ribbon,
          recipient_type: request.personalization.recipient,
          custom_message: request.personalization.personalMessage,
          status: 'generated', // Move from draft to generated
          updated_at: new Date().toISOString()
        })
        .eq('id', finalHamperId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to persist personalization:', updateError);
      }
    }
  }

  // 4. Build Phase 6 Handoff Payload
  const handoffPayload: Phase6HandoffContract = {
    hamperId: request.hamperId || `guest_${crypto.randomUUID()}`,
    occasion: occasionDetails,
    products: hamperValidation.items.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.validatedQuantity,
      unitPrice: item.unitPrice
    })),
    personalization: request.personalization
  };

  return { success: true, handoffPayload };
}
