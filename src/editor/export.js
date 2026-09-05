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

/* A share link carries the project in the fragment, which is never sent to the
 * server — so a shared mockup is between the two people who have the link and
 * nothing on this deployment ever sees it. It is also why there is a size
 * limit: browsers cap a URL somewhere around 32k, and a project with a pasted
 * screenshot in it is well past that. */
export function shareLink(project) {
  const json = JSON.stringify(project);
  const packed = btoa(unescape(encodeURIComponent(json)));
  if (packed.length > 28000) return null;
  return `${window.location.origin}/builder#m=${packed}`;
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
