// lib/schema.ts
import { mysqlTable, varchar, float, timestamp } from "drizzle-orm/mysql-core";

export const memeTokens = mysqlTable("meme_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }),
  symbol: varchar("symbol", { length: 20 }),
  address: varchar("address", { length: 50 }),
  marketCap: float("market_cap"),
  launchedAgo: varchar("launched_ago", { length: 50 }),
  birdeyeUrl: varchar("birdeye_url", { length: 2048 }),
  createdAt: timestamp("created_at").defaultNow(),
});
