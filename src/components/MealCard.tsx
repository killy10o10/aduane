"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { VideoEmbed, type EmbedVideo } from "@/components/ui/VideoEmbed";
import type { PlannedMeal, Slot } from "@/lib/plan/types";

const SLOT_LABEL: Record<Slot, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

const DISPLAY_TAGS = new Set([
  "high-protein",
  "weight-gain",
  "budget",
  "vegetarian",
  "vegan",
  "low-carb",
  "high-fibre",
]);

export function MealCard({
  meal,
  video,
  onSwap,
}: {
  meal: PlannedMeal;
  /** A recipe video if one exists for this dish (Phase 3 content). */
  video?: EmbedVideo | null;
  onSwap?: () => void;
}) {
  const [videoOpen, setVideoOpen] = useState(false);
  const { dish } = meal;
  const isAfrican = dish.cuisine === "GHANAIAN" || dish.cuisine === "WEST_AFRICAN";
  const tags = dish.tags.filter((t) => DISPLAY_TAGS.has(t)).slice(0, 2);

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {SLOT_LABEL[meal.slot]}
          </span>
          <h3 className="mt-0.5 truncate text-base font-semibold text-foreground">
            {dish.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {isAfrican && <Badge tone="primary">🇬🇭 Ghanaian</Badge>}
            {tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
            {meal.servings !== 1 && (
              <span className="text-xs text-muted">×{meal.servings} servings</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-foreground">{meal.kcal}</div>
          <div className="text-xs text-muted">kcal</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span>P <span className="font-semibold text-foreground">{meal.proteinG}g</span></span>
        <span>C <span className="font-semibold text-foreground">{meal.carbsG}g</span></span>
        <span>F <span className="font-semibold text-foreground">{meal.fatG}g</span></span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setVideoOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-primary-soft px-3 text-sm font-semibold text-primary hover:brightness-95 focus-visible:outline-none"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
          Watch recipe
        </button>
        {onSwap && (
          <button
            type="button"
            onClick={onSwap}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-foreground focus-visible:outline-none"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h11l-3-3M20 17H9l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Swap
          </button>
        )}
      </div>

      <Modal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        title={dish.name}
      >
        {video ? (
          <VideoEmbed video={video} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-xl">
              🎥
            </div>
            <div>
              <p className="font-semibold text-foreground">Recipe video coming soon</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
                We're adding step-by-step videos from Ghanaian food creators. This
                dish will play right here — no leaving the app.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
