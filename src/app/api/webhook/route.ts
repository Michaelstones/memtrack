// File: app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const events = body.events || [];
  for (const event of events) {
    const mintAddress = event.mint;
    const programId = event.programId;

    if (programId === "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P") {
      // Pump.fun

      // DEXscreener search by mint
      const { data } = await axios.get(
        `https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`
      );
      const pair = data.pairs?.[0];
      if (!pair) continue;

      const liquidity = parseFloat(pair.liquidity?.usd || 0);
      const marketCap = parseFloat(pair.fdv || 0);

      if (liquidity < 100 && marketCap < 50000) {
        const message = `🚨 New Meme Coin Detected!\n\n🪙 Token: ${
          pair.baseToken.name
        } (${pair.baseToken.symbol})\n💧 Liquidity: $${liquidity.toFixed(
          2
        )}\n📈 Market Cap: $${marketCap.toFixed(2)}\n🔗 [View on Dexscreener](${
          pair.url
        })`;

        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "Markdown",
          }
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
