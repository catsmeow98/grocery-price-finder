"use client";

import type { ProductOption } from "@/types/shopping";

type ProductAutocompleteProps = {
  value: string;
  suggestions: ProductOption[];
  showSuggestions: boolean;
  onChange: (value: string) => void;
  onSelect: (product: ProductOption) => void;
};

export default function ProductAutocomplete({
  value,
  suggestions,
  showSuggestions,
  onChange,
  onSelect,
}: ProductAutocompleteProps) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Start typing, then pick from the list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-muted focus:border-primary"
      />

      {showSuggestions &&
        suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            {suggestions.map((product) => (
              <button
                key={product.name}
                type="button"
                onClick={() => onSelect(product)}
                className="block w-full px-4 py-3 text-left text-sm text-foreground transition hover:bg-background"
              >
                {product.name}
              </button>
            ))}
          </div>
        )}
    </div>
  );
}
