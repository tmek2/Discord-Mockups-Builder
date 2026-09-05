import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { mockups, mongoConfigured } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Both handlers filter on the owner as well as the id. Checking ownership
   after the read would be a second round trip and a window in which a wrong id
   returns somebody else's work; filtering on both means a document that is not
   yours simply does not exist. */
async function locate(params) {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };

  const { id } = await params;
  let filter;
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) filter = { _id: new ObjectId(id), ownerId };
  else filter = { slug: id, ownerId };
  return { filter };
}

export async function GET(request, { params }) {
  if (!mongoConfigured()) {
    return NextResponse.json({ error: "Cloud backup is not configured." }, { status: 503 });
  }
  const { error, filter } = await locate(params);
  if (error) return error;

  try {
    const row = await (await mockups()).findOne(filter);
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({
      id: String(row._id),
      slug: row.slug,
      name: row.name,
      updatedAt: row.updatedAt,
      project: row.project,
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the backup store." }, { status: 502 });
  }
}

export async function DELETE(request, { params }) {
  if (!mongoConfigured()) {
    return NextResponse.json({ error: "Cloud backup is not configured." }, { status: 503 });
  }
  const { error, filter } = await locate(params);
  if (error) return error;

  try {
    const result = await (await mockups()).deleteOne(filter);
    if (!result.deletedCount) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not reach the backup store." }, { status: 502 });
  }
}
