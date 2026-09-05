"use client";

/* Emoji, as images, with the character behind them.
 *
 * Discord ships Twemoji rather than using the platform's emoji font, which is
 * why the same message looks identical on Windows, macOS and Android inside
 * the client and different everywhere else. Matching that is the whole reason
 * these are images.
 *
 * But an image can fail — offline, a proxy that blocks the CDN, a network that
 * is simply slow — and an emoji that fails to load is a broken-image glyph in
 * the middle of a sentence, which is worse than the platform font would have
 * been. So a failure falls back to the character itself. The picture is a
 * little less faithful and remains completely readable, which is the right way
 * round.
 */

import { useContext, useState } from "react";
import { RenderContext } from "./context";
import { twemojiUrl } from "./emoji";

/** One Unicode emoji: the Twemoji asset, falling back to the character. */
export function Twemoji({ text, className = "", jumbo = false }) {
  const [failed, setFailed] = useState(false);
  const cls = `dc-emoji${jumbo ? " dc-emoji-jumbo" : ""} ${className}`;

  if (failed) {
    return (
      <span className={`${cls} dc-emoji-native`} role="img" aria-label={text}>
        {text}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={cls}
      src={twemojiUrl(text)}
      alt={text}
      draggable={false}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/** One emoji in a slot that holds nothing else: a button's leading position, a
 *  reaction, a poll answer. Resolves a custom `:name:` against the project's
 *  uploaded set before treating the text as Unicode. */
export function Emoji({ text, className = "" }) {
  const { emojis } = useContext(RenderContext);
  if (!text) return null;

  const custom = /^<?a?:?(\w+):?\d*>?$/.exec(text.trim());
  const named = custom ? emojis?.find((e) => e.name === custom[1]) : null;
  if (named?.src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`dc-emoji ${className}`} src={named.src} alt={`:${named.name}:`} draggable={false} />;
  }

  // A data URI or an https URL pasted straight in is used as-is.
  if (/^(data:|https?:)/.test(text.trim())) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`dc-emoji ${className}`} src={text.trim()} alt="" draggable={false} />;
  }

  return <Twemoji text={text.trim()} className={className} />;
}
