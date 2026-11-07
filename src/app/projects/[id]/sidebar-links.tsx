"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "@/app/workspace.module.css";

export function SidebarLinks({
  projectId,
  hasGithub,
}: {
  projectId: string;
  hasGithub: boolean;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const links = [
    { href: base, label: "General" },
    ...(hasGithub
      ? [
          { href: `${base}/commits`, label: "Commits" },
          { href: `${base}/pull-requests`, label: "Pull requests" },
        ]
      : []),
  ];

  return (
    <nav aria-label="Project" className={styles.sidebarLinks}>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={styles.sidebarLink}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
