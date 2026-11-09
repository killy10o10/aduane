// Meal-plan generator types. Framework-free and Prisma-free so the generator is
// a pure, testable module (see generator.ts). Adapters map DB/seed dishes into
// PlanDish before calling in.

import type { Goal, MacroTargets } from "@/lib/nutrition/types";

export type Cuisine = "GHANAIAN" | "WEST_AFRICAN" | "INTERNATIONAL";
export type Slot = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export const SLOT_ORDER: Slot[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

/** The shape the generator needs from a dish — a thin projection. */
export interface PlanDish {
  id: string;
  slug: string;
  name: string;
  cuisine: Cuisine;
  slots: Slot[];
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tags: string[];
  /** Extra text (e.g. ingredient names) used for allergy/dislike matching. */
  searchText?: string;
}

export interface PlanPreferences {
  /** Hard excludes (safety). */
  allergies: string[];
  /** Soft penalty — avoided where possible, not guaranteed excluded. */
  dislikes: string[];
  /** Hard dietary rules, e.g. "Vegetarian", "No pork". */
  restrictions: string[];
  budgetTier: "LOW" | "MEDIUM" | "HIGH";
}

export interface PlanRequest {
  targets: MacroTargets;
  goal: Goal;
  preferences: PlanPreferences;
  dishes: PlanDish[];
  /** Seed for deterministic output (same seed -> same plan). */
  seed?: number;
}

export interface PlannedMeal {
  slot: Slot;
  dish: PlanDish;
  servings: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DayPlan {
  /** 0 = Monday ... 6 = Sunday. */
  dayOfWeek: number;
  meals: PlannedMeal[];
  totals: MacroTargets;
}

export interface GeneratedPlan {
  days: DayPlan[];
  /** Share of planned meals that are Ghanaian/West African (0..1). */
  ghanaianShare: number;
}
