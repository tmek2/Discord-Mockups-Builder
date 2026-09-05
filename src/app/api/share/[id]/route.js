import { NextResponse } from "next/server";
import { db, mongoConfigured } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reading a share. No account, no owner check: a share link is the
 *  permission. Expired ones are already gone — Mongo's TTL index drops the
 *  document — so a miss and an expiry are the same answer. */
export async function GET(request, { params }) {
  if (!mongoConfigured()) {
    return NextResponse.json({ error: "Short links are not configured." }, { status: 503 });
  }
  const { id } = await params;
  if (!/^[a-z0-9]{6,16}$/.test(id ?? "")) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  try {
    const row = await (await db()).collection("shares").findOne({ shareId: id });
    if (!row) {
      return NextResponse.json(
        { error: "That link has expired or never existed.", code: "gone" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { project: row.project, expiresAt: row.expiresAt?.getTime?.() ?? null },
      // Short links are immutable once made, so they cache hard. The TTL keeps
      // it honest: nothing can be cached past the point the link dies.
      { headers: { "cache-control": "public, max-age=300, s-maxage=300" } },
    );
  } catch {
    return NextResponse.json({ error: "Could not reach the share store." }, { status: 502 });
  }
}
