import styles from "@/app/workspace.module.css";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function FormattedDate({ date }: { date: string }) {
  return <time dateTime={date}>{dateFormat.format(new Date(date))}</time>;
}

export function DateCell({ date }: { date: string }) {
  return (
    <td className={`${styles.muted} ${styles.nowrap}`}>
      <FormattedDate date={date} />
    </td>
  );
}

type LineCounts = { additions: number; deletions: number };

export function Lines({ additions, deletions }: LineCounts) {
  return (
    <span className={styles.lines}>
      <span className={styles.added}>+{additions}</span>{" "}
      <span className={styles.removed}>-{deletions}</span>
    </span>
  );
}

export function LinesCell({ additions, deletions }: LineCounts) {
  return (
    <td aria-label={`${additions} lines added, ${deletions} lines removed`}>
      <Lines additions={additions} deletions={deletions} />
    </td>
  );
}
