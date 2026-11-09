// Macro math — pure functions, no side effects, no I/O.
//
// Pipeline:  BMR (Mifflin-St Jeor) -> TDEE (x activity) -> goal-adjusted calories
//            -> macro split (protein & fat by body weight, carbs fill the rest).
//
// Rationale for the split: anchoring protein and fat to body weight (g/kg) is
// more physiologically sound than fixed % splits, especially for the v1 primary
// case (healthy weight gain), where adequate protein must scale with the person,
// not with the calorie surplus.

import type {
  ActivityLevel,
  Goal,
  MacroTargets,
  ProfileInput,
  Sex,
} from "./types";

export const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

// Multiplier applied to TDEE for each goal. Gain = moderate surplus,
// lose = moderate deficit, maintain/healthy = maintenance.
const GOAL_CALORIE_FACTOR: Record<Goal, number> = {
  GAIN: 1.15,
  LOSE: 0.8,
  MAINTAIN: 1.0,
  HEALTHY: 1.0,
};

// Protein target in grams per kg of body weight, by goal.
const PROTEIN_G_PER_KG: Record<Goal, number> = {
  GAIN: 1.8,
  LOSE: 2.0, // higher to preserve lean mass in a deficit
  MAINTAIN: 1.6,
  HEALTHY: 1.6,
};

// Fat target in grams per kg of body weight (floor for hormonal health).
const FAT_G_PER_KG = 0.9;

/**
 * Basal Metabolic Rate via the Mifflin-St Jeor equation.
 *   men:   10*kg + 6.25*cm - 5*age + 5
 *   women: 10*kg + 6.25*cm - 5*age - 161
 */
export function bmr(input: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return input.sex === "MALE" ? base + 5 : base - 161;
}

/** Total Daily Energy Expenditure = BMR x activity factor. */
export function tdee(bmrValue: number, activity: ActivityLevel): number {
  return bmrValue * ACTIVITY_FACTOR[activity];
}

/** Goal-adjusted daily calorie target (rounded to the nearest 10 kcal). */
export function calorieTarget(tdeeValue: number, goal: Goal): number {
  return roundTo(tdeeValue * GOAL_CALORIE_FACTOR[goal], 10);
}

/**
 * Split a calorie target into protein / carbs / fat.
 * Protein and fat are set by body weight; carbs absorb the remainder.
 * Carbs are floored at 0 so a very low target can never produce negative carbs.
 */
export function macroSplit(
  calories: number,
  goal: Goal,
  weightKg: number,
): MacroTargets {
  const proteinG = Math.round(PROTEIN_G_PER_KG[goal] * weightKg);
  const fatG = Math.round(FAT_G_PER_KG * weightKg);

  const proteinKcal = proteinG * CALORIES_PER_GRAM.protein;
  const fatKcal = fatG * CALORIES_PER_GRAM.fat;
  const carbsKcal = Math.max(0, calories - proteinKcal - fatKcal);
  const carbsG = Math.round(carbsKcal / CALORIES_PER_GRAM.carbs);

  return { calories, proteinG, carbsG, fatG };
}

/**
 * Full pipeline: profile inputs -> daily macro targets.
 * This is the single entry point the onboarding flow and services should call.
 */
export function computeTargets(input: ProfileInput): MacroTargets {
  const bmrValue = bmr(input);
  const tdeeValue = tdee(bmrValue, input.activityLevel);
  const calories = calorieTarget(tdeeValue, input.goal);
  return macroSplit(calories, input.goal, input.weightKg);
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}
