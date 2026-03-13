import { useState, useRef, useCallback, useEffect } from "react";

interface HeartRateState {
  isDetecting: boolean;
  bpm: number | null;
  signal: number[];
  progress: number;
  error: string | null;
  quality: "good" | "fair" | "poor" | null;
  isPermissionDenied: boolean;
}

const SAMPLE_DURATION = 15; // seconds
const FPS = 30;

export function useHeartRateDetection() {
  const [state, setState] = useState<HeartRateState>({
    isDetecting: false,
    bpm: null,
    signal: [],
    progress: 0,
    error: null,
    quality: null,
    isPermissionDenied: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const samplesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  // Keep isDetecting in a ref so processFrame can read the latest value
  const isDetectingRef = useRef(false);

  const cleanup = useCallback(() => {
    if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    frameIdRef.current = null;
    isDetectingRef.current = false;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isDetectingRef.current) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = 64;
    canvas.height = 64;
    ctx.drawImage(video, 0, 0, 64, 64);
    const frame = ctx.getImageData(0, 0, 64, 64);

    // Extract average red channel intensity (PPG signal)
    let redSum = 0;
    let count = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      redSum += frame.data[i]; // Red channel
      count++;
    }
    const avgRed = redSum / count;
    samplesRef.current.push(avgRed);

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const progress = Math.min(100, (elapsed / SAMPLE_DURATION) * 100);

    setState((s) => ({
      ...s,
      signal: [...s.signal.slice(-100), avgRed],
      progress,
    }));

    if (elapsed >= SAMPLE_DURATION) {
      // Calculate heart rate from samples
      const bpm = calculateBPM(samplesRef.current, FPS);
      const quality =
        bpm && bpm >= 40 && bpm <= 200
          ? bpm >= 50 && bpm <= 150
            ? "good"
            : "fair"
          : "poor";

      setState((s) => ({
        ...s,
        isDetecting: false,
        bpm: quality !== "poor" ? bpm : null,
        progress: 100,
        quality,
        error:
          quality === "poor"
            ? "Could not detect reliable heart rate. Ensure your finger fully covers the camera lens with gentle pressure."
            : null,
        isPermissionDenied: false,
      }));
      cleanup();
      return;
    }

    frameIdRef.current = requestAnimationFrame(processFrame);
  }, [cleanup]);

  const startDetection = useCallback(async () => {
    // Reset state
    setState({
      isDetecting: false,
      bpm: null,
      signal: [],
      progress: 0,
      error: null,
      quality: null,
      isPermissionDenied: false,
    });

    // Guard: mediaDevices API may not exist in old Android WebViews
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState((s) => ({
        ...s,
        error:
          "Camera API is not available in this browser. Please update your app to the latest version.",
        isPermissionDenied: false,
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 64, height: 64 },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      samplesRef.current = [];
      startTimeRef.current = Date.now();
      isDetectingRef.current = true;

      setState({
        isDetecting: true,
        bpm: null,
        signal: [],
        progress: 0,
        error: null,
        quality: null,
        isPermissionDenied: false,
      });

      // Start processing after a small delay for the video to warm up
      setTimeout(() => {
        frameIdRef.current = requestAnimationFrame(processFrame);
      }, 500);
    } catch (err: any) {
      const name: string = err?.name ?? "";

      let errorMessage: string;
      let isPermissionDenied = false;

      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        isPermissionDenied = true;
        errorMessage =
          "Camera permission was denied. To fix this, go to:\nSettings → Apps → FutureMe AI → Permissions → Camera → Allow";
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        errorMessage =
          "No camera was found on this device. Heart rate detection requires a rear camera.";
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        errorMessage =
          "Camera is currently in use by another app. Please close other camera apps and try again.";
      } else if (name === "OverconstrainedError") {
        errorMessage =
          "Camera constraints could not be satisfied. Trying a fallback...";
        // Retry without constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
          }
          samplesRef.current = [];
          startTimeRef.current = Date.now();
          isDetectingRef.current = true;
          setState({
            isDetecting: true,
            bpm: null,
            signal: [],
            progress: 0,
            error: null,
            quality: null,
            isPermissionDenied: false,
          });
          setTimeout(() => {
            frameIdRef.current = requestAnimationFrame(processFrame);
          }, 500);
          return;
        } catch {
          errorMessage = "Camera could not be started. Please try again.";
        }
      } else {
        errorMessage = `Camera error: ${err?.message ?? "Unknown error"}. Please try again.`;
      }

      setState((s) => ({
        ...s,
        error: errorMessage,
        isDetecting: false,
        isPermissionDenied,
      }));
    }
  }, [processFrame]);

  const stopDetection = useCallback(() => {
    cleanup();
    setState((s) => ({ ...s, isDetecting: false, progress: 0 }));
  }, [cleanup]);

  return { ...state, startDetection, stopDetection, videoRef, canvasRef };
}

function calculateBPM(samples: number[], fps: number): number | null {
  if (samples.length < fps * 5) return null;

  // Bandpass filter: remove DC component and high frequency noise
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const centered = samples.map((s) => s - mean);

  // Simple moving average smoothing
  const windowSize = Math.round(fps / 10);
  const smoothed: number[] = [];
  for (let i = windowSize; i < centered.length - windowSize; i++) {
    let sum = 0;
    for (let j = -windowSize; j <= windowSize; j++) {
      sum += centered[i + j];
    }
    smoothed.push(sum / (2 * windowSize + 1));
  }

  // Count zero crossings (rising)
  let crossings = 0;
  for (let i = 1; i < smoothed.length; i++) {
    if (smoothed[i - 1] < 0 && smoothed[i] >= 0) crossings++;
  }

  const durationSeconds = smoothed.length / fps;
  const bpm = Math.round((crossings / durationSeconds) * 60);

  return bpm >= 30 && bpm <= 220 ? bpm : null;
}
