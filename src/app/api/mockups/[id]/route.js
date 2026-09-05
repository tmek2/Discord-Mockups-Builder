import { NextResponse } from "next/server";
import { authConfigured, currentUser } from "@/auth";
import { store, storeConfigured } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Both handlers key on the owner as well as the id, so a mockup that is not
   yours does not exist rather than being found and then refused. */
async function locate(params) {
  if (!storeConfigured() || !authConfigured) {
    return { error: NextResponse.json({ error: "Cloud backup is not configured." }, { status: 503 }) };
  }
  const user = await currentUser();
  if (!user?.id) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  const { id } = await params;
  if (!id || id.length > 80) return { error: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  return { owner: user.id, slug: id };
}

export async function GET(request, { params }) {
  const { error, owner, slug } = await locate(params);
  if (error) return error;
  try {
    const row = await store().get(owner, slug);
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Could not reach the backup store." }, { status: 502 });
  }
}

export async function DELETE(request, { params }) {
  const { error, owner, slug } = await locate(params);
  if (error) return error;
  try {
    const gone = await store().remove(owner, slug);
    if (!gone) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not reach the backup store." }, { status: 502 });
  }
}
