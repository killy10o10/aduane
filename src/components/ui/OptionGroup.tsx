"use client";

import { cn } from "@/lib/cn";

export interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface OptionGroupProps<T extends string> {
  label: string;
  name: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: 1 | 2;
}

/**
 * Accessible single-select card group (radiogroup pattern).
 * Keyboard: Tab to the group, arrow keys move selection.
 */
export function OptionGroup<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  columns = 2,
}: OptionGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-foreground">
        {label}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          "grid gap-2.5",
          columns === 2 ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              name={name}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-[var(--radius)] border p-3.5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:border-primary",
                selected
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface hover:bg-surface-2",
              )}
            >
              <span className="text-sm font-semibold text-foreground">
                {opt.label}
              </span>
              {opt.description && (
                <span className="text-xs text-muted">{opt.description}</span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
