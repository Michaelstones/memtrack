// app/api/recent/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../../utils/db";
import { memeTokens } from "../../../../utils/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const tokens = await db
    .select()
    .from(memeTokens)
    .orderBy(desc(memeTokens.createdAt))
    .limit(20); // Or more if needed

  return NextResponse.json(tokens);
}
