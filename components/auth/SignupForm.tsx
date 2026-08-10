"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { signUp } from "@/lib/auth";

export default function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const data = await signUp(
        email.trim(),
        password
      );

      /*
       * If Supabase requires email confirmation,
       * there will be a user but no active session.
       */
      if (
        data.user &&
        !data.session
      ) {
        setMessage(
          "Account created! Check your email to confirm your account, then sign in."
        );
        return;
      }

      /*
       * If email confirmation is disabled,
       * Supabase may immediately create a session.
       */
      if (data.session) {
        router.push("/shopping-list");
        router.refresh();
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account."
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
          htmlFor="signup-email"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Email
        </label>

        <input
          id="signup-email"
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
          htmlFor="signup-password"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Password
        </label>

        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-muted focus:border-primary"
          placeholder="••••••••"
        />
      </div>

      <div>
        <label
          htmlFor="signup-confirm-password"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Confirm password
        </label>

        <input
          id="signup-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(
              event.target.value
            )
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

      {message && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3">
          <p className="text-sm text-primary">
            {message}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={
          loading ||
          !email.trim() ||
          !password ||
          !confirmPassword
        }
        className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Creating account..."
          : "Create account"}
      </button>
    </form>
  );
}