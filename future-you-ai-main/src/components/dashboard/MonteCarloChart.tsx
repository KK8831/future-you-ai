import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { LifestyleEntry } from "@/types/lifestyle";
import { monteCarloSimulation } from "@/lib/advanced-analytics";
import { TrendingUp } from "lucide-react";

interface MonteCarloChartProps {
  entries: LifestyleEntry[];
}

export function MonteCarloChart({ entries }: MonteCarloChartProps) {
  const projections = useMemo(() => {
    if (entries.length < 5) return null;

    const sorted = [...entries].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());

    // Calculate daily health scores
    const healthScores = sorted.map((e) => {
      const actScore = Math.min(e.physical_activity_minutes / 60, 1) * 25;
      const sleepScore = Math.min(e.sleep_hours / 8, 1) * 25;
      const dietScore = (e.diet_quality_score / 10) * 20;
      const stressScore = ((10 - e.stress_level) / 10) * 15;
      const screenScore = Math.max(1 - e.screen_time_hours / 10, 0) * 15;
      return Math.round(actScore + sleepScore + dietScore + stressScore + screenScore);
    });

    const mc = monteCarloSimulation(healthScores, 14, 300);

    // Build chart data: historical + projected
    const chartData = sorted.slice(-14).map((e, i) => ({
      day: `Day ${i + 1}`,
      actual: healthScores[healthScores.length - 14 + i] || healthScores[i],
      p5: undefined as number | undefined,
      p50: undefined as number | undefined,
      p95: undefined as number | undefined,
    }));

    // Add projection points
    const lastScore = healthScores[healthScores.length - 1];
    const step = (mc.percentiles.p50 - lastScore) / 14;
    const stepLow = (mc.percentiles.p5 - lastScore) / 14;
    const stepHigh = (mc.percentiles.p95 - lastScore) / 14;

    for (let i = 1; i <= 14; i++) {
      chartData.push({
        day: `+${i}d`,
        actual: undefined as any,
        p5: Math.round(lastScore + stepLow * i),
        p50: Math.round(lastScore + step * i),
        p95: Math.round(lastScore + stepHigh * i),
      });
    }

    return { chartData, mc };
  }, [entries]);

  if (!projections) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <h3 className="text-lg font-display font-semibold text-foreground">Monte Carlo Projections</h3>
        <p className="text-sm text-muted-foreground mt-2">Need 5+ days of data for probabilistic health score forecasting.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="mb-4">
        <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Monte Carlo Health Score Projection
        </h3>
        <p className="text-sm text-muted-foreground">
          {projections.mc.simulations} simulations • 90% confidence band
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projections.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area type="monotone" dataKey="p95" stackId="band" stroke="none" fill="hsl(152 69% 45% / 0.1)" />
            <Area type="monotone" dataKey="p5" stackId="band" stroke="none" fill="hsl(152 69% 45% / 0.1)" />
            <Area type="monotone" dataKey="p50" stroke="hsl(152 69% 45%)" strokeWidth={2} strokeDasharray="5 5" fill="none" />
            <Area type="monotone" dataKey="actual" stroke="hsl(174 72% 40%)" strokeWidth={2} fill="hsl(174 72% 40% / 0.1)" dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Pessimistic (5th)</p>
          <p className="text-lg font-bold text-health-red">{projections.mc.percentiles.p5}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Expected (50th)</p>
          <p className="text-lg font-bold text-accent">{projections.mc.percentiles.p50}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Optimistic (95th)</p>
          <p className="text-lg font-bold text-health-green">{projections.mc.percentiles.p95}%</p>
        </div>
      </div>
    </div>
  );
}
