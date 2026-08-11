"use client";

import { useState } from "react";
import ShoppingPlan from "@/components/shopping-list/ShoppingPlan";

export default function ShoppingPlanPage() {
  const [refreshKey] = useState(0);

  return <ShoppingPlan refreshKey={refreshKey} />;
}