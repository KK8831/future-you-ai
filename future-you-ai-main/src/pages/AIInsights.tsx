import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { LifestyleEntry, WearableMetric } from "@/types/lifestyle";
import { calculateMedicalRisks, HealthProfile, calculateBMI } from "@/lib/medical-calculators";
import { detectAnomalies, detectBehavioralDrift, monteCarloSimulation, AnomalyPoint, DriftResult } from "@/lib/advanced-analytics";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Search, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertTriangle, 
  Target, 
  Sparkles, 
  Download, 
  Bot as BotIcon, 
  FileText, 
  Trash2, 
  Dumbbell, 
  Moon, 
  Brain, 
  Heart, 
  Activity,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Footprints,
  Monitor,
  ClipboardList,

  Info
} from "lucide-react";


import { generateProfessionalPdf } from "@/lib/pdf-report-generator";
import { runLocalFullAnalysis } from "@/lib/ai-agent-locally";
import { MedicalRiskScores } from "@/components/dashboard/MedicalRiskScores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AgentResult {
  agent: string;
  output: any;
  reasoning: string;
}

const AIInsights = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LifestyleEntry[]>([]);
  const [wearableData, setWearableData] = useState<WearableMetric[]>([]);
  const [profile, setProfile] = useState<HealthProfile>({ age: 30, sex: "unspecified", heightCm: 170, weightKg: 70 });
  const [agentResults, setAgentResults] = useState<AgentResult[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("lifestyle_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(30),
      supabase.from("profiles").select("age, sex, height_cm, weight_kg").eq("user_id", user.id).maybeSingle(),
      supabase.from("wearable_data").select("*").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(50),
    ]).then(([entriesRes, profileRes, wearableRes]) => {
      if (entriesRes.data) setEntries(entriesRes.data as LifestyleEntry[]);
      if (profileRes.data) {
        setProfile({
          age: profileRes.data.age || 30,
          sex: (profileRes.data.sex as HealthProfile["sex"]) || "unspecified",
          heightCm: Number(profileRes.data.height_cm) || 170,
          weightKg: Number(profileRes.data.weight_kg) || 70,
        });
      }
      if (wearableRes.data) setWearableData(wearableRes.data as WearableMetric[]);
    });

    supabase.from("simulations").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5).then(res => {
      if (res.data) setSimulations(res.data);
    });
  }, [user]);

  const [isExportingPro, setIsExportingPro] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);
  const [useLocalAgent, setUseLocalAgent] = useState(false);
  const [showConnectivityAlert, setShowConnectivityAlert] = useState(false);

  const SAMPLE_ENTRIES: LifestyleEntry[] = [
    { id: "s1", user_id: "u1", entry_date: "2024-03-20", physical_activity_minutes: 45, sleep_hours: 7.2, diet_quality_score: 8, stress_level: 3, screen_time_hours: 4.5, created_at: "", updated_at: "" },
    { id: "s2", user_id: "u1", entry_date: "2024-03-21", physical_activity_minutes: 30, sleep_hours: 6.5, diet_quality_score: 7, stress_level: 5, screen_time_hours: 6.0, created_at: "", updated_at: "" },
    { id: "s3", user_id: "u1", entry_date: "2024-03-22", physical_activity_minutes: 60, sleep_hours: 8.0, diet_quality_score: 9, stress_level: 2, screen_time_hours: 3.5, created_at: "", updated_at: "" },
  ];

  const SAMPLE_RESULTS: AgentResult[] = [
    {
      agent: "planner",
      reasoning: "I'll coordinate the health audit for this profile.",
      output: {
        overallAssessment: "Excellent overall health with slight screen time dependency.",
        confidenceScore: 0.95
      }
    },
    {
      agent: "risk_analysis",
      reasoning: "Analyzing physiological markers and lifestyle patterns.",
      output: {
        riskInsights: [
          { risk: "Sleep Optimization", level: "low", explanation: "Your sleep quality is consistent but could benefit from a colder room environment." },
          { risk: "CVD Risk", level: "low", explanation: "Calculated Framingham score is in the bottom decile for your age group." }
        ]
      }
    },
    {
      agent: "recommendation",
      reasoning: "Translating data into actionable wellness protocols.",
      output: {
        recommendations: [
          { title: "Vitamin D3 + K2", description: "Based on your low outdoor activity minutes, consider 2000IU daily.", priority: "medium" },
          { title: "Zone 2 Training", description: "Increase steady-state cardio by 15 mins/day.", priority: "high", expectedImpact: "Improved VO2 Max" }
        ]
      }
    }
  ];

  const activeEntries = useMemo(() => showSampleData ? SAMPLE_ENTRIES : entries, [showSampleData, entries]);
  const activeAgentResults = useMemo(() => showSampleData && agentResults.length === 0 ? SAMPLE_RESULTS : agentResults, [showSampleData, agentResults]);

  const activeAnomalies = useMemo(() => activeEntries.length >= 5 || (showSampleData && activeEntries.length >= 3) ? detectAnomalies(activeEntries) : [], [activeEntries, showSampleData]);
  const activeDriftResults = useMemo(() => activeEntries.length >= 14 || (showSampleData && activeEntries.length >= 3) ? detectBehavioralDrift(activeEntries) : [], [activeEntries, showSampleData]);

  const metrics = useMemo(() => {
    if (activeEntries.length < 3) return null;
    const recent = activeEntries.slice(0, 14);
    return {
      avgActivityMinutes: recent.reduce((s, e) => s + (e.physical_activity_minutes || 0), 0) / recent.length,
      avgSleepHours: recent.reduce((s, e) => s + (e.sleep_hours || 0), 0) / recent.length,
      avgDietScore: recent.reduce((s, e) => s + (e.diet_quality_score || 0), 0) / recent.length,
      avgStressLevel: recent.reduce((s, e) => s + (e.stress_level || 0), 0) / recent.length,
      avgScreenTimeHours: recent.reduce((s, e) => s + (e.screen_time_hours || 0), 0) / recent.length,
    };
  }, [activeEntries]);

  const riskScores = useMemo(() => {
    if (!metrics) return null;
    return calculateMedicalRisks(profile, metrics);
  }, [profile, metrics]);
  const handleProfessionalExport = async () => {
    setIsExportingPro(true);
    try {
      console.log("PDF Generation Started...");
      const reportData = {
        userName: (user?.user_metadata?.full_name || user?.email || "Valued User").replace(/[^\w\s-]/g, ""),
        profile,
        agentResults: activeAgentResults,
        anomalies: activeAnomalies,
        driftResults: activeDriftResults,
        riskScores: riskScores ? {
          framingham: { riskPercentage: riskScores.framingham.riskPercentage, riskCategory: riskScores.framingham.riskCategory },
          findrisc: { riskPercentage: riskScores.findrisc.riskPercentage, riskCategory: riskScores.findrisc.riskCategory },
        } : undefined,
        simulations: simulations.map(s => ({
          name: s.name,
          description: s.description,
          projectedImprovement: s.projected_improvement,
          projectedHealthScore: s.projected_health_score
        })),
        generatedAt: new Date(),
      };
      
      const filename = `FutureMe_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      generateProfessionalPdf(reportData, filename);
      
      toast({
        title: "Report Opening",
        description: "Your comprehensive health report is opening in a new tab.",
      });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate professional PDF report.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPro(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("action") === "export" && !loading && !isExportingPro) {
      // Small delay to ensure all state updates (entries/profile) are flushed
      const timer = setTimeout(() => {
        handleProfessionalExport();
        navigate("/ai-insights", { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.search, loading, isExportingPro, navigate]);

  const runFullAnalysis = async () => {
    if (!metrics || !riskScores) return;

    if (showSampleData) {
      setAnalyzing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAgentResults(SAMPLE_RESULTS);
      setAnalyzing(false);
      toast({ title: "Sample Analysis Complete", description: "3 AI agents simulated on your sample data." });
      return;
    }

    if (useLocalAgent) {
      setAnalyzing(true);
      try {
        // Prepare metrics context from active entries
        const recentEntries = activeEntries.slice(0, 14);
        const avgMetrics = {
          avgActivityMinutes: recentEntries.reduce((s, e) => s + (e.physical_activity_minutes || 0), 0) / recentEntries.length,
          avgSleepHours: recentEntries.reduce((s, e) => s + (e.sleep_hours || 0), 0) / recentEntries.length,
          avgDietScore: recentEntries.reduce((s, e) => s + (e.diet_quality_score || 0), 0) / recentEntries.length,
          avgStressLevel: recentEntries.reduce((s, e) => s + (e.stress_level || 0), 0) / recentEntries.length,
          avgScreenTimeHours: recentEntries.reduce((s, e) => s + (e.screen_time_hours || 0), 0) / recentEntries.length,
        };

        const results = await runLocalFullAnalysis(profile, avgMetrics, activeAnomalies, simulations);
        setAgentResults(results as any);
        toast({ title: "Local Analysis Complete", description: "All data consolidated in local report." });
      } catch (err) {
        toast({ title: "Analysis Failed", description: "Local fallback also failed.", variant: "destructive" });
      } finally {
        setAnalyzing(false);
      }
      return;
    }

    setAnalyzing(true);

    // Build wearable context for AI
    const wearableContext = {
      heartRateBpm:    wearableData.find(d => d.data_type === "heart_rate")?.value ?? null,
      dailySteps:      wearableData.find(d => d.data_type === "steps")?.value ?? null,
      screenTimeHours: wearableData.find(d => d.data_type === "screen_time")?.value ?? null,
      sleepHours:      wearableData.find(d => d.data_type === "sleep_duration")?.value ?? null,
      weightKg:        wearableData.find(d => d.data_type === "weight")?.value ?? null,
    };

    try {
      const { data, error } = await supabase.functions.invoke("ai-health-agent", {
        body: {
          profile: { ...profile, bmi: calculateBMI(profile.heightCm, profile.weightKg) },
          metrics,
          wearable: wearableContext,
          riskScores: {
            framingham: riskScores.framingham.riskPercentage,
            framinghamCategory: riskScores.framingham.riskCategory,
            findrisc: riskScores.findrisc.riskPercentage,
            findriscCategory: riskScores.findrisc.riskCategory,
          },
          entries: activeEntries.slice(0, 7),
          agentType: "full-analysis",
        },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("Rate limit")) {
          toast({ title: "Rate limited", description: "Please wait a moment and try again.", variant: "destructive" });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setAgentResults(data.results || []);
      toast({ title: "Analysis complete!", description: `${data.agentCount} AI agents processed your health data.` });
    } catch (e: any) {
      console.error("Analysis invocation error:", e);
      setShowConnectivityAlert(true);
      toast({ 
        title: "Analysis Connectivity Issue", 
        description: "The AI Health Agent is unreachable. Check the banner below to enable Local AI Mode.", 
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const metricLabels: Record<string, string> = {
    physical_activity_minutes: "Activity",
    sleep_hours: "Sleep",
    diet_quality_score: "Diet",
    stress_level: "Stress",
    screen_time_hours: "Screen Time",
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8 animate-fade-in" id="ai-insights-report">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                <Bot className="w-8 h-8 text-accent" />
                AI Health Intelligence
              </h1>
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
            <p className="text-muted-foreground mt-1">
              Multi-agent AI analysis with anomaly detection & behavioral drift monitoring
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleProfessionalExport}
              disabled={isExportingPro || analyzing || (!activeAnomalies.length && !activeDriftResults.length && !activeAgentResults.length && !showSampleData)}
            >
              {isExportingPro ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Final Report
                </span>
              )}
            </Button>
            <Button
              variant="hero"
              onClick={runFullAnalysis}
              disabled={analyzing || !metrics}
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Agents Running...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Run Full Analysis
                </span>
              )}
            </Button>
          </div>
        </div>

        {showConnectivityAlert && !useLocalAgent && (
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 shadow-sm group">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="p-3 bg-accent/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground text-lg">Enhance Your Privacy</p>
                <p className="text-sm text-muted-foreground leading-relaxed">Your AI agents are currently restricted by cloud connectivity. Enable **Privacy-First Local AI** to run analysis directly on your device.</p>
              </div>
            </div>
            <Button variant="hero" size="lg" className="shadow-lg shadow-accent/20" onClick={() => setUseLocalAgent(true)}>
              <Cpu className="w-4 h-4 mr-2" />
              Unlock Local AI
            </Button>
          </div>
        )}


        {useLocalAgent && (
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Cpu className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground text-lg">On-Device Intelligence Active</p>
                <p className="text-sm text-muted-foreground">AI agents are running securely in your browser session for maximum stability and speed.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-green-500/40 text-green-400 hover:bg-green-500/10" onClick={() => setUseLocalAgent(false)}>
              Back to Cloud Mode
            </Button>
          </div>
        )}


        {/* Wearable data context panel */}
        {wearableData.length > 0 && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-xs font-semibold text-green-400 mb-2">📱 Wearable data included in AI analysis:</p>
            <div className="flex flex-wrap gap-2">
              {wearableData.find(d => d.data_type === "heart_rate") && (
                <span className="text-xs px-2 py-1 rounded-full bg-background text-muted-foreground flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400" /> HR: {wearableData.find(d => d.data_type === "heart_rate")!.value} bpm
                </span>
              )}
              {wearableData.find(d => d.data_type === "steps") && (
                <span className="text-xs px-2 py-1 rounded-full bg-background text-muted-foreground flex items-center gap-1">
                  <Footprints className="w-3 h-3 text-green-400" /> Steps: {wearableData.find(d => d.data_type === "steps")!.value}
                </span>
              )}
              {wearableData.find(d => d.data_type === "screen_time") && (
                <span className="text-xs px-2 py-1 rounded-full bg-background text-muted-foreground flex items-center gap-1">
                  <Monitor className="w-3 h-3 text-blue-400" /> Screen: {wearableData.find(d => d.data_type === "screen_time")!.value}h
                </span>
              )}
            </div>
          </div>
        )}

        {activeEntries.length < 3 ? (
          <div className="p-8 rounded-xl bg-secondary/30 border border-border text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-accent opacity-50" />
            <h3 className="text-xl font-display font-semibold mb-2">Need More Data</h3>
            <p className="text-muted-foreground mb-6">Log at least 3 days of lifestyle data to enable AI analysis.</p>
            <div className="flex items-center justify-center gap-4">
              <Button asChild variant="hero">
                <Link to="/log-entry">
                  <ClipboardList className="w-4 h-4 mr-2" />

                  Log Lifestyle Entry
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setShowSampleData(true)}>
                View Sample Analysis
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {showSampleData && (
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-2 text-accent text-sm mb-6">
                <Info className="w-4 h-4" />
                <span>You are viewing <strong>Sample AI Analysis</strong>. Real analysis requires your own synced health data.</span>
              </div>
            )}
            
            {/* Anomaly Detection */}
            {activeAnomalies.length > 0 && (
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-health-amber" />
                  Anomaly Detection ({activeAnomalies.length} detected)
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeAnomalies.slice(0, 6).map((a, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${
                      a.severity === "severe" ? "bg-health-red/5 border-health-red/30" :
                      a.severity === "moderate" ? "bg-health-amber/5 border-health-amber/30" :
                      "bg-secondary/30 border-border"
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{metricLabels[a.metric] || a.metric}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          a.severity === "severe" ? "bg-health-red/10 text-health-red" :
                          a.severity === "moderate" ? "bg-health-amber/10 text-health-amber" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {a.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {a.direction === "high" ? "Unusually high" : "Unusually low"}: {a.value} (z={a.zScore})
                      </p>
                      <p className="text-xs text-muted-foreground">{a.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Behavioral Drift */}
            {activeDriftResults.length > 0 && (
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-lg font-display font-semibold text-foreground mb-4">
                  Behavioral Drift Analysis (7-day vs 21-day baseline)
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {activeDriftResults.map((d) => {
                    const Icon = d.driftDirection === "improving" ? TrendingUp : d.driftDirection === "declining" ? TrendingDown : Minus;
                    const color = d.driftDirection === "improving" ? "text-health-green" : d.driftDirection === "declining" ? "text-health-red" : "text-muted-foreground";
                    return (
                      <div key={d.metric} className="p-4 rounded-lg bg-secondary/20 text-center">
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                        <p className="text-sm font-medium text-foreground">{metricLabels[d.metric]}</p>
                        <p className={`text-lg font-bold ${color}`}>
                          {d.weekOverWeekChange > 0 ? "+" : ""}{d.weekOverWeekChange}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{d.driftDirection}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agent Results */}
            {activeAgentResults.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Multi-Agent Analysis Results
                </h2>
                {activeAgentResults.map((result, idx) => {
                  const agentLabels: Record<string, string> = {
                    planner: "🧠 Planner Agent",
                    risk_analysis: "🔬 Risk Analysis Agent",
                    recommendation: "💡 Recommendation Agent",
                    simulation: "🎯 Simulation Agent",
                  };

                  const output = typeof result.output === "string" 
                    ? (result.output.trim().startsWith("{") ? JSON.parse(result.output) : { overallAssessment: result.output }) 
                    : result.output;

                  return (
                    <div key={idx} className="p-6 rounded-xl bg-card border border-border">
                      <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                        {agentLabels[result.agent] || result.agent}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4 italic">{result.reasoning}</p>

                      {output.overallAssessment && (
                        <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 mb-4">
                          <p className="text-sm text-foreground">{output.overallAssessment} {output.projectedScore ? `(Current Target: ${output.projectedScore}/100)` : ""}</p>
                          {output.riskInsights && (
                            <div className="mt-3 grid sm:grid-cols-2 gap-2">
                              {output.riskInsights.map((ri: any, i: number) => (
                                <div key={i} className="p-2 rounded bg-background/50 border border-border flex flex-col">
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{ri.risk}</span>
                                  <span className={`text-sm font-semibold ${
                                    ri.level === "high" ? "text-health-red" : 
                                    ri.level === "moderate" || ri.level === "elevated" ? "text-health-amber" : 
                                    "text-health-green"
                                  }`}>{ri.explanation}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {output.confidenceScore && (
                            <p className="text-xs text-accent mt-2">Confidence: {Math.round(output.confidenceScore * 100)}%</p>
                          )}
                        </div>
                      )}

                      {output.analysis && (
                        <p className="text-sm text-muted-foreground mb-4">{output.analysis}</p>
                      )}

                      {output.recommendations && output.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-foreground">Recommendations:</h4>
                          {output.recommendations.map((rec: any, j: number) => (
                            <div key={j} className={`p-3 rounded-lg border-l-4 bg-secondary/20 ${
                              rec.priority === "high" ? "border-l-health-red" :
                              rec.priority === "medium" ? "border-l-health-amber" :
                              "border-l-health-green"
                            }`}>
                              <p className="text-sm font-medium text-foreground">{rec.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                              {rec.expectedImpact && (
                                <p className="text-xs text-accent mt-1">Impact: {rec.expectedImpact}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Visual Diagnostic Consolidation */}
            <div className="grid lg:grid-cols-2 gap-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-6">
                <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-6 h-6 text-health-red" />
                  Validated Risk Indicators
                </h3>
                <MedicalRiskScores 
                  entries={activeEntries} 
                  userId={user?.id} 
                  wearableData={wearableData} 
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-accent" />
                  Longevity Simulations
                </h3>
                {simulations.length > 0 ? (
                  <div className="grid gap-4">
                    {simulations.map((sim, i) => (
                      <Card key={i} className="bg-card/50 border-border/50 hover:border-accent/30 transition-all">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-bold flex justify-between">
                            {sim.name}
                            <span className="text-health-green">+{sim.projected_health_score - 50}%</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{sim.description}</p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                              <span>Health Projection</span>
                              <span>{sim.projected_health_score}/100</span>
                            </div>
                            <Progress value={sim.projected_health_score} className="h-1.5 bg-secondary" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center bg-secondary/10">
                    <TrendingUp className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No longevity simulations found.</p>
                    <Button variant="link" size="sm" asChild className="mt-2">
                      <Link to="/simulations">Create a simulation →</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AIInsights;
