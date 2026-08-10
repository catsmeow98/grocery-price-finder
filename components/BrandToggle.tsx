"use client";

type BrandToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export default function BrandToggle({
  enabled,
  onChange,
}: BrandToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-3 text-sm"
    >
      <span className="text-text-secondary">
        Compare brands
      </span>

      <span
        className={`relative h-6 w-11 rounded-full transition ${
          enabled
            ? "bg-primary"
            : "bg-surface-hover"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}
