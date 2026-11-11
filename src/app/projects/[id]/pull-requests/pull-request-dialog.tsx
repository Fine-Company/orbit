"use client";

import {
  type SubmitEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { flushSync } from "react-dom";

import styles from "@/app/workspace.module.css";

import { openPullRequest } from "./actions";

type DialogProps = {
  projectId: string;
  branches: string[];
  defaultBranch: string;
};

function BranchField({
  label,
  name,
  branches,
  value,
  onChange,
}: {
  label: string;
  name: string;
  branches: string[];
  value: string;
  onChange: (branch: string) => void;
}) {
  return (
    <label className={styles.field}>
      {label}
      <select
        name={name}
        value={value}
        className={styles.input}
        onChange={(event) => onChange(event.target.value)}
      >
        {branches.map((branch) => (
          <option key={branch} value={branch}>
            {branch}
          </option>
        ))}
      </select>
    </label>
  );
}

function PullRequestForm({
  projectId,
  branches,
  defaultBranch,
  headingId,
  onClose,
}: DialogProps & { headingId: string; onClose: () => void }) {
  const [from, setFrom] = useState(
    branches.find((branch) => branch !== defaultBranch) ?? defaultBranch,
  );
  const [to, setTo] = useState(defaultBranch);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Submitted by hand, because a form action resets the selects when it ends,
  // and a failed attempt has to keep what the user chose.
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await openPullRequest(projectId, formData);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <form className={styles.dialogForm} onSubmit={submit}>
      <h2 id={headingId} className={styles.heading}>
        New pull request
      </h2>
      <BranchField
        label="From"
        name="from"
        branches={branches}
        value={from}
        onChange={setFrom}
      />
      <BranchField
        label="To"
        name="to"
        branches={branches}
        value={to}
        onChange={setTo}
      />
      <label className={styles.field}>
        Title
        <input
          name="title"
          required
          maxLength={256}
          className={styles.input}
        />
      </label>
      {from === to && (
        <p className={styles.muted}>
          {branches.length === 1
            ? "This repository only has one branch."
            : "Choose two different branches."}
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.dialogActions}>
        <button
          type="button"
          disabled={pending}
          className={styles.button}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || from === to}
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          {pending ? "Creating" : "Create pull request"}
        </button>
      </div>
    </form>
  );
}

export function PullRequestDialog(props: DialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  // A new key on each open clears the last title, choices and error.
  const [formKey, setFormKey] = useState(0);

  // Navigating away hides this page instead of unmounting it. A modal left open
  // would keep the next page from being clicked, so close it here.
  useLayoutEffect(() => {
    const element = dialog.current;
    return () => element?.close();
  }, []);

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          // The form has to remount before showModal() moves focus into it.
          flushSync(() => setFormKey((key) => key + 1));
          dialog.current?.showModal();
        }}
      >
        New pull request
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={headingId}
        className={styles.dialog}
      >
        <PullRequestForm
          key={formKey}
          {...props}
          headingId={headingId}
          onClose={() => dialog.current?.close()}
        />
      </dialog>
    </>
  );
}
