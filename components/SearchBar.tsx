"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const popularSearches = [
    "Milk",
    "Eggs",
    "Ground Beef",
    "Chicken",
  ];

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      router.push("/");
      return;
    }

    router.push(`/?search=${encodeURIComponent(trimmedSearch)}`);
  }

  function handlePopularSearch(item: string) {
    router.push(`/?search=${encodeURIComponent(item)}`);
  }

  return (
    <div className="mx-auto mt-9 max-w-2xl">
      <form
        onSubmit={handleSearch}
        className="flex items-center rounded-2xl border border-border bg-surface p-2 shadow-2xl shadow-black/20"
      >
        <span className="px-4 text-xl text-text-muted">
          ⌕
        </span>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="What are you shopping for?"
          className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base text-foreground outline-none placeholder:text-text-muted"
        />

        <button
          type="submit"
          className="rounded-xl bg-primary px-6 py-3 font-medium text-background transition hover:bg-primary-hover"
        >
          Search
        </button>
      </form>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {popularSearches.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handlePopularSearch(item)}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-secondary transition hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}