import { supabase } from "@/lib/supabase";
import { getProductsWithPrices } from "@/lib/products";
import type { Product } from "@/types/shopping";

import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import SearchResults from "@/components/SearchResults";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  let products: Product[] = [];
  let error: { message: string } | null = null;

  try {
    products = await getProductsWithPrices(
      supabase,
      search
    );
  } catch (err) {
    error = {
      message:
        typeof err === "object" &&
        err !== null &&
        "message" in err
          ? String((err as { message: unknown }).message)
          : "Unable to load prices.",
    };
  }

  const latestObserved = products
    .map((product) => product.observed_at)
    .filter((date): date is string => Boolean(date))
    .sort()
    .pop();

  const updatedLabel = latestObserved
    ? `Prices as of ${new Date(
        latestObserved
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`
    : "No prices yet";

  if (error) {
    return (
      <main className="min-h-screen bg-background px-6 py-12 text-foreground">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold">
            Something went wrong
          </h1>

          <p className="mt-2 text-text-secondary">
            {error.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="px-6 pb-14 pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent-background px-4 py-2 text-sm text-accent">
            <span>✦</span>
            Compare local grocery prices
          </div>

          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find the best price
            <span className="block text-primary">
              before you shop.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
            Compare grocery prices at stores near you and find the best deal
            without checking every store yourself.
          </p>

          <SearchBar />
        </div>
      </section>

      {/* Results */}
      <section className="border-t border-border-subtle bg-surface-subtle px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex items-end justify-between">
            <SectionHeading
              eyebrow={search ? "Search results" : "Near you"}
              title={
                search
                  ? `Prices for "${search}"`
                  : "Current prices"
              }
            />

            <span className="text-sm text-text-muted">
              {updatedLabel}
            </span>
          </div>

          <SearchResults
            products={products}
            search={search}
          />
        </div>
      </section>
    </main>
  );
}
