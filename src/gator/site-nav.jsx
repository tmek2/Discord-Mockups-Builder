"use client";

/* One header, every page.
 *
 * The landing and the builder are the same bar; the only thing that changes is
 * what sits in the leading slot and whether the links are drawn. On the
 * builder the header is part of the tool, so it is shorter and the plate
 * beneath it starts immediately.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IconBook2, IconBrandDiscord, IconLayoutDashboard, IconLifebuoy, IconPencilBolt } from "@tabler/icons-react";
import { GatorLogo } from "./gator-logo";
import { ThemeToggle } from "./theme-toggle";
import { HoverTip } from "./hover-tip";
import { DOCS_URL, GATOR_URL, SUPPORT_URL } from "@/lib/site";
import "./site-nav.css";

const LINKS = [
  { href: "/builder", label: "Builder", Icon: IconPencilBolt, external: false },
  { href: `${GATOR_URL}/servers`, label: "Dashboard", Icon: IconLayoutDashboard, external: true },
  { href: DOCS_URL, label: "Documentation", Icon: IconBook2, external: true },
  { href: SUPPORT_URL, label: "Support", Icon: IconLifebuoy, external: true },
];

/* `useLayoutEffect` warns when React renders on the server, and `useEffect`
   lands after the first paint — which here means the blob is drawn at the
   wrong link for a frame. Picking per environment is the usual way out. */
const useMeasure = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SiteNav({ user, canSignIn = true, compact = false, links = true, children }) {
  const here = usePathname();
  const box = useRef(null);
  const tabs = useRef(new Map());
  const [aimed, setAimed] = useState(null);
  const [moving, setMoving] = useState(false);

  // Where the blob rests when nothing is under the pointer: the link for the
  // page you are on, if one of them is.
  const onPage = LINKS.find((link) => !link.external && link.href === here)?.href ?? null;
  const lit = aimed ?? onPage;

  useMeasure(() => {
    const host = box.current;
    const target = lit ? tabs.current.get(lit) : null;
    if (!host || !target) return;
    const put = () => {
      host.style.setProperty("--nav-blob-x", `${target.offsetLeft}px`);
      host.style.setProperty("--nav-blob-y", `${target.offsetTop}px`);
      host.style.setProperty("--nav-blob-w", `${target.offsetWidth}px`);
      host.style.setProperty("--nav-blob-h", `${target.offsetHeight}px`);
    };
    put();
    // The header reflows with the viewport, and the links move with it.
    const watch = new ResizeObserver(put);
    watch.observe(host);
    return () => watch.disconnect();
  }, [lit]);

  // Squash only on a real move, never on the first paint.
  const settled = useRef(false);
  useEffect(() => {
    if (!settled.current) {
      settled.current = Boolean(lit);
      return;
    }
    setMoving(true);
    const id = window.setTimeout(() => setMoving(false), 230);
    return () => window.clearTimeout(id);
  }, [lit]);

  return (
    <header className="g-nav" data-compact={compact ? "true" : "false"}>
      <div className="g-nav-bar">
        <Link className="g-brand" href="/">
          <GatorLogo size={compact ? 24 : 30} />
          <span className="g-brand-word">Gator Mockups</span>
        </Link>

        {links ? (
          <nav
            ref={box}
            className="g-nav-links"
            aria-label="Primary"
            data-lit={aimed || onPage ? "true" : "false"}
            data-moving={moving ? "true" : "false"}
            onPointerLeave={() => setAimed(null)}
          >
            {/* One shape moving reads as one control; four backgrounds fading
                in and out read as four. Two of these links leave the site, so
                often nothing is selected and it has nowhere to be — then it
                fades rather than springing home. */}
            <span className="g-nav-blob" aria-hidden="true">
              <span className="g-nav-blob-skin" />
            </span>

            {LINKS.map(({ href, label, Icon, external }) => {
              const shared = {
                className: "g-nav-link",
                ref: (node) => {
                  if (node) tabs.current.set(href, node);
                  else tabs.current.delete(href);
                },
                onPointerEnter: () => setAimed(href),
                onFocus: () => setAimed(href),
                onBlur: () => setAimed(null),
              };
              return external ? (
                <a key={href} {...shared} href={href} target="_blank" rel="noreferrer">
                  <Icon size={16} stroke={1.8} />
                  {label}
                </a>
              ) : (
                <Link key={href} {...shared} href={href} aria-current={here === href ? "page" : undefined}>
                  <Icon size={16} stroke={1.8} />
                  {label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <span className="g-nav-spacer" />

        {children}

        {/* Appearance and account, grouped: the gap inside a group has to be
            smaller than the gap around it, or the eye reads six equal items. */}
        <div className="g-nav-tools">
          <ThemeToggle />

          {user ? (
            <HoverTip label="Your saved mockups" align="end">
              <Link className="g-profile" href="/builder?panel=cloud">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="g-profile-face" src={user.image} alt="" />
                ) : (
                  <span className="g-profile-face g-profile-mono" aria-hidden="true">
                    {(user.name ?? "A").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="g-profile-name">{user.name ?? "Account"}</span>
              </Link>
            </HoverTip>
          ) : canSignIn ? (
            <HoverTip label="Sign in with Discord to save to the cloud" align="end">
              <a className="g-signin" href="/api/auth/signin?callbackUrl=%2Fbuilder">
                <IconBrandDiscord size={16} stroke={1.9} />
                Sign in
              </a>
            </HoverTip>
          ) : null}
        </div>
      </div>
    </header>
  );
}
