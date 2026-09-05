import { notFound } from "next/navigation";
import { store, storeConfigured } from "@/lib/store";
import { authConfigured, currentUser } from "@/auth";
import { Builder } from "@/editor/builder";
import { validProject } from "@/lib/validate";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shared mockup" };

/* A shared mockup, opened straight into the builder.
 *
 * It arrives as a working copy rather than as something you are editing in
 * place: there is no way to write back through a share link, and pretending
 * otherwise would let two people believe they were editing the same thing.
 * Saving it keeps it as your own.
 */
export default async function SharedMockup({ params }) {
  const { id } = await params;
  if (!storeConfigured() || !/^[a-z0-9]{6,16}$/.test(id ?? "")) notFound();

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
