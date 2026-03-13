import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useHeartRateDetection } from "@/hooks/useHeartRateDetection";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  Play,
  Square,
  Save,
  Loader2,
  RotateCcw,
  Settings,
  Info,
  Monitor,
} from "lucide-react";
import { useState } from "react";

interface CameraHeartRateProps {
  userId?: string;
}

// Detect if running on a desktop browser (not mobile)
const isDesktop =
  typeof window !== "undefined" &&
  !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export function CameraHeartRate({ userId }: CameraHeartRateProps) {
  const {
    isDetecting,
    bpm,
    signal,
    progress,
    error,
    quality,
    isPermissionDenied,
    startDetection,
    stopDetection,
    videoRef,
    canvasRef,
  } = useHeartRateDetection();

  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const saveBPM = async () => {
    if (!userId || !bpm) return;
    setSaving(true);
    try {
      await supabase.from("wearable_data").insert({
        user_id: userId,
        data_type: "heart_rate",
        value: bpm,
        unit: "bpm",
        source: "camera_ppg",
      });
      toast({
        title: "Heart rate saved!",
        description: `${bpm} BPM recorded.`,
      });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Video feed (hidden but needed for PPG) */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {/* Upfront guidance — shown only when idle */}
      {!isDetecting && !bpm && !error && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-health-blue/5 border border-health-blue/20">
            <Info className="w-4 h-4 text-health-blue mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Your browser will ask for <strong>camera access</strong> — click{" "}
              <strong>Allow</strong> when prompted.
            </p>
          </div>

          {/* Desktop notice */}
          {isDesktop && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
              <Monitor className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Best on mobile:</strong>{" "}
                Place your fingertip over the rear camera for accurate PPG
                readings. Desktop webcam results may vary.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Visual feedback */}
      <div className="flex flex-col items-center">
        {/* Heart animation */}
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all ${
            isDetecting
              ? "bg-health-red/10 animate-pulse"
              : bpm
              ? "bg-health-green/10"
              : "bg-secondary/30"
          }`}
        >
          <Heart
            className={`w-10 h-10 ${
              isDetecting
                ? "text-health-red animate-pulse"
                : bpm
                ? "text-health-green"
                : "text-muted-foreground"
            }`}
          />
        </div>

        {/* BPM display */}
        {bpm && (
          <div className="text-center mb-2">
            <p className="text-4xl font-display font-bold text-foreground">
              {bpm}
            </p>
            <p className="text-sm text-muted-foreground">BPM</p>
            {quality && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  quality === "good"
                    ? "bg-health-green/10 text-health-green"
                    : quality === "fair"
                    ? "bg-health-amber/10 text-health-amber"
                    : "bg-health-red/10 text-health-red"
                }`}
              >
                {quality} quality
              </span>
            )}
          </div>
        )}

        {/* Progress bar */}
        {isDetecting && (
          <div className="w-full">
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-health-red rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {Math.round(progress)}% — Keep finger on camera
            </p>
          </div>
        )}

        {/* Signal visualization */}
        {isDetecting && signal.length > 10 && (
          <div className="w-full h-16 mt-3">
            <svg
              viewBox={`0 0 ${signal.length} 100`}
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="hsl(var(--health-red))"
                strokeWidth="2"
                points={signal
                  .map((v, i) => {
                    const min = Math.min(...signal);
                    const max = Math.max(...signal);
                    const normalized =
                      max > min ? ((v - min) / (max - min)) * 80 + 10 : 50;
                    return `${i},${100 - normalized}`;
                  })
                  .join(" ")}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isDetecting ? (
          <Button className="flex-1" onClick={startDetection}>
            <Play className="w-4 h-4 mr-2" /> Start Measurement
          </Button>
        ) : (
          <Button
            className="flex-1"
            variant="destructive"
            onClick={stopDetection}
          >
            <Square className="w-4 h-4 mr-2" /> Stop
          </Button>
        )}
        {bpm && !isDetecting && (
          <Button variant="outline" onClick={saveBPM} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-lg bg-health-red/10 border border-health-red/30 p-3 space-y-2">
          <p className="text-xs text-health-red whitespace-pre-line">{error}</p>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs w-full"
            onClick={startDetection}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Retry
          </Button>

          {isPermissionDenied && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-start gap-2">
                <Settings className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">On Android:</strong>{" "}
                  Settings → Apps → FutureMe AI → Permissions → Camera → Allow
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Settings className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">In Chrome:</strong> Click
                  the lock icon in the address bar → Camera → Allow
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">How to measure:</p>
        <p>1. Place your fingertip gently over the rear camera</p>
        <p>2. Keep steady for 15 seconds</p>
        <p>3. Ensure the camera lens is fully covered</p>
      </div>
    </div>
  );
}
