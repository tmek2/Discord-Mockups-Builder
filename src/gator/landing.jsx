"use client";

/* The front page.
 *
 * One screen. The header, one line saying what the thing is, the two actions
 * worth putting in front of somebody who has just arrived, and — because this
 * is a tool whose whole output is a picture — the picture, sitting in the
 * corner it will occupy in the builder.
 */

import Link from "next/link";
import { IconArrowUpRight, IconBolt, IconCloudUpload, IconDeviceMobile, IconPhotoDown, IconStack2 } from "@tabler/icons-react";
import { SiteNav } from "./site-nav";
import { RippleButton, RippleButtonRipples } from "./ripple-button";
import { GatorLogo } from "./gator-logo";
import { DiscordSurface } from "@/discord/surface";
import { SHOWCASE } from "@/lib/showcase";
import { DOCS_URL, GATOR_URL } from "@/lib/site";
import "./landing.css";

const POINTS = [
  {
    Icon: IconStack2,
    title: "Every surface Discord draws",
    body: "Embeds, Components v2 containers, sections, galleries, polls, forwards, voice notes, system messages, threads. Not an approximation of a few of them.",
  },
  {
    Icon: IconBolt,
    title: "The editor from the dashboard",
    body: "The same block tree the message designer on gatorsys.xyz uses — add, nest, drag, duplicate — with the parts that send a message taken out. Nothing here talks to a server.",
  },
  {
    Icon: IconDeviceMobile,
    title: "Desktop and mobile",
    body: "Switch the canvas between the desktop client and the phone. Same message, both layouts, drawn the way each one actually stacks.",
  },
  {
    Icon: IconPhotoDown,
    title: "Export what you need",
    body: "A transparent or filled PNG at up to 3×, the project file, or the message JSON to hand to a bot.",
  },
];

/* The last point depends on how the deployment is set up, and a page that
   promises an account on a deployment that has none is a page telling somebody
   to look for a button that is not there. */
const SAVING = {
  Icon: IconCloudUpload,
  title: "Saved where you left it",
  withAccount:
    "Everything is kept in the browser as you type. Sign in with the same Discord account you use for Gator and it is backed up to the cloud as well.",
  local:
    "Everything is kept in the browser as you type, and the project file is a full copy you can keep anywhere or hand to somebody else.",
};

export function Landing({ user, canSignIn = true }) {
  return (
    <div className="g-poster">
      <div className="g-hero-sticky">
        <div className="g-dotfield g-hero-field" aria-hidden="true" />

        <SiteNav user={user} canSignIn={canSignIn} />

        <main className="g-hero">
          <div className="g-hero-copy">
            <h1 className="g-hero-h1">
              {"Draw the message "}
              <br className="g-break-wide" />
              {"before you send it. "}
              <span className="g-hero-free">Free.</span>
            </h1>

            <div className="g-hero-foot">
              <p className="g-hero-lede">
                A visual builder for Discord messages. Embeds, Components v2 containers,
                buttons, galleries, polls and every system message the client draws — laid
                out against the real chat surface, in every one of its four appearances.
              </p>

              <div className="g-hero-actions">
                <RippleButton as={Link} href="/builder" size="lg">
                  Open the builder
                  <RippleButtonRipples />
                </RippleButton>

                <a className="g-underline" href={GATOR_URL} target="_blank" rel="noreferrer">
                  Gator
                  <IconArrowUpRight size={15} stroke={2.2} />
                </a>
              </div>
            </div>
          </div>

          {/* The output, in the corner it occupies in the builder. It is the
              real renderer rather than a screenshot, so it can never drift
              from what the tool actually draws. */}
          <div className="g-hero-stage" aria-hidden="true">
            <div className="g-hero-plate">
              <DiscordSurface project={SHOWCASE} />
            </div>
          </div>
        </main>
      </div>

      <section className="g-points" id="what">
        <div className="g-shell">
          <h2 className="g-points-h2">What is in it</h2>
          <ul className="g-points-grid">
            {[...POINTS, { ...SAVING, body: canSignIn ? SAVING.withAccount : SAVING.local }].map(({ Icon, title, body }) => (
              <li className="g-point" key={title}>
                <span className="g-point-icon">
                  <Icon size={19} stroke={1.7} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="g-foot">
        <div className="g-shell g-foot-row">
          <span className="g-foot-mark">
            <GatorLogo size={20} />
            Gator Mockups
          </span>
          <nav className="g-foot-links">
            <a href={GATOR_URL}>Gator</a>
            <a href={DOCS_URL}>Documentation</a>
            <Link href="/builder">Builder</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
