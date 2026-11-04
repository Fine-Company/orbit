"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthFormState } from "./actions";
import styles from "./auth.module.css";

type AuthFormProps = {
  title: string;
  submitLabel: string;
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  withName?: boolean;
  alternate: { prompt: string; label: string; href: string };
};

export function AuthForm({
  title,
  submitLabel,
  action,
  withName = false,
  alternate,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <main className={styles.main}>
      <form action={formAction} className={styles.form}>
        <h1 className={styles.title}>{title}</h1>

        {withName && (
          <label className={styles.field}>
            Name
            <input name="name" autoComplete="name" required />
          </label>
        )}

        <label className={styles.field}>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>

        <label className={styles.field}>
          Password
          <input
            name="password"
            type="password"
            autoComplete={withName ? "new-password" : "current-password"}
            required
          />
        </label>

        {state?.error && (
          <p role="alert" className={styles.error}>
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className={styles.button}>
          {pending ? "Please wait" : submitLabel}
        </button>

        <p className={styles.alternate}>
          {alternate.prompt} <Link href={alternate.href}>{alternate.label}</Link>
        </p>
      </form>
    </main>
  );
}
