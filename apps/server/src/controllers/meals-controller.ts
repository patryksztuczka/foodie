import type { Request, Response } from 'express';
import { z } from 'zod';

import { supabase } from '../supabase-config.ts';

const mealTypeSchema = z.enum(['breakfast', 'second-breakfast', 'lunch', 'snack', 'dinner']);

const createMealItemSchema = z.object({
  mealType: mealTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  productName: z.string().default(''),
  productBrands: z.string().nullable().optional(),
  productEnergyKcal: z.number().default(0),
  productProteins100g: z.number().default(0),
  productFat100g: z.number().default(0),
  productCarbs100g: z.number().default(0),
  productQuantity: z.number().default(0),
  productQuantityUnit: z.string().default(''),
});

export async function createMealItem(req: Request, res: Response): Promise<void> {
  const parsed = createMealItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body', details: z.treeifyError(parsed.error) });
    return;
  }

  const {
    mealType,
    date,
    productName,
    productBrands,
    productEnergyKcal,
    productProteins100g,
    productFat100g,
    productCarbs100g,
    productQuantity,
    productQuantityUnit,
  } = parsed.data;

  const row = {
    mealType,
    date,
    productName,
    productBrands: productBrands ?? null,
    productEnergyKcal,
    productProteins100g,
    productFat100g,
    productCarbs100g,
    productQuantity,
    productQuantityUnit,
  };

  const { data, error } = await supabase.from('meal_content').insert(row).select().maybeSingle();

  if (error) {
    console.error(error);
    res.status(502).json({ error: 'db_insert_failed' });
    return;
  }

  res.status(201).json({ item: data });
}

const getMealsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function listMealsByDate(req: Request, res: Response): Promise<void> {
  const parsed = getMealsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_query_parameters', details: z.treeifyError(parsed.error) });
    return;
  }
  const { date } = parsed.data;

  const { data, error } = await supabase
    .from('meal_content')
    .select('*')
    .eq('date', date)
    .order('createdAt', { ascending: true });
  if (error) {
    console.error(error);
    res.status(502).json({ error: 'db_query_failed' });
    return;
  }

  const items = (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    date: row.date,
    mealType: row.mealType,
    productName: row.productName,
    productBrands: row.productBrands,
    productEnergyKcal: row.productEnergyKcal,
    productProteins100g: row.productProteins100g,
    productFat100g: row.productFat100g,
    productCarbs100g: row.productCarbs100g,
    productQuantity: row.productQuantity,
    productQuantityUnit: row.productQuantityUnit,
  }));

  res.json({ items });
}
