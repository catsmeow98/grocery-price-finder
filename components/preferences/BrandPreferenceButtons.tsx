"use client";

import type { Preference } from "@/types/shopping";

type Props = {
  brand: string;
  preference?: Preference;
  onChange: (preference: Preference | null) => void;
};

export default function BrandPreferenceButtons({
  brand,
  preference,
  onChange,
}: Props) {
  return (
    <div className="mt-1 flex items-center gap-1">
      <button
        type="button"
        aria-pressed={preference === "preferred"}
        aria-label={`Prefer ${brand}`}
        title={
          preference === "preferred"
            ? "Preferred brand (click to remove)"
            : "Prefer this brand"
        }
        onClick={() =>
          onChange(
            preference === "preferred"
              ? null
              : "preferred"
          )
        }
        className={`rounded-md px-1.5 py-0.5 text-xs transition ${
          preference === "preferred"
            ? "bg-accent-background text-accent"
            : "text-text-muted hover:text-accent"
        }`}
      >
        {preference === "preferred" ? "♥ Preferred" : "♡ Prefer"}
      </button>

      <button
        type="button"
        aria-pressed={preference === "blocked"}
        aria-label={`Block ${brand}`}
        title={
          preference === "blocked"
            ? "Blocked brand (click to remove)"
            : "Never recommend this brand"
        }
        onClick={() =>
          onChange(
            preference === "blocked" ? null : "blocked"
          )
        }
        className={`rounded-md px-1.5 py-0.5 text-xs transition ${
          preference === "blocked"
            ? "bg-red-500/10 text-red-400"
            : "text-text-muted hover:text-red-400"
        }`}
      >
        {preference === "blocked" ? "⊘ Blocked" : "⊘ Block"}
      </button>
    </div>
  );
}
