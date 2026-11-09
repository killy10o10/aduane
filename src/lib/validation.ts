import { z } from "zod";

// Onboarding input validation. Shared by the client form and the server action
// so the same rules enforce both the UX and the persisted data.

export const profileSchema = z.object({
  age: z.coerce.number().int().min(13, "Must be at least 13").max(100),
  sex: z.enum(["MALE", "FEMALE"]),
  heightCm: z.coerce.number().min(100, "Enter a valid height").max(250),
  weightKg: z.coerce.number().min(30, "Enter a valid weight").max(300),
  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHT",
    "MODERATE",
    "ACTIVE",
    "VERY_ACTIVE",
  ]),
  goal: z.enum(["GAIN", "LOSE", "MAINTAIN", "HEALTHY"]),
  budgetTier: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dietaryRestrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  dislikes: z.array(z.string()).default([]),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
