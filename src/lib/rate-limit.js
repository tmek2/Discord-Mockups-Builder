/* Rate limiting.
 *
 * Two endpoints here accept a whole mockup from anybody who can reach them:
 * creating a share link, which needs no account by design, and writing a cloud
 * backup, which needs one but not a large one. Neither is expensive to call
 * and both are expensive to serve, which is the shape of thing that gets used
 * to fill somebody else's storage.
 *
 * A fixed window in Redis, because the store is already there and `INCR` with
 * an expiry is atomic — two requests landing together cannot both read 0.
 *
 * **It degrades open, deliberately.** If Redis is unreachable the limiter
 * cannot say whether a caller is over, and refusing everything would turn a
 * cache outage into an outage of the whole app. The store behind these
 * endpoints is the same Redis, so a limiter that cannot reach it is guarding a
 * route that is already returning "no cloud" anyway.
 */

import { createHash } from "node:crypto";
import { read, redisConfigured, write } from "./redis";

/* The caller's address, from the header the platform sets.
 *
 * `x-forwarded-for` is a list appended to by each hop, so the *first* entry is
 * the client as the closest trusted proxy saw it. Taking the last would let a
 * caller pick their own bucket by sending the header themselves. On Vercel
 * `x-real-ip` is set by the edge and is the one to prefer.
 *
 * The address is hashed before it becomes a key. A counter only needs to tell
 * two callers apart, which a hash does; the address itself is never written
 * down, and this Redis is shared with the rest of Gator. Truncated to 128 bits
 * because that is far past any collision worth worrying about at this scale
 * and it keeps the key short.
 *
 * `RATE_LIMIT_SALT` makes the hash unguessable rather than a lookup table over
 * the whole IPv4 space. It falls back to the auth secret, which every
 * deployment that can sign anybody in already has, so there is no new required
 * variable — and a deployment with neither still gets working rate limiting,
 * just a hash somebody could brute-force back if they had the key store, which
 * is a strictly better position than storing the address in the clear. */
function bucketise(address) {
  const salt = process.env.RATE_LIMIT_SALT || process.env.AUTH_SECRET || "gm";
  return createHash("sha256").update(`${salt}:${address}`).digest("hex").slice(0, 32);
}

export function callerKey(request) {
  const real = request.headers.get("x-real-ip");
  if (real) return bucketise(real.trim());
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return bucketise(forwarded.split(",")[0].trim());
  return "unknown";
}

/**
 * @returns `{ ok }` when the call may proceed, or `{ ok: false, retryAfter }`.
 */
export async function limit(bucket, key, { max, windowSeconds }) {
  if (!redisConfigured()) return { ok: true };

  const slot = Math.floor(Date.now() / (windowSeconds * 1000));
  const redisKey = `gm:rl:${bucket}:${key}:${slot}`;

  const count = await write(async (c) => {
    const next = await c.incr(redisKey);
    // Only the first caller in a window needs to set the expiry, and setting
    // it every time would slide the window forward under sustained traffic.
    if (next === 1) await c.expire(redisKey, windowSeconds);
    return next;
  }, null);

  // Unreachable: allow. See the note above.
  if (count === null) return { ok: true };
  if (count > max) {
    const retryAfter = windowSeconds - Math.floor((Date.now() % (windowSeconds * 1000)) / 1000);
    return { ok: false, retryAfter: Math.max(1, retryAfter) };
  }
  return { ok: true };
}

/** The buckets, named in one place so two routes cannot disagree about them. */
export const LIMITS = {
  /* Generous enough that nobody sharing normally will meet it, tight enough
     that a script cannot fill the store. */
  share: { max: 20, windowSeconds: 600 },
  /* A backup is a deliberate press, and the editor also writes on demand. */
  backup: { max: 60, windowSeconds: 600 },
  /* Reads are cheap but not free, and a share id is a secret worth making
     slow to guess — 70 bits is not brute-forceable anyway, but a limiter turns
     "not feasible" into "not worth starting". */
  read: { max: 240, windowSeconds: 600 },
};

/** The standard refusal, with the header a well-behaved client honours. */
export function tooMany(retryAfter) {
  return Response.json(
    { error: "That is a lot of requests. Give it a minute.", code: "rate_limited" },
    { status: 429, headers: { "retry-after": String(retryAfter) } },
  );
}
