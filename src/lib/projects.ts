import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  notInArray,
  sql,
} from "drizzle-orm";

import { getDb } from "@/db";
import { authUsers } from "@/db/auth-schema";
import { projectMembers, projects } from "@/db/schema";
import type { CurrentUser } from "@/lib/auth/access";
import { listOrgRepos } from "@/lib/github";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Every project read goes through these two functions, which apply the access rule.
export async function listProjects(user: CurrentUser) {
  const db = getDb();
  if (user.role === "admin") {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  return db
    .select(getTableColumns(projects))
    .from(projects)
    .innerJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, user.id),
      ),
    )
    .orderBy(desc(projects.createdAt));
}

export async function getProject(user: CurrentUser, id: string) {
  if (!UUID.test(id)) return null;

  const db = getDb();
  const [project] =
    user.role === "admin"
      ? await db.select().from(projects).where(eq(projects.id, id))
      : await db
          .select(getTableColumns(projects))
          .from(projects)
          .innerJoin(
            projectMembers,
            and(
              eq(projectMembers.projectId, projects.id),
              eq(projectMembers.userId, user.id),
            ),
          )
          .where(eq(projects.id, id));

  return project ?? null;
}

// Admin only. Callers must have checked the role.
export async function syncGithubProjects() {
  const repos = await listOrgRepos();
  if (repos.length === 0) return;

  await getDb()
    .insert(projects)
    .values(
      repos.map((repo) => ({
        name: repo.name,
        description: repo.description ?? "",
        githubId: repo.id,
        githubUrl: repo.html_url,
      })),
    )
    .onConflictDoUpdate({
      target: projects.githubId,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        githubUrl: sql`excluded.github_url`,
      },
    });
}

// Admin only. Callers must have passed requireAdmin().
export async function listProjectMembers(projectId: string) {
  return getDb()
    .select({ id: authUsers.id, name: authUsers.name, email: authUsers.email })
    .from(projectMembers)
    .innerJoin(authUsers, eq(authUsers.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId))
    .orderBy(asc(authUsers.email));
}

// Admin only. Callers must have passed requireAdmin().
export async function listUsersOutsideProject(projectId: string) {
  const db = getDb();
  return db
    .select({ id: authUsers.id, name: authUsers.name, email: authUsers.email })
    .from(authUsers)
    .where(
      notInArray(
        authUsers.id,
        db
          .select({ id: projectMembers.userId })
          .from(projectMembers)
          .where(eq(projectMembers.projectId, projectId)),
      ),
    )
    .orderBy(asc(authUsers.email));
}
