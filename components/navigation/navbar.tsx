"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import LogoutButton from "@/components/auth/LogoutButton";

const navItems = [
  {
    label: "Grocery List",
    href: "/shopping-list",
  },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo / Brand */}
        <Link
          href="/shopping-list"
          className="flex items-center gap-2"
        >
          <span className="text-xl font-bold tracking-tight text-foreground">
            Smart Shopping
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {navItems.map((item) => {
            const active =
              pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  active
                    ? "text-primary"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}