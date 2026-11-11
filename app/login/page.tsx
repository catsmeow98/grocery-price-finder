import Link from "next/link";

import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            PriceScout
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-text-muted">
            Sign in to access your grocery
            lists and shopping plans.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm />

          <div className="mt-6 border-t border-border pt-6 text-center">
            <p className="text-sm text-text-muted">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary hover:opacity-80"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
