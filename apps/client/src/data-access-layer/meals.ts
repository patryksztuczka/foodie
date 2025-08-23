import { z } from 'zod';

import { type MealKey } from '../types/meals.ts';

const MealContentRowSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  date: z.string(),
  mealType: z.enum(['breakfast', 'second-breakfast', 'lunch', 'snack', 'dinner']),
  productName: z.string(),
  productBrands: z.string().nullable(),
  productEnergyKcal: z.number(),
  productProteins100g: z.number(),
  productFat100g: z.number(),
  productCarbs100g: z.number(),
  productQuantity: z.number(),
  productQuantityUnit: z.string(),
});

const CreateMealItemResponseSchema = z.object({
  item: MealContentRowSchema.nullable(),
});

export type AddMealItemInput = {
  mealType: MealKey;
  date: string; // YYYY-MM-DD
  productName: string;
  productBrands?: string | null;
  productEnergyKcal: number;
  productProteins100g: number;
  productFat100g: number;
  productCarbs100g: number;
  productQuantity: number;
  productQuantityUnit: string;
};

export const addMealItem = async (input: AddMealItemInput) => {
  const response = await fetch('http://127.0.0.1:3000/api/v1/meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to save meal item');
  const json = await response.json();
  return CreateMealItemResponseSchema.parse(json);
};

const MealItemSchema = MealContentRowSchema.pick({
  id: true,
  date: true,
  mealType: true,
  productName: true,
  productBrands: true,
  productEnergyKcal: true,
  productProteins100g: true,
  productFat100g: true,
  productCarbs100g: true,
  productQuantity: true,
  productQuantityUnit: true,
});

const ListMealsResponseSchema = z.object({
  items: z.array(MealItemSchema).default([]),
});

export type MealItem = z.infer<typeof MealItemSchema>;

export const listMealsByDate = async (date: string) => {
  const usp = new URLSearchParams({ date });
  const response = await fetch(`http://127.0.0.1:3000/api/v1/meals?${usp.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch meals');
  const json = await response.json();
  return ListMealsResponseSchema.parse(json);
};

export const deleteMealItem = async (id: string): Promise<void> => {
  const response = await fetch(`http://127.0.0.1:3000/api/v1/meals/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete meal item');
};
