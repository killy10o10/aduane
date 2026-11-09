"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MealCard } from "@/components/MealCard";
import {
  generatePlan,
  regenerateDay,
  swapMeal,
} from "@/lib/plan/generator";
import { requestFromSnapshot, planDayIndex, WEEKDAYS } from "@/lib/plan/build";
import type { GeneratedPlan, PlanRequest, Slot } from "@/lib/plan/types";
import { loadProfileSnapshot, type ProfileSnapshot } from "@/lib/profile-store";

type Status = "loading" | "ready" | "empty";

export default function PlanPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [tick, setTick] = useState(0);

  const req: PlanRequest | null = useMemo(
    () => (snapshot ? requestFromSnapshot(snapshot) : null),
    [snapshot],
  );

  useEffect(() => {
    const snap = loadProfileSnapshot();
    if (!snap) {
      setStatus("empty");
      return;
    }
    setSnapshot(snap);
    setPlan(generatePlan(requestFromSnapshot(snap)));
    setActiveDay(planDayIndex());
    setStatus("ready");
  }, []);

  function handleSwap(slot: Slot) {
    if (!req || !plan) return;
    setPlan(swapMeal(req, plan, activeDay, slot, tick + 1));
    setTick((t) => t + 1);
  }

  function handleRegenerateDay() {
    if (!req || !plan) return;
    setPlan(regenerateDay({ ...req, seed: req.seed! + tick + 1 }, plan, activeDay));
    setTick((t) => t + 1);
  }

  function handleRegenerateWeek() {
    if (!req) return;
    setPlan(generatePlan({ ...req, seed: req.seed! + tick + 1 }));
    setTick((t) => t + 1);
  }

  if (status === "loading") {
    return (
      <Shell>
        <div className="animate-pulse space-y-3" aria-hidden>
          <div className="h-24 rounded-[var(--radius)] bg-surface-2" />
          <div className="h-32 rounded-[var(--radius)] bg-surface-2" />
          <div className="h-32 rounded-[var(--radius)] bg-surface-2" />
        </div>
        <span className="sr-only">Loading your plan…</span>
      </Shell>
    );
  }

  if (status === "empty" || !plan || !snapshot) {
    return (
      <Shell>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-2xl">
              📋
            </div>
            <div>
              <h2 className="text-lg font-semibold">No plan yet</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Tell us about yourself and your goal, and we'll build a weekly
                Ghanaian-first timetable that hits your targets.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius)] bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover focus-visible:outline-none"
            >
              Set up my plan
            </Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const day = plan.days[activeDay]!;
  const target = snapshot.targets.calories;
  const planned = day.totals.calories;
  const pct = Math.min(100, Math.round((planned / target) * 100));

  return (
    <Shell>
      {/* Week summary */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="primary">
          {Math.round(plan.ghanaianShare * 100)}% Ghanaian
        </Badge>
        <Badge tone="accent">{snapshot.targets.calories.toLocaleString()} kcal/day target</Badge>
        <button
          type="button"
          onClick={handleRegenerateWeek}
          className="ml-auto text-sm font-semibold text-primary hover:underline focus-visible:outline-none"
        >
          Regenerate week
        </button>
      </div>

      {/* Day selector */}
      <div
        role="tablist"
        aria-label="Day of week"
        className="mb-4 grid grid-cols-7 gap-1.5"
      >
        {WEEKDAYS.map((label, i) => {
          const active = i === activeDay;
          return (
            <button
              key={label}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveDay(i)}
              className={
                "flex h-11 flex-col items-center justify-center rounded-[var(--radius)] text-xs font-semibold transition-colors focus-visible:outline-none " +
                (active
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted hover:bg-surface-2")
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Day totals vs target */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-foreground">Planned today</span>
            <span className="text-muted">
              <span className="font-semibold text-foreground">{planned.toLocaleString()}</span>{" "}
              / {target.toLocaleString()} kcal
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted">
            <span>P {day.totals.proteinG}g</span>
            <span>C {day.totals.carbsG}g</span>
            <span>F {day.totals.fatG}g</span>
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      <div className="flex flex-col gap-3">
        {day.meals.map((meal) => (
          <MealCard
            key={`${meal.slot}-${meal.dish.id}`}
            meal={meal}
            onSwap={() => handleSwap(meal.slot)}
          />
        ))}
      </div>

      <div className="mt-5">
        <Button variant="secondary" className="w-full" onClick={handleRegenerateDay}>
          Regenerate this day
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            Aduane
          </Link>
          <Link href="/today" className="text-sm font-medium text-muted hover:text-foreground">
            Today
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Your week</h1>
        <p className="text-sm text-muted">
          Ghanaian-first meals, built to hit your targets.
        </p>
      </header>
      {children}
    </main>
  );
}
