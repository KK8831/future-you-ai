import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { LifestyleEntry } from "@/types/lifestyle";
import { HealthProfile } from "@/lib/medical-calculators";
import { SplitScreenSimulation } from "@/components/simulations/SplitScreenSimulation";
import { Play, Plus, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Simulation {
  id: string;
  name: string;
  description: string | null;
  activity_change_percent: number;
  sleep_change_hours: number;
  diet_change_score: number;
  stress_change: number;
  screen_change_hours: number;
  timeframe_years: number;
  projected_health_score: number | null;
  projected_risks: Record<string, number> | null;
  created_at: string;
}

const Simulations = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LifestyleEntry[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSim, setSelectedSim] = useState<Simulation | null>(null);
  const [profile, setProfile] = useState<HealthProfile>({ age: 30, sex: "unspecified", heightCm: 170, weightKg: 70 });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [activityChange, setActivityChange] = useState(0);
  const [sleepChange, setSleepChange] = useState(0);
  const [dietChange, setDietChange] = useState(0);
  const [stressChange, setStressChange] = useState(0);
  const [screenChange, setScreenChange] = useState(0);
  const [timeframe, setTimeframe] = useState(5);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [entriesRes, simsRes, profileRes] = await Promise.all([
      supabase
        .from("lifestyle_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("entry_date", { ascending: false })
        .limit(30),
      supabase
        .from("simulations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("age, sex, height_cm, weight_kg")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (!entriesRes.error && entriesRes.data) {
      setEntries(entriesRes.data as LifestyleEntry[]);
    }
    if (!simsRes.error && simsRes.data) {
      setSimulations(simsRes.data as unknown as Simulation[]);
    }
    if (profileRes.data) {
      setProfile({
        age: profileRes.data.age || 30,
        sex: (profileRes.data.sex as HealthProfile["sex"]) || "unspecified",
        heightCm: Number(profileRes.data.height_cm) || 170,
        weightKg: Number(profileRes.data.weight_kg) || 70,
      });
    }
  };

  // Calculate current baseline
  const baseline = useMemo(() => {
    if (entries.length === 0) return null;
    const recent = entries.slice(0, Math.min(7, entries.length));
    return {
      activity: Math.round(recent.reduce((s, e) => s + e.physical_activity_minutes, 0) / recent.length),
      sleep: Number((recent.reduce((s, e) => s + e.sleep_hours, 0) / recent.length).toFixed(1)),
      diet: Number((recent.reduce((s, e) => s + e.diet_quality_score, 0) / recent.length).toFixed(1)),
      stress: Number((recent.reduce((s, e) => s + e.stress_level, 0) / recent.length).toFixed(1)),
      screen: Number((recent.reduce((s, e) => s + e.screen_time_hours, 0) / recent.length).toFixed(1)),
    };
  }, [entries]);

  // Calculate projected values
  const projectedValues = useMemo(() => {
    if (!baseline) return null;
    return {
      activity: Math.max(0, Math.round(baseline.activity * (1 + activityChange / 100))),
      sleep: Math.max(0, Math.min(12, baseline.sleep + sleepChange)),
      diet: Math.max(1, Math.min(10, Math.round(baseline.diet + dietChange))),
      stress: Math.max(1, Math.min(10, Math.round(baseline.stress + stressChange))),
      screen: Math.max(0, Math.min(16, baseline.screen + screenChange)),
    };
  }, [baseline, activityChange, sleepChange, dietChange, stressChange, screenChange]);

  // Calculate projected health score
  const projectedHealthScore = useMemo(() => {
    if (!projectedValues) return 50;
    const actScore = Math.min(projectedValues.activity / 60, 1) * 25;
    const sleepScore = Math.min(projectedValues.sleep / 8, 1) * 25;
    const dietScore = (projectedValues.diet / 10) * 20;
    const stressScore = ((10 - projectedValues.stress) / 10) * 15;
    const screenScore = Math.max(1 - projectedValues.screen / 10, 0) * 15;
    return Math.round(actScore + sleepScore + dietScore + stressScore + screenScore);
  }, [projectedValues]);

  const handleCreateSimulation = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);

    const { error } = await supabase.from("simulations").insert({
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      activity_change_percent: activityChange,
      sleep_change_hours: sleepChange,
      diet_change_score: dietChange,
      stress_change: stressChange,
      screen_change_hours: screenChange,
      timeframe_years: timeframe,
      projected_health_score: projectedHealthScore,
    });

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Simulation created!", description: "Your future scenario has been saved." });
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
  };

  const handleDeleteSimulation = async (id: string) => {
    const { error } = await supabase.from("simulations").delete().eq("id", id);
    if (!error) {
      setSimulations((prev) => prev.filter((s) => s.id !== id));
      if (selectedSim?.id === id) setSelectedSim(null);
      toast({ title: "Simulation deleted" });
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setActivityChange(0);
    setSleepChange(0);
    setDietChange(0);
    setStressChange(0);
    setScreenChange(0);
    setTimeframe(5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  // Active simulation for split-screen
  const activeSim = selectedSim || (simulations.length > 0 ? simulations[0] : null);

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Future Simulations</h1>
            <p className="text-muted-foreground mt-1">
              Explore how lifestyle changes could impact your health over time
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" disabled={!baseline}>
                <Plus className="w-4 h-4 mr-2" />
                New Simulation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-display">Create Future Scenario</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Name and description */}
                <div className="space-y-4">
                  <div>
                    <Label>Scenario Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="E.g., Active Lifestyle, Better Sleep..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe this scenario..."
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Timeframe */}
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Projection Timeframe</Label>
                    <span className="font-bold text-accent">{timeframe} years</span>
                  </div>
                  <Slider
                    value={[timeframe]}
                    onValueChange={(v) => setTimeframe(v[0])}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>

                {/* Changes */}
                <div className="space-y-4">
                  <h4 className="font-medium">Lifestyle Changes</h4>

                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Physical Activity</Label>
                      <span className={`font-bold ${activityChange > 0 ? "text-health-green" : activityChange < 0 ? "text-health-red" : "text-muted-foreground"}`}>
                        {activityChange > 0 ? "+" : ""}{activityChange}%
                      </span>
                    </div>
                    <Slider value={[activityChange]} onValueChange={(v) => setActivityChange(v[0])} min={-50} max={100} step={10} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>-50%</span><span>No change</span><span>+100%</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Sleep Duration</Label>
                      <span className={`font-bold ${sleepChange > 0 ? "text-health-green" : sleepChange < 0 ? "text-health-red" : "text-muted-foreground"}`}>
                        {sleepChange > 0 ? "+" : ""}{sleepChange} hrs
                      </span>
                    </div>
                    <Slider value={[sleepChange]} onValueChange={(v) => setSleepChange(v[0])} min={-3} max={3} step={0.5} />
                  </div>

                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Diet Quality Score</Label>
                      <span className={`font-bold ${dietChange > 0 ? "text-health-green" : dietChange < 0 ? "text-health-red" : "text-muted-foreground"}`}>
                        {dietChange > 0 ? "+" : ""}{dietChange}
                      </span>
                    </div>
                    <Slider value={[dietChange]} onValueChange={(v) => setDietChange(v[0])} min={-4} max={4} step={1} />
                  </div>

                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Stress Level</Label>
                      <span className={`font-bold ${stressChange < 0 ? "text-health-green" : stressChange > 0 ? "text-health-red" : "text-muted-foreground"}`}>
                        {stressChange > 0 ? "+" : ""}{stressChange}
                      </span>
                    </div>
                    <Slider value={[stressChange]} onValueChange={(v) => setStressChange(v[0])} min={-4} max={4} step={1} />
                  </div>

                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Screen Time</Label>
                      <span className={`font-bold ${screenChange < 0 ? "text-health-green" : screenChange > 0 ? "text-health-red" : "text-muted-foreground"}`}>
                        {screenChange > 0 ? "+" : ""}{screenChange} hrs
                      </span>
                    </div>
                    <Slider value={[screenChange]} onValueChange={(v) => setScreenChange(v[0])} min={-4} max={4} step={0.5} />
                  </div>
                </div>

                {/* Projected results */}
                {projectedValues && (
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <h4 className="font-medium text-accent mb-3">Projected Outcome in {timeframe} Years</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Health Score:</span>
                        <span className="ml-2 font-bold text-foreground">{projectedHealthScore}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Activity:</span>
                        <span className="ml-2 font-bold text-foreground">{projectedValues.activity} min/day</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sleep:</span>
                        <span className="ml-2 font-bold text-foreground">{projectedValues.sleep} hrs</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Diet:</span>
                        <span className="ml-2 font-bold text-foreground">{projectedValues.diet}/10</span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCreateSimulation}
                  variant="hero"
                  className="w-full"
                  disabled={!name.trim() || saving}
                >
                  {saving ? "Creating..." : "Create Simulation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Split-Screen Simulation View */}
        {baseline && activeSim && (
          <SplitScreenSimulation
            entries={entries}
            profile={profile}
            changes={{
              activityChange: activeSim.activity_change_percent || 0,
              sleepChange: activeSim.sleep_change_hours || 0,
              dietChange: activeSim.diet_change_score || 0,
              stressChange: activeSim.stress_change || 0,
              screenChange: activeSim.screen_change_hours || 0,
            }}
            timeframeYears={activeSim.timeframe_years}
          />
        )}

        {/* No baseline message */}
        {!baseline && (
          <div className="p-8 rounded-xl bg-secondary/30 border border-border text-center">
            <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Data Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start logging your lifestyle entries to run simulations
            </p>
            <Button variant="hero" onClick={() => navigate("/log-entry")}>
              Log First Entry
            </Button>
          </div>
        )}

        {/* Existing simulations */}
        {simulations.length > 0 && (
          <div>
            <h2 className="text-xl font-display font-semibold text-foreground mb-4">Saved Scenarios</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {simulations.map((sim) => {
                const improving = (sim.projected_health_score || 50) > 50;
                const isActive = activeSim?.id === sim.id;
                return (
                  <div
                    key={sim.id}
                    onClick={() => setSelectedSim(sim)}
                    className={`p-6 rounded-xl bg-card border cursor-pointer transition-all hover:shadow-md ${
                      isActive ? "border-accent ring-2 ring-accent/20" : "border-border hover:border-accent/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{sim.name}</h3>
                        <p className="text-sm text-muted-foreground">{sim.timeframe_years} year projection</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSimulation(sim.id); }}
                        className="p-2 text-muted-foreground hover:text-health-red transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {sim.description && (
                      <p className="text-sm text-muted-foreground mb-4">{sim.description}</p>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      {improving ? (
                        <TrendingUp className="w-5 h-5 text-health-green" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-health-red" />
                      )}
                      <span className={`text-lg font-bold ${improving ? "text-health-green" : "text-health-red"}`}>
                        {sim.projected_health_score || 50}%
                      </span>
                      <span className="text-sm text-muted-foreground">health score</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {sim.activity_change_percent !== 0 && (
                        <span className={sim.activity_change_percent > 0 ? "text-health-green" : "text-health-red"}>
                          Activity: {sim.activity_change_percent > 0 ? "+" : ""}{sim.activity_change_percent}%
                        </span>
                      )}
                      {sim.sleep_change_hours !== 0 && (
                        <span className={sim.sleep_change_hours > 0 ? "text-health-green" : "text-health-red"}>
                          Sleep: {sim.sleep_change_hours > 0 ? "+" : ""}{sim.sleep_change_hours}h
                        </span>
                      )}
                      {sim.diet_change_score !== 0 && (
                        <span className={sim.diet_change_score > 0 ? "text-health-green" : "text-health-red"}>
                          Diet: {sim.diet_change_score > 0 ? "+" : ""}{sim.diet_change_score}
                        </span>
                      )}
                      {sim.stress_change !== 0 && (
                        <span className={sim.stress_change < 0 ? "text-health-green" : "text-health-red"}>
                          Stress: {sim.stress_change > 0 ? "+" : ""}{sim.stress_change}
                        </span>
                      )}
                    </div>

                    {isActive && (
                      <div className="mt-3 text-xs text-accent font-medium text-center">
                        ▲ Viewing in split-screen above
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Simulations;
