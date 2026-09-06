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
import { Icon } from "./icon";

/* The actions the client offers, in the order it draws them. Each is opt-in,
   because which ones appear depends on whose message it is and what you can do
   to it — a message you did not send has no pencil. The glyphs are Discord's
   own; they were hand-drawn paths, and a redrawn reply arrow is exactly the
   detail that gives a screenshot away. */
export const TOOLBAR_ACTIONS = [
  { id: "add-reaction", label: "Add reaction", icon: "add-reaction" },
  { id: "super-reaction", label: "Super reaction", icon: "super-reaction" },
  { id: "edit", label: "Edit", icon: "edit" },
  { id: "reply", label: "Reply", icon: "reply" },
  { id: "forward", label: "Forward", icon: "forward" },
  { id: "threads", label: "Create thread", icon: "threads" },
  { id: "apps", label: "Apps", icon: "apps" },
  { id: "translate", label: "Translate", icon: "translate" },
  { id: "speak", label: "Speak message", icon: "speak" },
  { id: "pins", label: "Pin", icon: "pins" },
  { id: "mark-unread", label: "Mark unread", icon: "mark-unread" },
  { id: "copy-link", label: "Copy message link", icon: "copy-link" },
  { id: "copy-text", label: "Copy text", icon: "copy-text" },
  { id: "code", label: "Copy as code", icon: "code" },
  { id: "delete", label: "Delete", icon: "delete" },
  { id: "more", label: "More", icon: "more" },
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
          <Icon name={action.icon} size={20} />
        </span>
      ))}
    </div>
  );
}
