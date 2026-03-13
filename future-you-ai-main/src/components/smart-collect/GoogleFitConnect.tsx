import { useState } from "react";
import {
  Smartphone,
  RefreshCw,
  Check,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

interface GoogleFitConnectProps {
  userId?: string;
}

const HEALTH_CONNECT_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata";

const DATA_CATEGORIES = [
  { label: "Steps", icon: "👟", desc: "Daily step count" },
  { label: "Heart Rate", icon: "❤️", desc: "Continuous BPM" },
  { label: "Sleep", icon: "😴", desc: "Duration & stages" },
  { label: "Calories", icon: "🔥", desc: "Calories burned" },
  { label: "Distance", icon: "📏", desc: "Walking/running km" },
  { label: "Activity", icon: "🏃", desc: "Exercise sessions" },
];

export function GoogleFitConnect({ userId }: GoogleFitConnectProps) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [healthConnectMissing, setHealthConnectMissing] = useState(false);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const syncHealthData = async () => {
    if (!userId) return;

    if (!isNative) {
      toast({
        title: "Android Only",
        description:
          "Health Connect sync is only available in the Android app. Install the app from the Play Store to use this feature.",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    setHealthConnectMissing(false);

    let HealthConnect: any;
    try {
      const mod = await import("capacitor-health-connect");
      HealthConnect = mod.HealthConnect;
    } catch (importError: any) {
      setSyncing(false);
      toast({
        title: "Plugin Error",
        description:
          "Health Connect plugin could not be loaded. Please reinstall the app.",
        variant: "destructive",
      });
      return;
    }

    try {
      const availability = await HealthConnect.checkAvailability();

      if (availability.availability !== "Available") {
        setHealthConnectMissing(true);
        toast({
          title: "Health Connect Not Installed",
          description:
            "Please install Health Connect from the Play Store to sync fitness data.",
          variant: "destructive",
        });
        setSyncing(false);
        return;
      }

      await HealthConnect.requestHealthPermissions({
        read: [
          "Steps",
          "HeartRate",
          "SleepSession",
          "Distance",
          "ActiveCaloriesBurned",
        ],
        write: [],
      });

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const timeFilter = {
        startTime: yesterday.toISOString(),
        endTime: now.toISOString(),
      };

      const [stepsData, heartRateData, sleepData, distanceData, caloriesData] =
        await Promise.all([
          HealthConnect.readRecords({
            type: "Steps",
            timeRangeFilter: timeFilter,
          }),
          HealthConnect.readRecords({
            type: "HeartRate",
            timeRangeFilter: timeFilter,
          }),
          HealthConnect.readRecords({
            type: "SleepSession",
            timeRangeFilter: timeFilter,
          }),
          HealthConnect.readRecords({
            type: "Distance",
            timeRangeFilter: timeFilter,
          }),
          HealthConnect.readRecords({
            type: "ActiveCaloriesBurned",
            timeRangeFilter: timeFilter,
          }),
        ]);

      const wearableEntries: any[] = [];

      const totalSteps = stepsData.records.reduce(
        (sum: number, r: any) => sum + r.count,
        0
      );
      if (totalSteps > 0)
        wearableEntries.push({
          user_id: userId,
          data_type: "steps",
          value: totalSteps,
          unit: "count",
          source: "health_connect",
        });

      if (heartRateData.records.length > 0) {
        const avgHR =
          heartRateData.records.reduce(
            (sum: number, r: any) => sum + (r.samples[0]?.beatsPerMinute ?? 0),
            0
          ) / heartRateData.records.length;
        wearableEntries.push({
          user_id: userId,
          data_type: "heart_rate",
          value: Math.round(avgHR),
          unit: "bpm",
          source: "health_connect",
        });
      }

      const totalDistance = distanceData.records.reduce(
        (sum: number, r: any) => sum + r.distance.inMeters,
        0
      );
      if (totalDistance > 0)
        wearableEntries.push({
          user_id: userId,
          data_type: "distance",
          value: parseFloat((totalDistance / 1000).toFixed(2)),
          unit: "km",
          source: "health_connect",
        });

      const totalCalories = caloriesData.records.reduce(
        (sum: number, r: any) => sum + r.energy.inKilocalories,
        0
      );
      if (totalCalories > 0)
        wearableEntries.push({
          user_id: userId,
          data_type: "calories_burned",
          value: Math.round(totalCalories),
          unit: "kcal",
          source: "health_connect",
        });

      if (sleepData.records.length > 0) {
        const s = sleepData.records[0] as any;
        const hours = parseFloat(
          (
            (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) /
            3600000
          ).toFixed(1)
        );
        wearableEntries.push({
          user_id: userId,
          data_type: "sleep_hours",
          value: hours,
          unit: "hours",
          source: "health_connect",
        });
      }

      if (wearableEntries.length > 0) {
        await supabase.from("wearable_data").insert(wearableEntries);
      }

      setSynced(true);
      setTimeout(() => setSynced(false), 3000);
      toast({
        title: "Sync complete!",
        description: `${wearableEntries.length} health metric${wearableEntries.length !== 1 ? "s" : ""} synced.`,
      });
    } catch (error: any) {
      const message = error?.message?.includes("PERMISSION")
        ? "Permission was denied. Please grant Health Connect access and try again."
        : error?.message ?? "An unexpected error occurred.";
      toast({
        title: "Sync Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const openPlayStore = () => {
    window.open(HEALTH_CONNECT_PLAY_STORE_URL, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Data categories grid */}
      <div className="grid grid-cols-2 gap-2">
        {DATA_CATEGORIES.map((item) => (
          <div
            key={item.label}
            className="p-3 rounded-lg bg-secondary/20 border border-border flex items-center gap-2.5"
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-tight">
                {item.label}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Web/PWA notice */}
      {!isNative && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-health-amber/10 border border-health-amber/30">
          <AlertCircle className="w-4 h-4 text-health-amber mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">
              Android App Required
            </p>
            <p className="text-xs text-muted-foreground">
              Health Connect sync requires the native{" "}
              <strong>Android app</strong>. This feature is unavailable in the
              browser.
            </p>
            <button
              onClick={openPlayStore}
              className="inline-flex items-center gap-1 text-xs text-health-amber hover:underline font-medium mt-0.5"
            >
              <ExternalLink className="w-3 h-3" />
              Get the Android App
            </button>
          </div>
        </div>
      )}

      {/* Play Store install prompt */}
      {healthConnectMissing && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-health-red/10 border border-health-red/30">
          <AlertCircle className="w-4 h-4 text-health-red mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              <strong>Health Connect</strong> is not installed on your device.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={openPlayStore}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Install Health Connect
            </Button>
          </div>
        </div>
      )}

      <Button className="w-full" onClick={syncHealthData} disabled={syncing}>
        {synced ? (
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4" /> Synced!
          </span>
        ) : syncing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Syncing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Sync Health Data
          </span>
        )}
      </Button>
    </div>
  );
}