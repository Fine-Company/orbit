import "server-only";

import { eq } from "drizzle-orm";
import { forbidden, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { getDb } from "@/db";
import { authUsers } from "@/db/auth-schema";
import { auth } from "@/lib/auth/server";

export type Role = "user" | "admin";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// The session cookie caches the user, so a role read from it can be out of date.
// The role comes from the database instead, so a change applies on the next request.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;

  const [user] = await getDb()
    .select({
      id: authUsers.id,
      name: authUsers.name,
      email: authUsers.email,
      role: authUsers.role,
    })
    .from(authUsers)
    .where(eq(authUsers.id, session.user.id));
  if (!user) return null;

  // Anything other than an exact "admin" gets the lowest role.
  return { ...user, role: user.role === "admin" ? "admin" : "user" };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") forbidden();
  return user;
}
