import { useMemo } from "react";
import { LifestyleEntry } from "@/types/lifestyle";

interface HealthIndexBarProps {
  entries: LifestyleEntry[];
}

export function HealthIndexBar({ entries }: HealthIndexBarProps) {
  const healthScore = useMemo(() => {
    if (entries.length === 0) return 50;
    const recent = entries.slice(0, Math.min(7, entries.length));
    const avgActivity = recent.reduce((s, e) => s + e.physical_activity_minutes, 0) / recent.length;
    const avgSleep = recent.reduce((s, e) => s + e.sleep_hours, 0) / recent.length;
    const avgDiet = recent.reduce((s, e) => s + e.diet_quality_score, 0) / recent.length;
    const avgStress = recent.reduce((s, e) => s + e.stress_level, 0) / recent.length;
    const avgScreen = recent.reduce((s, e) => s + e.screen_time_hours, 0) / recent.length;
    return Math.round(
      Math.min(avgActivity / 60, 1) * 25 +
      Math.min(avgSleep / 8, 1) * 25 +
      (avgDiet / 10) * 20 +
      ((10 - avgStress) / 10) * 15 +
      Math.max(1 - avgScreen / 10, 0) * 15
    );
  }, [entries]);

  const barColor = healthScore >= 70 ? "bg-health-green" : healthScore >= 40 ? "bg-health-amber" : "bg-health-red";

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground">Health Index Score</h4>
        <span className="text-xs text-muted-foreground">{healthScore}/100</span>
      </div>
      <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${barColor} transition-all duration-1000`}
          style={{ width: `${healthScore}%` }}
        />
        {/* Optimal range indicator */}
        <div className="absolute inset-y-0 left-[65%] w-[25%] border-l-2 border-r-2 border-health-green/30" />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">Poor</span>
        <span className="text-[10px] text-health-green font-medium">Optimal 65-90</span>
        <span className="text-[10px] text-muted-foreground">Max</span>
      </div>
    </div>
  );
}
