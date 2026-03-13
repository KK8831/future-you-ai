import { describe, it, expect } from "vitest";
import {
  calculateBMI,
  calculateFraminghamScore,
  calculateFindrisc,
  calculateMedicalRisks,
  HealthProfile,
  LifestyleMetrics,
} from "@/lib/medical-calculators";

describe("Medical Calculators", () => {
  describe("calculateBMI", () => {
    it("calculates BMI correctly for normal values", () => {
      expect(calculateBMI(170, 70)).toBeCloseTo(24.2, 0);
    });

    it("returns default for invalid inputs", () => {
      expect(calculateBMI(0, 70)).toBe(25);
      expect(calculateBMI(170, 0)).toBe(25);
      expect(calculateBMI(-1, 70)).toBe(25);
    });

    it("handles extreme BMI (very high weight)", () => {
      const bmi = calculateBMI(160, 200);
      expect(bmi).toBeGreaterThan(40);
    });

    it("handles extreme BMI (very low weight)", () => {
      const bmi = calculateBMI(180, 40);
      expect(bmi).toBeLessThan(15);
    });
  });

  describe("calculateFraminghamScore", () => {
    const healthyProfile: HealthProfile = { age: 30, sex: "male", heightCm: 175, weightKg: 70 };
    const healthyMetrics: LifestyleMetrics = {
      avgActivityMinutes: 45,
      avgSleepHours: 7.5,
      avgDietScore: 8,
      avgStressLevel: 3,
      avgScreenTimeHours: 4,
    };

    it("returns low risk for healthy young person", () => {
      const result = calculateFraminghamScore(healthyProfile, healthyMetrics);
      expect(result.riskCategory).toBe("low");
      expect(result.riskPercentage).toBeLessThan(10);
      expect(result.breakdown.length).toBeGreaterThan(0);
    });

    it("returns higher risk for sedentary, stressed, older person", () => {
      const unhealthyProfile: HealthProfile = { age: 60, sex: "male", heightCm: 170, weightKg: 110 };
      const unhealthyMetrics: LifestyleMetrics = {
        avgActivityMinutes: 5,
        avgSleepHours: 4,
        avgDietScore: 3,
        avgStressLevel: 9,
        avgScreenTimeHours: 12,
      };
      const result = calculateFraminghamScore(unhealthyProfile, unhealthyMetrics);
      expect(result.riskPercentage).toBeGreaterThan(20);
      expect(["high", "very-high"]).toContain(result.riskCategory);
    });

    it("applies female protective factor", () => {
      const maleResult = calculateFraminghamScore(healthyProfile, healthyMetrics);
      const femaleResult = calculateFraminghamScore({ ...healthyProfile, sex: "female" }, healthyMetrics);
      expect(femaleResult.totalScore).toBeLessThan(maleResult.totalScore);
    });

    it("handles zero activity edge case", () => {
      const result = calculateFraminghamScore(healthyProfile, { ...healthyMetrics, avgActivityMinutes: 0 });
      expect(result.riskPercentage).toBeGreaterThan(0);
      const activityBreakdown = result.breakdown.find((b) => b.factor === "Physical Activity");
      expect(activityBreakdown?.points).toBeGreaterThan(0);
    });

    it("handles extreme sleep (zero hours)", () => {
      const result = calculateFraminghamScore(healthyProfile, { ...healthyMetrics, avgSleepHours: 0 });
      const sleepBreakdown = result.breakdown.find((b) => b.factor === "Sleep Pattern");
      expect(sleepBreakdown?.points).toBe(2);
    });

    it("clamps risk percentage within bounds", () => {
      const extreme: LifestyleMetrics = {
        avgActivityMinutes: 0,
        avgSleepHours: 2,
        avgDietScore: 1,
        avgStressLevel: 10,
        avgScreenTimeHours: 16,
      };
      const result = calculateFraminghamScore(
        { age: 80, sex: "male", heightCm: 160, weightKg: 150 },
        extreme
      );
      expect(result.riskPercentage).toBeLessThanOrEqual(75);
      expect(result.riskPercentage).toBeGreaterThanOrEqual(1);
    });
  });

  describe("calculateFindrisc", () => {
    const profile: HealthProfile = { age: 40, sex: "male", heightCm: 175, weightKg: 80 };
    const metrics: LifestyleMetrics = {
      avgActivityMinutes: 35,
      avgSleepHours: 7.5,
      avgDietScore: 7,
      avgStressLevel: 4,
      avgScreenTimeHours: 5,
    };

    it("returns valid risk category", () => {
      const result = calculateFindrisc(profile, metrics);
      expect(["low", "slightly-elevated", "moderate", "high", "very-high"]).toContain(result.riskCategory);
    });

    it("returns higher score for high BMI + sedentary", () => {
      const highRisk = calculateFindrisc(
        { age: 55, sex: "male", heightCm: 170, weightKg: 120 },
        { avgActivityMinutes: 5, avgSleepHours: 5, avgDietScore: 3, avgStressLevel: 8, avgScreenTimeHours: 10 }
      );
      expect(highRisk.totalScore).toBeGreaterThan(10);
    });

    it("includes interpretation string", () => {
      const result = calculateFindrisc(profile, metrics);
      expect(result.interpretation).toBeTruthy();
      expect(result.interpretation.length).toBeGreaterThan(10);
    });

    it("handles extreme sedentary behavior", () => {
      const result = calculateFindrisc(profile, { ...metrics, avgScreenTimeHours: 16 });
      const sedentary = result.breakdown.find((b) => b.factor === "Sedentary Behavior");
      expect(sedentary?.points).toBe(3);
    });
  });

  describe("calculateMedicalRisks (combined)", () => {
    it("returns combined health score between 0-100", () => {
      const result = calculateMedicalRisks(
        { age: 35, sex: "female", heightCm: 165, weightKg: 60 },
        { avgActivityMinutes: 40, avgSleepHours: 8, avgDietScore: 7, avgStressLevel: 4, avgScreenTimeHours: 5 }
      );
      expect(result.combinedHealthScore).toBeGreaterThanOrEqual(0);
      expect(result.combinedHealthScore).toBeLessThanOrEqual(100);
      expect(result.methodology).toContain("Framingham");
      expect(result.methodology).toContain("FINDRISC");
    });

    it("healthy person has higher combined score than unhealthy", () => {
      const healthy = calculateMedicalRisks(
        { age: 30, sex: "female", heightCm: 165, weightKg: 55 },
        { avgActivityMinutes: 60, avgSleepHours: 8, avgDietScore: 9, avgStressLevel: 2, avgScreenTimeHours: 3 }
      );
      const unhealthy = calculateMedicalRisks(
        { age: 60, sex: "male", heightCm: 175, weightKg: 130 },
        { avgActivityMinutes: 0, avgSleepHours: 4, avgDietScore: 2, avgStressLevel: 9, avgScreenTimeHours: 14 }
      );
      expect(healthy.combinedHealthScore).toBeGreaterThan(unhealthy.combinedHealthScore);
    });
  });
});
