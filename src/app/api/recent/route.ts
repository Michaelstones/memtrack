// File: app/api/recent/route.ts
import { NextResponse } from "next/server";
import { cache } from "react";

let cacheData: any[] = [];
let lastFetched = 0;

export const dynamic = "force-dynamic"; // Always run server-side

export async function GET() {
  const now = Date.now();
  if (now - lastFetched > 60 * 1000) {
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/detect`
    );
    const data = await res.json();
    cacheData = data.tokens;
    lastFetched = now;
  }

  return NextResponse.json({ tokens: cacheData });
}
