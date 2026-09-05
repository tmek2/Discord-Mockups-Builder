import { MongoClient } from "mongodb";

/* One client for the whole process.
 *
 * On Vercel every invocation may land on a warm container, and a new
 * MongoClient per invocation exhausts the connection pool within minutes of
 * real traffic. It is cached on `globalThis` rather than in a module variable
 * because Next's dev server re-evaluates modules on every edit, and a module
 * variable would leak one client per save.
 *
 * Nothing here creates a collection or an index. The cluster this points at is
 * shared with the bot and is at its collection ceiling — Atlas counts
 * collections and indexes together — so this app writes into one collection
 * that already exists, named by `MONGODB_COLLECTION`, and marks its own
 * documents. See `store.js`.
 */

const uri = process.env.MONGODB_URI;

let cached = globalThis.__gatorMockupsMongo;
if (!cached) cached = globalThis.__gatorMockupsMongo = { client: null, promise: null };

export function mongoConfigured() {
  return Boolean(uri && process.env.MONGODB_COLLECTION);
}

export async function db() {
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!cached.promise) {
    cached.promise = new MongoClient(uri, {
      maxPoolSize: 10,
      // Fail fast rather than holding a request open for half a minute: the
      // editor treats a store error as "stay local", which is only useful if
      // it arrives while the person is still looking at the screen.
      serverSelectionTimeoutMS: 8000,
    })
      .connect()
      .then((client) => {
        cached.client = client;
        return client;
      })
      .catch((error) => {
        // Clear the cached rejection, or every later request replays it.
        cached.promise = null;
        throw error;
      });
  }
  const client = await cached.promise;
  return client.db(process.env.MONGODB_DB || undefined);
}
