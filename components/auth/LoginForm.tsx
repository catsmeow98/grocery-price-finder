"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { signIn } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await signIn(
        email.trim(),
        password
      );

      router.push("/shopping-list");
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-muted focus:border-primary"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-muted focus:border-primary"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={
          loading ||
          !email.trim() ||
          !password
        }
        className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Signing in..."
          : "Sign in"}
      </button>
    </form>
  );
}