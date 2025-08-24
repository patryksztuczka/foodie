import { useRef, useState } from 'react';
import { useBarcodeScanner } from '../hooks/use-barcode-scanner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { searchByCode, type SearchItem } from '../data-access-layer/search.ts';
import { addMealItem } from '../data-access-layer/meals.ts';
import { type MealKey } from '../types/meals.ts';

export function BarcodeScannerModal({ onClose, date, meal }: { onClose: () => void; date: string; meal: MealKey }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const seenCodesRef = useRef<Set<string>>(new Set());
  const [products, setProducts] = useState<SearchItem[]>([]);
  const queryClient = useQueryClient();

  useBarcodeScanner({
    videoRef,
    facingMode: 'environment',
    onDetected: (text) => {
      if (seenCodesRef.current.has(text)) return;
      seenCodesRef.current.add(text);
      console.log('detected', text);
      setScannedCode(text);
      mutate(text);
    },
    onReady: () => {
      setReady(true);
      setError(null);
    },
    onError: (msg) => setError(msg),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: searchByCode,
    onSuccess: (data) => {
      const newItems = (data?.items ?? []).filter((it) => !!it.code);
      setProducts((prev) => {
        const existingCodes = new Set(prev.map((p) => p.code));
        const toAdd = newItems.filter((it) => !existingCodes.has(it.code));
        return prev.concat(toAdd);
      });
    },
    onSettled: () => {
      // Allow subsequent different codes to trigger UI prompt again
      setScannedCode(null);
    },
  });

  const saveAllMutation = useMutation({
    mutationFn: async (items: SearchItem[]) => {
      await Promise.all(
        items.map((item) =>
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
        ),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', date] });
      queryClient.invalidateQueries({ queryKey: ['meals-summary'] });
    },
    onSuccess: () => {
      setProducts([]);
      onClose();
    },
  });

  const removeProduct = (code: string) => {
    setProducts((prev) => prev.filter((p) => p.code !== code));
    seenCodesRef.current.delete(code);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/90 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="text-sm font-medium">Skaner kodów kreskowych</div>
          <button
            className="rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            onClick={onClose}
          >
            Zamknij
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <div className="aspect-[4/3] overflow-hidden rounded border bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" />
          </div>
          <div className="text-sm">
            {error ? (
              <div className="text-red-600">Nie udało się uzyskać dostępu do kamery.</div>
            ) : scannedCode ? (
              <div>
                <span className="text-gray-500">Zeskanowano:</span> <span className="font-mono">{scannedCode}</span>
              </div>
            ) : isPending ? (
              <div className="text-gray-500">Wyszukiwanie…</div>
            ) : !ready ? (
              <div className="text-gray-500">Uruchamianie kamery…</div>
            ) : (
              <div className="text-gray-500">Celuj w kod kreskowy…</div>
            )}
          </div>
          {products.length > 0 && (
            <div className="mt-2">
              <div className="mb-2 text-sm font-medium">Zeskanowane produkty</div>
              <ul className="space-y-2">
                {products.map((p) => (
                  <li key={p.code} className="flex items-center justify-between rounded border p-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{p.name || 'Bez nazwy'}</div>
                      <div className="truncate text-gray-500">{p.brands}</div>
                    </div>
                    <button
                      className="ml-3 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => removeProduct(p.code)}
                    >
                      Usuń
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end">
                <button
                  className="rounded bg-gray-900 px-3 py-1 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
                  onClick={() => saveAllMutation.mutate(products)}
                  disabled={saveAllMutation.isPending || products.length === 0}
                  title={products.length === 0 ? 'Brak produktów' : 'Zapisz wszystkie'}
                >
                  {saveAllMutation.isPending ? 'Zapisywanie…' : 'Zapisz wszystkie'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
