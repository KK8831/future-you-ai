import { useMemo, useState, useEffect } from "react";
import { LifestyleEntry } from "@/types/lifestyle";
import { 
  calculateMedicalRisks, 
  MedicalRiskResult, 
  HealthProfile,
} from "@/lib/medical-calculators";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, 
  Droplets, 
  ChevronDown, 
  ChevronUp, 
  FlaskConical, 
  Info, 
  Smartphone, 
  Brain, 
  Moon, 
  Zap, 
  Activity,
  AlertTriangle
} from "lucide-react";
import { WearableMetric } from "@/types/lifestyle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MedicalRiskScoresProps {
  entries: LifestyleEntry[];
  userId?: string;
  wearableData?: WearableMetric[];
}

function RiskGauge({ percentage, label, category, icon: Icon }: { 
  percentage: number; 
  label: string; 
  category: string;
  icon: React.ElementType;
}) {
  const color = percentage < 10 ? "text-health-green" : percentage < 25 ? "text-health-amber" : "text-health-red";
  const bgColor = percentage < 10 ? "bg-health-green" : percentage < 25 ? "bg-health-amber" : "bg-health-red";

  return (
    <div className="flex flex-col items-center gap-2 group cursor-default">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
          <circle
            cx="50" cy="50" r="42"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${color}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color} group-hover:scale-110 transition-transform`} />
          <span className={`text-base sm:text-lg font-bold ${color}`}>{percentage}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] sm:text-xs font-semibold text-foreground uppercase tracking-wider">{label}</p>
        <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full ${bgColor}/10 ${color} font-bold capitalize`}>
          {category.replace("-", " ")}
        </span>
      </div>
    </div>
  );
}

function BreakdownTable({ breakdown, title, icon: Icon, color, info }: { 
  breakdown: { factor: string; points: number; description: string }[];
  title: string;
  icon: React.ElementType;
  color: string;
  info?: string;
  disclaimer?: string;
}) {
  return (
    <div className="space-y-3">
      <h4 className={`text-sm font-bold flex items-center gap-2 ${color}`}>
        <Icon className="w-4 h-4" />
        {title}
      </h4>
      <div className="space-y-2">
        {breakdown.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <span className={`text-[10px] font-mono font-bold min-w-[28px] text-center px-1 py-0.5 rounded ${
              item.points < 0 ? "text-health-green bg-health-green/10" :
              item.points === 0 ? "text-muted-foreground bg-muted" :
              "text-health-red bg-health-red/10"
            }`}>
              {item.points > 0 ? "+" : ""}{item.points}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{item.factor}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      {info && (
        <div className="p-2 rounded bg-muted/50 border border-border/50">
          <p className="text-[10px] text-muted-foreground italic flex items-start gap-1.5 line-clamp-2">
            <Info className="w-3 h-3 flex-shrink-0" />
            {info}
          </p>
        </div>
      )}
    </div>
  );
}

export function MedicalRiskScores({ entries, userId, wearableData = [] }: MedicalRiskScoresProps) {
  const heartRate = wearableData?.find((d) => d.data_type === "heart_rate")?.value;
  const steps = wearableData?.find((d) => d.data_type === "steps")?.value;
  const hasWearable = !!heartRate || !!steps;
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [profile, setProfile] = useState<HealthProfile>({
    age: 30,
    sex: "unspecified",
    heightCm: 170,
    weightKg: 70,
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("age, sex, height_cm, weight_kg")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            age: data.age || 30,
            sex: (data.sex as HealthProfile["sex"]) || "unspecified",
            heightCm: Number(data.height_cm) || 170,
            weightKg: Number(data.weight_kg) || 70,
          });
          setProfileLoaded(true);
          setShowProfileForm(!data.age || !data.height_cm || !data.weight_kg);
        } else {
          setShowProfileForm(true);
        }
      });
  }, [userId]);

  const saveProfile = async () => {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({
        age: profile.age,
        sex: profile.sex,
        height_cm: profile.heightCm,
        weight_kg: profile.weightKg,
      })
      .eq("user_id", userId);
    setShowProfileForm(false);
    setProfileLoaded(true);
  };

  const metrics = useMemo(() => {
    if (entries.length < 3) return null;
    const recent = entries.slice(0, Math.min(14, entries.length));
    return {
      avgActivityMinutes: recent.reduce((s, e) => s + e.physical_activity_minutes, 0) / recent.length,
      avgSleepHours: recent.reduce((s, e) => s + e.sleep_hours, 0) / recent.length,
      avgDietScore: recent.reduce((s, e) => s + e.diet_quality_score, 0) / recent.length,
      avgStressLevel: recent.reduce((s, e) => s + e.stress_level, 0) / recent.length,
      avgScreenTimeHours: recent.reduce((s, e) => s + e.screen_time_hours, 0) / recent.length,
    };
  }, [entries]);

  const results = useMemo(() => {
    if (!metrics) return null;
    return calculateMedicalRisks(profile, metrics);
  }, [profile, metrics]);

  if (entries.length < 3) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-accent" />
          Medical Risk Assessment
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Log at least 3 days of data for validated epidemiological risk assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-accent" />
            Clinical Risk Projections
          </h3>
          <p className="text-sm text-muted-foreground">
            Multi-factor epidemiological modeling from lifestyle patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasWearable && (
            <span className="hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              <Smartphone className="w-3 h-3" />
              Wearable Enhanced
            </span>
          )}
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setShowProfileForm(!showProfileForm)}
            className="text-xs text-accent hover:text-accent/80 p-0 h-auto"
          >
            {showProfileForm ? "Hide Profile" : "Edit Profile"}
          </Button>
        </div>
      </div>

      {showProfileForm && (
        <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border space-y-4 animate-in slide-in-from-top-2">
          <h4 className="text-sm font-bold text-foreground">Health Profile Update</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs font-semibold">Age</Label>
              <Input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile((p) => ({ ...p, age: parseInt(e.target.value) || 30 }))}
                min={18}
                max={99}
                className="h-9 mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Sex</Label>
              <Select value={profile.sex} onValueChange={(v) => setProfile((p) => ({ ...p, sex: v as HealthProfile["sex"] }))}>
                <SelectTrigger className="h-9 mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unspecified">Unspecified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Height (cm)</Label>
              <Input
                type="number"
                value={profile.heightCm}
                onChange={(e) => setProfile((p) => ({ ...p, heightCm: parseFloat(e.target.value) || 170 }))}
                className="h-9 mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Weight (kg)</Label>
              <Input
                type="number"
                value={profile.weightKg}
                onChange={(e) => setProfile((p) => ({ ...p, weightKg: parseFloat(e.target.value) || 70 }))}
                className="h-9 mt-1 text-sm"
              />
            </div>
          </div>
          <Button size="sm" variant="hero" onClick={saveProfile} className="w-full sm:w-auto">
            Update Risk Baseline
          </Button>
        </div>
      )}

      {results && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-4 mb-8">
            <RiskGauge
              percentage={results.framingham.riskPercentage}
              label="CVD Risk"
              category={results.framingham.riskCategory}
              icon={Heart}
            />
            <RiskGauge
              percentage={results.findrisc.riskPercentage}
              label="Diabetes"
              category={results.findrisc.riskCategory}
              icon={Droplets}
            />
            <RiskGauge
              percentage={results.depressionAnxiety.riskPercentage}
              label="Wellness"
              category={results.depressionAnxiety.riskCategory}
              icon={Brain}
            />
            <RiskGauge
              percentage={results.sleepDisorder.riskPercentage}
              label="Sleep Apnea"
              category={results.sleepDisorder.riskCategory}
              icon={Moon}
            />
            <RiskGauge
              percentage={results.strokeRisk.riskPercentage}
              label="Stroke Risk"
              category={results.strokeRisk.riskCategory}
              icon={Zap}
            />
            <RiskGauge
              percentage={results.hypertension.riskPercentage}
              label="Hypertension"
              category={results.hypertension.riskCategory}
              icon={Activity}
            />
          </div>

          <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Methodology:</strong> {results.methodology}
            </p>
          </div>

          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="group flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80 w-full justify-center py-2 border-t border-border mt-4"
          >
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showBreakdown ? "Hide Clinical Breakdown" : "View Detailed Clinical Breakdown"}
          </button>

          {showBreakdown && (
            <div className="mt-8 grid lg:grid-cols-2 gap-x-12 gap-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <BreakdownTable 
                title="Cardiovascular (CVD)" 
                icon={Heart} 
                color="text-health-red"
                breakdown={results.framingham.breakdown} 
                info="Based on Framingham Heart Study adaptations for lifestyle variables."
              />
              <BreakdownTable 
                title="Type 2 Diabetes" 
                icon={Droplets} 
                color="text-health-blue"
                breakdown={results.findrisc.breakdown} 
                info={results.findrisc.interpretation}
              />
              <BreakdownTable 
                title="Emotional Wellness" 
                icon={Brain} 
                color="text-purple-500"
                breakdown={results.depressionAnxiety.breakdown} 
                info={results.depressionAnxiety.interpretation}
              />
              <BreakdownTable 
                title="Sleep Profile" 
                icon={Moon} 
                color="text-indigo-500"
                breakdown={results.sleepDisorder.breakdown} 
                info={results.sleepDisorder.interpretation}
              />
              <BreakdownTable 
                title="Cerebrovascular (Stroke)" 
                icon={Zap} 
                color="text-yellow-500"
                breakdown={results.strokeRisk.breakdown} 
                info={results.strokeRisk.disclaimer}
              />
              <BreakdownTable 
                title="Blood Pressure Progression" 
                icon={Activity} 
                color="text-green-500"
                breakdown={results.hypertension.breakdown} 
                info={results.hypertension.interpretation}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

