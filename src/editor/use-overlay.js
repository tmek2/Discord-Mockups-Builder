"use client";

/* Keeping an overlay mounted long enough to leave.
 *
 * A sheet that springs in and then vanishes on close is two different
 * interfaces: one where the panel is a physical thing that arrived, and one
 * where it was a picture that was switched off. If something appears one way
 * we expect it to leave the same way, and the return path is the one that
 * tells us where the thing went — which is the whole reason it is worth
 * keeping a closed component on the page for two hundred milliseconds.
 *
 * `state` is "in" or "out"; the stylesheet runs the matching animation, and
 * the node unmounts once the outbound one has finished.
 */

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./motion";

export function useOverlay(open, exitMs = 200) {
  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState(open ? "in" : "out");
  const timer = useRef(0);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (open) {
      setMounted(true);
      /* A frame between mounting and marking it "in", or the browser has no
         earlier state to animate from and the entrance is skipped. */
      const id = requestAnimationFrame(() => setState("in"));
      return () => cancelAnimationFrame(id);
    }
    if (!mounted) return undefined;
    setState("out");
    timer.current = window.setTimeout(() => setMounted(false), prefersReducedMotion() ? 0 : exitMs);
    return () => window.clearTimeout(timer.current);
    // `mounted` is read but must not re-run this: it is the effect's own output.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exitMs]);

  return { mounted, state };
}
