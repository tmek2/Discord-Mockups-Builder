/* What a project file is allowed to contain.
 *
 * This runs on anything arriving from outside the editor: an imported file, a
 * document read back from the cloud, whatever was in IndexedDB from a previous
 * version. All three are attacker-controlled in the sense that matters — a
 * project file is a thing people send each other — so the shape is checked
 * rather than trusted, and images in particular are restricted to data URIs
 * and same-origin paths so a project cannot turn into a tracking pixel or a
 * `javascript:` URL when it is rendered.
 *
 * It is deliberately permissive about *values* and strict about *kinds*: an
 * unknown block type is dropped, but a title of 9,000 characters is kept,
 * because a mockup showing what an over-long title looks like is a legitimate
 * thing to draw.
 */

import { isSafeMedia, isSafeUrl } from "./urls";

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isString = (v) => typeof v === "string";
const optString = (v, k) => v[k] === undefined || v[k] === null || isString(v[k]);

/* Media and link references go through the same allow-list the renderer uses.
 *
 * One decision, in one place. This used to be a regex here and nothing at all
 * at the point of rendering, which meant the two could disagree — and the one
 * that mattered was the missing one, because a field this accepted still went
 * straight into an `href`. Now the validator refuses a hostile project at the
 * door and the renderer neutralises anything that got past. Both, because
 * either alone is one mistake away from an XSS in a shared mockup. */
const isImage = (v) => isSafeMedia(v);
const isLink = (v) => isSafeUrl(v);

const BLOCK_TYPES = new Set([
  "text",
  "section",
  "gallery",
  "separator",
  "buttons",
  "select",
  "file",
  "container",
]);

const BUTTON_STYLES = new Set(["primary", "secondary", "success", "danger", "link", "premium"]);

function validBlocks(list, depth = 0) {
  if (!Array.isArray(list) || list.length > 200 || depth > 2) return false;
  return list.every((b) => {
    if (!isObject(b) || !BLOCK_TYPES.has(b.type)) return false;
    if (!["content", "placeholder", "color", "name", "size", "kind"].every((k) => optString(b, k))) return false;
    if (b.type === "container" && b.blocks !== undefined && !validBlocks(b.blocks, depth + 1)) return false;
    if (b.buttons !== undefined) {
      if (!Array.isArray(b.buttons) || b.buttons.length > 25) return false;
      const buttonsOk = b.buttons.every(
        (x) =>
          isObject(x) &&
          optString(x, "label") &&
          (!x.style || BUTTON_STYLES.has(x.style)) &&
          optString(x, "url") &&
          isLink(x.url),
      );
      if (!buttonsOk) return false;
    }
    if (b.items !== undefined) {
      if (!Array.isArray(b.items) || b.items.length > 40) return false;
      if (!b.items.every((x) => isObject(x) && isImage(x.src))) return false;
    }
    if (b.accessory !== undefined && b.accessory !== null) {
      if (!isObject(b.accessory) || !isImage(b.accessory.src)) return false;
    }
    if (b.options !== undefined && !Array.isArray(b.options)) return false;
    return true;
  });
}

export function validProject(p) {
  try {
    if (!isObject(p)) return false;
    if (p.version !== 1 && p.version !== 2) return false;
    if (!isString(p.name)) return false;

    if (!Array.isArray(p.users) || p.users.length < 1 || p.users.length > 300) return false;
    if (new Set(p.users.map((u) => u.id)).size !== p.users.length) return false;
    const usersOk = p.users.every(
      (u) =>
        isObject(u) &&
        isString(u.id) &&
        isString(u.name) &&
        isImage(u.avatar) &&
        isImage(u.decoration) &&
        isImage(u.roleIcon),
    );
    if (!usersOk) return false;

    if (!Array.isArray(p.messages) || p.messages.length > 500) return false;
    if (new Set(p.messages.map((m) => m.id)).size !== p.messages.length) return false;

    const ok = p.messages.every((m) => {
      if (!isObject(m) || !isString(m.id)) return false;
      if (!p.users.some((u) => u.id === m.user)) return false;
      if (!["content", "timestamp", "reply", "kind", "systemType"].every((k) => optString(m, k))) return false;

      if (m.embeds !== undefined) {
        if (!Array.isArray(m.embeds) || m.embeds.length > 20) return false;
        const embedsOk = m.embeds.every(
          (e) =>
            isObject(e) &&
            ["title", "description", "author", "color", "footer", "timestamp", "provider"].every((k) =>
              optString(e, k),
            ) &&
            ["url", "authorUrl"].every((k) => optString(e, k) && isLink(e[k])) &&
            ["image", "thumbnail", "authorIcon", "footerIcon", "video"].every((k) => isImage(e[k])) &&
            (e.fields === undefined ||
              (Array.isArray(e.fields) && e.fields.length <= 50 && e.fields.every((f) => isObject(f)))),
        );
        if (!embedsOk) return false;
      }

      if (m.components !== undefined && !validBlocks(m.components)) return false;

      if (m.attachments !== undefined) {
        if (!Array.isArray(m.attachments) || m.attachments.length > 40) return false;
        if (!m.attachments.every((a) => isObject(a) && isImage(a.src))) return false;
      }
      if (m.reactions !== undefined && !Array.isArray(m.reactions)) return false;
      /* The hover toolbar. Its emoji are drawn through the same node as a
         reaction, so a URL in there is a URL that reaches an `img`; the action
         ids are looked up in a fixed catalogue, so anything unknown is dropped
         at render rather than refused here. Bounded so a hostile project
         cannot ask for ten thousand of either. */
      if (m.toolbar !== undefined && m.toolbar !== null) {
        const t = m.toolbar;
        if (!isObject(t)) return false;
        if (t.reactions !== undefined) {
          if (!Array.isArray(t.reactions) || t.reactions.length > 10) return false;
          if (!t.reactions.every((e) => typeof e === "string" && isImage(e))) return false;
        }
        if (t.actions !== undefined) {
          if (!Array.isArray(t.actions) || t.actions.length > 20) return false;
          if (!t.actions.every((a) => typeof a === "string" && a.length <= 40)) return false;
        }
      }
      if (m.sticker && !isImage(m.sticker.src)) return false;
      if (m.invite && !isImage(m.invite.icon)) return false;
      if (m.linkPreview) {
        const p = m.linkPreview;
        if (!isObject(p) || !isLink(p.url) || !isImage(p.thumbnail) || !isImage(p.image)) return false;
      }
      return true;
    });
    if (!ok) return false;

    if (p.emojis !== undefined) {
      if (!Array.isArray(p.emojis) || p.emojis.length > 200) return false;
      if (!p.emojis.every((e) => isObject(e) && isString(e.name) && isImage(e.src))) return false;
    }

    if (!isObject(p.canvas)) return false;
    if (!["ash", "dark", "onyx", "light"].includes(p.canvas.theme)) return false;
    if (!isImage(p.canvas.customBackground)) return false;
    if (p.canvas.server && !isImage(p.canvas.server.icon)) return false;

    return true;
  } catch {
    return false;
  }
}

/* A project written by an older version, brought forward.
 *
 * Version 1 kept the component tree on `blocks` with `children` for nesting
 * and a separate `buttons` array on the message, and inlined avatars as base64
 * data URIs. All three change here rather than at every read site. */
export function migrate(p) {
  if (!isObject(p)) return p;
  if (p.version === 2) return p;

  const block = (b) => {
    if (!isObject(b)) return null;
    switch (b.type) {
      case "container":
        return { ...b, type: "container", blocks: (b.children ?? []).map(block).filter(Boolean) };
      case "image":
        return { id: b.id, type: "gallery", items: [{ id: `${b.id}-i`, src: b.image, alt: b.caption ?? "" }] };
      case "buttons":
        return { id: b.id, type: "buttons", buttons: b.buttons ?? [] };
      case "skeleton":
        return { id: b.id, type: "text", content: "" };
      default:
        return { ...b, content: b.content ?? b.text ?? "" };
    }
  };

  return {
    ...p,
    version: 2,
    emojis: p.emojis ?? [],
    messages: (p.messages ?? []).map((m) => ({
      ...m,
      kind: m.kind ?? "message",
      components: [
        ...(m.blocks ?? []).map(block).filter(Boolean),
        ...(m.buttons?.length ? [{ id: `${m.id}-row`, type: "buttons", buttons: m.buttons }] : []),
      ],
    })),
  };
}
