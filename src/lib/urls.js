/* Deciding whether a URL out of a mockup may be used as one.
 *
 * This is a security boundary, not a tidiness one. A mockup can arrive from
 * somebody else — a share link, an imported project file, a pasted payload —
 * and several of its fields end up as an `href` or a `src` on the recipient's
 * page. An embed whose `url` is a `javascript:` URL that reads the cookie
 * would run in the origin the recipient is signed in to, the moment they
 * clicked the embed's title.
 *
 * The Content-Security-Policy does not cover this. `javascript:` URLs are
 * governed by `script-src`, and `script-src` here has to allow 'unsafe-inline'
 * because Next injects an inline bootstrap — so the header that looks like it
 * would catch this does not. It has to be caught in code.
 *
 * The rule is an allow-list of schemes, never a block-list of bad ones. A
 * block-list is a list of the tricks somebody has already thought of, and the
 * interesting ones are always the other kind. An allow-list is a list of what
 * this app actually needs, which is short.
 */

/** Schemes a link may navigate to. */
const LINK_SCHEMES = new Set(["http:", "https:", "mailto:"]);

/** Schemes an image, video or icon may load from. */
const MEDIA_SCHEMES = new Set(["http:", "https:", "blob:"]);

/* `data:` is allowed for media, but only for a real image or video type.
   `data:text/html` in an <img> does not execute today, but it is not a picture
   either, and the same string travels into exports and share payloads. */
const DATA_MEDIA = /^data:(image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml|x-icon)|video\/(mp4|webm|ogg));/i;

/* A path on this origin. Deliberately narrow, and it must not begin with two
   slashes — the URL parser reads `//host/path` as a different origin. */
const SAME_ORIGIN = /^\/(?!\/)[\w./-]*$/;

/* The characters a browser deletes from a URL before it looks at the scheme.
 *
 * This is the whole of the classic bypass, and it is not theoretical: a tab, a
 * newline or a carriage return inside "javascript:" is removed by the URL
 * parser in every browser, so `jav&#9;ascript:alert(1)` is a working
 * `javascript:` URL that a naive check reads as the relative path
 * "jav\tascript:alert(1)" and waves through. They have to be stripped *before*
 * the scheme is read, not after.
 *
 * NUL is not in that set — browsers differ, and `URL` keeps it — so anything
 * still holding a control character after the strip is refused outright rather
 * than guessed at. A legitimate URL does not contain one. */
const STRIPPED = /[\t\n\r]/g;
const CONTROL = /[\u0000-\u001f\u007f]/;

/** What the browser will actually see, or `null` if it is not worth parsing. */
function normalise(value) {
  const cleaned = value.trim().replace(STRIPPED, "");
  return CONTROL.test(cleaned) ? null : cleaned;
}

/* Parsed against a base so a relative path resolves rather than throwing, and
   so the parser — not a regular expression — decides where the scheme ends.
   Every trick for hiding one relies on a hand-rolled parse disagreeing with
   the browser's. Returns the resolved URL as well as its scheme, because a
   protocol-relative `//host/path` is a different origin and the caller should
   be handed the absolute form it actually resolves to. */
function parse(value) {
  try {
    const url = new URL(value, "https://mockups.gatorsys.xyz");
    return { protocol: url.protocol, href: url.href };
  } catch {
    return null;
  }
}

/**
 * A URL safe to put in an `href`, or `null`.
 *
 * `null` rather than a placeholder: the caller renders the text without a link
 * rather than a link that goes nowhere, because a dead link is a thing people
 * click twice.
 */
export function safeUrl(value) {
  if (typeof value !== "string") return null;
  const cleaned = normalise(value);
  if (!cleaned) return null;
  // An in-page anchor is not a navigation and has no scheme to check.
  if (cleaned.startsWith("#")) return cleaned;
  if (SAME_ORIGIN.test(cleaned)) return cleaned;
  const parsed = parse(cleaned);
  if (!parsed || !LINK_SCHEMES.has(parsed.protocol)) return null;
  /* The resolved form, not what was passed in. A protocol-relative
     `//host/path` is a link to another origin, and returning it as written
     would leave the caller holding a string whose destination depends on where
     it is used. */
  return parsed.href;
}

/** A URL safe to load media from, or `null`. */
export function safeMedia(value) {
  if (typeof value !== "string") return null;
  /* A data URI is checked before normalising: base64 legitimately contains no
     control characters, but it is long, and running a regex over a megabyte of
     it to find that out is work the prefix test has already settled. */
  const trimmed = value.trim();
  if (DATA_MEDIA.test(trimmed)) return trimmed;
  if (trimmed.startsWith("data:")) return null;

  const cleaned = normalise(trimmed);
  if (!cleaned) return null;
  if (SAME_ORIGIN.test(cleaned)) return cleaned;
  const parsed = parse(cleaned);
  return parsed && MEDIA_SCHEMES.has(parsed.protocol) ? parsed.href : null;
}

/** Whether a value is an acceptable media reference. Used by the validator, so
 *  a project carrying a hostile one is refused at the door as well as
 *  neutralised at the point of rendering. */
export const isSafeMedia = (value) => !value || safeMedia(value) !== null;

/** The same, for links. */
export const isSafeUrl = (value) => !value || safeUrl(value) !== null;
