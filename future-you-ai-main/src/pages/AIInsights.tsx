import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { LifestyleEntry } from "@/types/lifestyle";
import { calculateMedicalRisks, HealthProfile, calculateBMI } from "@/lib/medical-calculators";
import { detectAnomalies, detectBehavioralDrift, monteCarloSimulation, AnomalyPoint, DriftResult } from "@/lib/advanced-analytics";
import { useToast } from "@/hooks/use-toast";
import { Bot, Zap, AlertTriangle, TrendingUp, TrendingDown, Minus, Brain, RefreshCw, Sparkles, Download } from "lucide-react";
import { usePdfExport } from "@/hooks/usePdfExport";

interface AgentResult {
  agent: string;
  output: any;
  reasoning: string;
}

const AIInsights = () => {
  const [user, setUser] = useState<User | null>(null);
  const { exportToPdf, isExporting } = usePdfExport({ filename: "AI_Health_Intelligence_Report.pdf" });
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LifestyleEntry[]>([]);
  const [profile, setProfile] = useState<HealthProfile>({ age: 30, sex: "unspecified", heightCm: 170, weightKg: 70 });
  const [agentResults, setAgentResults] = useState<AgentResult[]>([]);
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
    ]).then(([entriesRes, profileRes]) => {
      if (entriesRes.data) setEntries(entriesRes.data as LifestyleEntry[]);
      if (profileRes.data) {
        setProfile({
          age: profileRes.data.age || 30,
          sex: (profileRes.data.sex as HealthProfile["sex"]) || "unspecified",
          heightCm: Number(profileRes.data.height_cm) || 170,
          weightKg: Number(profileRes.data.weight_kg) || 70,
        });
      }
    });
  }, [user]);

  const anomalies = useMemo(() => entries.length >= 5 ? detectAnomalies(entries) : [], [entries]);
  const driftResults = useMemo(() => entries.length >= 14 ? detectBehavioralDrift(entries) : [], [entries]);

  const metrics = useMemo(() => {
    if (entries.length < 3) return null;
    const recent = entries.slice(0, 14);
    return {
      avgActivityMinutes: recent.reduce((s, e) => s + e.physical_activity_minutes, 0) / recent.length,
      avgSleepHours: recent.reduce((s, e) => s + e.sleep_hours, 0) / recent.length,
      avgDietScore: recent.reduce((s, e) => s + e.diet_quality_score, 0) / recent.length,
      avgStressLevel: recent.reduce((s, e) => s + e.stress_level, 0) / recent.length,
      avgScreenTimeHours: recent.reduce((s, e) => s + e.screen_time_hours, 0) / recent.length,
    };
  }, [entries]);

  const riskScores = useMemo(() => {
    if (!metrics) return null;
    return calculateMedicalRisks(profile, metrics);
  }, [profile, metrics]);

  const runFullAnalysis = async () => {
    if (!metrics || !riskScores) return;
    setAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-health-agent", {
        body: {
          profile: { ...profile, bmi: calculateBMI(profile.heightCm, profile.weightKg) },
          metrics,
          riskScores: {
            framingham: riskScores.framingham.riskPercentage,
            framinghamCategory: riskScores.framingham.riskCategory,
            findrisc: riskScores.findrisc.riskPercentage,
            findriscCategory: riskScores.findrisc.riskCategory,
          },
          entries: entries.slice(0, 7),
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
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
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
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <Bot className="w-8 h-8 text-accent" />
              AI Health Intelligence
            </h1>
            <p className="text-muted-foreground mt-1">
              Multi-agent AI analysis with anomaly detection & behavioral drift monitoring
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => exportToPdf("ai-insights-report")}
              disabled={isExporting || analyzing || (!anomalies.length && !driftResults.length && !agentResults.length)}
            >
              {isExporting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Exporting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
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

        {entries.length < 3 && (
          <div className="p-8 rounded-xl bg-secondary/30 border border-border text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-accent opacity-50" />
            <h3 className="text-xl font-display font-semibold mb-2">Need More Data</h3>
            <p className="text-muted-foreground">Log at least 3 days of lifestyle data to enable AI analysis.</p>
          </div>
        )}

        {/* Anomaly Detection */}
        {anomalies.length > 0 && (
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-health-amber" />
              Anomaly Detection ({anomalies.length} detected)
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {anomalies.slice(0, 6).map((a, i) => (
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
        {driftResults.length > 0 && (
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">
              Behavioral Drift Analysis (7-day vs 21-day baseline)
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {driftResults.map((d) => {
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
        {agentResults.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Multi-Agent Analysis Results
            </h2>
            {agentResults.map((result, idx) => {
              const agentLabels: Record<string, string> = {
                planner: "🧠 Planner Agent",
                risk_analysis: "🔬 Risk Analysis Agent",
                recommendation: "💡 Recommendation Agent",
                simulation: "🎯 Simulation Agent",
              };

              const output = typeof result.output === "string" ? JSON.parse(result.output) : result.output;

              return (
                <div key={idx} className="p-6 rounded-xl bg-card border border-border">
                  <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                    {agentLabels[result.agent] || result.agent}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 italic">{result.reasoning}</p>

                  {output.overallAssessment && (
                    <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 mb-4">
                      <p className="text-sm text-foreground">{output.overallAssessment}</p>
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

                  {output.riskInsights && output.riskInsights.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="text-sm font-medium text-foreground">Risk Insights:</h4>
                      {output.riskInsights.map((risk: any, j: number) => (
                        <div key={j} className="p-3 rounded-lg bg-secondary/20">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">{risk.risk}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              risk.level === "critical" ? "bg-health-red/10 text-health-red" :
                              risk.level === "high" ? "bg-health-amber/10 text-health-amber" :
                              "bg-secondary text-muted-foreground"
                            }`}>{risk.level}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{risk.explanation}</p>
                          {risk.medicalReferences && (
                            <p className="text-xs text-accent mt-1">Refs: {risk.medicalReferences.join(", ")}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {output.simulationSuggestions && output.simulationSuggestions.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="text-sm font-medium text-foreground">Suggested Simulations:</h4>
                      {output.simulationSuggestions.map((sim: any, j: number) => (
                        <div key={j} className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                          <p className="text-sm font-medium text-foreground">{sim.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{sim.description}</p>
                          {sim.projectedImprovement && (
                            <p className="text-xs text-health-green mt-1">Projected: {sim.projectedImprovement}</p>
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
      </div>
    </DashboardLayout>
  );
};

export default AIInsights;
