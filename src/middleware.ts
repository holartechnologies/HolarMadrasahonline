import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register"];

export default function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const host = req.headers.get("host") ?? "";

  const slug = extractTenantSlug(host);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-slug", slug);

  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  if (publicPaths.includes(nextUrl.pathname) && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (!publicPaths.includes(nextUrl.pathname) && !sessionToken) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function extractTenantSlug(host: string): string {
  const parts = host.split(".");

  if (parts.length >= 3 && parts[0] !== "www") {
    return parts[0];
  }

  return "demo";
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
