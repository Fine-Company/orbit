"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import styles from "@/app/workspace.module.css";

export function BranchSelect({
  branches,
  branch,
}: {
  branches: string[];
  branch: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <select
      key={branch}
      aria-label="Branch"
      defaultValue={branch}
      disabled={pending}
      className={styles.input}
      onChange={(event) => {
        const query = new URLSearchParams({ branch: event.target.value });
        startTransition(() => {
          router.push(`${pathname}?${query}`, { scroll: false });
        });
      }}
    >
      {branches.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
