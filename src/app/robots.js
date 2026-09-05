import { SITE_URL } from "@/lib/site";

/* Crawlers.
 *
 * The builder itself is fine to index. Shared mockups are not: a share link is
 * public-by-link because that is what a share link is for, and public-to-Google
 * is a different thing that nobody asked for. The same distinction gatorsys
 * draws for transcripts and shared documents.
 *
 * This asks; `NO_INDEX` on the route tells the ones that fetch anyway not to
 * keep what they found. Both are needed — a crawler may ignore robots.txt, and
 * a URL that robots.txt merely blocks can still be listed from inbound links.
 */
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/s/", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
