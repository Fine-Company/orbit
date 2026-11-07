import type { Metadata } from "next";
import { Suspense } from "react";

import styles from "@/app/workspace.module.css";
import { listProjectMembers, listUsersOutsideProject } from "@/lib/projects";

import { addMember, deleteProject, removeMember } from "../actions";
import { requireProject } from "./project";

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

async function General({ params }: Pick<PageProps<"/projects/[id]">, "params">) {
  const { user, project } = await requireProject(params);

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
    <Suspense fallback={<p className={styles.muted}>Loading project</p>}>
      <General params={params} />
    </Suspense>
  );
}
