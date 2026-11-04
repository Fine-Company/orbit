import { connection } from "next/server";
import { Suspense } from "react";

import { checkDatabase, type DatabaseStatus } from "@/db";

const statusDisplay: Record<
  DatabaseStatus,
  { label: string; hint: string; dot: string }
> = {
  ok: {
    label: "Database connected",
    hint: "Neon is reachable from this deployment.",
    dot: "bg-emerald-500",
  },
  not_configured: {
    label: "Database not configured",
    hint: "Set DATABASE_URL in .env.local, or in your Vercel project settings.",
    dot: "bg-amber-500",
  },
  error: {
    label: "Database unreachable",
    hint: "DATABASE_URL is set, but the query failed. Check the server logs.",
    dot: "bg-red-500",
  },
};

function StatusCard({
  label,
  hint,
  dot,
}: {
  label: string;
  hint: string;
  dot: string;
}) {
  return (
    <div className="flex max-w-md flex-col items-center gap-2 text-center">
      <p className="flex items-center gap-2 font-medium">
        <span className={`size-2.5 rounded-full ${dot}`} />
        {label}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{hint}</p>
    </div>
  );
}

async function DatabaseStatusCard() {
  // Check on every request rather than freezing the result at build time.
  await connection();
  return <StatusCard {...statusDisplay[await checkDatabase()]} />;
}

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <h1 className="text-5xl font-semibold tracking-tight">Orbit</h1>
      <Suspense
        fallback={
          <StatusCard
            label="Checking database"
            hint="Contacting Neon."
            dot="bg-zinc-400"
          />
        }
      >
        <DatabaseStatusCard />
      </Suspense>
    </main>
  );
}
