export interface LifestyleEntry {
  id: string;
  user_id: string;
  entry_date: string;
  physical_activity_minutes: number;
  sleep_hours: number;
  diet_quality_score: number; // 1-10
  stress_level: number; // 1-10
  screen_time_hours: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DigitalTwinState {
  averageActivity: number;
  averageSleep: number;
  averageDiet: number;
  averageStress: number;
  averageScreenTime: number;
  trendDirection: "improving" | "stable" | "declining";
  healthScore: number; // 0-100
  lastUpdated: string;
}

export interface HealthRisk {
  name: string;
  probability: number; // 0-100
  severity: "low" | "medium" | "high";
  factors: string[];
  timeframe: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: "activity" | "sleep" | "diet" | "stress" | "screen";
  priority: "high" | "medium" | "low";
  expectedImpact: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  changes: {
    physical_activity_change: number;
    sleep_change: number;
    diet_change: number;
    stress_change: number;
    screen_time_change: number;
  };
  projectedOutcomes: {
    healthScore: number;
    riskReduction: Record<string, number>;
  };
  timeframe_years: number;
}