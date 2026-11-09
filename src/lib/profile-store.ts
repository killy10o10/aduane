// Per-viewer profile snapshot, kept in localStorage so the plan works end to end
// before Supabase auth is wired up. This is a convenience cache only — the
// durable source of truth for signed-in users is the database (Profile row).
// Every access is guarded: private windows / blocked storage must not break the app.

import type { MacroTargets } from "@/lib/nutrition/types";
import type { PlanPreferences } from "@/lib/plan/types";

export interface ProfileSnapshot {
  goal: "GAIN" | "LOSE" | "MAINTAIN" | "HEALTHY";
  targets: MacroTargets;
  preferences: PlanPreferences;
  /** Stable seed so the generated week is consistent across pages. */
  seed: number;
}

const KEY = "aduane.profile.v1";

export function saveProfileSnapshot(snapshot: ProfileSnapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // ignore — storage unavailable
  }
}

export function loadProfileSnapshot(): ProfileSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProfileSnapshot;
  } catch {
    return null;
  }
}

export function clearProfileSnapshot(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
