import {
  createServerClient,
} from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function updateSession(
  request: NextRequest
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });

  const supabase =
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value
                );
              }
            );

            supabaseResponse =
              NextResponse.next({
                request,
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                supabaseResponse.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );
          },
        },
      }
    );

  const {
    data: claimsData,
  } =
    await supabase.auth.getClaims();

  const pathname =
    request.nextUrl.pathname;

  const isLoggedIn =
    !!claimsData?.claims;

  console.log(
    "[AUTH]",
    pathname,
    "logged in:",
    isLoggedIn
  );

  if (
    !isLoggedIn &&
    pathname.startsWith(
      "/shopping-list"
    )
  ) {
    const url =
      request.nextUrl.clone();

    url.pathname = "/login";

    return NextResponse.redirect(
      url
    );
  }

  return supabaseResponse;
}
