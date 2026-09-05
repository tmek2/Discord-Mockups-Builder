"use client";

/* Light, dark, auto — one block you press.
 *
 * A three-segment control is right in a settings pane, where the choice is
 * being made once and deliberately. In a header it is a 98px slab carrying two
 * options nobody is choosing at that moment. One block that advances is the
 * same three settings in a third of the width.
 *
 * All three settings survive. A two-state switch would drop Auto, which is the
 * one that matters most: it is not a third palette but the absence of a
 * choice, clearing `data-theme` so the stylesheet's `prefers-color-scheme`
 * block takes over and the page follows the device the moment the device
 * changes rather than at the next reload.
 *
 * The icons are stacked, not swapped: all three are always mounted, one shown,
 * rotating and scaling past each other. Replacing the child would remount an
 * SVG and there would be nothing to animate between.
 *
 * The page wipes rather than blinks. The switch runs inside a view transition
 * and the new snapshot's clip path opens as a circle from the button, so the
 * appearance arrives from the control that changed it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { IconDeviceLaptop, IconMoon, IconSun } from "@tabler/icons-react";
import { THEME_KEY } from "./theme";
import "./theme-toggle.css";

const OPTIONS = [
  { value: "light", label: "Light mode", Icon: IconSun },
  { value: "dark", label: "Dark mode", Icon: IconMoon },
  { value: "auto", label: "Match device", Icon: IconDeviceLaptop },
];

const ORDER = ["light", "dark", "auto"];

function apply(theme) {
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/** How long the appearance takes to cross the page. */
const WIPE_MS = 560;

/* Three ways out, all of which still change the appearance. A browser without
 * view transitions runs the change and is done; so does a reader who has asked
 * for less motion; and a transition that fails leaves the attribute set,
 * because the appearance is the point and the animation is not. */
function wipe(from, change) {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!from || reduced || typeof document.startViewTransition !== "function") {
    change();
    return;
  }

  root.setAttribute("data-wipe", "true");

  const transition = document.startViewTransition(() => {
    // Synchronously, or the snapshot is taken before the change lands.
    flushSync(change);
  });

  const done = () => root.removeAttribute("data-wipe");

  transition.ready
    .then(() => {
      const { x, y } = from;
      // The radius that reaches the furthest corner from where it started.
      const far = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${far}px at ${x}px ${y}px)`] },
        {
          duration: WIPE_MS,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(done);

  transition.finished.then(done, done);
}

const nameOf = (theme) => OPTIONS.find((option) => option.value === theme)?.label ?? "";

/* The setting itself, without the control around it. The header's block is one
 * way to change the appearance and a menu is another; both need the same three
 * things, and a second copy of the storage handling would be a second chance
 * to get the Auto case wrong. */
export function useAppearance() {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(THEME_KEY);
    } catch {
      // Private windows and blocked storage both throw. Auto is the answer.
    }
    /* A first visit has nothing stored and is dark — the same resolution the
       pre-paint script makes, or the control would say Auto under a page that
       is not following the device. */
    setTheme(stored === "light" || stored === "dark" || stored === "auto" ? stored : "dark");
  }, []);

  const set = useCallback((value, from) => {
    const box = from?.getBoundingClientRect();
    const at = box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : null;

    wipe(at, () => {
      setTheme(value);
      apply(value);
    });

    try {
      /* Auto is written down rather than cleared. Clearing it would be
         indistinguishable from a first visit, which now resolves to dark — so
         choosing Auto and reloading would silently put you back on dark. */
      window.localStorage.setItem(THEME_KEY, value);
    } catch {
      // The appearance still changed; it just will not survive a reload.
    }
  }, []);

  return { theme, set, options: OPTIONS, order: ORDER };
}

export function ThemeToggle({ className }) {
  const { theme, set } = useAppearance();
  /* A state rather than `:active`, because the press animation has to outlast
     the pointer being lifted — the icon is still turning. */
  const [turning, setTurning] = useState(false);
  const block = useRef(null);

  const next = theme ? ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] : null;

  const advance = useCallback(() => {
    if (!next) return;
    set(next, block.current);
    setTurning(true);
    window.setTimeout(() => setTurning(false), 320);
  }, [next, set]);

  return (
    <div
      className={`g-theme ${className ?? ""}`}
      data-ready={theme ? "true" : "false"}
      data-turning={turning ? "true" : "false"}
    >
      <button
        ref={block}
        type="button"
        className="g-theme-block"
        onClick={advance}
        aria-label={
          theme
            ? `Appearance: ${nameOf(theme).toLowerCase()}. Press for ${nameOf(next).toLowerCase()}.`
            : "Appearance"
        }
      >
        <span className="g-theme-icons" aria-hidden="true">
          {OPTIONS.map(({ value, Icon }) => (
            <span className="g-theme-icon" key={value} data-on={theme === value ? "true" : "false"}>
              <Icon size={16} stroke={1.9} />
            </span>
          ))}
        </span>
      </button>

      {/* Not `title`. In the page, immediate, and under the control it names. */}
      <span className="g-theme-tip" role="status">
        <span className="g-theme-tip-now">{nameOf(theme)}</span>
        <span className="g-theme-tip-next">{nameOf(next)} next</span>
      </span>
    </div>
  );
}
