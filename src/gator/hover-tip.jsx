"use client";

/* A label under a control, in the page.
 *
 * Not `title`, which the browser draws as a grey operating-system rectangle in
 * the corner of the window about a second late. Hover is gated on a device
 * that has one: a touch screen applies `:hover` on tap and keeps it until you
 * tap something else, which is a label that never goes away.
 */
import "./hover-tip.css";

export function HoverTip({ label, align = "center", children }) {
  return (
    <span className="g-tip-host" data-align={align}>
      {children}
      <span className="g-tip" role="tooltip">
        {label}
      </span>
    </span>
  );
}
