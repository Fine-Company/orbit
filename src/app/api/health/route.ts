import { checkDatabase } from "@/db";

export async function GET() {
  const database = await checkDatabase();
  const healthy = database === "ok";

  return Response.json(
    { status: healthy ? "ok" : "degraded", database },
    { status: healthy ? 200 : 503 },
  );
}
