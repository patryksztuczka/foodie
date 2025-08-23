import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { search } from '../data-access-layer/search';
import { useDebounce } from '../hooks/use-debounce';

export const MealsList = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const params = useMemo(() => {
    const usp = new URLSearchParams();
    if (debouncedQuery.trim().length >= 2) usp.set('query', debouncedQuery.trim());
    return usp.toString();
  }, [debouncedQuery]);

  const { data, isFetching, error } = useQuery({
    queryKey: ['search', params],
    queryFn: () => search(params),
    enabled: params.length > 0,
  });

  return (
    <div className="space-y-4 p-4">
      <div>
        <label htmlFor="product-search" className="block text-sm font-medium">
          Wyszukaj produkt
        </label>
        <input
          id="product-search"
          className="mt-1 w-full rounded border p-2"
          placeholder="np. jogurt, chleb, masło"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isFetching && <div>Szukanie…</div>}
      {error && <div className="text-red-600">Błąd podczas wyszukiwania</div>}

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(data?.items ?? []).map((item) => (
          <li key={item.code} className="flex items-center gap-3 rounded border p-3">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded object-cover" loading="lazy" />
            ) : (
              <div className="h-16 w-16 rounded bg-gray-100" />
            )}
            <div className="min-w-0">
              <div className="truncate font-medium">{item.name || 'Bez nazwy'}</div>
              <div className="truncate text-sm text-gray-600">{item.brands}</div>
              <div className="mt-1 text-xs text-gray-500">
                {item.nutriments.energyKcal100g != null && (
                  <span>{Math.round(item.nutriments.energyKcal100g)} kcal/100g</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
