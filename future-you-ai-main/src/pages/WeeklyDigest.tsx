import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Moon,
  Footprints,
  Brain,
  Utensils,
  Plus,
  Calendar,
  BarChart3,
  Sparkles,
} from "lucide-react";

interface GoalItem {
  id: string;
  name: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  frequency: string;
  is_active: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  sleep:    { icon: <Moon className="w-4 h-4" />,       color: "text-indigo-500",  bg: "bg-indigo-500/10" },
  steps:    { icon: <Footprints className="w-4 h-4" />, color: "text-green-500",   bg: "bg-green-500/10" },
  activity: { icon: <Target className="w-4 h-4" />,     color: "text-orange-500",  bg: "bg-orange-500/10" },
  diet:     { icon: <Utensils className="w-4 h-4" />,   color: "text-pink-500",    bg: "bg-pink-500/10" },
  stress:   { icon: <Brain className="w-4 h-4" />,      color: "text-purple-500",  bg: "bg-purple-500/10" },
  custom:   { icon: <Sparkles className="w-4 h-4" />,   color: "text-cyan-500",    bg: "bg-cyan-500/10" },
};

const DEFAULT_GOALS: Omit<GoalItem, "id">[] = [
  { name: "Sleep 8 Hours",          category: "sleep",    target_value: 8,    current_value: 0, unit: "hrs",  frequency: "daily", is_active: true },
  { name: "Walk 10,000 Steps",      category: "steps",    target_value: 10000,current_value: 0, unit: "steps",frequency: "daily", is_active: true },
  { name: "Exercise 30 Minutes",    category: "activity", target_value: 30,   current_value: 0, unit: "min",  frequency: "daily", is_active: true },
  { name: "Eat Clean (7+ Score)",   category: "diet",     target_value: 7,    current_value: 0, unit: "/10",  frequency: "daily", is_active: true },
  { name: "Keep Stress Below 4",    category: "stress",   target_value: 4,    current_value: 0, unit: "/10",  frequency: "daily", is_active: true },
];

const WeeklyDigest = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ avgSleep: 0, avgActivity: 0, avgStress: 0, avgDiet: 0, totalEntries: 0 });
  const [prevWeekStats, setPrevWeekStats] = useState<typeof weeklyStats | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchData(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchData = async (userId: string) => {
    // Fetch goals
    const { data: goalsData } = await (supabase as any)
      .from("user_health_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (goalsData && goalsData.length > 0) {
      setGoals(goalsData);
    }

    // Calculate this week's averages from lifestyle_entries
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfPrevWeek = new Date(startOfWeek);
    startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);

    const { data: thisWeekEntries } = await supabase
      .from("lifestyle_entries")
      .select("sleep_hours, physical_activity_minutes, stress_level, diet_quality_score")
      .eq("user_id", userId)
      .gte("entry_date", startOfWeek.toISOString().split("T")[0])
      .lte("entry_date", now.toISOString().split("T")[0]);

    if (thisWeekEntries && thisWeekEntries.length > 0) {
      const n = thisWeekEntries.length;
      setWeeklyStats({
        avgSleep: thisWeekEntries.reduce((s, e) => s + (e.sleep_hours || 0), 0) / n,
        avgActivity: thisWeekEntries.reduce((s, e) => s + (e.physical_activity_minutes || 0), 0) / n,
        avgStress: thisWeekEntries.reduce((s, e) => s + (e.stress_level || 0), 0) / n,
        avgDiet: thisWeekEntries.reduce((s, e) => s + (e.diet_quality_score || 0), 0) / n,
        totalEntries: n,
      });
    }

    // Previous week for comparison
    const { data: prevWeekEntries } = await supabase
      .from("lifestyle_entries")
      .select("sleep_hours, physical_activity_minutes, stress_level, diet_quality_score")
      .eq("user_id", userId)
      .gte("entry_date", startOfPrevWeek.toISOString().split("T")[0])
      .lt("entry_date", startOfWeek.toISOString().split("T")[0]);

    if (prevWeekEntries && prevWeekEntries.length > 0) {
      const n = prevWeekEntries.length;
      setPrevWeekStats({
        avgSleep: prevWeekEntries.reduce((s, e) => s + (e.sleep_hours || 0), 0) / n,
        avgActivity: prevWeekEntries.reduce((s, e) => s + (e.physical_activity_minutes || 0), 0) / n,
        avgStress: prevWeekEntries.reduce((s, e) => s + (e.stress_level || 0), 0) / n,
        avgDiet: prevWeekEntries.reduce((s, e) => s + (e.diet_quality_score || 0), 0) / n,
        totalEntries: n,
      });
    }

    setLoading(false);
  };

  const seedDefaultGoals = async () => {
    if (!user) return;
    const inserts = DEFAULT_GOALS.map(g => ({ ...g, user_id: user.id }));
    const { error } = await (supabase as any).from("user_health_goals").insert(inserts);
    if (!error) {
      toast({ title: "Goals Created!", description: "5 default health goals have been set up for you." });
      fetchData(user.id);
    }
  };

  const getDelta = (current: number, prev: number) => {
    const diff = current - prev;
    if (Math.abs(diff) < 0.1) return { icon: <Minus className="w-3.5 h-3.5" />, color: "text-muted-foreground", text: "Same" };
    if (diff > 0) return { icon: <TrendingUp className="w-3.5 h-3.5" />, color: "text-green-500", text: `+${diff.toFixed(1)}` };
    return { icon: <TrendingDown className="w-3.5 h-3.5" />, color: "text-red-500", text: `${diff.toFixed(1)}` };
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex h-full items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const summaryCards = [
    { label: "Avg Sleep",    value: `${weeklyStats.avgSleep.toFixed(1)}h`,       prev: prevWeekStats?.avgSleep,    icon: <Moon className="w-5 h-5" />,       color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Avg Activity", value: `${weeklyStats.avgActivity.toFixed(0)}m`,    prev: prevWeekStats?.avgActivity, icon: <Footprints className="w-5 h-5" />, color: "text-green-500",  bg: "bg-green-500/10" },
    { label: "Avg Stress",   value: `${weeklyStats.avgStress.toFixed(1)}/10`,    prev: prevWeekStats?.avgStress,   icon: <Brain className="w-5 h-5" />,      color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Avg Diet",     value: `${weeklyStats.avgDiet.toFixed(1)}/10`,      prev: prevWeekStats?.avgDiet,     icon: <Utensils className="w-5 h-5" />,   color: "text-pink-500",   bg: "bg-pink-500/10" },
  ];

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pt-4">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              Weekly <span className="text-transparent bg-clip-text bg-gradient-to-r from-health-blue to-accent">Digest</span>
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Your weekly performance snapshot. Track goals, compare trends, and optimize your health trajectory.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl border border-border/50 text-sm text-muted-foreground font-medium">
            <Calendar className="w-4 h-4 text-accent" />
            This Week &middot; {weeklyStats.totalEntries} entries logged
          </div>
        </div>

        {/* Weekly Comparison Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => {
            const delta = card.prev !== undefined ? getDelta(parseFloat(card.value), card.prev) : null;
            return (
              <Card key={i} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${card.bg}`}>
                      <span className={card.color}>{card.icon}</span>
                    </div>
                    {delta && (
                      <span className={`flex items-center gap-1 text-xs font-semibold ${delta.color}`}>
                        {delta.icon} {delta.text}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Health Goals Section */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" /> Personal Health Goals
              </CardTitle>
              <CardDescription>Set targets, track progress, and build lasting habits.</CardDescription>
            </div>
            {goals.length === 0 && (
              <Button onClick={seedDefaultGoals} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
                <Plus className="w-4 h-4" /> Set Up Default Goals
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map(goal => {
                  const config = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.custom;
                  const percent = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0;

                  return (
                    <div key={goal.id} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border/50">
                      <div className={`p-2.5 rounded-xl ${config.bg}`}>
                        <span className={config.color}>{config.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-bold text-sm text-foreground truncate">{goal.name}</p>
                          <span className="text-xs font-semibold text-muted-foreground shrink-0 ml-2">
                            {goal.current_value} / {goal.target_value} {goal.unit}
                          </span>
                        </div>
                        <Progress value={percent} className="h-2.5" />
                      </div>
                      <span className={`text-sm font-bold min-w-[40px] text-right ${percent >= 100 ? 'text-green-500' : percent >= 50 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No goals set yet.</p>
                <p className="text-sm mt-1">Click "Set Up Default Goals" to get started with recommended targets.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default WeeklyDigest;
