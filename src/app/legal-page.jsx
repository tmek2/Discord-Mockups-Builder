import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { authConfigured, currentUser } from "@/auth";
import { SiteNav } from "@/gator/site-nav";
import { DOCS_URL, GATOR_URL, SUPPORT_URL } from "@/lib/site";
import "@/app/legal.css";

/* The frame both legal pages share.
 *
 * The header is the same `SiteNav` the builder renders — not a copy of it —
 * so these pages cannot drift into looking like a different site, and the
 * theme toggle and account state keep working the way they do everywhere
 * else. The primary links are off: from here the only place worth going is
 * back to the tool.
 */
export async function LegalPage({ title, updated, children }) {
  return (
    <div className="l-page">
      <SiteNav user={await currentUser()} canSignIn={authConfigured} compact links={false}>
        <Link className="l-back" href="/">
          <IconArrowLeft size={15} stroke={2} />
          Back to the builder
        </Link>
      </SiteNav>

      <main className="l-body">
        <h1 className="l-title">{title}</h1>
        <p className="l-updated">Last updated {updated}</p>
        {children}
        <nav className="l-foot">
          <Link href="/">Builder</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <a href={GATOR_URL}>Gator</a>
          <a href={DOCS_URL}>Documentation</a>
          <a href={SUPPORT_URL}>Support</a>
        </nav>
      </main>
    </div>
  );
}
