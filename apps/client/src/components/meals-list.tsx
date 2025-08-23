import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type SearchItem } from '../data-access-layer/search.ts';
import { ProductSearch } from './product-search.tsx';
import { addMealItem, listMealsByDate, type MealItem } from '../data-access-layer/meals.ts';
import { type MealKey } from '../types/meals.ts';

export const MealsList = () => {
  const mealOrder: readonly MealKey[] = ['breakfast', 'second-breakfast', 'lunch', 'snack', 'dinner'];

  const mealLabels: Record<MealKey, string> = {
    breakfast: 'Śniadanie',
    'second-breakfast': 'II śniadanie',
    lunch: 'Obiad',
    snack: 'Przekąska',
    dinner: 'Kolacja',
  } as const;

  const queryClient = useQueryClient();

  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const { data: mealsData } = useQuery({
    queryKey: ['meals', today],
    queryFn: () => listMealsByDate(today),
  });

  const meals: Record<MealKey, SearchItem[]> = useMemo(() => {
    const grouped: Record<MealKey, (SearchItem & { amount?: number; measure?: string })[]> = {
      breakfast: [],
      'second-breakfast': [],
      lunch: [],
      snack: [],
      dinner: [],
    };
    (mealsData?.items ?? []).forEach((row: MealItem) => {
      const mk = row.mealType as MealKey;
      const item: SearchItem = {
        code: row.id,
        name: row.productName,
        brands: row.productBrands ?? '',
        nutriments: {
          energyKcal100g: row.productEnergyKcal,
          proteins100g: row.productProteins100g,
          fat100g: row.productFat100g,
          carbs100g: row.productCarbs100g,
        },
        productQuantity: row.productQuantity,
        productQuantityUnit: row.productQuantityUnit,
      };
      grouped[mk].push(item);
    });
    return grouped;
  }, [mealsData]);

  const [activeMeal, setActiveMeal] = useState<MealKey | null>(null);

  const mutation = useMutation({
    mutationFn: ({ meal, item }: { meal: MealKey; item: SearchItem }) =>
      addMealItem({
        mealType: meal,
        date: today,
        productName: item.name,
        productBrands: item.brands || null,
        productEnergyKcal: item.nutriments.energyKcal100g ?? 0,
        productProteins100g: item.nutriments.proteins100g ?? 0,
        productFat100g: item.nutriments.fat100g ?? 0,
        productCarbs100g: item.nutriments.carbs100g ?? 0,
        productQuantity: item.productQuantity ?? 0,
        productQuantityUnit: item.productQuantityUnit ?? '',
      }),
    onMutate: async ({ meal, item }) => {
      setActiveMeal(null);
      await queryClient.cancelQueries({ queryKey: ['meals', today] });
      const prev = queryClient.getQueryData<{ items: MealItem[] }>(['meals', today]);
      queryClient.setQueryData<{ items: MealItem[] }>(['meals', today], (old) => {
        const items = Array.isArray(old?.items) ? old.items.slice() : [];
        items.push({
          id: `optimistic-${Math.random().toString(36).slice(2)}`,
          date: today,
          mealType: meal,
          productName: item.name,
          productBrands: item.brands || null,
          productEnergyKcal: item.nutriments.energyKcal100g ?? 0,
          productProteins100g: item.nutriments.proteins100g ?? 0,
          productFat100g: item.nutriments.fat100g ?? 0,
          productCarbs100g: item.nutriments.carbs100g ?? 0,
          productQuantity: item.productQuantity ?? 0,
          productQuantityUnit: item.productQuantityUnit ?? '',
        });
        return { items };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx: { prev?: { items: MealItem[] } } | undefined) => {
      if (ctx?.prev) queryClient.setQueryData(['meals', today], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', today] });
    },
  });

  const handleAddItem = (meal: MealKey, item: SearchItem) => {
    mutation.mutate({ meal, item });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="text-sm text-gray-600">
        Data: <span className="font-medium text-gray-900">{today}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {mealOrder.map((mealKey) => (
          <div key={mealKey} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{mealLabels[mealKey]}</h2>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-xl leading-none"
                aria-label={`Dodaj do ${mealLabels[mealKey]}`}
                onClick={() => setActiveMeal(mealKey)}
              >
                +
              </button>
            </div>

            <ul className="mt-3 space-y-2">
              {meals[mealKey].length === 0 && <li className="text-sm text-gray-500">Brak produktów</li>}
              {meals[mealKey].map((item) => (
                <li key={item.code} className="flex items-center gap-3 rounded border p-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{item.name || 'Bez nazwy'}</div>
                    <div className="truncate text-xs text-gray-600">{item.brands}</div>
                    {item.productQuantity != null && item.productQuantityUnit != null && (
                      <div className="truncate text-xs text-gray-600">
                        {item.productQuantity} {item.productQuantityUnit}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {activeMeal === mealKey && (
              <div className="mt-4 rounded border bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium">Dodaj produkt</div>
                  <button className="text-sm text-gray-600 hover:text-gray-900" onClick={() => setActiveMeal(null)}>
                    Zamknij
                  </button>
                </div>
                <ProductSearch onSelect={(item) => handleAddItem(mealKey, item)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
