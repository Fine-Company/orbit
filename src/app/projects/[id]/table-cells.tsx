import styles from "@/app/workspace.module.css";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function DateCell({ date }: { date: string }) {
  return (
    <td className={`${styles.muted} ${styles.nowrap}`}>
      <time dateTime={date}>{dateFormat.format(new Date(date))}</time>
    </td>
  );
}

export function LinesCell({
  additions,
  deletions,
}: {
  additions: number;
  deletions: number;
}) {
  return (
    <td
      className={styles.lines}
      aria-label={`${additions} lines added, ${deletions} lines removed`}
    >
      <span className={styles.added}>+{additions}</span>{" "}
      <span className={styles.removed}>-{deletions}</span>
    </td>
  );
}
