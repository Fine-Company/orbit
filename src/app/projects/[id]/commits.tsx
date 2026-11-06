import styles from "@/app/workspace.module.css";
import {
  COMMIT_LIMIT,
  listBranchCommits,
  listRepoBranches,
} from "@/lib/github";

import { BranchSelect } from "./branch-select";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

async function loadCommits(githubUrl: string, requested: unknown) {
  try {
    const { branches, defaultBranch } = await listRepoBranches(githubUrl);
    // An empty repository has no branches, and GitHub has no commits to list.
    if (branches.length === 0) return { branches, branch: "", commits: [] };

    // Only a real branch name from the URL reaches GitHub.
    const branch =
      typeof requested === "string" && branches.includes(requested)
        ? requested
        : defaultBranch;
    return {
      branches,
      branch,
      commits: await listBranchCommits(githubUrl, branch),
    };
  } catch (error) {
    console.error("Could not load commits", error);
    return null;
  }
}

// Render this only after getProject() has allowed the user to see the project.
export async function Commits({
  githubUrl,
  searchParams,
}: {
  githubUrl: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { branch: requested } = await searchParams;
  const data = await loadCommits(githubUrl, requested);

  if (!data) {
    return (
      <p className={styles.muted}>Couldn&apos;t load commits from GitHub.</p>
    );
  }
  if (data.branches.length === 0) {
    return (
      <p className={styles.muted}>This repository has no commits yet.</p>
    );
  }

  return (
    <>
      <BranchSelect branches={data.branches} branch={data.branch} />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Message</th>
              <th scope="col">Author</th>
              <th scope="col">Date</th>
              <th scope="col">Commit</th>
            </tr>
          </thead>
          <tbody>
            {data.commits.map(({ sha, html_url: url, commit }) => (
              <tr key={sha}>
                <td>{commit.message.split("\n")[0]}</td>
                <td className={`${styles.muted} ${styles.nowrap}`}>
                  {commit.author?.name ?? "Unknown"}
                </td>
                <td className={`${styles.muted} ${styles.nowrap}`}>
                  {commit.author && (
                    <time dateTime={commit.author.date}>
                      {dateFormat.format(new Date(commit.author.date))}
                    </time>
                  )}
                </td>
                <td>
                  <a href={url} className={styles.sha}>
                    {sha.slice(0, 7)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.commits.length === COMMIT_LIMIT && (
        <p className={styles.muted}>
          Showing the latest {COMMIT_LIMIT} commits.
        </p>
      )}
    </>
  );
}
