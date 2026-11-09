import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Today view — Phase 1 shows the scaffold and a clear empty state. The weekly
// plan generator (Phase 2) will fill this with the day's meals, each linking to
// its recipe video.

export default function TodayPage() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Aduane
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
          <p className="text-sm text-muted">{today}</p>
        </div>
      </header>

      {/* Empty state — no plan yet */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-2xl">
            🍲
          </div>
          <div className="flex flex-col gap-1.5">
            <Badge tone="gold" className="self-center">
              Coming in Phase 2
            </Badge>
            <h2 className="text-lg font-semibold">No meals planned yet</h2>
            <p className="mx-auto max-w-sm text-sm text-muted">
              Once you finish setup, your weekly Ghanaian-first timetable will
              appear here — breakfast, lunch, dinner and snacks, each with a
              recipe video.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius)] bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none"
          >
            Finish setup
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
