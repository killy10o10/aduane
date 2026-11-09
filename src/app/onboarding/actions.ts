"use server";

import { profileSchema } from "@/lib/validation";
import { computeTargets } from "@/lib/nutrition/macros";
import type { MacroTargets } from "@/lib/nutrition/types";

export interface OnboardingResult {
  ok: boolean;
  targets?: MacroTargets;
  persisted: boolean;
  error?: string;
}

/**
 * Completes onboarding.
 *  1. Validates the raw form input.
 *  2. Computes daily calorie + macro targets (source of truth = server).
 *  3. Persists the profile when the user is authenticated AND a database is
 *     configured; otherwise returns the targets without persisting so the flow
 *     still works in local/dev before Supabase is wired up.
 */
export async function completeOnboarding(
  raw: unknown,
): Promise<OnboardingResult> {
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      persisted: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const input = parsed.data;
  const targets = computeTargets(input);

  // Persist only when a DB and an authenticated user are both available.
  let persisted = false;
  if (process.env.DATABASE_URL) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { prisma } = await import("@/lib/db");
        await prisma.user.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            email: user.email ?? "",
            entitlement: { create: {} },
          },
          update: {},
        });

        await prisma.profile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            age: input.age,
            sex: input.sex,
            heightCm: input.heightCm,
            weightKg: input.weightKg,
            activityLevel: input.activityLevel,
            goal: input.goal,
            budgetTier: input.budgetTier,
            dietaryRestrictions: input.dietaryRestrictions,
            allergies: input.allergies,
            dislikes: input.dislikes,
            calorieTarget: targets.calories,
            proteinG: targets.proteinG,
            carbsG: targets.carbsG,
            fatG: targets.fatG,
          },
          update: {
            age: input.age,
            sex: input.sex,
            heightCm: input.heightCm,
            weightKg: input.weightKg,
            activityLevel: input.activityLevel,
            goal: input.goal,
            budgetTier: input.budgetTier,
            dietaryRestrictions: input.dietaryRestrictions,
            allergies: input.allergies,
            dislikes: input.dislikes,
            calorieTarget: targets.calories,
            proteinG: targets.proteinG,
            carbsG: targets.carbsG,
            fatG: targets.fatG,
          },
        });
        persisted = true;
      }
    } catch (err) {
      // Non-fatal: the user still gets their targets; persistence can be retried.
      console.error("Profile persistence failed:", err);
    }
  }

  return { ok: true, targets, persisted };
}
