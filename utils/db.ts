// lib/db.ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL, // stored in .env.local
  ssl: { rejectUnauthorized: true },
});

export const db = drizzle(pool);
