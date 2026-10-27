import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";
import { SESSION_COOKIE, STAFF_COOKIE, verifySessionToken, verifyStaffToken } from "@/lib/session-token";

function preferredLocale(request: NextRequest) {
  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((r) => (LOCALES as readonly string[]).includes(r.lang))?.lang ?? DEFAULT_LOCALE;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin area: optimistic session check; pages and actions verify again.
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return;
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!(await verifySessionToken(token))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return;
  }

  // Staff app (cleaners' phones): same optimistic check with its own cookie.
  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    if (pathname === "/staff/login") return;
    if (!(await verifyStaffToken(request.cookies.get(STAFF_COOKIE)?.value))) {
      return NextResponse.redirect(new URL("/staff/login", request.url));
    }
    return;
  }

  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API, metadata files, icons and anything with a file extension.
  matcher: ["/((?!_next|api|icons|manifest.webmanifest|sitemap.xml|robots.txt|.*\\..*).*)"],
};
