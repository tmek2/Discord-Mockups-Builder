"use client";

/* Dragging a message into a new place in the list.
 *
 * The arrow buttons stay — they are the keyboard's and the screen reader's way
 * through, and they are faster than a drag for moving something one place. But
 * moving a message five places up by pressing an arrow five times is the
 * interface making the person do arithmetic, and the thing being moved is
 * visual, so the direct way should exist.
 *
 * Three details carry most of the feel.
 *
 * The row follows the pointer from where it was grabbed, not from its middle.
 * Grabbing a row near its bottom edge and having it jump so its centre is
 * under the finger is the moment the illusion that you are holding it dies.
 *
 * The gap opens as you cross a row, not when you let go. The list is showing
 * you the outcome continuously, so the drop is a confirmation of something
 * already visible rather than a reveal.
 *
 * The row settles rather than snapping. On release it springs from wherever it
 * is to its slot, carrying the velocity the hand had — the same movement the
 * hand was making, continued and ended by the interface.
 */

import { useCallback, useRef, useState } from "react";
import { SPRING, createSpring, createTracker, prefersReducedMotion } from "./motion";

export function useReorder({ count, onMove }) {
  /* `null` when nothing is being dragged. Otherwise the index being held, the
     index it would land on, and how far the row has been lifted. */
  const [drag, setDrag] = useState(null);
  const grab = useRef(null);
  const tracker = useRef(createTracker());
  const settle = useRef(null);

  const begin = useCallback(
    (event, index, rowEl, listEl) => {
      if (event.button !== 0) return;
      /* A control *inside* the row is not a handle for it — pressing a delete
         button should delete, not pick the row up. The row is itself a button,
         though, so the nearest control being the row is the ordinary case and
         must not bail. */
      const control = event.target.closest("button, input, select, a, [role='button']");
      if (control && control !== event.currentTarget) return;

      const rows = [...listEl.querySelectorAll("[data-row]")];
      const boxes = rows.map((r) => r.getBoundingClientRect());
      const box = rowEl.getBoundingClientRect();

      settle.current?.stop();
      tracker.current.clear();
      tracker.current.add(0, event.clientY);

      grab.current = {
        id: event.pointerId,
        index,
        to: index,
        startY: event.clientY,
        // Where in the row it was grabbed, so it hangs off the pointer at the
        // same place it was picked up.
        offset: event.clientY - box.top,
        height: box.height,
        boxes,
        started: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const move = useCallback(
    (event) => {
      const g = grab.current;
      if (!g || event.pointerId !== g.id) return;
      const dy = event.clientY - g.startY;

      // A press that drifts is still a press. Eight pixels is enough to tell
      // a click from an intent to move without feeling sticky.
      if (!g.started && Math.abs(dy) < 8) return;
      if (!g.started) g.started = true;

      tracker.current.add(0, event.clientY);

      /* Which slot the row is over now: the row whose midpoint the dragged
         row's own midpoint has passed. Comparing midpoints rather than edges is
         what makes the gap open when you are half way across a neighbour
         instead of when you have fully cleared it. */
      const centre = event.clientY - g.offset + g.height / 2;
      let to = 0;
      for (let i = 0; i < g.boxes.length; i += 1) {
        if (centre > g.boxes[i].top + g.boxes[i].height / 2) to = i;
      }
      g.to = Math.max(0, Math.min(count - 1, to));

      setDrag({ index: g.index, to: g.to, dy, held: true });
    },
    [count],
  );

  const end = useCallback(
    (event) => {
      const g = grab.current;
      if (!g || event.pointerId !== g.id) return;
      grab.current = null;

      if (!g.started) {
        setDrag(null);
        return;
      }

      const [, vy] = tracker.current.velocity();
      const from = g.index;
      const to = g.to;
      const dy = event.clientY - g.startY;

      /* Where the row has to travel to reach the slot it is landing in. The
         row is still in its original position in the DOM until the commit
         below, so the distance is the number of rows it has crossed. */
      const rest = (to - from) * g.height;

      const finish = () => {
        setDrag(null);
        if (to !== from) onMove(from, to);
      };

      if (prefersReducedMotion() || Math.abs(dy - rest) < 1) {
        finish();
        return;
      }

      /* Springs from where it is to where it lands, at the speed the hand was
         moving.
         Critically damped and short, not bouncy. A row is being placed into a
         slot, and a slot is a hard edge — overshooting it means the row goes
         past the gap it is meant to fill and comes back, which reads as the
         list being unsure. Bounce belongs where a flick threw something into
         open space. It also means the new order is committed in a third of a
         second rather than after a second of oscillation.
         `held: false` from this frame on: the moment the finger is off, the
         row is no longer being held and only its journey continues. */
      settle.current = createSpring({
        value: dy,
        damping: 1,
        response: 0.25,
        onChange: (v) => setDrag({ index: from, to, dy: v, held: false, landing: true }),
        onRest: finish,
      });
      settle.current.set(rest, vy);
    },
    [onMove],
  );

  /* What each row should be offset by this frame. The held row follows the
     pointer; the rows it has displaced move one slot out of its way. */
  const offsetFor = useCallback(
    (index, rowHeight) => {
      if (!drag) return 0;
      if (index === drag.index) return drag.dy;
      if (drag.index < drag.to && index > drag.index && index <= drag.to) return -rowHeight;
      if (drag.index > drag.to && index < drag.index && index >= drag.to) return rowHeight;
      return 0;
    },
    [drag],
  );

  return {
    drag,
    offsetFor,
    handlers: (index, listRef) => ({
      onPointerDown: (event) => begin(event, index, event.currentTarget, listRef.current),
      onPointerMove: move,
      onPointerUp: end,
      onPointerCancel: end,
    }),
  };
}
