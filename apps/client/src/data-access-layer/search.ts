import { z } from 'zod';

const SearchResultSchema = z.object({
  items: z
    .array(
      z.object({
        code: z.string(),
        name: z.string(),
        brands: z.string(),
        imageUrl: z.string(),
        nutriments: z.object({
          energyKcal100g: z.number().optional(),
          proteins100g: z.number().optional(),
          fat100g: z.number().optional(),
          carbs100g: z.number().optional(),
        }),
      }),
    )
    .default([]),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  total: z.number().optional(),
});

type SearchResult = z.infer<typeof SearchResultSchema>;

export const search = async (params: string): Promise<SearchResult> => {
  if (!params) return { items: [] } as SearchResult;
  const response = await fetch(`http://127.0.0.1:3000/api/v1/search?${params}`);
  if (!response.ok) throw new Error('Failed to search');
  const json = await response.json();
  return SearchResultSchema.parse(json);
};
