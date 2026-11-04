"use client";

import { useActionState } from "react";

import { resendCode, verifyEmail } from "../actions";
import styles from "../auth.module.css";

export function VerifyForm() {
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyEmail,
    null,
  );
  const [resendState, resendAction, resending] = useActionState(
    resendCode,
    null,
  );

  const error = verifyState?.error ?? resendState?.error;

  return (
    <main className={styles.main}>
      <div className={styles.form}>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.alternate}>
          Enter the code we sent you. It expires in 15 minutes.
        </p>

        <form action={verifyAction} className={styles.form}>
          <label className={styles.field}>
            Verification code
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </label>

          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {resendState?.notice && (
            <p role="status" className={styles.alternate}>
              {resendState.notice}
            </p>
          )}

          <button type="submit" disabled={verifying} className={styles.button}>
            {verifying ? "Please wait" : "Verify email"}
          </button>
        </form>

        <form action={resendAction}>
          <button type="submit" disabled={resending} className={styles.link}>
            {resending ? "Sending" : "Send a new code"}
          </button>
        </form>
      </div>
    </main>
  );
}
