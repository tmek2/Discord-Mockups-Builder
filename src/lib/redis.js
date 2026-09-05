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

export const redisConfigured = () => Boolean(process.env.REDIS_URL);

async function connection() {
  if (!process.env.REDIS_URL) return null;
  if (client?.isOpen) return client;

  if (!connecting) {
    const next = createClient({
      url: process.env.REDIS_URL,
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
