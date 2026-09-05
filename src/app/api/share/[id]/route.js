import { NextResponse } from "next/server";
import { store, storeConfigured } from "@/lib/store";
import { isShareId } from "@/lib/ids";
import { LIMITS, callerKey, limit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reading a share. No account and no owner check: the link is the permission.
 *  An expired one and a missing one are the same answer, deliberately — saying
 *  which would tell a stranger that an id was once real. */
export async function GET(request, { params }) {
  /* A share id is 70 bits, which is not brute-forceable over a network — the
     limiter turns "not feasible" into "not worth starting", and keeps a loop
     over guessed ids from costing the store anything. */
  const gate = await limit("read", callerKey(request), LIMITS.read);
  if (!gate.ok) return tooMany(gate.retryAfter);

  if (!storeConfigured()) {
    return NextResponse.json({ error: "Short links are not configured." }, { status: 503 });
  }
  const { id } = await params;
  if (!isShareId(id)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  try {
    const row = await store().getShare(id);
    if (!row) {
      return NextResponse.json(
        { error: "That link has expired or never existed.", code: "gone" },
        { status: 404 },
      );
    }
    return NextResponse.json(row, {
      // A share is immutable once made, so it caches; the TTL keeps that
      // honest, since nothing can be cached past the point the link dies.
      headers: { "cache-control": "public, max-age=300, s-maxage=300" },
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the share store." }, { status: 502 });
  }
}
