import { createClient } from "@/lib/supabase/client";
import { getProductsWithPrices } from "@/lib/products";

export type ShoppingListItem = {
  id: string;
  shopping_list_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  completed: boolean;
};


export async function getProductsWithStores() {
  // Products with their current price at each store.
  return getProductsWithPrices(createClient());
}


export type ShoppingList = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  last_opened_at?: string;
  plan_settings?: unknown;
};

async function requireUserId(): Promise<string> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      "You must be logged in to access your grocery list."
    );
  }

  return user.id;
}

/*
 * All of this user's saved lists, most recently opened first.
 * (Falls back to oldest-first if last_opened_at doesn't exist
 * yet, so the app keeps working before the SQL is run.)
 */
async function fetchUserLists(
  userId: string
): Promise<ShoppingList[]> {
  const supabase = createClient();

  let result = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("user_id", userId)
    .order("last_opened_at", { ascending: false })
    .order("created_at", { ascending: true });

  if (result.error) {
    result = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
  }

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as ShoppingList[];
}

async function insertList(
  userId: string,
  name: string
): Promise<ShoppingList> {
  const supabase = createClient();

  let result = await supabase
    .from("shopping_lists")
    .insert({
      name,
      user_id: userId,
      last_opened_at: new Date().toISOString(),
    })
    .select()
    .single();

  // last_opened_at missing (SQL not run yet): create without it.
  if (result.error) {
    result = await supabase
      .from("shopping_lists")
      .insert({ name, user_id: userId })
      .select()
      .single();
  }

  if (result.error) {
    throw result.error;
  }

  return result.data as ShoppingList;
}

/*
 * The list that is currently open: the most recently
 * opened one. Creates a first list if there is none.
 */
export async function getOrCreateShoppingList(): Promise<ShoppingList> {
  const userId = await requireUserId();

  const lists = await fetchUserLists(userId);

  if (lists.length > 0) {
    return lists[0];
  }

  return insertList(userId, "My Grocery List");
}

/* Every saved list with how many items it holds. */
export async function getShoppingLists(): Promise<
  (ShoppingList & { itemCount: number })[]
> {
  const supabase = createClient();

  const userId = await requireUserId();

  const lists = await fetchUserLists(userId);

  if (lists.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("shopping_list_items")
    .select("shopping_list_id")
    .in(
      "shopping_list_id",
      lists.map((list) => list.id)
    );

  if (error) {
    throw error;
  }

  const counts = new Map<string, number>();

  for (const row of (data ?? []) as {
    shopping_list_id: string;
  }[]) {
    counts.set(
      row.shopping_list_id,
      (counts.get(row.shopping_list_id) ?? 0) + 1
    );
  }

  return lists.map((list) => ({
    ...list,
    itemCount: counts.get(list.id) ?? 0,
  }));
}

export async function createShoppingList(
  name: string
): Promise<ShoppingList> {
  return insertList(await requireUserId(), name);
}

/* Open this list (it becomes the one shown next time too). */
export async function setActiveShoppingList(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("shopping_lists")
    .update({
      last_opened_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function renameShoppingList(
  id: string,
  name: string
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("shopping_lists")
    .update({ name })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteShoppingList(id: string) {
  const supabase = createClient();

  // Remove the list's items first, then the list itself.
  const { error: itemsError } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("shopping_list_id", id);

  if (itemsError) {
    throw itemsError;
  }

  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function getShoppingListItems(
  shoppingListId: string
) {
  const supabase = createClient();
  const {
    data,
    error,
  } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("shopping_list_id", shoppingListId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data as ShoppingListItem[];
}

export async function addShoppingListItem({
  shoppingListId,
  productName,
  quantity,
  unit,
}: {
  shoppingListId: string;
  productName: string;
  quantity: number;
  unit: string;
}) {
  const supabase = createClient();
  
  const {
    data,
    error,
  } = await supabase
    .from("shopping_list_items")
    .insert({
      shopping_list_id: shoppingListId,
      product_name: productName,
      quantity,
      unit,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ShoppingListItem;
}

export async function deleteShoppingListItem(
  id: string
) {
  const supabase = createClient();
  
  const {
    error,
  } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function updateShoppingListItem(
  id: string,
  quantity: number,
  unit: string
): Promise<ShoppingListItem> {
  const supabase = createClient();
  
  const { data, error } =
    await supabase
      .from("shopping_list_items")
      .update({
        quantity,
        unit,
      })
      .eq("id", id)
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data as ShoppingListItem;
}

