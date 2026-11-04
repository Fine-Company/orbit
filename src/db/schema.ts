import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Example table so the migration workflow has something to run.
// Replace it with your own schema, then run `npm run db:generate`.
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
