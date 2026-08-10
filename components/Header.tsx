
export default function Header() {
  return (
    <header className="border-b border-border-subtle">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-xl">
            🛒
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              PriceScout
            </h1>

            <p className="text-xs text-text-muted">
              Shop smarter. Save more.
            </p>
          </div>
        </div>

        <button className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-secondary transition hover:bg-surface-hover">
          Warren, MI
        </button>
      </div>
    </header>
  );
}
