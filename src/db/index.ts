import "server-only";

import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
    );
  }
  return drizzle({ client: neon(url), schema });
}

let db: ReturnType<typeof createDb> | undefined;

// Created on first use, so `next build` works without DATABASE_URL.
export function getDb() {
  db ??= createDb();
  return db;
}

export type DatabaseStatus = "ok" | "not_configured" | "error";

export async function checkDatabase(): Promise<DatabaseStatus> {
  if (!process.env.DATABASE_URL) return "not_configured";

  try {
    await getDb().execute(sql`select 1`);
    return "ok";
  } catch (error) {
    console.error("Database health check failed", error);
    return "error";
  }
}
