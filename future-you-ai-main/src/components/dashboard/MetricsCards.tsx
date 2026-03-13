import { useMemo } from "react";
import { Footprints, Moon, Apple, Brain, Monitor } from "lucide-react";
import { LifestyleEntry } from "@/types/lifestyle";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MetricsCardsProps {
  entries: LifestyleEntry[];
}

interface MetricConfig {
  key: keyof Pick<LifestyleEntry, "physical_activity_minutes" | "sleep_hours" | "diet_quality_score" | "stress_level" | "screen_time_hours">;
  label: string;
  icon: React.ElementType;
  unit: string;
  target: string;
  color: string;
  chartColor: string;
  getStatus: (value: number) => "good" | "warning" | "poor";
}

const metrics: MetricConfig[] = [
  { key: "physical_activity_minutes", label: "Activity", icon: Footprints, unit: "min", target: "30+", color: "health-green", chartColor: "#2dd4bf", getStatus: (v) => v >= 30 ? "good" : v >= 15 ? "warning" : "poor" },
  { key: "sleep_hours", label: "Sleep", icon: Moon, unit: "hrs", target: "7-9", color: "health-blue", chartColor: "#3b82f6", getStatus: (v) => v >= 7 && v <= 9 ? "good" : v >= 6 ? "warning" : "poor" },
  { key: "diet_quality_score", label: "Diet Quality", icon: Apple, unit: "/10", target: "7+", color: "health-amber", chartColor: "#f59e0b", getStatus: (v) => v >= 7 ? "good" : v >= 5 ? "warning" : "poor" },
  { key: "stress_level", label: "Stress", icon: Brain, unit: "/10", target: "<5", color: "health-purple", chartColor: "#a855f7", getStatus: (v) => v <= 4 ? "good" : v <= 6 ? "warning" : "poor" },
  { key: "screen_time_hours", label: "Screen Time", icon: Monitor, unit: "hrs", target: "<6", color: "health-red", chartColor: "#ef4444", getStatus: (v) => v <= 4 ? "good" : v <= 6 ? "warning" : "poor" },
];

const statusBadge = {
  good: "bg-health-green/10 text-health-green",
  warning: "bg-health-amber/10 text-health-amber",
  poor: "bg-health-red/10 text-health-red",
};

export function MetricsCards({ entries }: MetricsCardsProps) {
  const latestEntry = entries[0];

  const weekAvg = useMemo(() => {
    const recent = entries.slice(0, Math.min(7, entries.length));
    if (recent.length === 0) return null;
    return {
      physical_activity_minutes: Math.round(recent.reduce((s, e) => s + e.physical_activity_minutes, 0) / recent.length),
      sleep_hours: Number((recent.reduce((s, e) => s + e.sleep_hours, 0) / recent.length).toFixed(1)),
      diet_quality_score: Number((recent.reduce((s, e) => s + e.diet_quality_score, 0) / recent.length).toFixed(1)),
      stress_level: Number((recent.reduce((s, e) => s + e.stress_level, 0) / recent.length).toFixed(1)),
      screen_time_hours: Number((recent.reduce((s, e) => s + e.screen_time_hours, 0) / recent.length).toFixed(1)),
    };
  }, [entries]);

  // Sparkline data (last 7 entries reversed)
  const sparkData = useMemo(() => {
    return [...entries].slice(0, 7).reverse();
  }, [entries]);

  return (
    <div className="space-y-3">
      {metrics.map((metric) => {
        const value = latestEntry ? latestEntry[metric.key] : 0;
        const avgValue = weekAvg ? weekAvg[metric.key] : 0;
        const status = metric.getStatus(avgValue || (value as number));
        const sparkline = sparkData.map((e) => ({ v: e[metric.key] as number }));

        return (
          <div key={metric.key} className="p-4 rounded-xl bg-card border border-border hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${statusBadge[status]}`}>
                  <metric.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-foreground">{metric.label}</span>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge[status]}`}>
                {status}
              </span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold text-foreground">
                  {latestEntry ? value : "--"}
                </span>
                <span className="text-xs text-muted-foreground ml-1">{metric.unit}</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">Target: {metric.target}</p>
              </div>
              {sparkline.length > 1 && (
                <div className="w-20 h-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkline}>
                      <Line type="monotone" dataKey="v" stroke={metric.chartColor} strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
