import { cn } from "@/lib/cn";
import { CALORIES_PER_GRAM } from "@/lib/nutrition/macros";
import type { MacroTargets } from "@/lib/nutrition/types";

const MACRO_META = {
  protein: { label: "Protein", color: "bg-primary", kcal: CALORIES_PER_GRAM.protein },
  carbs: { label: "Carbs", color: "bg-gold", kcal: CALORIES_PER_GRAM.carbs },
  fat: { label: "Fat", color: "bg-accent", kcal: CALORIES_PER_GRAM.fat },
} as const;

/** A single macro row with a share-of-calories bar. */
function MacroBar({
  kind,
  grams,
  totalCalories,
}: {
  kind: keyof typeof MACRO_META;
  grams: number;
  totalCalories: number;
}) {
  const meta = MACRO_META[kind];
  const pct =
    totalCalories > 0
      ? Math.round(((grams * meta.kcal) / totalCalories) * 100)
      : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-foreground">{meta.label}</span>
        <span className="text-muted">
          <span className="font-semibold text-foreground">{grams}g</span> · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn("h-full rounded-full", meta.color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Calorie headline + protein/carbs/fat breakdown. */
export function MacroSummary({
  targets,
  className,
}: {
  targets: MacroTargets;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold tracking-tight text-foreground">
          {targets.calories.toLocaleString()}
        </span>
        <span className="pb-1 text-sm font-medium text-muted">kcal / day</span>
      </div>
      <div className="flex flex-col gap-3">
        <MacroBar kind="protein" grams={targets.proteinG} totalCalories={targets.calories} />
        <MacroBar kind="carbs" grams={targets.carbsG} totalCalories={targets.calories} />
        <MacroBar kind="fat" grams={targets.fatG} totalCalories={targets.calories} />
      </div>
    </div>
  );
}
