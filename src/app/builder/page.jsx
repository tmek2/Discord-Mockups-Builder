import { authConfigured, currentUser } from "@/auth";
import { Builder } from "@/editor/builder";

export const metadata = {
  title: "Builder",
  description: "Build a Discord message, embed or Components v2 layout and export it.",
};

/* The session is read here rather than in the client, so the header arrives
   already knowing whether there is an account and the cloud panel does not
   have to draw a signed-out state and then correct itself. */
export default async function BuilderPage() {
  return <Builder user={await currentUser()} canSignIn={authConfigured} />;
}
