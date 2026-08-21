import { z } from 'zod';

export const ProductPlacementSchema = z.object({
  position: z.enum([
    'center', 'center-front', 'center-back',
    'left-front', 'left-back', 'left-center',
    'right-front', 'right-back', 'right-center',
    'scattered', 'grouped'
  ]),
  layer: z.number().describe('1 is front, higher is further back'),
  orientation: z.enum(['front-facing', 'angled-left', 'angled-right', 'flat', 'stacked']),
});

export const DesignProductSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  visualPriority: z.enum(['primary', 'secondary', 'supporting']),
  placement: ProductPlacementSchema,
});

export const DecorationSchema = z.object({
  type: z.string(),
  priority: z.enum(['supporting', 'background']),
});

export const DesignMessageSchema = z.object({
  text: z.string(),
  placement: z.enum(['front-right', 'front-left', 'center-front', 'tucked-in-back', 'attached-to-ribbon']),
});

export const DesignSpecificationSchema = z.object({
  version: z.string(),
  hamperId: z.string().uuid(),
  occasion: z.object({
    id: z.string(),
    name: z.string(),
  }),
  theme: z.string(),
  colorPalette: z.string(),
  container: z.object({
    type: z.string(),
  }),
  ribbon: z.object({
    style: z.string(),
  }),
  products: z.array(DesignProductSchema),
  decorations: z.array(DecorationSchema),
  message: DesignMessageSchema.optional(),
  background: z.object({
    style: z.string(),
  }),
  lighting: z.object({
    style: z.string(),
  }),
  composition: z.object({
    style: z.string(),
  }),
});

export type DesignSpecification = z.infer<typeof DesignSpecificationSchema>;

export type DesignWarning = {
  type: string;
  message: string;
};

export type GenerateDesignResult = {
  success: boolean;
  design?: DesignSpecification;
  warnings?: DesignWarning[];
  error?: string;
  status: 'GENERATED' | 'WARNING' | 'FAILED';
};

export type PromptStatus = 'GENERATED' | 'VALIDATED' | 'REFINED' | 'FAILED';

export interface PromptResult {
  version: number;
  status: PromptStatus;
  prompt: string;
  negativePrompt: string;
  warnings: string[];
}

export interface PromptRefinementRequest {
  hamperId: string;
  instruction: string;
}
