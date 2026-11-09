import Link from "next/link";
import { OnboardingForm } from "./OnboardingForm";

export default function OnboardingPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <header className="mb-6 flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Aduane
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Let's set you up</h1>
        <p className="text-sm text-muted">
          A few quick questions — about a minute — and we'll work out your daily
          calorie and macro targets.
        </p>
      </header>
      <OnboardingForm />
    </main>
  );
}
