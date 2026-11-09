import { describe, expect, it } from "vitest";
import {
  generatePlan,
  regenerateDay,
  swapMeal,
} from "./generator";
import { seedPlanDishes } from "./adapters";
import type { PlanPreferences, PlanRequest, Slot } from "./types";
import type { MacroTargets } from "@/lib/nutrition/types";

const NO_PREFS: PlanPreferences = {
  allergies: [],
  dislikes: [],
  restrictions: [],
  budgetTier: "MEDIUM",
};

const GAIN_TARGETS: MacroTargets = {
  calories: 2800,
  proteinG: 140,
  carbsG: 380,
  fatG: 70,
};

function gainRequest(overrides: Partial<PlanRequest> = {}): PlanRequest {
  return {
    targets: GAIN_TARGETS,
    goal: "GAIN",
    preferences: NO_PREFS,
    dishes: seedPlanDishes(),
    seed: 42,
    ...overrides,
  };
}

function allMeals(plan: ReturnType<typeof generatePlan>) {
  return plan.days.flatMap((d) => d.meals);
}

describe("generatePlan — structure", () => {
  it("produces exactly 7 days", () => {
    expect(generatePlan(gainRequest()).days).toHaveLength(7);
  });

  it("includes snacks for GAIN (5 meals/day: B, L, D, 2 snacks)", () => {
    const plan = generatePlan(gainRequest());
    for (const day of plan.days) {
      const slots = day.meals.map((m) => m.slot);
      expect(slots.filter((s) => s === "SNACK")).toHaveLength(2);
      expect(slots).toContain("BREAKFAST");
      expect(slots).toContain("LUNCH");
      expect(slots).toContain("DINNER");
    }
  });

  it("omits snacks for non-gain goals (3 meals/day)", () => {
    const plan = generatePlan(gainRequest({ goal: "LOSE", targets: { calories: 1800, proteinG: 150, carbsG: 150, fatG: 60 } }));
    for (const day of plan.days) {
      expect(day.meals).toHaveLength(3);
      expect(day.meals.map((m) => m.slot)).not.toContain("SNACK");
    }
  });

  it("only puts dishes in slots they support", () => {
    const plan = generatePlan(gainRequest());
    for (const meal of allMeals(plan)) {
      expect(meal.dish.slots).toContain(meal.slot);
    }
  });
});

describe("generatePlan — Ghana-first", () => {
  it("plans overwhelmingly Ghanaian/West African dishes", () => {
    const plan = generatePlan(gainRequest());
    expect(plan.ghanaianShare).toBeGreaterThan(0.9);
  });
});

describe("generatePlan — calorie targeting", () => {
  it("lands each day within ~20% of the calorie target", () => {
    const plan = generatePlan(gainRequest());
    for (const day of plan.days) {
      const diff = Math.abs(day.totals.calories - GAIN_TARGETS.calories);
      expect(diff).toBeLessThan(GAIN_TARGETS.calories * 0.2);
    }
  });
});

describe("generatePlan — safety & dietary rules", () => {
  it("never plans an allergen", () => {
    const plan = generatePlan(
      gainRequest({
        preferences: { ...NO_PREFS, allergies: ["groundnut"] },
      }),
    );
    for (const meal of allMeals(plan)) {
      const text = `${meal.dish.name} ${meal.dish.tags.join(" ")} ${meal.dish.searchText ?? ""}`.toLowerCase();
      expect(text).not.toContain("groundnut");
    }
  });

  it("honors a vegetarian restriction", () => {
    const plan = generatePlan(
      gainRequest({
        preferences: { ...NO_PREFS, restrictions: ["Vegetarian"] },
      }),
    );
    for (const meal of allMeals(plan)) {
      const veg =
        meal.dish.tags.includes("vegetarian") ||
        meal.dish.tags.includes("vegan");
      expect(veg).toBe(true);
    }
  });
});

describe("determinism", () => {
  it("same seed -> identical plan", () => {
    const a = generatePlan(gainRequest({ seed: 7 }));
    const b = generatePlan(gainRequest({ seed: 7 }));
    expect(slugGrid(a)).toEqual(slugGrid(b));
  });

  it("different seed -> different plan", () => {
    const a = generatePlan(gainRequest({ seed: 7 }));
    const b = generatePlan(gainRequest({ seed: 999 }));
    expect(slugGrid(a)).not.toEqual(slugGrid(b));
  });
});

describe("regenerateDay", () => {
  it("replaces only the target day", () => {
    const req = gainRequest();
    const plan = generatePlan(req);
    const next = regenerateDay(req, plan, 2);
    // Other days unchanged
    for (let d = 0; d < 7; d++) {
      if (d === 2) continue;
      expect(next.days[d]).toEqual(plan.days[d]);
    }
  });
});

describe("swapMeal", () => {
  it("swaps one meal for a different dish in the same slot", () => {
    const req = gainRequest();
    const plan = generatePlan(req);
    const before = plan.days[0]!.meals.find((m) => m.slot === "LUNCH")!;
    const next = swapMeal(req, plan, 0, "LUNCH" as Slot);
    const after = next.days[0]!.meals.find((m) => m.slot === "LUNCH")!;
    expect(after.slot).toBe("LUNCH");
    expect(after.dish.id).not.toBe(before.dish.id);
    // Only lunch changed on day 0
    const beforeBreakfast = plan.days[0]!.meals.find((m) => m.slot === "BREAKFAST")!;
    const afterBreakfast = next.days[0]!.meals.find((m) => m.slot === "BREAKFAST")!;
    expect(afterBreakfast.dish.id).toBe(beforeBreakfast.dish.id);
  });
});

function slugGrid(plan: ReturnType<typeof generatePlan>): string[][] {
  return plan.days.map((d) => d.meals.map((m) => `${m.slot}:${m.dish.slug}`));
}
