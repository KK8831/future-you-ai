import { useMemo } from "react";
import { LifestyleEntry } from "@/types/lifestyle";
import { BarChart3 } from "lucide-react";

interface FeatureImportanceProps {
  entries: LifestyleEntry[];
}

interface Feature {
  name: string;
  importance: number;
  color: string;
}

export function FeatureImportance({ entries }: FeatureImportanceProps) {
  const features = useMemo((): Feature[] => {
    if (entries.length < 3) return [];
    const recent = entries.slice(0, Math.min(14, entries.length));

    // Calculate variance-based importance (simplified SHAP-like)
    const metrics = {
      Sleep: recent.map(e => e.sleep_hours),
      Activity: recent.map(e => e.physical_activity_minutes),
      Diet: recent.map(e => e.diet_quality_score),
      Stress: recent.map(e => e.stress_level),
      "Screen Time": recent.map(e => e.screen_time_hours),
    };

    const variances = Object.entries(metrics).map(([name, values]) => {
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
      // Weight by how far from optimal
      const optimalDist = name === "Sleep" ? Math.abs(mean - 7.5) / 7.5 :
        name === "Activity" ? Math.max(0, 1 - mean / 30) :
        name === "Diet" ? Math.max(0, 1 - mean / 7) :
        name === "Stress" ? mean / 10 :
        Math.max(0, mean / 8 - 0.5);
      return { name, score: (variance * 0.4 + optimalDist * 0.6) };
    });

    const total = variances.reduce((s, v) => s + v.score, 0) || 1;
    const colors = ["hsl(var(--health-blue))", "hsl(var(--health-green))", "hsl(var(--health-amber))", "hsl(var(--health-red))", "hsl(var(--health-purple))"];

    return variances
      .map((v, i) => ({ name: v.name, importance: Math.round((v.score / total) * 100), color: colors[i] }))
      .sort((a, b) => b.importance - a.importance);
  }, [entries]);

  if (features.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          Feature Importance
        </h4>
        <p className="text-xs text-muted-foreground mt-2">Need 3+ days of data.</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-accent" />
        Feature Importance (SHAP-like)
      </h4>
      <div className="space-y-2.5">
        {features.map((f) => (
          <div key={f.name}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-foreground font-medium">{f.name}</span>
              <span className="text-muted-foreground">{f.importance}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${f.importance}%`, backgroundColor: f.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
