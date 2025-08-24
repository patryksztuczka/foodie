import type { Request, Response } from 'express';
import { z } from 'zod';

import { supabase } from '../supabase-config.js';

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

  res.status(200).json({ items });
}

const updateMealItemParamsSchema = z.object({
  id: z.string().min(1),
});

const updateMealItemBodySchema = z.object({
  productQuantity: z.number().min(0),
});

export async function updateMealItem(req: Request, res: Response): Promise<void> {
  const parsedParams = updateMealItemParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: 'invalid_params', details: z.treeifyError(parsedParams.error) });
    return;
  }

  const parsedBody = updateMealItemBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: 'invalid_body', details: z.treeifyError(parsedBody.error) });
    return;
  }

  const { id } = parsedParams.data;
  const { productQuantity } = parsedBody.data;

  const { data, error } = await supabase
    .from('meal_content')
    .update({ productQuantity })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error(error);
    res.status(502).json({ error: 'db_update_failed' });
    return;
  }

  res.status(200).json({ item: data });
}

const deleteParamsSchema = z.object({
  id: z.string().min(1),
});

export async function deleteMealItem(req: Request, res: Response): Promise<void> {
  const parsed = deleteParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_params', details: z.treeifyError(parsed.error) });
    return;
  }

  const { id } = parsed.data;
  const { error } = await supabase.from('meal_content').delete().eq('id', id);
  if (error) {
    console.error(error);
    res.status(502).json({ error: 'db_delete_failed' });
    return;
  }

  res.status(204).end();
}

const getMealsSummaryQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function listMealsSummary(req: Request, res: Response): Promise<void> {
  const parsed = getMealsSummaryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_query_parameters', details: z.treeifyError(parsed.error) });
    return;
  }

  const { from, to } = parsed.data;

  // Build inclusive date range list to ensure zeros are returned for empty days
  const toDateOnlyString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    res.status(400).json({ error: 'invalid_date_range' });
    return;
  }

  const rangeDates: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    rangeDates.push(toDateOnlyString(d));
  }

  const { data, error } = await supabase
    .from('meal_content')
    .select('date, productEnergyKcal, productQuantity, productQuantityUnit')
    .gte('date', from)
    .lte('date', to);

  if (error) {
    console.error(error);
    res.status(502).json({ error: 'db_query_failed' });
    return;
  }

  const totalsByDate = new Map<string, number>();
  for (const row of data ?? []) {
    const dateStr: string = row.date;
    const unit: string = (row.productQuantityUnit ?? '').toLowerCase();
    const quantity: number = Number(row.productQuantity ?? 0) || 0;
    const perHundredUnits = ['g', 'gram', 'grams', 'ml', 'milliliter', 'milliliters'];
    const isPerHundred = perHundredUnits.includes(unit);
    const factor = quantity > 0 && isPerHundred ? quantity / 100 : 1;
    const kcal = (Number(row.productEnergyKcal) || 0) * factor;
    totalsByDate.set(dateStr, (totalsByDate.get(dateStr) ?? 0) + kcal);
  }

  const days = rangeDates.map((d) => ({ date: d, calories: Math.round(totalsByDate.get(d) ?? 0) }));

  res.status(200).json({ days });
}
