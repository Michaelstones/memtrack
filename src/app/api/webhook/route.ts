// app/api/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../../../utils/db";
import { memeTokens } from "../../../../utils/schema";

// Reusable function to send Telegram messages
async function sendTelegramMessage(message: string) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }
    );
  } catch (err) {
    console.error("Failed to send Telegram message:", err);
  }
}

// Reusable function for failure reporting
async function notifyFailure(mint: string, reason: string) {
  const message = `⚠️ *Meme Coin Detection Failed*\n\n❌ Mint: \`${mint}\`\n💬 Reason: ${reason}`;
  await sendTelegramMessage(message);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const events = body.events || [];

  for (const event of events) {
    const mint = event.mint;
    const programId = event.programId;

    if (programId !== "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P") continue;

    try {
      const { data } = await axios.get(
        `https://api.dexscreener.com/tokens/v1/solana/${mint}`
      );

      const tokenData = data?.[0];
      if (!tokenData) {
        await notifyFailure(mint, "No token data found from Dexscreener");
        continue;
      }

      const marketCap = tokenData.marketCap ?? 0;
      const priceUsd = parseFloat(tokenData.priceUsd ?? "0");
      const launchedAgo = timeAgo(Number(tokenData.pairCreatedAt));
      if (marketCap < 50000 && priceUsd < 0.01) {
        const tokenInfo = {
          id: uuidv4(),
          name: tokenData.baseToken.name,
          symbol: tokenData.baseToken.symbol,
          address: tokenData.baseToken.address,
          marketCap,
          launchedAgo: launchedAgo,
          birdeyeUrl: tokenData.url,
        };

        // Save to database
        await db.insert(memeTokens).values(tokenInfo);

        // Notify via Telegram
        await sendTelegramMessage(
          `🚨 *New Meme Coin Detected!*\n\n🪙 Token: ${tokenInfo.name} (${
            tokenInfo.symbol
          })\n💰 Market Cap: $${marketCap.toLocaleString()}\n💵 Price: $${priceUsd}\n🔗 [View on Dexscreener](${
            tokenData.url
          })`
        );
      }
    } catch (error) {
      let message = "Unknown error occurred";
      if (error instanceof Error) {
        message = error.message;
      }
      await notifyFailure(mint, message);
    }
  }

  return NextResponse.json({ ok: true });
}

function timeAgo(timestamp: number): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - timestamp) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds === 1 ? "" : "s"} ago`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
  } else {
    return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
  }
}
