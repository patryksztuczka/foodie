import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ScanLine } from 'lucide-react';

import { type SearchItem } from '../data-access-layer/search.ts';
import { ProductSearch } from './product-search.tsx';
import { addMealItem, listMealsByDate, type MealItem, deleteMealItem } from '../data-access-layer/meals.ts';
import { type MealKey } from '../types/meals.ts';
import { MealListRow } from './meal-list-row.tsx';

type MealsListProps = { date: string };

export const MealsList = ({ date }: MealsListProps) => {
  const mealOrder: readonly MealKey[] = ['breakfast', 'second-breakfast', 'lunch', 'snack', 'dinner'];

  const mealLabels: Record<MealKey, string> = {
    breakfast: 'Śniadanie',
    'second-breakfast': 'II śniadanie',
    lunch: 'Obiad',
    snack: 'Przekąska',
    dinner: 'Kolacja',
  } as const;

  const queryClient = useQueryClient();

  const { data: mealsData } = useQuery({
    queryKey: ['meals', date],
    queryFn: () => listMealsByDate(date),
  });

  const totals = useMemo(() => {
    const items = mealsData?.items ?? [];
    let energyKcal = 0;
    let proteins = 0;
    let fat = 0;
    let carbs = 0;

    for (const item of items) {
      const quantity = item.productQuantity ?? 0;
      const unit = (item.productQuantityUnit ?? '').toLowerCase();
      const isPerHundredUnit =
        unit === 'g' ||
        unit === 'gram' ||
        unit === 'grams' ||
        unit === 'ml' ||
        unit === 'milliliter' ||
        unit === 'milliliters';
      const factor = quantity > 0 && isPerHundredUnit ? quantity / 100 : 1;

      energyKcal += (item.productEnergyKcal ?? 0) * factor;
      proteins += (item.productProteins100g ?? 0) * factor;
      fat += (item.productFat100g ?? 0) * factor;
      carbs += (item.productCarbs100g ?? 0) * factor;
    }

    return {
      energyKcal: Math.round(energyKcal),
      proteins: Number(proteins.toFixed(1)),
      fat: Number(fat.toFixed(1)),
      carbs: Number(carbs.toFixed(1)),
    } as const;
  }, [mealsData]);

  const meals: Record<MealKey, SearchItem[]> = useMemo(() => {
    const grouped: Record<MealKey, (SearchItem & { amount?: number; measure?: string })[]> = {
      breakfast: [],
      'second-breakfast': [],
      lunch: [],
      snack: [],
      dinner: [],
    };
    (mealsData?.items ?? []).forEach((row: MealItem) => {
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
      grouped[row.mealType].push(item);
    });
    return grouped;
  }, [mealsData]);

  const [activeMeal, setActiveMeal] = useState<MealKey | null>(null);
  const [scannerOpen, setScannerOpen] = useState<MealKey | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMeal(null);
    };
    if (activeMeal) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [activeMeal]);

  const mutation = useMutation({
    mutationFn: ({ meal, item }: { meal: MealKey; item: SearchItem }) =>
      addMealItem({
        mealType: meal,
        date,
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
      await queryClient.cancelQueries({ queryKey: ['meals', date] });
      const prev = queryClient.getQueryData<{ items: MealItem[] }>(['meals', date]);
      queryClient.setQueryData<{ items: MealItem[] }>(['meals', date], (old) => {
        const items = Array.isArray(old?.items) ? old.items.slice() : [];
        items.push({
          id: `optimistic-${Math.random().toString(36).slice(2)}`,
          date,
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
      if (ctx?.prev) queryClient.setQueryData(['meals', date], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', date] });
      // also refresh week summary caches
      queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
    },
  });

  const handleAddItem = (meal: MealKey, item: SearchItem) => {
    mutation.mutate({ meal, item });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMealItem(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['meals', date] });
      const prev = queryClient.getQueryData<{ items: MealItem[] }>(['meals', date]);
      queryClient.setQueryData<{ items: MealItem[] }>(['meals', date], (old) => {
        const items = Array.isArray(old?.items) ? old.items.filter((x) => x.id !== id) : [];
        return { items };
      });
      return { prev } as { prev?: { items: MealItem[] } };
    },
    onError: (_err, _vars, ctx: { prev?: { items: MealItem[] } } | undefined) => {
      if (ctx?.prev) queryClient.setQueryData(['meals', date], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', date] });
      // also refresh week summary caches
      queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
    },
  });

  return (
    <div className="space-y-6 p-4">
      <div className="text-sm text-gray-600">
        Data: <span className="font-medium text-gray-900">{date}</span>
      </div>
      <div className="flex flex-col gap-4">
        {mealOrder.map((mealKey) => (
          <div key={mealKey} className="rounded border p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{mealLabels[mealKey]}</h2>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-xl leading-none"
                  aria-label={`Skanuj do ${mealLabels[mealKey]}`}
                  title="Skanuj kod"
                  onClick={() => setScannerOpen(mealKey)}
                >
                  <ScanLine className="h-4 w-4" />
                </button>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border text-xl leading-none"
                  aria-label={`Dodaj do ${mealLabels[mealKey]}`}
                  onClick={() => setActiveMeal(mealKey)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <ul className="mt-3 space-y-2">
              {meals[mealKey].length === 0 && <li className="text-sm text-gray-500">Brak produktów</li>}
              {meals[mealKey].map((item) => (
                <MealListRow
                  key={item.code}
                  item={item}
                  date={date}
                  onDelete={(id) => deleteMutation.mutate(String(id))}
                />
              ))}
            </ul>

            {activeMeal === mealKey && (
              <div
                ref={overlayRef}
                className="fixed inset-0 z-50 flex items-start justify-center p-4 backdrop-blur-sm"
                onMouseDown={(e) => {
                  if (e.target === overlayRef.current) setActiveMeal(null);
                }}
              >
                <div className="mx-auto mt-24 w-full max-w-2xl rounded-xl border border-gray-200 bg-white/90 shadow-2xl">
                  <div className="flex items-center justify-between border-b px-4 py-2">
                    <div className="text-sm font-medium">Dodaj do: {mealLabels[mealKey]}</div>
                    <button
                      className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => setActiveMeal(null)}
                    >
                      Zamknij
                    </button>
                  </div>
                  <div className="px-4 py-3">
                    <ProductSearch
                      autoFocus
                      hideLabel
                      onSelect={(item) => {
                        handleAddItem(mealKey, item);
                        setActiveMeal(null);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="rounded border p-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="font-medium">Razem</div>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              kcal <span className="font-semibold">{totals.energyKcal}</span>
            </div>
            <div>
              B <span className="font-semibold">{totals.proteins} g</span>
            </div>
            <div>
              T <span className="font-semibold">{totals.fat} g</span>
            </div>
            <div>
              W <span className="font-semibold">{totals.carbs} g</span>
            </div>
          </div>
        </div>
      </div>
      {scannerOpen && (
        // lazy import to avoid circular dep; inline import here for simplicity

        <ScannerLazy onClose={() => setScannerOpen(null)} date={date} meal={scannerOpen} />
      )}
    </div>
  );
};

// Lightweight wrapper to avoid top-level import churn
import { BarcodeScannerModal } from './barcode-scanner-modal.tsx';

function ScannerLazy({ onClose, date, meal }: { onClose: () => void; date: string; meal: MealKey }) {
  return <BarcodeScannerModal onClose={onClose} date={date} meal={meal} />;
}
