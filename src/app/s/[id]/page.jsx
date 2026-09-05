import { notFound } from "next/navigation";
import { store, storeConfigured } from "@/lib/store";
import { isShareId } from "@/lib/ids";
import { NO_INDEX } from "@/lib/no-index";
import { authConfigured, currentUser } from "@/auth";
import { Builder } from "@/editor/builder";
import { validProject } from "@/lib/validate";

export const dynamic = "force-dynamic";

/* Public-by-link is not public. A share link is meant to be pasted to one
   person; a search result is a different thing that nobody asked for. */
export const metadata = { title: "Shared mockup", robots: NO_INDEX };

/* A shared mockup, opened straight into the builder.
 *
 * It arrives as a working copy rather than as something you are editing in
 * place: there is no way to write back through a share link, and pretending
 * otherwise would let two people believe they were editing the same thing.
 * Saving it keeps it as your own.
 */
export default async function SharedMockup({ params }) {
  const { id } = await params;
  if (!storeConfigured() || !isShareId(id)) notFound();

  let project = null;
  try {
    const row = await store().getShare(id);
    if (row && validProject(row.project)) project = row.project;
  } catch {
    project = null;
  }
  if (!project) notFound();

  return <Builder user={await currentUser()} canSignIn={authConfigured} shared={project} />;
}
