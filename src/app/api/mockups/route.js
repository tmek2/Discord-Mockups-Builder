import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { mockups, mongoConfigured } from "@/lib/mongo";
import { validProject } from "@/lib/validate";

/* The cloud backup.
 *
 * Local storage is the primary copy and this is the second one — which is why
 * every failure here is reported as a failure to *back up* rather than as a
 * failure to save. The editor keeps the work either way.
 *
 * A mockup belongs to a Discord account and to nothing else. There is no
 * sharing, no server scoping and no public read: the owner id comes from the
 * session on every request and is the only thing any query filters on, so a
 * document cannot be reached by guessing its id.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* A project with images inlined can be large, and Mongo's document ceiling is
   16 MB. Refusing at 6 leaves room for the wrapper and gives a message worth
   reading instead of a driver error. */
const MAX_BYTES = 6 * 1024 * 1024;

const LIST_FIELDS = { projection: { project: 0 } };

async function requireUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return { id, name: session.user.name ?? null };
}

function unavailable() {
  return NextResponse.json(
    { error: "Cloud backup is not configured for this deployment.", code: "no_backend" },
    { status: 503 },
  );
}

export async function GET() {
  if (!mongoConfigured()) return unavailable();
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  try {
    const collection = await mockups();
    const rows = await collection
      .find({ ownerId: user.id }, LIST_FIELDS)
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();
    return NextResponse.json({
      mockups: rows.map((row) => ({
        id: String(row._id),
        slug: row.slug,
        name: row.name,
        updatedAt: row.updatedAt,
        messages: row.messages ?? 0,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the backup store." }, { status: 502 });
  }
}

export async function POST(request) {
  if (!mongoConfigured()) return unavailable();
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const project = body?.project;
  if (!validProject(project)) {
    return NextResponse.json({ error: "That is not a valid mockup." }, { status: 422 });
  }

  const size = Buffer.byteLength(JSON.stringify(project));
  if (size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `This mockup is ${(size / 1024 / 1024).toFixed(1)} MB, over the 6 MB backup limit. Link images by URL rather than pasting them in, or keep this one as a downloaded file.`,
      },
      { status: 413 },
    );
  }

  /* The slug is the editor's own id for the project, so saving twice updates
     one document rather than filling the list with copies. It is scoped to the
     owner by the unique index, so two people can hold the same slug. */
  const slug = typeof body.slug === "string" && body.slug ? body.slug.slice(0, 80) : null;
  if (!slug) return NextResponse.json({ error: "Missing mockup id." }, { status: 400 });

  try {
    const collection = await mockups();
    const now = Date.now();
    await collection.updateOne(
      { ownerId: user.id, slug },
      {
        $set: {
          ownerId: user.id,
          slug,
          name: String(project.name ?? "Untitled mockup").slice(0, 120),
          project,
          messages: project.messages?.length ?? 0,
          bytes: size,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    return NextResponse.json({ ok: true, slug, updatedAt: now });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "That mockup is already being saved." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not reach the backup store." }, { status: 502 });
  }
}
