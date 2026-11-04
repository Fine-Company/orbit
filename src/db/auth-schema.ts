import { pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Read-only view of the table Neon Auth manages. It stays out of drizzle.config.ts
// so drizzle-kit never tries to migrate it. Change users through `auth`, not SQL.
export const authUsers = pgSchema("neon_auth").table("user", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
});
