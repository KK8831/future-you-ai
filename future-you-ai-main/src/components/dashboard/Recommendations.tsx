import { useMemo } from "react";
import { Footprints, Moon, Apple, Brain, Monitor, Sparkles } from "lucide-react";
import { LifestyleEntry, Recommendation } from "@/types/lifestyle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface RecommendationsProps {
  entries: LifestyleEntry[];
}

function generateRecommendations(entries: LifestyleEntry[]): Recommendation[] {
  if (entries.length === 0) {
    return [{
      id: "start",
      title: "Start Tracking Your Lifestyle",
      description: "Begin logging your daily activities, sleep, diet, stress, and screen time to receive personalized recommendations.",
      category: "activity",
      priority: "high",
      expectedImpact: "Enable personalized health insights",
    }];
  }

  const recentEntries = entries.slice(0, Math.min(7, entries.length));
  const avgActivity = recentEntries.reduce((s, e) => s + e.physical_activity_minutes, 0) / recentEntries.length;
  const avgSleep = recentEntries.reduce((s, e) => s + e.sleep_hours, 0) / recentEntries.length;
  const avgDiet = recentEntries.reduce((s, e) => s + e.diet_quality_score, 0) / recentEntries.length;
  const avgStress = recentEntries.reduce((s, e) => s + e.stress_level, 0) / recentEntries.length;
  const avgScreen = recentEntries.reduce((s, e) => s + e.screen_time_hours, 0) / recentEntries.length;

  const recommendations: Recommendation[] = [];

  // Activity recommendations
  if (avgActivity < 30) {
    recommendations.push({
      id: "activity-1",
      title: "Increase Daily Physical Activity",
      description: `You're averaging ${Math.round(avgActivity)} minutes daily. Aim for at least 30 minutes of moderate activity. Try a 15-minute morning walk and 15-minute evening stretch.`,
      category: "activity",
      priority: avgActivity < 15 ? "high" : "medium",
      expectedImpact: "Reduce cardiovascular risk by up to 20%",
    });
  } else {
    recommendations.push({
      id: "activity-good",
      title: "Maintain Excellent Activity",
      description: `Great job! You're averaging ${Math.round(avgActivity)} minutes daily. Keep up your active lifestyle to maintain your heart health.`,
      category: "activity",
      priority: "low",
      expectedImpact: "Maintain optimal cardiovascular fitness",
    });
  }

  // Sleep recommendations
  if (avgSleep < 7) {
    recommendations.push({
      id: "sleep-1",
      title: "Improve Sleep Duration",
      description: `You're averaging ${avgSleep.toFixed(1)} hours. Adults need 7-9 hours. Try setting a consistent bedtime and avoiding screens 1 hour before sleep.`,
      category: "sleep",
      priority: avgSleep < 6 ? "high" : "medium",
      expectedImpact: "Improve cognitive function and reduce obesity risk",
    });
  } else if (avgSleep > 9) {
    recommendations.push({
      id: "sleep-2",
      title: "Optimize Sleep Duration",
      description: `You're averaging ${avgSleep.toFixed(1)} hours, which may indicate oversleeping. Aim for 7-9 hours and consider checking for underlying fatigue causes.`,
      category: "sleep",
      priority: "low",
      expectedImpact: "Improve energy levels and daily productivity",
    });
  } else {
    recommendations.push({
      id: "sleep-good",
      title: "Optimal Rest Preserved",
      description: `Your sleep average is a healthy ${avgSleep.toFixed(1)} hours. Consistent rest is foundational to your body's cellular repair protocol.`,
      category: "sleep",
      priority: "low",
      expectedImpact: "Sustain cognitive sharpness and immune defense",
    });
  }

  // Diet recommendations
  if (avgDiet < 6) {
    recommendations.push({
      id: "diet-1",
      title: "Enhance Diet Quality",
      description: `Your diet score averages ${avgDiet.toFixed(1)}/10. Focus on adding more vegetables, fruits, and whole grains. Consider meal prepping for better control.`,
      category: "diet",
      priority: avgDiet < 4 ? "high" : "medium",
      expectedImpact: "Lower diabetes risk and improve energy levels",
    });
  } else {
    recommendations.push({
      id: "diet-good",
      title: "Strong Nutritional Baseline",
      description: `Your diet score is a solid ${avgDiet.toFixed(1)}/10. You are providing your body with excellent macronutrients to fuel your longevity.`,
      category: "diet",
      priority: "low",
      expectedImpact: "Support long-term metabolic stability",
    });
  }

  // Stress recommendations
  if (avgStress > 6) {
    recommendations.push({
      id: "stress-1",
      title: "Reduce Stress Levels",
      description: `Your stress averages ${avgStress.toFixed(1)}/10. Try incorporating 10 minutes of daily meditation or deep breathing exercises. Regular exercise also helps.`,
      category: "stress",
      priority: avgStress > 7 ? "high" : "medium",
      expectedImpact: "Reduce mental health risks and improve sleep quality",
    });
  } else {
    recommendations.push({
      id: "stress-good",
      title: "Stress Well Managed",
      description: `Your stress levels are low at ${avgStress.toFixed(1)}/10. Great work prioritizing your mental bandwidth and recovery.`,
      category: "stress",
      priority: "low",
      expectedImpact: "Lower cortisol impact on biological aging",
    });
  }

  // Screen time recommendations
  if (avgScreen > 6) {
    recommendations.push({
      id: "screen-1",
      title: "Reduce Screen Time",
      description: `You're averaging ${avgScreen.toFixed(1)} hours daily. Set app time limits and try replacing 1 hour with outdoor activities or reading.`,
      category: "screen",
      priority: avgScreen > 8 ? "high" : "medium",
      expectedImpact: "Improve sleep quality and reduce eye strain",
    });
  }

  // Sort by priority (high -> medium -> low)
  const priorityScore = { high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]);

  // Always return 4-5 recommendations so the UI looks full and professional
  return recommendations.slice(0, 4);
}

const categoryIcons = {
  activity: Footprints,
  sleep: Moon,
  diet: Apple,
  stress: Brain,
  screen: Monitor,
};

const priorityStyles = {
  high: "border-l-health-red",
  medium: "border-l-health-amber",
  low: "border-l-health-green",
};

export function Recommendations({ entries }: RecommendationsProps) {
  const recommendations = useMemo(() => generateRecommendations(entries), [entries]);

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Personalized Recommendations
          </h3>
          <p className="text-sm text-muted-foreground">AI-generated suggestions to improve your health</p>
        </div>
        {entries.length === 0 && (
          <Button asChild variant="hero" size="sm">
            <Link to="/log-entry">Log First Entry</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => {
          const Icon = categoryIcons[rec.category];
          
          return (
            <div
              key={rec.id}
              className={`p-5 rounded-xl bg-secondary/30 border-l-4 ${priorityStyles[rec.priority]} hover:bg-secondary/50 transition-colors`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-accent/10 text-accent">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">{rec.title}</h4>
                  <span className={`text-xs capitalize ${
                    rec.priority === "high" ? "text-health-red" :
                    rec.priority === "medium" ? "text-health-amber" : "text-health-green"
                  }`}>
                    {rec.priority} priority
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {rec.description}
              </p>
              <div className="text-xs text-accent font-medium">
                Expected impact: {rec.expectedImpact}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}