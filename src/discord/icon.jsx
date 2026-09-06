/* Discord's own icons.
 *
 * Every glyph the mockup draws comes from the community icon library rather
 * than from a hand-drawn path or an emoji standing in for one. The point of
 * this tool is that a picture of a message is indistinguishable from a
 * screenshot, and an approximated GIF button is exactly the sort of thing that
 * gives one away.
 *
 * They arrive as one 44KB atlas instead of 116 files. A canvas draws forty of
 * them at a time and a busy mockup draws the same twenty over and over, so
 * separate files would mean a request, a decode and a GPU texture each, for
 * artwork that never changes. The atlas is one of each, cached across every
 * mockup the tool ever renders.
 *
 * Most of them are monochrome, which is deliberate on Discord's part: the
 * client tints one asset for the muted state of a composer button, the white
 * of a hovered one and the red of a destructive menu row. A CSS mask does the
 * same here, so `currentColor` reaches a PNG. The rest -- a ban hammer, a GIF
 * badge, a HypeSquad crest -- are artwork, and the atlas manifest records
 * which is which rather than keeping a list here that drifts.
 */

import ATLAS from "./atlas.json";

/* The atlas is scaled so this tile's longer side lands on `size`, then slid so
 * the tile is the part showing through the element's box. Percentages would be
 * shorter and would also assume every tile is the same size, which they are
 * not -- a status badge is taller than it is wide. */
function place(tile, size) {
  const f = size / Math.max(tile.w, tile.h);
  return {
    "--dc-atlas-size": `${ATLAS.width * f}px ${ATLAS.height * f}px`,
    "--dc-atlas-pos": `${(size - tile.w * f) / 2 - tile.x * f}px `
      + `${(size - tile.h * f) / 2 - tile.y * f}px`,
    width: size,
    height: size,
  };
}

function Tile({ group, name, size, className, title }) {
  const tile = ATLAS.tiles[group]?.[name];
  if (!tile) return null;
  return (
    <span
      className={`dc-icon ${tile.flat ? "dc-icon-mask" : "dc-icon-art"}`
        + (className ? ` ${className}` : "")}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
      title={title}
      style={place(tile, size)}
    />
  );
}

export function Icon({ name, size = 20, className = "", title }) {
  return <Tile group="icons" name={name} size={size} className={className} title={title} />;
}

/** A profile badge, a status dot or a server tag -- same atlas, other shelves. */
export function Art({ group, name, size = 22, className = "", title }) {
  return <Tile group={group} name={name} size={size} className={className} title={title} />;
}

export function hasIcon(name) {
  return Boolean(ATLAS.tiles.icons[name]);
}
