// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

let latestTokens: any[] = []; // in-memory cache

export async function POST(req: NextRequest) {
  const body = await req.json();
  const events = body.events || [];

  for (const event of events) {
    const mint = event.mint;
    const programId = event.programId;

    if (programId === "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P") {
      const { data } = await axios.get(
        `https://api.dexscreener.com/latest/dex/tokens/${mint}`
      );
      const pair = data.pairs?.[0];
      if (!pair) continue;

      const liquidity = parseFloat(pair.liquidity?.usd || "0");
      const marketCap = parseFloat(pair.fdv || "0");

      if (liquidity < 100 && marketCap < 50000) {
        const tokenInfo = {
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          address: mint,
          liquidity,
          marketCap,
          launchedAgo: "Just now",
          birdeyeUrl: pair.url,
        };

        // Add to in-memory cache
        latestTokens.unshift(tokenInfo);
        if (latestTokens.length > 50) latestTokens.pop();

        // Send Telegram alert
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `🚨 *New Meme Coin Detected!*\n\n🪙 Token: ${
              tokenInfo.name
            } (${tokenInfo.symbol})\n💧 Liquidity: $${liquidity.toFixed(
              2
            )}\n📈 Market Cap: $${marketCap.toFixed(
              2
            )}\n🔗 [View on Dexscreener](${pair.url})`,
            parse_mode: "Markdown",
          }
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// Export for other APIs
export function getCachedTokens() {
  return latestTokens;
}
