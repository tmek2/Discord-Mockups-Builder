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
- **JSON both ways.** Copy the payload a bot would send, or paste one in and
  the mockup rebuilds from it — content, embeds with fields, containers,
  sections, galleries, separators, files, button rows and select menus. Works
  with a webhook body, a bot payload or a Discohook export.
- **Export.** A PNG at up to 3×, the project file, or the message JSON.
- **Backups, in three tiers.** The working copy is written to the browser on
  every change and restored when you come back. Named backups are copies you
  make on purpose. Automatic snapshots are taken while you work and pruned to
  the last twelve, so "I pasted over everything" is recoverable. Sign in and a
  copy is kept on the deployment as well — the only one that survives a cleared
  browser or a different machine.
- **Share links.** A fragment link carries the whole mockup after the `#`,
  which browsers never send anywhere, so nothing leaves the two people who have
  it. Past about 28k it becomes a short link with a week's expiry instead,
  which is also the one you can read out.

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
| `REDIS_URL` | for cloud backup and short links | The same Redis the rest of Gator uses. This is the recommended store — see below. |
| `MONGODB_URI` | alternative to Redis | Only used when `MONGODB_COLLECTION` is also set. |
| `MONGODB_COLLECTION` | with `MONGODB_URI` | The name of an **existing** collection to share. Nothing is created. |
| `MONGODB_DB` | no | Database name. Defaults to the one in the connection string. |

The Discord application needs
`https://mockups.gatorsys.xyz/api/auth/callback/discord` in its OAuth redirects
(and `http://localhost:3000/api/auth/callback/discord` for local work). The
only scope asked for is `identify` — a mockup belongs to a person, not to a
server, so `guilds` would be asking for something never read.

## Where the cloud copy lives

The Gator cluster is at its collection ceiling, and Atlas counts collections
*and* indexes together toward one recommended maximum — so "just add a small
collection" costs a collection plus every index it would need. This app asks
for none of that.

**Redis is the default store**, and the one to use. It is the same instance the
site already runs for its own caching, it costs nothing in Mongo, and it is the
right shape for the job: the values are opaque blobs fetched by exact key.
Everything is namespaced under `gm:` so it cannot collide with anything else in
there, listing is one ordered range read rather than a `SCAN` over a keyspace
shared with the bot, and share links get a real TTL instead of a sweeper.

**Mongo is supported and still adds no collection.** Set `MONGODB_COLLECTION`
to a collection that already exists and everything goes in there: every
document written carries `_gm: 1` and every query filters on it, so this app
cannot read, count or delete anything it did not write, and whatever owns that
collection keeps working because its queries never ask for `_gm`. No index is
created either — the queries are all "one owner" or "one share id" over a set
kept small by the per-account cap.

Either way, projects are stored **Brotli-compressed** — a mockup is JSON full
of repeated keys with base64 images in it, which compresses about 95%, so a
5 KB project is 264 bytes on the wire and in storage. Each account keeps its 60
most recent cloud copies; older ones fall off rather than newer ones being
refused, because somebody at the cap is still working and the save they just
made is the one they care about.

None of it is the primary copy. The browser holds the working copy and the
backups; this is the second one, and every path degrades to "no cloud" rather
than failing a save.

## Layout

```
src/
  app/           `/` is the builder, `/s/[id]` a shared mockup, plus the API
  components/ui  Gator's own components, copied from gatorsys.xyz unchanged
  gator/         the design system: tokens, header, appearance, indicator
  discord/       the renderer — markdown, messages, embeds, components, chrome
  editor/        the builder — block tree, inspector, panels, JSON, exports
  lib/           the project model, validation, storage, backups, templates
```

There is no landing page. The builder is the site.

`src/components/ui` is copied out of `gatorsys.xyz/src/components/ui` with the
TypeScript stripped and nothing else changed — same Radix primitives, same
markup, same Tailwind classes. `--gator-*` is bridged to the landing palette in
`src/gator/tokens.css`, so a newer version of one of those components can be
copied across without edits.

`DESIGN-SOURCES.md` records where the Discord values come from and what has
been measured rather than guessed.

## Licensing

The Discord surface is drawn from Discord's public client values and its
component documentation; Discord's trademarks and its gg sans typeface are not
redistributed here. The canvas is set in Inter (SIL OFL) and emoji come from
the Twemoji fork (CC-BY 4.0 for the artwork).
