"use client";

import { useState } from "react";
import Link from "next/link";

// Simplified TechPulse Dashboard for Next.js
// This is a draft conversion from Vite - full feature parity pending

export default function Dashboard() {
  const [stocks] = useState([
    { symbol: "NVDA", name: "NVIDIA", price: 875.28, change: 2.45 },
    { symbol: "AAPL", name: "Apple", price: 172.45, change: -0.32 },
    { symbol: "MSFT", name: "Microsoft", price: 378.91, change: 1.12 },
    { symbol: "GOOGL", name: "Google", price: 141.80, change: 0.89 },
    { symbol: "META", name: "Meta", price: 505.67, change: -1.23 },
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg" />
          <div>
            <h1 className="text-xl font-bold">TechPulse</h1>
            <p className="text-sm text-muted-foreground">Tech Stock Dashboard</p>
          </div>
        </div>
        <Link href="https://hub.benjob.me" className="text-blue-500 hover:underline">
          ← Back to Hub
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stocks.map((stock) => (
          <Link
            key={stock.symbol}
            href={`/stock/${stock.symbol}`}
            className="p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">{stock.symbol}</h3>
                <p className="text-sm text-muted-foreground">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono">${stock.price}</p>
                <p className={`text-sm ${stock.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {stock.change >= 0 ? "+" : ""}{stock.change}%
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-muted-foreground">
        Draft Next.js conversion - full features coming soon
      </p>
    </div>
  );
}
