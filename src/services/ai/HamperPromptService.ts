import { DesignSpecification, PromptResult, PromptStatus } from '@/types/design.types';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Product dictionary to resolve IDs to Names.
 * In a real environment, this would come from the database directly,
 * but to avoid Supabase auth issues for guests, we can fetch from a server-side DB client
 * or pass the product names directly from the action.
 */
export interface ResolvedProduct {
  id: string;
  name: string;
  quantity: number;
  placement: any;
}

export class HamperPromptService {
  /**
   * Generates a deterministic, validated image generation prompt using Gemini.
   */
  public async generateVisualPrompt(
    spec: DesignSpecification, 
    resolvedProducts: ResolvedProduct[],
    refinementRequest?: string,
    previousPrompt?: string
  ): Promise<PromptResult> {
    console.log('[HamperPromptService] Generating authoritative prompt via Gemini...');
    
    // Deterministic Validation Setup
    const requiredProductNames = resolvedProducts.map(p => p.name);

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.warn('[HamperPromptService] GOOGLE_GENERATIVE_AI_API_KEY not found. Falling back to basic prompt.');
      return this.generateBasicPrompt(spec, resolvedProducts);
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

      // Construct system instruction
      let systemPrompt = `You are an expert prompt engineer for photorealistic AI image generation (e.g. Midjourney, DALL-E, Flux).
Your job is to take a JSON specification for a luxury gift hamper and write a highly detailed, cinematic prompt.
CRITICAL PRODUCT FIDELITY RULES:
1. You MUST explicitly mention EVERY SINGLE PRODUCT provided in the list by its EXACT NAME.
2. You MUST NOT invent, add, or suggest any products that are not in the list.
3. You MUST preserve the exact quantity of each product.
4. Separate your response into two distinct sections exactly like this:
---PROMPT---
[Your detailed positive prompt here]
---NEGATIVE_PROMPT---
[Your negative constraints here]
`;

      let userContent = `Here is the authoritative hamper specification: \n${JSON.stringify({
        theme: spec.theme,
        colorPalette: spec.colorPalette,
        container: spec.container?.type,
        ribbon: spec.ribbon?.style,
        lighting: spec.lighting?.style,
        composition: spec.composition?.style,
        decorations: spec.decorations,
        message: spec.message,
        products: resolvedProducts.map(p => ({
          name: p.name,
          quantity: p.quantity,
          placement: p.placement
        }))
      }, null, 2)}`;

      if (refinementRequest && previousPrompt) {
        userContent += `\n\nTHE USER HAS REQUESTED A REFINEMENT:\n"${refinementRequest}"\n\nPlease rewrite the previous prompt to accommodate this stylistic preference. DO NOT remove any products or add new products. Preserve the exact product list above.`;
      }

      const result = await model.generateContent(`${systemPrompt}\n\n${userContent}`);
      const response = await result.response;
      const fullOutput = response.text() || '';
      
      // Parse output
      let positivePrompt = fullOutput;
      let negativePrompt = "unrelated products, missing products, deformed objects, blurry, low quality, bad composition";
      
      if (fullOutput.includes('---PROMPT---') && fullOutput.includes('---NEGATIVE_PROMPT---')) {
        const parts = fullOutput.split('---NEGATIVE_PROMPT---');
        positivePrompt = parts[0].replace('---PROMPT---', '').trim();
        negativePrompt = parts[1].trim();
      }

      // Deterministic Validation
      const missingProducts: string[] = [];
      requiredProductNames.forEach(productName => {
        // Simple case-insensitive check to ensure the product name made it into the prompt
        if (!positivePrompt.toLowerCase().includes(productName.toLowerCase())) {
          missingProducts.push(productName);
        }
      });

      if (missingProducts.length > 0) {
        console.error(`[HamperPromptService] Validation Failed! AI omitted products: ${missingProducts.join(', ')}`);
        return {
          version: 1,
          status: 'FAILED',
          prompt: positivePrompt,
          negativePrompt: negativePrompt,
          warnings: [`Validation Failed: AI omitted the following required products: ${missingProducts.join(', ')}`]
        };
      }

      return {
        version: 1,
        status: refinementRequest ? 'REFINED' : 'VALIDATED',
        prompt: positivePrompt,
        negativePrompt: negativePrompt,
        warnings: []
      };
    } catch (error: any) {
      console.error('[HamperPromptService] Failed to generate prompt via Gemini:', error?.message || error);
      return this.generateBasicPrompt(spec, resolvedProducts);
    }
  }

  /**
   * Fallback method if OpenAI is unavailable
   */
  private generateBasicPrompt(spec: DesignSpecification, resolvedProducts: ResolvedProduct[]): PromptResult {
    const productsDesc = resolvedProducts.map(p => {
      return `${p.quantity}x ${p.name} (placed ${p.placement.position})`;
    }).join(', ');

    const prompt = `A highly detailed, photorealistic luxury gifting hamper.
Theme: ${spec.theme}.
Color Palette: ${spec.colorPalette}.
Container: ${spec.container?.type || 'Premium woven basket'}.
Ribbon: ${spec.ribbon?.style || 'None'}.
Lighting: ${spec.lighting?.style || 'Soft, cinematic studio lighting with perfect highlights'}.
Composition: ${spec.composition?.style || 'Balanced, high-end editorial product photography'}.
Contents: ${productsDesc}.
Decorations: ${spec.decorations?.map(d => d.type).join(', ') || 'Elegant ribbons and premium packing material'}.
${spec.message ? `It includes a personal message card reading: "${spec.message.text}"` : ''}
The hamper is expertly arranged, visually stunning, looks incredibly premium, and is shot with a professional 85mm lens.`;

    return {
      version: 1,
      status: 'GENERATED',
      prompt: prompt,
      negativePrompt: "unrelated products, missing products, deformed objects, blurry, low quality",
      warnings: ['Generated using fallback basic templating due to AI unavailability.']
    };
  }
}
