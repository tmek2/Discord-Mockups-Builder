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
export const { handlers, auth, signIn, signOut } = NextAuth({
  /* Resolve callbacks against whatever host Vercel actually serves rather than
     a hard-coded one: pinning a host fights Vercel's own domain redirect and
     produces an apex/subdomain loop. */
  trustHost: true,
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
