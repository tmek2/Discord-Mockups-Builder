/**
 * Keep a route out of search results.
 *
 * `robots.js` asks crawlers not to fetch these paths; this tells the ones that
 * fetch anyway not to keep what they found. Both are needed. A crawler is free
 * to ignore robots.txt, and a URL that robots.txt merely blocks can still be
 * *listed* in results from inbound links alone — only `noindex` removes it.
 *
 * Every route that renders something somebody else wrote gets this. A shared
 * mockup is public-by-link on purpose; that is not the same as public.
 */
export const NO_INDEX = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
};
