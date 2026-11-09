// Meal-plan generator — pure functions, no I/O.
//
// Guarantees, in order of priority:
//   1. Safety:   allergen dishes are never planned.
//   2. Diet:     hard restrictions (vegetarian/vegan/no-pork/...) are honored.
//   3. Ghana-first: African dishes are chosen ahead of international ones; an
//      international dish only appears when no African dish fits the slot.
//   4. Targets:  per-meal servings are scaled to hit the day's calorie split.
//   5. Variety & taste: repeats are penalized; disliked foods are penalized.
//
// Deterministic: a given (request, seed) always yields the same plan, so it is
// unit-testable and a "regenerate" with a new seed produces a different plan.

import type { Goal } from "@/lib/nutrition/types";
import type {
  DayPlan,
  GeneratedPlan,
  PlanDish,
  PlanPreferences,
  PlanRequest,
  PlannedMeal,
  Slot,
} from "./types";

const DAYS_IN_WEEK = 7;

/** Per-slot share of daily calories. Snacks are only planned for GAIN. */
function slotWeights(goal: Goal): { slot: Slot; weight: number }[] {
  if (goal === "GAIN") {
    return [
      { slot: "BREAKFAST", weight: 0.25 },
      { slot: "LUNCH", weight: 0.3 },
      { slot: "DINNER", weight: 0.3 },
      { slot: "SNACK", weight: 0.075 },
      { slot: "SNACK", weight: 0.075 },
    ];
  }
  return [
    { slot: "BREAKFAST", weight: 0.3 },
    { slot: "LUNCH", weight: 0.35 },
    { slot: "DINNER", weight: 0.35 },
  ];
}

// --- deterministic RNG (mulberry32) ---
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- text matching for allergies / dislikes / restrictions ---
function haystack(dish: PlanDish): string {
  return `${dish.name} ${dish.tags.join(" ")} ${dish.searchText ?? ""}`.toLowerCase();
}

function matches(dish: PlanDish, term: string): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return false;
  return haystack(dish).includes(t);
}

function hasTag(dish: PlanDish, tag: string): boolean {
  return dish.tags.some((x) => x.toLowerCase() === tag.toLowerCase());
}

/** Hard dietary restriction predicate. Returns true if the dish is allowed. */
function passesRestriction(dish: PlanDish, restriction: string): boolean {
  switch (restriction.trim().toLowerCase()) {
    case "vegetarian":
      return hasTag(dish, "vegetarian") || hasTag(dish, "vegan");
    case "vegan":
      return hasTag(dish, "vegan");
    case "pescatarian":
      return (
        hasTag(dish, "vegetarian") ||
        hasTag(dish, "vegan") ||
        /\b(fish|tilapia|seafood|shrimp)\b/.test(haystack(dish))
      );
    case "no pork":
      return !/\bpork\b/.test(haystack(dish));
    case "no beef":
      return !/\b(beef|minced meat)\b/.test(haystack(dish));
    default:
      return true;
  }
}

/** Dishes allowed by allergies (hard) and all restrictions (hard). */
function hardFilter(dishes: PlanDish[], prefs: PlanPreferences): PlanDish[] {
  return dishes.filter((dish) => {
    if (prefs.allergies.some((a) => matches(dish, a))) return false;
    if (!prefs.restrictions.every((r) => passesRestriction(dish, r))) return false;
    return true;
  });
}

/** Goal-fit bonus (larger = better fit for the user's goal). */
function goalFit(dish: PlanDish, goal: Goal): number {
  let score = 0;
  switch (goal) {
    case "GAIN":
      if (hasTag(dish, "weight-gain")) score += 40;
      if (hasTag(dish, "high-protein")) score += 15;
      break;
    case "LOSE":
      if (hasTag(dish, "high-protein")) score += 30;
      if (hasTag(dish, "low-carb")) score += 20;
      if (hasTag(dish, "weight-gain")) score -= 40;
      break;
    case "MAINTAIN":
      if (hasTag(dish, "high-protein")) score += 10;
      break;
    case "HEALTHY":
      if (hasTag(dish, "high-fibre")) score += 15;
      if (hasTag(dish, "vegetarian")) score += 8;
      break;
  }
  return score;
}

/** Scale a dish to best hit a slot's calorie target; servings in 0.5 steps. */
function fitServings(dish: PlanDish, slotKcal: number): number {
  if (dish.kcal <= 0) return 1;
  const raw = slotKcal / dish.kcal;
  const stepped = Math.round(raw * 2) / 2; // nearest 0.5
  return Math.min(2, Math.max(0.5, stepped));
}

function toPlannedMeal(dish: PlanDish, slot: Slot, servings: number): PlannedMeal {
  return {
    slot,
    dish,
    servings,
    kcal: Math.round(dish.kcal * servings),
    proteinG: Math.round(dish.proteinG * servings),
    carbsG: Math.round(dish.carbsG * servings),
    fatG: Math.round(dish.fatG * servings),
  };
}

const AFRICAN: PlanDish["cuisine"][] = ["GHANAIAN", "WEST_AFRICAN"];

interface SelectionContext {
  goal: Goal;
  prefs: PlanPreferences;
  usedCount: Map<string, number>; // dishId -> times used so far
  rng: () => number;
}

/**
 * Choose the best dish for one slot.
 * Ghana-first: only falls back to international dishes when no African dish is
 * available for the slot after filtering. `excludeId` supports meal swapping.
 */
function selectForSlot(
  pool: PlanDish[],
  slot: Slot,
  slotKcal: number,
  ctx: SelectionContext,
  excludeId?: string,
): PlannedMeal | null {
  const forSlot = pool.filter(
    (d) => d.slots.includes(slot) && d.id !== excludeId,
  );
  const african = forSlot.filter((d) => AFRICAN.includes(d.cuisine));
  const candidates = african.length > 0 ? african : forSlot;
  if (candidates.length === 0) return null;

  let best: PlanDish | null = null;
  let bestScore = -Infinity;

  for (const dish of candidates) {
    const servings = fitServings(dish, slotKcal);
    const fitPenalty = Math.abs(dish.kcal * servings - slotKcal);
    const repetition = (ctx.usedCount.get(dish.id) ?? 0) * 60;
    const dislikePenalty = ctx.prefs.dislikes.some((d) => matches(dish, d))
      ? 400
      : 0;
    const budgetBonus =
      ctx.prefs.budgetTier === "LOW" && hasTag(dish, "budget") ? 25 : 0;
    const jitter = ctx.rng() * 10;

    const score =
      goalFit(dish, ctx.goal) * 2 +
      budgetBonus -
      fitPenalty / 4 -
      repetition -
      dislikePenalty +
      jitter;

    if (score > bestScore) {
      bestScore = score;
      best = dish;
    }
  }

  if (!best) return null;
  ctx.usedCount.set(best.id, (ctx.usedCount.get(best.id) ?? 0) + 1);
  return toPlannedMeal(best, slot, fitServings(best, slotKcal));
}

function dayTotals(meals: PlannedMeal[]) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.kcal,
      proteinG: acc.proteinG + m.proteinG,
      carbsG: acc.carbsG + m.carbsG,
      fatG: acc.fatG + m.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

function buildDay(
  dayOfWeek: number,
  req: PlanRequest,
  pool: PlanDish[],
  ctx: SelectionContext,
): DayPlan {
  const meals: PlannedMeal[] = [];
  for (const { slot, weight } of slotWeights(req.goal)) {
    const slotKcal = req.targets.calories * weight;
    const meal = selectForSlot(pool, slot, slotKcal, ctx);
    if (meal) meals.push(meal);
  }
  return { dayOfWeek, meals, totals: dayTotals(meals) };
}

function ghanaianShare(days: DayPlan[]): number {
  let total = 0;
  let african = 0;
  for (const day of days) {
    for (const meal of day.meals) {
      total += 1;
      if (AFRICAN.includes(meal.dish.cuisine)) african += 1;
    }
  }
  return total === 0 ? 0 : african / total;
}

/** Generate a full 7-day plan. */
export function generatePlan(req: PlanRequest): GeneratedPlan {
  const pool = hardFilter(req.dishes, req.preferences);
  const ctx: SelectionContext = {
    goal: req.goal,
    prefs: req.preferences,
    usedCount: new Map(),
    rng: makeRng(req.seed ?? 1),
  };

  const days: DayPlan[] = [];
  for (let d = 0; d < DAYS_IN_WEEK; d++) {
    days.push(buildDay(d, req, pool, ctx));
  }
  return { days, ghanaianShare: ghanaianShare(days) };
}

/** Regenerate a single day in place (keeps the rest of the week). */
export function regenerateDay(
  req: PlanRequest,
  plan: GeneratedPlan,
  dayOfWeek: number,
): GeneratedPlan {
  const pool = hardFilter(req.dishes, req.preferences);
  // Seed the usage map from the other days so variety is preserved.
  const usedCount = new Map<string, number>();
  for (const day of plan.days) {
    if (day.dayOfWeek === dayOfWeek) continue;
    for (const meal of day.meals) {
      usedCount.set(meal.dish.id, (usedCount.get(meal.dish.id) ?? 0) + 1);
    }
  }
  const ctx: SelectionContext = {
    goal: req.goal,
    prefs: req.preferences,
    usedCount,
    rng: makeRng((req.seed ?? 1) + dayOfWeek + 101),
  };
  const newDay = buildDay(dayOfWeek, req, pool, ctx);
  const days = plan.days.map((d) => (d.dayOfWeek === dayOfWeek ? newDay : d));
  return { days, ghanaianShare: ghanaianShare(days) };
}

/** Swap a single meal for a different dish in the same slot. */
export function swapMeal(
  req: PlanRequest,
  plan: GeneratedPlan,
  dayOfWeek: number,
  slot: Slot,
  seedOffset = 1,
): GeneratedPlan {
  const pool = hardFilter(req.dishes, req.preferences);
  const day = plan.days.find((d) => d.dayOfWeek === dayOfWeek);
  if (!day) return plan;
  const current = day.meals.find((m) => m.slot === slot);

  const usedCount = new Map<string, number>();
  for (const d of plan.days) {
    for (const m of d.meals) {
      usedCount.set(m.dish.id, (usedCount.get(m.dish.id) ?? 0) + 1);
    }
  }

  const ctx: SelectionContext = {
    goal: req.goal,
    prefs: req.preferences,
    usedCount,
    rng: makeRng((req.seed ?? 1) + dayOfWeek * 7 + seedOffset),
  };

  // Find this slot's calorie weight.
  const weightEntry = slotWeights(req.goal).find((w) => w.slot === slot);
  const slotKcal = req.targets.calories * (weightEntry?.weight ?? 0.3);
  const replacement = selectForSlot(
    pool,
    slot,
    slotKcal,
    ctx,
    current?.dish.id,
  );
  if (!replacement) return plan;

  const newMeals = day.meals.map((m) => (m.slot === slot ? replacement : m));
  const newDay: DayPlan = {
    dayOfWeek,
    meals: newMeals,
    totals: dayTotals(newMeals),
  };
  const days = plan.days.map((d) => (d.dayOfWeek === dayOfWeek ? newDay : d));
  return { days, ghanaianShare: ghanaianShare(days) };
}
