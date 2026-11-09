import type { ProfileSnapshot } from "@/lib/profile-store";
import { seedPlanDishes } from "./adapters";
import type { PlanRequest } from "./types";

/** Build a generator request from a stored profile snapshot (seed dish pool). */
export function requestFromSnapshot(snapshot: ProfileSnapshot): PlanRequest {
  return {
    targets: snapshot.targets,
    goal: snapshot.goal,
    preferences: snapshot.preferences,
    dishes: seedPlanDishes(),
    seed: snapshot.seed,
  };
}

/** Map a JS Date (Sun=0..Sat=6) to the plan's day index (Mon=0..Sun=6). */
export function planDayIndex(date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

export const WEEKDAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export const WEEKDAYS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
