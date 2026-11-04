"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { projectMembers, projects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/access";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function createProject(formData: FormData) {
  await requireAdmin();

  const name = field(formData, "name");
  if (!name) return;

  const [project] = await getDb()
    .insert(projects)
    .values({ name, description: field(formData, "description") })
    .returning({ id: projects.id });
  redirect(`/projects/${project.id}`);
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();

  await getDb().delete(projects).where(eq(projects.id, field(formData, "projectId")));
  revalidatePath("/projects");
  redirect("/projects");
}

export async function addMember(formData: FormData) {
  await requireAdmin();

  const projectId = field(formData, "projectId");
  await getDb()
    .insert(projectMembers)
    .values({ projectId, userId: field(formData, "userId") })
    .onConflictDoNothing();
  revalidatePath(`/projects/${projectId}`);
}

export async function removeMember(formData: FormData) {
  await requireAdmin();

  const projectId = field(formData, "projectId");
  await getDb()
    .delete(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, field(formData, "userId")),
      ),
    );
  revalidatePath(`/projects/${projectId}`);
}
