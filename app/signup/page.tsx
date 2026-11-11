import Link from "next/link";

import SignupForm from "@/components/auth/SignupForm";
import { safeNextPath, withNext } from "@/lib/redirect";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next
    ? safeNextPath(next)
    : undefined;

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            PriceScout
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-text-muted">
            Save your grocery lists and get
            personalized shopping recommendations.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <SignupForm next={nextPath} />

          <div className="mt-6 border-t border-border pt-6 text-center">
            <p className="text-sm text-text-muted">
              Already have an account?{" "}
              <Link
                href={withNext("/login", nextPath)}
                className="font-medium text-primary hover:opacity-80"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}