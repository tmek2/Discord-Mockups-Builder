import { NextResponse } from "next/server";
import { MAX_PACKED, store, storeConfigured } from "@/lib/store";
import { validProject } from "@/lib/validate";

/* Share links.
 *
 * A short id that resolves to a mockup, with an expiry — Discohook's model,
 * and the right one here: a link pasted into a channel should stop working
 * eventually rather than sitting in a scrollback pointing at something you
 * have since changed.
 *
 * The fragment link is still the default and still the one that keeps the most
 * private: it carries the mockup after the `#`, which browsers never send
 * anywhere. This exists because a fragment cannot hold a mockup with pasted
 * images in it, and because a short link is the one you can read out.
 *
 * No account needed. A share is not a possession — it is a copy you handed
 * somebody — so requiring sign-in would only stop people sharing.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_TTL = 7 * 24 * 3600;
const MIN_TTL = 300;
const MAX_TTL = 28 * 24 * 3600;

/* Unambiguous by construction: no 0/O, no 1/l/I. A share id is a thing people
   read off a screen and type back in, so the characters that look like each
   other are simply not in the alphabet.
   31 characters is not a power of two, so `% length` over raw bytes would bias
   the first few. Rejection sampling instead — cheap, and the bias would be a
   real (if small) reduction in how many ids there are. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const LIMIT = 256 - (256 % ALPHABET.length);

function shortId(length = 8) {
  let out = "";
  while (out.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length))) {
      if (byte >= LIMIT) continue;
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

export async function POST(request) {
  if (!storeConfigured()) {
    return NextResponse.json(
      { error: "Short links are not configured on this deployment.", code: "no_backend" },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  if (!validProject(body?.project)) {
    return NextResponse.json({ error: "That is not a valid mockup." }, { status: 422 });
  }

  const ttl = Math.min(MAX_TTL, Math.max(MIN_TTL, Number(body.ttl) || DEFAULT_TTL));

  try {
    // Retry on the vanishingly unlikely collision rather than trusting it not
    // to happen; the store refuses to overwrite, which is what makes the check
    // meaningful rather than decorative.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const id = shortId(attempt < 3 ? 8 : 10);
      const result = await store().putShare(id, body.project, ttl);
      if (result.ok) return NextResponse.json({ id, expiresAt: result.expiresAt });
      if (result.error === "too-large") {
        return NextResponse.json(
          {
            error: `This mockup is ${(result.bytes / 1048576).toFixed(1)} MB even compressed, over the ${(
              MAX_PACKED / 1048576
            ).toFixed(0)} MB share limit.`,
          },
          { status: 413 },
        );
      }
      if (result.error !== "taken") break;
    }
    return NextResponse.json({ error: "Could not make a link. Try again." }, { status: 503 });
  } catch {
    return NextResponse.json({ error: "Could not reach the share store." }, { status: 502 });
  }
}
