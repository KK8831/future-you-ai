import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Shield, Eye, Edit, Trash2, Plus, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  created_at: string;
  details: any;
}

const actionConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  INSERT: { icon: Plus, color: "text-health-green", label: "Created" },
  UPDATE: { icon: Edit, color: "text-health-amber", label: "Updated" },
  DELETE: { icon: Trash2, color: "text-health-red", label: "Deleted" },
  SELECT: { icon: Eye, color: "text-health-blue", label: "Viewed" },
};

const AuditDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const navigate = useNavigate();

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
    const isAdmin = user.email?.toLowerCase() === "korekedar143@gmail.com";

    const fetchLogs = async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      // Admin sees ALL user logs; regular users see only their own
      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Audit logs fetch error:", error);
      }
      if (data) setLogs(data as AuditLog[]);
    };

    fetchLogs();
  }, [user]);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.action === filter);

  // Stats
  const stats = {
    total: logs.length,
    inserts: logs.filter((l) => l.action === "INSERT").length,
    updates: logs.filter((l) => l.action === "UPDATE").length,
    deletes: logs.filter((l) => l.action === "DELETE").length,
  };

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
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-accent" />
            Security & Audit Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            HIPAA-compliant audit trail of all data access and modifications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: stats.total, color: "text-accent" },
            { label: "Records Created", value: stats.inserts, color: "text-health-green" },
            { label: "Records Updated", value: stats.updates, color: "text-health-amber" },
            { label: "Records Deleted", value: stats.deletes, color: "text-health-red" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl bg-card border border-border text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {["all", "INSERT", "UPDATE", "DELETE"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All Events" : actionConfig[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Audit Log Timeline */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">Access Timeline</h3>
          {filteredLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No audit events recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log) => {
                const config = actionConfig[log.action] || { icon: Eye, color: "text-muted-foreground", label: log.action };
                const Icon = config.icon;
                return (
                  <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    <div className={`p-2 rounded-lg bg-secondary ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                        <span className="text-xs text-muted-foreground">on</span>
                        <span className="text-sm font-medium text-foreground">{log.table_name}</span>
                      </div>
                      {log.record_id && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          Record: {log.record_id.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(log.created_at), "MMM d, HH:mm")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Compliance Badge */}
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-center gap-4">
          <Shield className="w-10 h-10 text-accent flex-shrink-0" />
          <div>
            <h4 className="font-medium text-foreground">HIPAA-Style Compliance Active</h4>
            <p className="text-sm text-muted-foreground">
              All data access and modifications are automatically logged with timestamps, user IDs, and action types via database triggers.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditDashboard;
