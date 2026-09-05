/* Detaching a mockup from wherever it came from.
 *
 * A share link hands somebody a *copy*, and the copy has to be a genuinely
 * separate document from the first keystroke — not the same document with a
 * different owner. Three things follow from that, and all three are this
 * file's job:
 *
 * **Every id is replaced.** If the fork kept the original's message and block
 * ids, then two documents that are supposed to be unrelated would agree about
 * what their parts are called. Nothing here depends on that today, but a
 * cloud backup is keyed by the mockup's own id, and the day one is written
 * from a fork it would land on top of the original. Re-identifying at the door
 * makes that impossible rather than merely unlikely.
 *
 * **The identity of whoever made it does not travel.** Whatever the sender's
 * copy knew about its own storage — which backup it is, which cloud slot it
 * occupies, when it was last saved — is not the recipient's business and is
 * stripped rather than ignored.
 *
 * **It is a snapshot, not a window.** A share stores the mockup as it was when
 * the link was made. Editing it afterwards does not change the link, and
 * editing what came out of the link does not change the original. Neither side
 * can reach the other, because after this function there is no shared
 * reference left between them.
 */

import { ID } from "./ids";

/* Keys whose values are ids of things inside the project, and therefore have
 * to be rewritten to the new ids rather than replaced with fresh ones — a
 * reply pointing at a message must still point at that message after the
 * fork, it just points at its new name. */
const REFERENCES = new Set(["reply", "user"]);

/* Fields that describe where a copy lives rather than what it is. None of
 * them belong to the mockup, and a fork must not inherit any. */
const PROVENANCE = new Set(["ownerId", "slug", "backupId", "shareId", "updatedAt", "savedAt", "_id", "_gm"]);

/**
 * A deep copy with every id replaced and every reference re-pointed.
 *
 * Returns a project that shares no identifier with the one it came from.
 */
export function forkProject(project) {
  if (!project || typeof project !== "object") return project;

  /* Two passes. The first walks the tree and mints a new id for every old one
     it meets; the second rewrites the values. One pass cannot do it, because a
     reply can point at a message that appears later in the array. */
  const renames = new Map();

  const discover = (node) => {
    if (Array.isArray(node)) {
      node.forEach(discover);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (typeof node.id === "string" && node.id && !renames.has(node.id)) {
      renames.set(node.id, kindFor(node));
    }
    for (const value of Object.values(node)) discover(value);
  };

  const rewrite = (node) => {
    if (Array.isArray(node)) return node.map(rewrite);
    if (!node || typeof node !== "object") return node;
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      if (PROVENANCE.has(key)) continue;
      if (key === "id" && typeof value === "string" && renames.has(value)) {
        out[key] = renames.get(value);
        continue;
      }
      if (REFERENCES.has(key) && typeof value === "string" && renames.has(value)) {
        out[key] = renames.get(value);
        continue;
      }
      out[key] = rewrite(value);
    }
    return out;
  };

  discover(project);
  const forked = rewrite(project);

  /* The message an interaction header names, which is a user id nested one
     level down rather than a plain field, so the reference sweep above does
     not reach it. */
  for (const message of forked.messages ?? []) {
    if (message.interaction?.user && renames.has(message.interaction.user)) {
      message.interaction.user = renames.get(message.interaction.user);
    }
  }

  return forked;
}

/* Which kind of id a node should get, guessed from what the node has on it.
 * Getting this wrong costs nothing but a less descriptive prefix — the id is
 * still unique — so it is a lookup rather than a schema. */
function kindFor(node) {
  if (node.kind === "message" || node.kind === "system" || Array.isArray(node.embeds)) return ID.message();
  if (Array.isArray(node.fields) || typeof node.footerIcon === "string") return ID.embed();
  if (typeof node.type === "string") return ID.block();
  if (typeof node.style === "string" && typeof node.label === "string") return ID.button();
  if (typeof node.avatar === "string") return ID.user();
  if (typeof node.inline === "boolean") return ID.field();
  return ID.generic();
}

/** Everything a *saved* copy needs beyond the project itself. Kept apart from
 *  the project so that a project handed to somebody else cannot carry it. */
export const newSaveIdentity = () => ({ id: ID.mockup(), createdAt: Date.now() });
