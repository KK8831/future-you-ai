import { useState } from "react";
import { RefreshCw, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

export interface WearableEntry {
  user_id: string;
  data_type: string;
  value: number;
  unit: string;
  source: string;
}

interface GoogleFitConnectProps {
  userId?: string;
  onDataSynced?: (entries: WearableEntry[]) => void;
}

const DATA_CATEGORIES = [
  { label: "Steps", icon: "👟", desc: "Daily step count" },
  { label: "Calories", icon: "🔥", desc: "Active calories burned" },
  { label: "Distance", icon: "📍", desc: "Distance traveled" },
  { label: "Sleep", icon: "😴", desc: "Sleep duration" },
  { label: "Weight", icon: "⚖️", desc: "Body weight" },
];

export function GoogleFitConnect({ userId, onDataSynced }: GoogleFitConnectProps) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [healthConnectMissing, setHealthConnectMissing] = useState(false);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const syncHealthData = async () => {
    if (!userId) return;
    if (!isNative) {
      toast({ title: "Android Only", description: "Health Connect sync is only available in the Android app.", variant: "destructive" });
      return;
    }
    setSyncing(true);
    setHealthConnectMissing(false);
    let HealthConnect: any;
    try {
      const mod = await import("capacitor-health-connect");
      HealthConnect = mod?.HealthConnect ?? (mod as any)?.default;
      if (!HealthConnect) throw new Error("Plugin not found");
    } catch {
      setSyncing(false);
      toast({ title: "Plugin Error", description: "Health Connect plugin could not be loaded.", variant: "destructive" });
      return;
    }
    try {
      const availabilityResult = await HealthConnect.checkAvailability();
      if (availabilityResult?.availability !== "Available") {
        setHealthConnectMissing(true);
        toast({ title: "Health Connect Not Available", description: "Please install Health Connect from the Play Store.", variant: "destructive" });
        setSyncing(false);
        return;
      }
      await HealthConnect.requestHealthPermissions({
        read: ["Steps", "ActiveCaloriesBurned", "Distance", "SleepSession", "Weight"],
        write: [],
      });
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const timeRangeFilter = { type: "between", startTime: yesterday, endTime: now };
      const safeRead = async (type: string) => {
        try { const r = await HealthConnect.readRecords({ type, timeRangeFilter }); return r?.records ?? []; }
        catch { return []; }
      };
      const [stepsR, calR, distR, sleepR, weightR] = await Promise.all([
        safeRead("Steps"), safeRead("ActiveCaloriesBurned"), safeRead("Distance"), safeRead("SleepSession"), safeRead("Weight"),
      ]);
      const entries: WearableEntry[] = [];
      const totalSteps = stepsR.reduce((s: number, r: any) => s + (r?.count ?? 0), 0);
      if (totalSteps > 0) entries.push({ user_id: userId, data_type: "steps", value: totalSteps, unit: "count", source: "health_connect" });
      const totalCal = calR.reduce((s: number, r: any) => s + (r?.energy?.value ?? 0), 0);
      if (totalCal > 0) entries.push({ user_id: userId, data_type: "calories_burned", value: Math.round(totalCal), unit: "kcal", source: "health_connect" });
      const totalDist = distR.reduce((s: number, r: any) => s + ((r?.distance?.value ?? 0) / 1000), 0);
      if (totalDist > 0) entries.push({ user_id: userId, data_type: "distance", value: parseFloat(totalDist.toFixed(2)), unit: "km", source: "health_connect" });
      const totalSleep = sleepR.reduce((s: number, r: any) => r?.startTime && r?.endTime ? s + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) : s, 0);
      if (totalSleep > 0) entries.push({ user_id: userId, data_type: "sleep_duration", value: parseFloat((totalSleep / 3600000).toFixed(1)), unit: "hours", source: "health_connect" });
      if (weightR.length > 0 && weightR[weightR.length-1]?.weight?.value) entries.push({ user_id: userId, data_type: "weight", value: parseFloat(weightR[weightR.length-1].weight.value.toFixed(1)), unit: "kg", source: "health_connect" });
      if (entries.length > 0) { const { error } = await supabase.from("wearable_data").insert(entries); if (error) throw error; }
      onDataSynced?.(entries);
      setSynced(true);
      setTimeout(() => setSynced(false), 4000);
      toast({ title: "Sync complete! 🎉", description: entries.length > 0 ? `${entries.length} metrics synced.` : "No new data found for the last 24 hours." });
    } catch (error: any) {
      toast({ title: "Sync Failed", description: error?.message ?? "Unexpected error.", variant: "destructive" });
    } finally { setSyncing(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {DATA_CATEGORIES.map((item) => (
          <div key={item.label} className="p-3 rounded-lg bg-secondary/20 border border-border flex items-center gap-2.5">
            <span className="text-xl">{item.icon}</span>
            <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
          </div>
        ))}
      </div>
      {healthConnectMissing && (
        <div className="p-3 rounded-lg border border-red-400 bg-red-50/10">
          <p className="text-xs text-red-400 mb-2">Health Connect is not installed.</p>
          <Button size="sm" variant="destructive" onClick={() => window.open("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata", "_blank")}>Install Health Connect</Button>
        </div>
      )}
      <Button onClick={syncHealthData} disabled={syncing} className="w-full">
        {synced ? <><Check className="w-4 h-4 mr-2" />Synced</> : syncing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Syncing...</> : <><RefreshCw className="w-4 h-4 mr-2" />Sync Health Data</>}
      </Button>
    </div>
  );
}
