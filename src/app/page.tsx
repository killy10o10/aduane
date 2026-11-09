import Link from "next/link";
import { DISH_COUNT } from "@/data/dishes";

const FEATURES = [
  {
    title: "Ghana-first meal plans",
    body: "Jollof, waakye, banku, fufu, red-red and more — ranked first, with other cuisines as backup.",
  },
  {
    title: "Built around your goal",
    body: "Gain, lose, maintain or just eat well. We work out realistic calorie and macro targets for you.",
  },
  {
    title: "Watch, then cook",
    body: "Each dish links to a recipe video that plays right inside the app — no cooking experience needed.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-start gap-6 pt-14 pb-10 sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
          🇬🇭 Aduane · Ghanaian-first
        </span>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Eat toward your goal, the{" "}
          <span className="text-primary">Ghanaian</span> way.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Personalized, goal-based meal timetables built around the food you
          actually eat — with recipe videos you can follow step by step, even if
          you've never cooked.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/onboarding"
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius)] bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none"
          >
            Build my plan
          </Link>
          <Link
            href="/today"
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius)] border border-border bg-surface px-7 text-base font-semibold text-foreground transition-colors hover:bg-surface-2 focus-visible:outline-none"
          >
            See today
          </Link>
        </div>
        <p className="text-sm text-muted">
          {DISH_COUNT} dishes in the kitchen and growing.
        </p>
      </section>

      {/* Features */}
      <section className="grid gap-4 pb-16 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-[var(--radius)] border border-border bg-surface p-5 shadow-sm"
          >
            <h2 className="mb-1.5 text-base font-semibold">{f.title}</h2>
            <p className="text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
