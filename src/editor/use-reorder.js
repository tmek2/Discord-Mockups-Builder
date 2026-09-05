"use client";

/* Dragging a message into a new place in the list.
 *
 * The arrow buttons stay — they are the keyboard's and the screen reader's way
 * through, and for moving something one place they are faster than a drag. But
 * moving a message five places by pressing an arrow five times is the
 * interface making somebody do arithmetic, and the thing being moved is
 * visual, so the direct way has to exist too.
 *
 * Four details carry the feel.
 *
 * The row follows the pointer from where it was grabbed, not from its middle.
 * Grabbing a row near its bottom edge and having it jump so its centre lands
 * under the finger is the moment the illusion that you are holding it dies.
 *
 * The gap opens as you cross a neighbour, not when you let go. The list shows
 * the outcome continuously, so the drop confirms something already visible
 * rather than revealing it.
 *
 * The list scrolls when you reach its edge. Without that, a list longer than
 * the panel can only be reordered within the part of it you can already see.
 *
 * The row settles rather than snapping, from wherever it is, at the speed the
 * hand was moving.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createSpring, createTracker, prefersReducedMotion } from "./motion";

/** How close to the edge the pointer has to get before the list starts moving. */
const EDGE = 56;
/** The fastest the list scrolls itself, in pixels per second. */
const EDGE_SPEED = 900;

export function useReorder({ count, onMove }) {
  /* `null` when nothing is being dragged. Otherwise which index is held, which
     it would land on, and how far it has been lifted. */
  const [drag, setDrag] = useState(null);
  const grab = useRef(null);
  const tracker = useRef(createTracker());
  const settle = useRef(null);
  const edge = useRef(0);

  const stopEdge = useCallback(() => {
    if (edge.current) cancelAnimationFrame(edge.current);
    edge.current = 0;
  }, []);

  useEffect(() => () => {
    stopEdge();
    settle.current?.stop();
  }, [stopEdge]);

  /* Where the pointer is in the list's own content, which is what the row
     positions are measured in. Doing the comparison in viewport coordinates
     works right up until the list scrolls underneath the drag, at which point
     every cached rectangle is wrong by the scroll distance. */
  const contentY = (g, clientY) => clientY - g.listTop + g.list.scrollTop;

  const aim = useCallback(
    (g, clientY) => {
      const centre = contentY(g, clientY) - g.offset + g.height / 2;
      let to = 0;
      for (let i = 0; i < g.rows.length; i += 1) {
        if (centre > g.rows[i].top + g.rows[i].height / 2) to = i;
      }
      return Math.max(0, Math.min(count - 1, to));
    },
    [count],
  );

  /* The held row's offset from its own layout position.
   *
   * The scroll term is what keeps it under the finger while the list moves
   * beneath it: the row's layout position travels with the scroll, so the
   * transform has to travel the same distance the other way. */
  const offsetOf = (g, clientY) => clientY - g.startY + (g.list.scrollTop - g.startScroll);

  const begin = useCallback(
    (event, index, rowEl, listEl, fromGrip) => {
      if (event.button !== 0) return;
      /* A control *inside* the row is not a handle for it — pressing delete
         should delete. The row is itself a button, so the nearest control
         being the row is the ordinary case and must not bail. */
      const control = event.target.closest("button, input, select, a, [role='button']");
      if (control && control !== event.currentTarget && !fromGrip) return;

      /* On a touch screen the row is how the list is scrolled, so a press on
         one cannot also mean "pick this up" — the grip is the handle there. A
         mouse has a hover state to reveal the grip and a wheel to scroll with,
         so it can drag from anywhere on the row. */
      if (event.pointerType !== "mouse" && !fromGrip) return;

      const listBox = listEl.getBoundingClientRect();
      const rows = [...listEl.querySelectorAll("[data-row]")].map((r) => ({
        top: r.offsetTop,
        height: r.offsetHeight,
      }));
      const box = rowEl.getBoundingClientRect();

      settle.current?.stop();
      stopEdge();
      tracker.current.clear();
      tracker.current.add(0, event.clientY);

      grab.current = {
        id: event.pointerId,
        index,
        to: index,
        startY: event.clientY,
        list: listEl,
        listTop: listBox.top,
        listHeight: listBox.height,
        startScroll: listEl.scrollTop,
        // Where in the row it was grabbed, so it hangs off the pointer at the
        // same place it was picked up. A distance *within* a row is the same
        // number in viewport and in content coordinates, so no conversion.
        offset: event.clientY - box.top,
        height: box.height,
        rows,
        started: false,
        clientY: event.clientY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [stopEdge],
  );

  /* Scrolling the list because the pointer has reached its edge.
   *
   * The speed ramps with how far into the zone the pointer is rather than
   * switching on at a fixed rate: a list that jumps to full speed the moment
   * you touch the edge overshoots whatever you were aiming for. */
  const runEdge = useCallback(() => {
    if (edge.current) return;
    let last = performance.now();
    const step = (now) => {
      const g = grab.current;
      if (!g || !g.started) {
        edge.current = 0;
        return;
      }
      const dt = Math.min(0.064, (now - last) / 1000);
      last = now;

      const top = g.clientY - g.listTop;
      const bottom = g.listTop + g.listHeight - g.clientY;
      let speed = 0;
      if (top < EDGE) speed = -((EDGE - Math.max(0, top)) / EDGE) * EDGE_SPEED;
      else if (bottom < EDGE) speed = ((EDGE - Math.max(0, bottom)) / EDGE) * EDGE_SPEED;

      if (speed !== 0) {
        const before = g.list.scrollTop;
        g.list.scrollTop += speed * dt;
        // Moving the list under a stationary finger is still movement: the row
        // and the target slot both have to be recomputed.
        if (g.list.scrollTop !== before) {
          g.to = aim(g, g.clientY);
          setDrag({ index: g.index, to: g.to, dy: offsetOf(g, g.clientY), held: true });
        }
        edge.current = requestAnimationFrame(step);
        return;
      }
      edge.current = 0;
    };
    edge.current = requestAnimationFrame(step);
  }, [aim]);

  const move = useCallback(
    (event) => {
      const g = grab.current;
      if (!g || event.pointerId !== g.id) return;
      g.clientY = event.clientY;
      const dy = offsetOf(g, event.clientY);

      // A press that drifts is still a press. Eight pixels tells a click from
      // an intent to move without feeling sticky.
      if (!g.started && Math.abs(dy) < 8) return;
      if (!g.started) g.started = true;

      tracker.current.add(0, event.clientY);
      g.to = aim(g, event.clientY);
      setDrag({ index: g.index, to: g.to, dy, held: true });

      const top = event.clientY - g.listTop;
      const bottom = g.listTop + g.listHeight - event.clientY;
      if (top < EDGE || bottom < EDGE) runEdge();
      else stopEdge();
    },
    [aim, runEdge, stopEdge],
  );

  const end = useCallback(
    (event) => {
      const g = grab.current;
      if (!g || event.pointerId !== g.id) return;
      grab.current = null;
      stopEdge();

      if (!g.started) {
        setDrag(null);
        return;
      }

      const [, vy] = tracker.current.velocity();
      const from = g.index;
      const to = g.to;
      const dy = offsetOf(g, event.clientY);

      /* How far the row has to travel to reach the slot it is landing in. It
         is still at its original index in the DOM until the commit below, so
         the distance is the number of rows it has crossed. The scroll cancels
         out: both the row's layout position and the target's move with it. */
      const rest = (to - from) * g.height;

      const finish = () => {
        setDrag(null);
        if (to !== from) onMove(from, to);
      };

      if (prefersReducedMotion() || Math.abs(dy - rest) < 1) {
        finish();
        return;
      }

      /* Critically damped and short, not bouncy. A row is being placed into a
         slot and a slot is a hard edge — overshooting means the row goes past
         the gap it is meant to fill and comes back, which reads as the list
         being unsure. Bounce belongs where a flick threw something into open
         space. It also commits the new order in a third of a second rather
         than after a second of oscillation.
         `held: false` from this frame on: the moment the finger is off the row
         is no longer held, and only its journey continues. */
      settle.current = createSpring({
        value: dy,
        damping: 1,
        response: 0.25,
        onChange: (v) => setDrag({ index: from, to, dy: v, held: false, landing: true }),
        onRest: finish,
      });
      settle.current.set(rest, vy);
    },
    [onMove, stopEdge],
  );

  /* What each row is offset by this frame: the held one follows the pointer,
     and the ones it has displaced move a slot out of its way. */
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
    /** Spread onto the row itself: a mouse can drag it from anywhere. */
    handlers: (index, listRef) => ({
      onPointerDown: (event) => begin(event, index, event.currentTarget, listRef.current, false),
      onPointerMove: move,
      onPointerUp: end,
      onPointerCancel: end,
    }),
    /** Spread onto the grip: the handle, and the only way in on a touch screen.
     *  Capture lands on the grip, so these fire there and would otherwise also
     *  bubble to the row's copies of the same handlers. */
    gripHandlers: (index, listRef) => ({
      onPointerDown: (event) => {
        event.stopPropagation();
        begin(event, index, event.currentTarget.closest("[data-row]"), listRef.current, true);
      },
      onPointerMove: (event) => {
        event.stopPropagation();
        move(event);
      },
      onPointerUp: (event) => {
        event.stopPropagation();
        end(event);
      },
      onPointerCancel: (event) => {
        event.stopPropagation();
        end(event);
      },
    }),
  };
}
