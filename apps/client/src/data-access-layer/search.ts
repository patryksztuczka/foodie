import { z } from 'zod';

export const SearchItemSchema = z.object({
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
});

const SearchResultSchema = z.object({
  items: z.array(SearchItemSchema).default([]),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  total: z.number().optional(),
});

export type SearchItem = z.infer<typeof SearchItemSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const search = async (params: string): Promise<SearchResult> => {
  if (!params) return { items: [] } as SearchResult;
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/search?${params}`);
  if (!response.ok) throw new Error('Failed to search');
  const json = await response.json();
  return SearchResultSchema.parse(json);
};
