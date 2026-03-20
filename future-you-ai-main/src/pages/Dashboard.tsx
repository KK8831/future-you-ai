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
import { Footprints, Flame, MapPin, Heart, Moon, Scale } from "lucide-react";

interface WearableMetric {
  data_type: string;
  value: number;
  unit: string;
  source: string;
  recorded_at: string;
}

const Dashboard = () => {
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

  // Get latest value for each data type from wearable_data
  const getLatestWearable = (dataType: string) => {
    return wearableData.find((d) => d.data_type === dataType);
  };

  const steps = getLatestWearable("steps");
  const calories = getLatestWearable("calories_burned");
  const distance = getLatestWearable("distance");
  const heartRate = getLatestWearable("heart_rate");
  const sleep = getLatestWearable("sleep_duration");
  const weight = getLatestWearable("weight");

  const wearableCards = [
    { data: steps, label: "Steps", icon: Footprints, color: "text-green-500", bg: "bg-green-500/10" },
    { data: calories, label: "Calories", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
    { data: distance, label: "Distance", icon: MapPin, color: "text-blue-500", bg: "bg-blue-500/10" },
    { data: heartRate, label: "Heart Rate", icon: Heart, color: "text-red-500", bg: "bg-red-500/10" },
    { data: sleep, label: "Sleep", icon: Moon, color: "text-purple-500", bg: "bg-purple-500/10" },
    { data: weight, label: "Weight", icon: Scale, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ].filter((card) => card.data !== undefined);

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
        <AnomalyAlerts entries={entries} />

        {/* Wearable Data Section - shows Google Fit / Health Connect data */}
        {wearableCards.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Wearable & Fitness Data
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {wearableCards.map((card) => (
                <div key={card.label} className="p-3 rounded-xl bg-card border border-border text-center">
                  <div className={`w-8 h-8 rounded-full ${card.bg} flex items-center justify-center mx-auto mb-2`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="text-lg font-bold text-foreground">{card.data?.value}</p>
                  <p className="text-xs text-muted-foreground">{card.data?.unit}</p>
                  <p className="text-xs font-medium text-foreground mt-1">{card.label}</p>
                  <p className="text-[10px] text-muted-foreground">{card.data?.source?.replace("_", " ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-4 mt-4">
          <div className="space-y-4">
            <div className="grid md:grid-cols-[1fr_280px] gap-4">
              <DigitalTwinOverview entries={entries} />
              <div className="space-y-4">
                <PatientProfileCard user={user} />
                <HealthIndexBar entries={entries} />
                <FeatureImportance entries={entries} />
              </div>
            </div>
            <TrendsChart entries={entries} />
            <div className="grid md:grid-cols-2 gap-4">
              <RiskPredictions entries={entries} />
              <MedicalRiskScores entries={entries} userId={user?.id} />
            </div>
            <MonteCarloChart entries={entries} />
            <div className="grid md:grid-cols-2 gap-4">
              <CorrelationHeatmap entries={entries} />
              <Recommendations entries={entries} />
            </div>
            <SupplementCards entries={entries} />
          </div>

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