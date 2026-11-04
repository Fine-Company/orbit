import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { signOut } from "@/app/auth/actions";
import authStyles from "@/app/auth/auth.module.css";
import { auth } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Dashboard | Orbit" };

async function Account() {
  await connection();
  // The proxy redirects signed-out visitors too, but pages must not rely on it.
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  return (
    <>
      <p>Signed in as {session.user.email}</p>
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
