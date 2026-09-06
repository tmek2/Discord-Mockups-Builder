import { LegalPage } from "@/app/legal-page";
import { SITE_NAME, SUPPORT_URL } from "@/lib/site";

/* The nav shows who is signed in, so this cannot be prerendered at build
   time — a static copy would serve everyone the signed-out header. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: `Terms of Service — ${SITE_NAME}`,
  description: "The rules for using Gator Mockups, and what we are and are not responsible for.",
};

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="5 September 2026">
      <div className="l-note">
        <p>
          <strong>The short version.</strong> Gator Mockups draws fake Discord messages. Do not use one to
          pretend something real happened, to impersonate anybody, or to hurt anybody. What you make with it is
          your responsibility, not ours.
        </p>
        <p>
          <strong>These terms cover this tool only</strong> &mdash; the mockup builder at mockups.gatorsys.xyz.
          They are not the terms for the Gator bot, for gatorsys.xyz, or for the dashboard. Those have their own,
          and using this page changes nothing about them.
        </p>
      </div>

      <h2>1. What this is, and what it is not</h2>
      <p>
        Gator Mockups (&ldquo;the tool&rdquo;) is a free visual editor for drawing what a Discord message would
        look like. It renders a picture of the Discord client. It does not connect to Discord, it cannot read or
        send anything on Discord, and nothing you build here is ever posted anywhere.
      </p>
      <p>
        It is made by the same people as the rest of <strong>Gator</strong> (&ldquo;we&rdquo;,
        &ldquo;us&rdquo;), but it is a separate thing that happens to share a sign-in.{" "}
        <strong>
          Everything on this page is about the mockup builder and nothing else.
        </strong>{" "}
        The Gator bot, gatorsys.xyz, the dashboard and the documentation are separate services with their own
        terms; nothing here grants, limits or describes anything about them. If you are looking for the bot&rsquo;s
        terms, they are not this page.
      </p>
      <p>
        By using the tool you agree to these terms. If you do not agree with them, do not use it — nothing here
        is required of you, and closing the tab is enough.
      </p>

      <h2>2. Who can use it</h2>
      <p>
        You must be old enough to use Discord where you live — 13 in most places, older in some. If you sign in,
        you must be doing so with your own Discord account and you must be following{" "}
        <a href="https://discord.com/terms" target="_blank" rel="noreferrer">
          Discord&rsquo;s Terms of Service
        </a>{" "}
        while you do it. Being blocked from Gator or from Discord means you may not use this tool either.
      </p>

      <h2>3. Your account</h2>
      <p>
        Signing in is optional and exists for one reason: to keep a copy of your mockups somewhere other than
        your browser. We ask Discord only for <code>identify</code> — your user ID, username and avatar. We never
        ask for your servers, your messages, your email or your friends, and we cannot act on your Discord
        account.
      </p>
      <p>
        Signing in here signs you in <em>here</em>. It gives this tool no access to anything the Gator bot can
        see or do in your servers, and it is not a Gator account in any wider sense &mdash; the session is this
        site&rsquo;s alone.
      </p>
      <p>
        You are responsible for what happens under your account. If you think somebody else has got into it,
        change it on Discord&rsquo;s side and tell us.
      </p>

      <h2>4. What you make is yours</h2>
      <p>
        You keep every right you already had in what you build here. We claim no ownership of your mockups and we
        do not use them to train anything, advertise anything, or show them to anybody. The only permission you
        give us is the narrow one needed to run the tool: to store your saved copies so we can hand them back to
        you, and to serve a share link to whoever you send it to.
      </p>
      <p>
        You are responsible for having the right to use whatever you put in a mockup — images, avatars, logos,
        server names, quoted text. Do not paste in things you have no right to publish.
      </p>

      <h2>5. Acceptable use</h2>
      <p>
        The tool produces convincing pictures of conversations that never happened. That is the entire point of
        it, and it is also the entire risk. So the line is drawn at deception and harm rather than at fiction:
      </p>
      <p>Do not use Gator Mockups to:</p>
      <ul>
        <li>
          <strong>Pass a mockup off as real.</strong> Never present output from this tool as genuine evidence — in
          a moderation report, a ban appeal, a staff application, a scam accusation, a dispute, a news story, a
          court filing, or anywhere else somebody might act on it believing it happened.
        </li>
        <li>
          <strong>Impersonate.</strong> No mockups made to look like real messages from a specific person, a
          brand, a server&rsquo;s staff, Discord itself, or Discord Trust &amp; Safety.
        </li>
        <li>
          <strong>Harass, threaten or defame.</strong> That includes fabricated messages made to embarrass a real
          person, doxxing, hate speech, and targeted abuse of anybody.
        </li>
        <li>
          <strong>Defraud.</strong> No phishing pages, fake giveaways, fake Nitro or verification prompts, fake
          support flows, or anything built to take somebody&rsquo;s money, account or credentials.
        </li>
        <li>
          <strong>Publish illegal content</strong>, including sexual content involving minors, and including
          anything linking to or advertising malware.
        </li>
        <li>
          <strong>Attack the service.</strong> No scripted hammering of the API, no working around rate limits,
          no attempting to reach other people&rsquo;s saved mockups, no probing our infrastructure or the
          networks behind it, and no pointing the tool at internal or private addresses.
        </li>
      </ul>
      <p>
        Building a mockup for a joke, a meme, a tutorial, a bug report, a design review, a mock-up of a bot you
        are writing, or a piece of obvious fiction is entirely fine. That is what it is for.
      </p>

      <h2>6. We are not responsible for what you make</h2>
      <div className="l-note">
        <p>
          The tool renders what you type. We do not review, approve, verify or endorse anything made with it, and
          we have no way to know what a mockup is later used for.
        </p>
        <p>
          <strong>
            If you use a mockup to deceive, harass, impersonate or defraud somebody, that is your act alone. You
            are solely responsible for it and for anything that follows from it
          </strong>{" "}
          — including any complaint, ban, claim, loss or legal action, whether against you or against us. You
          agree to cover us for any claim brought against us because of something you made or shared with this
          tool.
        </p>
      </div>

      <h2>7. Share links</h2>
      <p>
        A share link is a copy, not a door into your account. Anyone holding the link can open and edit that
        copy; they cannot see who made it, reach your other mockups, or change your saved backup. Share links
        expire automatically <strong>fourteen days</strong> after they are made and cannot be recovered
        afterwards.
      </p>
      <p>
        Treat a share link as public. Anybody you send it to can forward it, and we cannot un-send it. Do not put
        anything in a mockup you would not want a stranger to read.
      </p>

      <h2>8. Availability, and your data</h2>
      <p>
        The tool is free and provided as-is. We may change it, break it, take features away, or shut it down,
        with or without notice. We do not promise it will be up, and we do not promise your cloud copies will
        still be there tomorrow: storage is capped, old copies are dropped once you pass the per-account limit,
        and an outage on our side can lose them.
      </p>
      <p>
        <strong>Keep your own copies of anything you care about.</strong> The tool exports a PNG and the raw
        JSON, and both are yours to hold. Treat the cloud copy as a convenience, never as the only copy.
      </p>

      <h2>9. Enforcement</h2>
      <p>
        We may remove stored mockups, kill share links, block accounts or block addresses that break these terms,
        that place an unreasonable load on the service, or that we reasonably believe are being used to hurt
        somebody. Where it is practical and lawful we will say why. Serious abuse gets reported to Discord or to
        the relevant authorities.
      </p>

      <h2>10. Not Discord</h2>
      <p>
        Gator Mockups is not affiliated with, endorsed by, or sponsored by Discord Inc. &ldquo;Discord&rdquo; and
        the Discord marks belong to Discord Inc. The tool deliberately imitates the look of the Discord client so
        that a preview is useful — but it is a drawing of the client, not the client, and nothing produced here
        comes from Discord.
      </p>
      <p>
        Emoji artwork is Twemoji by X/Twitter and its contributors, used under CC-BY 4.0. Fonts are served from
        Google Fonts under the SIL Open Font License; Discord&rsquo;s own typeface is not redistributed here.
      </p>

      <h2>11. No warranty</h2>
      <p>
        To the fullest extent the law allows, the tool is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo;, without warranty of any kind — express or implied — including fitness for a particular
        purpose, accuracy, or uninterrupted operation. A preview here is our best approximation of the Discord
        client, not a guarantee of how anything will actually render.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        To the fullest extent the law allows, we are not liable for any indirect, incidental, special or
        consequential damages, nor for lost data, lost mockups, lost profit, or lost opportunity, arising from
        your use of the tool or from anybody&rsquo;s use of something made with it. Where liability cannot be
        excluded, it is limited to the amount you have paid us for the tool — which is nothing.
      </p>
      <p>Nothing in these terms limits liability that cannot lawfully be limited.</p>

      <h2>13. Changes</h2>
      <p>
        We may update these terms. The date at the top of this page is when they last changed, and continuing to
        use the tool after that means you accept the new version. If a change is significant, we will say so in
        the support server.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions, takedown requests and abuse reports go to the{" "}
        <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
          Gator support server
        </a>
        . Tell us the share link or the mockup name and what the problem is.
      </p>
    </LegalPage>
  );
}
