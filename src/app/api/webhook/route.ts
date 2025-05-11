import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../../../utils/db";
import { memeTokens } from "../../../../utils/schema";

// Validate environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
  throw new Error("Environment variables not configured");
}

const PUMP_FUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

// Reusable function to send Telegram messages
async function sendTelegramMessage(message: string): Promise<void> {
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }
    );
  } catch (err) {
    console.error("Failed to send Telegram message:", err);
    throw new Error("Telegram notification failed");
  }
}

// Reusable function for failure reporting
async function notifyFailure(mint: string, reason: string): Promise<void> {
  const message = `⚠️ *Meme Coin Detection Failed*\n\n❌ Mint: \`${mint}\`\n💬 Reason: ${reason}`;
  await sendTelegramMessage(message);
}

// Function to calculate time ago
function timeAgo(timestamp: number): string {
  const now = Date.now();
  // Convert seconds to milliseconds if timestamp is in seconds
  const ts = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const diffInSeconds = Math.floor((now - ts) / 1000);
  if (diffInSeconds < 0) return "Just now";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = Array.isArray(body) ? body : [];
    // console.log("Received events:", events);

    for (const event of events) {
      // Verify event type
      // if (event.type !== "TOKEN_MINT") {
      //   console.log(`Skipping event: Type=${event.type}, expected TOKEN_MINT`);
      //   notifyFailure("mint", `Processing error: ${"message"}`);
      //   continue;
      // }
      // Extract mint and program ID from Helius webhook structure
      const mint = event?.accountData?.[0]?.mint;
      const programIds = event?.transaction?.meta?.programIds || [];
      // console.log(mint, programIds);

      if (!mint || !programIds.includes(PUMP_FUN_PROGRAM_ID)) {
        console.log(`Skipping event: Mint=${mint}, ProgramID not pump.fun`);
        notifyFailure(mint, `Processing error: ${"message"}`);
        continue;
      }

      try {
        // Fetch token data from DEXScreener
        const { data } = await axios.get(
          `https://api.dexscreener.com/latest/dex/tokens/${mint}`
        );

        notifyFailure(data, "No token data found from DEXScreener");
        const tokenData = data?.pairs?.[0];
        if (!tokenData) {
          await notifyFailure(mint, "No token data found from DEXScreener");
          continue;
        }

        const marketCap = tokenData.marketCap ?? 0;
        const priceUsd = parseFloat(tokenData.priceUsd ?? "0");
        const launchedAgo = timeAgo(Number(tokenData.pairCreatedAt));

        // Memecoin criteria: low market cap and price
        if (marketCap < 50000 && priceUsd < 0.01) {
          const tokenInfo = {
            id: uuidv4(),
            name: tokenData.baseToken.name,
            symbol: tokenData.baseToken.symbol,
            address: tokenData.baseToken.address,
            marketCap,
            launchedAgo,
            birdeyeUrl: tokenData.url,
          };

          // Save to database with error handling
          try {
            await db.insert(memeTokens).values(tokenInfo);
            console.log(`Saved token ${tokenInfo.name} to database`);
          } catch (dbError) {
            console.error("Database error:", dbError);
            await notifyFailure(mint, "Failed to save to database");
            continue;
          }

          // Notify via Telegram
          const message = `🚨 *New Meme Coin Detected!*\n\n🪙 Token: ${
            tokenInfo.name
          } (${
            tokenInfo.symbol
          })\n💰 Market Cap: $${marketCap.toLocaleString()}\n💵 Price: $${priceUsd.toFixed(
            6
          )}\n⏰ Launched: ${launchedAgo}\n🔗 [View on DEXScreener](${
            tokenData.url
          })`;
          await sendTelegramMessage(message);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        await notifyFailure(mint, `Processing error: ${message}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
