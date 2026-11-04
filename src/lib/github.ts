import "server-only";

export type GithubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  archived: boolean;
};

export function isGithubConfigured() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_ORG);
}

export async function listOrgRepos() {
  const { GITHUB_TOKEN: token, GITHUB_ORG: org } = process.env;
  if (!token || !org) throw new Error("GITHUB_TOKEN and GITHUB_ORG must be set.");

  const repos: GithubRepo[] = [];
  for (let page = 1; ; page++) {
    const response = await fetch(
      `https://api.github.com/orgs/${encodeURIComponent(org)}/repos?type=all&per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status} listing repositories.`);
    }

    const batch = (await response.json()) as GithubRepo[];
    repos.push(...batch);
    if (batch.length < 100) return repos.filter((repo) => !repo.archived);
  }
}
