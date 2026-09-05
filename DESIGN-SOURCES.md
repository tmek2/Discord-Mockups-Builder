# Gator Mockups design sources

The mockup renderer targets the Discord desktop message surface as checked on September 5, 2026. The surrounding editor is an original interface.

- Discord's current public client: https://discord.com/app. Its linked stylesheets were retrieved directly. `src/discord-tokens.css` contains the resolved chat, surface, text, mention, border, and control colors from the live theme definitions. Discord internally names Ash `theme-dark`, Dark `theme-darker`, and Onyx `theme-midnight`.
- The public client supplied the locally cached gg sans font files in `public/fonts`, including normal weights 400 through 800. The preview uses these rather than an approximate system font.
- Discord component reference: https://docs.discord.com/developers/components/reference. Used for component anatomy, sections, containers, gallery images, separators, button rows, and select menus.
- Discord appearance settings: https://support.discord.com/hc/en-us/articles/207260127-How-to-Change-Discord-Color-Themes-and-Customize-Appearance-Settings. Used to verify Light, Ash, Dark, and Onyx preset names.
- Maintained community UI kits inspected: https://github.com/skyra-project/discord-components and https://github.com/BF-GO/discord-message-kit. Their default palettes still use older Discord values, so they were used as structural references rather than copied wholesale.
- The avatar collection comes from the user-supplied SVG. Its 240 embedded images were extracted at their original 45px artwork bounds and bundled into the single `src/avatar-data.js` file for easier uploading.

Layout reference points: 40px circular avatars; 16px author/body font; 12px timestamps; 22px message header line-height; 56px avatar-to-body inset within the padded crop; 4px embed accent border; 4px embed corner radius; 8px field gap; 16px media top margin; 8px container radius. Embed surface and subtle border are taken from the live client rather than the old dark-gray embed palette.

Discord does not publish a comprehensive pixel-perfect layout specification for every client state. These sources establish concrete reference values, but do not prove that every possible mockup is identical to every Discord rollout, operating system, density setting, or feature. This is a local visual editor, not the Discord client. Custom spacing and mixed content remain intentionally editable.
