/* The bar that appears over a message when you point at it.
 *
 * Drawn, not wired — like every other control in a mockup. It is here because
 * it is in almost every screenshot anybody takes of a Discord message, and a
 * mockup without it reads as a message nobody was looking at.
 *
 * Two zones, and the split is the whole design. The leading zone is the
 * quick reactions: whatever emoji you use most, in colour, straight from the
 * picker. The trailing zone is the actions, which are monochrome icons the
 * client draws from a fixed set. So where a button sits decides what it looks
 * like — an emoji in the first zone, a grey glyph in the second — which is
 * exactly how the client behaves and why the two are not one list.
 */

import { Emoji } from "./emoji-node";

const S = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none" };
const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

/* The actions the client offers, in the order it draws them. Each is opt-in,
   because which ones appear depends on whose message it is and what you can do
   to it — a message you did not send has no pencil. */
export const TOOLBAR_ACTIONS = [
  {
    id: "add-reaction",
    label: "Add reaction",
    icon: (
      <svg {...S}>
        <circle cx="12" cy="12" r="9" {...stroke} />
        <path d="M9 10h.01M15 10h.01M8.5 14.5a4.5 4.5 0 0 0 7 0" {...stroke} />
      </svg>
    ),
  },
  {
    id: "mention",
    label: "Mention",
    icon: (
      <svg {...S}>
        <circle cx="12" cy="12" r="4" {...stroke} />
        <path d="M16 8v5a3 3 0 0 0 5 2 9 9 0 1 0-3 5" {...stroke} />
      </svg>
    ),
  },
  {
    id: "translate",
    label: "Translate",
    icon: (
      <svg {...S}>
        <path d="M3 6h9M7.5 6v-2M9.5 6c0 4-3 7-6.5 8" {...stroke} />
        <path d="M6 11c1.5 2 3.5 3.2 5.5 3.8" {...stroke} />
        <path d="m13 20 3.5-9 3.5 9M14.4 17h4.2" {...stroke} />
      </svg>
    ),
  },
  {
    id: "code",
    label: "Copy as code",
    icon: (
      <svg {...S}>
        <path d="m9 8-4 4 4 4M15 8l4 4-4 4" {...stroke} />
      </svg>
    ),
  },
  {
    id: "edit",
    label: "Edit",
    icon: (
      <svg {...S}>
        <path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Z" {...stroke} />
      </svg>
    ),
  },
  {
    id: "reply",
    label: "Reply",
    icon: (
      <svg {...S}>
        <path d="M10 9V5l-7 7 7 7v-4c4 0 7 1 9 4-1-6-4-9-9-10Z" {...stroke} />
      </svg>
    ),
  },
  {
    id: "forward",
    label: "Forward",
    icon: (
      <svg {...S}>
        <path d="M14 9V5l7 7-7 7v-4c-4 0-7 1-9 4 1-6 4-9 9-10Z" {...stroke} />
      </svg>
    ),
  },
  {
    id: "thread",
    label: "Create thread",
    icon: (
      <svg {...S}>
        <path d="M4 5h16v10H9l-5 4V5Z" {...stroke} />
      </svg>
    ),
  },
  {
    id: "more",
    label: "More",
    icon: (
      <svg {...S}>
        <circle cx="5" cy="12" r="1.6" fill="currentColor" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        <circle cx="19" cy="12" r="1.6" fill="currentColor" />
      </svg>
    ),
  },
];

const BY_ID = new Map(TOOLBAR_ACTIONS.map((a) => [a.id, a]));

export function HoverToolbar({ toolbar }) {
  const reactions = toolbar?.reactions ?? [];
  const actions = (toolbar?.actions ?? []).map((id) => BY_ID.get(id)).filter(Boolean);
  if (!reactions.length && !actions.length) return null;

  return (
    <div className="dc-hoverbar" aria-hidden="true">
      {reactions.map((emoji, i) => (
        <span className="dc-hoverbar-btn dc-hoverbar-emoji" key={`r${i}`}>
          <Emoji text={emoji} />
        </span>
      ))}
      {/* The client rules off the quick reactions from the actions, and only
          when it has both to separate. */}
      {reactions.length && actions.length ? <span className="dc-hoverbar-rule" /> : null}
      {actions.map((action) => (
        <span className="dc-hoverbar-btn" key={action.id} title={action.label}>
          {action.icon}
        </span>
      ))}
    </div>
  );
}
