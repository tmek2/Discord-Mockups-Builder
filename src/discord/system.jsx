"use client";

/* System messages.
 *
 * The client draws these on one line with a small glyph in the avatar gutter
 * rather than an avatar, in muted text, with the actor's name in full-contrast
 * ink. They are not styled messages — they have a different grid, no author
 * line and no timestamp column — which is why they are their own component
 * rather than a flag on the ordinary one.
 */

import { Icon } from "./icon";
import { Markdown } from "./markdown";

/* The glyph for each kind, and the sentence the client writes. `%s` is the
 * actor's name, which is drawn in full-contrast ink inside an otherwise muted
 * line — so the sentence is split around it rather than interpolated. */
const KINDS = {
  join: {
    tint: "var(--dc-green)",
    icon: "join-arrow",
    before: "",
    after: " joined the party.",
  },
  leave: {
    tint: "var(--dc-red)",
    icon: "leave-arrow",
    before: "",
    after: " left the server.",
  },
  add: {
    tint: "var(--dc-green)",
    icon: "join-arrow",
    before: "",
    after: " added someone to the group.",
  },
  boost: {
    tint: "var(--dc-boost)",
    icon: "boost",
    before: "",
    after: " just boosted the server!",
  },
  pin: {
    tint: "var(--text-muted)",
    icon: "pins",
    before: "",
    after: " pinned a message to this channel.",
  },
  thread: {
    tint: "var(--text-muted)",
    icon: "threads",
    before: "",
    after: " started a thread.",
  },
  call: {
    tint: "var(--dc-green)",
    icon: "call",
    before: "",
    after: " started a call.",
  },
  follow: {
    tint: "var(--text-muted)",
    icon: "megaphone",
    before: "",
    after: " has added a channel to this one.",
  },
};

export function SystemMessage({ message, user, selected, onSelect }) {
  const kind = KINDS[message.systemType] ?? KINDS.join;

  return (
    <article
      className={`dc-system${selected ? " dc-selected" : ""}`}
      onClick={onSelect}
      /* Same as a real message: clickable on the canvas means reachable from
         the keyboard. */
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? Boolean(selected) : undefined}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(event);
              }
            }
          : undefined
      }
      data-id={message.id}
    >
      <span className="dc-system-glyph" style={{ color: kind.tint }} aria-hidden="true">
        <Icon name={kind.icon} size={18} />
      </span>
      <span className="dc-system-text">
        {kind.before}
        <strong className="dc-system-actor" style={user?.color ? { color: user.color } : undefined}>
          {user?.name ?? "Someone"}
        </strong>
        {/* An override is what makes a boost tier line or a custom join
            message possible without a kind for each one. */}
        {message.content ? (
          <span className="dc-system-custom">
            <Markdown text={message.content} jumbo={false} />
          </span>
        ) : (
          kind.after
        )}
        <time className="dc-system-time">{message.timestamp}</time>
      </span>
    </article>
  );
}

/* The date rule between one day's messages and the next. */
export function DateDivider({ label }) {
  return (
    <div className="dc-divider">
      <span className="dc-divider-label">{label}</span>
    </div>
  );
}

/* The red rule the client leaves at the last message you read. */
export function NewDivider() {
  return (
    <div className="dc-divider dc-divider-new">
      <span className="dc-divider-label">NEW</span>
    </div>
  );
}
