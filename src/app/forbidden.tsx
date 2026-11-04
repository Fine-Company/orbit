import Link from "next/link";

import styles from "./workspace.module.css";

export default function Forbidden() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>You don&apos;t have access to this page</h1>
      <p className={styles.muted}>Ask an admin if you think you should.</p>
      <nav className={styles.nav}>
        <Link href="/dashboard">Back to the dashboard</Link>
      </nav>
    </main>
  );
}
