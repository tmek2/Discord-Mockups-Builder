import Link from "next/link";
import { IconArrowLeft, IconBrandDiscord } from "@tabler/icons-react";
import { authConfigured, currentUser, signIn } from "@/auth";
import { GatorLogo } from "@/gator/gator-logo";
import { ThemeToggle } from "@/gator/theme-toggle";
import { SITE_NAME, SUPPORT_URL } from "@/lib/site";
import "@/app/signin.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Sign in — ${SITE_NAME}`,
  description: "Sign in with Discord to keep a copy of your mockups outside this browser.",
  robots: { index: false, follow: false },
};

/* Auth.js's own reasons, said in words rather than in enum names. Its default
   page prints the code itself, which tells somebody who is stuck nothing at
   all about what to do next. */
const REASONS = {
  Configuration: "Sign-in is not set up correctly on this deployment. Nothing you did caused this.",
  AccessDenied: "Discord did not grant access. If you cancelled the prompt, try again.",
  Verification: "That sign-in link has expired. Start again below.",
  OAuthSignin: "Discord could not be reached. Try again in a moment.",
  OAuthCallback: "Discord sent back something we could not read. Try again.",
  OAuthAccountNotLinked: "That Discord account is already linked to a different sign-in here.",
  SessionRequired: "You need to be signed in to see that.",
};

export default async function SignIn({ searchParams }) {
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : null;
  /* Only our own paths, and never back to this page — an open redirect here
     would be a sign-in that hands the session to somebody else's site, and a
     callback pointing at /signin is a loop. */
  const asked = typeof params?.callbackUrl === "string" ? params.callbackUrl : "/";
  const target = asked.startsWith("/") && !asked.startsWith("//") && !asked.startsWith("/signin") ? asked : "/";

  const user = await currentUser();

  return (
    <div className="s-page">
      <header className="s-bar">
        <Link className="s-back" href={target}>
          <IconArrowLeft size={15} stroke={2} />
          Back to the builder
        </Link>
        <ThemeToggle />
      </header>

      <main className="s-main">
        <div className="s-card">
          <GatorLogo size={38} />
          <h1>{user ? "You are signed in" : "Sign in to Gator Mockups"}</h1>

          {user ? (
            <>
              <p>
                Signed in as <strong>{user.name ?? "your Discord account"}</strong>. Your saved mockups are
                in the Backups panel.
              </p>
              <Link className="s-btn s-btn-solid" href={target}>
                Back to the builder
              </Link>
            </>
          ) : !authConfigured ? (
            <>
              <p>
                Accounts are not set up on this deployment, so there is nothing to sign in to. The builder
                still works: your mockups are saved in this browser, and you can export a PNG, the project
                file or the JSON at any time.
              </p>
              <Link className="s-btn s-btn-solid" href={target}>
                Back to the builder
              </Link>
            </>
          ) : (
            <>
              <p>
                Signing in does one thing: it keeps a copy of your mockups on the deployment, so they
                survive a cleared browser or a different machine. Everything else works without it.
              </p>

              {error ? (
                <p className="s-error" role="alert">
                  {REASONS[error] ?? "That sign-in did not go through. Try again."}
                </p>
              ) : null}

              <form
                action={async () => {
                  "use server";
                  await signIn("discord", { redirectTo: target });
                }}
              >
                <button type="submit" className="s-btn s-btn-discord">
                  <IconBrandDiscord size={18} stroke={1.9} />
                  Continue with Discord
                </button>
              </form>

              <p className="s-fine">
                We ask Discord for <code>identify</code> only — your user ID, username and avatar. Never
                your servers, your messages or your email. See the{" "}
                <Link href="/privacy">privacy policy</Link> and the <Link href="/terms">terms</Link>.
              </p>
            </>
          )}
        </div>

        <p className="s-help">
          Trouble signing in?{" "}
          <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
            Ask in the support server
          </a>
          .
        </p>
      </main>
    </div>
  );
}
