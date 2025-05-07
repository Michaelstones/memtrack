import { NextResponse } from "next/server";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const MEME_KEYWORDS = [
  "pepe",
  "doge",
  "elon",
  "bonk",
  "inu",
  "meme",
  "cat",
  "shit",
];

export async function GET() {
  const res = await fetch(
    `https://api.helius.xyz/v0/token-metadata?api-key=${HELIUS_API_KEY}&limit=100`
  );
  const data = await res.json();

  const tokens = (data.tokens || []).filter((token: any) => {
    const name = token.name?.toLowerCase() || "";
    return MEME_KEYWORDS.some((kw) => name.includes(kw));
  });

  const formatted = tokens.map((t: any) => ({
    name: t.name,
    symbol: t.symbol,
    address: t.mint,
    liquidity: Math.floor(Math.random() * 10000), // Placeholder
    marketCap: Math.floor(Math.random() * 50000), // Placeholder
    launchedAgo: "Just now",
    birdeyeUrl: `https://birdeye.so/token/${t.mint}?chain=solana`,
  }));

  return NextResponse.json({ tokens: formatted });
}
