import "server-only";

import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/access";
import { getProject } from "@/lib/projects";

// Every page under /projects/[id] starts here. The layout doesn't protect them:
// it doesn't rerun on navigation, and pages render independently of it.
export async function requireProject(params: Promise<{ id: string }>) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);

  // Same response whether the project is missing or off limits, so a user
  // can't find out which projects exist.
  const project = await getProject(user, id);
  if (!project) notFound();

  return { user, project };
}
