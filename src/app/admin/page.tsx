import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import styles from "@/app/workspace.module.css";
import { getDb } from "@/db";
import { authUsers } from "@/db/auth-schema";
import { requireAdmin } from "@/lib/auth/access";

import { setUserRole } from "./actions";

export const metadata: Metadata = { title: "Admin | Orbit" };

async function Users() {
  const currentUser = await requireAdmin();
  const users = await getDb()
    .select({
      id: authUsers.id,
      name: authUsers.name,
      email: authUsers.email,
      role: authUsers.role,
    })
    .from(authUsers)
    .orderBy(asc(authUsers.email));

  return (
    <>
      <h1 className={styles.title}>Admin</h1>
      <section className={styles.section}>
        <h2 className={styles.heading}>Users</h2>
        <ul className={styles.list}>
          {users.map((user) => {
            const isAdmin = user.role === "admin";
            return (
              <li key={user.id} className={styles.row}>
                <div className={styles.rowText}>
                  <p>{user.name}</p>
                  <p className={styles.muted}>
                    {user.email}, {isAdmin ? "admin" : "user"}
                  </p>
                </div>
                {user.id !== currentUser.id && (
                  <form action={setUserRole}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="hidden"
                      name="role"
                      value={isAdmin ? "user" : "admin"}
                    />
                    <button type="submit" className={styles.button}>
                      {isAdmin ? "Remove admin" : "Make admin"}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

export default function AdminPage() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/projects">Projects</Link>
      </nav>
      <Suspense fallback={<p className={styles.muted}>Loading</p>}>
        <Users />
      </Suspense>
    </main>
  );
}
