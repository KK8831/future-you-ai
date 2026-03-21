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
import { LongevityForecast } from "@/components/dashboard/LongevityForecast";
import { FutureSelfMessage } from "@/components/dashboard/FutureSelfMessage";
import { LifestyleEntry, WearableMetric } from "@/types/lifestyle";
import { Footprints, Flame, MapPin, Heart, Moon, Scale, Monitor, Smartphone, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [profile, setProfile] = useState<any>(null);
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
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error && data) setProfile(data);
  };

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
      <div className="animate-fade-in max-w-[1400px] mx-auto space-y-8 pb-12">
        <AnomalyAlerts entries={entries} />

        {/* Wearable & Smart Collect Section — refined and integrated */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-500/10">
                <Heart className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">
                Live Biometrics
              </h3>
            </div>
            {!hasAnyWearable && (
              <Link
                to="/smart-collect"
                className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors bg-accent/5 px-3 py-1.5 rounded-lg border border-accent/10"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Connect Wearables
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {ALL_WEARABLE_CARDS.map((card) => {
              const data = getLatestWearable(card.type);
              const hasData = !!data;
              return (
                <div
                  key={card.type}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-300 group",
                    hasData
                      ? "bg-card border-border shadow-sm hover:shadow-md hover:-translate-y-0.5"
                      : "bg-secondary/20 border-border/30 opacity-70 grayscale-[0.5]"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2 rounded-xl", card.bg)}>
                      <card.icon className={cn("w-4 h-4", card.color)} />
                    </div>
                    {hasData && (
                      <div className="w-1.5 h-1.5 rounded-full bg-health-green animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-display font-bold text-foreground">
                      {hasData ? data!.value : "--"}
                      <span className="text-xs font-medium text-muted-foreground ml-1">
                        {hasData ? data!.unit : card.unit}
                      </span>
                    </p>
                    <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {card.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* REVEAL: Future Vision & Digital Twin — The core experience */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-stretch">
          <div className="space-y-6">
            <section className="bg-accent/5 border border-accent/20 rounded-3xl p-6 lg:p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-32 h-32 text-accent" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Future Vision</h2>
                </div>
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
                  <LongevityForecast profile={profile} wearableData={wearableData} />
                </div>
              </div>
            </section>
            
            <div className="grid md:grid-cols-2 gap-6">
              <RiskPredictions entries={entries} wearableData={wearableData} />
              <MedicalRiskScores entries={entries} userId={user?.id} wearableData={wearableData} />
            </div>
          </div>

          <div className="flex flex-col gap-6 h-full">
            <div className="flex-1 min-h-0 bg-transparent rounded-2xl">
              <DigitalTwinOverview entries={entries} wearableData={wearableData} />
            </div>
            <div className="shrink-0 bg-transparent rounded-2xl">
              <FutureSelfMessage profile={profile} metrics={entries[0]} riskScores={null} entries={entries} />
            </div>
          </div>
        </div>

        {/* Actionable Recommendations - Elevated for Prominence */}
        <div className="grid md:grid-cols-[2fr_1fr] gap-6">
          <Recommendations entries={entries} />
          <SupplementCards entries={entries} />
        </div>

        {/* Analysis & Historical Data */}
        <div className="pt-4 border-t border-border/50">
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-8">
              <div className="grid md:grid-cols-[1fr_300px] gap-6">
                <TrendsChart entries={entries} />
                <div className="space-y-6">
                  <HealthIndexBar entries={entries} />
                  <FeatureImportance entries={entries} />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <MonteCarloChart entries={entries} />
                <CorrelationHeatmap entries={entries} />
              </div>
            </div>

            <aside className="space-y-6 h-full">
              <div className="sticky top-24 space-y-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-secondary/30 border border-border shadow-sm">
                  <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-widest mb-4">
                    Lifestyle Metrics
                  </h3>
                  <MetricsCards entries={entries} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;