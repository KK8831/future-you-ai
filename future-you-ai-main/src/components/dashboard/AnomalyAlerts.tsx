import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { LifestyleEntry } from "@/types/lifestyle";
import { detectAnomalies, AnomalyPoint } from "@/lib/advanced-analytics";

interface AnomalyAlertsProps {
  entries: LifestyleEntry[];
}

const metricLabels: Record<string, string> = {
  physical_activity_minutes: "Activity",
  sleep_hours: "Sleep",
  diet_quality_score: "Diet",
  stress_level: "Stress",
  screen_time_hours: "Screen Time",
};

export function AnomalyAlerts({ entries }: AnomalyAlertsProps) {
  const anomalies = useMemo(() => (entries.length >= 5 ? detectAnomalies(entries, 2.0) : []), [entries]);

  if (anomalies.length === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-health-amber/5 border border-health-amber/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-health-amber" />
        <h4 className="text-sm font-semibold text-foreground">
          {anomalies.length} Anomal{anomalies.length === 1 ? "y" : "ies"} Detected
        </h4>
      </div>
      <div className="space-y-2">
        {anomalies.slice(0, 3).map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${
              a.severity === "severe" ? "bg-health-red" : a.severity === "moderate" ? "bg-health-amber" : "bg-secondary"
            }`} />
            <span>
              <strong>{metricLabels[a.metric]}</strong>: {a.direction === "high" ? "unusually high" : "unusually low"} ({a.value}) on {a.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
