import { MongoClient } from "mongodb";

/* One client for the whole process.
 *
 * On Vercel every function invocation may land on a warm container, and a new
 * MongoClient per invocation exhausts the connection pool within minutes of
 * real traffic. The client is cached on `globalThis` rather than in a module
 * variable because Next's dev server re-evaluates modules on every edit and a
 * module variable would leak one client per save.
 */

const uri = process.env.MONGODB_URI;

let cached = globalThis.__gatorMockupsMongo;
if (!cached) cached = globalThis.__gatorMockupsMongo = { client: null, promise: null };

export function mongoConfigured() {
  return Boolean(uri);
}

export async function db() {
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!cached.promise) {
    cached.promise = new MongoClient(uri, {
      maxPoolSize: 10,
      // Fail fast rather than holding a request open for half a minute: the
      // editor treats a cloud error as "stay local", which is only useful if
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
  return client.db(process.env.MONGODB_DB || "gator-mockups");
}

/** The saved-mockups collection, with its indexes ensured once. */
export async function mockups() {
  const database = await db();
  const collection = database.collection("mockups");
  if (!globalThis.__gatorMockupsIndexed) {
    globalThis.__gatorMockupsIndexed = true;
    await collection
      .createIndexes([
        { key: { ownerId: 1, updatedAt: -1 }, name: "owner_recent" },
        { key: { ownerId: 1, slug: 1 }, name: "owner_slug", unique: true },
      ])
      .catch(() => {
        // An index that cannot be built is not a reason to refuse a save.
      });
  }
  return collection;
}
