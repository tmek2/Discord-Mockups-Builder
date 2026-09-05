/* Springs, projection and rubber-banding.
 *
 * Everything a person can touch in the editor moves on a spring rather than a
 * CSS transition, for one reason: a transition cannot be grabbed. It runs from
 * where it started to where it was told to go, and an interruption either
 * queues behind it or cuts to a new start value, which is a visible jump. A
 * spring has no duration — it has a current value and a target, so re-aiming
 * it mid-flight is just changing the target, and the motion stays continuous
 * because the velocity carries through.
 *
 * The parameters are Apple's two rather than the physics triplet, because
 * mass/stiffness/damping are three numbers you tune by trial:
 *
 *   damping   the damping ratio. 1 is critically damped: it arrives and stops.
 *             Below 1 it overshoots. Use 1 unless the movement is the tail of
 *             a gesture that already had momentum — overshoot on something the
 *             user flicked feels like physics, overshoot on a menu that just
 *             appeared feels like a toy.
 *   response  roughly how long it takes to get there, in seconds. Not a
 *             duration: the settle time falls out of the maths. Lower is
 *             snappier.
 *
 * No dependency. A spring is fifteen lines of integration and the control it
 * gives over interruption is the whole point of doing this at all.
 */

/** Whether the person has asked for less movement. Read once, then watched. */
let reduced = false;
if (typeof window !== "undefined" && window.matchMedia) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduced = query.matches;
  query.addEventListener?.("change", (e) => {
    reduced = e.matches;
  });
}

export const prefersReducedMotion = () => reduced;

/**
 * A spring you can re-aim at any moment.
 *
 * `onChange` is called on every frame with the current value. `set` changes
 * the target without touching the velocity, which is what makes a reversal
 * mid-flight bend rather than hit a brick wall.
 */
export function createSpring({ value = 0, damping = 1, response = 0.4, onChange, onRest } = {}) {
  let x = value;
  let v = 0;
  let target = value;
  let frame = 0;
  let last = 0;
  let zeta = damping;
  let omega = (2 * Math.PI) / response;

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const step = (now) => {
    frame = 0;
    /* Clamped, because a backgrounded tab hands back a delta of several
       seconds and an unclamped integration of that explodes. */
    const dt = Math.min(0.064, (now - last) / 1000 || 0);
    last = now;

    /* Sub-stepped at a fixed interval so the motion is identical on a 60Hz and
       a 120Hz display. Integrating once per frame at the frame's own delta
       makes a spring visibly stiffer on a fast screen. */
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i += 1) {
      const a = -(omega * omega) * (x - target) - 2 * zeta * omega * v;
      v += a * h;
      x += v * h;
    }

    // Settled when it is both close enough and slow enough. Distance alone
    // would stop it at the moment it crosses the target at speed.
    if (Math.abs(x - target) < 0.0015 && Math.abs(v) < 0.0015) {
      x = target;
      v = 0;
      onChange?.(x);
      onRest?.(x);
      return;
    }

    onChange?.(x);
    frame = requestAnimationFrame(step);
  };

  const start = () => {
    if (frame) return;
    last = performance.now();
    frame = requestAnimationFrame(step);
  };

  return {
    /** Re-aim. Velocity is kept, so an interrupted spring bends into the new
     *  target rather than restarting from a standstill. */
    set(next, velocity) {
      target = next;
      if (velocity !== undefined) v = velocity;
      if (reduced) {
        stop();
        x = target;
        v = 0;
        onChange?.(x);
        onRest?.(x);
        return;
      }
      start();
    },
    /** Land on a value with no animation at all — for a value being dragged,
     *  where the finger is the animation. */
    jump(next) {
      stop();
      x = next;
      target = next;
      v = 0;
      onChange?.(x);
    },
    /** Hand a gesture's release velocity to the spring, in units per second. */
    setVelocity(next) {
      v = next;
      if (!reduced) start();
    },
    tune(nextDamping, nextResponse) {
      zeta = nextDamping;
      omega = (2 * Math.PI) / nextResponse;
    },
    get value() {
      return x;
    },
    get velocity() {
      return v;
    },
    get target() {
      return target;
    },
    stop,
  };
}

/* Where a flick is going.
 *
 * Not the nearest boundary to where the finger left — the boundary nearest
 * where the movement would have come to rest. This is the exponential decay a
 * scroll view uses, and it is what makes a small fast flick throw something a
 * long way while a large slow drag does not.
 *
 * The physics-textbook v²/(2a) is not this and does not feel like it.
 */
export function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/* Resistance past an edge.
 *
 * A hard stop reads as frozen — as though the interface stopped listening. A
 * progressively stiffening pull reads as "still listening, but there is
 * nothing more this way", which is the honest answer.
 */
export function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/* A short history of where a pointer has been, for the velocity at release.
 *
 * The last two events are not enough: a finger resting for a moment before
 * lifting produces a delta of nearly zero over nearly zero time, and the
 * quotient is noise. Averaging over a window that ends at the release gives
 * the velocity the hand actually had.
 */
export function createTracker(window_ms = 100) {
  let points = [];
  return {
    add(x, y) {
      const now = performance.now();
      points.push({ x, y, t: now });
      points = points.filter((p) => now - p.t <= window_ms);
    },
    clear() {
      points = [];
    },
    /** Pixels per second, as [vx, vy]. */
    velocity() {
      if (points.length < 2) return [0, 0];
      const first = points[0];
      const last = points[points.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt <= 0) return [0, 0];
      return [(last.x - first.x) / dt, (last.y - first.y) / dt];
    },
  };
}

/* The values the interface is tuned to.
 *
 * Two settings, and which one applies is not a matter of taste: `settle` is
 * for anything arriving under its own steam — a panel, a value being reset —
 * and never overshoots, because nothing threw it. `momentum` is for the tail
 * of a gesture, where the overshoot is the momentum the hand put in and its
 * absence would read as the interface catching the object and holding it
 * still.
 */
export const SPRING = {
  settle: { damping: 1, response: 0.35 },
  momentum: { damping: 0.8, response: 0.4 },
  sheet: { damping: 0.8, response: 0.3 },
};
