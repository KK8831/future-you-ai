import { useMemo } from "react";
import { Pill, Sun, Droplets } from "lucide-react";
import { LifestyleEntry } from "@/types/lifestyle";

interface SupplementCardsProps {
  entries: LifestyleEntry[];
}

interface Supplement {
  name: string;
  dosage: string;
  reason: string;
  icon: React.ElementType;
  priority: "recommended" | "consider" | "optional";
}

export function SupplementCards({ entries }: SupplementCardsProps) {
  const supplements = useMemo((): Supplement[] => {
    if (entries.length === 0) return [];
    const recent = entries.slice(0, Math.min(7, entries.length));
    const avgSleep = recent.reduce((s, e) => s + e.sleep_hours, 0) / recent.length;
    const avgStress = recent.reduce((s, e) => s + e.stress_level, 0) / recent.length;
    const avgActivity = recent.reduce((s, e) => s + e.physical_activity_minutes, 0) / recent.length;

    const list: Supplement[] = [];

    if (avgSleep < 7) {
      list.push({ name: "Magnesium", dosage: "400mg", reason: "May improve sleep quality", icon: Pill, priority: "recommended" });
    }
    if (avgStress > 6) {
      list.push({ name: "Omega-3", dosage: "1000mg", reason: "Supports stress response", icon: Droplets, priority: "recommended" });
    }
    list.push({ name: "Vitamin D", dosage: "2000 IU", reason: "General wellness", icon: Sun, priority: avgActivity < 20 ? "recommended" : "optional" });

    return list;
  }, [entries]);

  if (supplements.length === 0) return null;

  const priorityColor = {
    recommended: "border-health-green/30 bg-health-green/5",
    consider: "border-health-amber/30 bg-health-amber/5",
    optional: "border-border bg-secondary/30",
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <h4 className="text-sm font-semibold text-foreground mb-3">Wellness Suggestions</h4>
      <div className="grid grid-cols-3 gap-2">
        {supplements.map((s) => (
          <div key={s.name} className={`p-3 rounded-lg border ${priorityColor[s.priority]} text-center`}>
            <s.icon className="w-5 h-5 mx-auto text-accent mb-1" />
            <p className="text-xs font-semibold text-foreground">{s.name}</p>
            <p className="text-[10px] text-muted-foreground">{s.dosage}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{s.reason}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 italic">
        * Not medical advice. Consult a healthcare professional.
      </p>
    </div>
  );
}
