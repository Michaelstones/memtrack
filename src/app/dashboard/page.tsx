"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "../../../components/card";
import { Skeleton } from "../../../components/skeleton";
import Link from "next/link";
import { Token } from "../../../type/token.type";

function Page() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/recent")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTokens(data);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">🧿 Meme Token Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500">
          Failed to load token data. Please try again.
        </p>
      ) : tokens.length === 0 ? (
        <p className="text-gray-500 italic">
          No token(s) detected yet. Check back later.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <Card key={token.address} className="rounded-2xl shadow-md">
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold">
                  {token.name} (${token.symbol})
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Liquidity: ${Number(token.liquidity).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Market Cap: ${Number(token.marketCap).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 italic">
                  Launched: Just now
                </p>
                <Link
                  href={token.birdeyeUrl || "#"}
                  target="_blank"
                  className="text-blue-500 underline text-sm mt-2 inline-block"
                >
                  View on Dex ↗
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

export default Page;
