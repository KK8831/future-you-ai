import { useState } from "react";
import { RefreshCw, Check, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

interface GoogleFitConnectProps {
  userId?: string;
  onDataSynced?: (entries: WearableEntry[]) => void;
}

export interface WearableEntry {
  user_id: string;
  data_type: string;
  value: number;
  unit: string;
  source: string;
}

const DATA_CATEGORIES = [
  { label: "Steps", icon: "👟", desc: "Daily step count" },
  { label: "Calories", icon: "🔥", desc: "Active calories burned" },
  { label: "Distance", icon: "📍", desc: "Distance traveled" },
  { label: "Sleep", icon: "😴", desc: "Sleep duration" },
  { label: "Weight", icon: "⚖️", desc: "Body weight" },
];

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.sleep.read",
  "https://www.googleapis.com/auth/fitness.body.read",
].join(" ");

export function GoogleFitConnect({ userId, onDataSynced }: GoogleFitConnectProps) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const connectGoogleFit = () => {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: window.location.origin,
      response_type: "token",
      scope: SCOPES,
      include_granted_scopes: "true",
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    const popup = window.open(authUrl, "googlefit", "width=500,height=600");

    const interval = setInterval(() => {
      try {
        if (popup?.location?.hash) {
          const hash = popup.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const token = params.get("access_token");
          if (token) {
            clearInterval(interval);
            popup.close();
            localStorage.setItem("gfit_token", token);
            setConnected(true);
            toast({ title: "Google Fit Connected! ✅", description: "Now click Sync to fetch your data." });
          }
        }
      } catch {}
      if (popup?.closed) clearInterval(interval);
    }, 500);
  };

  const syncGoogleFit = async () => {
    const token = localStorage.getItem("gfit_token");
    if (!token || !userId) return;
    setSyncing(true);

    try {
      const now = Date.now();
      const yesterday = now - 86400000;
      const entries: WearableEntry[] = [];

      // Fetch Steps
      const stepsRes = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis: yesterday,
            endTimeMillis: now,
          }),
        }
      );
      const stepsData = await stepsRes.json();
      const steps = stepsData?.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal ?? 0;
      if (steps > 0) entries.push({ user_id: userId, data_type: "steps", value: steps, unit: "count", source: "google_fit" });

      // Fetch Calories
      const calRes = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            aggregateBy: [{ dataTypeName: "com.google.calories.expended" }],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis: yesterday,
            endTimeMillis: now,
          }),
        }
      );
      const calData = await calRes.json();
      const calories = calData?.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal ?? 0;
      if (calories > 0) entries.push({ user_id: userId, data_type: "calories_burned", value: Math.round(calories), unit: "kcal", source: "google_fit" });

      // Fetch Distance
      const distRes = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            aggregateBy: [{ dataTypeName: "com.google.distance.delta" }],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis: yesterday,
            endTimeMillis: now,
          }),
        }
      );
      const distData = await distRes.json();
      const distance = distData?.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal ?? 0;
      if (distance > 0) entries.push({ user_id: userId, data_type: "distance", value: parseFloat((distance / 1000).toFixed(2)), unit: "km", source: "google_fit" });

      if (entries.length > 0) {
        const { error } = await supabase.from("wearable_data").insert(entries);
        if (error) throw error;
      }

      onDataSynced?.(entries);
      setSynced(true);
      setTimeout(() => setSynced(false), 4000);
      toast({
        title: "Sync complete! 🎉",
        description: entries.length > 0 ? `${entries.length} metrics synced from Google Fit.` : "No data found for last 24 hours.",
      });
    } catch (error: any) {
      if (error?.message?.includes("401")) {
        localStorage.removeItem("gfit_token");
        setConnected(false);
        toast({ title: "Session expired", description: "Please reconnect Google Fit.", variant: "destructive" });
      } else {
        toast({ title: "Sync Failed", description: error?.message ?? "Unexpected error.", variant: "destructive" });
      }
    } finally {
      setSyncing(false);
    }
  };

  // Android app version
  if (isNative) {
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
        <Button disabled className="w-full">
          <Smartphone className="w-4 h-4 mr-2" /> Use Health Connect on Android
        </Button>
      </div>
    );
  }

  // Web version with Google Fit OAuth
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {DATA_CATEGORIES.map((item) => (
          <div key={item.label} className={`p-3 rounded-lg bg-secondary/20 border border-border flex items-center gap-2.5 ${!connected ? "opacity-50" : ""}`}>
            <span className="text-xl">{item.icon}</span>
            <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
          </div>
        ))}
      </div>

      {!connected ? (
        <Button onClick={connectGoogleFit} className="w-full">
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-4 h-4 mr-2" alt="Google" />
          Connect Google Fit
        </Button>
      ) : (
        <Button onClick={syncGoogleFit} disabled={syncing} className="w-full">
          {synced ? <><Check className="w-4 h-4 mr-2" />Synced</> : syncing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Syncing...</> : <><RefreshCw className="w-4 h-4 mr-2" />Sync Google Fit</>}
        </Button>
      )}
      <p className="text-xs text-center text-muted-foreground">Connects to Google Fit via OAuth 2.0</p>
    </div>
  );
}