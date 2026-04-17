import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { 
  Trophy, 
  Users, 
  Swords, 
  Flame, 
  Search, 
  UserPlus, 
  ShieldCheck, 
  TrendingUp,
  Award,
  Crown,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Social = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("leaderboard");
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchLeaderboard();
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchLeaderboard = async () => {
    // We will fetch the top 10 users by current_streak first. 
    // We only fetch public data (full_name, streak) which should be accessible or RPC'd.
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, current_streak, avatar_url")
      .order("current_streak", { ascending: false })
      .limit(10);
    
    if (data) {
      setLeaderboard(data);
    }
    setLoading(false);
  };

  const MOCK_CHALLENGES = [
    { id: 1, name: "Global 10k Steps Spring", metric: "steps", target: 10000, daysLeft: 4, participants: 1420 },
    { id: 2, name: "Deep Sleep Week", metric: "sleep", target: 8, daysLeft: 2, participants: 855 }
  ];

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
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-health-blue">Arena</span>
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Connect with friends, climb the global leaderboards, and join multiplayer challenges to supercharge your longevity.
            </p>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 gap-2 font-semibold shadow-accent/20 shadow-lg">
            <Swords className="w-4 h-4" /> Create Challenge
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md bg-secondary/50 p-1 border border-border/50 rounded-xl">
            <TabsTrigger value="leaderboard" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground flex gap-2 font-semibold">
              <Trophy className="w-4 h-4" /> Leaderboard
            </TabsTrigger>
            <TabsTrigger value="friends" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground flex gap-2 font-semibold">
              <Users className="w-4 h-4" /> Friends
            </TabsTrigger>
            <TabsTrigger value="challenges" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground flex gap-2 font-semibold">
              <Flame className="w-4 h-4" /> Challenges
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            {/* LEADERBOARD TAB */}
            <TabsContent value="leaderboard" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" /> Global Consistency Leaders
                  </CardTitle>
                  <CardDescription>Top users ranked by their active daily log streak.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaderboard.map((player, index) => (
                      <div 
                        key={player.id || index} 
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] scale-[1.01]' : index === 1 ? 'bg-gradient-to-r from-gray-300/10 to-transparent border-gray-300/30' : index === 2 ? 'bg-gradient-to-r from-amber-700/10 to-transparent border-amber-700/30' : 'bg-background border-border hover:bg-secondary/20'}`}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center font-bold text-lg ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          #{index + 1}
                        </div>
                        
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground border border-border/50">
                          {player.full_name?.charAt(0) || "U"}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">{player.full_name || "Anonymous User"}</p>
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            Level {Math.floor((player.current_streak || 0) / 10) + 1}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 shadow-sm">
                            <Flame className="w-3.5 h-3.5 fill-orange-500" />
                            {player.current_streak || 0}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {leaderboard.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        No leaderboard data found yet. Build your streak!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FRIENDS TAB */}
            <TabsContent value="friends" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 bg-card border-border shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="font-display text-xl flex items-center gap-2">
                        <Users className="w-5 h-5 text-health-blue" /> Your Network
                      </CardTitle>
                      <CardDescription className="mt-1">Friends can view your badges and challenge you.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-secondary/20 rounded-xl border border-dashed border-border/60">
                      <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm border border-border">
                        <UserPlus className="w-6 h-6 text-muted-foreground/60" />
                      </div>
                      <h3 className="font-bold text-foreground mb-1">No Friends Yet</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mb-4">Building a social circle dramatically increases your chances of sticking to your longevity goals.</p>
                      <div className="relative w-full max-w-xs">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                        <input 
                          type="text" 
                          placeholder="Search by email..." 
                          className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">Pending Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">No pending requests.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* CHALLENGES TAB */}
            <TabsContent value="challenges" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
              <div className="grid md:grid-cols-2 gap-6">
                {MOCK_CHALLENGES.map(challenge => (
                  <Card key={challenge.id} className="bg-card border-border hover:border-accent/30 transition-all shadow-sm group">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="bg-health-blue/10 text-health-blue text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Global Event</span>
                          <CardTitle className="font-display text-xl mt-2 group-hover:text-accent transition-colors">{challenge.name}</CardTitle>
                        </div>
                        <div className="bg-secondary p-2 rounded-lg border border-border/50">
                          <Swords className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-muted-foreground font-medium capitalize flex items-center gap-1.5">
                          <Target className="w-4 h-4" /> Goal: {challenge.target} {challenge.metric}
                        </span>
                        <span className="font-semibold text-foreground">{challenge.daysLeft} days left</span>
                      </div>
                      
                      <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold ${i===1 ? 'bg-indigo-100 text-indigo-700' : i===2 ? 'bg-pink-100 text-pink-700' : i===3 ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
                              {i===4 ? `+${(challenge.participants / 100).toFixed(0)}k` : `U${i}`}
                            </div>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className="font-semibold hover:bg-accent hover:text-accent-foreground hover:border-accent">
                          Join Arena
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Card className="bg-transparent border-dashed border-2 border-border flex flex-col items-center justify-center p-8 text-center hover:bg-card/50 hover:border-accent/50 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                    <Swords className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-1">Draft a Custom Challenge</h3>
                  <p className="text-sm text-muted-foreground max-w-[200px]">Invite up to 10 friends to a private health competition.</p>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>

      </div>
    </DashboardLayout>
  );
};

export default Social;
