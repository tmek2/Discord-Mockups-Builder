import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

/* The same sign-in the rest of Gator uses: Discord, `identify` only.
 *
 * `guilds` is not asked for. The dashboard needs it to know which servers you
 * can manage; a mockup belongs to a person, not a server, so asking would be
 * asking for something never read.
 *
 * The OAuth tokens deliberately never reach the session object — that is
 * served verbatim to the browser at /api/auth/session — so they stay inside
 * the encrypted JWT cookie. Nothing here calls Discord after the exchange, so
 * there is no refresh path to keep alive either.
 */
/* Whether this deployment can sign anybody in.
 *
 * All three are needed and none has a sensible default, so a deployment
 * without them is a legitimate configuration rather than a broken one: the
 * editor runs, saves locally and exports, and the only thing missing is the
 * account. Asking this before calling `auth()` keeps that path quiet — Auth.js
 * logs a MissingSecret error per request otherwise, which is a page of noise
 * about something nobody asked for. */
export const authConfigured = Boolean(
  process.env.AUTH_SECRET && process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET,
);

/** The session, or null — including when sign-in is not configured at all. */
export async function currentUser() {
  if (!authConfigured) return null;
  try {
    const session = await auth();
    return session?.user ?? null;
  } catch {
    // A misconfiguration should cost the account, not the page.
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  /* Resolve callbacks against whatever host Vercel actually serves rather than
     a hard-coded one: pinning a host fights Vercel's own domain redirect and
     produces an apex/subdomain loop. */
  trustHost: true,
  /* Our own pages, not Auth.js's. Its default sign-in screen is a bare box
     that does not look like this site, and its default error screen prints the
     reason as an enum name — which tells somebody who is stuck nothing about
     what to do next. Errors land on the same page so the way forward is always
     the button right there. */
  pages: { signIn: "/signin", error: "/signin" },
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: "https://discord.com/api/oauth2/authorize?scope=identify",
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        const target = new URL(url, baseUrl);
        if (target.origin === baseUrl) return target.toString();
        if (url.startsWith("/")) return `${baseUrl}${url}`;
      } catch {
        /* fall through */
      }
      return baseUrl;
    },
    async jwt({ token, profile }) {
      if (profile?.id) token.id = profile.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
});
