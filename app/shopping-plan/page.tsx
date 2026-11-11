import { redirect } from "next/navigation";

/*
 * The shopping plan now lives on the Grocery List page.
 * This keeps old links and bookmarks working.
 */
export default function ShoppingPlanPage() {
  redirect("/shopping-list");
}
