"use client";

export type QuantityOption = {
  value: string;
  quantity: number;
  unit: string;
  label: string;
};


type QuantitySelectorProps = {
  quantity: string;
  unit: string;
  options: QuantityOption[];
  loading: boolean;

  onQuantityChange: (value: string) => void;
  onQuantitySelect: (value: string) => void;
  onUnitChange: (value: string) => void;
};

export default function QuantitySelector({
  quantity,
  unit,
  options,
  loading,
  onQuantityChange,
  onQuantitySelect,
  onUnitChange,
}: QuantitySelectorProps) {
  if (loading) {
    return (
      <select
        disabled
        className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-text-muted outline-none"
      >
        <option>Loading quantities...</option>
      </select>
    );
  }

  if (options.length > 0) {
    return (
      <select
        value={quantity}
        onChange={(e) => {
          const selected = options.find(
            (option) =>
              option.value === e.target.value
          );

          if (!selected) {
            onQuantityChange("");
            onUnitChange("");
            return;
          }

          onQuantityChange(
            String(selected.quantity)
          );

          onUnitChange(selected.unit);
        }}
        className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
      >
        <option value="">
          Select a quantity
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <input
        type="number"
        min="1"
        step="1"
        value={quantity}
        onChange={(e) =>
          onQuantitySelect(e.target.value)
        }
        className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
      />

      <select
        value={unit}
        onChange={(e) =>
          onUnitChange(e.target.value)
        }
        className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-primary"
      >
        <option value="count">count</option>
        <option value="oz">oz</option>
        <option value="lb">lb</option>
        <option value="gal">gal</option>
      </select>
    </div>
  );
}
