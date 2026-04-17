import { useState, useEffect } from "react";
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";

export function HistoricalTrends({ user }: { user: User | null }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistoricalData();
    }
  }, [user]);

  const fetchHistoricalData = async () => {
    if (!user) return;
    
    // Get last 14 days
    const minDate = format(subDays(new Date(), 14), "yyyy-MM-dd");

    const { data: entries } = await supabase
      .from("lifestyle_entries")
      .select("entry_date, sleep_hours, stress_level")
      .eq("user_id", user.id)
      .gte("entry_date", minDate)
      .order("entry_date", { ascending: true });

    if (entries) {
      // Format data for recharts
      const chartData = entries.map((entry) => ({
        date: format(new Date(entry.entry_date), "MMM d"),
        sleep: entry.sleep_hours,
        stress: entry.stress_level,
      }));
      setData(chartData);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="w-full h-[300px] bg-secondary/20 animate-pulse rounded-xl border border-border/50 flex flex-col items-center justify-center p-6">
        <p className="text-sm text-muted-foreground mt-4">Loading historical trends...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] bg-card rounded-xl border border-border/50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
          📊
        </div>
        <h3 className="font-semibold text-foreground">No Data Yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
          Log your lifestyle entries for a few days to see your sleep and stress trends here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-card rounded-xl border border-border/50 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-32 bg-accent/5 rounded-bl-full -z-10 group-hover:bg-accent/10 transition-colors duration-500 blur-2xl" />
      
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground font-display">14-Day Trends</h3>
        <p className="text-sm text-muted-foreground">Correlation between Sleep (hrs) and Stress (1-10)</p>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
              dy={10}
            />
            <YAxis 
              yAxisId="left" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#3b82f6" }} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#ef4444" }} 
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                borderColor: "hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
              }}
              itemStyle={{ fontSize: "14px", fontWeight: 500 }}
              labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="sleep" 
              name="Sleep (hrs)"
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSleep)" 
              animationDuration={1500}
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="stress" 
              name="Stress (1-10)"
              stroke="#ef4444" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorStress)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
