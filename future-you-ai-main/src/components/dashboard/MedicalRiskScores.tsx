import { useMemo, useState, useEffect } from "react";
import { LifestyleEntry } from "@/types/lifestyle";
import { 
  calculateMedicalRisks, 
  MedicalRiskResult, 
  HealthProfile,
  FraminghamResult,
  FindriscResult
} from "@/lib/medical-calculators";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Droplets, ChevronDown, ChevronUp, FlaskConical, Info, Smartphone } from "lucide-react";
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
  const color = percentage < 10 ? "text-health-green" : percentage < 20 ? "text-health-amber" : "text-health-red";
  const bgColor = percentage < 10 ? "bg-health-green" : percentage < 20 ? "bg-health-amber" : "bg-health-red";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
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
          <Icon className={`w-5 h-5 ${color}`} />
          <span className={`text-xl font-bold ${color}`}>{percentage}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${bgColor}/10 ${color} font-medium capitalize`}>
          {category.replace("-", " ")}
        </span>
      </div>
    </div>
  );
}

function BreakdownTable({ breakdown }: { breakdown: { factor: string; points: number; description: string }[] }) {
  return (
    <div className="space-y-2">
      {breakdown.map((item, idx) => (
        <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-secondary/20">
          <span className={`text-xs font-mono font-bold min-w-[30px] text-center px-1 py-0.5 rounded ${
            item.points < 0 ? "text-health-green bg-health-green/10" :
            item.points === 0 ? "text-muted-foreground bg-muted" :
            "text-health-red bg-health-red/10"
          }`}>
            {item.points > 0 ? "+" : ""}{item.points}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{item.factor}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        </div>
      ))}
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

  // Load profile from DB
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

  // Save profile to DB
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
          Medical Risk Scores
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Log at least 3 days of data for validated epidemiological risk assessment.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-accent" />
            Validated Medical Risk Scores
          </h3>
          <p className="text-sm text-muted-foreground">
            Epidemiological calculators — not AI guesses
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasWearable && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              <Smartphone className="w-3 h-3" />
              +Wearable
            </span>
          )}
          <button
            onClick={() => setShowProfileForm(!showProfileForm)}
            className="text-xs text-accent hover:underline"
          >
            {showProfileForm ? "Hide Profile" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* Health Profile Form */}
      {showProfileForm && (
        <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border space-y-4">
          <h4 className="text-sm font-medium text-foreground">Health Profile (for accurate scoring)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Age</Label>
              <Input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile((p) => ({ ...p, age: parseInt(e.target.value) || 30 }))}
                min={18}
                max={99}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Sex</Label>
              <Select value={profile.sex} onValueChange={(v) => setProfile((p) => ({ ...p, sex: v as HealthProfile["sex"] }))}>
                <SelectTrigger className="h-9 mt-1">
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
              <Label className="text-xs">Height (cm)</Label>
              <Input
                type="number"
                value={profile.heightCm}
                onChange={(e) => setProfile((p) => ({ ...p, heightCm: parseFloat(e.target.value) || 170 }))}
                min={100}
                max={250}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Weight (kg)</Label>
              <Input
                type="number"
                value={profile.weightKg}
                onChange={(e) => setProfile((p) => ({ ...p, weightKg: parseFloat(e.target.value) || 70 }))}
                min={30}
                max={300}
                className="h-9 mt-1"
              />
            </div>
          </div>
          <Button size="sm" variant="hero" onClick={saveProfile}>
            Save Profile
          </Button>
        </div>
      )}

      {results && (
        <>
          {/* Risk Gauges */}
          <div className="flex flex-wrap justify-center gap-8 mb-6">
            <RiskGauge
              percentage={results.framingham.riskPercentage}
              label="Framingham CVD"
              category={results.framingham.riskCategory}
              icon={Heart}
            />
            <RiskGauge
              percentage={results.findrisc.riskPercentage}
              label="FINDRISC Diabetes"
              category={results.findrisc.riskCategory}
              icon={Droplets}
            />
          </div>

          {/* Methodology badge */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20 mb-4">
            <Info className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {results.methodology}
            </p>
          </div>

          {/* Breakdown toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="flex items-center gap-2 text-sm text-accent hover:underline w-full justify-center"
          >
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showBreakdown ? "Hide Score Breakdown" : "Show Score Breakdown"}
          </button>

          {showBreakdown && (
            <div className="mt-4 grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-health-red" />
                  Framingham CVD Breakdown
                </h4>
                <BreakdownTable breakdown={results.framingham.breakdown} />
                <p className="text-xs text-muted-foreground mt-2">
                  {results.framingham.timeframe}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-health-blue" />
                  FINDRISC Diabetes Breakdown
                </h4>
                <BreakdownTable breakdown={results.findrisc.breakdown} />
                <p className="text-xs text-muted-foreground mt-2">
                  {results.findrisc.interpretation}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
