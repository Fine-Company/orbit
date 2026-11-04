import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import styles from "@/app/workspace.module.css";
import { requireUser } from "@/lib/auth/access";
import {
  getProject,
  listProjectMembers,
  listUsersOutsideProject,
} from "@/lib/projects";

import { addMember, deleteProject, removeMember } from "../actions";

export const metadata: Metadata = { title: "Project | Orbit" };

async function Members({ projectId }: { projectId: string }) {
  const [members, others] = await Promise.all([
    listProjectMembers(projectId),
    listUsersOutsideProject(projectId),
  ]);

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Members</h2>
      {members.length === 0 ? (
        <p className={styles.muted}>Only admins can see this project.</p>
      ) : (
        <ul className={styles.list}>
          {members.map((member) => (
            <li key={member.id} className={styles.row}>
              <span className={styles.rowText}>
                {member.name} ({member.email})
              </span>
              <form action={removeMember}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="userId" value={member.id} />
                <button type="submit" className={styles.button}>
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {others.length > 0 && (
        <form action={addMember} className={styles.inlineForm}>
          <input type="hidden" name="projectId" value={projectId} />
          <select name="userId" aria-label="User" className={styles.input}>
            {others.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <button type="submit" className={styles.button}>
            Add member
          </button>
        </form>
      )}
      <form action={deleteProject}>
        <input type="hidden" name="projectId" value={projectId} />
        <button type="submit" className={styles.button}>
          Delete project
        </button>
      </form>
    </section>
  );
}

async function Project({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);

  // Same response whether the project is missing or off limits, so a user
  // can't find out which projects exist.
  const project = await getProject(user, id);
  if (!project) notFound();

  return (
    <>
      <h1 className={styles.title}>{project.name}</h1>
      <p className={styles.muted}>{project.description}</p>
      {project.githubUrl && (
        <nav className={styles.nav}>
          <a href={project.githubUrl}>View on GitHub</a>
        </nav>
      )}
      {user.role === "admin" && <Members projectId={project.id} />}
    </>
  );
}

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <Link href="/projects">All projects</Link>
      </nav>
      <Suspense fallback={<p className={styles.muted}>Loading project</p>}>
        <Project params={params} />
      </Suspense>
    </main>
  );
}
