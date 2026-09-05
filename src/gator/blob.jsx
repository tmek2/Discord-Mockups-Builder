"use client";

/* The travelling indicator.
 *
 * The site's header has one and it is the thing that makes that header feel
 * like a single control rather than a row of separate ones: instead of four
 * backgrounds fading in and out, one shape moves between them. The eye tracks
 * a moving object without being asked to; it has to be told about a fade.
 *
 * Two details make it read as an object rather than a rectangle being
 * repositioned. It squashes as it goes — the travel and the squash are on two
 * elements so the transforms do not fight — and where nothing is selected it
 * has nowhere to be, so it fades rather than springing back to a home it does
 * not have.
 *
 * Lifted out of `site-nav` because the editor wants the same thing twice: on
 * the section rail and on the inspector's tabs.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./blob.css";

/* `useLayoutEffect` warns when React renders on the server, and `useEffect`
   lands after the first paint — which here means the blob is drawn in the
   wrong place for a frame. Picking per environment is the usual way out. */
const useMeasure = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * @param selected the key that is current, or null for nothing
 * @returns refs and props to spread: `box` on the container, `register(key)`
 *          on each item, and `aim` / `clear` for pointer and focus.
 */
export function useBlob(selected) {
  const box = useRef(null);
  const items = useRef(new Map());
  const [aimed, setAimed] = useState(null);
  const [moving, setMoving] = useState(false);

  const lit = aimed ?? selected ?? null;

  useMeasure(() => {
    const host = box.current;
    const target = lit != null ? items.current.get(lit) : null;
    if (!host || !target) return undefined;
    const put = () => {
      host.style.setProperty("--blob-x", `${target.offsetLeft}px`);
      host.style.setProperty("--blob-y", `${target.offsetTop}px`);
      host.style.setProperty("--blob-w", `${target.offsetWidth}px`);
      host.style.setProperty("--blob-h", `${target.offsetHeight}px`);
    };
    put();
    // The container reflows with the panel, and the items move with it.
    const watch = new ResizeObserver(put);
    watch.observe(host);
    return () => watch.disconnect();
  }, [lit]);

  // Squash only on a real move, never on the first paint.
  const settled = useRef(false);
  useEffect(() => {
    if (!settled.current) {
      settled.current = lit != null;
      return undefined;
    }
    setMoving(true);
    const id = window.setTimeout(() => setMoving(false), 230);
    return () => window.clearTimeout(id);
  }, [lit]);

  return {
    boxProps: {
      ref: box,
      "data-lit": lit != null ? "true" : "false",
      "data-moving": moving ? "true" : "false",
      onPointerLeave: () => setAimed(null),
    },
    register: (key) => ({
      ref: (node) => {
        if (node) items.current.set(key, node);
        else items.current.delete(key);
      },
      onPointerEnter: () => setAimed(key),
      onFocus: () => setAimed(key),
      onBlur: () => setAimed(null),
    }),
  };
}

export function Blob({ className = "" }) {
  return (
    <span className={`g-blob ${className}`} aria-hidden="true">
      <span className="g-blob-skin" />
    </span>
  );
}
