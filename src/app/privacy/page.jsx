import { LegalPage } from "@/app/legal-page";
import { SITE_NAME } from "@/lib/site";

/* The bar shows who is signed in, so this cannot be prerendered at build time. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description: "What Gator Mockups stores, where it stores it, and how long it keeps it.",
};

const sections = [
  {
    title: "What this covers",
    content: (
      <>
        <p>
          <strong>This policy covers this tool only</strong> — the mockup builder at
          mockups.gatorsys.xyz. Everything described below is what <em>the builder</em> collects. The
          Gator bot, gatorsys.xyz and the dashboard are separate services that collect different things
          and have their own policies; nothing on this page describes them.
        </p>
        <p>
          The short version: your mockups live in your own browser. Nothing leaves it unless you sign in
          to save a copy, or you make a share link.
        </p>
      </>
    ),
  },
  {
    title: "What stays on your device",
    content: (
      <p>
        The mockup you are editing, its undo history and every backup you take are written to your
        browser&rsquo;s own storage (IndexedDB and <code>localStorage</code>), along with small
        preferences like whether you chose the light or dark theme. This is the primary copy. It never
        goes anywhere on its own, it is not readable by us, and clearing your browser&rsquo;s site data
        for this domain deletes all of it permanently.
      </p>
    ),
  },
  {
    title: "What we store when you sign in",
    content: (
      <>
        <p>Signing in is optional. If you do, we hold:</p>
        <ul>
          <li>
            <strong>Your Discord user ID, username and avatar URL.</strong> That is the whole of the{" "}
            <code>identify</code> scope, and it is the only scope we request. We do not ask for your
            email, your servers, your friends or any message content, so we could not read them if we
            wanted to.
          </li>
          <li>
            <strong>The mockups you choose to save.</strong> Each is compressed and stored as an opaque
            blob under a key derived from your user ID. We do not index, search or read inside them.
          </li>
        </ul>
        <p>
          Your Discord access token stays inside an encrypted session cookie and is never included in
          anything the browser can read back. Nothing in this app calls Discord after you sign in.
        </p>
      </>
    ),
  },
  {
    title: "Share links",
    content: (
      <>
        <p>
          Making a share link stores a <em>copy</em> of that mockup under a random, unguessable ID. The
          copy is stripped of everything that identifies you: your account ID is not stored with it, and
          it is re-issued with entirely new internal IDs so it cannot be matched against your saved
          version. Anyone with the link can open it; nobody can find it without the link.
        </p>
        <p>
          <strong>Share links delete themselves after fourteen days.</strong> Expiry is enforced by the
          store itself rather than by a cleanup job, so a link is gone at the deadline whether or not
          anything else is running. Share pages are also marked <code>noindex</code> and excluded in{" "}
          <code>robots.txt</code> — public by link is not the same as public to a search engine.
        </p>
      </>
    ),
  },
  {
    title: "What we do not collect",
    content: (
      <ul>
        <li>No analytics, no page-view counting, no session recording, no heatmaps.</li>
        <li>No advertising, no ad networks, no third-party trackers, no fingerprinting.</li>
        <li>No selling or sharing of anything, to anyone, for any purpose.</li>
        <li>No use of your mockups for training models, or for anything but handing them back to you.</li>
        <li>No email address, no payment details, no location, no contacts.</li>
      </ul>
    ),
  },
  {
    title: "Addresses and abuse prevention",
    content: (
      <>
        <p>
          The endpoints that accept a whole mockup are rate limited so nobody can fill our storage. That
          needs to count requests per caller, so a short-lived counter is kept against your IP address for
          a ten-minute window and then deleted. It is stored as a one-way hash, so the address itself is
          never written down, and it is not attached to your account or your mockups.
        </p>
        <p>
          Our hosting provider keeps its own standard server logs (address, timestamp, path) for a short
          period, as every web host does. We do not build anything on top of them.
        </p>
      </>
    ),
  },
  {
    title: "Cookies",
    content: (
      <p>
        One cookie, and only if you sign in: the encrypted session cookie that keeps you signed in. There
        are no analytics or advertising cookies, which is why there is no cookie banner. Signing out
        clears it.
      </p>
    ),
  },
  {
    title: "Other services involved",
    content: (
      <ul>
        <li>
          <strong>Discord</strong> — only when you choose to sign in, and only for the OAuth exchange.
          Their{" "}
          <a href="https://discord.com/privacy" target="_blank" rel="noreferrer">
            privacy policy
          </a>{" "}
          covers that.
        </li>
        <li>
          <strong>The rest of Gator.</strong> This tool shares a Discord application with the bot and the
          dashboard, which is why signing in feels familiar — but it holds its own data, in its own keys,
          and reads none of theirs. Nothing the bot knows about your servers reaches this tool, and
          nothing you build here reaches the bot.
        </li>
        <li>
          <strong>Vercel</strong> hosts the site, and a managed data store holds cloud copies and share
          links.
        </li>
        <li>
          <strong>Google Fonts</strong> and <strong>jsDelivr</strong> serve the typefaces and the emoji
          artwork. Your browser fetches those files directly from them.
        </li>
        <li>
          <strong>Any image URL you paste.</strong> If you point an avatar or an embed image at a URL,
          your browser loads it from that host, and that host sees the request. Upload the file instead if
          you would rather it stayed local.
        </li>
      </ul>
    ),
  },
  {
    title: "How long things are kept",
    content: (
      <ul>
        <li>
          <strong>Local mockups and backups</strong> — until you delete them or clear your browser data.
        </li>
        <li>
          <strong>Cloud copies</strong> — until you delete them. Each account keeps its most recent 60;
          saving past that drops the oldest.
        </li>
        <li>
          <strong>Share links</strong> — 14 days, then automatically deleted.
        </li>
        <li>
          <strong>Rate-limit counters</strong> — 10 minutes.
        </li>
      </ul>
    ),
  },
  {
    title: "Deleting your data",
    content: (
      <p>
        Delete a cloud copy from the Backups panel and it is gone from our store immediately. Clear this
        site&rsquo;s data in your browser and every local copy goes with it. To have everything associated
        with your account removed at once, ask in the support server and we will do it.
      </p>
    ),
  },
  {
    title: "Children, and changes to this policy",
    content: (
      <>
        <p>
          This tool is not intended for anyone below Discord&rsquo;s minimum age in their country. We do
          not knowingly hold data from anyone below it; if you believe we do, tell us and we will delete
          it.
        </p>
        <p>
          If this policy changes, the date at the top of the page changes with it, and anything
          significant will be announced in the support server.
        </p>
      </>
    ),
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      effective="Effective 5 September 2026"
      summary="Your mockups live in your own browser. Nothing leaves it unless you sign in to save a copy, or you make a share link. There is no analytics, no advertising and no tracking of any kind, and we never see your Discord messages, servers or email."
      sections={sections}
    />
  );
}
