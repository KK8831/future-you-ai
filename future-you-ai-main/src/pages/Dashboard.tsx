import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { Footprints, Flame, MapPin, Heart, Moon, Scale, Monitor, Smartphone } from "lucide-react";

export interface WearableMetric {
  data_type: string;
  value: number;
  unit: string;
  source: string;
  recorded_at: string;
}

const ALL_WEARABLE_CARDS = [
  { type: "heart_rate",      label: "Heart Rate",  icon: Heart,      color: "text-red-500",    bg: "bg-red-500/10",    unit: "bpm" },
  { type: "steps",           label: "Steps",       icon: Footprints, color: "text-green-500",  bg: "bg-green-500/10",  unit: "steps" },
  { type: "calories_burned", label: "Calories",    icon: Flame,      color: "text-orange-500", bg: "bg-orange-500/10", unit: "kcal" },
  { type: "distance",        label: "Distance",    icon: MapPin,     color: "text-blue-500",   bg: "bg-blue-500/10",   unit: "km" },
  { type: "sleep_duration",  label: "Sleep",       icon: Moon,       color: "text-purple-500", bg: "bg-purple-500/10", unit: "hrs" },
  { type: "weight",          label: "Weight",      icon: Scale,      color: "text-yellow-500", bg: "bg-yellow-500/10", unit: "kg" },
  { type: "screen_time",     label: "Screen Time", icon: Monitor,    color: "text-blue-400",   bg: "bg-blue-400/10",   unit: "hrs" },
];

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LifestyleEntry[]>([]);
  const [wearableData, setWearableData] = useState<WearableMetric[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
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
      .limit(100);
    if (!error && data) setWearableData(data as WearableMetric[]);
  };

  const getLatestWearable = (dataType: string) =>
    wearableData.find((d) => d.data_type === dataType);

  const hasAnyWearable = wearableData.length > 0;

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

        {/* Wearable & Smart Collect Section — always visible */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Wearable &amp; Smart Collect Data
            </h3>
            {!hasAnyWearable && (
              <Link
                to="/smart-collect"
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <Smartphone className="w-3 h-3" />
                Collect data →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {ALL_WEARABLE_CARDS.map((card) => {
              const data = getLatestWearable(card.type);
              const hasData = !!data;
              return (
                <div
                  key={card.type}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    hasData
                      ? "bg-card border-border shadow-sm"
                      : "bg-secondary/10 border-border/40 opacity-55"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${card.bg} flex items-center justify-center mx-auto mb-2`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {hasData ? data!.value : "--"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasData ? data!.unit : card.unit}
                  </p>
                  <p className="text-xs font-medium text-foreground mt-1">{card.label}</p>
                  {hasData && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {data!.source?.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {!hasAnyWearable && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              No wearable data yet — visit{" "}
              <Link to="/smart-collect" className="text-accent hover:underline">
                Smart Collect
              </Link>{" "}
              to auto-fetch heart rate, screen time, and more.
            </p>
          )}
        </div>

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
              <RiskPredictions entries={entries} wearableData={wearableData} />
              <MedicalRiskScores entries={entries} userId={user?.id} wearableData={wearableData} />
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