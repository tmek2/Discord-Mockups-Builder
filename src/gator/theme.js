/* The appearance setting, without a client boundary around it.
 *
 * The pre-paint script has to be inlined by the root layout, which is a server
 * component; importing it from the toggle would drag that whole client module
 * into the server graph for the sake of one string.
 */

/** The one key. Shared by the toggle and by the script below. */
export const THEME_KEY = "gator-theme";

/* Runs before the first paint and before React, so a visitor who chose light
 * never watches a dark page correct itself.
 *
 * Dark is the default, and that is a stronger claim than "dark is what the
 * stylesheet says when nothing else does". A first visit stamps `dark`
 * explicitly rather than leaving the attribute off, because leaving it off
 * hands the decision to `prefers-color-scheme` — and most machines report
 * light, so the design would arrive in the appearance it was not drawn in.
 * Auto is still there and still means "follow the device"; it is a setting
 * somebody chooses rather than the one they are given.
 *
 * The three states on disk are therefore: "light", "dark", "auto", and absent.
 * Absent is a first visit and resolves to dark. Wrapped in a try because
 * storage throws in a private window, and an appearance is not worth a blank
 * page — if it throws, the stylesheet's own dark default still applies. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});document.documentElement.setAttribute("data-theme",t==="light"||t==="dark"?t:t==="auto"?"":"dark");if(t==="auto")document.documentElement.removeAttribute("data-theme")}catch(e){document.documentElement.setAttribute("data-theme","dark")}`;
