/**
 * Statistical Correlation Analysis Module
 * Implements Pearson Correlation Coefficients for lifestyle metric cross-analysis
 * 
 * This provides real statistical insights rather than simple averages,
 * showing users how their metrics inter-relate over a 30-day window.
 */

import { LifestyleEntry } from "@/types/lifestyle";

export interface CorrelationPair {
  metricA: string;
  metricB: string;
  coefficient: number; // -1 to 1
  strength: "strong" | "moderate" | "weak" | "none";
  direction: "positive" | "negative" | "none";
  interpretation: string;
}

export interface CorrelationMatrix {
  metrics: string[];
  matrix: number[][];
  pairs: CorrelationPair[];
  sampleSize: number;
}

const METRIC_KEYS = [
  "physical_activity_minutes",
  "sleep_hours",
  "diet_quality_score",
  "stress_level",
  "screen_time_hours",
] as const;

const METRIC_LABELS: Record<string, string> = {
  physical_activity_minutes: "Activity",
  sleep_hours: "Sleep",
  diet_quality_score: "Diet",
  stress_level: "Stress",
  screen_time_hours: "Screen Time",
};

/**
 * Calculate Pearson Correlation Coefficient between two arrays
 * r = Σ((xi - x̄)(yi - ȳ)) / √(Σ(xi - x̄)² × Σ(yi - ȳ)²)
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0;

  const n = x.length;
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;

  return Number((numerator / denominator).toFixed(3));
}

/**
 * Interpret a correlation coefficient
 */
function interpretCorrelation(r: number, metricA: string, metricB: string): string {
  const absR = Math.abs(r);
  const dir = r > 0 ? "increases" : "decreases";
  const labelA = METRIC_LABELS[metricA] || metricA;
  const labelB = METRIC_LABELS[metricB] || metricB;

  if (absR < 0.2) return `No significant relationship between ${labelA} and ${labelB}`;
  if (absR < 0.4) return `Weak: As ${labelA} rises, ${labelB} slightly ${dir}`;
  if (absR < 0.6) return `Moderate: ${labelA} and ${labelB} are meaningfully linked`;
  return `Strong: ${labelA} strongly predicts ${labelB} changes`;
}

/**
 * Calculate full correlation matrix from lifestyle entries
 */
export function calculateCorrelationMatrix(entries: LifestyleEntry[]): CorrelationMatrix {
  const n = METRIC_KEYS.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const pairs: CorrelationPair[] = [];

  // Extract metric arrays
  const metricArrays = METRIC_KEYS.map((key) =>
    entries.map((e) => Number(e[key]))
  );

  // Build matrix
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        matrix[i][j] = pearsonCorrelation(metricArrays[i], metricArrays[j]);
      }
    }
  }

  // Extract unique pairs (upper triangle)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const r = matrix[i][j];
      const absR = Math.abs(r);
      pairs.push({
        metricA: METRIC_KEYS[i],
        metricB: METRIC_KEYS[j],
        coefficient: r,
        strength: absR >= 0.6 ? "strong" : absR >= 0.4 ? "moderate" : absR >= 0.2 ? "weak" : "none",
        direction: r > 0.05 ? "positive" : r < -0.05 ? "negative" : "none",
        interpretation: interpretCorrelation(r, METRIC_KEYS[i], METRIC_KEYS[j]),
      });
    }
  }

  // Sort by absolute correlation strength
  pairs.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));

  return {
    metrics: METRIC_KEYS.map((k) => METRIC_LABELS[k]),
    matrix,
    pairs,
    sampleSize: entries.length,
  };
}
