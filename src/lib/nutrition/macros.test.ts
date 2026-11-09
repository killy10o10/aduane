import { describe, expect, it } from "vitest";
import {
  bmr,
  calorieTarget,
  computeTargets,
  macroSplit,
  tdee,
  CALORIES_PER_GRAM,
} from "./macros";
import type { ProfileInput } from "./types";

describe("bmr (Mifflin-St Jeor)", () => {
  it("computes male BMR", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(bmr({ sex: "MALE", weightKg: 80, heightCm: 180, age: 30 })).toBe(
      1780,
    );
  });

  it("computes female BMR", () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(
      bmr({ sex: "FEMALE", weightKg: 60, heightCm: 165, age: 25 }),
    ).toBeCloseTo(1345.25, 2);
  });

  it("is 166 higher for men than women, all else equal", () => {
    const base = { weightKg: 70, heightCm: 175, age: 28 } as const;
    const male = bmr({ sex: "MALE", ...base });
    const female = bmr({ sex: "FEMALE", ...base });
    expect(male - female).toBe(166);
  });
});

describe("tdee", () => {
  it("applies the activity factor", () => {
    expect(tdee(1780, "SEDENTARY")).toBeCloseTo(2136, 5);
    expect(tdee(1780, "MODERATE")).toBeCloseTo(2759, 0);
  });
});

describe("calorieTarget", () => {
  it("adds a surplus for GAIN and rounds to nearest 10", () => {
    expect(calorieTarget(2500, "GAIN")).toBe(2880); // 2875 -> 2880
  });
  it("applies a deficit for LOSE", () => {
    expect(calorieTarget(2500, "LOSE")).toBe(2000);
  });
  it("leaves MAINTAIN and HEALTHY at maintenance", () => {
    expect(calorieTarget(2500, "MAINTAIN")).toBe(2500);
    expect(calorieTarget(2503, "HEALTHY")).toBe(2500); // rounds to 10
  });
});

describe("macroSplit", () => {
  it("sets protein and fat by body weight and fills carbs", () => {
    const m = macroSplit(2880, "GAIN", 80);
    expect(m.proteinG).toBe(144); // 1.8 * 80
    expect(m.fatG).toBe(72); // 0.9 * 80
    // carbs = (2880 - 144*4 - 72*9) / 4 = (2880 - 576 - 648)/4 = 1656/4 = 414
    expect(m.carbsG).toBe(414);
  });

  it("never returns negative carbs when the target is very low", () => {
    const m = macroSplit(500, "LOSE", 90);
    expect(m.carbsG).toBeGreaterThanOrEqual(0);
  });

  it("macro calories roughly reconcile to the target", () => {
    const m = macroSplit(2880, "GAIN", 80);
    const kcal =
      m.proteinG * CALORIES_PER_GRAM.protein +
      m.carbsG * CALORIES_PER_GRAM.carbs +
      m.fatG * CALORIES_PER_GRAM.fat;
    // within rounding tolerance of one gram of carbs (4 kcal)
    expect(Math.abs(kcal - m.calories)).toBeLessThanOrEqual(4);
  });
});

describe("computeTargets (full pipeline)", () => {
  const skinnyGainer: ProfileInput = {
    age: 25,
    sex: "MALE",
    heightCm: 178,
    weightKg: 62,
    activityLevel: "LIGHT",
    goal: "GAIN",
  };

  it("produces a calorie surplus and sensible macros for the v1 use case", () => {
    const t = computeTargets(skinnyGainer);
    // BMR = 10*62 + 6.25*178 - 5*25 + 5 = 620 + 1112.5 - 125 + 5 = 1612.5
    // TDEE = 1612.5 * 1.375 = 2217.19
    // target = 2217.19 * 1.15 = 2549.77 -> round10 = 2550
    expect(t.calories).toBe(2550);
    expect(t.proteinG).toBe(112); // 1.8 * 62 = 111.6 -> 112
    expect(t.fatG).toBe(56); // 0.9 * 62 = 55.8 -> 56
    expect(t.carbsG).toBeGreaterThan(0);
  });

  it("gives a GAIN goal more calories than LOSE for the same person", () => {
    const gain = computeTargets({ ...skinnyGainer, goal: "GAIN" });
    const lose = computeTargets({ ...skinnyGainer, goal: "LOSE" });
    expect(gain.calories).toBeGreaterThan(lose.calories);
  });
});
