// app/api/recent/route.ts
import { NextResponse } from "next/server";
import { db } from "../../../../utils/db";
import { memeTokens } from "../../../../utils/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const tokens = await db
      .select()
      .from(memeTokens)
      .orderBy(desc(memeTokens.createdAt))
      .limit(20); // Or more if needed

    return NextResponse.json({ tokens: tokens ?? [] });
  } catch (error) {
    let message = "Unknown error occurred";
    if (error instanceof Error) {
      message = error.message;
    }
    return new Response(JSON.stringify({ tokens: message }), { status: 500 });
  }
}
