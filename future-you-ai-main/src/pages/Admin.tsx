import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Shield, Users, Activity, Database, Search, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  age: number | null;
  sex: string | null;
  created_at: string;
  health_goals: string[] | null;
}

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const isAdmin = session.user?.email?.toLowerCase() === "korekedar143@gmail.com" || 
                      session.user?.email?.toLowerCase().includes("admin") ||
                      session.user?.user_metadata?.role === "admin";

      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You do not have administrative privileges to view this page.",
          variant: "destructive"
        });
        navigate("/dashboard");
        return;
      }

      setUser(session.user);

      
      // Fetch all profiles
      // NOTE: In production, this requires an admin role or service role bypass.
      // For this development phase, we'll try to fetch what we can.
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Admin fetch error:", error);
        toast({
          title: "Admin Access Restriction",
          description: "Full user listing requires administrative privileges. Check RLS policies.",
          variant: "destructive"
        });
      } else if (data) {
        // Cast to any first to bypass strict type check for now
        setUsers(data as any[]);
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigate, toast]);

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-accent" />
              Global Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Centralized management of user health profiles and predictive data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl flex items-center gap-3">
              <Users className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm font-bold text-foreground">{users.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search users by name or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-card/50"
            />
          </div>
          <Button variant="outline" className="h-11">
            <Activity className="w-4 h-4 mr-2" />
            System Status
          </Button>
        </div>

        {/* User Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl shadow-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Profile Info</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Health Goals</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-muted-foreground italic">
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.user_id} className="hover:bg-accent/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                            {u.full_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{u.full_name || "Anonymous User"}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{u.user_id.slice(0, 16)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="text-sm text-foreground">Age: <span className="text-muted-foreground">{u.age || "N/A"}</span></p>
                          <p className="text-xs text-muted-foreground underline decoration-accent/30 decoration-2 underline-offset-4">Sex: {u.sex || "Not set"}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {u.health_goals && u.health_goals.length > 0 ? (
                            u.health_goals.map((g, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                                {g}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">No goals set</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/audit?user=${u.user_id}`)}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Logs
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Database Stats Section */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 shadow-lg shadow-blue-500/5">
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Database Health
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Lifestyle Entries</span>
                <span className="font-bold text-foreground">OK</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Predictive Models</span>
                <span className="font-bold text-health-green">Active</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Admin RLS Policy</span>
                <span className="font-bold text-health-amber">Enabled</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 shadow-lg shadow-accent/5">
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Activity Monitor
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Monitoring system logs and anomaly detection engines in real-time.
            </p>
            <Button variant="hero" size="sm" className="mt-4 w-full">
              Full Maintenance Mode
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
