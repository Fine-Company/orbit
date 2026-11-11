import "server-only";

import { cache } from "react";

export type GithubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  archived: boolean;
};

export type GithubCommit = {
  oid: string;
  url: string;
  message: string;
  additions: number;
  deletions: number;
  authoredDate: string;
  author: { name: string | null } | null;
};

export type GithubPullRequest = {
  number: number;
  title: string;
  url: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  isDraft: boolean;
  additions: number;
  deletions: number;
  updatedAt: string;
  author: { login: string } | null;
};

export const COMMIT_LIMIT = 50;
export const PULL_REQUEST_LIMIT = 20;
export const PREVIEW_LIMIT = 5;

export class GithubError extends Error {
  constructor(
    message: string,
    readonly status: number,
    // GitHub's explanation, when it gives one.
    readonly reason?: string,
  ) {
    super(message);
  }
}

export function isGithubConfigured() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_ORG);
}

async function githubRequest<T>(path: string, init?: RequestInit) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN must be set.");

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body: { errors?: { message?: string }[] } | null = await response
      .json()
      .catch(() => null);
    throw new GithubError(
      `GitHub returned ${response.status} for ${path}.`,
      response.status,
      body?.errors?.[0]?.message,
    );
  }
  return (await response.json()) as T;
}

async function githubGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
) {
  const { data, errors } = await githubRequest<{
    data?: T;
    errors?: { message: string }[];
  }>("/graphql", {
    method: "POST",
    body: JSON.stringify({ query, variables }),
  });
  // GraphQL reports failures in the body of a 200 response.
  if (errors?.length || !data) {
    throw new Error(`GitHub: ${errors?.[0].message ?? "empty response"}`);
  }
  return data;
}

async function githubGetAll<T>(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const batch = await githubRequest<T[]>(
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

function repoName(githubUrl: string) {
  const [, owner, name] = new URL(githubUrl).pathname.split("/");
  return { owner, name };
}

// The token can reach every repository in the organization, so callers must
// have passed getProject() before using the functions below.
// Cached per request, because several parts of a page need the branches.
export const listRepoBranches = cache(async (githubUrl: string) => {
  const path = repoPath(githubUrl);
  const [repo, branches] = await Promise.all([
    githubRequest<{ default_branch: string }>(path),
    githubGetAll<{ name: string }>(`${path}/branches`),
  ]);
  return {
    defaultBranch: repo.default_branch,
    branches: branches.map((branch) => branch.name),
  };
});

// GraphQL, because the REST commit list has no line counts and would need a
// separate request for every commit.
const COMMITS_QUERY = `
  query ($owner: String!, $name: String!, $ref: String!, $limit: Int!) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $ref) {
        target {
          ... on Commit {
            history(first: $limit) {
              nodes {
                oid
                url
                message
                additions
                deletions
                authoredDate
                author { name }
              }
            }
          }
        }
      }
    }
  }
`;

export async function listBranchCommits(
  githubUrl: string,
  branch: string,
  limit = COMMIT_LIMIT,
) {
  const data = await githubGraphql<{
    repository: {
      ref: { target: { history: { nodes: GithubCommit[] } } } | null;
    } | null;
  }>(COMMITS_QUERY, {
    ...repoName(githubUrl),
    ref: `refs/heads/${branch}`,
    limit,
  });
  return data.repository?.ref?.target.history.nodes ?? [];
}

const PULL_REQUESTS_QUERY = `
  query ($owner: String!, $name: String!, $limit: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: $limit, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          number
          title
          url
          state
          isDraft
          additions
          deletions
          updatedAt
          author { login }
        }
      }
    }
  }
`;

export async function listPullRequests(
  githubUrl: string,
  limit = PULL_REQUEST_LIMIT,
) {
  const data = await githubGraphql<{
    repository: { pullRequests: { nodes: GithubPullRequest[] } } | null;
  }>(PULL_REQUESTS_QUERY, {
    ...repoName(githubUrl),
    limit,
  });
  return data.repository?.pullRequests.nodes ?? [];
}

export async function createPullRequest(
  githubUrl: string,
  pullRequest: { title: string; head: string; base: string },
) {
  await githubRequest(`${repoPath(githubUrl)}/pulls`, {
    method: "POST",
    body: JSON.stringify(pullRequest),
  });
}
