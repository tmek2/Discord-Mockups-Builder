/* Redis, hardened for serverless.
 *
 * Lifted from `gatorsys.xyz/src/utils/redis.ts`, because the two failure modes
 * it guards are the ones that surface as "the site works for a while and then
 * cuts out with no logs", and they are not obvious enough to rediscover:
 *
 *  1. node-redis throws an unhandled `error` event at the process level, so a
 *     dropped connection takes the whole function down rather than one request.
 *     An error listener is mandatory, not optional.
 *  2. An instance that accepts the socket but stops answering makes `await
 *     client.get(...)` hang forever, and the request hangs with it until the
 *     platform kills it. Every operation is raced against a short timeout.
 *
 * Every failure degrades to "no store" rather than throwing. Nothing in this
 * app depends on Redis being up: the browser holds the working copy and the
 * backups, and the cloud is the second copy.
 */

import { createClient } from "redis";

let client = null;
let connecting = null;

/* Long enough for a round trip to a managed Redis in another region, short
   enough that a stalled one cannot hold a request open. Writes get more room
   than reads because a mockup is tens of kilobytes rather than a cache line. */
const READ_TIMEOUT_MS = 1500;
const WRITE_TIMEOUT_MS = 3000;

/* Where the connection string comes from.
 *
 * `REDIS_URL` is the name to set by hand, and the one gatorsys.xyz uses. The
 * rest are what Vercel's storage integrations inject when a store is attached
 * to a project — connecting the existing store to this project is easier and
 * safer than copying a secret between them, and it means the value is never
 * pasted anywhere.
 *
 * Only the Redis protocol is accepted. The same integrations also inject an
 * HTTPS REST endpoint under a neighbouring name, and handing that to a socket
 * client fails with something that reads like a network fault rather than a
 * wrong variable. */
const URL_VARS = ["REDIS_URL", "KV_URL", "UPSTASH_REDIS_URL", "REDIS_CONNECTION_STRING"];

export function redisUrl() {
  for (const name of URL_VARS) {
    const value = process.env[name]?.trim();
    if (value && /^rediss?:\/\//i.test(value)) return value;
  }
  return null;
}

export const redisConfigured = () => Boolean(redisUrl());

async function connection() {
  const url = redisUrl();
  if (!url) return null;
  if (client?.isOpen) return client;

  if (!connecting) {
    const next = createClient({
      url,
      socket: {
        connectTimeout: 3000,
        /* Bounded: give up after a few tries rather than looping and holding
           requests open. A null client means "store off" for this instance. */
        reconnectStrategy: (retries) => (retries > 3 ? false : Math.min(retries * 200, 800)),
      },
    });
    next.on("error", (error) => {
      console.error("[redis] client error:", error?.message ?? error);
    });
    client = next;
    connecting = next
      .connect()
      .then(() => client)
      .catch((error) => {
        console.error("[redis] connection failed:", error?.message ?? error);
        client = null;
        connecting = null;
        return null;
      });
  }
  return connecting;
}

/** Race an operation against a timeout so a stalled server cannot hang a
 *  request. Any failure resolves to the fallback. */
async function guard(run, fallback, ms = READ_TIMEOUT_MS) {
  const conn = await connection().catch(() => null);
  if (!conn) return fallback;
  try {
    return await Promise.race([
      run(conn),
      new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
  } catch (error) {
    console.error("[redis] op failed:", error?.message ?? error);
    return fallback;
  }
}

export const read = (run, fallback = null) => guard(run, fallback, READ_TIMEOUT_MS);
export const write = (run, fallback = false) => guard(run, fallback, WRITE_TIMEOUT_MS);
