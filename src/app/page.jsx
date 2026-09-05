import { authConfigured, currentUser } from "@/auth";
import { Builder } from "@/editor/builder";

/* The builder is the site. There is no landing page and no marketing route:
   somebody arriving here came to draw a message, and a page in front of that
   is a page between them and the thing they came for. */
export default async function Home() {
  return <Builder user={await currentUser()} canSignIn={authConfigured} />;
}
