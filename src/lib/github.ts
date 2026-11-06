import "server-only";

export type GithubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  archived: boolean;
};

export type GithubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
};

export const COMMIT_LIMIT = 50;

export function isGithubConfigured() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_ORG);
}

async function githubGet<T>(path: string) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN must be set.");

  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} for ${path}.`);
  }
  return (await response.json()) as T;
}

async function githubGetAll<T>(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const batch = await githubGet<T[]>(
      `${path}${separator}per_page=100&page=${page}`,
    );
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

export async function listOrgRepos() {
  const org = process.env.GITHUB_ORG;
  if (!org) throw new Error("GITHUB_ORG must be set.");

  const repos = await githubGetAll<GithubRepo>(
    `/orgs/${encodeURIComponent(org)}/repos?type=all`,
  );
  return repos.filter((repo) => !repo.archived);
}

function repoPath(githubUrl: string) {
  return `/repos${new URL(githubUrl).pathname}`;
}

// The token can read every repository in the organization, so callers must
// have passed getProject() before showing what these two functions return.
export async function listRepoBranches(githubUrl: string) {
  const path = repoPath(githubUrl);
  const [repo, branches] = await Promise.all([
    githubGet<{ default_branch: string }>(path),
    githubGetAll<{ name: string }>(`${path}/branches`),
  ]);
  return {
    defaultBranch: repo.default_branch,
    branches: branches.map((branch) => branch.name),
  };
}

export async function listBranchCommits(githubUrl: string, branch: string) {
  const query = new URLSearchParams({
    sha: branch,
    per_page: String(COMMIT_LIMIT),
  });
  return githubGet<GithubCommit[]>(`${repoPath(githubUrl)}/commits?${query}`);
}
