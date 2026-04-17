import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useAchievements } from "@/hooks/useAchievements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Flame, Zap, Lock, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TIER_STYLES: Record<string, { border: string; bg: string; glow: string; label: string }> = {
  bronze:  { border: "border-amber-700/40",  bg: "bg-amber-700/10",  glow: "shadow-amber-700/10",  label: "Bronze" },
  silver:  { border: "border-gray-400/40",   bg: "bg-gray-400/10",   glow: "shadow-gray-400/10",   label: "Silver" },
  gold:    { border: "border-yellow-500/40", bg: "bg-yellow-500/10", glow: "shadow-yellow-500/10", label: "Gold" },
  diamond: { border: "border-cyan-400/40",   bg: "bg-cyan-400/10",   glow: "shadow-cyan-400/20",   label: "Diamond" },
};

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  streak:  { label: "Streak",  icon: <Flame className="w-4 h-4 text-orange-500" /> },
  logging: { label: "Logging", icon: <Star className="w-4 h-4 text-yellow-500" /> },
  ai:      { label: "AI",      icon: <Zap className="w-4 h-4 text-purple-500" /> },
  health:  { label: "Health",  icon: <Sparkles className="w-4 h-4 text-green-500" /> },
  social:  { label: "Social",  icon: <Trophy className="w-4 h-4 text-blue-500" /> },
};

const Achievements = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const { allAchievements, earnedIds, totalXp, level, loading } = useAchievements(user?.id);

  const earnedCount = earnedIds.size;
  const totalCount = allAchievements.length;
  const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;
  const xpToNextLevel = 100 - (totalXp % 100);

  const categories = ["all", ...Object.keys(CATEGORY_LABELS)];

  const filteredAchievements = activeCategory === "all"
    ? allAchievements
    : allAchievements.filter(a => a.category === activeCategory);

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex h-full items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pt-4">

        {/* Header with Level & XP */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              Trophy <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">Case</span>
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Every healthy choice earns XP. Level up your digital self and unlock rare achievements.
            </p>
          </div>

          {/* Level Card */}
          <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20 shadow-lg shadow-accent/5 min-w-[260px]">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-2xl font-black text-accent border border-accent/30">
                  {level}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level {level}</p>
                  <p className="text-lg font-bold text-foreground">{totalXp.toLocaleString()} XP</p>
                  <div className="mt-1.5">
                    <Progress value={((totalXp % 100) / 100) * 100} className="h-2" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">{xpToNextLevel} XP to next level</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-foreground">Collection Progress</span>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {earnedCount} / {totalCount} ({progressPercent}%)
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </CardContent>
        </Card>

        {/* Category Filter Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="flex flex-wrap gap-1 bg-secondary/50 p-1 border border-border/50 rounded-xl w-fit">
            <TabsTrigger
              value="all"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-semibold px-4"
            >
              All
            </TabsTrigger>
            {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-semibold flex gap-1.5 px-3"
              >
                {icon} {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Achievement Grid */}
          <div className="mt-6">
            {categories.map(cat => (
              <TabsContent key={cat} value={cat} className="m-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAchievements.map(achievement => {
                    const earned = earnedIds.has(achievement.id);
                    const tier = TIER_STYLES[achievement.tier] || TIER_STYLES.bronze;

                    return (
                      <Card
                        key={achievement.id}
                        className={`relative overflow-hidden transition-all duration-300 group ${
                          earned
                            ? `${tier.border} ${tier.bg} shadow-lg ${tier.glow} hover:scale-[1.02]`
                            : 'border-border bg-card/50 opacity-60 hover:opacity-80'
                        }`}
                      >
                        {/* Tier Badge */}
                        <div className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                          earned ? `${tier.border} text-foreground` : 'border-border text-muted-foreground'
                        }`}>
                          {tier.label}
                        </div>

                        <CardContent className="p-5 flex items-start gap-4">
                          {/* Icon */}
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                            earned ? `${tier.bg} border ${tier.border}` : 'bg-secondary border border-border'
                          }`}>
                            {earned ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground/50" />}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-sm ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {achievement.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {achievement.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                earned ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'
                              }`}>
                                +{achievement.xp_reward} XP
                              </span>
                              {earned && (
                                <span className="text-[10px] text-green-500 font-semibold flex items-center gap-0.5">
                                  <Sparkles className="w-3 h-3" /> Earned
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {filteredAchievements.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    No achievements in this category yet.
                  </div>
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>

      </div>
    </DashboardLayout>
  );
};

export default Achievements;
