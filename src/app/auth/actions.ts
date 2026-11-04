"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

export type AuthFormState = { error?: string; notice?: string } | null;

// Holds the address being verified, so it never appears in a URL.
const PENDING_EMAIL_COOKIE = "orbit_pending_email";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function startVerification(email: string): Promise<never> {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_EMAIL_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth",
    maxAge: 15 * 60, // Codes expire after 15 minutes.
  });
  redirect("/auth/verify-email");
}

async function pendingEmail() {
  const cookieStore = await cookies();
  return cookieStore.get(PENDING_EMAIL_COOKIE)?.value;
}

// @neon/auth 0.8.2 provides these on the server but types emailOtp as unknown.
type OtpResult = { error: { message?: string } | null };
const emailOtp = auth.emailOtp as {
  verifyEmail(input: { email: string; otp: string }): Promise<OtpResult>;
  sendVerificationOtp(input: {
    email: string;
    type: "email-verification";
  }): Promise<OtpResult>;
};

const expired = { error: "This code request expired. Sign in to get a new one." };

export async function signUp(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email");
  const { error } = await auth.signUp.email({
    name: field(formData, "name"),
    email,
    password: String(formData.get("password") ?? ""),
  });

  if (error) return { error: error.message || "Could not create your account." };
  return startVerification(email);
}

export async function signIn(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email");
  const { error } = await auth.signIn.email({
    email,
    password: String(formData.get("password") ?? ""),
  });

  if (error?.code === "EMAIL_NOT_VERIFIED") return startVerification(email);
  if (error) return { error: error.message || "Could not sign you in." };
  redirect("/dashboard");
}

export async function verifyEmail(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = await pendingEmail();
  if (!email) return expired;

  const { error } = await emailOtp.verifyEmail({
    email,
    otp: field(formData, "code"),
  });

  if (error) return { error: error.message || "That code didn't work." };

  const cookieStore = await cookies();
  cookieStore.delete({ name: PENDING_EMAIL_COOKIE, path: "/auth" });
  redirect("/dashboard");
}

export async function resendCode(): Promise<AuthFormState> {
  const email = await pendingEmail();
  if (!email) return expired;

  const { error } = await emailOtp.sendVerificationOtp({
    email,
    type: "email-verification",
  });

  if (error) return { error: error.message || "Could not send a new code." };
  return { notice: "We sent a new code." };
}

export async function signOut() {
  await auth.signOut();
  redirect("/");
}
