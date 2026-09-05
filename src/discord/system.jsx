"use client";

/* System messages.
 *
 * The client draws these on one line with a small glyph in the avatar gutter
 * rather than an avatar, in muted text, with the actor's name in full-contrast
 * ink. They are not styled messages — they have a different grid, no author
 * line and no timestamp column — which is why they are their own component
 * rather than a flag on the ordinary one.
 */

import { Markdown } from "./markdown";

/* The glyph for each kind, and the sentence the client writes. `%s` is the
 * actor's name, which is drawn in full-contrast ink inside an otherwise muted
 * line — so the sentence is split around it rather than interpolated. */
const KINDS = {
  join: {
    tint: "var(--dc-green)",
    path: "M12 5v14m-7-7h14",
    before: "",
    after: " joined the party.",
  },
  leave: {
    tint: "var(--dc-red)",
    path: "M18 6 6 18M6 6l12 12",
    before: "",
    after: " left the server.",
  },
  add: {
    tint: "var(--dc-green)",
    path: "M12 5v14m-7-7h14",
    before: "",
    after: " added someone to the group.",
  },
  boost: {
    tint: "var(--dc-boost)",
    path: "m12 3 3 6 6 .9-4.5 4.2 1.1 6.4L12 17.4 6.4 20.5l1.1-6.4L3 9.9 9 9z",
    before: "",
    after: " just boosted the server!",
  },
  pin: {
    tint: "var(--text-muted)",
    path: "M15 3 9 9l-4 1 9 9 1-4 6-6zM5 19l4-4",
    before: "",
    after: " pinned a message to this channel.",
  },
  thread: {
    tint: "var(--text-muted)",
    path: "M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3V6a2 2 0 0 1 2-2z",
    before: "",
    after: " started a thread.",
  },
  call: {
    tint: "var(--dc-green)",
    path: "M6 3h3l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z",
    before: "",
    after: " started a call.",
  },
  follow: {
    tint: "var(--text-muted)",
    path: "M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16M5 19h.01",
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
      data-id={message.id}
    >
      <span className="dc-system-glyph" style={{ color: kind.tint }} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d={kind.path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
