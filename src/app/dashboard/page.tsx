"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "../../../components/card";
import { Skeleton } from "../../../components/skeleton";
import Link from "next/link";
import { Token } from "../../../type/token.type";

function Page() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recent")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setTokens(data.tokens);
        setLoading(false);
      });
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">🧿 Meme Token Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))
          : tokens.map((token) => (
              <Card key={token.address} className="rounded-2xl shadow-md">
                <CardContent className="p-4">
                  <h2 className="text-xl font-semibold">
                    {token.name} (${token.symbol})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Liquidity: ${token.liquidity.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Market Cap: ${token.marketCap.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Launched: {token.launchedAgo}
                  </p>
                  <Link
                    href={token.birdeyeUrl}
                    target="_blank"
                    className="text-blue-500 underline text-sm mt-2 inline-block"
                  >
                    View on Birdeye ↗
                  </Link>
                </CardContent>
              </Card>
            ))}
      </div>
    </main>
  );
}

export default Page;
