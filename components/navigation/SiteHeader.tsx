"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";

export const SITE_NAME = "PriceScout";

const navItems = [
  { label: "Search", href: "/", exact: true },
  { label: "Grocery List", href: "/shopping-list" },
  { label: "Preferences", href: "/preferences" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // undefined = still checking, null = logged out
  const [user, setUser] = useState<
    User | null | undefined
  >(undefined);

  const [menuOpen, setMenuOpen] =
    useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setUser(data.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  function isActive(item: (typeof navItems)[number]) {
    return item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);
  }

  async function handleLogout() {
    setMenuOpen(false);

    try {
      await signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Unable to sign out:", error);
    }
  }

  const linkClass = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      active
        ? "bg-primary/10 text-primary"
        : "text-text-secondary hover:bg-surface-hover hover:text-foreground"
    }`;

  const authControls =
    user === undefined ? null : user ? (
      <>
        <span
          className="hidden max-w-[12rem] truncate text-sm text-text-muted lg:inline"
          title={user.email ?? ""}
        >
          {user.email}
        </span>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-hover"
        >
          Log out
        </button>
      </>
    ) : (
      <>
        <Link
          href="/login"
          onClick={() => setMenuOpen(false)}
          className={linkClass(
            pathname === "/login"
          )}
        >
          Log in
        </Link>

        <Link
          href="/signup"
          onClick={() => setMenuOpen(false)}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background transition hover:bg-primary-hover"
        >
          Sign up
        </Link>
      </>
    );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        {/* Brand */}
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-lg">
            🛒
          </span>

          <span className="text-lg font-semibold tracking-tight text-foreground">
            {SITE_NAME}
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          aria-label="Main"
          className="hidden items-center gap-1 md:flex"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                isActive(item) ? "page" : undefined
              }
              className={linkClass(isActive(item))}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop account controls */}
        <div className="hidden items-center gap-3 md:flex">
          {authControls}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() =>
            setMenuOpen((open) => !open)
          }
          aria-label="Menu"
          aria-expanded={menuOpen}
          className="rounded-lg border border-border px-3 py-2 text-sm text-foreground md:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="border-t border-border px-6 pb-4 pt-2 md:hidden">
          <nav
            aria-label="Mobile"
            className="flex flex-col gap-1"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() =>
                  setMenuOpen(false)
                }
                aria-current={
                  isActive(item)
                    ? "page"
                    : undefined
                }
                className={linkClass(
                  isActive(item)
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
            {authControls}
          </div>
        </div>
      )}
    </header>
  );
}
