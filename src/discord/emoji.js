/* Emoji, drawn the way Discord draws them.
 *
 * Discord does not use the platform's emoji font. It ships Twemoji, and has
 * done since long before the fork it now maintains — which is why the same
 * message looks identical on Windows, macOS and Android inside the client and
 * different everywhere else. A mockup that fell back to the system font would
 * be wrong on every machine except the one it was drawn on, which for a tool
 * whose whole output is a picture is the one thing it cannot be.
 *
 * So the same asset set, from the same place: SVG, from the maintained fork,
 * pinned to a version rather than to `latest`. `latest` would let an upstream
 * release change a mockup that has already been exported.
 */

const TWEMOJI_VERSION = "15.1.0";
const BASE = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@${TWEMOJI_VERSION}/assets/svg`;

/* Twemoji's filenames drop two things Unicode keeps.
 *
 * U+FE0F is the variation selector that asks for the emoji presentation of a
 * character that also has a text form. Twemoji's assets are already the emoji
 * form, so the selector is not in the filename — except in the keycap
 * sequences, where it is the only thing separating 1️⃣ from a plain digit, so
 * there it stays. U+200D is the zero-width joiner and *is* kept: it is what
 * distinguishes 👨‍👩‍👧 from three separate people. */
function filename(text) {
  const points = [...text].map((ch) => ch.codePointAt(0));
  const keycap = points.includes(0x20e3);
  return points
    .filter((cp) => keycap || cp !== 0xfe0f)
    .map((cp) => cp.toString(16))
    .join("-");
}

export const twemojiUrl = (text) => `${BASE}/${filename(text)}.svg`;

/* What counts as an emoji in a run of text.
 *
 * `\p{RI}{2}` is a regional-indicator pair, which is how flags are encoded and
 * which `\p{Extended_Pictographic}` does not match on its own. After the first
 * pictograph the rest of the cluster is swept up: skin-tone modifiers, the
 * variation selector, keycaps, tag sequences, and any number of
 * joiner-plus-pictograph groups. Written out rather than reached for through
 * `\p{RGI_Emoji}`, which is only in very recent engines. */
export const EMOJI_RE =
  /\p{RI}{2}|\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|️|⃣|[\u{E0020}-\u{E007F}])*(?:‍\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|️|⃣)*)*/gu;

/** Whether a string is nothing but emoji and whitespace. Discord draws those
 *  messages at 48px rather than at the line height, up to 27 of them. */
export function jumboable(text) {
  const stripped = text.replace(EMOJI_RE, "").replace(/<a?:\w+:\d+>/g, "").trim();
  if (stripped) return false;
  const count = (text.match(EMOJI_RE) ?? []).length + (text.match(/<a?:\w+:\d+>/g) ?? []).length;
  return count > 0 && count <= 27;
}
