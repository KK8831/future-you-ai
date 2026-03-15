import { useState, useRef, useCallback, useEffect } from "react";

interface HeartRateState {
  isDetecting: boolean;
  bpm: number | null;
  signal: number[];
  progress: number;
  error: string | null;
  quality: "good" | "fair" | "poor" | null;
  isPermissionDenied: boolean;
  fingerDetected: boolean;
}

const SAMPLE_DURATION = 20; // seconds — longer window = more accurate BPM
const TARGET_FPS = 30;

// ─── Signal Processing Helpers ───────────────────────────────────────────────

/**
 * Simple moving-average (boxcar) filter.
 */
function movingAvg(data: number[], window: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window);
    let sum = 0;
    for (let j = start; j <= i; j++) sum += data[j];
    out.push(sum / (i - start + 1));
  }
  return out;
}

/**
 * Detect peaks using adaptive threshold with minimum refractory period.
 * Works much better than zero-crossing for noisy PPG signals.
 */
function detectPeaksBPM(signal: number[], fps: number): number | null {
  if (signal.length < fps * 5) return null;

  // 1. Remove DC (mean)
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const centered = signal.map((v) => v - mean);

  // 2. Smooth with moving average (≈ 100 ms window)
  const winSize = Math.max(1, Math.round(fps * 0.1));
  const smoothed = movingAvg(centered, winSize);

  // 3. Compute adaptive threshold = 40% of RMS amplitude
  const rms = Math.sqrt(smoothed.reduce((s, v) => s + v * v, 0) / smoothed.length);
  const threshold = rms * 0.4;

  // 4. Find peaks: local maxima above threshold, minimum 0.3 s apart
  const minGap = Math.round(fps * 0.3); // 60 BPM max refractory
  const peaks: number[] = [];
  for (let i = 1; i < smoothed.length - 1; i++) {
    if (
      smoothed[i] > threshold &&
      smoothed[i] > smoothed[i - 1] &&
      smoothed[i] >= smoothed[i + 1]
    ) {
      // Enforce refractory period
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minGap) {
        peaks.push(i);
      }
    }
  }

  if (peaks.length < 3) return null;

  // 5. Compute RR intervals in seconds
  const rrIntervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    rrIntervals.push((peaks[i] - peaks[i - 1]) / fps);
  }

  // 6. Median of RR intervals → robust against outliers
  const sorted = [...rrIntervals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (median <= 0) return null;

  const bpm = Math.round(60 / median);
  return bpm >= 30 && bpm <= 220 ? bpm : null;
}

/**
 * Detect whether a finger is covering the camera.
 * When a finger is covering the camera with the torch on, the red channel
 * should be significantly brighter than green/blue channels.
 */
function detectFinger(imageData: ImageData): boolean {
  let redSum = 0, greenSum = 0, blueSum = 0;
  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    redSum += pixels[i];
    greenSum += pixels[i + 1];
    blueSum += pixels[i + 2];
  }
  const count = pixels.length / 4;
  const avgR = redSum / count;
  const avgG = greenSum / count;
  const avgB = blueSum / count;

  // Finger criterion: red dominates, and overall brightness is high (torch on)
  // Red must be ≥ 1.4× green AND average red > 100 (not just dark noise)
  return avgR >= avgG * 1.4 && avgR >= avgB * 1.6 && avgR > 80;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useHeartRateDetection() {
  const [state, setState] = useState<HeartRateState>({
    isDetecting: false,
    bpm: null,
    signal: [],
    progress: 0,
    error: null,
    quality: null,
    isPermissionDenied: false,
    fingerDetected: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const samplesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const isDetectingRef = useRef(false);
  const fingerFramesRef = useRef(0); // consecutive frames with finger detected

  const cleanup = useCallback(() => {
    if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    frameIdRef.current = null;
    isDetectingRef.current = false;
    fingerFramesRef.current = 0;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isDetectingRef.current) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Sample center region only (32×32 pixels) — most accurate for PPG
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const sx = Math.max(0, (video.videoWidth - size) / 2);
    const sy = Math.max(0, (video.videoHeight - size) / 2);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const frame = ctx.getImageData(0, 0, size, size);

    // Finger detection (debounce: require 3 consecutive frames)
    const fingerNow = detectFinger(frame);
    if (fingerNow) {
      fingerFramesRef.current = Math.min(fingerFramesRef.current + 1, 5);
    } else {
      fingerFramesRef.current = Math.max(fingerFramesRef.current - 1, 0);
    }
    const fingerStable = fingerFramesRef.current >= 3;

    // Extract average red channel (PPG signal)
    let redSum = 0;
    const count = frame.data.length / 4;
    for (let i = 0; i < frame.data.length; i += 4) {
      redSum += frame.data[i];
    }
    const avgRed = redSum / count;

    // Only record samples when finger is detected
    if (fingerStable) {
      samplesRef.current.push(avgRed);
    }

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const progress = Math.min(100, (elapsed / SAMPLE_DURATION) * 100);

    setState((s) => ({
      ...s,
      signal: fingerStable ? [...s.signal.slice(-120), avgRed] : s.signal,
      progress,
      fingerDetected: fingerStable,
    }));

    if (elapsed >= SAMPLE_DURATION) {
      const bpm = detectPeaksBPM(samplesRef.current, TARGET_FPS);
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
        fingerDetected: false,
        error:
          quality === "poor"
            ? samplesRef.current.length < TARGET_FPS * 8
              ? "Not enough finger coverage detected. Cover the rear camera lens completely with your fingertip for the full 20 seconds."
              : "Could not detect a reliable heart rate. Ensure your finger fully covers the camera lens with gentle pressure and hold very still."
            : null,
        isPermissionDenied: false,
      }));
      cleanup();
      return;
    }

    frameIdRef.current = requestAnimationFrame(processFrame);
  }, [cleanup]);

  const startDetection = useCallback(async () => {
    setState({
      isDetecting: false,
      bpm: null,
      signal: [],
      progress: 0,
      error: null,
      quality: null,
      isPermissionDenied: false,
      fingerDetected: false,
    });
    samplesRef.current = [];
    fingerFramesRef.current = 0;

    if (!navigator.mediaDevices?.getUserMedia) {
      setState((s) => ({
        ...s,
        error:
          "Camera API is not available in this browser/app. Please update the app to the latest version.",
      }));
      return;
    }

    // Try rear camera with torch (torch enables flashlight on Android — essential for PPG)
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { exact: "environment" },
        width: { ideal: 640 },
        height: { ideal: 480 },
        // @ts-ignore — torch is valid on supported Android devices
        advanced: [{ torch: true }],
      },
    };

    const tryStart = async (c: MediaStreamConstraints) => {
      const stream = await navigator.mediaDevices.getUserMedia(c);
      streamRef.current = stream;

      // Attempt to enable torch via track constraints (second path)
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          // @ts-ignore
          await track.applyConstraints({ advanced: [{ torch: true }] });
        } catch {
          // Torch not supported — continue anyway (desktop / front camera)
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
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
        fingerDetected: false,
      });
      setTimeout(() => {
        frameIdRef.current = requestAnimationFrame(processFrame);
      }, 600);
    };

    try {
      await tryStart(constraints);
    } catch (err: any) {
      const name: string = err?.name ?? "";

      if (name === "OverconstrainedError") {
        // Rear camera with torch not available — fallback to any video
        try {
          await tryStart({ video: true });
          return;
        } catch {
          /* fall through to generic error */
        }
      }

      let errorMessage: string;
      let isPermissionDenied = false;

      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        isPermissionDenied = true;
        errorMessage =
          "Camera permission was denied.\n\nTo fix:\nAndroid: Settings → Apps → FutureMe AI → Permissions → Camera → Allow\nChrome: Tap the lock icon in the address bar → Camera → Allow";
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        errorMessage =
          "No camera was found. Heart rate detection requires a rear camera with a flashlight.";
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        errorMessage =
          "Camera is in use by another app. Close other camera apps and try again.";
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
    setState((s) => ({ ...s, isDetecting: false, progress: 0, fingerDetected: false }));
  }, [cleanup]);

  return { ...state, startDetection, stopDetection, videoRef, canvasRef };
}
