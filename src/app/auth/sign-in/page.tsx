import type { Metadata } from "next";

import { signIn } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in | Orbit" };

export default function SignInPage() {
  return (
    <AuthForm
      title="Sign in"
      submitLabel="Sign in"
      action={signIn}
      alternate={{
        prompt: "No account yet?",
        label: "Sign up",
        href: "/auth/sign-up",
      }}
    />
  );
}
