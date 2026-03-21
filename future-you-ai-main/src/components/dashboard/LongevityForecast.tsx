import { useMemo } from "react";
import { Timer, Heart, Activity, Moon, Salad, Wine, Cigarette, Brain, Smartphone, TrendingDown } from "lucide-react";
import { WearableMetric, AgingForecast } from "@/types/lifestyle";
import { Progress } from "@/components/ui/progress";

interface LongevityForecastProps {
  profile: any;
  wearableData: WearableMetric[];
}

export function LongevityForecast({ profile, wearableData }: LongevityForecastProps) {
  const forecast = useMemo((): AgingForecast => {
    const chronoAge = profile?.age || 30;
    if (!profile) return {
      chronologicalAge: chronoAge,
      biologicalAge: chronoAge,
      agingRate: 1,
      healthspan: 80 - chronoAge,
      projectedLifespan: 80,
      influencingFactors: []
    };
    
    let bioAge = chronoAge;
    const factors: AgingForecast["influencingFactors"] = [];

    // BMI Impact
    if (profile?.height_cm && profile?.weight_kg) {
      const bmi = profile.weight_kg / Math.pow(profile.height_cm / 100, 2);
      if (bmi > 25) {
        const excess = Math.floor((bmi - 25) / 2);
        bioAge += excess;
        if (excess > 0) factors.push({ factor: "BMI", impact: "negative", description: `High BMI (+${excess} yrs)` });
      } else if (bmi >= 18.5 && bmi <= 24.9) {
        bioAge -= 1;
        factors.push({ factor: "BMI", impact: "positive", description: "Healthy weight range (-1 yr)" });
      }
    }

    // Heart Rate Impact
    const hr = wearableData?.find(d => d.data_type === "heart_rate")?.value;
    if (hr) {
      if (hr > 80) {
        bioAge += 2;
        factors.push({ factor: "Heart Rate", impact: "negative", description: "Elevated resting HR (+2 yrs)" });
      } else if (hr < 65) {
        bioAge -= 1;
        factors.push({ factor: "Heart Rate", impact: "positive", description: "Efficient cardiovascular system (-1 yr)" });
      }
    }

    // Activity Impact
    const steps = wearableData?.find(d => d.data_type === "steps")?.value;
    if (steps) {
      if (steps < 4000) {
        bioAge += 2;
        factors.push({ factor: "Physical Activity", impact: "negative", description: "Sedentary lifestyle (+2 yrs)" });
      } else if (steps > 10000) {
        bioAge -= 2;
        factors.push({ factor: "Physical Activity", impact: "positive", description: "Active lifestyle (-2 yrs)" });
      }
    }

    // Sleep Impact
    const sleepHours = wearableData?.find(d => d.data_type === "sleep")?.value;
    if (sleepHours) {
      if (sleepHours < 6) {
        bioAge += 3;
        factors.push({ factor: "Sleep", impact: "negative", description: "Chronic sleep debt (+3 yrs)" });
      } else if (sleepHours >= 7 && sleepHours <= 9) {
        bioAge -= 1;
        factors.push({ factor: "Sleep", impact: "positive", description: "Restorative sleep (-1 yr)" });
      }
    }

    // Smoking & Alcohol
    if (profile?.smoking_status !== "non-smoker") {
      const smokingPenalty = profile.smoking_status === "current-heavy" ? 8 : 4;
      bioAge += smokingPenalty;
      factors.push({ factor: "Smoking", impact: "negative", description: `Smoking impact (+${smokingPenalty} yrs)` });
    }

    if (profile?.alcohol_weekly_units > 14) {
      bioAge += 2;
      factors.push({ factor: "Alcohol", impact: "negative", description: "Excessive alcohol consumption (+2 yrs)" });
    }

    // Mental Health
    if (profile?.mental_health_index && profile.mental_health_index < 5) {
      bioAge += 2;
      factors.push({ factor: "Stress/Mental", impact: "negative", description: "Chronic stress impact (+2 yrs)" });
    }

    const agingRate = bioAge / chronoAge;
    // Estimated healthspan: chronological age + (remaining life expectancy adjusted by bio age)
    // Average lifespan assumed 80
    const projectedLifespan = 80 + (chronoAge - bioAge);
    const healthspanRemaining = Math.max(0, projectedLifespan - chronoAge);

    return {
      chronologicalAge: chronoAge,
      biologicalAge: bioAge,
      agingRate: Number(agingRate.toFixed(2)),
      healthspan: Math.round(healthspanRemaining),
      projectedLifespan: Math.round(projectedLifespan),
      influencingFactors: factors.slice(0, 4)
    };
  }, [profile, wearableData]);

  const agingColor = forecast.agingRate > 1.1 ? "text-health-red" : forecast.agingRate < 0.95 ? "text-health-green" : "text-health-amber";

  return (
    <div className="p-6 rounded-2xl bg-card border border-border relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Smartphone className="w-16 h-16 rotate-12" />
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 relative z-10">
        <div className="flex-shrink-0 text-center md:text-left">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Biological Age</h3>
          <div className="flex items-baseline gap-2 justify-center md:justify-start">
            <span className="text-6xl font-display font-bold text-foreground">{forecast.biologicalAge}</span>
            <span className="text-xl text-muted-foreground italic">vs {forecast.chronologicalAge}</span>
          </div>
          <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-sm font-semibold ${agingColor}`}>
            <Timer className="w-4 h-4" />
            Aging at {forecast.agingRate}x
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-tight">Healthy Years Left</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-health-green">{forecast.healthspan}</span>
                <span className="text-xs text-muted-foreground">yrs healthspan</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-tight">Projected Lifespan</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{forecast.projectedLifespan}</span>
                <span className="text-xs text-muted-foreground">years total</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="text-muted-foreground">Longevity Potential</span>
              <span className={agingColor}>{100 - Math.round((forecast.agingRate - 0.8) * 100)}% Optimal</span>
            </div>
            <Progress value={Math.max(10, 100 - (forecast.agingRate - 0.8) * 100)} className="h-2" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {forecast.influencingFactors.map((f, i) => (
              <div key={i} className="flex flex-col gap-1 p-2 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-1.5">
                  {f.impact === "positive" ? <Activity className="w-3 h-3 text-health-green" /> : <TrendingDown className="w-3 h-3 text-health-red" />}
                  <span className="text-[10px] font-bold truncate">{f.factor}</span>
                </div>
                <p className="text-[9px] text-muted-foreground leading-tight">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

