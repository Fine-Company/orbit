import type { Metadata } from "next";

import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify your email | Orbit" };

export default function VerifyEmailPage() {
  return <VerifyForm />;
}
