/* The message on the front page.
 *
 * A real project run through the real renderer rather than a screenshot, so it
 * cannot drift from what the tool actually draws — if a container's radius
 * changes, the picture on the landing changes with it.
 */

import { avatarUrl } from "./avatars";
import { newCanvas } from "./model";

const bot = {
  id: "u1",
  name: "Gator",
  color: "#f7a8c4",
  avatar: avatarUrl(0),
  bot: true,
  badge: "APP",
  verified: true,
  status: "online",
};

const member = {
  id: "u2",
  name: "Rowan",
  color: "#5fd08a",
  avatar: avatarUrl(37),
  status: "online",
};

export const SHOWCASE = {
  version: 2,
  name: "Showcase",
  users: [bot, member],
  emojis: [],
  canvas: newCanvas({ theme: "ash", chrome: "none", padding: 18 }),
  messages: [
    {
      id: "s1",
      user: "u1",
      kind: "message",
      content: "",
      timestamp: "Today at 09:41",
      components: [
        {
          id: "c1",
          type: "container",
          color: "#f7a8c4",
          blocks: [
            { id: "c1a", type: "text", content: "## Shift 14 is open\nSign on before **10:30** and your hours count toward this week's total." },
            { id: "c1b", type: "separator", divider: true, spacing: "small" },
            {
              id: "c1c",
              type: "section",
              content: "-# Patrol · Sector 4\nTwo units on the board, four seats left.",
              accessory: { kind: "button", id: "c1cb", label: "Sign on", style: "success" },
            },
            { id: "c1d", type: "separator", divider: false, spacing: "small" },
            {
              id: "c1e",
              type: "buttons",
              buttons: [
                { id: "b1", label: "Roster", style: "primary", emoji: "📋" },
                { id: "b2", label: "Request leave", style: "secondary" },
                { id: "b3", label: "Handbook", style: "link", url: "https://docs.gatorsys.xyz" },
              ],
            },
          ],
        },
      ],
      embeds: [],
      attachments: [],
      reactions: [
        { id: "r1", emoji: "✅", count: 12, me: true },
        { id: "r2", emoji: "🐊", count: 4 },
      ],
    },
    {
      id: "s2",
      user: "u2",
      kind: "message",
      content: "signed on 🫡",
      timestamp: "Today at 09:42",
      reply: "s1",
      embeds: [],
      components: [],
      attachments: [],
      reactions: [],
    },
  ],
};
