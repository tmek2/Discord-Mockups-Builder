"use client";

/* Components v2, as the client draws them.
 *
 * The tree is the message body: a container is a block like any other, so text
 * and buttons can sit beside one at the top level instead of being swept into
 * it. That is how Discord's own component tree is shaped, and getting it wrong
 * is what makes a builder box a line of text the moment you add a button to it.
 *
 * Nothing here does anything when pressed. A mockup is a picture of a message,
 * and a button that navigates or a select that opens is a button that is
 * lying about what the exported PNG shows. They take the client's hover and
 * active states and stop there.
 */

import { Markdown } from "./markdown";
import { Emoji } from "./emoji-node";
import { FileCard, GalleryGrid } from "./media";

/* Discord's five button styles plus the premium one, which is the only button
 * whose label the client draws itself. */
const STYLE_CLASS = {
  primary: "dc-btn-primary",
  secondary: "dc-btn-secondary",
  success: "dc-btn-success",
  danger: "dc-btn-danger",
  link: "dc-btn-secondary dc-btn-link",
  premium: "dc-btn-premium",
};

export function Button({ button }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className={`dc-btn ${STYLE_CLASS[button.style] ?? STYLE_CLASS.secondary}`}
      disabled={button.disabled}
      onClick={(e) => e.preventDefault()}
    >
      {button.emoji ? <Emoji text={button.emoji} className="dc-btn-emoji" /> : null}
      <span className="dc-btn-label">{button.label || "Button"}</span>
      {button.style === "link" ? (
        <svg className="dc-btn-out" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6v6M20 4l-9 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  );
}

function ButtonRow({ block }) {
  return (
    <div className="dc-action-row">
      {(block.buttons ?? []).map((button) => (
        <Button key={button.id} button={button} />
      ))}
    </div>
  );
}

/* The four resolved select menus draw a fixed placeholder with an icon rather
 * than a list, because their options come from the server. The string menu is
 * the only one whose options the message carries. */
const SELECT_ICON = {
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0",
  role: "M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4Z",
  channel: "M9 4 7 20M17 4l-2 16M4 9h16M3 15h16",
  mentionable: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0",
};

function Select({ block }) {
  const resolved = block.kind && block.kind !== "string";
  return (
    <div className="dc-action-row">
      <div className={`dc-select${block.disabled ? " dc-select-disabled" : ""}`}>
        {resolved ? (
          <svg className="dc-select-kind" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d={SELECT_ICON[block.kind]} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : null}
        {/* A menu that takes more than one answer says so instead of showing
            its placeholder — the client replaces the line rather than adding
            to it, which is the visible difference between the two menus. */}
        <span className="dc-select-placeholder">
          {(block.maxValues ?? 1) > 1
            ? `Select up to ${Math.min(block.maxValues, (block.options ?? []).length || block.maxValues)}`
            : block.placeholder || "Make a selection"}
        </span>
        <svg className="dc-select-caret" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m7 10 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* A section is one to three lines of text with an accessory pinned right: a
 * thumbnail, or a single button. */
function Section({ block }) {
  const accessory = block.accessory ?? {};
  return (
    <div className="dc-section">
      <div className="dc-section-text">
        <Markdown text={block.content || ""} jumbo={false} />
      </div>
      {accessory.kind === "button" ? (
        <div className="dc-section-accessory">
          <Button button={accessory} />
        </div>
      ) : accessory.src ? (
        <span className={`dc-section-thumb-slot${accessory.spoiler ? " dc-media-spoiler" : ""}`}>
          <img className="dc-section-thumb" src={accessory.src} alt={accessory.alt || ""} draggable={false} />
          {accessory.spoiler ? <span className="dc-spoiler-tag">Spoiler</span> : null}
        </span>
      ) : null}
    </div>
  );
}

/* A separator is either a rule or blank space, at one of two heights. The
 * client's "large" is roughly double, and a separator with the divider off is
 * spacing and nothing else — which is the whole reason the flag exists. */
function Separator({ block }) {
  return (
    <div
      className={`dc-separator dc-separator-${block.spacing || "small"}${
        block.divider === false ? " dc-separator-blank" : ""
      }`}
      aria-hidden="true"
    />
  );
}

/* The accent stripe is on the left and the whole box is rounded, which is
 * what separates a container from an embed at a glance: an embed's stripe is
 * 4px against a 4px radius, a container's box is 8px and the stripe follows
 * it. A spoilered container is drawn covered, the way it arrives. */
function Container({ block }) {
  return (
    <div
      className={`dc-container${block.spoiler ? " dc-container-spoiler" : ""}`}
      style={{ borderLeftColor: block.color && block.color !== "none" ? block.color : "transparent" }}
    >
      <div className="dc-container-inner">
        <Blocks blocks={block.blocks ?? []} nested />
      </div>
      {block.spoiler ? <span className="dc-spoiler-tag">Spoiler</span> : null}
    </div>
  );
}

const RENDERERS = {
  text: ({ block }) => (
    <div className="dc-text-display">
      <Markdown text={block.content || ""} />
    </div>
  ),
  section: Section,
  gallery: ({ block }) => <GalleryGrid items={block.items ?? []} />,
  separator: Separator,
  buttons: ButtonRow,
  select: Select,
  file: ({ block }) => <FileCard file={block} />,
  container: Container,
};

export function Blocks({ blocks = [], nested = false }) {
  return (
    <div className={`dc-blocks${nested ? " dc-blocks-nested" : ""}`}>
      {blocks.map((block) => {
        const Renderer = RENDERERS[block.type];
        if (!Renderer) return null;
        return <Renderer key={block.id} block={block} />;
      })}
    </div>
  );
}
