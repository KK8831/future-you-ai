import { Sparkles, Dumbbell, Brain, Moon, Heart, Target, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface HealthPrioritiesProps {
  goals: string[] | null;
}

const GOAL_CONFIG = [
  { id: "longevity",    label: "Longevity",         icon: Sparkles,  color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", desc: "Focus on lifespan" },
  { id: "weight",       label: "Weight Loss",       icon: Dumbbell,  color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", desc: "Metabolic health" },
  { id: "stress",       label: "Stress Mgmt",       icon: Brain,     color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", desc: "Mental wellbeing" },
  { id: "sleep",        label: "Better Sleep",      icon: Moon,      color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20",   desc: "Recovery & rest" },
  { id: "heart",        label: "Heart Health",      icon: Heart,     color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/20",    desc: "Vascular health" },
  { id: "performance",  label: "Performance",       icon: Target,    color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/20",  desc: "Peak capability" },
];

export function HealthPriorities({ goals }: HealthPrioritiesProps) {
  if (!goals || goals.length === 0) return null;

  const selectedGoals = GOAL_CONFIG.filter(g => goals.includes(g.id));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/10">
            <Target className="w-4 h-4 text-accent" />
          </div>
          <h3 className="text-sm font-display font-bold text-foreground uppercase tracking-wider">
            Your Health Priorities
          </h3>
        </div>
        <Link to="/profile" className="text-xs text-muted-foreground hover:text-accent transition-colors">Manage Goals</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedGoals.map((goal) => (
          <div 
            key={goal.id} 
            className={cn(
              "p-4 rounded-2xl border bg-card/40 backdrop-blur-sm transition-all hover:shadow-md group",
              goal.border
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl", goal.bg)}>
                <goal.icon className={cn("w-5 h-5", goal.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground truncate">{goal.label}</h4>
                <p className="text-[10px] text-muted-foreground truncate">{goal.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
