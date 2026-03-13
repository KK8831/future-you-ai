import { describe, it, expect } from "vitest";
import { pearsonCorrelation, calculateCorrelationMatrix } from "@/lib/correlation";
import { LifestyleEntry } from "@/types/lifestyle";

describe("Pearson Correlation", () => {
  it("returns 1 for perfectly correlated arrays", () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    expect(r).toBeCloseTo(1, 2);
  });

  it("returns -1 for perfectly inverse correlated arrays", () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
    expect(r).toBeCloseTo(-1, 2);
  });

  it("returns 0 for uncorrelated data", () => {
    const r = pearsonCorrelation([1, 2, 3, 4, 5], [5, 1, 4, 2, 3]);
    expect(Math.abs(r)).toBeLessThan(0.5);
  });

  it("returns 0 for arrays with fewer than 3 elements", () => {
    expect(pearsonCorrelation([1, 2], [3, 4])).toBe(0);
    expect(pearsonCorrelation([], [])).toBe(0);
  });

  it("returns 0 for constant arrays", () => {
    expect(pearsonCorrelation([5, 5, 5, 5], [1, 2, 3, 4])).toBe(0);
  });
});

describe("Correlation Matrix", () => {
  const createEntry = (overrides: Partial<LifestyleEntry>, i: number): LifestyleEntry => ({
    id: `${i}`,
    user_id: "u1",
    entry_date: `2024-01-${(i + 1).toString().padStart(2, "0")}`,
    physical_activity_minutes: 30,
    sleep_hours: 7,
    diet_quality_score: 5,
    stress_level: 5,
    screen_time_hours: 6,
    created_at: "",
    updated_at: "",
    ...overrides,
  });

  it("produces 5x5 matrix", () => {
    const entries = Array.from({ length: 10 }, (_, i) => createEntry({}, i));
    const result = calculateCorrelationMatrix(entries);
    expect(result.matrix.length).toBe(5);
    expect(result.matrix[0].length).toBe(5);
  });

  it("diagonal is always 1", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      createEntry({ physical_activity_minutes: 10 + i * 5, sleep_hours: 6 + i * 0.2 }, i)
    );
    const result = calculateCorrelationMatrix(entries);
    for (let i = 0; i < 5; i++) {
      expect(result.matrix[i][i]).toBe(1);
    }
  });

  it("detects positive correlation between activity and sleep", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      createEntry({
        physical_activity_minutes: 20 + i * 10,
        sleep_hours: 6 + i * 0.3,
      }, i)
    );
    const result = calculateCorrelationMatrix(entries);
    const pair = result.pairs.find(
      (p) => p.metricA.includes("activity") && p.metricB.includes("sleep")
    );
    expect(pair).toBeDefined();
    expect(pair!.coefficient).toBeGreaterThan(0.5);
  });

  it("returns 10 unique pairs (upper triangle of 5x5)", () => {
    const entries = Array.from({ length: 10 }, (_, i) => createEntry({}, i));
    const result = calculateCorrelationMatrix(entries);
    expect(result.pairs.length).toBe(10);
  });

  it("includes sample size", () => {
    const entries = Array.from({ length: 15 }, (_, i) => createEntry({}, i));
    const result = calculateCorrelationMatrix(entries);
    expect(result.sampleSize).toBe(15);
  });
});
