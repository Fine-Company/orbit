# Orbit

Next.js (App Router, TypeScript, CSS Modules) with a [Neon](https://neon.com) Postgres database through [Drizzle ORM](https://orm.drizzle.team) and [Neon Auth](https://neon.com/docs/auth/overview), deployed on [Vercel](https://vercel.com) or as a Docker container.

## Local setup

Requires Node.js 20.9 or later.

1. Install the Neon CLI with `npm i -g neon`, then run `neon link` and `neon deploy`. This provisions the services in `neon.ts` and writes the database and auth variables to `.env.local`.
2. Add `NEON_AUTH_COOKIE_SECRET` to `.env.local`. Neon doesn't provide it, so generate a value of 32 or more characters, for example with `openssl rand -base64 32`.
3. Install dependencies, apply the migrations and start the app:

```bash
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000. The home page shows whether the database is connected.

## Deploy to Vercel

1. Push this repository to GitHub and import it at [vercel.com/new](https://vercel.com/new). Vercel detects Next.js, so no `vercel.json` is needed.
2. Add `DATABASE_URL`, `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` under Settings > Environment Variables. The build fails if the auth variables are missing.
3. Add your domain to the Neon Auth allowlist, or sign-in is rejected with `invalid domain`: `neon neon-auth domain add https://<your-domain>`.
4. Pick the Vercel function region closest to your Neon region to keep query latency low.
5. Deploy, then check `https://<your-domain>/api/health`.

Neon's shared email sender is for development only. Set up custom SMTP before launch, as described in the [production checklist](https://neon.com/docs/auth/production-checklist).

Migrations don't run during deployment. Run `npm run db:migrate` against the target database before deploying a change that depends on them.

## Docker

The `Dockerfile` builds a production image from the Next.js [standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output), and `compose.yaml` runs it on http://localhost:3000. There's no database container: the app uses the Neon database and Neon Auth in `.env.local`, so do steps 1 and 2 of [Local setup](#local-setup) first. Requires Docker with Compose v2.

```bash
npm run docker:migrate   # Apply pending migrations
npm run docker:up        # Build the image and start the app in the background
npm run docker:logs      # Follow the app logs
npm run docker:down      # Stop and remove the container
```

The scripts wrap `docker compose`, so on a machine without Node.js run the commands from `package.json` directly, for example `docker compose up --build -d`.

To run it next to `npm run dev`, which also uses port 3000, pick another port with `ORBIT_PORT`: `ORBIT_PORT=3001 npm run docker:up`, or in PowerShell `$env:ORBIT_PORT=3001; npm run docker:up`.

- The image holds no secrets. `.dockerignore` keeps `.env*` files out of the build, the build uses a placeholder cookie secret, and the container reads the real values from `.env.local` when it starts. Run `npm run docker:up` again after changing them.
- Migrations don't run when the container starts. `npm run docker:migrate` runs `npm run db:migrate` in a one-off container.
- Docker's health check requests `/favicon.ico`. `/api/health` queries the database, and checking it every 30 seconds would stop Neon's compute from scaling to zero.
- `next.config.ts` only turns on standalone output when `NEXT_OUTPUT=standalone`, which the Dockerfile sets, because `next start` doesn't work with it. `npm run build`, `npm run start` and Vercel are unchanged.

To run the image on a server:

1. Add the domain to the Neon Auth allowlist, as in step 3 of [Deploy to Vercel](#deploy-to-vercel).
2. Write the environment variables to a file. Unlike Compose, `docker run --env-file` keeps quotes as part of the value, so leave them out.
3. Apply migrations: `docker build --target migrate -t orbit-migrate .`, then `docker run --rm --env-file <file> orbit-migrate`.
4. Build and start the app: `docker build -t orbit .`, then `docker run -d -p 3000:3000 --env-file <file> orbit`.
5. Serve it over HTTPS, for example behind a reverse proxy. Neon Auth always marks its session cookies `Secure`, and browsers only accept those over plain HTTP on `localhost`.

Running more than one container, or rolling deployments, needs more setup, such as a shared cache. See the Next.js [self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting#multi-server-deployments).

## Database workflow

1. Edit `src/db/schema.ts`.
2. Run `npm run db:generate` to create a SQL migration in `drizzle/`, and commit it.
3. Run `npm run db:migrate` to apply it.

Query from server code only:

```ts
import { getDb } from "@/db";
import { notes } from "@/db/schema";

const allNotes = await getDb().select().from(notes);
```

The `notes` table is an example. Replace it with your own schema.

## Auth

Users and sessions live in the `neon_auth` schema, managed by Neon. `src/proxy.ts` protects every route except `/`, `/api/health`, `/api/auth` and the auth pages. Add public pages to `publicRoutes` there.

The proxy only redirects, so check the session again before reading protected data or changing anything:

```ts
import { auth } from "@/lib/auth/server";

const { data: session } = await auth.getSession();
if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
```

Email verification is required: new users, and existing unverified users at their next sign-in, enter a code at `/auth/verify-email`. `neon.ts` can't declare this setting, and each Neon branch has its own, so turn it on for other branches with:

```bash
neon neon-auth config email-password update --require-email-verification --send-verification-email-on-sign-up --send-verification-email-on-sign-in
```

With Cache Components on, a page that reads the session needs `await connection()` first, inside a `<Suspense>` boundary. `getCurrentUser()` does this for you. See `src/app/dashboard/page.tsx`.

## Roles and projects

Every user has a role, `user` or `admin`, stored by Neon Auth in `neon_auth.user`. New users get `user`.

| Page             | `user`                          | `admin`                           |
| ---------------- | ------------------------------- | --------------------------------- |
| `/dashboard`     | Yes                             | Yes                               |
| `/projects`      | Projects they're a member of    | All projects, and can create them |
| `/projects/[id]`, including its Commits and Pull requests pages | Only if a member, otherwise 404 | Yes, and manages members          |
| `/admin`         | Forbidden                       | Yes, and changes roles            |

Signed-out visitors are sent to the sign-in page from all of these.

Make the first admin in the Neon Console: open **Auth > Users**, then choose **Make admin** from the menu next to the user. After that, admins change roles at `/admin`. Admins can't change their own role, so there is always at least one.

Check access on the server with the helpers in `src/lib/auth/access.ts`. Call `requireAdmin()` first in every admin Server Action, and read projects through `src/lib/projects.ts`, which applies the membership rule. New pages under `/projects/[id]` must call `requireProject()`, because the layout doesn't protect them. Hiding a link isn't protection.

## GitHub projects

The repositories of a GitHub organization are imported as projects each time an admin opens `/projects`. This turns on once these are set in `.env.local`, and in Vercel for deployments:

- `GITHUB_ORG`: the organization login, for example `Fine-Company`.
- `GITHUB_TOKEN`: a [fine-grained token](https://github.com/settings/personal-access-tokens/new) with the organization as resource owner, access to all repositories, read-only **Metadata** and **Contents** permissions, and read and write **Pull requests** permission.

Each sync updates names and descriptions. Archived repositories are skipped, and a repository removed from GitHub stays in Orbit until an admin deletes it. Deleting a project whose repository is still on GitHub only lasts until the next sync, which brings it back without its members. Synced projects follow the same rules as other projects: users only see them once an admin adds them as members.

A synced project has two more pages in its sidebar, both read live from GitHub. **Commits** has a branch dropdown and the latest 50 commits on that branch with the lines each one added and removed. **Pull requests** lists the 20 most recently updated pull requests in any state. The General page previews the latest 5 commits on the default branch and the 5 most recently updated pull requests. Anyone who can open the project sees them, so adding a member to a private repository's project shows them its commits and pull requests.

**New pull request**, on the Pull requests page and in the General preview, opens a popup to choose the two branches and a title. Anyone who can open the project can use it. Every pull request is created with `GITHUB_TOKEN`, so GitHub shows the token's owner as the author, not the Orbit user who created it.

If a private repository is missing, the token can't see it. Check that its resource owner is the organization, not your personal account, and that any approval request has been accepted.

## Scripts

| Command                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `npm run dev`            | Start the development server                   |
| `npm run build`          | Create a production build                      |
| `npm run start`          | Serve the production build                     |
| `npm run lint`           | Run ESLint                                     |
| `npm run typecheck`      | Run the TypeScript compiler                    |
| `npm run db:generate`    | Generate a migration from the schema           |
| `npm run db:migrate`     | Apply pending migrations                       |
| `npm run db:push`        | Push the schema without a migration (dev only) |
| `npm run db:studio`      | Open Drizzle Studio                            |
| `npm run docker:build`   | Build the Docker image                         |
| `npm run docker:up`      | Rebuild the image and start the app in Docker  |
| `npm run docker:down`    | Stop and remove the app container              |
| `npm run docker:logs`    | Follow the app container's logs                |
| `npm run docker:migrate` | Apply pending migrations from a container      |

## Project layout

```
src/app/page.tsx             Home page with the database status
src/app/dashboard/page.tsx   Protected example page
src/app/projects/            Project list and detail pages, limited by membership
src/app/admin/               User roles, admin only
src/app/forbidden.tsx        Page shown when a role check fails
src/app/auth/                Sign-in and sign-up pages and server actions
src/app/api/auth/            Proxy to Neon Auth
src/app/api/health/route.ts  Health check: 200 when the database responds, otherwise 503
src/lib/auth/server.ts       Neon Auth server instance
src/lib/auth/access.ts       Current user, requireUser and requireAdmin
src/lib/projects.ts          Project queries with the access rule
src/lib/github.ts            GitHub API client
src/proxy.ts                 Route protection
src/db/index.ts              Neon client (getDb) and checkDatabase
src/db/schema.ts             Drizzle schema
src/db/auth-schema.ts        Read-only view of the Neon Auth users table
drizzle/                     Generated SQL migrations
drizzle.config.ts            drizzle-kit config
neon.ts                      Neon services for this project
Dockerfile                   Production image and migration image
compose.yaml                 Runs the image with .env.local
.dockerignore                Keeps secrets and local builds out of the image
```
