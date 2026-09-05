# Design sources

Two design systems meet in this app, and they are kept deliberately separate.

The **editor** is Gator. It uses the same tokens, type, controls and appearance
system as the 2026 landing page on gatorsys.xyz, so the tool around the mockup
reads as part of the same product.

The **canvas** is Discord, and only Discord. Nothing from the Gator palette
reaches inside it. A mockup that is 90% accurate is a mockup somebody has to
apologise for, so the surface is built from the client's own values rather than
from an approximation of them.

## The Discord surface

- **Colour tokens.** `src/discord/tokens.css` holds the resolved chat, surface,
  text, mention, border and control colours for all four appearances, taken
  from the theme definitions in the public desktop client (checked 5 September
  2026). Discord names them internally: Ash is `theme-dark`, Dark is
  `theme-darker`, Onyx is `theme-midnight`. Every value is written through
  `--saturation-factor`, which is Discord's own hook for the accessibility
  setting that desaturates the client — it is left at 1 here, but the tokens
  are shaped so the control could be exposed without touching a colour.
- **Component anatomy.** Discord's component reference
  (<https://docs.discord.com/developers/components/reference>) for containers,
  sections, text displays, media galleries, files, separators, action rows and
  the five select-menu types, along with the limits shown as counters in the
  editor.
- **Appearance names.** Discord's own support article on colour themes, for the
  Light / Ash / Dark / Onyx naming.
- **Community kits inspected**, for structure rather than for values:
  [skyra-project/discord-components](https://github.com/skyra-project/discord-components)
  and [BF-GO/discord-message-kit](https://github.com/BF-GO/discord-message-kit).
  Both still carry the pre-2024 palette, where the chat ground was `#36393f`
  and an embed was a flat dark grey, so neither was copied.
- **Emoji.** Discord ships Twemoji rather than using the platform's emoji font,
  which is why a message looks identical on every operating system inside the
  client. The same asset set is used here, from the maintained fork
  ([jdecked/twemoji](https://github.com/jdecked/twemoji)) over jsDelivr, pinned
  to a version rather than to `latest` so an upstream release cannot change a
  mockup that has already been exported. If the CDN cannot be reached the
  renderer falls back to the character itself.

### Measured layout values

40px avatars; a 56px inset from the avatar's left edge to the message body;
16px content at a 1.375 line height; 12px timestamps on a 22px header line; a
17px gap above a new message and 0 above a grouped one; a 4px accent on an
embed at a 4px radius and an 8px one on a container; 8px between embed fields;
a twelve-column field grid, so two inline fields on a row take six columns each
rather than four; 16px above embed media.

Discord publishes no pixel-perfect specification for every client state. These
sources establish concrete reference values; they do not prove that every
possible mockup matches every rollout, operating system, density setting or
feature flag. This is a visual editor, not the Discord client, and custom
spacing and mixed content stay intentionally editable.

## The editor

- **Tokens, appearance, header and controls** are ported from the 2026 landing
  page in the `gatorsys.xyz` repository (`src/components/landing2`): the
  palette, the two-appearance system with its three settings, the travelling
  nav blob, the cycling appearance block with its view-transition wipe, the
  ripple button and the hover label.
- **The block tree** follows the message designer in the Gator dashboard
  (`src/components/Manage/message-design.tsx`): the same add / nest / collapse /
  duplicate / reorder grammar and the same rule that a container is a block like
  any other rather than a wrapper around everything. What is missing is
  deliberate — the dashboard wires a button to a ticket panel, a form or a flow
  because a bot has to run it. Here a button is a label, a colour and an emoji.
  Nothing in this app sends anything.

## Type

Discord's face is gg sans, which is licensed to Discord and cannot be
redistributed with a deployment. The canvas is set in **Inter** (SIL Open Font
License, via Google Fonts): the same humanist grotesque skeleton, the same tall
x-height, and metrics near enough that a message wraps where the client wraps
it. Noto Sans follows it in the stack because that is the fallback Discord's
own stylesheet names.

The editor is set in **Nunito**, with **Merriweather** for display type — the
two faces the rest of Gator uses.

## Avatars

The 240 default avatars in `public/avatars` are drawn from the collection
supplied with the project, at their original 45px artwork bounds. They are
files rather than base64 inlined into a module, so the browser fetches only the
ones it draws and the picker can lazy-load.
