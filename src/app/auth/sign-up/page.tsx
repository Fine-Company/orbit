import type { Metadata } from "next";

import { signUp } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign up | Orbit" };

export default function SignUpPage() {
  return (
    <AuthForm
      title="Create your account"
      submitLabel="Sign up"
      action={signUp}
      withName
      alternate={{
        prompt: "Already have an account?",
        label: "Sign in",
        href: "/auth/sign-in",
      }}
    />
  );
}
