import { NextResponse } from "next/server";
import { store, storeConfigured } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reading a share. No account and no owner check: the link is the permission.
 *  An expired one and a missing one are the same answer, deliberately — saying
 *  which would tell a stranger that an id was once real. */
export async function GET(request, { params }) {
  if (!storeConfigured()) {
    return NextResponse.json({ error: "Short links are not configured." }, { status: 503 });
  }
  const { id } = await params;
  if (!/^[a-z0-9]{6,16}$/.test(id ?? "")) {
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
