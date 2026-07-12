import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const host = req.headers.get("host") ?? "";
  const isLoggedIn = !!req.auth;

  const slug = extractTenantSlug(host);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-slug", slug);

  if (nextUrl.pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

function extractTenantSlug(host: string): string {
  const parts = host.split(".");

  if (parts.length >= 3 && parts[0] !== "www") {
    return parts[0];
  }

  return "demo";
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
