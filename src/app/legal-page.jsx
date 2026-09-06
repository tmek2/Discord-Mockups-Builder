"use client";

/* The privacy policy and the terms.
 *
 * Ported from gatorsys.xyz's own `LegalPage` rather than invented again: the
 * numbered sections, the pinned contents list that tracks where you are, the
 * reading-progress line and the prose measure all come from
 * `gatorsys.xyz/src/components/legal-page.tsx` and its stylesheet. These are
 * the same documents in the same frame, so a reader who has seen one of
 * Gator's legal pages has seen this one.
 *
 * Three things that frame has to get right on a document this long:
 *
 *   - The anchors are the headings, not counters. `#section-4` tells a reader
 *     nothing and breaks the moment a section is inserted above it;
 *     `#acceptable-use` survives both.
 *   - The contents list says where you are. A list of links with no current
 *     one is a table of contents you have to read twice.
 *   - Following a heading replaces the history entry rather than pushing one,
 *     so nine headings do not leave nine things between this page and wherever
 *     the reader came from.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { GatorLogo } from "@/gator/gator-logo";
import { ThemeToggle } from "@/gator/theme-toggle";
import { DOCS_URL, GATOR_URL, SUPPORT_URL } from "@/lib/site";
import "@/gator/legal.css";

/** The heading, as an address. Stable against a section being inserted above. */
function slugOf(title) {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function LegalPage({ title, summary, effective, sections }) {
  const slugs = sections.map((section) => slugOf(section.title));
  const [current, setCurrent] = useState(slugs[0]);
  const doc = useRef(null);

  /* Where you are, without reading the scroll position.
     Each section reports itself against a band just under the header, and the
     *last* one still in that band wins. Last, not first: a band tall enough to
     catch a heading reliably is also tall enough to still be holding the tail
     of the section above it, and taking the first match leaves the list one
     heading behind wherever you actually are. */
  useEffect(() => {
    const root = doc.current;
    if (!root) return undefined;
    const seen = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) seen.set(entry.target.id, entry.isIntersecting);
        for (let i = slugs.length - 1; i >= 0; i -= 1) {
          if (seen.get(slugs[i])) {
            setCurrent(slugs[i]);
            return;
          }
        }
      },
      { rootMargin: "-92px 0px -70% 0px", threshold: 0 },
    );
    root.querySelectorAll("section[id]").forEach((node) => io.observe(node));
    return () => io.disconnect();
    // The section list is fixed for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="g-root g-legal">
      <div className="g-legal-field" aria-hidden="true" />

      {/* How much of this is left. The contents list says what is in the
          document; this says where in it you are, which on a page nobody wants
          to be reading is the more urgent of the two. Driven by the scroll
          itself, so there is no listener and no state. */}
      <span className="g-legal-progress" aria-hidden="true" />

      <header className="g-legal-bar">
        <Link className="g-legal-back" href="/">
          <IconArrowLeft size={15} stroke={2} />
          Back to the builder
        </Link>
        <Link className="g-legal-brand" href="/">
          <GatorLogo size={22} />
          <span>Mockups</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="g-legal-main">
        <header className="g-legal-head">
          <p className="g-legal-date">{effective}</p>
          <h1 className="g-legal-title">{title}</h1>
          <p className="g-legal-summary">{summary}</p>
        </header>

        <div className="g-legal-body">
          <nav className="g-legal-toc" aria-label={`${title} sections`}>
            <h2>Contents</h2>
            <ol>
              {sections.map((section, index) => {
                const slug = slugs[index];
                return (
                  <li key={slug}>
                    <a
                      href={`#${slug}`}
                      aria-current={current === slug ? "true" : undefined}
                      data-current={current === slug ? "true" : "false"}
                      onClick={(event) => {
                        event.preventDefault();
                        const target = document.getElementById(slug);
                        if (!target) return;
                        target.scrollIntoView({ behavior: "smooth", block: "start" });
                        window.history.replaceState(null, "", `#${slug}`);
                        setCurrent(slug);
                      }}
                    >
                      <span className="g-toc-n">{String(index + 1).padStart(2, "0")}</span>
                      {section.title}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <article className="g-legal-doc" ref={doc}>
            {sections.map((section, index) => (
              <section key={slugs[index]} id={slugs[index]} className="g-legal-section">
                <h2>
                  <span className="g-legal-n" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>
                <div className="g-legal-copy">{section.content}</div>
              </section>
            ))}

            <p className="g-legal-ask">
              Questions, takedown requests and abuse reports can be sent through the{" "}
              <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
                Gator support community
              </a>
              .
            </p>

            <nav className="g-legal-foot" aria-label="Elsewhere">
              <Link href="/">Builder</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <a href={GATOR_URL}>Gator</a>
              <a href={DOCS_URL}>Documentation</a>
            </nav>
          </article>
        </div>
      </main>
    </div>
  );
}
