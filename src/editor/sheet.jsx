"use client";

/* One sheet, four uses.
 *
 * Templates, members, appearance and backups are all the same shape: a thing
 * you open, do one job in, and close again. They were four different places —
 * one a real sheet, three of them panels that *replaced the inspector*, which
 * is why choosing "Members" made the message you were editing disappear.
 *
 * A sheet is the right container for all of them because none is where you
 * live: the message and its preview are, and those must stay on screen behind
 * whatever you opened.
 */

import { useEffect, useRef } from "react";
import { IconX } from "@tabler/icons-react";
import { useOverlay } from "./use-overlay";

export function Sheet({ open, onClose, title, subtitle, wide = false, children }) {
  const state = useOverlay(open);
  const box = useRef(null);

  /* Escape closes it, and focus moves inside on open so a keyboard is not
     left behind the scrim tabbing through a page it cannot see. */
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const id = window.setTimeout(() => box.current?.focus(), 40);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
    };
  }, [open, onClose]);

  if (!state.mounted) return null;

  return (
    <div className="e-sheet-scrim e-no-export" data-state={state.state} onClick={onClose}>
      <div
        ref={box}
        className="e-sheet"
        data-state={state.state}
        data-wide={wide ? "true" : "false"}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="e-sheet-head">
          <div className="e-sheet-headings">
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {/* A scrim you can click is not discoverable on its own; the button
              is what most people reach for, so it is always drawn. */}
          <button type="button" className="e-icon-btn e-sheet-x" onClick={onClose} aria-label="Close">
            <IconX size={17} />
          </button>
        </header>
        <div className="e-sheet-body">{children}</div>
      </div>
    </div>
  );
}
