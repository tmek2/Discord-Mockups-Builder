import { NextResponse } from "next/server";
import { currentUser } from "@/auth";
import { mockups, mongoConfigured } from "@/lib/mongo";
import { validProject } from "@/lib/validate";
import { db } from "@/lib/mongo";

/* Share links.
 *
 * A short id that resolves to a mockup, with an expiry — Discohook's model,
 * and the right one for this: a link you paste into a channel should stop
 * working eventually rather than sitting in a scrollback forever pointing at
 * something you have since changed.
 *
 * The fragment link is still there and still the default when this is not
 * configured: it carries the whole mockup in the URL and never reaches a
 * server at all. This exists because a fragment cannot hold a mockup with
 * pasted images in it, and because a short link is the one you can read out.
 *
 * No account is needed to make one. A share is not a possession — it is a
 * copy you handed somebody — so tying it to sign-in would only stop people
 * sharing.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;
/** A week by default; four weeks at most, five minutes at least. */
const DEFAULT_TTL = 7 * 24 * 3600;
const MIN_TTL = 300;
const MAX_TTL = 28 * 24 * 3600;

/* Unambiguous by construction: no 0/O, no 1/l/I. A share id is a thing people
   read off a screen and type, so the characters that look like each other are
   simply not in the alphabet. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function shortId(length = 8) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

async function shares() {
  const database = await db();
  const collection = database.collection("shares");
  if (!globalThis.__gatorSharesIndexed) {
    globalThis.__gatorSharesIndexed = true;
    await collection
      .createIndexes([
        { key: { shareId: 1 }, name: "share_id", unique: true },
        // Mongo drops the document itself once `expiresAt` passes, so an
        // expired share needs no sweeping job and cannot be read late.
        { key: { expiresAt: 1 }, name: "ttl", expireAfterSeconds: 0 },
      ])
      .catch(() => {});
  }
  return collection;
}

export async function POST(request) {
  if (!mongoConfigured()) {
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

  const project = body?.project;
  if (!validProject(project)) {
    return NextResponse.json({ error: "That is not a valid mockup." }, { status: 422 });
  }

  const size = Buffer.byteLength(JSON.stringify(project));
  if (size > MAX_BYTES) {
    return NextResponse.json(
      { error: `This mockup is ${(size / 1024 / 1024).toFixed(1)} MB, over the 6 MB share limit.` },
      { status: 413 },
    );
  }

  const ttl = Math.min(MAX_TTL, Math.max(MIN_TTL, Number(body.ttl) || DEFAULT_TTL));
  const user = await currentUser();

  try {
    const collection = await shares();
    // Retry on the vanishingly unlikely collision rather than trusting it not
    // to happen; the unique index is what makes that check meaningful.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const shareId = shortId(attempt < 3 ? 8 : 10);
      try {
        await collection.insertOne({
          shareId,
          project,
          ownerId: user?.id ?? null,
          bytes: size,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + ttl * 1000),
        });
        return NextResponse.json({ id: shareId, expiresAt: Date.now() + ttl * 1000 });
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
    }
    return NextResponse.json({ error: "Could not allocate a link. Try again." }, { status: 503 });
  } catch {
    return NextResponse.json({ error: "Could not reach the share store." }, { status: 502 });
  }
}
