import { useCallback, useRef, useState } from 'react';
import { useBarcodeScanner } from '../hooks/use-barcode-scanner';

export function BarcodeScannerModal({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetected = useCallback((text: string) => {
    setCode(text);
  }, []);

  useBarcodeScanner({
    videoRef,
    onDetected: handleDetected,
    facingMode: 'environment',
    onReady: () => {
      setReady(true);
      setError(null);
    },
    onError: (msg) => setError(msg),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="mx-auto mt-24 w-full max-w-2xl rounded-xl border border-gray-200 bg-white/90 shadow-2xl"
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

        <div className="space-y-3 px-4 py-3">
          <div className="aspect-[4/3] overflow-hidden rounded border bg-black">
            <video ref={videoRef} className="h-full w-full object-cover" />
          </div>
          <div className="text-sm">
            {error ? (
              <div className="text-red-600">Nie udało się uzyskać dostępu do kamery.</div>
            ) : code ? (
              <div>
                <span className="text-gray-500">Zeskanowano:</span> <span className="font-mono">{code}</span>
              </div>
            ) : !ready ? (
              <div className="text-gray-500">Uruchamianie kamery…</div>
            ) : (
              <div className="text-gray-500">Celuj w kod kreskowy…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
