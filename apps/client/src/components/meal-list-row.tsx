import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';

import { type SearchItem } from '../data-access-layer/search.ts';
import { updateMealConsumedQuantity } from '../data-access-layer/meals.ts';
import { useDebounce } from '../hooks/use-debounce.ts';

export function MealListRow({
  item,
  date,
  onDelete,
}: {
  item: SearchItem;
  date: string;
  onDelete: (id: string) => void;
}) {
  const queryClient = useQueryClient();

  const unit = (item.productQuantityUnit ?? '').toLowerCase();
  const isPerHundredUnit =
    unit === 'g' ||
    unit === 'gram' ||
    unit === 'grams' ||
    unit === 'ml' ||
    unit === 'milliliter' ||
    unit === 'milliliters';

  const defaultQty = item.productQuantity ?? 0;
  const [qty, setQty] = useState<number>(defaultQty);
  const debouncedQty = useDebounce(qty, 500);

  useEffect(() => {
    setQty(defaultQty);
  }, [defaultQty]);

  useEffect(() => {
    if (!isFinite(debouncedQty)) return;
    const numericId = String(item.code);
    updateMealConsumedQuantity(numericId, Number(debouncedQty))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['meals', date] });
        queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
      })
      .catch(() => {});
  }, [debouncedQty, date, item.code, queryClient]);

  const factor = isPerHundredUnit && debouncedQty > 0 ? debouncedQty / 100 : 1;
  const kcal = Math.round((item.nutriments.energyKcal100g ?? 0) * factor);
  const proteins = Number(((item.nutriments.proteins100g ?? 0) * factor).toFixed(1));
  const fat = Number(((item.nutriments.fat100g ?? 0) * factor).toFixed(1));
  const carbs = Number(((item.nutriments.carbs100g ?? 0) * factor).toFixed(1));

  return (
    <li className="flex items-center gap-3 rounded border p-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{item.name || 'Bez nazwy'}</div>
        <div className="truncate text-xs text-gray-600">{item.brands}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-700">
          <label className="text-gray-500">Ilość</label>
          <input
            type="number"
            min={0}
            step={isPerHundredUnit ? 1 : 1}
            className="w-20 rounded border px-2 py-1 text-right text-sm"
            aria-label="Ilość"
            value={Number.isFinite(qty) ? qty : ''}
            onChange={(e) => {
              const v = e.target.value.trim();
              const n = v === '' ? NaN : Number(v);
              setQty(Number.isNaN(n) ? 0 : Math.max(0, n));
            }}
          />
          <span className="text-gray-500">{item.productQuantityUnit ?? ''}</span>
        </div>
        <div className="mt-1 text-[11px] text-gray-600">
          {kcal} kcal, B {proteins} g, T {fat} g, W {carbs} g
        </div>
      </div>
      <button
        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded border text-gray-600 hover:bg-red-50 hover:text-red-600"
        aria-label={`Usuń ${item.name}`}
        title="Usuń"
        onClick={() => onDelete(String(item.code))}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
