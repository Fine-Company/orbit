import { listRepoBranches } from "@/lib/github";

import { PullRequestDialog } from "./pull-request-dialog";

async function loadBranches(githubUrl: string) {
  try {
    return await listRepoBranches(githubUrl);
  } catch (error) {
    console.error("Could not load branches", error);
    return null;
  }
}

// Render this only after getProject() has allowed the user to see the project.
export async function NewPullRequest({
  projectId,
  githubUrl,
}: {
  projectId: string;
  githubUrl: string;
}) {
  const data = await loadBranches(githubUrl);
  // An empty repository has no branches to choose from.
  if (!data || data.branches.length === 0) return null;

  return (
    <PullRequestDialog
      projectId={projectId}
      branches={data.branches}
      defaultBranch={data.defaultBranch}
    />
  );
}
