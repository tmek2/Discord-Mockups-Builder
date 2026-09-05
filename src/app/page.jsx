import { auth } from "@/auth";
import { Landing } from "@/gator/landing";

/* The session is read on the server so the header arrives already knowing
   whether there is an account, rather than drawing "Sign in" and then swapping
   it for a face a moment later. */
export default async function Home() {
  const session = await auth().catch(() => null);
  return <Landing user={session?.user ?? null} />;
}
