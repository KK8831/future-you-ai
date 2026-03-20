import { useState, useEffect, useRef } from "react";
import {
  Monitor,
  RefreshCw,
  Check,
  Loader2,
  Smartphone,
  Clock,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor, registerPlugin } from "@capacitor/core";

interface ScreenTimePlugin {
  getScreenTime(): Promise<{ screenTimeHours: number; permissionRequired: boolean }>;
  requestPermission(): Promise<void>;
}

const NativeScreenTimePlugin = registerPlugin<ScreenTimePlugin>("ScreenTime");

// ── localStorage helpers ─────────────────────────────────────────────────────
const todayKey = () => `screentime_${new Date().toISOString().slice(0, 10)}`;

function getStoredSeconds(): number {
  return parseInt(localStorage.getItem(todayKey()) ?? "0", 10);
}

function addStoredSeconds(delta: number): number {
  const next = getStoredSeconds() + delta;
  localStorage.setItem(todayKey(), String(next));
  return next;
}

function toHours(seconds: number): number {
  return Math.round((seconds / 3600) * 10) / 10;
}
// ─────────────────────────────────────────────────────────────────────────────

interface ScreenTimeCollectProps {
  userId?: string;
}

export function ScreenTimeCollect({ userId }: ScreenTimeCollectProps) {
  const isNative = Capacitor.isNativePlatform();

  // Web: live session seconds accumulated today
  const [sessionSeconds, setSessionSeconds] = useState<number>(getStoredSeconds());
  const [displayHours, setDisplayHours] = useState<number | null>(null);

  // Native: fetched hours
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchState, setFetchState] = useState<"idle" | "success" | "permission" | "error">("idle");

  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  // Interval + visibility refs for web tracking
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // ── Web: auto-track session time ──────────────────────────────────────────
  useEffect(() => {
    if (isNative) return;

    const start = () => {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.round((now - lastTickRef.current) / 1000);
        lastTickRef.current = now;
        const total = addStoredSeconds(delta);
        setSessionSeconds(total);
      }, 5000); // update every 5 seconds
    };

    const stop = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isNative]);

  // Update displayHours whenever sessionSeconds changes (web)
  useEffect(() => {
    if (!isNative) {
      setDisplayHours(toHours(sessionSeconds));
    }
  }, [isNative, sessionSeconds]);

  // ── Save to Supabase ───────────────────────────────────────────────────────
  const persistToSupabase = async (hours: number, source: string) => {
    if (!userId) return;
    const { error } = await supabase.from("wearable_data").insert({
      user_id: userId,
      data_type: "screen_time",
      value: hours,
      unit: "hours",
      source,
    });
    if (error) throw error;
  };

  // ── Web: save current session time ────────────────────────────────────────
  const handleWebSave = async () => {
    const hours = toHours(sessionSeconds);
    if (hours === 0) {
      toast({
        title: "Nothing to save yet",
        description: "Keep the app open to accumulate session time.",
      });
      return;
    }
    try {
      await persistToSupabase(hours, "web_session");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: "Screen Time Saved! 📱",
        description: `Today's app session: ${hours} hours`,
      });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    }
  };

  // ── Native: fetch from device ──────────────────────────────────────────────
  const handleNativeFetch = async () => {
    setFetchLoading(true);
    setFetchState("idle");
    try {
      const result = await NativeScreenTimePlugin.getScreenTime();
      if (result.permissionRequired) {
        setFetchState("permission");
        toast({
          title: "Permission Required",
          description: "Enable Usage Access for FutureMe AI then try again.",
          variant: "destructive",
        });
        await NativeScreenTimePlugin.requestPermission();
        setFetchLoading(false);
        return;
      }
      const hours = result.screenTimeHours;
      setDisplayHours(hours);
      await persistToSupabase(hours, "device_usage");
      setFetchState("success");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: "Screen Time Saved! 📱",
        description: `Today's screen time: ${hours} hours`,
      });
    } catch (e: any) {
      setFetchState("error");
      toast({
        title: "Failed to fetch screen time",
        description: e?.message ?? "Unknown error.",
        variant: "destructive",
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const getUsageBadge = (hours: number) => {
    if (hours <= 2) return { text: "Excellent ✅", color: "text-green-400" };
    if (hours <= 4) return { text: "Healthy ✅", color: "text-green-400" };
    if (hours <= 6) return { text: "Moderate ⚠️", color: "text-yellow-400" };
    return { text: "High usage 🔴", color: "text-red-400" };
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Display card */}
      <div className="p-4 rounded-lg bg-secondary/20 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Today's Screen Time</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {isNative ? (
                <><Smartphone className="w-3 h-3" /> Device usage stats</>
              ) : (
                <><Clock className="w-3 h-3" /> App session time (auto-tracking)</>
              )}
            </p>
          </div>
          {/* Live indicator for web */}
          {!isNative && (
            <div className="ml-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">Live</span>
            </div>
          )}
        </div>

        {displayHours !== null && displayHours > 0 ? (
          <div className="text-center py-3">
            <p className="text-5xl font-bold text-foreground tabular-nums">
              {displayHours}
            </p>
            <p className="text-sm text-muted-foreground mt-1">hours today</p>
            {!isNative && sessionSeconds > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                ({formatTime(sessionSeconds)} tracked this session)
              </p>
            )}
            <p className={`text-xs mt-2 font-semibold ${getUsageBadge(displayHours).color}`}>
              {getUsageBadge(displayHours).text}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <p className="text-sm">
              {isNative ? 'Tap "Fetch Screen Time" to load' : "Tracking started — keep app open to accumulate time"}
            </p>
          </div>
        )}
      </div>

      {/* Web: info banner + save button */}
      {!isNative && (
        <>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Wifi className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-300">How this works</p>
              <p className="text-xs text-blue-400/80 mt-0.5">
                Your time in this app is tracked automatically. Install the Android APK to track
                total device screen time (all apps combined).
              </p>
            </div>
          </div>
          <Button onClick={handleWebSave} className="w-full">
            {saved
              ? <><Check className="w-4 h-4 mr-2" />Saved!</>
              : <><Check className="w-4 h-4 mr-2" />Save Session Time</>}
          </Button>
        </>
      )}

      {/* Native: fetch button */}
      {isNative && (
        <Button onClick={handleNativeFetch} disabled={fetchLoading} className="w-full">
          {saved ? (
            <><Check className="w-4 h-4 mr-2" />Saved!</>
          ) : fetchLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Fetching from device…</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" />Fetch Screen Time</>
          )}
        </Button>
      )}

      {fetchState === "permission" && isNative && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <Smartphone className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-400">
            Grant Usage Access permission on your device, then tap Fetch again.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {isNative ? "Reads total device screen time for today" : "Time is tracked while this app is open and visible"}
      </p>
    </div>
  );
}