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
  Fingerprint,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface CameraHeartRateProps {
  userId?: string;
}

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
    fingerDetected,
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
      toast({ title: "Heart rate saved!", description: `${bpm} BPM recorded.` });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden video + canvas for PPG processing */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {/* Pre-measurement guidance */}
      {!isDetecting && !bpm && !error && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-health-blue/5 border border-health-blue/20">
            <Info className="w-4 h-4 text-health-blue mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Your browser will ask for <strong>camera access</strong> — click{" "}
              <strong>Allow</strong> when prompted.
            </p>
          </div>

          {isDesktop && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
              <Monitor className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Best on mobile:</strong>{" "}
                Place your fingertip over the rear camera for accurate PPG
                readings. The flashlight must be on — desktop webcams cannot
                do this.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Visual center */}
      <div className="flex flex-col items-center gap-3">
        {/* Pulsing heart */}
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            isDetecting
              ? "bg-health-red/10 animate-pulse"
              : bpm
              ? "bg-health-green/10"
              : "bg-secondary/30"
          }`}
        >
          <Heart
            className={`w-10 h-10 transition-colors ${
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
          <div className="text-center">
            <p className="text-4xl font-display font-bold text-foreground">{bpm}</p>
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

        {/* Finger detection status banner */}
        {isDetecting && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              fingerDetected
                ? "bg-health-green/10 text-health-green border border-health-green/30"
                : "bg-health-amber/10 text-health-amber border border-health-amber/30 animate-pulse"
            }`}
          >
            <Fingerprint className="w-3 h-3" />
            {fingerDetected
              ? "Finger detected ✓"
              : "Place finger on camera lens"}
          </div>
        )}

        {/* Torch indicator */}
        {isDetecting && !isDesktop && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="w-3 h-3 text-health-amber" />
            <span>Flashlight active — keep camera covered</span>
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
              {Math.round(progress)}% — Hold steady{fingerDetected ? "" : " (no finger detected)"}
            </p>
          </div>
        )}

        {/* Live signal waveform */}
        {isDetecting && signal.length > 10 && (
          <div className="w-full h-16 mt-1">
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
            <p className="text-[10px] text-center text-muted-foreground -mt-1">
              Live PPG signal
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {!isDetecting ? (
          <Button className="flex-1" onClick={startDetection}>
            <Play className="w-4 h-4 mr-2" /> Start Measurement
          </Button>
        ) : (
          <Button className="flex-1" variant="destructive" onClick={stopDetection}>
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
            <RotateCcw className="w-3 h-3 mr-1" /> Retry
          </Button>
          {isPermissionDenied && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-start gap-2">
                <Settings className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Android:</strong>{" "}
                  Settings → Apps → FutureMe AI → Permissions → Camera → Allow
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Settings className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">In Chrome:</strong> Tap
                  the lock icon in the address bar → Camera → Allow
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* How-to instructions */}
      <div className="p-3 rounded-lg bg-secondary/30 border border-border">
        <p className="text-xs font-medium text-foreground mb-2">📷 How to measure correctly:</p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Place your <strong>fingertip flat</strong> over the rear camera lens</li>
          <li>Apply <strong>gentle but firm pressure</strong> — not too hard</li>
          <li>Ensure the flashlight shines through your fingertip (red glow)</li>
          <li>Hold <strong>completely still</strong> for 20 seconds</li>
          <li>Wait for the <em>"Finger detected ✓"</em> indicator to appear</li>
        </ol>
      </div>
    </div>
  );
}
