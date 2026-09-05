/* Backups.
 *
 * Two kinds, and the difference matters enough to be visible in the interface.
 *
 * A **named backup** is a copy you made on purpose — "welcome message v3" —
 * that stays until you delete it. This is Discohook's model and the right one:
 * the thing you are editing is a working copy, and a backup is a point you can
 * get back to.
 *
 * An **automatic snapshot** is one the editor took for you, on a timer, and
 * throws away once there are enough newer ones. Nobody asks for these; they
 * exist so that "I closed the tab" and "I pasted over everything" are
 * recoverable rather than terminal.
 *
 * Both live in IndexedDB, so they survive a reload, a crash and being offline.
 * Signing in adds a third copy in the cloud — see `cloud.js` — which is the
 * only one that survives a cleared browser or a different machine.
 */

import { deleteValue, listKeys, loadValue, saveValue } from "./storage";
import { uid } from "./model";
import { migrate, validProject } from "./validate";

const NAMED = "backup:";
const AUTO = "auto:";

/** How many automatic snapshots to keep. Enough to step back through an
 *  afternoon; few enough that they never become the thing filling the disk. */
export const AUTO_KEEP = 12;

/** How often one is taken, when anything has actually changed. */
export const AUTO_EVERY_MS = 90_000;

const bytesOf = (project) => {
  try {
    return new Blob([JSON.stringify(project)]).size;
  } catch {
    return 0;
  }
};

function entry(id, project, over = {}) {
  return {
    id,
    name: project.name || "Untitled mockup",
    messages: project.messages?.length ?? 0,
    bytes: bytesOf(project),
    savedAt: Date.now(),
    project,
    ...over,
  };
}

/* ------------------------------------------------------------ named ---- */

export async function listBackups() {
  const keys = await listKeys();
  const rows = await Promise.all(
    keys.filter((k) => k.startsWith(NAMED)).map((k) => loadValue(k).catch(() => null)),
  );
  return rows
    .filter((r) => r && validProject(r.project))
    .map(({ project, ...meta }) => meta)
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function saveBackup(project, name) {
  const id = uid();
  await saveValue(`${NAMED}${id}`, entry(id, { ...project, name: name || project.name }, { auto: false }));
  return id;
}

/** Overwrite an existing backup in place, keeping its id and its position. */
export async function updateBackup(id, project) {
  const existing = await loadValue(`${NAMED}${id}`).catch(() => null);
  if (!existing) return saveBackup(project);
  await saveValue(`${NAMED}${id}`, entry(id, project, { auto: false, name: existing.name }));
  return id;
}

export async function renameBackup(id, name) {
  const existing = await loadValue(`${NAMED}${id}`);
  if (!existing) return;
  await saveValue(`${NAMED}${id}`, { ...existing, name: name || "Untitled mockup" });
}

export async function readBackup(id) {
  const row = await loadValue(id.startsWith(AUTO) || id.startsWith(NAMED) ? id : `${NAMED}${id}`);
  const project = migrate(row?.project);
  return validProject(project) ? project : null;
}

export async function deleteBackup(id) {
  await deleteValue(id.startsWith(AUTO) || id.startsWith(NAMED) ? id : `${NAMED}${id}`);
}

/* -------------------------------------------------------- automatic ---- */

export async function listSnapshots() {
  const keys = await listKeys();
  const rows = await Promise.all(
    keys.filter((k) => k.startsWith(AUTO)).map((k) => loadValue(k).catch(() => null)),
  );
  return rows
    .filter((r) => r && validProject(r.project))
    .map(({ project, ...meta }) => meta)
    .sort((a, b) => b.savedAt - a.savedAt);
}

/* Takes one, then throws away everything past the keep count.
 *
 * The id carries the timestamp so the list sorts by key without reading every
 * record, and so two snapshots taken in the same millisecond cannot collide. */
export async function takeSnapshot(project) {
  const id = `${AUTO}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await saveValue(id, entry(id, project, { auto: true }));

  const keys = (await listKeys()).filter((k) => k.startsWith(AUTO)).sort();
  const stale = keys.slice(0, Math.max(0, keys.length - AUTO_KEEP));
  await Promise.all(stale.map((k) => deleteValue(k).catch(() => {})));
  return id;
}

/** Everything, newest first, for one list with two kinds in it. */
export async function listAll() {
  const [named, auto] = await Promise.all([listBackups(), listSnapshots()]);
  return [...named, ...auto].sort((a, b) => b.savedAt - a.savedAt);
}
