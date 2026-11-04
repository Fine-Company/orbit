import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import styles from "@/app/workspace.module.css";
import { requireUser } from "@/lib/auth/access";
import { listProjects } from "@/lib/projects";

import { createProject } from "./actions";

export const metadata: Metadata = { title: "Projects | Orbit" };

async function Projects() {
  const user = await requireUser();
  const projects = await listProjects(user);

  return (
    <>
      {user.role === "admin" && (
        <form action={createProject} className={styles.inlineForm}>
          <input
            name="name"
            required
            placeholder="Project name"
            aria-label="Project name"
            className={styles.input}
          />
          <input
            name="description"
            placeholder="Description"
            aria-label="Description"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            Create project
          </button>
        </form>
      )}
      {projects.length === 0 ? (
        <p className={styles.muted}>
          {user.role === "admin"
            ? "No projects yet."
            : "You haven't been added to any projects yet."}
        </p>
      ) : (
        <ul className={styles.list}>
          {projects.map((project) => (
            <li key={project.id} className={styles.row}>
              <div className={styles.rowText}>
                <Link href={`/projects/${project.id}`}>{project.name}</Link>
                <p className={styles.muted}>{project.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function ProjectsPage() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
      <h1 className={styles.title}>Projects</h1>
      <Suspense fallback={<p className={styles.muted}>Loading projects</p>}>
        <Projects />
      </Suspense>
    </main>
  );
}
