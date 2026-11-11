import Link from "next/link";
import { Suspense } from "react";

import styles from "@/app/workspace.module.css";
import { getCurrentUser } from "@/lib/auth/access";
import { getProject } from "@/lib/projects";

import { SidebarLinks } from "./sidebar-links";

async function ProjectNav({
  params,
}: Pick<LayoutProps<"/projects/[id]">, "params">) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);

  // Pages show the 404 themselves. Here it's enough to reveal nothing.
  const project = user && (await getProject(user, id));
  if (!project) return null;

  return (
    <>
      <p className={styles.sidebarTitle}>{project.name}</p>
      <SidebarLinks
        projectId={project.id}
        hasGithub={Boolean(project.githubUrl)}
      />
    </>
  );
}

export default function ProjectLayout({
  children,
  params,
}: LayoutProps<"/projects/[id]">) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          <Link href="/projects">All projects</Link>
        </nav>
        <Suspense>
          <ProjectNav params={params} />
        </Suspense>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
