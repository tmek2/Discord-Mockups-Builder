/* Starting points.
 *
 * Not decoration: the fastest way to learn what a builder can draw is to open
 * something already drawn and take it apart, so each of these exists to
 * demonstrate a different surface rather than to be pretty. Between them they
 * use every block type, every button style, both message layouts and most of
 * the things a message can carry.
 */

import { avatarUrl } from "./avatars";
import { newCanvas, uid } from "./model";

const bot = () => ({
  id: "bot",
  name: "Gator",
  color: "#f7a8c4",
  avatar: avatarUrl(0),
  bot: true,
  badge: "APP",
  verified: true,
  status: "online",
});

const person = (name, i, color) => ({
  id: name.toLowerCase(),
  name,
  color,
  avatar: avatarUrl(i),
  bot: false,
  status: "online",
});

const base = (name, users, messages, canvas = {}) => ({
  version: 2,
  name,
  users,
  emojis: [],
  canvas: newCanvas(canvas),
  messages,
});

const msg = (user, over = {}) => ({
  id: uid(),
  user,
  kind: "message",
  content: "",
  timestamp: "Today at 10:00",
  embeds: [],
  components: [],
  attachments: [],
  reactions: [],
  ...over,
});

export const TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome message",
    hint: "An embed with fields, a button row and reactions.",
    build: () => {
      const b = bot();
      const rowan = person("Rowan", 37, "#5fd08a");
      return base("Welcome message", [b, rowan], [
        msg("bot", {
          content: "",
          timestamp: "Today at 09:00",
          embeds: [
            {
              id: uid(),
              color: "#f7a8c4",
              title: "Welcome to the server",
              description:
                "Read **#rules** before you post, then say hello in **#introductions**.\n\nIf you get stuck, open a ticket and somebody will be with you.",
              fields: [
                { id: uid(), name: "Getting started", value: "Pick your roles in #roles", inline: true },
                { id: uid(), name: "Need help?", value: "Open a ticket in #support", inline: true },
                { id: uid(), name: "Staff applications", value: "Open on the first of every month.", inline: false },
              ],
              footer: "Enjoy your stay",
              timestamp: "",
              thumbnail: "",
              image: "",
            },
          ],
          components: [
            {
              id: uid(),
              type: "buttons",
              buttons: [
                { id: uid(), label: "Server guide", style: "primary", emoji: "📘" },
                { id: uid(), label: "Get roles", style: "secondary", emoji: "🎭" },
                { id: uid(), label: "Documentation", style: "link", url: "https://docs.gatorsys.xyz" },
              ],
            },
          ],
          reactions: [
            { id: uid(), emoji: "👋", count: 24, me: true },
            { id: uid(), emoji: "🐊", count: 9 },
          ],
        }),
        msg("rowan", { content: "hey everyone 👋", timestamp: "Today at 09:02" }),
      ]);
    },
  },
  {
    id: "container",
    name: "Components v2 panel",
    hint: "A container with a section, a gallery, a separator and a select.",
    build: () => {
      const b = bot();
      return base("Components v2 panel", [b], [
        msg("bot", {
          timestamp: "Today at 12:15",
          components: [
            {
              id: uid(),
              type: "container",
              color: "#5865f2",
              blocks: [
                { id: uid(), type: "text", content: "# Support\nPick the queue that fits, and somebody will pick it up." },
                { id: uid(), type: "separator", divider: true, spacing: "small" },
                {
                  id: uid(),
                  type: "section",
                  content: "**General questions**\n-# Usually answered within the hour.",
                  accessory: { kind: "button", id: uid(), label: "Open", style: "secondary" },
                },
                {
                  id: uid(),
                  type: "section",
                  content: "**Report a member**\n-# Handled privately by staff.",
                  accessory: { kind: "button", id: uid(), label: "Open", style: "danger" },
                },
                { id: uid(), type: "separator", divider: false, spacing: "large" },
                {
                  id: uid(),
                  type: "select",
                  kind: "string",
                  placeholder: "Or choose a topic",
                  options: [
                    { id: uid(), label: "Billing", description: "Payments and invoices", emoji: "💳" },
                    { id: uid(), label: "Bug report", description: "Something is broken", emoji: "🐛" },
                    { id: uid(), label: "Something else", description: "", emoji: "" },
                  ],
                },
              ],
            },
          ],
        }),
      ]);
    },
  },
  {
    id: "conversation",
    name: "Conversation",
    hint: "Replies, grouping, edits, an image and a thread.",
    build: () => {
      const a = person("Rowan", 37, "#5fd08a");
      const c = person("Sky", 25, "#eb91b5");
      const first = msg("rowan", { content: "did anyone get the patrol log working?", timestamp: "Today at 14:02" });
      return base("Conversation", [a, c], [
        first,
        msg("sky", {
          content: "yeah — it needed the channel permission, not the role one",
          timestamp: "Today at 14:03",
          reply: first.id,
        }),
        msg("sky", { content: "took me an hour to spot 🙃", timestamp: "Today at 14:03", grouped: true, edited: true }),
        msg("rowan", {
          content: "oh that would do it. thanks!",
          timestamp: "Today at 14:05",
          reactions: [{ id: uid(), emoji: "🙏", count: 2 }],
          thread: { name: "Patrol log setup", count: 14 },
        }),
      ], { chrome: "chat" });
    },
  },
  {
    id: "poll",
    name: "Poll and media",
    hint: "A poll, an image gallery, a voice note and a file card.",
    build: () => {
      const a = person("Rowan", 37, "#5fd08a");
      return base("Poll and media", [a], [
        msg("rowan", {
          timestamp: "Today at 18:30",
          content: "when are we running the next session?",
          poll: {
            question: "Next session",
            answers: [
              { id: uid(), text: "Friday evening", emoji: "🌙", votes: 14 },
              { id: uid(), text: "Saturday afternoon", emoji: "☀️", votes: 9 },
              { id: uid(), text: "Sunday, same as always", emoji: "🗓️", votes: 21 },
            ],
            total: 44,
            duration: "2 days left",
            multiple: false,
            finished: false,
          },
        }),
        msg("rowan", {
          timestamp: "Today at 18:31",
          grouped: true,
          voice: { duration: "0:14", progress: 0.4 },
        }),
      ]);
    },
  },
  {
    id: "system",
    name: "System messages",
    hint: "Joins, boosts, pins and a date divider.",
    build: () => {
      const a = person("Rowan", 37, "#5fd08a");
      const c = person("Sky", 25, "#eb91b5");
      const sys = (user, systemType, timestamp) => ({
        ...msg(user, { timestamp }),
        kind: "system",
        systemType,
      });
      return base(
        "System messages",
        [a, c],
        [
          sys("rowan", "join", "Today at 08:14"),
          sys("sky", "join", "Today at 08:19"),
          sys("sky", "boost", "Today at 09:02"),
          sys("rowan", "pin", "Today at 09:40"),
          msg("rowan", { content: "morning", timestamp: "Today at 09:41" }),
        ],
        { showDateDivider: true, dateLabel: "Today" },
      );
    },
  },
  {
    id: "interaction",
    name: "Slash command response",
    hint: "A command header, an ephemeral reply and a select menu.",
    build: () => {
      const b = bot();
      const a = person("Rowan", 37, "#5fd08a");
      return base("Slash command response", [b, a], [
        msg("bot", {
          timestamp: "Today at 11:20",
          interaction: { user: "rowan", command: "shift start" },
          ephemeral: true,
          components: [
            {
              id: uid(),
              type: "container",
              color: "#00863a",
              blocks: [
                { id: uid(), type: "text", content: "### Shift started\nYou are on the board as of **11:20**." },
                { id: uid(), type: "separator", divider: true, spacing: "small" },
                { id: uid(), type: "text", content: "-# End it with `/shift end`, or press the button." },
                {
                  id: uid(),
                  type: "buttons",
                  buttons: [
                    { id: uid(), label: "End shift", style: "danger" },
                    { id: uid(), label: "Take a break", style: "secondary", emoji: "☕" },
                  ],
                },
              ],
            },
          ],
        }),
      ]);
    },
  },
  {
    id: "mobile",
    name: "Phone layout",
    hint: "The same message drawn the way the mobile client stacks it.",
    build: () => {
      const b = bot();
      const a = person("Rowan", 37, "#5fd08a");
      return base(
        "Phone layout",
        [b, a],
        [
          msg("bot", {
            timestamp: "Today at 07:05",
            embeds: [
              {
                id: uid(),
                color: "#f7a8c4",
                title: "Morning briefing",
                description: "Three units on shift, one ticket open overnight.",
                fields: [
                  { id: uid(), name: "On duty", value: "Rowan, Sky, Ash", inline: true },
                  { id: uid(), name: "Open tickets", value: "1", inline: true },
                ],
                footer: "Updated every morning at 07:00",
              },
            ],
            components: [
              {
                id: uid(),
                type: "buttons",
                buttons: [
                  { id: uid(), label: "Take the ticket", style: "success" },
                  { id: uid(), label: "Full report", style: "secondary" },
                ],
              },
            ],
          }),
          msg("rowan", { content: "on it", timestamp: "Today at 07:11" }),
        ],
        { platform: "mobile", chrome: "chat", width: 400 },
      );
    },
  },
];
