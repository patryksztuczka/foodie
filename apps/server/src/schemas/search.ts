import { z } from 'zod';

export const searchResponseSchema = z.object({
  items: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      brands: z.string(),
      productQuantity: z.number().optional(),
      productQuantityUnit: z.string().optional(),
      nutriments: z.object({
        energyKcal100g: z.number().optional(),
        proteins100g: z.number().optional(),
        fat100g: z.number().optional(),
        carbs100g: z.number().optional(),
      }),
    }),
  ),
  page: z.number(),
  pageSize: z.number(),
  total: z.number().optional(),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;
