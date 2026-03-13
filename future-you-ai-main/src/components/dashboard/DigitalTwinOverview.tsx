import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Brain, Heart, Footprints, Zap } from "lucide-react";
import { LifestyleEntry, DigitalTwinState } from "@/types/lifestyle";

interface DigitalTwinOverviewProps {
  entries: LifestyleEntry[];
}

function calculateTwinState(entries: LifestyleEntry[]): DigitalTwinState {
  if (entries.length === 0) {
    return {
      averageActivity: 0, averageSleep: 0, averageDiet: 0, averageStress: 0, averageScreenTime: 0,
      trendDirection: "stable", healthScore: 50, lastUpdated: new Date().toISOString(),
    };
  }
  const recentEntries = entries.slice(0, Math.min(7, entries.length));
  const avgActivity = recentEntries.reduce((s, e) => s + e.physical_activity_minutes, 0) / recentEntries.length;
  const avgSleep = recentEntries.reduce((s, e) => s + e.sleep_hours, 0) / recentEntries.length;
  const avgDiet = recentEntries.reduce((s, e) => s + e.diet_quality_score, 0) / recentEntries.length;
  const avgStress = recentEntries.reduce((s, e) => s + e.stress_level, 0) / recentEntries.length;
  const avgScreen = recentEntries.reduce((s, e) => s + e.screen_time_hours, 0) / recentEntries.length;
  const activityScore = Math.min(avgActivity / 60, 1) * 25;
  const sleepScore = Math.min(avgSleep / 8, 1) * 25;
  const dietScore = (avgDiet / 10) * 20;
  const stressScore = ((10 - avgStress) / 10) * 15;
  const screenScore = Math.max(1 - avgScreen / 10, 0) * 15;
  const healthScore = Math.round(activityScore + sleepScore + dietScore + stressScore + screenScore);
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
    averageActivity: Math.round(avgActivity), averageSleep: Number(avgSleep.toFixed(1)),
    averageDiet: Number(avgDiet.toFixed(1)), averageStress: Number(avgStress.toFixed(1)),
    averageScreenTime: Number(avgScreen.toFixed(1)), trendDirection, healthScore,
    lastUpdated: entries[0]?.entry_date || new Date().toISOString(),
  };
}

// Body zone highlights based on health metrics
function getBodyHighlights(state: DigitalTwinState) {
  const highlights: { zone: string; color: string; label: string }[] = [];
  if (state.averageSleep < 6) highlights.push({ zone: "brain", color: "text-health-amber", label: "Sleep deficit" });
  if (state.averageStress > 6) highlights.push({ zone: "chest", color: "text-health-red", label: "High stress" });
  if (state.averageActivity < 20) highlights.push({ zone: "legs", color: "text-health-amber", label: "Low activity" });
  if (state.averageDiet < 5) highlights.push({ zone: "stomach", color: "text-health-red", label: "Poor diet" });
  return highlights;
}

export function DigitalTwinOverview({ entries }: DigitalTwinOverviewProps) {
  const twinState = useMemo(() => calculateTwinState(entries), [entries]);
  const highlights = useMemo(() => getBodyHighlights(twinState), [twinState]);

  const TrendIcon = twinState.trendDirection === "improving" ? TrendingUp : twinState.trendDirection === "declining" ? TrendingDown : Minus;
  const trendColor = twinState.trendDirection === "improving" ? "text-health-green" : twinState.trendDirection === "declining" ? "text-health-red" : "text-muted-foreground";
  const scorePercent = twinState.healthScore;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="rounded-2xl bg-card border border-border p-6 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-health-blue/5 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Digital Twin</h2>
            <p className="text-xs text-muted-foreground">
              {entries.length > 0 ? `Based on ${entries.length} entries` : "Start logging to build your twin"}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {twinState.trendDirection === "improving" ? "Improving" : twinState.trendDirection === "declining" ? "Declining" : "Stable"}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Body Avatar SVG */}
          <div className="relative flex-shrink-0">
            <svg viewBox="0 0 160 320" className="w-40 h-80 mx-auto" fill="none">
              {/* Simple human silhouette */}
              <ellipse cx="80" cy="30" rx="22" ry="26" className="fill-muted stroke-border" strokeWidth="1.5" />
              {/* Neck */}
              <rect x="72" y="56" width="16" height="14" rx="4" className="fill-muted" />
              {/* Torso */}
              <path d="M50 70 L110 70 L105 180 L55 180 Z" rx="8" className="fill-secondary stroke-border" strokeWidth="1.5" />
              {/* Arms */}
              <path d="M50 75 L20 140 L28 144 L54 90" className="fill-secondary stroke-border" strokeWidth="1.5" />
              <path d="M110 75 L140 140 L132 144 L106 90" className="fill-secondary stroke-border" strokeWidth="1.5" />
              {/* Legs */}
              <path d="M58 180 L50 290 L66 290 L74 185" className="fill-secondary stroke-border" strokeWidth="1.5" />
              <path d="M102 180 L110 290 L94 290 L86 185" className="fill-secondary stroke-border" strokeWidth="1.5" />
              {/* Feet */}
              <ellipse cx="58" cy="296" rx="14" ry="6" className="fill-muted" />
              <ellipse cx="102" cy="296" rx="14" ry="6" className="fill-muted" />

              {/* Highlight zones with animated pulses */}
              {highlights.some(h => h.zone === "brain") && (
                <circle cx="80" cy="28" r="18" className="fill-health-amber/20 animate-pulse" />
              )}
              {highlights.some(h => h.zone === "chest") && (
                <circle cx="80" cy="110" r="22" className="fill-health-red/20 animate-pulse" />
              )}
              {highlights.some(h => h.zone === "stomach") && (
                <circle cx="80" cy="150" r="18" className="fill-health-red/20 animate-pulse" />
              )}
              {highlights.some(h => h.zone === "legs") && (
                <>
                  <circle cx="58" cy="240" r="14" className="fill-health-amber/20 animate-pulse" />
                  <circle cx="102" cy="240" r="14" className="fill-health-amber/20 animate-pulse" />
                </>
              )}

              {/* Node points on body */}
              {[
                [80, 28], [80, 80], [80, 110], [80, 150], [35, 130], [125, 130],
                [58, 220], [102, 220], [58, 270], [102, 270],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="3" className="fill-accent/60" />
              ))}
            </svg>

            {/* Floating highlight labels */}
            {highlights.length > 0 && (
              <div className="absolute top-2 right-0 space-y-1">
                {highlights.map((h, i) => (
                  <div key={i} className={`text-[10px] px-2 py-0.5 rounded-full bg-card border border-border shadow-sm ${h.color} font-medium`}>
                    {h.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Health Score & Stats */}
          <div className="flex-1 flex flex-col items-center lg:items-start gap-4">
            {/* Health Score Gauge */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                <circle
                  cx="60" cy="60" r="54"
                  stroke="hsl(var(--accent))"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - scorePercent / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-display font-bold text-foreground">{scorePercent}</span>
                <span className="text-[10px] text-muted-foreground">Health Score</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                { icon: Footprints, label: "Activity", value: `${twinState.averageActivity} min`, good: twinState.averageActivity >= 30 },
                { icon: Brain, label: "Sleep", value: `${twinState.averageSleep} hrs`, good: twinState.averageSleep >= 7 },
                { icon: Heart, label: "Diet", value: `${twinState.averageDiet}/10`, good: twinState.averageDiet >= 7 },
                { icon: Zap, label: "Stress", value: `${twinState.averageStress}/10`, good: twinState.averageStress <= 4 },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                  <s.icon className={`w-3.5 h-3.5 ${s.good ? "text-health-green" : "text-health-amber"}`} />
                  <div>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    <p className={`text-xs font-semibold ${s.good ? "text-health-green" : "text-health-amber"}`}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
