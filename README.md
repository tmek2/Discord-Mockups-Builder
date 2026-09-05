# Gator Mockups

A visual builder for Discord messages. Embeds, Components v2 containers,
buttons, galleries, polls, system messages and every other surface the client
draws — laid out against the real chat ground, in all four of its appearances,
on desktop and on the phone.

Live at **[mockups.gatorsys.xyz](https://mockups.gatorsys.xyz)**.

## What it does

- **Every surface Discord draws.** Messages and grouped runs, replies, slash
  command headers, forwards, embeds, Components v2 (containers, sections, media
  galleries, separators, action rows, all five select types, files), polls,
  stickers, voice notes, attachments and file cards, invites, link previews,
  threads, reactions including super reactions, and the client's own system
  notices for joins, boosts, pins, threads and calls.
- **Discord's markdown, not GFM.** Headings, subtext (`-# `), quotes and block
  quotes, lists, spoilers, masked links, mentions, channels, custom emoji,
  timestamps (`<t:…:R>`), code spans and fences — with the underscore-italics
  rule that stops `snake_case_names` from going italic in the middle.
- **Four appearances and two clients.** Light, Ash, Dark and Onyx; desktop and
  phone. The phone is a second layout rather than the desktop one narrowed.
- **As much of the client as you want.** Messages alone, the channel with its
  header and message box, or the whole window with the server rail, the channel
  sidebar and the member list.
- **Export.** A PNG at up to 3×, the project file, the message JSON for a bot to
  send, or a share link that carries the whole mockup in its fragment and never
  reaches the server.
- **Saved as you type**, in the browser. Sign in with the same Discord account
  you use for Gator and it is backed up to the cloud as well.

## How it moves

Anything you can put a finger on is on a spring rather than a CSS transition,
because a transition cannot be grabbed: it runs from where it started to where
it was told to go, and interrupting it either queues behind it or cuts to a new
start value. A spring has a current value and a target, so re-aiming it
mid-flight is just changing the target and the motion stays continuous.

- **The canvas is grabbed, not scrolled.** Press anywhere and it tracks the
  pointer one-to-one; release and it carries on at the speed your hand had,
  decaying; press again and it stops dead under your finger. A press that does
  not travel is still a click that selects a message. Wheel and trackpad
  scrolling are untouched, and ⌘/ctrl + wheel zooms.
- **Messages are dragged to reorder.** Hover a row in the outline and a grip
  appears on its left; with a mouse the whole row is draggable, and on a touch
  screen the grip is the handle so that dragging the row still scrolls the
  list. The row hangs from where you grabbed it rather than snapping to its
  middle, the gap opens as you cross a neighbour so the outcome is visible
  before you let go, the list scrolls itself when you reach its edge, and the
  row springs into its slot. The ↑ ↓ buttons under the outline do the same job
  one step at a time and are the keyboard's way through.
- **Feedback is on the press, not the release.** Every control acknowledges a
  pointer-down on the frame it lands on.
- **Panels leave the way they arrived.** A sheet that springs in and vanishes
  is two different interfaces; the return path is what says where the thing
  went. Menus and popovers grow from the control that opened them.
- **Reduced motion is a gentler equivalent, not silence.** With
  `prefers-reduced-motion: reduce` the springs land on their targets directly,
  momentum is off, and travel becomes a cross-fade — every state change still
  reads. `prefers-reduced-transparency` makes the glass solid and
  `prefers-contrast: more` puts defined borders back.

`src/editor/motion.js` holds the spring, the momentum projection and the
rubber-band, with the reasoning for each. Damping `1` is the default — nothing
overshoots unless a gesture put the momentum there.

## Running it locally

```bash
npm install
npm run dev
```

Then open <http://127.0.0.1:3000>. Nothing below is required to draw and export
a mockup — without any environment at all the editor runs, saves locally and
exports; sign-in and cloud backup are what the variables switch on.

## Environment

**Nothing here is needed to deploy.** With no variables set at all the site
builds, the builder runs, autosaves to the browser and exports; the sign-in
button is simply not drawn and the backup panel says so. Add these when you
want the account and the cloud copy.

| Variable | Required | What it is |
| --- | --- | --- |
| `AUTH_SECRET` | for sign-in | Encrypts the session cookie. Generate with `openssl rand -base64 32`. |
| `AUTH_URL` | on custom domains | The deployment's own origin, e.g. `https://mockups.gatorsys.xyz`. |
| `DISCORD_CLIENT_ID` | for sign-in | The Discord application's client id. |
| `DISCORD_CLIENT_SECRET` | for sign-in | The Discord application's client secret. |
| `MONGODB_URI` | for cloud backup | A MongoDB connection string. Without it the editor still saves locally and says the backup is switched off. |
| `MONGODB_DB` | no | Database name. Defaults to `gator-mockups`. |

The Discord application needs
`https://mockups.gatorsys.xyz/api/auth/callback/discord` in its OAuth redirects
(and `http://localhost:3000/api/auth/callback/discord` for local work). The
only scope asked for is `identify` — a mockup belongs to a person, not to a
server, so `guilds` would be asking for something never read.

## Layout

```
src/
  app/          routes: the landing page, the builder, auth and the backup API
  gator/        the Gator design system: tokens, header, appearance, controls
  discord/      the renderer — markdown, messages, embeds, components, chrome
  editor/       the builder — block tree, inspector, panels, palette, exports
  lib/          the project model, validation, storage, templates
```

`DESIGN-SOURCES.md` records where the Discord values come from and what has
been measured rather than guessed.

## Licensing

The Discord surface is drawn from Discord's public client values and its
component documentation; Discord's trademarks and its gg sans typeface are not
redistributed here. The canvas is set in Inter (SIL OFL) and emoji come from
the Twemoji fork (CC-BY 4.0 for the artwork).
