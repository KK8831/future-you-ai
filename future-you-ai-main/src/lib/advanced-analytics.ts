/**
 * Advanced Analytics Engine
 * 
 * Implements:
 * - Rolling Correlation Analysis (windowed Pearson)
 * - Monte Carlo Health Simulation
 * - Anomaly Detection (Z-score based Isolation Forest proxy)
 * - Trend Decomposition
 * - Behavioral Drift Detection
 */

import { LifestyleEntry } from "@/types/lifestyle";
import { pearsonCorrelation } from "@/lib/correlation";

// ============== Rolling Correlation ==============

export interface RollingCorrelationPoint {
  date: string;
  correlation: number;
  windowSize: number;
}

export interface RollingCorrelationResult {
  metricA: string;
  metricB: string;
  points: RollingCorrelationPoint[];
  trend: "strengthening" | "weakening" | "stable";
}

/**
 * Calculate rolling Pearson correlation with a sliding window
 */
export function rollingCorrelation(
  entries: LifestyleEntry[],
  metricA: keyof LifestyleEntry,
  metricB: keyof LifestyleEntry,
  windowSize = 7
): RollingCorrelationResult {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );

  const points: RollingCorrelationPoint[] = [];

  for (let i = windowSize - 1; i < sorted.length; i++) {
    const window = sorted.slice(i - windowSize + 1, i + 1);
    const a = window.map((e) => Number(e[metricA]));
    const b = window.map((e) => Number(e[metricB]));
    const r = pearsonCorrelation(a, b);

    points.push({
      date: sorted[i].entry_date,
      correlation: r,
      windowSize,
    });
  }

  // Determine trend
  let trend: RollingCorrelationResult["trend"] = "stable";
  if (points.length >= 4) {
    const firstHalf = points.slice(0, Math.floor(points.length / 2));
    const secondHalf = points.slice(Math.floor(points.length / 2));
    const avgFirst = firstHalf.reduce((s, p) => s + Math.abs(p.correlation), 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, p) => s + Math.abs(p.correlation), 0) / secondHalf.length;
    if (avgSecond > avgFirst + 0.1) trend = "strengthening";
    else if (avgSecond < avgFirst - 0.1) trend = "weakening";
  }

  return {
    metricA: String(metricA),
    metricB: String(metricB),
    points,
    trend,
  };
}

// ============== Monte Carlo Simulation ==============

export interface MonteCarloResult {
  metricName: string;
  simulations: number;
  percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
  mean: number;
  stdDev: number;
  confidenceBands: { lower: number; upper: number; confidence: number }[];
}

/**
 * Monte Carlo simulation for health metric projections
 * Uses historical variance to simulate future distributions
 */
export function monteCarloSimulation(
  values: number[],
  steps: number = 30,
  simulations: number = 500
): MonteCarloResult {
  if (values.length < 3) {
    return {
      metricName: "",
      simulations: 0,
      percentiles: { p5: 0, p25: 0, p50: 0, p75: 0, p95: 0 },
      mean: 0,
      stdDev: 0,
      confidenceBands: [],
    };
  }

  // Calculate daily changes (returns)
  const changes: number[] = [];
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i - 1]);
  }

  const meanChange = changes.reduce((s, c) => s + c, 0) / changes.length;
  const variance = changes.reduce((s, c) => s + (c - meanChange) ** 2, 0) / changes.length;
  const stdDev = Math.sqrt(variance);

  // Run simulations
  const finalValues: number[] = [];

  for (let sim = 0; sim < simulations; sim++) {
    let current = values[values.length - 1];
    for (let step = 0; step < steps; step++) {
      // Box-Muller transform for normal random
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      current += meanChange + stdDev * z;
    }
    finalValues.push(current);
  }

  finalValues.sort((a, b) => a - b);

  const percentile = (arr: number[], p: number) => arr[Math.floor(arr.length * p / 100)];

  return {
    metricName: "",
    simulations,
    percentiles: {
      p5: Number(percentile(finalValues, 5).toFixed(2)),
      p25: Number(percentile(finalValues, 25).toFixed(2)),
      p50: Number(percentile(finalValues, 50).toFixed(2)),
      p75: Number(percentile(finalValues, 75).toFixed(2)),
      p95: Number(percentile(finalValues, 95).toFixed(2)),
    },
    mean: Number((finalValues.reduce((s, v) => s + v, 0) / finalValues.length).toFixed(2)),
    stdDev: Number(stdDev.toFixed(3)),
    confidenceBands: [
      { lower: percentile(finalValues, 5), upper: percentile(finalValues, 95), confidence: 90 },
      { lower: percentile(finalValues, 10), upper: percentile(finalValues, 90), confidence: 80 },
      { lower: percentile(finalValues, 25), upper: percentile(finalValues, 75), confidence: 50 },
    ],
  };
}

// ============== Anomaly Detection ==============

export interface AnomalyPoint {
  date: string;
  metric: string;
  value: number;
  zScore: number;
  isAnomaly: boolean;
  severity: "mild" | "moderate" | "severe";
  direction: "high" | "low";
}

/**
 * Z-score based anomaly detection (lightweight Isolation Forest proxy)
 */
export function detectAnomalies(
  entries: LifestyleEntry[],
  threshold = 2.0
): AnomalyPoint[] {
  const metrics = [
    "physical_activity_minutes",
    "sleep_hours",
    "diet_quality_score",
    "stress_level",
    "screen_time_hours",
  ] as const;

  const anomalies: AnomalyPoint[] = [];

  for (const metric of metrics) {
    const values = entries.map((e) => Number(e[metric]));
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);

    if (std === 0) continue;

    entries.forEach((entry, idx) => {
      const value = Number(entry[metric]);
      const zScore = (value - mean) / std;
      const absZ = Math.abs(zScore);

      if (absZ >= threshold) {
        anomalies.push({
          date: entry.entry_date,
          metric,
          value,
          zScore: Number(zScore.toFixed(2)),
          isAnomaly: true,
          severity: absZ >= 3 ? "severe" : absZ >= 2.5 ? "moderate" : "mild",
          direction: zScore > 0 ? "high" : "low",
        });
      }
    });
  }

  return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

// ============== Behavioral Drift Detection ==============

export interface DriftResult {
  metric: string;
  currentMean: number;
  baselineMean: number;
  driftMagnitude: number;
  driftDirection: "improving" | "declining" | "stable";
  significanceLevel: "high" | "moderate" | "low";
  weekOverWeekChange: number;
}

/**
 * Detect behavioral drift by comparing recent vs baseline periods
 */
export function detectBehavioralDrift(
  entries: LifestyleEntry[],
  recentDays = 7,
  baselineDays = 21
): DriftResult[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
  );

  if (sorted.length < recentDays + baselineDays) {
    return [];
  }

  const recent = sorted.slice(0, recentDays);
  const baseline = sorted.slice(recentDays, recentDays + baselineDays);

  const metrics = [
    { key: "physical_activity_minutes" as const, higherBetter: true },
    { key: "sleep_hours" as const, higherBetter: true },
    { key: "diet_quality_score" as const, higherBetter: true },
    { key: "stress_level" as const, higherBetter: false },
    { key: "screen_time_hours" as const, higherBetter: false },
  ];

  return metrics.map(({ key, higherBetter }) => {
    const recentMean = recent.reduce((s, e) => s + Number(e[key]), 0) / recent.length;
    const baselineMean = baseline.reduce((s, e) => s + Number(e[key]), 0) / baseline.length;
    const baselineStd = Math.sqrt(
      baseline.reduce((s, e) => s + (Number(e[key]) - baselineMean) ** 2, 0) / baseline.length
    );

    const drift = baselineStd > 0 ? (recentMean - baselineMean) / baselineStd : 0;
    const improving = higherBetter ? drift > 0.3 : drift < -0.3;
    const declining = higherBetter ? drift < -0.3 : drift > 0.3;

    return {
      metric: key,
      currentMean: Number(recentMean.toFixed(2)),
      baselineMean: Number(baselineMean.toFixed(2)),
      driftMagnitude: Number(Math.abs(drift).toFixed(2)),
      driftDirection: improving ? "improving" as const : declining ? "declining" as const : "stable" as const,
      significanceLevel: Math.abs(drift) >= 1 ? "high" as const : Math.abs(drift) >= 0.5 ? "moderate" as const : "low" as const,
      weekOverWeekChange: Number((recentMean - baselineMean).toFixed(2)),
    };
  });
}

// ============== Trend Decomposition ==============

export interface TrendDecomposition {
  metric: string;
  trend: number[]; // moving average
  seasonal: number[]; // deviation from trend
  residual: number[]; // noise
  dates: string[];
  overallDirection: "up" | "down" | "flat";
  strength: number; // 0-1
}

/**
 * Simple additive trend decomposition using moving averages
 */
export function decomposeTrend(
  entries: LifestyleEntry[],
  metric: keyof LifestyleEntry,
  windowSize = 7
): TrendDecomposition {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );

  const values = sorted.map((e) => Number(e[metric]));
  const dates = sorted.map((e) => e.entry_date);

  // Moving average for trend
  const trend: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(values.length, i + Math.ceil(windowSize / 2));
    const window = values.slice(start, end);
    trend.push(Number((window.reduce((s, v) => s + v, 0) / window.length).toFixed(2)));
  }

  // Seasonal = actual - trend
  const seasonal = values.map((v, i) => Number((v - trend[i]).toFixed(2)));

  // Residual (simplified)
  const residual = seasonal.map(() => 0);

  // Overall direction
  const firstThird = trend.slice(0, Math.floor(trend.length / 3));
  const lastThird = trend.slice(-Math.floor(trend.length / 3));
  const avgFirst = firstThird.reduce((s, v) => s + v, 0) / firstThird.length;
  const avgLast = lastThird.reduce((s, v) => s + v, 0) / lastThird.length;
  const diff = avgLast - avgFirst;

  const overallDirection = diff > 0.5 ? "up" as const : diff < -0.5 ? "down" as const : "flat" as const;
  const totalRange = Math.max(...values) - Math.min(...values);
  const strength = totalRange > 0 ? Number(Math.min(Math.abs(diff) / totalRange, 1).toFixed(2)) : 0;

  return { metric: String(metric), trend, seasonal, residual, dates, overallDirection, strength };
}
