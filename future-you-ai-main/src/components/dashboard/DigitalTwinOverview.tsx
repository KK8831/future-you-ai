import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Brain, Heart, Footprints, Zap, Smartphone } from "lucide-react";
import { LifestyleEntry, DigitalTwinState } from "@/types/lifestyle";
import { WearableMetric } from "@/types/lifestyle";
import { DigitalTwin3D } from "./DigitalTwin3D";

interface DigitalTwinOverviewProps {
  entries: LifestyleEntry[];
  wearableData?: WearableMetric[];
}

function calculateTwinState(entries: LifestyleEntry[], wearableData: WearableMetric[] = []): DigitalTwinState & { heartRate?: number } {
  const heartRate = wearableData?.find(d => d.data_type === "heart_rate")?.value;
  const wearableSteps = wearableData?.find(d => d.data_type === "steps")?.value;

  if (entries.length === 0 && !wearableSteps) {
    return {
      averageActivity: 0, averageSleep: 0, averageDiet: 0, averageStress: 0, averageScreenTime: 0,
      trendDirection: "stable", healthScore: 50, lastUpdated: new Date().toISOString(),
      heartRate
    };
  }

  const recentEntries = entries.slice(0, Math.min(7, entries.length));
  
  // Use wearable steps to supplement activity if available
  const activityFromSteps = wearableSteps ? Math.round(wearableSteps / 100) : null;
  const avgActivity = recentEntries.length > 0
    ? recentEntries.reduce((s, e) => s + e.physical_activity_minutes, 0) / recentEntries.length
    : (activityFromSteps ?? 0);
  
  const effectiveActivity = activityFromSteps ? Math.max(avgActivity, activityFromSteps) : avgActivity;
  
  const avgSleep = recentEntries.length > 0 ? recentEntries.reduce((s, e) => s + e.sleep_hours, 0) / recentEntries.length : 7;
  const avgDiet = recentEntries.length > 0 ? recentEntries.reduce((s, e) => s + e.diet_quality_score, 0) / recentEntries.length : 5;
  const avgStress = recentEntries.length > 0 ? recentEntries.reduce((s, e) => s + e.stress_level, 0) / recentEntries.length : 5;
  const avgScreen = recentEntries.length > 0 ? recentEntries.reduce((s, e) => s + e.screen_time_hours, 0) / recentEntries.length : 4;

  const activityScore = Math.min(effectiveActivity / 60, 1) * 25;
  const sleepScore = Math.min(avgSleep / 8, 1) * 25;
  const dietScore = (avgDiet / 10) * 20;
  const stressScore = ((10 - avgStress) / 10) * 15;
  const screenScore = Math.max(1 - avgScreen / 10, 0) * 15;
  
  // Factor in HR penalty
  const hrPenalty = heartRate && heartRate > 85 ? -Math.min((heartRate - 85) * 0.5, 10) : 0;
  
  const healthScore = Math.max(0, Math.round(activityScore + sleepScore + dietScore + stressScore + screenScore + hrPenalty));
  let trendDirection: "improving" | "stable" | "declining" = "stable";
  if (entries.length >= 14) {
    const recentWeek = entries.slice(0, 7);
    const previousWeek = entries.slice(7, 14);
    const recentScore = recentWeek.reduce((s, e) => s + e.diet_quality_score, 0) / 7;
    const prevScore = previousWeek.reduce((s, e) => s + e.diet_quality_score, 0) / 7;
    if (recentScore > prevScore + 0.5) trendDirection = "improving";
    else if (recentScore < prevScore - 0.5) trendDirection = "declining";
  }
  return {
    averageActivity: Math.round(effectiveActivity), averageSleep: Number(avgSleep.toFixed(1)),
    averageDiet: Number(avgDiet.toFixed(1)), averageStress: Number(avgStress.toFixed(1)),
    averageScreenTime: Number(avgScreen.toFixed(1)), trendDirection, healthScore,
    lastUpdated: entries[0]?.entry_date || new Date().toISOString(),
    heartRate
  };
}


// Body zone highlights based on health metrics
function getBodyHighlights(state: DigitalTwinState & { heartRate?: number }) {
  const highlights: { zone: string; color: string; label: string }[] = [];
  if (state.averageSleep < 6) highlights.push({ zone: "brain", color: "text-health-amber", label: "Sleep deficit" });
  if (state.averageStress > 6) highlights.push({ zone: "chest", color: "text-health-red", label: "High stress" });
  if (state.averageActivity < 20) highlights.push({ zone: "legs", color: "text-health-amber", label: "Low activity" });
  if (state.averageDiet < 5) highlights.push({ zone: "stomach", color: "text-health-red", label: "Poor diet" });
  if (state.heartRate && state.heartRate > 85) highlights.push({ zone: "heart", color: "text-health-red", label: `High HR (${state.heartRate})` });
  return highlights;
}

export function DigitalTwinOverview({ entries, wearableData = [] }: DigitalTwinOverviewProps) {
  const twinState = useMemo(() => calculateTwinState(entries, wearableData), [entries, wearableData]);
  const highlights = useMemo(() => getBodyHighlights(twinState), [twinState]);
  const hasWearable = wearableData.length > 0;

  const TrendIcon = twinState.trendDirection === "improving" ? TrendingUp : twinState.trendDirection === "declining" ? TrendingDown : Minus;
  const trendColor = twinState.trendDirection === "improving" ? "text-health-green" : twinState.trendDirection === "declining" ? "text-health-red" : "text-muted-foreground";
  const scorePercent = twinState.healthScore;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="rounded-2xl bg-card border border-border p-6 relative overflow-hidden h-full">
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-health-blue/5 blur-3xl" />

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Digital Twin</h2>
            <p className="text-xs text-muted-foreground">
              {entries.length > 0 ? `Based on ${entries.length} entries` : "Start logging to build your twin"}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-medium ${trendColor}`}>
            {hasWearable && <Smartphone className="w-3 h-3 text-health-green" />}
            <TrendIcon className="w-3 h-3" />
            {twinState.trendDirection === "improving" ? "Improving" : twinState.trendDirection === "declining" ? "Declining" : "Stable"}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_200px] gap-8 items-center flex-1">
          {/* 3D Human Avatar */}
          <div className="min-h-[320px] w-full">
            <DigitalTwin3D highlights={highlights} />
          </div>

          {/* Health Score & Stats */}
          <div className="flex flex-col items-center gap-6">
            {/* Health Score Gauge */}
            <div className="relative w-32 h-32 scale-110">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
                <circle
                  cx="60" cy="60" r="54"
                  stroke="hsl(var(--accent))"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - scorePercent / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-display font-bold text-foreground">{scorePercent}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Health Score</span>
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-1 gap-3 w-full">
              {[
                { icon: Footprints, label: "Activity", value: `${twinState.averageActivity} min`, good: twinState.averageActivity >= 30 },
                { icon: Brain, label: "Sleep", value: `${twinState.averageSleep} hrs`, good: twinState.averageSleep >= 7 },
                { icon: Heart, label: "Diet", value: `${twinState.averageDiet}/10`, good: twinState.averageDiet >= 7 },
                { icon: Zap, label: "Stress", value: `${twinState.averageStress}/10`, good: twinState.averageStress <= 4 },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-background border border-border`}>
                      <s.icon className={`w-3.5 h-3.5 ${s.good ? "text-health-green" : "text-health-amber"}`} />
                    </div>
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <span className={`text-xs font-semibold ${s.good ? "text-health-green" : "text-health-amber"}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
