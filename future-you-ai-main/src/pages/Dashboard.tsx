import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DigitalTwinOverview } from "@/components/dashboard/DigitalTwinOverview";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { TrendsChart } from "@/components/dashboard/TrendsChart";
import { RiskPredictions } from "@/components/dashboard/RiskPredictions";
import { Recommendations } from "@/components/dashboard/Recommendations";
import { CorrelationHeatmap } from "@/components/dashboard/CorrelationHeatmap";
import { MedicalRiskScores } from "@/components/dashboard/MedicalRiskScores";
import { AnomalyAlerts } from "@/components/dashboard/AnomalyAlerts";
import { MonteCarloChart } from "@/components/dashboard/MonteCarloChart";
import { PatientProfileCard } from "@/components/dashboard/PatientProfileCard";
import { HealthIndexBar } from "@/components/dashboard/HealthIndexBar";
import { FeatureImportance } from "@/components/dashboard/FeatureImportance";
import { SupplementCards } from "@/components/dashboard/SupplementCards";
import { LifestyleEntry } from "@/types/lifestyle";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LifestyleEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) navigate("/auth");
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) fetchEntries();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading your digital twin...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="animate-fade-in">
        {/* Anomaly Alerts (top, full width) */}
        <AnomalyAlerts entries={entries} />

        {/* Main 3-column grid: Left (center content) | Right (metrics panel) */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-4 mt-4">
          {/* LEFT: Main content area */}
          <div className="space-y-4">
            {/* Digital Twin + Profile row */}
            <div className="grid md:grid-cols-[1fr_280px] gap-4">
              <DigitalTwinOverview entries={entries} />
              <div className="space-y-4">
                <PatientProfileCard user={user} />
                <HealthIndexBar entries={entries} />
                <FeatureImportance entries={entries} />
              </div>
            </div>

            {/* Trends Chart */}
            <TrendsChart entries={entries} />

            {/* Risk Predictions + Medical Scores */}
            <div className="grid md:grid-cols-2 gap-4">
              <RiskPredictions entries={entries} />
              <MedicalRiskScores entries={entries} userId={user?.id} />
            </div>

            {/* Monte Carlo */}
            <MonteCarloChart entries={entries} />

            {/* Correlation + Recommendations */}
            <div className="grid md:grid-cols-2 gap-4">
              <CorrelationHeatmap entries={entries} />
              <Recommendations entries={entries} />
            </div>

            {/* Supplement Cards */}
            <SupplementCards entries={entries} />
          </div>

          {/* RIGHT: Metrics panel (sticky on desktop) */}
          <div className="lg:sticky lg:top-[72px] lg:self-start space-y-4">
            <h3 className="text-sm font-display font-semibold text-foreground px-1">Lifestyle Metrics</h3>
            <MetricsCards entries={entries} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
