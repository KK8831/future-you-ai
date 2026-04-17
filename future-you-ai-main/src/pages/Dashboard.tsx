import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DigitalTwinOverview } from "@/components/dashboard/DigitalTwinOverview";
import { MetricsCards } from "@/components/dashboard/MetricsCards";
import { TrendsChart } from "@/components/dashboard/TrendsChart";
import { RiskPredictions } from "@/components/dashboard/RiskPredictions";
import { Recommendations } from "@/components/dashboard/Recommendations";
import { CorrelationHeatmap } from "@/components/dashboard/CorrelationHeatmap";
import { MedicalRiskScores } from "@/components/dashboard/MedicalRiskScores";
import { AnomalyAlerts } from "@/components/dashboard/AnomalyAlerts";
import { HistoricalTrends } from "@/components/dashboard/HistoricalTrends";
import { MonteCarloChart } from "@/components/dashboard/MonteCarloChart";
import { PatientProfileCard } from "@/components/dashboard/PatientProfileCard";
import { HealthIndexBar } from "@/components/dashboard/HealthIndexBar";
import { FeatureImportance } from "@/components/dashboard/FeatureImportance";
import { SupplementCards } from "@/components/dashboard/SupplementCards";
import { LongevityForecast } from "@/components/dashboard/LongevityForecast";
import { FutureSelfMessage } from "@/components/dashboard/FutureSelfMessage";
import { LifestyleEntry, WearableMetric } from "@/types/lifestyle";
import { Footprints, Flame, Heart, Scale, Monitor, Smartphone, Sparkles, RefreshCw, ClipboardList, Watch } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { HealthPriorities } from "@/components/dashboard/HealthPriorities";

const ALL_WEARABLE_CARDS = [
  { type: "heart_rate",      label: "Heart Rate",  icon: Heart,      color: "text-red-500",    bg: "bg-red-500/10",    unit: "bpm" },
  { type: "steps",           label: "Steps",       icon: Footprints, color: "text-green-500",  bg: "bg-green-500/10",  unit: "steps" },
  { type: "calories_burned", label: "Calories",    icon: Flame,      color: "text-orange-500", bg: "bg-orange-500/10", unit: "kcal" },
  { type: "weight",          label: "Weight",      icon: Scale,      color: "text-yellow-500", bg: "bg-yellow-500/10", unit: "kg" },
  { type: "screen_time",     label: "Screen Time", icon: Monitor,    color: "text-blue-400",   bg: "bg-blue-400/10",   unit: "hrs" },
];

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [entries, setEntries] = useState<LifestyleEntry[]>([]);
  const [wearableData, setWearableData] = useState<WearableMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Pull-to-refresh logic
  const onRefresh = async () => {
    await Promise.all([fetchProfile(), fetchEntries(), fetchWearableData()]);
  };
  
  const { containerRef, pullDistance, isRefreshing, threshold } = usePullToRefresh({ onRefresh });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        initialLoad();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const initialLoad = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchEntries(), fetchWearableData()]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (!error) setProfile(data);
  };

  const fetchEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
      <DashboardLayout user={user}>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      {/* Pull-to-refresh container */}
      <div ref={containerRef} className="overflow-y-auto max-h-screen" style={{ WebkitOverflowScrolling: "touch" }}>
        {/* Pull indicator */}
        {pullDistance > 0 && (
          <div
            className="flex items-center justify-center transition-all duration-150"
            style={{ height: `${pullDistance}px` }}
          >
            <div className={cn(
              "flex items-center gap-2 text-sm text-muted-foreground transition-colors",
              pullDistance >= threshold && "text-accent"
            )}>
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              <span>{isRefreshing ? "Refreshing..." : pullDistance >= threshold ? "Release to refresh" : "Pull to refresh"}</span>
            </div>
          </div>
        )}
        
        <div className="animate-fade-in max-w-[1400px] mx-auto space-y-8 pb-12">
          {entries.length > 0 && <AnomalyAlerts entries={entries} />}

          {/* Wearable & Smart Collect Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/10">
                  <Heart className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">
                  Live Biometrics
                </h3>
              </div>
              {!hasAnyWearable ? (
                <Link to="/smart-collect" className="text-sm text-accent hover:underline font-medium font-display">Connect Device</Link>
              ) : (
                <Link to="/smart-collect" className="text-sm text-accent hover:underline font-medium font-display">Manage Device</Link>
              )}
            </div>
            
            {!hasAnyWearable ? (
              <EmptyState 
                title="No Wearable Data"
                description="Connect your devices or use Smart Collect to see your live heart rate and steps."
                icon={Watch}
                actionLabel="Connect Device"
                actionPath="/smart-collect"
                className="py-12"
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {ALL_WEARABLE_CARDS.map((card) => {
                  const wearData = getLatestWearable(card.type);
                  let value: number | string | null = null;
                  
                  if (wearData) {
                    value = wearData.value;
                  } else if (card.type === "weight" && profile?.weight_kg) {
                    value = profile.weight_kg;
                  }
                  
                  const hasData = value !== null;
                  return (
                    <div
                      key={card.type}
                      className={cn(
                        "p-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden",
                        hasData
                          ? "bg-card border-border shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          : "bg-secondary/10 border-border/30 grayscale-[0.3]"
                      )}
                    >
                      {!hasData && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Link 
                            to="/smart-collect" 
                            className="bg-accent text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
                          >
                            Connect
                          </Link>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn("p-2 rounded-xl", card.bg)}>
                          <card.icon className={cn("w-4 h-4", card.color)} />
                        </div>
                        {hasData && (
                          <div className="w-1.5 h-1.5 rounded-full bg-health-green animate-pulse" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <p className={cn(
                            "text-2xl font-display font-bold transition-colors",
                            hasData ? "text-foreground" : "text-muted-foreground/50"
                          )}>
                            {hasData ? value : "--"}
                          </p>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            {card.unit}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-tight">
                          {card.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Health Priorities Section */}
          <HealthPriorities goals={profile?.health_goals} />

          {/* Core Vision & Digital Twin */}
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
              
              {/* Inserted the Historical Trends 14-Day graph */}
              <div className="mt-6">
                <HistoricalTrends user={user} />
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

          {/* Recommendations */}
          <div className="grid md:grid-cols-[2fr_1fr] gap-6">
            <Recommendations entries={entries} />
            <SupplementCards entries={entries} />
          </div>

          {/* Historical Data & Analysis */}
          <div className="pt-4 border-t border-border/50">
            <div className="grid lg:grid-cols-[1fr_320px] gap-8">
              <div className="space-y-8">
                {entries.length === 0 ? (
                  <EmptyState 
                    title="No Lifestyle Data"
                    description="Log your first entry to see health trends and correlations."
                    icon={ClipboardList}
                    actionLabel="Log Entry"
                    actionPath="/log-entry"
                    className="bg-card/20 border-border/30"
                  />
                ) : (
                  <>
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
                  </>
                )}
              </div>

              <aside className="space-y-6 h-full">
                <div className="sticky top-24 space-y-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-secondary/30 border border-border shadow-sm">
                    <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-widest mb-4">
                      Lifestyle Metrics
                    </h3>
                    {entries.length === 0 ? (
                      <div className="py-8 text-center border border-dashed border-border rounded-xl">
                        <p className="text-xs text-muted-foreground px-4 italic">No metrics to display yet.</p>
                      </div>
                    ) : (
                      <MetricsCards entries={entries} />
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;