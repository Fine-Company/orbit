import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { signOut } from "@/app/auth/actions";
import authStyles from "@/app/auth/auth.module.css";
import styles from "@/app/workspace.module.css";
import { requireUser } from "@/lib/auth/access";

export const metadata: Metadata = { title: "Dashboard | Orbit" };

async function Account() {
  // The proxy redirects signed-out visitors too, but pages must not rely on it.
  const user = await requireUser();

  return (
    <>
      <p>
        Signed in as {user.email} ({user.role})
      </p>
      <nav className={styles.nav}>
        <Link href="/projects">Projects</Link>
        {user.role === "admin" && <Link href="/admin">Admin</Link>}
      </nav>
      <form action={signOut}>
        <button type="submit" className={authStyles.button}>
          Sign out
        </button>
      </form>
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className={authStyles.main}>
      <div className={authStyles.form}>
        <h1 className={authStyles.title}>Dashboard</h1>
        <Suspense fallback={<p>Loading your account</p>}>
          <Account />
        </Suspense>
      </div>
    </main>
  );
}
