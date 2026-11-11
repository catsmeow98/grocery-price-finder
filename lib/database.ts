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


export async function getOrCreateShoppingList() {
  const supabase = createClient();
  /*
   * Get the currently authenticated user.
   */
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error(
      "You must be logged in to access your grocery list."
    );
  }

  /*
   * Find this user's existing grocery list.
   */
  const {
    data: existingList,
    error: fetchError,
  } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existingList) {
    return existingList;
  }

  /*
   * Create a grocery list for this user
   * if they don't already have one.
   */
  const {
    data: newList,
    error: createError,
  } = await supabase
    .from("shopping_lists")
    .insert({
      name: "My Grocery List",
      user_id: user.id,
    })
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  return newList;
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

