import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import styles from "@/app/workspace.module.css";

import { requireProject } from "../project";
import { Commits } from "./commits";

export const metadata: Metadata = { title: "Commits | Orbit" };

async function ProjectCommits({
  params,
  searchParams,
}: Pick<PageProps<"/projects/[id]/commits">, "params" | "searchParams">) {
  const { project } = await requireProject(params);
  if (!project.githubUrl) notFound();

  return <Commits githubUrl={project.githubUrl} searchParams={searchParams} />;
}

export default function CommitsPage({
  params,
  searchParams,
}: PageProps<"/projects/[id]/commits">) {
  return (
    <>
      <h1 className={styles.title}>Commits</h1>
      <Suspense fallback={<p className={styles.muted}>Loading commits</p>}>
        <ProjectCommits params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
