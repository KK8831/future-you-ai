import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RiskPredictions } from "@/components/dashboard/RiskPredictions";
import { MedicalRiskScores } from "@/components/dashboard/MedicalRiskScores";
import { Recommendations } from "@/components/dashboard/Recommendations";
import { LifestyleEntry, WearableMetric } from "@/types/lifestyle";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Info, ClipboardPlus, Brain, FlaskConical, Heart, Footprints, Monitor } from "lucide-react";
import { usePdfExport } from "@/hooks/usePdfExport";

const Predictions = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LifestyleEntry[]>([]);
  const [wearableData, setWearableData] = useState<WearableMetric[]>([]);
  const navigate = useNavigate();

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
      fetchEntries();
      fetchWearableData();
    }
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("lifestyle_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .limit(30);
    if (!error && data) setEntries(data as LifestyleEntry[]);
  };

  const fetchWearableData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("wearable_data")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(50);
    if (!error && data) setWearableData(data as WearableMetric[]);
  };

  const [showSampleData, setShowSampleData] = useState(false);

  const SAMPLE_ENTRIES: LifestyleEntry[] = [
    { id: "s1", user_id: "u1", entry_date: "2024-03-20", physical_activity_minutes: 45, sleep_hours: 7.2, diet_quality_score: 8, stress_level: 3, screen_time_hours: 4.5, created_at: "", updated_at: "" },
    { id: "s2", user_id: "u1", entry_date: "2024-03-21", physical_activity_minutes: 30, sleep_hours: 6.5, diet_quality_score: 7, stress_level: 5, screen_time_hours: 6.0, created_at: "", updated_at: "" },
    { id: "s3", user_id: "u1", entry_date: "2024-03-22", physical_activity_minutes: 60, sleep_hours: 8.0, diet_quality_score: 9, stress_level: 2, screen_time_hours: 3.5, created_at: "", updated_at: "" },
  ];

  const SAMPLE_WEARABLES: WearableMetric[] = [
    { data_type: "heart_rate", value: 68, unit: "bpm", recorded_at: "2024-03-22T10:00:00Z", source: "sample" },
    { data_type: "steps", value: 10450, unit: "steps", recorded_at: "2024-03-22T22:00:00Z", source: "sample" },
  ];

  const activeEntries = showSampleData ? SAMPLE_ENTRIES : entries;
  const activeWearable = showSampleData ? SAMPLE_WEARABLES : wearableData;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8 animate-fade-in" id="predictions-report">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Health Predictions</h1>
              <p className="text-muted-foreground mt-1">
                Validated epidemiological risk scores + AI-powered analysis
              </p>
            </div>
            {entries.length < 3 && (
              <Button 
                variant={showSampleData ? "hero" : "outline"} 
                size="sm" 
                onClick={() => setShowSampleData(!showSampleData)}
                className="rounded-full text-[10px] h-7 px-3 uppercase tracking-widest font-bold"
              >
                {showSampleData ? "Viewing Sample" : "View Sample"}
              </Button>
            )}
          </div>
        </div>

        {activeEntries.length < 3 ? (
          <div className="p-8 rounded-xl bg-secondary/30 border border-border text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-accent opacity-50" />
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              Need More Data
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Log at least 3 days of lifestyle data to generate accurate health risk predictions. 
              The more data you provide, the better our models can analyze your patterns.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button asChild variant="hero">
                <Link to="/log-entry">
                  <ClipboardPlus className="w-4 h-4 mr-2" />
                  Log Lifestyle Entry
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setShowSampleData(true)}>
                View Sample Data
              </Button>
            </div>
          </div>
        ) : (
          <>
            {showSampleData && (
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-2 text-accent text-sm">
                <Info className="w-4 h-4" />
                <span>You are viewing <strong>Sample Data</strong>. Log your own entries to see personal projections.</span>
              </div>
            )}
            {/* How it works */}
            <div className="p-6 rounded-xl bg-secondary/30 border border-border">
              <h3 className="text-lg font-display font-semibold text-foreground mb-4">
                How Risk Prediction Works
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 h-fit">
                    <FlaskConical className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Epidemiological Models</h4>
                    <p className="text-sm text-muted-foreground">
                      Framingham CVD Score & FINDRISC Diabetes calculator — validated medical algorithms, not AI guesses
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-health-amber/10 h-fit">
                    <AlertTriangle className="w-5 h-5 text-health-amber" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Risk Correlation</h4>
                    <p className="text-sm text-muted-foreground">
                      Pearson correlation analysis reveals how your metrics statistically relate to chronic conditions
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-health-green/10 h-fit">
                    <Shield className="w-5 h-5 text-health-green" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">AI Interpretation</h4>
                    <p className="text-sm text-muted-foreground">
                      AI interprets validated scores into actionable recommendations — the human layer on top of math
                    </p>
                  </div>
                </div>
              </div>
            </div>

          {/* Wearable data summary strip */}
          {wearableData.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="text-xs font-medium text-green-400 mr-1">📱 Wearable data included:</span>
              {wearableData.find(d => d.data_type === "heart_rate") && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-background text-muted-foreground flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400" />
                  HR: {wearableData.find(d => d.data_type === "heart_rate")!.value} bpm
                </span>
              )}
              {wearableData.find(d => d.data_type === "steps") && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-background text-muted-foreground flex items-center gap-1">
                  <Footprints className="w-3 h-3 text-green-400" />
                  Steps: {wearableData.find(d => d.data_type === "steps")!.value}
                </span>
              )}
              {wearableData.find(d => d.data_type === "screen_time") && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-background text-muted-foreground flex items-center gap-1">
                  <Monitor className="w-3 h-3 text-blue-400" />
                  Screen: {wearableData.find(d => d.data_type === "screen_time")!.value}h
                </span>
              )}
            </div>
          )}

            {/* Medical Risk Scores - Validated Calculators */}
            <MedicalRiskScores entries={activeEntries} userId={user?.id} wearableData={activeWearable} />

            {/* Pattern-based risk predictions */}
            <RiskPredictions entries={activeEntries} wearableData={activeWearable} />

            {/* Recommendations */}
            <Recommendations entries={activeEntries} />

            {/* Understanding section */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-display font-semibold text-foreground mb-4">
                Understanding Your Results
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Risk Severity Levels</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-health-green" />
                        <span className="text-sm text-muted-foreground">Low Risk - Minimal lifestyle adjustments needed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-health-amber" />
                        <span className="text-sm text-muted-foreground">Medium Risk - Consider moderate lifestyle changes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-health-red" />
                        <span className="text-sm text-muted-foreground">High Risk - Prioritize significant lifestyle improvements</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Methodology</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• <strong>CVD Score</strong> — Adapted from Wilson et al., 1998</li>
                      <li>• <strong>Diabetes (FINDRISC)</strong> — Lindström & Tuomilehto, 2003</li>
                      <li>• <strong>Mental Health</strong> — Adapted from PHQ-9 & GAD-7</li>
                      <li>• <strong>Sleep Apnea</strong> — Adapted from STOP-BANG</li>
                      <li>• <strong>Stroke Risk</strong> — Adapted from CHA2DS2-VASc</li>
                      <li>• <strong>Hypertension</strong> — Adapted from AHA BP Progression</li>
                      <li>• <strong>Pearson Correlation</strong> — Statistical relationship mapping</li>
                      <li>• <strong>AI Agent Analysis</strong> — Clinical interpretation layer</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Predictions;
