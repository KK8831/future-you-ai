import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Heart,
  Target,
  Moon,
  Dumbbell,
  Brain,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const GOALS = [
  { id: "longevity",    label: "Longevity & Lifespan",  icon: Sparkles,  color: "text-orange-400", bg: "bg-orange-400/10 hover:bg-orange-400/20 border-orange-400/30" },
  { id: "weight",       label: "Weight Management",      icon: Dumbbell,  color: "text-orange-400", bg: "bg-orange-400/10 hover:bg-orange-400/20 border-orange-400/30" },
  { id: "stress",       label: "Stress Reduction",       icon: Brain,     color: "text-purple-400", bg: "bg-purple-400/10 hover:bg-purple-400/20 border-purple-400/30" },
  { id: "sleep",        label: "Better Sleep",           icon: Moon,      color: "text-blue-400",   bg: "bg-blue-400/10 hover:bg-blue-400/20 border-blue-400/30" },
  { id: "heart",        label: "Heart Health",           icon: Heart,     color: "text-red-400",    bg: "bg-red-400/10 hover:bg-red-400/20 border-red-400/30" },
  { id: "performance",  label: "Peak Performance",       icon: Target,    color: "text-green-400",  bg: "bg-green-400/10 hover:bg-green-400/20 border-green-400/30" },
];

const STEPS = ["Welcome", "Profile", "Goals", "Ready"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "other">("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const age = dob
          ? Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365))
          : null;

        await supabase.from("profiles").upsert({
          user_id: user.id,
          age,
          sex,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          health_goals: selectedGoals,
        }, { onConflict: "user_id" });
      }
    } catch (e) {
      console.error("Onboarding save error:", e);
    }
    localStorage.setItem("onboarding_complete", "true");
    setSaving(false);
    navigate("/dashboard");
  };

  const canProceedStep1 = true; // Welcome step always OK
  const canProceedStep2 = dob.length > 0 && heightCm.length > 0 && weightKg.length > 0;
  const canProceedStep3 = selectedGoals.length > 0;

  const canProceed = [canProceedStep1, canProceedStep2, canProceedStep3, true][step];

  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                "text-xs font-medium transition-colors",
                i <= step ? "text-accent" : "text-white/30"
              )}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Card */}
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">

        {/* STEP 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-8">
              <BrandLogo iconOnly size="xl" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-3 text-balance">Welcome to FutureMe AI</h1>
              <p className="text-white/60 leading-relaxed text-sm">
                Meet your digital twin. We'll build a personalized AI model of your health in just a few steps.
              </p>
            </div>
            <div className="space-y-3 text-left">
              {[
                "Your AI-powered healthspan prediction engine",
                "Biological age tracking & longevity forecasting",
                "Personalized AI recommendations for your goals",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-xs text-white/70">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Health Profile */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-1">Your Health Profile</h2>
              <p className="text-white/50 text-sm">This helps our AI calculate your biological age accurately.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">Date of Birth</Label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="bg-white/10 border-white/20 text-white focus:ring-accent"
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label className="text-white/70 text-sm mb-1.5 block">Biological Sex</Label>
                <div className="flex gap-2">
                  {(["male", "female", "other"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className={cn(
                        "flex-1 py-2 rounded-xl border text-sm capitalize font-medium transition-all font-display",
                        sex === s
                          ? "bg-accent border-accent text-white"
                          : "bg-white/5 border-white/20 text-white/60 hover:border-white/40"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">Height (cm)</Label>
                  <Input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="170"
                    className="bg-white/10 border-white/20 text-white focus:ring-accent"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-sm mb-1.5 block">Weight (kg)</Label>
                  <Input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="70"
                    className="bg-white/10 border-white/20 text-white focus:ring-accent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Goals */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-display font-bold text-white mb-1 text-balance">What are your goals?</h2>
              <p className="text-white/50 text-sm">Select all that apply. Your AI will prioritize these.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all",
                      goal.bg,
                      isSelected ? "ring-2 ring-accent scale-[0.98] border-accent" : "border-white/10"
                    )}
                  >
                    <goal.icon className={cn("w-5 h-5 mb-2", goal.color)} />
                    <span className="text-xs font-semibold text-white/80">{goal.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Ready */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-accent/30 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-accent" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-3 text-balance">Your Twin is Ready!</h2>
              <p className="text-white/60 leading-relaxed text-sm">
                Your AI health model has been initialized. Start logging your daily lifestyle to give your twin the data it needs to predict your future health.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 text-left">
              <p className="text-accent text-sm font-bold font-display uppercase tracking-wider">💡 Pro Tip</p>
              <p className="text-white/60 text-[10px] uppercase font-bold mt-1">
                Log at least 7 days of data to unlock biological age predictions.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 gap-3">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              className="text-white/60 hover:text-white hover:bg-white/10 font-display"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="bg-accent hover:bg-accent/80 text-white font-bold px-6 rounded-xl flex-1 max-w-[200px] font-display uppercase tracking-wide"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={saving}
              className="bg-accent hover:bg-accent/80 text-white font-bold px-6 rounded-xl flex-1 max-w-[220px] font-display uppercase tracking-wide"
            >
              {saving ? "Setting up..." : "Enter Dashboard →"}
            </Button>
          )}
        </div>
      </div>

      {/* Skip */}
      {step < 3 && (
        <button
          onClick={() => {
            localStorage.setItem("onboarding_complete", "true");
            navigate("/dashboard");
          }}
          className="mt-6 text-sm font-display font-medium text-white/30 hover:text-white/60 transition-colors"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
