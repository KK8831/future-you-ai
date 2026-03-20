import { useState } from "react";
import { Monitor, RefreshCw, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Capacitor, registerPlugin } from "@capacitor/core";

const ScreenTime = registerPlugin<any>("ScreenTime");

interface ScreenTimeCollectProps {
  userId?: string;
}

export function ScreenTimeCollect({ userId }: ScreenTimeCollectProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [screenTimeHours, setScreenTimeHours] = useState<number | null>(null);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  if (!isNative) {
    return (
      <div className="p-4 rounded-lg border border-border bg-secondary/10 text-center space-y-2">
        <Monitor className="w-8 h-8 mx-auto text-muted-foreground" />
        <p className="text-sm font-medium">Available on Android App only</p>
        <p className="text-xs text-muted-foreground">Screen time tracking requires the native Android app.</p>
      </div>
    );
  }

  const fetchScreenTime = async () => {
    setLoading(true);
    try {
      const result = await ScreenTime.getScreenTime();

      if (result.permissionRequired) {
        toast({
          title: "Permission Required",
          description: "Please grant Usage Access permission then try again.",
          variant: "destructive",
        });
        await ScreenTime.requestPermission();
        setLoading(false);
        return;
      }

      const hours = result.screenTimeHours;
      setScreenTimeHours(hours);

      if (userId) {
        const { error } = await supabase.from("wearable_data").insert({
          user_id: userId,
          data_type: "screen_time",
          value: hours,
          unit: "hours",
          source: "device_usage",
        });
        if (error) throw error;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: "Screen Time Saved! 📱",
        description: `Today's screen time: ${hours} hours`,
      });
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error?.message ?? "Could not fetch screen time.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-secondary/20 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Today's Screen Time</p>
            <p className="text-xs text-muted-foreground">From device usage stats</p>
          </div>
        </div>

        {screenTimeHours !== null && (
          <div className="text-center py-3">
            <p className="text-4xl font-bold text-foreground">{screenTimeHours}</p>
            <p className="text-sm text-muted-foreground">hours today</p>
            <p className={`text-xs mt-1 font-medium ${
              screenTimeHours <= 4 ? "text-green-500" :
              screenTimeHours <= 6 ? "text-yellow-500" : "text-red-500"
            }`}>
              {screenTimeHours <= 4 ? "✅ Healthy usage" :
               screenTimeHours <= 6 ? "⚠️ Moderate usage" : "🔴 High usage"}
            </p>
          </div>
        )}
      </div>

      <Button onClick={fetchScreenTime} disabled={loading} className="w-full">
        {saved ? (
          <><Check className="w-4 h-4 mr-2" />Saved!</>
        ) : loading ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" />Fetching...</>
        ) : (
          <><RefreshCw className="w-4 h-4 mr-2" />Fetch Screen Time</>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Reads total device screen time for today
      </p>
    </div>
  );
}