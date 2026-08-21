'use server';

import { createClient } from '@/lib/supabase/server';
import { HamperDesignerService } from '@/services/ai/HamperDesignerService';
import { HamperPromptService, ResolvedProduct } from '@/services/ai/HamperPromptService';
import { Phase6HandoffContract } from '@/types/personalization.types';
import { GenerateDesignResult, DesignSpecification, PromptResult } from '@/types/design.types';

const designerService = new HamperDesignerService();

export async function generateHamperDesign(
  authoritativeInput: Phase6HandoffContract
): Promise<GenerateDesignResult> {
  const supabase = await createClient();

  // 1. Fetch product metadata
  const uniqueProductIds = [...new Set(authoritativeInput.products.map(p => p.productId))];
  
  if (uniqueProductIds.length === 0) {
    return { success: false, status: 'FAILED', error: 'No products provided in the design input.' };
  }

  const { data: products, error: productError } = await supabase
    .from('products')
    .select('id, name, description, category_id, status')
    .in('id', uniqueProductIds);

  if (productError) {
    console.error('Product Fetch Error in AI Agent:', productError);
    return { success: false, status: 'FAILED', error: 'Failed to verify products.' };
  }

  if (!products || products.length !== uniqueProductIds.length) {
    console.error(`Product verification mismatch. Expected ${uniqueProductIds.length}, found ${products?.length || 0}`);
    return { success: false, status: 'FAILED', error: 'One or more products could not be verified.' };
  }

  if (products.some(p => p.status !== 'active')) {
    return { success: false, status: 'FAILED', error: 'One or more selected products are inactive.' };
  }

  // 2. Generate Design Specification
  try {
    const { design, warnings } = await designerService.generateDesignSpecification(authoritativeInput, products);

    // 3. Post-generation Validation
    const isValid = designerService.validateDesignSpecification(design, authoritativeInput);
    if (!isValid) {
      return { 
        success: false, 
        status: 'FAILED', 
        error: 'AI generated an invalid specification that violated product integrity constraints.' 
      };
    }

    // 4. Save to Database (if authenticated)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Only attempt to save if the user is authenticated AND the hamperId is not a guest UUID
    if (user && !authoritativeInput.hamperId.startsWith('guest_')) {
      const { data: existingDesigns } = await supabase
        .from('ai_designs')
        .select('design_version')
        .eq('hamper_id', authoritativeInput.hamperId)
        .order('design_version', { ascending: false })
        .limit(1);

      const nextVersion = existingDesigns && existingDesigns.length > 0 ? existingDesigns[0].design_version + 1 : 1;

      const { error: dbError } = await supabase
        .from('ai_designs')
        .insert({
          hamper_id: authoritativeInput.hamperId,
          design_version: nextVersion,
          input_metadata: authoritativeInput as any,
          design_specification: design as any,
          warnings: warnings,
          generation_status: 'COMPLETED',
          validation_status: 'VALIDATED'
        });

      if (dbError) {
        console.error('Failed to save AI design:', dbError);
        // We don't fail the generation just because DB save failed for an authenticated user,
        // but we could log it. The user still gets their design back.
      }
    }

    return { 
      success: true, 
      status: warnings.length > 0 ? 'WARNING' : 'GENERATED',
      design,
      warnings 
    };

  } catch (err: any) {
    console.error('Designer Action Error:', err);
    return { success: false, status: 'FAILED', error: 'Failed to generate design.' };
  }
}

export async function generateHamperPrompt(
  hamperId: string, 
  providedSpec?: DesignSpecification
): Promise<{ success: boolean; promptResult?: PromptResult; error?: string }> {
  try {
    const supabase = await createClient();
    let spec = providedSpec;
    let designVersion = 1;
    let inputMetadata = {};
    
    // 1. Fetch the latest design spec if not provided
    if (!spec) {
      const { success, design } = await getLatestDesign(hamperId);
      if (!success || !design) {
        return { success: false, error: 'No design found to generate prompt for.' };
      }
      spec = design.design_specification as DesignSpecification;
      designVersion = design.design_version;
      inputMetadata = design.input_metadata || {};
    }

    // 1.5 Resolve Product Names from DB
    const resolvedProducts: ResolvedProduct[] = [];
    for (const p of spec.products) {
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', p.productId)
        .single();
        
      resolvedProducts.push({
        id: p.productId,
        name: product?.name || `Unknown Product (${p.productId})`,
        quantity: p.quantity,
        placement: p.placement
      });
    }

    // 2. Generate Prompt using OpenAI (with validation)
    const promptService = new HamperPromptService();
    const promptResult = await promptService.generateVisualPrompt(spec, resolvedProducts);

    // 3. Save to database using input_metadata JSONB
    if (!hamperId.startsWith('guest_')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        
        const updatedMetadata = {
          ...inputMetadata,
          negative_prompt: promptResult.negativePrompt,
          prompt_status: promptResult.status,
          warnings: promptResult.warnings,
          is_current: true
        };

        await supabase
          .from('ai_designs')
          .update({
            prompt_used: promptResult.prompt,
            image_url: null,
            input_metadata: updatedMetadata
          })
          .eq('hamper_id', hamperId)
          .eq('design_version', designVersion);
      }
    }

    return { success: true, promptResult };
  } catch (err: any) {
    console.error('Prompt Generation Error:', err);
    return { success: false, error: 'Failed to generate prompt.' };
  }
}

export async function refineHamperPrompt(
  hamperId: string,
  instruction: string
): Promise<{ success: boolean; promptResult?: PromptResult; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { success, design } = await getLatestDesign(hamperId);
    if (!success || !design) {
      return { success: false, error: 'No design found to refine.' };
    }
    
    const spec = design.design_specification as DesignSpecification;
    const oldPrompt = design.prompt_used || '';

    // Resolve Product Names from DB
    const resolvedProducts: ResolvedProduct[] = [];
    for (const p of spec.products) {
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', p.productId)
        .single();
        
      resolvedProducts.push({
        id: p.productId,
        name: product?.name || `Unknown Product (${p.productId})`,
        quantity: p.quantity,
        placement: p.placement
      });
    }

    const promptService = new HamperPromptService();
    const promptResult = await promptService.generateVisualPrompt(spec, resolvedProducts, instruction, oldPrompt);
    promptResult.version = design.design_version + 1; // Increment version

    if (!hamperId.startsWith('guest_')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        
        // Mark old version as not current
        const oldMetadata = design.input_metadata || {};
        await supabase
          .from('ai_designs')
          .update({
            input_metadata: { ...oldMetadata, is_current: false }
          })
          .eq('hamper_id', hamperId)
          .eq('design_version', design.design_version);

        // Insert new version
        const newMetadata = {
          ...oldMetadata,
          negative_prompt: promptResult.negativePrompt,
          prompt_status: promptResult.status,
          refinement_request: instruction,
          warnings: promptResult.warnings,
          is_current: true
        };

        await supabase
          .from('ai_designs')
          .insert({
            hamper_id: hamperId,
            design_version: promptResult.version,
            design_specification: spec,
            input_metadata: newMetadata,
            prompt_used: promptResult.prompt,
            warnings: promptResult.warnings
          });
      }
    }

    return { success: true, promptResult };
  } catch (err: any) {
    console.error('Prompt Refinement Error:', err);
    return { success: false, error: 'Failed to refine prompt.' };
  }
}

export async function getLatestDesign(hamperId: string): Promise<{ success: boolean, design?: any }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ai_designs')
    .select('*')
    .eq('hamper_id', hamperId)
    .order('design_version', { ascending: false })
    .limit(1)
    .single();
    
  if (error || !data) return { success: false };
  return { success: true, design: data };
}
