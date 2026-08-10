"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import GroceryList from "@/components/shopping-list/GroceryList";
import ShoppingPlan from "@/components/shopping-list/ShoppingPlan";
import LogoutButton from "@/components/auth/LogoutButton";
import Navbar from "@/components/navigation/navbar";

export default function ShoppingListPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [planRefreshKey, setPlanRefreshKey] =
    useState(0);

  useEffect(() => {
    async function checkAuth() {
      try {
        const user =
          await getCurrentUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        setCheckingAuth(false);
      } catch (error) {
        console.error(
          "Unable to check authentication:",
          error
        );

        router.replace("/login");
      }
    }

    checkAuth();
  }, [router]);

  function refreshShoppingPlan() {
    setPlanRefreshKey(
      (current) => current + 1
    );
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-text-muted">
              Checking your account...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-12">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Smart Shopping
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
              Grocery List
            </h1>

            <p className="mt-2 max-w-2xl text-text-muted">
              Tell us what you need and we'll
              help you figure out where to buy
              it for the best price.
            </p>
          </div>

        </div>

        <GroceryList
          onFindBestPrices={
            refreshShoppingPlan
          }
        />

        <div className="mt-12">
          <ShoppingPlan
            refreshKey={
              planRefreshKey
            }
          />
        </div>

      </div>
    </main>
  );
}
