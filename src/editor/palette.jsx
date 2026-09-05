"use client";

/* The command palette.
 *
 * Everything the toolbar can do and a good deal it cannot, behind one
 * shortcut. The reason a builder wants one is specific: most of what you do
 * here is a single verb applied to the selected thing, and hunting for that
 * verb in a panel costs more than typing three letters of it.
 *
 * Matching is a subsequence rather than a substring, so "expng" finds "Export
 * a PNG" — which is how anybody who uses one of these actually types.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useOverlay } from "./use-overlay";
import "./palette.css";

function matches(query, label) {
  if (!query) return true;
  const haystack = label.toLowerCase();
  let i = 0;
  for (const ch of query.toLowerCase()) {
    i = haystack.indexOf(ch, i);
    if (i === -1) return false;
    i += 1;
  }
  return true;
}

export function Palette({ open, actions, onClose }) {
  const { mounted, state } = useOverlay(open, 180);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const input = useRef(null);
  const list = useRef(null);

  const found = useMemo(() => actions.filter((a) => matches(query, a.label)), [actions, query]);

  useEffect(() => {
    if (state === "in") input.current?.focus();
  }, [state]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  // Keep the highlighted row on screen when the cursor is moved by keyboard.
  useEffect(() => {
    list.current?.querySelector('[data-on="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!mounted) return null;

  const run = (action) => {
    onClose();
    // After the close, so an action that opens another overlay is not closed
    // by the same click that opened it.
    window.setTimeout(() => action.run(), 0);
  };

  return (
    <div className="e-palette-scrim" data-state={state} onClick={onClose}>
      <div
        className="e-palette"
        data-state={state}
        role="dialog"
        aria-label="Commands"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor((c) => Math.min(found.length - 1, c + 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor((c) => Math.max(0, c - 1));
          }
          if (e.key === "Enter" && found[cursor]) {
            e.preventDefault();
            run(found[cursor]);
          }
        }}
      >
        <input
          ref={input}
          className="e-palette-input"
          value={query}
          placeholder="What do you want to do?"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search commands"
        />
        <ul className="e-palette-list" ref={list}>
          {found.length ? (
            found.map((action, i) => (
              <li key={action.label}>
                <button
                  type="button"
                  className="e-palette-row"
                  data-on={i === cursor ? "true" : "false"}
                  onPointerEnter={() => setCursor(i)}
                  onClick={() => run(action)}
                >
                  {action.label}
                </button>
              </li>
            ))
          ) : (
            <li className="e-palette-none">Nothing matches “{query}”.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
