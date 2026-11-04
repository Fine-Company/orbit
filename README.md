# Orbit

Next.js (App Router, TypeScript, CSS Modules) with a [Neon](https://neon.com) Postgres database through [Drizzle ORM](https://orm.drizzle.team) and [Neon Auth](https://neon.com/docs/auth/overview), deployed on [Vercel](https://vercel.com).

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

With Cache Components on, a page that reads the session needs `await connection()` first, inside a `<Suspense>` boundary. See `src/app/dashboard/page.tsx`.

## Scripts

| Command               | Description                                       |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Start the development server                      |
| `npm run build`       | Create a production build                         |
| `npm run start`       | Serve the production build                        |
| `npm run lint`        | Run ESLint                                        |
| `npm run typecheck`   | Run the TypeScript compiler                       |
| `npm run db:generate` | Generate a migration from the schema              |
| `npm run db:migrate`  | Apply pending migrations                          |
| `npm run db:push`     | Push the schema without a migration (dev only)    |
| `npm run db:studio`   | Open Drizzle Studio                               |

## Project layout

```
src/app/page.tsx             Home page with the database status
src/app/dashboard/page.tsx   Protected example page
src/app/auth/                Sign-in and sign-up pages and server actions
src/app/api/auth/            Proxy to Neon Auth
src/app/api/health/route.ts  Health check: 200 when the database responds, otherwise 503
src/lib/auth/server.ts       Neon Auth server instance
src/proxy.ts                 Route protection
src/db/index.ts              Neon client (getDb) and checkDatabase
src/db/schema.ts             Drizzle schema
drizzle/                     Generated SQL migrations
drizzle.config.ts            drizzle-kit config
neon.ts                      Neon services for this project
```
