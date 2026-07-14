import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import type { Database } from "@/types/database.types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session (touches getUser to revalidate token)
  const { data: { user } } = await supabase.auth.getUser();
  const isAllowedUser = !!user && isAllowedUserEmail(user.email);

  // Auth gate: routes outside the public set require auth
  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/recuperar-contrasena" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icon");

  if (!isAllowedUser && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (user) url.searchParams.set("error", "not_allowed");
    return NextResponse.redirect(url);
  }

  if (isAllowedUser && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
