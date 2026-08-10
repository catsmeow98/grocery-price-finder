import { createClient } from "@/lib/supabase/client";

/**
 * Get the currently authenticated user.
 *
 * Returns null when nobody is logged in.
 */
export async function getCurrentUser() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (
      error.name ===
      "AuthSessionMissingError"
    ) {
      return null;
    }

    throw error;
  }

  return user;
}

export async function signUp(
  email: string,
  password: string
) {
  const supabase = createClient();

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function signIn(
  email: string,
  password: string
) {
  const supabase = createClient();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();

  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
