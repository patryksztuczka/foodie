import { z } from 'zod';
import type { SearchResponse } from '../schemas/search.ts';
import { searchResponseSchema } from '../schemas/search.ts';

const openFoodFactsNutrimentsSchema = z.object({
  'energy-kcal_100g': z.coerce.number().optional(),
  proteins_100g: z.coerce.number().optional(),
  fat_100g: z.coerce.number().optional(),
  carbohydrates_100g: z.coerce.number().optional(),
});
const openFoodFactsProductSchema = z.object({
  code: z.coerce.string().default(''),
  product_name_pl: z.string().optional(),
  product_name: z.string().optional(),
  brands: z.string().optional(),
  nutriments: openFoodFactsNutrimentsSchema.optional().default({}),
  product_quantity: z.coerce.number().optional(),
  product_quantity_unit: z.string().optional(),
});
const openFoodFactsSearchSchema = z.object({
  products: z.array(openFoodFactsProductSchema).default([]),
  count: z.coerce.number().optional(),
});

export interface SearchProductsParams {
  readonly query: string;
  readonly page: number;
  readonly pageSize: number;
  readonly signal?: AbortSignal;
}

export async function searchProducts({ query, page, pageSize, signal }: SearchProductsParams): Promise<SearchResponse> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page: String(page),
    page_size: String(pageSize),
    lc: 'pl',
  });

  const url = `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'foodie-server/0.1 (+https://foodie.local)',
    },
    signal: signal ?? AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`OpenFoodFacts upstream_error: ${response.status}`);
  }

  const raw = openFoodFactsSearchSchema.parse(await response.json());

  const items = raw.products.map((product) => {
    const code = product.code;
    const namePl = product.product_name_pl;
    const name = product.product_name;
    const brands = product.brands;
    const energyKcal100g = product.nutriments['energy-kcal_100g'];
    const proteins100g = product.nutriments.proteins_100g;
    const fat100g = product.nutriments.fat_100g;
    const carbs100g = product.nutriments.carbohydrates_100g;
    const productQuantity = product.product_quantity;
    const productQuantityUnit = product.product_quantity_unit;

    return {
      code,
      name: namePl ?? name ?? '',
      brands: brands ?? '',
      productQuantity,
      productQuantityUnit,
      nutriments: {
        energyKcal100g,
        proteins100g,
        fat100g,
        carbs100g,
      },
    };
  });

  return searchResponseSchema.parse({
    items,
    page,
    pageSize,
    total: raw.count,
  });
}
