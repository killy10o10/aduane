// Shared nutrition domain types. Kept framework-free so the macro math and the
// meal-plan generator can be imported anywhere (server, scripts, tests) without
// pulling in Prisma or React.

export type Sex = "MALE" | "FEMALE";

export type Goal = "GAIN" | "LOSE" | "MAINTAIN" | "HEALTHY";

export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE";

/** Raw profile inputs collected at onboarding. */
export interface ProfileInput {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

/** A daily macronutrient target in grams, plus its calorie total. */
export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
