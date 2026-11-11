import styles from "@/app/workspace.module.css";
import {
  type GithubPullRequest,
  listPullRequests,
  PULL_REQUEST_LIMIT,
} from "@/lib/github";

import { DateCell, LinesCell } from "../table-cells";

export function stateLabel({ state, isDraft }: GithubPullRequest) {
  if (isDraft && state === "OPEN") return "Draft";
  return { OPEN: "Open", CLOSED: "Closed", MERGED: "Merged" }[state];
}

async function loadPullRequests(githubUrl: string) {
  try {
    return await listPullRequests(githubUrl);
  } catch (error) {
    console.error("Could not load pull requests", error);
    return null;
  }
}

// Render this only after getProject() has allowed the user to see the project.
export async function PullRequests({ githubUrl }: { githubUrl: string }) {
  const pullRequests = await loadPullRequests(githubUrl);

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
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Author</th>
              <th scope="col">State</th>
              <th scope="col">Updated</th>
              <th scope="col">Lines</th>
              <th scope="col">Number</th>
            </tr>
          </thead>
          <tbody>
            {pullRequests.map((pullRequest) => (
              <tr key={pullRequest.number}>
                <td>{pullRequest.title}</td>
                <td className={`${styles.muted} ${styles.nowrap}`}>
                  {pullRequest.author?.login ?? "Unknown"}
                </td>
                <td className={`${styles.muted} ${styles.nowrap}`}>
                  {stateLabel(pullRequest)}
                </td>
                <DateCell date={pullRequest.updatedAt} />
                <LinesCell
                  additions={pullRequest.additions}
                  deletions={pullRequest.deletions}
                />
                <td>
                  <a href={pullRequest.url} className={styles.sha}>
                    #{pullRequest.number}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pullRequests.length === PULL_REQUEST_LIMIT && (
        <p className={styles.muted}>
          Showing the {PULL_REQUEST_LIMIT} most recently updated pull requests.
        </p>
      )}
    </>
  );
}
