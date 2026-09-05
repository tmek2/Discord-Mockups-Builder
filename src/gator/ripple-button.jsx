"use client";

/* The filled control, with the wave under the label.
 *
 * Two components rather than one: the ripple layer is a child you place, so it
 * can sit above or below whatever else the button holds, and it reads the
 * waves off context rather than being handed them.
 *
 * It can also be a link. Half the things that want a ripple navigate, and a
 * `<button>` that navigates is the wrong element.
 *
 * Keyboard activation ripples too — centring the wave on the pointer means
 * Enter and Space produce nothing at all, which makes the affordance
 * mouse-only.
 *
 * Waves are keyed by a counter rather than a timestamp: two clicks inside one
 * millisecond are two waves, and `Date.now()` says they are one.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import "./ripple-button.css";

const RippleContext = createContext([]);

export function useRipples(duration = 600) {
  const [ripples, setRipples] = useState([]);
  const seq = useRef(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const spawn = useCallback((host, clientX, clientY) => {
    if (reduced.current) return;
    const rect = host.getBoundingClientRect();
    // Big enough that the circle still covers the far corner from anywhere
    // inside the host, which a `max(width, height)` circle does not.
    const size = Math.hypot(rect.width, rect.height) * 2;
    const cx = clientX ?? rect.left + rect.width / 2;
    const cy = clientY ?? rect.top + rect.height / 2;
    seq.current += 1;
    setRipples((current) => [
      ...current,
      { x: cx - rect.left - size / 2, y: cy - rect.top - size / 2, size, key: seq.current },
    ]);
  }, []);

  useEffect(() => {
    if (ripples.length === 0) return;
    const oldest = ripples[0].key;
    const timer = window.setTimeout(
      () => setRipples((current) => current.filter((r) => r.key !== oldest)),
      duration,
    );
    return () => window.clearTimeout(timer);
  }, [ripples, duration]);

  return { ripples, spawn };
}

export function RippleButtonRipples({ duration = 600 }) {
  const ripples = useContext(RippleContext);
  return (
    <span className="g-ripple-field" aria-hidden="true">
      {ripples.map((r) => (
        <span
          key={r.key}
          className="g-ripple-wave"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </span>
  );
}

export function RippleButton({
  as: As = "button",
  variant = "default",
  size = "default",
  className = "",
  onClick,
  onPointerDown,
  children,
  ...rest
}) {
  const { ripples, spawn } = useRipples();
  const host = useRef(null);

  const press = useCallback(
    (event) => {
      if (host.current) spawn(host.current, event.clientX, event.clientY);
      onPointerDown?.(event);
    },
    [onPointerDown, spawn],
  );

  const click = useCallback(
    (event) => {
      // `detail` is 0 for Enter and Space, where there is no pointer to
      // centre on and `onPointerDown` never fired.
      if (event.detail === 0 && host.current) spawn(host.current);
      onClick?.(event);
    },
    [onClick, spawn],
  );

  return (
    <RippleContext.Provider value={ripples}>
      <As
        ref={host}
        className={`g-ripple g-ripple-${variant} g-ripple-size-${size} ${className}`}
        onPointerDown={press}
        onClick={click}
        {...rest}
      >
        <span className="g-ripple-label">{children}</span>
      </As>
    </RippleContext.Provider>
  );
}
