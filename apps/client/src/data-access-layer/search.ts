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

export const searchByCode = async (code: string): Promise<SearchResult> => {
  if (!code) return { items: [] } as SearchResult;
  const params = new URLSearchParams({ code }).toString();
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/search/code?${params}`);
  if (!response.ok) throw new Error('Failed to search by code');
  const json = await response.json();
  return SearchResultSchema.parse(json);
};
