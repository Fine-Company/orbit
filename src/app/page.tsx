import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { checkDatabase, type DatabaseStatus } from "@/db";
import { auth } from "@/lib/auth/server";

import styles from "./page.module.css";

const statusDisplay: Record<
  DatabaseStatus,
  { label: string; hint: string; dot: string }
> = {
  ok: {
    label: "Database connected",
    hint: "Neon is reachable from this deployment.",
    dot: styles.ok,
  },
  not_configured: {
    label: "Database not configured",
    hint: "Set DATABASE_URL in .env.local, or in your Vercel project settings.",
    dot: styles.notConfigured,
  },
  error: {
    label: "Database unreachable",
    hint: "DATABASE_URL is set, but the query failed. Check the server logs.",
    dot: styles.error,
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
    <div className={styles.status}>
      <p className={styles.label}>
        <span className={`${styles.dot} ${dot}`} />
        {label}
      </p>
      <p className={styles.hint}>{hint}</p>
    </div>
  );
}

async function DatabaseStatusCard() {
  // Check on every request rather than freezing the result at build time.
  await connection();
  return <StatusCard {...statusDisplay[await checkDatabase()]} />;
}

async function AccountLinks() {
  await connection();
  const { data: session } = await auth.getSession();

  if (session?.user) {
    return (
      <nav className={styles.links}>
        <Link href="/dashboard">Dashboard</Link>
      </nav>
    );
  }

  return (
    <nav className={styles.links}>
      <Link href="/auth/sign-in">Sign in</Link>
      <Link href="/auth/sign-up">Sign up</Link>
    </nav>
  );
}

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Orbit</h1>
      <Suspense
        fallback={
          <StatusCard
            label="Checking database"
            hint="Contacting Neon."
            dot={styles.pending}
          />
        }
      >
        <DatabaseStatusCard />
      </Suspense>
      <Suspense>
        <AccountLinks />
      </Suspense>
    </main>
  );
}
