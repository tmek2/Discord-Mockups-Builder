import { LegalPage } from "@/app/legal-page";
import { SITE_NAME, SUPPORT_URL } from "@/lib/site";

/* The nav shows who is signed in, so this cannot be prerendered at build
   time — a static copy would serve everyone the signed-out header. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description: "What Gator Mockups stores, where it stores it, and how long it keeps it.",
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="5 September 2026">
      <div className="l-note">
        <p>
          <strong>The short version.</strong> Your mockups live in your own browser. Nothing leaves it unless you
          sign in to save a copy, or you make a share link. There is no analytics, no advertising and no
          tracking of any kind, and we never see your Discord messages, servers or email.
        </p>
        <p>
          <strong>This policy covers this tool only</strong> &mdash; the mockup builder at
          mockups.gatorsys.xyz. Everything described below is what <em>the builder</em> collects. The Gator bot,
          gatorsys.xyz and the dashboard are separate services that collect different things and have their own
          policies; nothing on this page describes them.
        </p>
      </div>

      <h2>What stays on your device</h2>
      <p>
        The mockup you are editing, its undo history and every backup you take are written to your browser&rsquo;s
        own storage (IndexedDB and <code>localStorage</code>), along with small preferences like whether you chose
        the light or dark theme. This is the primary copy. It never goes anywhere on its own, it is not readable
        by us, and clearing your browser&rsquo;s site data for this domain deletes all of it permanently.
      </p>

      <h2>What we store when you sign in</h2>
      <p>Signing in is optional. If you do, we hold:</p>
      <ul>
        <li>
          <strong>Your Discord user ID, username and avatar URL.</strong> That is the whole of the{" "}
          <code>identify</code> scope, and it is the only scope we request. We do not ask for your email, your
          servers, your friends or any message content, so we could not read them if we wanted to.
        </li>
        <li>
          <strong>The mockups you choose to save.</strong> Each is compressed and stored as an opaque blob under a
          key derived from your user ID. We do not index, search or read inside them.
        </li>
      </ul>
      <p>
        Your Discord access token stays inside an encrypted session cookie and is never included in anything the
        browser can read back. Nothing in this app calls Discord after you sign in.
      </p>

      <h2>Share links</h2>
      <p>
        Making a share link stores a <em>copy</em> of that mockup under a random, unguessable ID. The copy is
        stripped of everything that identifies you: your account ID is not stored with it, and the copy is
        re-issued with entirely new internal IDs so it cannot be matched against your saved version. Anyone with
        the link can open it; nobody can find it without the link.
      </p>
      <p>
        <strong>Share links delete themselves after fourteen days.</strong> Expiry is enforced by the store
        itself, not by a cleanup job, so a link is gone at the deadline whether or not anything else is running.
        Share pages are also marked <code>noindex</code> and excluded in <code>robots.txt</code> — public by link
        is not the same as public to a search engine.
      </p>

      <h2>What we do not collect</h2>
      <ul>
        <li>No analytics, no page-view counting, no session recording, no heatmaps.</li>
        <li>No advertising, no ad networks, no third-party trackers, no fingerprinting.</li>
        <li>No selling or sharing of anything, to anyone, for any purpose.</li>
        <li>No use of your mockups for training models or for anything other than handing them back to you.</li>
        <li>No email address, no payment details, no location, no contacts.</li>
      </ul>

      <h2>Addresses and abuse prevention</h2>
      <p>
        The endpoints that accept a whole mockup are rate limited so nobody can fill our storage. Doing that needs
        to count requests per caller, so a short-lived counter is kept against your IP address for a
        ten-minute window and then deleted. It is stored as a one-way hash, so the address itself is never
        written down, and it is not attached to your account, your mockups or anything else.
      </p>
      <p>
        Our hosting provider keeps its own standard server logs (address, timestamp, path) for a short period, as
        every web host does. We do not build anything on top of them.
      </p>

      <h2>Cookies</h2>
      <p>
        One cookie, and only if you sign in: the encrypted session cookie that keeps you signed in. There are no
        analytics or advertising cookies, which is why there is no cookie banner. Signing out clears it.
      </p>

      <h2>Other services involved</h2>
      <ul>
        <li>
          <strong>Discord</strong> — only when you choose to sign in, and only for the OAuth exchange. Their{" "}
          <a href="https://discord.com/privacy" target="_blank" rel="noreferrer">
            privacy policy
          </a>{" "}
          covers that.
        </li>
        <li>
          <strong>The rest of Gator.</strong> This tool shares a Discord application with the bot and the
          dashboard, which is why signing in feels familiar &mdash; but it holds its own data, in its own keys,
          and reads none of theirs. Nothing the bot knows about your servers reaches this tool, and nothing you
          build here reaches the bot.
        </li>
        <li>
          <strong>Vercel</strong> hosts the site, and a managed data store holds cloud copies and share links.
        </li>
        <li>
          <strong>Google Fonts</strong> and <strong>jsDelivr</strong> serve the typefaces and the emoji artwork.
          Your browser fetches those files directly from them.
        </li>
        <li>
          <strong>Any image URL you paste.</strong> If you point an avatar or an embed image at a URL, your
          browser loads it from that host, and that host sees the request. Upload the file instead if you would
          rather it stayed local.
        </li>
      </ul>

      <h2>How long we keep things</h2>
      <ul>
        <li>
          <strong>Local mockups and backups</strong> — until you delete them or clear your browser data.
        </li>
        <li>
          <strong>Cloud copies</strong> — until you delete them. Each account keeps its most recent 60; saving past
          that drops the oldest.
        </li>
        <li>
          <strong>Share links</strong> — 14 days, then automatically deleted.
        </li>
        <li>
          <strong>Rate-limit counters</strong> — 10 minutes.
        </li>
      </ul>

      <h2>Deleting your data</h2>
      <p>
        Delete a cloud copy from the Backups panel and it is gone from our store immediately. Clear this
        site&rsquo;s data in your browser and every local copy goes with it. To have everything associated with
        your account removed at once, ask in the{" "}
        <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
          support server
        </a>{" "}
        and we will do it.
      </p>

      <h2>Children</h2>
      <p>
        This tool is not intended for anyone below Discord&rsquo;s minimum age in their country. We do not
        knowingly hold data from anyone below it; if you believe we do, tell us and we will delete it.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the date at the top of the page changes with it, and anything significant will be
        announced in the support server.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions and deletion requests go to the{" "}
        <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
          Gator support server
        </a>
        .
      </p>
    </LegalPage>
  );
}
