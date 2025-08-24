import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

type UseBarcodeScannerProps = {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  readonly onDetected: (text: string) => void;
  readonly facingMode?: 'environment' | 'user';
  readonly onReady?: () => void;
  readonly onError?: (message: string) => void;
};

export function useBarcodeScanner({
  videoRef,
  onDetected,
  facingMode = 'environment',
  onReady,
  onError,
}: UseBarcodeScannerProps) {
  const zxingRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    async function start() {
      if (!video) return;

      try {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints);
        zxingRef.current = reader;
        const controls: IScannerControls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
          if (result?.getText) {
            onDetected(result.getText());
          }
        });
        onReady?.();

        return () => {
          controls.stop();
        };
      } catch (err: unknown) {
        console.error(err);
        onError?.('camera_unavailable_or_permission_denied');
      }
    }

    start();
  }, [videoRef, onDetected, facingMode, onReady, onError]);
}
