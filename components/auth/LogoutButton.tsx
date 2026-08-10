"use client";

import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOut();

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Unable to sign out:",
        error
      );
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background"
    >
      Log out
    </button>
  );
}