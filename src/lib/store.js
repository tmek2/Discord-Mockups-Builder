/* Where a cloud copy lives.
 *
 * The constraint that shapes this file: the cluster is at its collection
 * ceiling. Atlas counts collections *and indexes* together toward one
 * recommended maximum, so "just add a small collection" costs a collection
 * plus every index it needs — and the bot and the site have already spent the
 * budget. This app cannot ask for any of it.
 *
 * So the default store is Redis, which gatorsys already runs for the site's
 * own caching. It costs nothing in Mongo, its keys are namespaced under `gm:`
 * so nothing here can collide with anything there, and shares get a real TTL
 * rather than a sweeper. Redis is the right shape for this anyway: the values
 * are opaque blobs fetched by exact key, which is the one thing a key-value
 * store is unambiguously better at than a document database.
 *
 * The Mongo driver is here for later, and it also takes no new collection: it
 * writes into one *existing* collection named by `MONGODB_COLLECTION`, with
 * every document marked and every query filtered by `_gm`, so it cannot see or
 * be seen by whatever else lives there.
 *
 * Neither store is the primary copy. The browser holds the working copy and
 * the backups; this is the second one, and every path through here degrades to
 * "no cloud" rather than throwing.
 */

import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib";
import { read, redisConfigured, write } from "./redis";

/* ------------------------------------------------------------ payloads */

/* Brotli, not gzip, and not raw JSON.
 *
 * A mockup is JSON full of repeated keys with base64 images embedded in it,
 * which is close to the best case for a dictionary coder — real projects come
 * out four to eight times smaller. On a cluster or a Redis plan measured in
 * hundreds of megabytes that is the difference between this being free and
 * being a problem, and it is also what keeps a project with pasted screenshots
 * under the per-value ceiling.
 *
 * Quality 5 rather than the default 11: 11 spends about ten times the CPU for
 * a few per cent, and this runs on a serverless request. */
const pack = (project) =>
  brotliCompressSync(Buffer.from(JSON.stringify(project), "utf8"), {
    params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
  });

function unpack(buffer) {
  if (!buffer) return null;
  try {
    return JSON.parse(brotliDecompressSync(buffer).toString("utf8"));
  } catch {
    // A value written by an older shape, or a corrupt one. Either way it is
    // not readable, and a broken backup must not break the list around it.
    try {
      return JSON.parse(buffer.toString("utf8"));
    } catch {
      return null;
    }
  }
}

/** What a stored mockup looks like without its payload, for a list. */
const summarise = (project, over = {}) => ({
  name: String(project?.name ?? "Untitled mockup").slice(0, 120),
  messages: project?.messages?.length ?? 0,
  ...over,
});

/* Refused above this, compressed. Well under Redis's 512 MB value ceiling and
   Mongo's 16 MB document one; the real reason for it is that a person pasting
   forty screenshots into a mockup should be told, not silently throttled. */
export const MAX_PACKED = 4 * 1024 * 1024;

/** How many cloud copies one account keeps. The oldest fall off rather than
 *  the newest being refused: somebody at the cap is still working, and the
 *  save they just made is the one they care about. */
export const PER_USER = 60;

/* --------------------------------------------------------------- redis */

const K = {
  mockup: (owner, slug) => `gm:m:${owner}:${slug}`,
  index: (owner) => `gm:mi:${owner}`,
  share: (id) => `gm:s:${id}`,
};

const redisStore = {
  name: "redis",

  async list(owner) {
    /* A sorted set scored by save time, so listing is one ordered range read
       rather than a SCAN over the keyspace — SCAN's cost grows with everything
       else in the instance, including the bot's data. */
    const rows = await read((c) => c.zRange(K.index(owner), 0, -1, { REV: true }), []);
    return rows
      .map((raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  },

  async put(owner, slug, project) {
    const body = pack(project);
    if (body.length > MAX_PACKED) return { error: "too-large", bytes: body.length };

    const now = Date.now();
    const meta = JSON.stringify(summarise(project, { id: slug, slug, updatedAt: now, bytes: body.length }));

    const ok = await write(async (c) => {
      const index = K.index(owner);
      // The index entry is replaced rather than added: the same slug saved
      // twice must be one row, and its old JSON is a different member.
      const existing = await c.zRange(index, 0, -1);
      const stale = existing.filter((raw) => {
        try {
          return JSON.parse(raw).slug === slug;
        } catch {
          return false;
        }
      });
      const tx = c.multi();
      if (stale.length) tx.zRem(index, stale);
      tx.set(K.mockup(owner, slug), body);
      tx.zAdd(index, { score: now, value: meta });
      await tx.exec();

      // Prune past the cap, and drop the payloads the pruned rows pointed at.
      const over = await c.zCard(index);
      if (over > PER_USER) {
        const drop = await c.zRange(index, 0, over - PER_USER - 1);
        if (drop.length) {
          const slugs = drop
            .map((raw) => {
              try {
                return JSON.parse(raw).slug;
              } catch {
                return null;
              }
            })
            .filter(Boolean);
          const cleanup = c.multi();
          cleanup.zRem(index, drop);
          if (slugs.length) cleanup.del(slugs.map((s) => K.mockup(owner, s)));
          await cleanup.exec();
        }
      }
      return true;
    });

    return ok ? { ok: true, updatedAt: now } : { error: "unavailable" };
  },

  async get(owner, slug) {
    const body = await read(
      (c) => c.get(c.commandOptions({ returnBuffers: true }), K.mockup(owner, slug)),
      null,
    );
    const project = unpack(body);
    if (!project) return null;
    const rows = await this.list(owner);
    const meta = rows.find((r) => r.slug === slug);
    return { project, ...(meta ?? { id: slug, slug, name: project.name }) };
  },

  async remove(owner, slug) {
    return write(async (c) => {
      const index = K.index(owner);
      const existing = await c.zRange(index, 0, -1);
      const stale = existing.filter((raw) => {
        try {
          return JSON.parse(raw).slug === slug;
        } catch {
          return false;
        }
      });
      const tx = c.multi();
      if (stale.length) tx.zRem(index, stale);
      tx.del(K.mockup(owner, slug));
      await tx.exec();
      return stale.length > 0;
    });
  },

  async putShare(id, project, ttlSeconds) {
    const body = pack(project);
    if (body.length > MAX_PACKED) return { error: "too-large", bytes: body.length };
    // `NX` so a generated id that somehow already exists is refused rather
    // than overwriting somebody else's share.
    const ok = await write((c) => c.set(K.share(id), body, { EX: ttlSeconds, NX: true }), null);
    return ok ? { ok: true, expiresAt: Date.now() + ttlSeconds * 1000 } : { error: "taken" };
  },

  async getShare(id) {
    const [body, ttl] = await Promise.all([
      read((c) => c.get(c.commandOptions({ returnBuffers: true }), K.share(id)), null),
      read((c) => c.ttl(K.share(id)), -1),
    ]);
    const project = unpack(body);
    if (!project) return null;
    return { project, expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : null };
  },
};

/* --------------------------------------------------------------- mongo */

/* Also no new collection.
 *
 * Everything goes into the one named by `MONGODB_COLLECTION`, which is
 * expected to be a collection that already exists. Every document written here
 * carries `_gm: 1` and every query filters on it, so this app cannot read,
 * count or delete anything that was not written by it — and whatever owns that
 * collection keeps working, because its own queries do not ask for `_gm`.
 *
 * No index is created. An index is as expensive as a collection against the
 * ceiling, and the queries here are all `_gm` plus an owner or a share id over
 * a set of documents that is small by construction — the per-user cap sees to
 * that. If this ever grows enough to want one, that is a decision to take with
 * the cluster's budget in hand rather than silently at startup.
 */
function mongoStore(collectionName) {
  const load = async () => {
    const { db } = await import("./mongo");
    return (await db()).collection(collectionName);
  };
  const mark = { _gm: 1 };

  return {
    name: `mongo:${collectionName}`,

    async list(owner) {
      const col = await load();
      const rows = await col
        .find({ ...mark, gmKind: "mockup", gmOwner: owner }, { projection: { gmBody: 0 } })
        .sort({ gmUpdatedAt: -1 })
        .limit(PER_USER)
        .toArray();
      return rows.map((r) => ({
        id: r.gmSlug,
        slug: r.gmSlug,
        name: r.gmName,
        messages: r.gmMessages ?? 0,
        bytes: r.gmBytes ?? 0,
        updatedAt: r.gmUpdatedAt,
      }));
    },

    async put(owner, slug, project) {
      const body = pack(project);
      if (body.length > MAX_PACKED) return { error: "too-large", bytes: body.length };
      const col = await load();
      const now = Date.now();
      const meta = summarise(project);
      await col.updateOne(
        { ...mark, gmKind: "mockup", gmOwner: owner, gmSlug: slug },
        {
          $set: {
            ...mark,
            gmKind: "mockup",
            gmOwner: owner,
            gmSlug: slug,
            gmName: meta.name,
            gmMessages: meta.messages,
            gmBytes: body.length,
            gmUpdatedAt: now,
            gmBody: body,
          },
        },
        { upsert: true },
      );

      /* The cap, enforced by reading the ids past it rather than by an index.
         Cheap because the set is capped: the query never sees more than about
         sixty documents per account. */
      const over = await col
        .find({ ...mark, gmKind: "mockup", gmOwner: owner }, { projection: { gmUpdatedAt: 1 } })
        .sort({ gmUpdatedAt: -1 })
        .skip(PER_USER)
        .toArray();
      if (over.length) await col.deleteMany({ _id: { $in: over.map((d) => d._id) } });

      return { ok: true, updatedAt: now };
    },

    async get(owner, slug) {
      const col = await load();
      const row = await col.findOne({ ...mark, gmKind: "mockup", gmOwner: owner, gmSlug: slug });
      const project = unpack(row?.gmBody?.buffer ? Buffer.from(row.gmBody.buffer) : row?.gmBody);
      if (!project) return null;
      return { project, id: row.gmSlug, slug: row.gmSlug, name: row.gmName, updatedAt: row.gmUpdatedAt };
    },

    async remove(owner, slug) {
      const col = await load();
      const result = await col.deleteOne({ ...mark, gmKind: "mockup", gmOwner: owner, gmSlug: slug });
      return result.deletedCount > 0;
    },

    async putShare(id, project, ttlSeconds) {
      const body = pack(project);
      if (body.length > MAX_PACKED) return { error: "too-large", bytes: body.length };
      const col = await load();
      const expiresAt = Date.now() + ttlSeconds * 1000;
      /* No TTL index — that is an index. Expiry is checked on read and the
         document is deleted then, which for something fetched exactly as often
         as a share link is fetched is the right trade. */
      await col.insertOne({ ...mark, gmKind: "share", gmShare: id, gmExpiresAt: expiresAt, gmBody: body });
      return { ok: true, expiresAt };
    },

    async getShare(id) {
      const col = await load();
      const row = await col.findOne({ ...mark, gmKind: "share", gmShare: id });
      if (!row) return null;
      if (row.gmExpiresAt && row.gmExpiresAt < Date.now()) {
        await col.deleteOne({ _id: row._id }).catch(() => {});
        return null;
      }
      const project = unpack(row.gmBody?.buffer ? Buffer.from(row.gmBody.buffer) : row.gmBody);
      return project ? { project, expiresAt: row.gmExpiresAt ?? null } : null;
    },
  };
}

/* ------------------------------------------------------------- picking */

/* Redis first, because it needs nothing from the cluster. Mongo only when it
 * is configured *and* has been pointed at a collection to share — without a
 * name there is nowhere to put anything that would not be a new collection,
 * and quietly creating one is the thing this file exists to avoid.
 */
export function store() {
  if (redisConfigured()) return redisStore;
  const shared = process.env.MONGODB_COLLECTION;
  if (process.env.MONGODB_URI && shared) return mongoStore(shared);
  return null;
}

export const storeConfigured = () => store() !== null;
