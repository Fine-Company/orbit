"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin, type Role } from "@/lib/auth/access";
import { auth } from "@/lib/auth/server";

// @neon/auth 0.8.2 provides this on the server but types admin as unknown.
const admin = auth.admin as {
  setRole(input: {
    userId: string;
    role: Role;
  }): Promise<{ error: { message?: string } | null }>;
};

export async function setUserRole(formData: FormData) {
  const currentUser = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const role = formData.get("role");
  if (role !== "user" && role !== "admin") return;
  // Stops the last admin from locking everyone out.
  if (userId === currentUser.id) return;

  const { error } = await admin.setRole({ userId, role });
  if (error) throw new Error(error.message || "Could not change the role.");
  revalidatePath("/admin");
}
