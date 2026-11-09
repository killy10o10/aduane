"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MealCard } from "@/components/MealCard";
import { generatePlan } from "@/lib/plan/generator";
import { requestFromSnapshot, planDayIndex } from "@/lib/plan/build";
import type { DayPlan } from "@/lib/plan/types";
import { loadProfileSnapshot, type ProfileSnapshot } from "@/lib/profile-store";

type Status = "loading" | "ready" | "empty";

export default function TodayPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);
  const [day, setDay] = useState<DayPlan | null>(null);

  useEffect(() => {
    const snap = loadProfileSnapshot();
    if (!snap) {
      setStatus("empty");
      return;
    }
    const plan = generatePlan(requestFromSnapshot(snap));
    const idx = planDayIndex();
    setSnapshot(snap);
    setDay(plan.days[idx] ?? null);
    setStatus("ready");
  }, []);

  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            Aduane
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
          <p className="text-sm text-muted">{todayLabel}</p>
        </div>
        {status === "ready" && (
          <Link
            href="/plan"
            className="inline-flex h-10 items-center rounded-[var(--radius)] border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-2 focus-visible:outline-none"
          >
            Full week
          </Link>
        )}
      </header>

      {status === "loading" && (
        <div className="animate-pulse space-y-3" aria-hidden>
          <div className="h-20 rounded-[var(--radius)] bg-surface-2" />
          <div className="h-32 rounded-[var(--radius)] bg-surface-2" />
          <div className="h-32 rounded-[var(--radius)] bg-surface-2" />
        </div>
      )}

      {status === "empty" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-2xl">
              🍲
            </div>
            <div>
              <h2 className="text-lg font-semibold">No meals planned yet</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Finish a quick setup and your Ghanaian-first meals for the day
                will appear here — each with a recipe video.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius)] bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover focus-visible:outline-none"
            >
              Finish setup
            </Link>
          </CardContent>
        </Card>
      )}

      {status === "ready" && day && snapshot && (
        <TodayMeals day={day} target={snapshot.targets.calories} />
      )}
    </main>
  );
}

function TodayMeals({ day, target }: { day: DayPlan; target: number }) {
  const planned = day.totals.calories;
  const pct = Math.min(100, Math.round((planned / target) * 100));
  return (
    <>
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="mb-1 flex items-center gap-2">
            <Badge tone="primary">Today's target</Badge>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-foreground">Planned</span>
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

      <div className="flex flex-col gap-3">
        {day.meals.map((meal) => (
          <MealCard key={`${meal.slot}-${meal.dish.id}`} meal={meal} />
        ))}
      </div>
    </>
  );
}
