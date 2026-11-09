// Map dish sources (the static seed, or Prisma rows) into the generator's
// PlanDish projection. Keeping this here lets the generator stay pure and
// unaware of where dishes come from.

import { DISHES, type SeedDish } from "@/data/dishes";
import type { PlanDish } from "./types";

export function seedDishToPlanDish(dish: SeedDish): PlanDish {
  return {
    id: dish.slug,
    slug: dish.slug,
    name: dish.name,
    cuisine: dish.cuisine,
    slots: dish.slots,
    kcal: dish.kcal,
    proteinG: dish.proteinG,
    carbsG: dish.carbsG,
    fatG: dish.fatG,
    tags: dish.tags,
    searchText: (dish.ingredients ?? []).map((i) => i.name).join(" "),
  };
}

/** All seed dishes as generator inputs (used before a DB is wired up). */
export function seedPlanDishes(): PlanDish[] {
  return DISHES.map(seedDishToPlanDish);
}

/** Minimal shape of a Prisma Dish row the generator needs. */
export interface DbDishLike {
  id: string;
  slug: string;
  name: string;
  cuisine: PlanDish["cuisine"];
  slots: PlanDish["slots"];
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tags: string[];
  ingredients?: { ingredient: { name: string } }[];
}

export function dbDishToPlanDish(dish: DbDishLike): PlanDish {
  return {
    id: dish.id,
    slug: dish.slug,
    name: dish.name,
    cuisine: dish.cuisine,
    slots: dish.slots,
    kcal: dish.kcal,
    proteinG: dish.proteinG,
    carbsG: dish.carbsG,
    fatG: dish.fatG,
    tags: dish.tags,
    searchText: (dish.ingredients ?? []).map((i) => i.ingredient.name).join(" "),
  };
}
