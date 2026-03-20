import { useState } from "react";
import { Monitor, RefreshCw, Check, Loader2, Clock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor, registerPlugin } from "@capacitor/core";

interface ScreenTimePlugin {
  getScreenTime(): Promise<{ screenTimeHours: number; permissionRequired: boolean }>;
  requestPermission(): Promise<void>;
}

const ScreenTimePlugin = registerPlugin<ScreenTimePlugin>("ScreenTime");

interface ScreenTimeCollectProps {
  userId?: string;
}

export function ScreenTimeCollect({ userId }: ScreenTimeCollectProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [screenTimeHours, setScreenTimeHours] = useState<number | null>(null);
  const [manualHours, setManualHours] = useState<string>("");
  const [pluginUnavailable, setPluginUnavailable] = useState(false);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const saveScreenTime = async (hours: number) => {
    if (userId) {
      const { error } = await supabase.from("wearable_data").insert({
        user_id: userId,
        data_type: "screen_time",
        value: hours,
        unit: "hours",
        source: isNative ? "device_usage" : "manual_entry",
      });
      if (error) throw error;
    }
    setScreenTimeHours(hours);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    toast({
      title: "Screen Time Saved! 📱",
      description: `Today's screen time: ${hours} hours`,
    });
  };

  const fetchScreenTime = async () => {
    setLoading(true);
    try {
      const result = await ScreenTimePlugin.getScreenTime();

      if (result.permissionRequired) {
        toast({
          title: "Permission Required",
          description: "Please enable Usage Access for FutureMe AI then try again.",
          variant: "destructive",
        });
        await ScreenTimePlugin.requestPermission();
        setLoading(false);
        return;
      }

      await saveScreenTime(result.screenTimeHours);
    } catch (error: any) {
      // Plugin not available (not yet synced on device / older build)
      const msg: string = error?.message ?? "";
      if (
        msg.toLowerCase().includes("not implemented") ||
        msg.toLowerCase().includes("not available") ||
        msg.toLowerCase().includes("undefined")
      ) {
        setPluginUnavailable(true);
        toast({
          title: "Auto-fetch unavailable",
          description: "Enter your screen time manually below.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed",
          description: msg || "Could not fetch screen time.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    const hours = parseFloat(manualHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      toast({
        title: "Invalid value",
        description: "Please enter a number between 0 and 24.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await saveScreenTime(hours);
      setManualHours("");
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: error?.message ?? "Could not save screen time.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUsageLabel = (hours: number) => {
    if (hours <= 2) return { label: "✅ Excellent usage", color: "text-green-500" };
    if (hours <= 4) return { label: "✅ Healthy usage", color: "text-green-500" };
    if (hours <= 6) return { label: "⚠️ Moderate usage", color: "text-yellow-500" };
    return { label: "🔴 High usage", color: "text-red-500" };
  };

  // Show manual entry UI for: web users OR native users whose plugin failed
  const showManualEntry = !isNative || pluginUnavailable;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-secondary/20 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Today's Screen Time</p>
            <p className="text-xs text-muted-foreground">
              {isNative && !pluginUnavailable ? "From device usage stats" : "Manual entry"}
            </p>
          </div>
        </div>

        {screenTimeHours !== null && (() => {
          const usage = getUsageLabel(screenTimeHours);
          return (
            <div className="text-center py-3">
              <p className="text-4xl font-bold text-foreground">{screenTimeHours}</p>
              <p className="text-sm text-muted-foreground">hours today</p>
              <p className={`text-xs mt-1 font-medium ${usage.color}`}>{usage.label}</p>
            </div>
          );
        })()}
      </div>

      {/* Auto-fetch button: only shown on native AND plugin is available */}
      {isNative && !pluginUnavailable && (
        <Button onClick={fetchScreenTime} disabled={loading} className="w-full">
          {saved ? (
            <><Check className="w-4 h-4 mr-2" />Saved!</>
          ) : loading ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Fetching...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" />Fetch Screen Time</>
          )}
        </Button>
      )}

      {/* Manual entry: shown on web or when plugin is unavailable on native */}
      {showManualEntry && (
        <div className="space-y-3">
          {!isNative && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-xs text-blue-400">
                Auto-detection available in the Android app. Enter manually below.
              </p>
            </div>
          )}
          {isNative && pluginUnavailable && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
              <p className="text-xs text-yellow-400">
                Plugin unavailable on this build. Enter manually below.
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
                placeholder="Hours (e.g. 3.5)"
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              onClick={handleManualSave}
              disabled={loading || !manualHours}
              className="shrink-0"
            >
              {saved ? (
                <><Check className="w-4 h-4 mr-1" />Saved</>
              ) : loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Enter today's total screen time in hours
          </p>
        </div>
      )}

      {isNative && !showManualEntry && (
        <p className="text-xs text-muted-foreground text-center">
          Reads total device screen time for today
        </p>
      )}
    </div>
  );
}