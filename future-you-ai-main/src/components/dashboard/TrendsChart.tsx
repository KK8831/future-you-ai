import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LifestyleEntry } from "@/types/lifestyle";
import { format, parseISO } from "date-fns";

interface TrendsChartProps {
  entries: LifestyleEntry[];
}

const metricOptions = [
  { key: "physical_activity_minutes", label: "Activity (min)", color: "#2dd4bf" },
  { key: "sleep_hours", label: "Sleep (hrs)", color: "#3b82f6" },
  { key: "diet_quality_score", label: "Diet Score", color: "#f59e0b" },
  { key: "stress_level", label: "Stress Level", color: "#a855f7" },
  { key: "screen_time_hours", label: "Screen Time (hrs)", color: "#ef4444" },
];

export function TrendsChart({ entries }: TrendsChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["physical_activity_minutes", "sleep_hours"]);

  const chartData = useMemo(() => {
    return [...entries]
      .reverse()
      .slice(-14)
      .map((entry) => ({
        date: format(parseISO(entry.entry_date), "MMM d"),
        physical_activity_minutes: entry.physical_activity_minutes,
        sleep_hours: entry.sleep_hours,
        diet_quality_score: entry.diet_quality_score,
        stress_level: entry.stress_level,
        screen_time_hours: entry.screen_time_hours,
      }));
  }, [entries]);

  const toggleMetric = (key: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground">Lifestyle Trends</h3>
          <p className="text-sm text-muted-foreground">Your metrics over the past 14 days</p>
        </div>
      </div>

      {/* Metric toggles */}
      <div className="flex flex-wrap gap-2 mb-6">
        {metricOptions.map((metric) => (
          <button
            key={metric.key}
            onClick={() => toggleMetric(metric.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              selectedMetrics.includes(metric.key)
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            style={{
              backgroundColor: selectedMetrics.includes(metric.key) ? metric.color : "transparent",
            }}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              {metricOptions
                .filter((m) => selectedMetrics.includes(m.key))
                .map((metric) => (
                  <Line
                    key={metric.key}
                    type="monotone"
                    dataKey={metric.key}
                    name={metric.label}
                    stroke={metric.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: metric.color }}
                    activeDot={{ r: 5 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <p>No data yet. Start logging your lifestyle to see trends.</p>
        </div>
      )}
    </div>
  );
}