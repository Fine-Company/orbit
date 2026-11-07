import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import styles from "@/app/workspace.module.css";

import { requireProject } from "../project";
import { PullRequests } from "./pull-requests";

export const metadata: Metadata = { title: "Pull requests | Orbit" };

async function ProjectPullRequests({
  params,
}: Pick<PageProps<"/projects/[id]/pull-requests">, "params">) {
  const { project } = await requireProject(params);
  if (!project.githubUrl) notFound();

  return <PullRequests githubUrl={project.githubUrl} />;
}

export default function PullRequestsPage({
  params,
}: PageProps<"/projects/[id]/pull-requests">) {
  return (
    <>
      <h1 className={styles.title}>Pull requests</h1>
      <Suspense
        fallback={<p className={styles.muted}>Loading pull requests</p>}
      >
        <ProjectPullRequests params={params} />
      </Suspense>
    </>
  );
}
