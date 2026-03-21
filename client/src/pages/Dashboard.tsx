"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Moon, Sun, TrendingUp, TrendingDown, Activity, RefreshCw, ArrowUpRight, ArrowDownRight, Minus, DollarSign, Zap, Home, Search, Flame, BarChart3 } from "lucide-react";

// Types
interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  previousClose: number;
  open: number;
  pe: number;
  eps: number;
  sector: string;
  dividendYieldTTM?: number;
}

interface MarketSentiment {
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  marketStatus: string;
}

// Utility functions
function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
  return `$${cap.toFixed(0)}`;
}

function formatVolume(vol: number): string {
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
  return vol.toString();
}

// Sentiment indicator
function SentimentIndicator({ sentiment }: { sentiment: MarketSentiment }) {
  const config = {
    BULLISH: { color: "text-emerald-500", bg: "bg-emerald-500/10", icon: TrendingUp, label: "Bullish" },
    BEARISH: { color: "text-red-500", bg: "bg-red-500/10", icon: TrendingDown, label: "Bearish" },
    NEUTRAL: { color: "text-amber-500", bg: "bg-amber-500/10", icon: Minus, label: "Neutral" },
  }[sentiment.sentiment];

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg}`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
    </div>
  );
}

// KPI Card
function KPICard({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <p className="text-xl font-bold font-mono">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${
          trend === "up" ? "bg-emerald-500/10 text-emerald-500" :
          trend === "down" ? "bg-red-500/10 text-red-500" :
          "bg-primary/10 text-primary"
        }`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

// Heat Map
function HeatMap({ stocks }: { stocks: Stock[] }) {
  const sorted = [...stocks].sort((a, b) => b.marketCap - a.marketCap);
  const maxCap = sorted[0]?.marketCap || 1;

  function getHeatColor(change: number): string {
    if (change > 4) return "bg-emerald-600 text-white";
    if (change > 2) return "bg-emerald-500/80 text-white";
    if (change > 0.5) return "bg-emerald-500/50 text-white";
    if (change > 0) return "bg-emerald-500/20 text-white";
    if (change === 0) return "bg-muted text-muted-foreground";
    if (change > -0.5) return "bg-red-500/20 text-white";
    if (change > -2) return "bg-red-500/50 text-white";
    if (change > -4) return "bg-red-500/80 text-white";
    return "bg-red-600 text-white";
  }

  return (
    <div className="grid grid-cols-5 gap-1">
      {sorted.map((stock) => {
        const relSize = stock.marketCap / maxCap;
        const heightClass = relSize > 0.5 ? "min-h-[72px]" : relSize > 0.2 ? "min-h-[60px]" : "min-h-[52px]";

        return (
          <Link href={`/stock/${stock.symbol}`} key={stock.symbol}>
            <div
              className={`${getHeatColor(stock.changesPercentage)} ${heightClass} rounded-md p-2 flex flex-col justify-between cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all`}
            >
              <span className="text-xs font-bold leading-none">{stock.symbol}</span>
              <div>
                <span className="text-[11px] font-semibold font-mono block leading-tight">
                  ${stock.price.toFixed(0)}
                </span>
                <span className="text-[10px] font-medium leading-tight">
                  {stock.changesPercentage >= 0 ? "+" : ""}{stock.changesPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// Delta badge
function DeltaBadge({ value }: { value: number }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground font-medium">
        <Minus className="w-3 h-3" /> 0.00%
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium font-mono ${
      isPositive ? "text-emerald-500" : "text-red-500"
    }`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {isPositive ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

// Stock row
function StockRow({ stock }: { stock: Stock }) {
  const isPositive = stock.change >= 0;
  
  return (
    <Link href={`/stock/${stock.symbol}`}>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/30 last:border-0">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold">{stock.symbol}</span>
          <span className="text-xs text-muted-foreground truncate">{stock.name}</span>
        </div>
        <div className="text-right tabular-nums">
          <span className="text-sm font-semibold font-mono">${stock.price.toFixed(2)}</span>
        </div>
        <div className="text-right min-w-[80px]">
          <DeltaBadge value={stock.changesPercentage} />
        </div>
        <div className="text-right tabular-nums hidden md:block">
          <span className="text-xs text-muted-foreground">{formatMarketCap(stock.marketCap)}</span>
        </div>
      </div>
    </Link>
  );
}

// Mover row
function MoverRow({ stock, rank, type }: { stock: Stock; rank: number; type: "gainers" | "losers" }) {
  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <span className="text-xs text-muted-foreground w-4 tabular-nums">{rank}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{stock.symbol}</span>
        <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium font-mono">${stock.price.toFixed(2)}</p>
        <DeltaBadge value={stock.changesPercentage} />
      </div>
    </div>
  );
}

// Theme toggle
function ThemeToggle({ isDark, toggle }: { isDark: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function Dashboard() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [sentiment, setSentiment] = useState<MarketSentiment>({ sentiment: "NEUTRAL", marketStatus: "unknown" });
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"gainers" | "losers">("gainers");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setIsDark(saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stocksRes, sentimentRes] = await Promise.all([
        fetch("https://stocks.benjob.me/api/stocks"),
        fetch("https://stocks.benjob.me/api/market/sentiment"),
      ]);

      const stocksData = await stocksRes.json();
      const sentimentData = await sentimentRes.json();

      setStocks(stocksData);
      setSentiment(sentimentData);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute KPIs
  const totalMarketCap = useMemo(() => stocks.reduce((sum, s) => sum + s.marketCap, 0), [stocks]);
  const avgChange = useMemo(() => stocks.length ? stocks.reduce((sum, s) => sum + s.changesPercentage, 0) / stocks.length : 0, [stocks]);
  const totalVolume = useMemo(() => stocks.reduce((sum, s) => sum + s.volume, 0), [stocks]);
  const advancers = useMemo(() => stocks.filter(s => s.change > 0).length, [stocks]);
  const decliners = useMemo(() => stocks.filter(s => s.change < 0).length, [stocks]);
  const mostActiveStock = useMemo(() => {
    if (!stocks.length) return { symbol: "—", volume: 0 };
    return [...stocks].sort((a, b) => b.volume - a.volume)[0];
  }, [stocks]);

  // Filter and sort stocks
  const sortedStocks = useMemo(() => {
    const sorted = [...stocks].sort((a, b) => b.marketCap - a.marketCap);
    if (!searchQuery) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter(s =>
      s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [stocks, searchQuery]);

  const gainersList = useMemo(() => 
    [...stocks].sort((a, b) => b.changesPercentage - a.changesPercentage).slice(0, 5),
    [stocks]
  );
  
  const losersList = useMemo(() => 
    [...stocks].sort((a, b) => a.changesPercentage - b.changesPercentage).slice(0, 5),
    [stocks]
  );

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-950" : "bg-gray-100"} transition-colors duration-500`}>
      {/* Background */}
      <div className={`fixed inset-0 -z-10 ${isDark ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black" : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-gray-50 to-white"}`} />
      
      {/* Header */}
      <header className={`sticky top-0 z-50 ${isDark ? "bg-gray-900/80 border-gray-800" : "bg-white/80 border-gray-200"} backdrop-blur-xl border-b`}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg" />
            <div>
              <h1 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>TechPulse</h1>
              <p className="text-[10px] text-muted-foreground">Tech Stock Dashboard</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-8 pl-8 pr-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Live</span>
            </div>
            <SentimentIndicator sentiment={sentiment} />
            <a
              href="https://hub.benjob.me"
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-blue-500"
              aria-label="Go to Hub"
            >
              <Home className="w-4 h-4" />
            </a>
            <ThemeToggle isDark={isDark} toggle={toggleTheme} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KPICard
            title="Total Market Cap"
            value={formatMarketCap(totalMarketCap)}
            subtitle={`${stocks.length} Tech Stocks`}
            icon={DollarSign}
          />
          <KPICard
            title="Avg Change"
            value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
            subtitle="Today's session"
            icon={Activity}
            trend={avgChange > 0 ? "up" : avgChange < 0 ? "down" : "neutral"}
          />
          <KPICard
            title="Total Volume"
            value={formatVolume(totalVolume)}
            subtitle={`${advancers} up, ${decliners} down`}
            icon={Zap}
            trend={advancers > decliners ? "up" : "down"}
          />
          <KPICard
            title="Most Active"
            value={mostActiveStock.symbol}
            subtitle={`${formatVolume(mostActiveStock.volume)} shares`}
            icon={Zap}
          />
        </div>

        {/* Heat Map */}
        {stocks.length > 0 && (
          <div className="bg-card border border-border/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Performance Heat Map</h3>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">Color intensity reflects day change magnitude. Tile size reflects relative market cap.</p>
            <HeatMap stocks={stocks} />
          </div>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Stock Table */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border/50 rounded-xl">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Tech Stocks</h3>
                </div>
                {lastUpdate && (
                  <span className="text-[10px] text-muted-foreground">
                    {lastUpdate}
                  </span>
                )}
              </div>
              
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 pb-2 text-[10px] text-muted-foreground uppercase">
                <span>Stock</span>
                <span className="text-right">Price</span>
                <span className="text-right min-w-[80px]">Change</span>
                <span className="text-right hidden md:block">Mkt Cap</span>
              </div>

              <div className="divide-y divide-border/30">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="px-4 py-3 animate-pulse">
                      <div className="h-4 bg-muted rounded w-24 mb-2" />
                      <div className="h-3 bg-muted rounded w-32" />
                    </div>
                  ))
                ) : sortedStocks.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    No stocks match "{searchQuery}"
                  </div>
                ) : (
                  sortedStocks.map(stock => (
                    <StockRow key={stock.symbol} stock={stock} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Market Movers */}
          <div>
            <div className="bg-card border border-border/50 rounded-xl">
              <div className="px-4 pt-4 pb-2">
                <h3 className="text-sm font-semibold mb-3">Market Movers</h3>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-border/50">
                <button
                  onClick={() => setActiveTab("gainers")}
                  className={`flex-1 text-xs py-2.5 font-medium transition-colors ${
                    activeTab === "gainers" 
                      ? "text-emerald-500 border-b-2 border-emerald-500" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrendingUp className="w-3 h-3 inline mr-1" /> Gainers
                </button>
                <button
                  onClick={() => setActiveTab("losers")}
                  className={`flex-1 text-xs py-2.5 font-medium transition-colors ${
                    activeTab === "losers" 
                      ? "text-red-500 border-b-2 border-red-500" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrendingDown className="w-3 h-3 inline mr-1" /> Losers
                </button>
              </div>

              <div className="p-2">
                {activeTab === "gainers" ? (
                  gainersList.map((stock, i) => (
                    <MoverRow key={stock.symbol} stock={stock} rank={i + 1} type="gainers" />
                  ))
                ) : (
                  losersList.map((stock, i) => (
                    <MoverRow key={stock.symbol} stock={stock} rank={i + 1} type="losers" />
                  ))
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-[10px] text-muted-foreground">
                For informational purposes only. This is not financial advice. Always do your own research.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <Link href="https://hub.benjob.me" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Hub
          </Link>
        </div>
      </main>
    </div>
  );
}
