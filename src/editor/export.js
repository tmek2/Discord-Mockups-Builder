/* Getting the mockup out.
 *
 * Four ways, and each answers a different question. A PNG is for a document or
 * a Discord message about a Discord message. The project file is for coming
 * back to it later or handing it to somebody else. The message JSON is for a
 * bot that has to send the real thing. A share link is for showing it to one
 * person without either of you saving anything.
 */

const download = (url, name) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
};

const safeName = (name) =>
  (name || "mockup").toLowerCase().replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "mockup";

export async function exportPng(node, project) {
  const { toPng } = await import("html-to-image");
  // Waiting on the fonts means the raster has the real face in it rather than
  // the fallback the browser was still showing when the click landed.
  await document.fonts.ready;
  const url = await toPng(node, {
    pixelRatio: project.canvas?.scale ?? 2,
    cacheBust: false,
    // The stage applies a zoom transform for the editor's own benefit; the
    // export is of the message, not of how far it happens to be zoomed.
    style: { transform: "none", zoom: "1", boxShadow: "none", borderRadius: "0" },
    filter: (el) => !el.classList?.contains("e-no-export"),
  });
  download(url, `${safeName(project.name)}.png`);
}

export function exportProject(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  download(url, `${safeName(project.name)}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* The message as Discord's API would take it.
 *
 * Components v2 rather than the legacy shape, with the numeric type codes the
 * API actually uses. It is a starting point and says so: a mockup has no
 * snowflakes in it, so custom ids are generated and emoji are left as the text
 * that was typed rather than guessed at as ids. */
const V2 = {
  actionRow: 1,
  button: 2,
  stringSelect: 3,
  section: 9,
  textDisplay: 10,
  thumbnail: 11,
  mediaGallery: 12,
  file: 13,
  separator: 14,
  container: 17,
};

const BUTTON_STYLE = { primary: 1, secondary: 2, success: 3, danger: 4, link: 5, premium: 6 };
const SELECT_TYPE = { string: 3, user: 5, role: 6, mentionable: 7, channel: 8 };

function toComponent(block) {
  switch (block.type) {
    case "text":
      return { type: V2.textDisplay, content: block.content ?? "" };
    case "section":
      return {
        type: V2.section,
        components: [{ type: V2.textDisplay, content: block.content ?? "" }],
        accessory:
          block.accessory?.kind === "button"
            ? toButton(block.accessory)
            : { type: V2.thumbnail, media: { url: block.accessory?.src ?? "" }, description: block.accessory?.alt || undefined },
      };
    case "gallery":
      return {
        type: V2.mediaGallery,
        items: (block.items ?? []).map((i) => ({
          media: { url: i.src },
          description: i.alt || undefined,
          spoiler: i.spoiler || undefined,
        })),
      };
    case "separator":
      return { type: V2.separator, divider: block.divider !== false, spacing: block.spacing === "large" ? 2 : 1 };
    case "buttons":
      return { type: V2.actionRow, components: (block.buttons ?? []).map(toButton) };
    case "select":
      return {
        type: V2.actionRow,
        components: [
          {
            type: SELECT_TYPE[block.kind ?? "string"] ?? 3,
            custom_id: `select_${block.id.slice(0, 8)}`,
            placeholder: block.placeholder || undefined,
            disabled: block.disabled || undefined,
            options:
              (block.kind ?? "string") === "string"
                ? (block.options ?? []).map((o) => ({
                    label: o.label,
                    value: o.label.toLowerCase().replace(/\W+/g, "_").slice(0, 100) || "option",
                    description: o.description || undefined,
                  }))
                : undefined,
          },
        ],
      };
    case "file":
      return { type: V2.file, file: { url: `attachment://${block.name}` }, spoiler: block.spoiler || undefined };
    case "container":
      return {
        type: V2.container,
        accent_color: hexToInt(block.color),
        spoiler: block.spoiler || undefined,
        components: (block.blocks ?? []).map(toComponent).filter(Boolean),
      };
    default:
      return null;
  }
}

function toButton(button) {
  const style = BUTTON_STYLE[button.style] ?? 2;
  return {
    type: V2.button,
    style,
    label: button.label || undefined,
    disabled: button.disabled || undefined,
    ...(style === 5 ? { url: button.url || "https://example.com" } : { custom_id: `btn_${(button.id ?? "").slice(0, 8)}` }),
    ...(button.emoji ? { emoji: { name: button.emoji } } : {}),
  };
}

function hexToInt(hex) {
  if (!hex || hex === "none" || !/^#[0-9a-f]{6}$/i.test(hex)) return undefined;
  return parseInt(hex.slice(1), 16);
}

export function messageJson(message) {
  const payload = {};
  if (message.content) payload.content = message.content;

  if (message.embeds?.length) {
    payload.embeds = message.embeds.map((e) => {
      const embed = {};
      if (e.title) embed.title = e.title;
      if (e.url) embed.url = e.url;
      if (e.description) embed.description = e.description;
      const color = hexToInt(e.color);
      if (color !== undefined) embed.color = color;
      if (e.author) embed.author = { name: e.author, icon_url: e.authorIcon || undefined, url: e.authorUrl || undefined };
      if (e.footer || e.footerIcon) embed.footer = { text: e.footer || "", icon_url: e.footerIcon || undefined };
      if (e.thumbnail) embed.thumbnail = { url: e.thumbnail };
      if (e.image) embed.image = { url: e.image };
      if (e.timestamp) embed.timestamp = e.timestamp;
      if (e.fields?.length) {
        embed.fields = e.fields.map((f) => ({ name: f.name, value: f.value, inline: Boolean(f.inline) }));
      }
      return embed;
    });
  }

  if (message.components?.length) {
    payload.components = message.components.map(toComponent).filter(Boolean);
    /* IS_COMPONENTS_V2. Once a message is sent with it the flag cannot be
       removed, and without it the payload above is rejected — so it is written
       in rather than left for the reader to remember. */
    payload.flags = 32768;
  }

  if (message.ephemeral) payload.flags = (payload.flags ?? 0) | 64;
  if (message.tts) payload.tts = true;

  return JSON.stringify(payload, null, 2);
}

export function exportMessageJson(message, name) {
  const blob = new Blob([messageJson(message)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  download(url, `${safeName(name)}-message.json`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Two kinds of share link, and the tool tries them in the order that keeps
 * the most work private.
 *
 * The fragment link carries the whole mockup after the `#`, which browsers
 * never send to a server — so a mockup shared this way is between the two
 * people who have the link and nothing on this deployment ever sees it. It is
 * the default whenever it fits.
 *
 * It stops fitting at about 28k, because browsers cap a URL somewhere around
 * 32k and a project with a pasted screenshot in it is well past that. Then
 * the short link takes over: the mockup goes to the deployment's own store
 * under an eight-character id with an expiry, which is also the link you can
 * read out loud.
 */
export function fragmentLink(project) {
  const json = JSON.stringify(project);
  const packed = btoa(unescape(encodeURIComponent(json)));
  if (packed.length > 28000) return null;
  return `${window.location.origin}/#m=${packed}`;
}

/** A short link, when the deployment has a store for one. Falls back to the
 *  fragment, and says which one came back so the caller can be honest about
 *  whether anything left the browser. */
export async function shareLink(project, { ttl } = {}) {
  const fragment = fragmentLink(project);
  if (fragment) return { url: fragment, kind: "fragment" };

  try {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project, ttl }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        error:
          data.code === "no_backend"
            ? "This mockup is too big for a link, and short links are not set up on this deployment. Download the project file instead."
            : (data.error ?? "The link could not be made."),
      };
    }
    return { url: `${window.location.origin}/s/${data.id}`, kind: "short", expiresAt: data.expiresAt };
  } catch {
    return { error: "The link could not be made — the deployment did not answer." };
  }
}

export function readShareLink(hash) {
  const match = /[#&]m=([^&]+)/.exec(hash ?? "");
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(match[1]))));
  } catch {
    return null;
  }
}

export { safeName };

/* ------------------------------------------------------- JSON, coming in */

/* Reading a Discord message payload back into a mockup.
 *
 * The inverse of `messageJson`, and the reason it exists is that most people
 * arriving at a tool like this already have a payload: something a bot sends,
 * something out of Discohook, something a teammate pasted in chat. Making them
 * rebuild it by hand in a form is asking them to do work they have already
 * done.
 *
 * It reads both shapes. A legacy message is `content` plus `embeds` plus
 * action rows; a Components v2 message is a `components` tree with the 32768
 * flag. Neither is assumed — whatever is present is converted, and anything
 * unrecognised is skipped rather than throwing, because a payload with one
 * unknown key in it is still ninety per cent of a mockup.
 */

const INT_TO_HEX = (n) =>
  typeof n === "number" && Number.isFinite(n) ? `#${(n & 0xffffff).toString(16).padStart(6, "0")}` : undefined;

const STYLE_FROM = { 1: "primary", 2: "secondary", 3: "success", 4: "danger", 5: "link", 6: "premium" };
const SELECT_FROM = { 3: "string", 5: "user", 6: "role", 7: "mentionable", 8: "channel" };

function fromButton(c, uid) {
  return {
    id: uid(),
    label: c.label ?? "",
    style: STYLE_FROM[c.style] ?? "secondary",
    emoji: c.emoji?.name ?? "",
    url: c.url ?? "",
    disabled: Boolean(c.disabled),
  };
}

function fromComponent(c, uid) {
  switch (c.type) {
    case 10: // text display
      return { id: uid(), type: "text", content: c.content ?? "" };
    case 9: {
      // section: one to three text displays plus an accessory
      const text = (c.components ?? []).map((t) => t.content ?? "").join("\n");
      const a = c.accessory ?? {};
      return {
        id: uid(),
        type: "section",
        content: text,
        accessory:
          a.type === 2
            ? { kind: "button", ...fromButton(a, uid) }
            : { kind: "thumbnail", src: a.media?.url ?? "", alt: a.description ?? "" },
      };
    }
    case 12:
      return {
        id: uid(),
        type: "gallery",
        items: (c.items ?? []).map((i) => ({
          id: uid(),
          src: i.media?.url ?? "",
          alt: i.description ?? "",
          spoiler: Boolean(i.spoiler),
        })),
      };
    case 14:
      return {
        id: uid(),
        type: "separator",
        divider: c.divider !== false,
        spacing: c.spacing === 2 ? "large" : "small",
      };
    case 13:
      return {
        id: uid(),
        type: "file",
        name: String(c.file?.url ?? "file").replace(/^attachment:\/\//, ""),
        size: "",
        spoiler: Boolean(c.spoiler),
      };
    case 17:
      return {
        id: uid(),
        type: "container",
        color: INT_TO_HEX(c.accent_color) ?? "none",
        spoiler: Boolean(c.spoiler),
        blocks: (c.components ?? []).map((x) => fromComponent(x, uid)).filter(Boolean),
      };
    case 1: {
      // An action row is a button row or a single select; which one it is
      // depends on what is in it, not on the row.
      const kids = c.components ?? [];
      const menu = kids.find((k) => k.type in SELECT_FROM && k.type !== 2);
      if (menu) {
        return {
          id: uid(),
          type: "select",
          kind: SELECT_FROM[menu.type] ?? "string",
          placeholder: menu.placeholder ?? "",
          disabled: Boolean(menu.disabled),
          options: (menu.options ?? []).map((o) => ({
            id: uid(),
            label: o.label ?? "",
            description: o.description ?? "",
            emoji: o.emoji?.name ?? "",
          })),
        };
      }
      return { id: uid(), type: "buttons", buttons: kids.filter((k) => k.type === 2).map((k) => fromButton(k, uid)) };
    }
    default:
      return null;
  }
}

/**
 * Turn a payload into the fields of a message.
 *
 * Returns `{ patch }` on success or `{ error }` with something worth reading.
 * The caller merges the patch into whichever message is selected, so the
 * author, the timestamp and everything else about the mockup survive.
 */
export function messageFromJson(text, uid) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    return { error: `That is not valid JSON — ${String(error.message).replace(/^JSON\.parse: /, "")}` };
  }
  if (Array.isArray(payload)) payload = payload[0];
  if (!payload || typeof payload !== "object") return { error: "A message payload has to be an object." };

  /* Discohook wraps a message in `{ messages: [{ data: … }] }` when you use
     its share links, and a webhook body is the bare message. Both are common
     enough to unwrap rather than reject. */
  if (Array.isArray(payload.messages)) payload = payload.messages[0]?.data ?? payload.messages[0] ?? {};
  if (payload.data && typeof payload.data === "object") payload = payload.data;

  const patch = {
    content: typeof payload.content === "string" ? payload.content : "",
    embeds: [],
    components: [],
  };

  if (Array.isArray(payload.embeds)) {
    patch.embeds = payload.embeds.slice(0, 20).map((e) => ({
      id: uid(),
      color: INT_TO_HEX(e.color) ?? "#5865f2",
      author: e.author?.name ?? "",
      authorIcon: e.author?.icon_url ?? "",
      authorUrl: e.author?.url ?? "",
      title: e.title ?? "",
      url: e.url ?? "",
      description: e.description ?? "",
      thumbnail: e.thumbnail?.url ?? "",
      image: e.image?.url ?? "",
      video: e.video?.url ?? "",
      footer: e.footer?.text ?? "",
      footerIcon: e.footer?.icon_url ?? "",
      timestamp: e.timestamp ?? "",
      provider: e.provider?.name ?? "",
      fields: (e.fields ?? []).map((f) => ({
        id: uid(),
        name: f.name ?? "",
        value: f.value ?? "",
        inline: Boolean(f.inline),
      })),
    }));
  }

  if (Array.isArray(payload.components)) {
    patch.components = payload.components.map((c) => fromComponent(c, uid)).filter(Boolean);
  }

  if (typeof payload.flags === "number") patch.ephemeral = Boolean(payload.flags & 64);
  if (payload.tts) patch.tts = true;

  if (!patch.content && !patch.embeds.length && !patch.components.length) {
    return { error: "There is no content, embed or component in that payload." };
  }
  return { patch };
}
