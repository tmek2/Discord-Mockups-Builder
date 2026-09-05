"use client";

/* Reactions.
 *
 * Two states, and the difference is not only the colour: a reaction you have
 * added takes the blurple fill and a one-pixel blurple border, which makes the
 * pill sit a hair larger than its neighbours. Burst reactions — Discord's
 * super reactions — take the pink and a sparkle, and are the one case where
 * the count is drawn in the accent rather than in muted text.
 */

import { Emoji } from "./emoji-node";

export function Reactions({ reactions = [] }) {
  if (!reactions.length) return null;
  return (
    <div className="dc-reactions">
      {reactions.map((r) => (
        <span
          key={r.id}
          className={`dc-reaction${r.me ? " dc-reaction-me" : ""}${r.burst ? " dc-reaction-burst" : ""}`}
        >
          <Emoji text={r.src || r.emoji} className="dc-reaction-emoji" />
          <span className="dc-reaction-count">{r.count}</span>
        </span>
      ))}
      <span className="dc-reaction dc-reaction-add" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M9 10h.01M15 10h.01M8.5 14a4.5 4.5 0 0 0 7 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  );
}
