"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Badge } from "@/components/ui/Badge";
import { MacroSummary } from "@/components/ui/Macros";
import { computeTargets } from "@/lib/nutrition/macros";
import type {
  ActivityLevel,
  Goal,
  MacroTargets,
  Sex,
} from "@/lib/nutrition/types";
import { completeOnboarding } from "./actions";

const RESTRICTION_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "No pork",
  "No beef",
  "Pescatarian",
];

const STEPS = ["About you", "Activity & goal", "Preferences"] as const;

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<MacroTargets | null>(null);
  const [persisted, setPersisted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Form state
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [budgetTier, setBudgetTier] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [dislikes, setDislikes] = useState("");

  const basicsComplete =
    age !== "" && sex !== null && heightCm !== "" && weightKg !== "";
  const goalComplete = activityLevel !== null && goal !== null;

  // Live preview once we have enough to compute.
  const preview = useMemo<MacroTargets | null>(() => {
    if (!basicsComplete || !goalComplete) return null;
    return computeTargets({
      age: Number(age),
      sex: sex!,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activityLevel: activityLevel!,
      goal: goal!,
    });
  }, [age, sex, heightCm, weightKg, activityLevel, goal, basicsComplete, goalComplete]);

  function toggleRestriction(label: string) {
    setRestrictions((prev) =>
      prev.includes(label)
        ? prev.filter((r) => r !== label)
        : [...prev, label],
    );
  }

  function submit() {
    setError(null);
    const payload = {
      age,
      sex,
      heightCm,
      weightKg,
      activityLevel,
      goal,
      budgetTier,
      dietaryRestrictions: restrictions,
      allergies: splitList(allergies),
      dislikes: splitList(dislikes),
    };
    startTransition(async () => {
      const result = await completeOnboarding(payload);
      if (result.ok && result.targets) {
        setDone(result.targets);
        setPersisted(result.persisted);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (done) {
    return <Results targets={done} persisted={persisted} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="flex items-center gap-2" aria-hidden>
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <div
              className={
                "h-1.5 rounded-full transition-colors " +
                (i <= step ? "bg-primary" : "bg-surface-2")
              }
            />
            <span
              className={
                "text-xs font-medium " +
                (i === step ? "text-foreground" : "text-muted")
              }
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5">
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Age"
                  type="number"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  suffix="yrs"
                  min={13}
                  max={100}
                />
                <Field
                  label="Weight"
                  type="number"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  suffix="kg"
                />
                <Field
                  label="Height"
                  type="number"
                  inputMode="decimal"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  suffix="cm"
                />
              </div>
              <OptionGroup<Sex>
                label="Sex"
                name="sex"
                value={sex}
                onChange={setSex}
                options={[
                  { value: "MALE", label: "Male" },
                  { value: "FEMALE", label: "Female" },
                ]}
              />
            </>
          )}

          {step === 1 && (
            <>
              <OptionGroup<ActivityLevel>
                label="How active are you?"
                name="activity"
                columns={1}
                value={activityLevel}
                onChange={setActivityLevel}
                options={[
                  { value: "SEDENTARY", label: "Sedentary", description: "Little or no exercise" },
                  { value: "LIGHT", label: "Lightly active", description: "1–3 days / week" },
                  { value: "MODERATE", label: "Moderately active", description: "3–5 days / week" },
                  { value: "ACTIVE", label: "Active", description: "6–7 days / week" },
                  { value: "VERY_ACTIVE", label: "Very active", description: "Hard training or physical job" },
                ]}
              />
              <OptionGroup<Goal>
                label="What's your goal?"
                name="goal"
                value={goal}
                onChange={setGoal}
                options={[
                  { value: "GAIN", label: "Gain weight", description: "Build up healthily" },
                  { value: "LOSE", label: "Lose weight", description: "Lean down" },
                  { value: "MAINTAIN", label: "Maintain", description: "Stay where I am" },
                  { value: "HEALTHY", label: "Eat healthy", description: "No weight target" },
                ]}
              />
            </>
          )}

          {step === 2 && (
            <>
              <OptionGroup<"LOW" | "MEDIUM" | "HIGH">
                label="Budget"
                name="budget"
                columns={1}
                value={budgetTier}
                onChange={setBudgetTier}
                options={[
                  { value: "LOW", label: "Budget-friendly", description: "Keep it affordable" },
                  { value: "MEDIUM", label: "Balanced", description: "A mix" },
                  { value: "HIGH", label: "Flexible", description: "Cost isn't a concern" },
                ]}
              />
              <div>
                <span className="mb-2 block text-sm font-medium text-foreground">
                  Dietary preferences
                </span>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTION_OPTIONS.map((label) => {
                    const on = restrictions.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleRestriction(label)}
                        className={
                          "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none " +
                          (on
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-border bg-surface text-muted hover:bg-surface-2")
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field
                label="Allergies"
                placeholder="e.g. peanuts, shellfish"
                hint="Comma-separated. We'll never plan these."
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
              <Field
                label="Dislikes"
                placeholder="e.g. okro, liver"
                hint="Foods to avoid where possible."
                value={dislikes}
                onChange={(e) => setDislikes(e.target.value)}
              />
            </>
          )}

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Live preview */}
      {preview && (
        <Card className="bg-surface-2/50">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge tone="primary">Live estimate</Badge>
              <span className="text-xs text-muted">Updates as you go</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-foreground">
                {preview.calories.toLocaleString()}
              </span>
              <span className="pb-0.5 text-sm text-muted">kcal/day</span>
              <span className="ml-auto text-sm text-muted">
                P {preview.proteinG} · C {preview.carbsG} · F {preview.fatG}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={(step === 0 && !basicsComplete) || (step === 1 && !goalComplete)}
          >
            Continue
          </Button>
        ) : (
          <Button onClick={submit} disabled={pending || !preview}>
            {pending ? "Building…" : "See my targets"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Results({
  targets,
  persisted,
}: {
  targets: MacroTargets;
  persisted: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Badge tone="accent" className="self-start">
          You're all set
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight">Your daily targets</h2>
        <p className="text-sm text-muted">
          Based on the Mifflin-St Jeor equation, your activity, and your goal.
        </p>
      </div>
      <Card>
        <CardContent>
          <MacroSummary targets={targets} />
        </CardContent>
      </Card>
      {!persisted && (
        <p className="text-xs text-muted">
          Not signed in — these targets aren't saved yet. Connect Supabase auth
          to keep them across visits.
        </p>
      )}
      <Link
        href="/today"
        className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius)] bg-primary px-6 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none"
      >
        Go to my plan
      </Link>
    </div>
  );
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
