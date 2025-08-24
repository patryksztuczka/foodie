import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

type UseBarcodeScannerOptions = {
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
}: UseBarcodeScannerOptions) {
  const zxingRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let cleanup = () => {};

    async function start() {
      try {
        stoppedRef.current = false;

        // BarcodeDetector detection kept for future fallback if needed

        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
        } catch (err: unknown) {
          console.error(err);
          // Fallback for desktops or constrained devices
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (!el) return;
        streamRef.current = stream;

        const videoEl = el;
        (videoEl as unknown as { srcObject: MediaStream | null }).srcObject = stream;
        videoEl.playsInline = true;
        videoEl.muted = true;
        await videoEl.play();
        if (videoEl.readyState < 2 || videoEl.videoWidth === 0) {
          await new Promise<void>((resolve) => {
            const onLoaded = () => {
              videoEl.removeEventListener('loadeddata', onLoaded);
              resolve();
            };
            videoEl.addEventListener('loadeddata', onLoaded);
          });
        }

        // Try to request continuous focus/exposure if supported (best-effort)
        try {
          const track = stream.getVideoTracks?.()[0];
          const capabilities = track?.getCapabilities?.() as any;
          const advanced: Record<string, unknown>[] = [];
          if (
            capabilities?.focusMode &&
            Array.isArray(capabilities.focusMode) &&
            capabilities.focusMode.includes('continuous')
          ) {
            advanced.push({ focusMode: 'continuous' });
          }
          if (
            capabilities?.exposureMode &&
            Array.isArray(capabilities.exposureMode) &&
            capabilities.exposureMode.includes('continuous')
          ) {
            advanced.push({ exposureMode: 'continuous' });
          }
          if (advanced.length > 0) {
            await track?.applyConstraints({ advanced });
          }
        } catch {
          // ignore if not supported
        }
        onReady?.();

        // Prefer ZXing for broader compatibility (desktop + mobile)
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
        const controls: IScannerControls = await reader.decodeFromVideoDevice(undefined, videoEl, (result) => {
          if (stoppedRef.current) return;
          if (result?.getText) {
            onDetected(result.getText());
          }
        });
        cleanup = () => {
          controls.stop();
        };
        // If ZXing fails to initialize in some environments, we could add a
        // secondary BarcodeDetector fallback here later.
      } catch (err: unknown) {
        console.error(err);
        onError?.('camera_unavailable_or_permission_denied');
      }
    }

    start();

    return () => {
      stoppedRef.current = true;
      cleanup();
      zxingRef.current = null;
      const tracks = streamRef.current?.getTracks() ?? [];
      tracks.forEach((t) => t.stop());
      streamRef.current = null;
      if (el) {
        el.pause();
        (el as unknown as { srcObject: MediaStream | null }).srcObject = null;
      }
    };
  }, [videoRef, onDetected, facingMode, onReady, onError]);
}
