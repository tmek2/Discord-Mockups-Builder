import { NextResponse } from "next/server";
import { MAX_PACKED, store, storeConfigured } from "@/lib/store";
import { validProject } from "@/lib/validate";
import { newShareId } from "@/lib/ids";
import { forkProject } from "@/lib/fork";
import { LIMITS, callerKey, limit, tooMany } from "@/lib/rate-limit";

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

/* Fourteen days. Long enough that a link pasted into a channel is still good
   when somebody gets round to it; short enough that a mockup does not sit in
   somebody else's scrollback indefinitely, pointing at a version you have
   since changed and can no longer withdraw. */
const DEFAULT_TTL = 14 * 24 * 3600;
const MIN_TTL = 300;
const MAX_TTL = 28 * 24 * 3600;

export async function POST(request) {
  /* Rate limited before anything else is read. Creating a share needs no
     account by design, so this endpoint accepts a whole mockup from anybody
     who can reach it — cheap to call, expensive to serve, which is the shape
     of thing that gets used to fill somebody else's storage. */
  const gate = await limit("share", callerKey(request), LIMITS.share);
  if (!gate.ok) return tooMany(gate.retryAfter);

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

  /* Forked on the way in as well as on the way out.
   *
   * The recipient's copy is detached when they open it, which is what keeps
   * the two documents from ever naming the same thing. Doing it here too means
   * the *stored* share never contains the sender's ids or any field saying
   * where their copy lives — so a share is not merely presented as detached,
   * there is nothing in it to detach from. Defence in depth against a future
   * reader that forgets to fork. */
  const project = forkProject(body.project);

  try {
    // Retry on the vanishingly unlikely collision rather than trusting it not
    // to happen; the store refuses to overwrite, which is what makes the check
    // meaningful rather than decorative.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const id = newShareId();
      const result = await store().putShare(id, project, ttl);
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
