import { useMemo } from "react";
import { LifestyleEntry } from "@/types/lifestyle";
import { calculateCorrelationMatrix, CorrelationPair } from "@/lib/correlation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CorrelationHeatmapProps {
  entries: LifestyleEntry[];
}

function getCellColor(value: number): string {
  const absVal = Math.abs(value);
  if (value === 1) return "bg-muted";
  if (absVal < 0.2) return "bg-secondary/50";
  if (value > 0) {
    return absVal > 0.6 ? "bg-health-green/40" : absVal > 0.4 ? "bg-health-green/25" : "bg-health-green/10";
  }
  return absVal > 0.6 ? "bg-health-red/40" : absVal > 0.4 ? "bg-health-red/25" : "bg-health-red/10";
}

function getCellTextColor(value: number): string {
  const absVal = Math.abs(value);
  if (value === 1) return "text-muted-foreground";
  if (absVal < 0.2) return "text-muted-foreground/60";
  return value > 0 ? "text-health-green" : "text-health-red";
}

const SHORT_LABELS = ["Activity", "Sleep", "Diet", "Stress", "Screen"];

export function CorrelationHeatmap({ entries }: CorrelationHeatmapProps) {
  const correlationData = useMemo(
    () => (entries.length >= 5 ? calculateCorrelationMatrix(entries) : null),
    [entries]
  );

  if (!correlationData) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <h3 className="text-lg font-display font-semibold text-foreground mb-2">
          Metric Correlations
        </h3>
        <p className="text-sm text-muted-foreground">
          Log at least 5 days of data to reveal statistical correlations between your lifestyle metrics.
        </p>
      </div>
    );
  }

  const topInsights = correlationData.pairs.filter((p) => Math.abs(p.coefficient) >= 0.2).slice(0, 3);

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-accent" />
          Pearson Correlation Matrix
        </h3>
        <p className="text-sm text-muted-foreground">
          Statistical relationships between your {correlationData.sampleSize}-day metrics
        </p>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          {/* Header row */}
          <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${SHORT_LABELS.length}, 1fr)` }}>
            <div />
            {SHORT_LABELS.map((label) => (
              <div key={label} className="text-xs font-medium text-muted-foreground text-center py-2 truncate">
                {label}
              </div>
            ))}

            {/* Data rows */}
            {correlationData.matrix.map((row, i) => (
              <>
                <div key={`label-${i}`} className="text-xs font-medium text-muted-foreground flex items-center pr-2 truncate">
                  {SHORT_LABELS[i]}
                </div>
                {row.map((value, j) => (
                  <Tooltip key={`${i}-${j}`}>
                    <TooltipTrigger asChild>
                      <div
                        className={`aspect-square rounded-md flex items-center justify-center cursor-pointer transition-all hover:ring-2 hover:ring-accent/50 ${getCellColor(value)}`}
                      >
                        <span className={`text-xs font-mono font-bold ${getCellTextColor(value)}`}>
                          {i === j ? "—" : value.toFixed(2)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      {i === j ? (
                        <p className="text-xs">Self-correlation (always 1.0)</p>
                      ) : (
                        <div className="text-xs space-y-1">
                          <p className="font-medium">
                            {SHORT_LABELS[i]} ↔ {SHORT_LABELS[j]}
                          </p>
                          <p>r = {value.toFixed(3)}</p>
                          <p className="text-muted-foreground">
                            {correlationData.pairs.find(
                              (p) =>
                                (p.metricA.includes(SHORT_LABELS[i].toLowerCase()) &&
                                  p.metricB.includes(SHORT_LABELS[j].toLowerCase())) ||
                                (p.metricB.includes(SHORT_LABELS[i].toLowerCase()) &&
                                  p.metricA.includes(SHORT_LABELS[j].toLowerCase()))
                            )?.interpretation || ""}
                          </p>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-health-red/40" />
          <span>Negative</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-secondary/50" />
          <span>None</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-health-green/40" />
          <span>Positive</span>
        </div>
      </div>

      {/* Top Insights */}
      {topInsights.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium text-foreground">Key Insights</h4>
          {topInsights.map((insight, idx) => {
            const Icon = insight.direction === "positive" ? TrendingUp : insight.direction === "negative" ? TrendingDown : Minus;
            const color = insight.direction === "positive" ? "text-health-green" : insight.direction === "negative" ? "text-health-red" : "text-muted-foreground";
            return (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30">
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                <p className="text-xs text-muted-foreground">{insight.interpretation} (r={insight.coefficient})</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
