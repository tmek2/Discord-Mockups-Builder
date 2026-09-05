import { NextResponse } from "next/server";

/* Canonical-host guard, and the security headers that have to be set on every
 * response rather than per route.
 *
 * The host guard is the same one gatorsys.xyz runs and for the same reason: a
 * raw Vercel deployment host (`…-abc123.vercel.app`) strands the browser away
 * from the domain the session cookie is scoped to, so those are sent back to
 * the canonical host. Real domain hosts are left alone — apex/www
 * canonicalisation is Vercel's domain config, and doing it here as well makes
 * an infinite redirect loop that surfaces as a timeout.
 */

const CANONICAL_HOST = "mockups.gatorsys.xyz";

/* Content-Security-Policy.
 *
 * Tight everywhere it can be. The two loosenings are load-bearing and both are
 * about what a *mockup* contains rather than about this app's own code:
 *
 *   img-src / media-src  a mockup embeds whatever avatar, attachment or emoji
 *                        the author points it at, so images come from anywhere
 *                        over https, plus `data:` for pasted files and `blob:`
 *                        for the PNG export. Scripts are not so permitted, so
 *                        an image URL is only ever an image.
 *   style-src            'unsafe-inline' is required by Next's own style
 *                        injection and by every inline `style` the renderer
 *                        sets to place an embed's accent colour.
 *
 * `script-src` deliberately has no 'unsafe-eval' and no wildcard: nothing in
 * this app evaluates a string, including the JSON editor, which parses.
 * `frame-ancestors 'none'` is the header form of X-Frame-Options and the one
 * browsers actually honour now — a mockup builder has no reason to be framed,
 * and being framed is how a click on somebody's "Delete" gets borrowed.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  // The app talks to itself, and the renderer fetches Twemoji from jsDelivr.
  "connect-src 'self' https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const HEADERS = {
  "content-security-policy": CSP,
  /* Two years, subdomains included. This is a subdomain of gatorsys.xyz, so
     it inherits whatever the apex declares; stating it means a direct hit on
     this host is protected even before the apex's header is seen. */
  "strict-transport-security": "max-age=63072000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  /* The origin, not the path. A share link is a secret in its URL, and a full
     referrer would hand it to every image host a mockup embeds. */
  "referrer-policy": "strict-origin-when-cross-origin",
  /* Nothing here needs any of them. */
  "permissions-policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "cross-origin-opener-policy": "same-origin",
  "x-dns-prefetch-control": "off",
};

export function middleware(request) {
  const host = (request.headers.get("host") || "").toLowerCase();

  if (host.endsWith(".vercel.app")) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(HEADERS)) response.headers.set(key, value);
  return response;
}

export const config = {
  /* Everything except Next's own static output, which is immutable and
     fingerprinted. Auth routes are included on purpose so a sign-in flow is
     pulled back to the canonical host too. */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|avatars/).*)"],
};
