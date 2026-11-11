import Link from "next/link";
import { Suspense } from "react";

import styles from "@/app/workspace.module.css";
import {
  listBranchCommits,
  listPullRequests,
  listRepoBranches,
  PREVIEW_LIMIT,
} from "@/lib/github";

import { NewPullRequest } from "./pull-requests/new-pull-request";
import { stateLabel } from "./pull-requests/pull-requests";
import { FormattedDate, Lines } from "./table-cells";

async function loadRecentCommits(githubUrl: string) {
  try {
    const { defaultBranch } = await listRepoBranches(githubUrl);
    return await listBranchCommits(githubUrl, defaultBranch, PREVIEW_LIMIT);
  } catch (error) {
    console.error("Could not load recent commits", error);
    return null;
  }
}

async function loadRecentPullRequests(githubUrl: string) {
  try {
    return await listPullRequests(githubUrl, PREVIEW_LIMIT);
  } catch (error) {
    console.error("Could not load recent pull requests", error);
    return null;
  }
}

async function RecentCommits({ githubUrl }: { githubUrl: string }) {
  const commits = await loadRecentCommits(githubUrl);

  if (!commits) {
    return (
      <p className={styles.muted}>Couldn&apos;t load commits from GitHub.</p>
    );
  }
  if (commits.length === 0) {
    return <p className={styles.muted}>No commits yet.</p>;
  }

  return (
    <ul className={styles.previewList}>
      {commits.map((commit) => (
        <li key={commit.oid}>
          <a href={commit.url} className={styles.previewLink}>
            {commit.message.split("\n")[0]}
          </a>
          <p className={styles.previewMeta}>
            <span>{commit.author?.name ?? "Unknown"}</span>
            <FormattedDate date={commit.authoredDate} />
            <Lines additions={commit.additions} deletions={commit.deletions} />
          </p>
        </li>
      ))}
    </ul>
  );
}

async function RecentPullRequests({ githubUrl }: { githubUrl: string }) {
  const pullRequests = await loadRecentPullRequests(githubUrl);

  if (!pullRequests) {
    return (
      <p className={styles.muted}>
        Couldn&apos;t load pull requests from GitHub.
      </p>
    );
  }
  if (pullRequests.length === 0) {
    return <p className={styles.muted}>No pull requests yet.</p>;
  }

  return (
    <ul className={styles.previewList}>
      {pullRequests.map((pullRequest) => (
        <li key={pullRequest.number}>
          <a href={pullRequest.url} className={styles.previewLink}>
            {pullRequest.title}
          </a>
          <p className={styles.previewMeta}>
            <span>#{pullRequest.number}</span>
            <span>{stateLabel(pullRequest)}</span>
            <Lines
              additions={pullRequest.additions}
              deletions={pullRequest.deletions}
            />
          </p>
        </li>
      ))}
    </ul>
  );
}

// Render this only after getProject() has allowed the user to see the project.
export function PreviewGrid({
  projectId,
  githubUrl,
}: {
  projectId: string;
  githubUrl: string;
}) {
  return (
    <div className={styles.previewGrid}>
      <section className={styles.previewCell}>
        <h2 className={styles.heading}>Recent commits</h2>
        <Suspense fallback={<p className={styles.muted}>Loading commits</p>}>
          <RecentCommits githubUrl={githubUrl} />
        </Suspense>
        <Link
          href={`/projects/${projectId}/commits`}
          className={styles.previewMore}
        >
          All commits
        </Link>
      </section>
      <section className={styles.previewCell}>
        <div className={styles.headerRow}>
          <h2 className={styles.heading}>Pull requests</h2>
          <Suspense>
            <NewPullRequest projectId={projectId} githubUrl={githubUrl} />
          </Suspense>
        </div>
        <Suspense
          fallback={<p className={styles.muted}>Loading pull requests</p>}
        >
          <RecentPullRequests githubUrl={githubUrl} />
        </Suspense>
        <Link
          href={`/projects/${projectId}/pull-requests`}
          className={styles.previewMore}
        >
          All pull requests
        </Link>
      </section>
    </div>
  );
}
