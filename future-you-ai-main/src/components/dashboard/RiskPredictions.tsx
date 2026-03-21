import { useMemo } from "react";
import { AlertTriangle, Shield, Info, Smartphone } from "lucide-react";
import { LifestyleEntry, HealthRisk } from "@/types/lifestyle";
import { WearableMetric } from "@/types/lifestyle";

interface RiskPredictionsProps {
  entries: LifestyleEntry[];
  wearableData?: WearableMetric[];
}

function calculateRisks(entries: LifestyleEntry[], heartRateBpm?: number, stepsDailyAvg?: number): HealthRisk[] {
  if (entries.length < 3) return [];

  const recentEntries = entries.slice(0, Math.min(14, entries.length));
  const avgActivity = recentEntries.reduce((s, e) => s + e.physical_activity_minutes, 0) / recentEntries.length;
  const avgSleep    = recentEntries.reduce((s, e) => s + e.sleep_hours, 0) / recentEntries.length;
  const avgDiet     = recentEntries.reduce((s, e) => s + e.diet_quality_score, 0) / recentEntries.length;
  const avgStress   = recentEntries.reduce((s, e) => s + e.stress_level, 0) / recentEntries.length;
  const avgScreen   = recentEntries.reduce((s, e) => s + e.screen_time_hours, 0) / recentEntries.length;

  // Use wearable steps to supplement activity if available
  const effectiveActivity = stepsDailyAvg
    ? Math.max(avgActivity, stepsDailyAvg / 100) // ~10k steps ≈ 100 mins active
    : avgActivity;

  const risks: HealthRisk[] = [];

  // ── Cardiovascular risk ──────────────────────────────────────────────────
  let cardioRisk = 15;
  const cardioFactors: string[] = [];
  if (effectiveActivity < 30) { cardioRisk += 20; cardioFactors.push("Low physical activity"); }
  if (avgDiet < 6)             { cardioRisk += 15; cardioFactors.push("Poor diet quality"); }
  if (avgStress > 6)           { cardioRisk += 10; cardioFactors.push("High stress levels"); }
  // Heart rate: elevated resting HR (>80) is a known CVD risk factor
  if (heartRateBpm && heartRateBpm > 80) { cardioRisk += 12; cardioFactors.push(`Elevated resting HR (${heartRateBpm} bpm)`); }
  if (heartRateBpm && heartRateBpm > 100){ cardioRisk += 8;  cardioFactors.push("Tachycardia range HR"); }

  if (cardioFactors.length > 0) {
    risks.push({
      name: "Cardiovascular Disease",
      probability: Math.min(cardioRisk, 75),
      severity: cardioRisk > 40 ? "high" : cardioRisk > 25 ? "medium" : "low",
      factors: cardioFactors,
      timeframe: "10+ years",
    });
  }

  // ── Type 2 Diabetes risk ─────────────────────────────────────────────────
  let diabetesRisk = 10;
  const diabetesFactors: string[] = [];
  if (effectiveActivity < 20) { diabetesRisk += 25; diabetesFactors.push("Sedentary lifestyle"); }
  if (avgDiet < 5)             { diabetesRisk += 20; diabetesFactors.push("Poor dietary habits"); }
  if (avgScreen > 8)           { diabetesRisk += 10; diabetesFactors.push("Excessive sedentary screen time"); }
  if (stepsDailyAvg && stepsDailyAvg < 5000) { diabetesRisk += 10; diabetesFactors.push(`Low step count (${stepsDailyAvg} steps/day)`); }

  if (diabetesFactors.length > 0) {
    risks.push({
      name: "Type 2 Diabetes",
      probability: Math.min(diabetesRisk, 70),
      severity: diabetesRisk > 35 ? "high" : diabetesRisk > 20 ? "medium" : "low",
      factors: diabetesFactors,
      timeframe: "5-10 years",
    });
  }

  // ── Obesity risk ─────────────────────────────────────────────────────────
  let obesityRisk = 10;
  const obesityFactors: string[] = [];
  if (effectiveActivity < 30)           { obesityRisk += 20; obesityFactors.push("Insufficient exercise"); }
  if (avgDiet < 6)                       { obesityRisk += 15; obesityFactors.push("Unbalanced diet"); }
  if (avgSleep < 6 || avgSleep > 9)      { obesityRisk += 10; obesityFactors.push("Poor sleep patterns"); }

  if (obesityFactors.length > 0) {
    risks.push({
      name: "Obesity",
      probability: Math.min(obesityRisk, 65),
      severity: obesityRisk > 35 ? "high" : obesityRisk > 20 ? "medium" : "low",
      factors: obesityFactors,
      timeframe: "2-5 years",
    });
  }

  // ── Mental health risk ───────────────────────────────────────────────────
  let mentalRisk = 10;
  const mentalFactors: string[] = [];
  if (avgStress > 7) { mentalRisk += 25; mentalFactors.push("Chronic high stress"); }
  if (avgSleep < 6)  { mentalRisk += 20; mentalFactors.push("Sleep deprivation"); }
  if (avgScreen > 8) { mentalRisk += 10; mentalFactors.push("High screen exposure"); }

  if (mentalFactors.length > 0) {
    risks.push({
      name: "Mental Health Issues",
      probability: Math.min(mentalRisk, 60),
      severity: mentalRisk > 35 ? "high" : mentalRisk > 20 ? "medium" : "low",
      factors: mentalFactors,
      timeframe: "1-3 years",
    });
  }

  return risks.sort((a, b) => b.probability - a.probability);
}

const severityConfig = {
  low:    { bg: "bg-health-green/10", border: "border-health-green/30", text: "text-health-green", icon: Shield },
  medium: { bg: "bg-health-amber/10", border: "border-health-amber/30", text: "text-health-amber", icon: Info },
  high:   { bg: "bg-health-red/10",   border: "border-health-red/30",   text: "text-health-red",   icon: AlertTriangle },
};

export function RiskPredictions({ entries, wearableData = [] }: RiskPredictionsProps) {
  const heartRate  = wearableData?.find((d) => d.data_type === "heart_rate")?.value;
  const steps      = wearableData?.find((d) => d.data_type === "steps")?.value;
  const hasWearable = !!heartRate || !!steps;

  const risks = useMemo(
    () => calculateRisks(entries, heartRate, steps),
    [entries, heartRate, steps]
  );

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">Health Risk Predictions</h3>
            <p className="text-sm text-muted-foreground">Pattern-based risk analysis</p>
          </div>
          {hasWearable && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              <Smartphone className="w-3 h-3" />
              +Wearable
            </span>
          )}
        </div>
      </div>

      {risks.length > 0 ? (
        <div className="space-y-4">
          {risks.slice(0, 4).map((risk, index) => {
            const config = severityConfig[risk.severity];
            const Icon = config.icon;
            return (
              <div key={index} className={`p-4 rounded-lg ${config.bg} ${config.border} border`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${config.text}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="font-medium text-foreground">{risk.name}</h4>
                      <span className={`text-sm font-bold ${config.text}`}>{risk.probability}%</span>
                    </div>
                    <div className="h-2 bg-background rounded-full mb-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          risk.severity === "high" ? "bg-health-red" :
                          risk.severity === "medium" ? "bg-health-amber" : "bg-health-green"
                        }`}
                        style={{ width: `${risk.probability}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {risk.factors.map((factor, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-background text-muted-foreground">
                          {factor}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Risk timeframe: {risk.timeframe}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {entries.length < 3
              ? "Log at least 3 days of data to see risk predictions"
              : "No significant health risks detected. Keep up the good work!"}
          </p>
        </div>
      )}

      <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Disclaimer:</strong> These predictions are for educational purposes only and are not medical advice.
          Consult healthcare professionals for actual health assessments.
        </p>
      </div>
    </div>
  );
}