import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
  suffix?: string;
}

/** Labeled text/number input with hint and error states, wired for a11y. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, error, suffix, className, id, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id ?? autoId;
    const describedBy = error
      ? `${fieldId}-error`
      : hint
        ? `${fieldId}-hint`
        : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "h-11 w-full rounded-[var(--radius)] border border-border bg-surface px-3.5 text-foreground",
              "placeholder:text-muted/70 transition-colors",
              "focus-visible:outline-none focus-visible:border-primary",
              suffix && "pr-12",
              error && "border-danger",
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">
              {suffix}
            </span>
          )}
        </div>
        {error ? (
          <p id={`${fieldId}-error`} className="text-sm text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${fieldId}-hint`} className="text-sm text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Field.displayName = "Field";
