import { useMemo } from "react";
import { LifestyleEntry } from "@/types/lifestyle";
import { calculateMedicalRisks, HealthProfile } from "@/lib/medical-calculators";
import { Activity, Heart, TrendingUp, TrendingDown, Minus, Zap, Shield } from "lucide-react";

interface SplitScreenSimulationProps {
  entries: LifestyleEntry[];
  profile: HealthProfile;
  changes: {
    activityChange: number; // percent
    sleepChange: number;
    dietChange: number;
    stressChange: number;
    screenChange: number;
  };
  timeframeYears: number;
}

function HealthAvatar({ score, label, isOptimized }: { score: number; label: string; isOptimized: boolean }) {
  // Visual health representation using CSS filters/colors
  const hue = Math.round((score / 100) * 120); // 0=red, 120=green
  const saturation = 60 + (score / 100) * 30;
  const glow = isOptimized ? "shadow-[0_0_30px_hsl(152_69%_45%/0.3)]" : score < 40 ? "shadow-[0_0_30px_hsl(0_72%_55%/0.2)]" : "";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative w-24 h-24 rounded-full border-4 transition-all duration-700 ${glow}`} style={{
        borderColor: `hsl(${hue}, ${saturation}%, 45%)`,
        background: `radial-gradient(circle, hsl(${hue} ${saturation}% 45% / 0.15), transparent)`,
      }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity className="w-8 h-8" style={{ color: `hsl(${hue}, ${saturation}%, 45%)` }} />
        </div>
        {/* Age indicator rings */}
        {!isOptimized && score < 50 && (
          <>
            <div className="absolute -inset-1 rounded-full border border-health-red/20 animate-pulse" />
            <div className="absolute -inset-2 rounded-full border border-health-red/10" />
          </>
        )}
        {isOptimized && score > 60 && (
          <>
            <div className="absolute -inset-1 rounded-full border border-health-green/30 animate-pulse-ring" />
          </>
        )}
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold" style={{ color: `hsl(${hue}, ${saturation}%, 45%)` }}>
          {score}%
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function MetricComparison({
  label,
  currentValue,
  optimizedValue,
  unit,
  higherIsBetter,
}: {
  label: string;
  currentValue: number;
  optimizedValue: number;
  unit: string;
  higherIsBetter: boolean;
}) {
  const improved = higherIsBetter ? optimizedValue > currentValue : optimizedValue < currentValue;
  const unchanged = Math.abs(optimizedValue - currentValue) < 0.1;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/20">
      <span className="text-xs text-muted-foreground w-16 truncate">{label}</span>
      <span className="text-xs font-mono text-foreground w-14 text-right">
        {currentValue.toFixed(1)}{unit}
      </span>
      <div className="flex-shrink-0">
        {unchanged ? (
          <Minus className="w-3 h-3 text-muted-foreground" />
        ) : improved ? (
          <TrendingUp className="w-3 h-3 text-health-green" />
        ) : (
          <TrendingDown className="w-3 h-3 text-health-red" />
        )}
      </div>
      <span className={`text-xs font-mono font-bold w-14 text-right ${
        unchanged ? "text-muted-foreground" : improved ? "text-health-green" : "text-health-red"
      }`}>
        {optimizedValue.toFixed(1)}{unit}
      </span>
    </div>
  );
}

export function SplitScreenSimulation({
  entries,
  profile,
  changes,
  timeframeYears,
}: SplitScreenSimulationProps) {
  const { current, optimized } = useMemo(() => {
    if (entries.length < 3) return { current: null, optimized: null };

    const recent = entries.slice(0, Math.min(14, entries.length));
    const currentMetrics = {
      avgActivityMinutes: recent.reduce((s, e) => s + e.physical_activity_minutes, 0) / recent.length,
      avgSleepHours: recent.reduce((s, e) => s + e.sleep_hours, 0) / recent.length,
      avgDietScore: recent.reduce((s, e) => s + e.diet_quality_score, 0) / recent.length,
      avgStressLevel: recent.reduce((s, e) => s + e.stress_level, 0) / recent.length,
      avgScreenTimeHours: recent.reduce((s, e) => s + e.screen_time_hours, 0) / recent.length,
    };

    const optimizedMetrics = {
      avgActivityMinutes: Math.max(0, currentMetrics.avgActivityMinutes * (1 + changes.activityChange / 100)),
      avgSleepHours: Math.max(0, Math.min(12, currentMetrics.avgSleepHours + changes.sleepChange)),
      avgDietScore: Math.max(1, Math.min(10, currentMetrics.avgDietScore + changes.dietChange)),
      avgStressLevel: Math.max(1, Math.min(10, currentMetrics.avgStressLevel + changes.stressChange)),
      avgScreenTimeHours: Math.max(0, Math.min(16, currentMetrics.avgScreenTimeHours + changes.screenChange)),
    };

    // Age projection
    const futureProfile = { ...profile, age: profile.age + timeframeYears };

    const currentResult = calculateMedicalRisks(profile, currentMetrics);
    const optimizedResult = calculateMedicalRisks(futureProfile, optimizedMetrics);

    return {
      current: { metrics: currentMetrics, result: currentResult },
      optimized: { metrics: optimizedMetrics, result: optimizedResult },
    };
  }, [entries, profile, changes, timeframeYears]);

  if (!current || !optimized) {
    return null;
  }

  const cvdReduction = current.result.framingham.riskPercentage - optimized.result.framingham.riskPercentage;
  const diabetesReduction = current.result.findrisc.riskPercentage - optimized.result.findrisc.riskPercentage;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-accent/5 border-b border-border">
        <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          Split-Screen Health Projection
        </h3>
        <p className="text-sm text-muted-foreground">
          Current path vs. optimized lifestyle over {timeframeYears} years
        </p>
      </div>

      <div className="grid md:grid-cols-2">
        {/* Current Path */}
        <div className="p-6 border-r border-border bg-health-red/[0.02]">
          <div className="text-center mb-4">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground">
              CURRENT PATH
            </span>
          </div>
          <div className="flex justify-center mb-6">
            <HealthAvatar score={current.result.combinedHealthScore} label="Health Score Today" isOptimized={false} />
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CVD Risk</span>
              <span className="font-bold text-health-red">{current.result.framingham.riskPercentage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diabetes Risk</span>
              <span className="font-bold text-health-amber">{current.result.findrisc.riskPercentage}%</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Current Metrics</p>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>Activity: {Math.round(current.metrics.avgActivityMinutes)} min/day</p>
              <p>Sleep: {current.metrics.avgSleepHours.toFixed(1)} hrs</p>
              <p>Diet: {current.metrics.avgDietScore.toFixed(1)}/10</p>
              <p>Stress: {current.metrics.avgStressLevel.toFixed(1)}/10</p>
              <p>Screen: {current.metrics.avgScreenTimeHours.toFixed(1)} hrs</p>
            </div>
          </div>
        </div>

        {/* Optimized Path */}
        <div className="p-6 bg-health-green/[0.02]">
          <div className="text-center mb-4">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-accent/10 text-accent">
              OPTIMIZED PATH
            </span>
          </div>
          <div className="flex justify-center mb-6">
            <HealthAvatar
              score={optimized.result.combinedHealthScore}
              label={`Projected in ${timeframeYears}yr`}
              isOptimized={true}
            />
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CVD Risk</span>
              <span className="font-bold text-health-green">{optimized.result.framingham.riskPercentage}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diabetes Risk</span>
              <span className="font-bold text-health-green">{optimized.result.findrisc.riskPercentage}%</span>
            </div>
          </div>

          {/* Improvement badges */}
          <div className="space-y-2">
            {cvdReduction > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-health-green/10">
                <Shield className="w-4 h-4 text-health-green" />
                <span className="text-xs text-health-green font-medium">
                  CVD risk reduced by {cvdReduction}%
                </span>
              </div>
            )}
            {diabetesReduction > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-health-green/10">
                <Shield className="w-4 h-4 text-health-green" />
                <span className="text-xs text-health-green font-medium">
                  Diabetes risk reduced by {diabetesReduction}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric Comparison Bar */}
      <div className="p-4 bg-secondary/20 border-t border-border">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mb-2">
          <span>Current</span>
          <span>→</span>
          <span>Optimized</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <MetricComparison
            label="Activity"
            currentValue={current.metrics.avgActivityMinutes}
            optimizedValue={optimized.metrics.avgActivityMinutes}
            unit="m"
            higherIsBetter={true}
          />
          <MetricComparison
            label="Sleep"
            currentValue={current.metrics.avgSleepHours}
            optimizedValue={optimized.metrics.avgSleepHours}
            unit="h"
            higherIsBetter={true}
          />
          <MetricComparison
            label="Diet"
            currentValue={current.metrics.avgDietScore}
            optimizedValue={optimized.metrics.avgDietScore}
            unit=""
            higherIsBetter={true}
          />
          <MetricComparison
            label="Stress"
            currentValue={current.metrics.avgStressLevel}
            optimizedValue={optimized.metrics.avgStressLevel}
            unit=""
            higherIsBetter={false}
          />
          <MetricComparison
            label="Screen"
            currentValue={current.metrics.avgScreenTimeHours}
            optimizedValue={optimized.metrics.avgScreenTimeHours}
            unit="h"
            higherIsBetter={false}
          />
        </div>
      </div>
    </div>
  );
}
