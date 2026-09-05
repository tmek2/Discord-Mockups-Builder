import { NextResponse } from "next/server";
import { authConfigured, currentUser } from "@/auth";
import { MAX_PACKED, PER_USER, store, storeConfigured } from "@/lib/store";
import { validProject } from "@/lib/validate";
import { LIMITS, callerKey, limit, tooMany } from "@/lib/rate-limit";

/* The cloud copy.
 *
 * Local storage is the primary copy and this is the second one — which is why
 * every failure here is reported as a failure to *back up* rather than as a
 * failure to save. The editor keeps the work either way.
 *
 * A mockup belongs to a Discord account and to nothing else. There is no
 * sharing, no server scoping and no public read: the owner comes from the
 * session on every request and is part of every key, so a document cannot be
 * reached by guessing an id.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unavailable() {
  return NextResponse.json(
    { error: "Cloud backup is not configured for this deployment.", code: "no_backend" },
    { status: 503 },
  );
}

async function owner() {
  const user = await currentUser();
  return user?.id ?? null;
}

export async function GET() {
  if (!storeConfigured() || !authConfigured) return unavailable();
  const id = await owner();
  if (!id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  try {
    return NextResponse.json({ mockups: await store().list(id), limit: PER_USER });
  } catch {
    return NextResponse.json({ error: "Could not reach the backup store." }, { status: 502 });
  }
}

export async function POST(request) {
  const gate = await limit("backup", callerKey(request), LIMITS.backup);
  if (!gate.ok) return tooMany(gate.retryAfter);

  if (!storeConfigured() || !authConfigured) return unavailable();
  const id = await owner();
  if (!id) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!validProject(body?.project)) {
    return NextResponse.json({ error: "That is not a valid mockup." }, { status: 422 });
  }
  const slug = typeof body.slug === "string" && body.slug ? body.slug.slice(0, 80) : null;
  if (!slug) return NextResponse.json({ error: "Missing mockup id." }, { status: 400 });

  try {
    const result = await store().put(id, slug, body.project);
    if (result.error === "too-large") {
      return NextResponse.json(
        {
          error: `This mockup is ${(result.bytes / 1048576).toFixed(1)} MB even compressed, over the ${(
            MAX_PACKED / 1048576
          ).toFixed(0)} MB limit. Link images by URL rather than pasting them in, or keep this one as a downloaded file.`,
        },
        { status: 413 },
      );
    }
    if (result.error) return NextResponse.json({ error: "Could not reach the backup store." }, { status: 502 });
    return NextResponse.json({ ok: true, slug, updatedAt: result.updatedAt });
  } catch {
    return NextResponse.json({ error: "Could not reach the backup store." }, { status: 502 });
  }
}
