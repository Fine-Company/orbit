"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/access";
import {
  createPullRequest,
  GithubError,
  listRepoBranches,
} from "@/lib/github";
import { getProject } from "@/lib/projects";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function errorMessage(error: unknown) {
  if (error instanceof GithubError) {
    if (error.status === 403) {
      return "The GitHub token can't create pull requests. It needs read and write access to Pull requests.";
    }
    // Such as no commits between the branches, or a pull request that already
    // exists for them.
    if (error.status === 422 && error.reason) return error.reason;
  }
  return "Couldn't create the pull request on GitHub.";
}

// Open to anyone who can see the project.
export async function openPullRequest(
  projectId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await requireUser();
  const project = await getProject(user, projectId);
  if (!project?.githubUrl) notFound();

  const title = field(formData, "title");
  const head = field(formData, "from");
  const base = field(formData, "to");
  if (!title) return { error: "Enter a title." };
  if (head === base) return { error: "Choose two different branches." };

  try {
    // Only real branch names reach GitHub. This also rules out the owner:branch
    // form, which would open a pull request from a fork.
    const { branches } = await listRepoBranches(project.githubUrl);
    if (!branches.includes(head) || !branches.includes(base)) {
      return { error: "One of those branches no longer exists." };
    }
    await createPullRequest(project.githubUrl, { title, head, base });
  } catch (error) {
    console.error("Could not create pull request", error);
    return { error: errorMessage(error) };
  }

  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/projects/${project.id}/pull-requests`);
  return {};
}
