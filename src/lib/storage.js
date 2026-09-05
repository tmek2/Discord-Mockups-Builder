/* Local persistence.
 *
 * IndexedDB rather than localStorage, for one reason: a mockup can carry a
 * dozen pasted images as data URIs and localStorage's quota is around 5 MB of
 * UTF-16, which one screenshot can exceed on its own. IndexedDB stores the
 * object rather than a string of it, so nothing is serialised twice, and its
 * quota is measured in hundreds of megabytes.
 *
 * Every call can fail — a private window, blocked storage, a full disk — and
 * every one of those is survivable: the editor keeps working in memory and
 * says so. Nothing here throws past its caller.
 */

const DB = "gator-mockups";
const STORE = "data";
let handle;

function open() {
  return (handle ??= new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("no indexedDB"));
      return;
    }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export async function loadValue(key) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveValue(key, value) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function deleteValue(key) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
