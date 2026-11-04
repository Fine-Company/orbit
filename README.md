# Orbit

Next.js (App Router, TypeScript, Tailwind) with a [Neon](https://neon.com) Postgres database through [Drizzle ORM](https://orm.drizzle.team), deployed on [Vercel](https://vercel.com).

## Local setup

Requires Node.js 20.9 or later.

1. Create a project in the [Neon console](https://console.neon.tech).
2. Copy `.env.example` to `.env.local` and paste in the pooled and direct connection strings.
3. Install dependencies, apply the migrations and start the app:

```bash
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000. The home page shows whether the database is connected.

## Deploy to Vercel

1. Push this repository to GitHub and import it at [vercel.com/new](https://vercel.com/new). Vercel detects Next.js, so no `vercel.json` is needed.
2. Add the database in one of two ways:
   - **Neon integration (recommended):** in the Vercel project, open Storage and add Neon. This sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`, and can create a database branch for each preview deployment.
   - **Manually:** add both variables under Settings > Environment Variables.
3. Pick the Vercel function region closest to your Neon region to keep query latency low.
4. Deploy, then check `https://<your-domain>/api/health`.

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
src/app/api/health/route.ts  Health check: 200 when the database responds, otherwise 503
src/db/index.ts              Neon client (getDb) and checkDatabase
src/db/schema.ts             Drizzle schema
drizzle/                     Generated SQL migrations
drizzle.config.ts            drizzle-kit config
```
