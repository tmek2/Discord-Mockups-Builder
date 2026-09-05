"use client";

/* Picking an emoji.
 *
 * Two shapes, because there are two jobs. `EmojiSlot` is for a field that
 * holds exactly one emoji — a button's leading glyph, a reaction, a poll
 * answer — where the picker replaces whatever is there. `EmojiInsert` is for
 * a body of text, where it has to go in at the caret and leave the caret after
 * it, so that typing continues where it was rather than at the end.
 *
 * The picker itself is loaded on first open. It carries its own emoji index
 * and is a good deal larger than the rest of the editor's chrome put together;
 * paying for that on a page somebody may never open it on would be the whole
 * cost of the feature for none of the use.
 */

import { Suspense, lazy, useCallback, useState } from "react";
import { IconMoodSmile } from "@tabler/icons-react";
import "./emoji-picker.css";

const Picker = lazy(() => import("emoji-picker-react"));

function Popover({ open, onClose, onPick, align = "end" }) {
  if (!open) return null;
  return (
    <>
      {/* A backdrop rather than a document listener, so the click that closes
          the picker does not also press whatever is underneath it. */}
      <button type="button" className="e-emoji-scrim" aria-label="Close" onClick={onClose} />
      <div className="e-emoji-pop" data-align={align}>
        <Suspense fallback={<div className="e-emoji-loading">Loading emoji…</div>}>
          <Picker
            onEmojiClick={(picked) => {
              onPick(picked.emoji);
              onClose();
            }}
            /* The picker's own dark theme, always. It sits over the editor,
               which is dark by default, and its light theme on a dark panel is
               a white rectangle in the middle of the screen. */
            theme="dark"
            /* Twemoji, so the picker shows what the canvas will actually draw.
               The default is Apple's set, which would mean choosing one glyph
               and getting another — and on a tool whose whole output is a
               picture, that is the one mismatch that matters. */
            emojiStyle="twitter"
            width={320}
            height={380}
            lazyLoadEmojis
            skinTonesDisabled={false}
            previewConfig={{ showPreview: false }}
            searchPlaceHolder="Search"
          />
        </Suspense>
      </div>
    </>
  );
}

/** A field that holds one emoji, with a picker beside it. */
export function EmojiSlot({ value, onChange, placeholder = "🎟️" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="e-emoji-slot">
      <input
        className="e-input"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
      <button
        type="button"
        className="e-btn e-btn-quiet e-btn-icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="Pick an emoji"
        aria-expanded={open}
      >
        <IconMoodSmile size={16} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} onPick={onChange} />
    </div>
  );
}

/* Inserting into a body of text.
 *
 * The textarea is not owned by this component, so it is handed in by ref. The
 * caret is read before the insert and restored after it, one frame later —
 * React has re-rendered the textarea with the new value by then, and setting a
 * selection on the old one would be setting it on a value that no longer
 * exists. */
export function useEmojiInsert(ref, value, onChange) {
  return useCallback(
    (emoji) => {
      const el = ref.current;
      const start = el?.selectionStart ?? (value ?? "").length;
      const end = el?.selectionEnd ?? start;
      const next = `${(value ?? "").slice(0, start)}${emoji}${(value ?? "").slice(end)}`;
      onChange(next);
      window.requestAnimationFrame(() => {
        if (!el) return;
        el.focus();
        el.setSelectionRange(start + emoji.length, start + emoji.length);
      });
    },
    [onChange, ref, value],
  );
}

/** The picker button that sits over a text area. */
export function EmojiInsert({ onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="e-emoji-insert">
      <button
        type="button"
        className="e-icon-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Insert an emoji"
        aria-expanded={open}
      >
        <IconMoodSmile size={15} />
      </button>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        onPick={(emoji) => onPick(emoji)}
      />
    </span>
  );
}
