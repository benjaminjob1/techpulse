import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { useTheme } from "@/components/theme-provider";
import type { StockQuote, MarketMover, MarketSentiment, AnalystTarget, AIAnalysis } from "@shared/schema";
import {
  TrendingUp, TrendingDown, Activity, BarChart3, Sun, Moon,
  ArrowUpRight, ArrowDownRight, Minus, Target, AlertTriangle,
  Zap, DollarSign, LineChart, Search, Brain, RefreshCw,
  ThumbsUp, ThumbsDown, Pause, Sparkles, Clock, Grid3X3,
  ChevronRight, Flame
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { useState, useMemo, useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";

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

function DeltaBadge({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const textSize = size === "md" ? "text-sm" : "text-xs";

  if (isNeutral) {
    return (
      <span className={`inline-flex items-center gap-0.5 ${textSize} text-muted-foreground tabular-nums`}>
        <Minus className="w-3 h-3" /> 0.00%
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 ${textSize} font-medium tabular-nums ${
      isPositive ? "text-emerald-500" : "text-red-500"
    }`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {isPositive ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

// Mini sparkline for the stock table
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#10b981" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function StockRow({ stock, sparkData }: { stock: StockQuote; sparkData: number[] }) {
  const isPositive = stock.change >= 0;
  return (
    <Link href={`/stock/${stock.symbol}`}>
      <div
        className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50 last:border-0"
        data-testid={`stock-row-${stock.symbol}`}
      >
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate">{stock.symbol}</span>
          <span className="text-xs text-muted-foreground truncate">{stock.name}</span>
        </div>
        <div className="text-right">
          {sparkData.length > 2 && <Sparkline data={sparkData} positive={isPositive} />}
        </div>
        <div className="text-right tabular-nums">
          <span className="text-sm font-semibold">${stock.price.toFixed(2)}</span>
        </div>
        <div className="text-right tabular-nums min-w-[80px]">
          <DeltaBadge value={stock.changesPercentage} />
        </div>
        <div className="text-right tabular-nums hidden md:block">
          <span className="text-xs text-muted-foreground">{formatMarketCap(stock.marketCap)}</span>
        </div>
        <div className="text-right tabular-nums hidden lg:block">
          <span className="text-xs text-muted-foreground">{formatVolume(stock.volume)}</span>
        </div>
      </div>
    </Link>
  );
}

function MoverRow({ mover, rank }: { mover: MarketMover; rank: number }) {
  return (
    <div className="flex items-center gap-3 py-2 px-1" data-testid={`mover-${mover.symbol}`}>
      <span className="text-xs text-muted-foreground w-4 tabular-nums">{rank}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{mover.symbol}</span>
        <p className="text-xs text-muted-foreground truncate">{mover.name}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium tabular-nums">${mover.price.toFixed(2)}</p>
        <DeltaBadge value={mover.changePercent} />
      </div>
    </div>
  );
}

function KPICard({ title, value, subtitle, icon: Icon, trend }: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="border border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-lg font-bold tabular-nums">{value}</p>
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
      </CardContent>
    </Card>
  );
}

function AnalystTargetBar({ target }: { target: AnalystTarget }) {
  const rangeWidth = target.targetHigh - target.targetLow;
  const currentPos = rangeWidth > 0 ? ((target.currentPrice - target.targetLow) / rangeWidth) * 100 : 50;
  const consensusPos = rangeWidth > 0 ? ((target.targetConsensus - target.targetLow) / rangeWidth) * 100 : 50;

  return (
    <div className="py-2" data-testid={`analyst-target-${target.symbol}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{target.symbol}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {target.consensusRating}
          </Badge>
        </div>
        <span className={`text-xs font-medium tabular-nums ${
          target.upside > 0 ? "text-emerald-500" : "text-red-500"
        }`}>
          {target.upside > 0 ? "+" : ""}{target.upside.toFixed(1)}% upside
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-visible">
        <div
          className="absolute h-full bg-gradient-to-r from-chart-1/40 to-chart-1/70 rounded-full"
          style={{ left: "0%", width: "100%" }}
        />
        {/* Consensus target marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full"
          style={{ left: `${Math.min(Math.max(consensusPos, 2), 98)}%` }}
          title={`Target: $${target.targetConsensus}`}
        />
        {/* Current price marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-foreground rounded-full border-2 border-background"
          style={{ left: `${Math.min(Math.max(currentPos, 2), 98)}%` }}
          title={`Current: $${target.currentPrice}`}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground tabular-nums">${target.targetLow}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">${target.targetHigh}</span>
      </div>
    </div>
  );
}

// ── AI Signal badge ──────────────────────────────────────────────────
function SignalBadge({ signal, confidence }: { signal: string; confidence: string }) {
  const config = {
    BUY: { color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", icon: ThumbsUp },
    SELL: { color: "text-red-400", bg: "bg-red-500/15 border-red-500/30", icon: ThumbsDown },
    HOLD: { color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30", icon: Pause },
  }[signal] || { color: "text-muted-foreground", bg: "bg-muted", icon: Minus };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${config.bg}`}>
      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
      <span className={`text-xs font-bold ${config.color}`}>{signal}</span>
      <span className="text-[10px] text-muted-foreground">({confidence})</span>
    </div>
  );
}

// ── Performance Heat Map ─────────────────────────────────────────────
function HeatMap({ stocks }: { stocks: StockQuote[] }) {
  // Sort by market cap descending — larger stocks get bigger tiles
  const sorted = [...stocks].sort((a, b) => b.marketCap - a.marketCap);
  const maxCap = sorted[0]?.marketCap || 1;

  function getHeatColor(change: number): string {
    if (change > 4) return "bg-emerald-600 text-white";
    if (change > 2) return "bg-emerald-500/80 text-white";
    if (change > 0.5) return "bg-emerald-500/50 text-foreground";
    if (change > 0) return "bg-emerald-500/20 text-foreground";
    if (change === 0) return "bg-muted text-muted-foreground";
    if (change > -0.5) return "bg-red-500/20 text-foreground";
    if (change > -2) return "bg-red-500/50 text-foreground";
    if (change > -4) return "bg-red-500/80 text-white";
    return "bg-red-600 text-white";
  }

  return (
    <div className="grid grid-cols-5 gap-1" data-testid="heat-map">
      {sorted.map((stock) => {
        const relSize = stock.marketCap / maxCap;
        // Larger stocks get taller tiles
        const heightClass = relSize > 0.5 ? "min-h-[72px]" : relSize > 0.2 ? "min-h-[60px]" : "min-h-[52px]";

        return (
          <Link href={`/stock/${stock.symbol}`} key={stock.symbol}>
            <div
              className={`${getHeatColor(stock.changesPercentage)} ${heightClass} rounded-md p-2 flex flex-col justify-between cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all group`}
              title={`${stock.name}: ${stock.changesPercentage >= 0 ? "+" : ""}${stock.changesPercentage.toFixed(2)}%`}
            >
              <span className="text-xs font-bold leading-none">{stock.symbol}</span>
              <div>
                <span className="text-[11px] font-semibold tabular-nums block leading-tight">
                  ${stock.price.toFixed(0)}
                </span>
                <span className="text-[10px] font-medium tabular-nums leading-tight">
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

// ── Sector Breakdown ─────────────────────────────────────────────────
function SectorBreakdown({ stocks }: { stocks: StockQuote[] }) {
  const sectors = useMemo(() => {
    const map = new Map<string, { stocks: StockQuote[]; totalCap: number; avgChange: number }>();
    for (const s of stocks) {
      const sector = s.sector || "Technology";
      if (!map.has(sector)) map.set(sector, { stocks: [], totalCap: 0, avgChange: 0 });
      const entry = map.get(sector)!;
      entry.stocks.push(s);
      entry.totalCap += s.marketCap;
    }
    for (const [, entry] of map) {
      entry.avgChange = entry.stocks.reduce((sum, s) => sum + s.changesPercentage, 0) / entry.stocks.length;
    }
    return [...map.entries()].sort((a, b) => b[1].totalCap - a[1].totalCap);
  }, [stocks]);

  return (
    <div className="space-y-2">
      {sectors.map(([sector, data]) => (
        <div key={sector} className="flex items-center gap-3 py-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium truncate">{sector}</span>
              <span className={`text-xs font-semibold tabular-nums ${
                data.avgChange >= 0 ? "text-emerald-500" : "text-red-500"
              }`}>
                {data.avgChange >= 0 ? "+" : ""}{data.avgChange.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${data.avgChange >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(Math.abs(data.avgChange) * 10, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                {data.stocks.length} stock{data.stocks.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AI Insights Card ─────────────────────────────────────────────────
function AIInsightsCard({ analyses, isLoading, onGenerate, isGenerating }: {
  analyses: AIAnalysis[];
  isLoading: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayAnalyses = showAll ? analyses : analyses.slice(0, 6);

  // Sort: BUY first, then HOLD, then SELL
  const sortOrder = { BUY: 0, HOLD: 1, SELL: 2 };
  const sorted = [...displayAnalyses].sort(
    (a, b) => (sortOrder[a.signal as keyof typeof sortOrder] ?? 1) - (sortOrder[b.signal as keyof typeof sortOrder] ?? 1)
  );

  // Stats
  const buys = analyses.filter(a => a.signal === "BUY").length;
  const holds = analyses.filter(a => a.signal === "HOLD").length;
  const sells = analyses.filter(a => a.signal === "SELL").length;

  if (isLoading) {
    return (
      <Card className="border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            AI Stock Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Stock Insights
          </CardTitle>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50"
            data-testid="generate-ai-btn"
          >
            <RefreshCw className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Analyzing..." : analyses.length > 0 ? "Refresh" : "Generate"}
          </button>
        </div>
        {analyses.length > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">{buys} Buy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-muted-foreground">{holds} Hold</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-muted-foreground">{sells} Sell</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {analyses.length === 0 ? (
          <div className="text-center py-6">
            <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Click "Generate" to get AI analysis for the top tech stocks.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((a) => (
              <Link href={`/stock/${a.symbol}`} key={a.symbol}>
                <div className="p-3 rounded-lg bg-background/60 border border-border/40 hover:border-primary/30 transition-colors cursor-pointer" data-testid={`ai-card-${a.symbol}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold">{a.symbol}</span>
                    <SignalBadge signal={a.signal} confidence={a.confidence} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{a.summary}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.keyFactors.slice(0, 3).map((f, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
            {analyses.length > 6 && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowAll(!showAll); }}
                className="w-full flex items-center justify-center gap-1 py-2 text-xs text-primary hover:text-primary/80 transition-colors"
                data-testid="show-all-ai"
              >
                {showAll ? "Show less" : `Show all ${analyses.length} analyses`}
                <ChevronRight className={`w-3 h-3 transition-transform ${showAll ? "rotate-90" : ""}`} />
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stocks, isLoading: stocksLoading } = useQuery<StockQuote[]>({
    queryKey: ["/api/stocks"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: sentiment } = useQuery<MarketSentiment>({
    queryKey: ["/api/market/sentiment"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: gainers } = useQuery<MarketMover[]>({
    queryKey: ["/api/market/gainers"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: losers } = useQuery<MarketMover[]>({
    queryKey: ["/api/market/losers"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: mostActive } = useQuery<MarketMover[]>({
    queryKey: ["/api/market/active"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: analystTargets } = useQuery<AnalystTarget[]>({
    queryKey: ["/api/analyst/targets"],
  });

  // AI analyses
  const { data: aiAnalyses, isLoading: aiLoading } = useQuery<AIAnalysis[]>({
    queryKey: ["/api/ai/analyses"],
  });

  // Data timestamp
  const { data: timestamp } = useQuery<{ lastUpdated: string; cacheAge: number; source: string }>({
    queryKey: ["/api/data/timestamp"],
    refetchInterval: 60 * 1000,
  });

  // Generate AI analyses mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/analyze-all");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/analyses"] });
    },
  });

  // Fetch price history for each stock (for sparklines)
  const stockSymbols = stocks?.map(s => s.symbol) || [];

  const { data: allHistories } = useQuery<Record<string, number[]>>({
    queryKey: ["/api/all-histories", stockSymbols.join(",")],
    queryFn: async () => {
      if (!stockSymbols.length) return {};
      const results: Record<string, number[]> = {};
      await Promise.all(
        stockSymbols.map(async (symbol) => {
          try {
            const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";
            const res = await fetch(`${API_BASE}/api/stocks/${symbol}/history`);
            const data = await res.json();
            results[symbol] = data.map((p: { close: number }) => p.close);
          } catch {
            results[symbol] = [];
          }
        })
      );
      return results;
    },
    enabled: stockSymbols.length > 0,
  });

  // Filter stocks by search, always sorted by market cap descending
  const filteredStocks = useMemo(() => {
    if (!stocks) return [];
    const sorted = [...stocks].sort((a, b) => b.marketCap - a.marketCap);
    if (!searchQuery) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter(s =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.sector && s.sector.toLowerCase().includes(q))
    );
  }, [stocks, searchQuery]);

  // Compute summary KPIs
  const totalMarketCap = stocks?.reduce((sum, s) => sum + s.marketCap, 0) || 0;
  const avgChange = stocks?.length ? stocks.reduce((sum, s) => sum + s.changesPercentage, 0) / stocks.length : 0;
  const totalVolume = stocks?.reduce((sum, s) => sum + s.volume, 0) || 0;
  const advancers = stocks?.filter(s => s.change > 0).length || 0;
  const decliners = stocks?.filter(s => s.change < 0).length || 0;

  // Find most active stock dynamically
  const mostActiveStock = useMemo(() => {
    if (!stocks || stocks.length === 0) return { symbol: "—", volume: 0 };
    const sorted = [...stocks].sort((a, b) => b.volume - a.volume);
    return sorted[0];
  }, [stocks]);

  // Market cap chart data — top 8 by market cap
  const marketCapData = useMemo(() => {
    if (!stocks) return [];
    return [...stocks]
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 8)
      .map(s => ({
        name: s.symbol,
        value: s.marketCap / 1e12,
        change: s.changesPercentage,
      }));
  }, [stocks]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="TechPulse logo">
              <rect width="28" height="28" rx="6" fill="currentColor" className="text-primary" />
              <path d="M7 14L11 9L15 16L19 11L22 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="22" cy="14" r="2" fill="white" />
            </svg>
            <div>
              <h1 className="text-base font-bold tracking-tight">TechPulse</h1>
              <p className="text-[10px] text-muted-foreground leading-none">Tech Stock Dashboard</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-sm bg-muted/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                data-testid="search-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live data indicator */}
            <div className="flex items-center gap-1.5" title={timestamp?.source || "Live data"}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Live</span>
            </div>

            {/* Sentiment badge */}
            {sentiment && <SentimentIndicator sentiment={sentiment} />}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              data-testid="theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
        {/* Disclaimer */}
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            For informational purposes only. This is not financial advice. Always do your own research before making investment decisions. AI suggestions are algorithmic and should not be the sole basis for trades.
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KPICard
            title="Total Market Cap"
            value={formatMarketCap(totalMarketCap)}
            subtitle="15 Tech Stocks"
            icon={DollarSign}
          />
          <KPICard
            title="Avg Change"
            value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
            subtitle="Today's session"
            icon={LineChart}
            trend={avgChange > 0 ? "up" : avgChange < 0 ? "down" : "neutral"}
          />
          <KPICard
            title="Total Volume"
            value={formatVolume(totalVolume)}
            subtitle={`${advancers} up, ${decliners} down`}
            icon={Activity}
            trend={advancers > decliners ? "up" : "down"}
          />
          <KPICard
            title="Most Active"
            value={mostActiveStock.symbol}
            subtitle={`${formatVolume(mostActiveStock.volume)} shares`}
            icon={Zap}
          />
        </div>

        {/* Performance Heat Map — full width */}
        {stocks && stocks.length > 0 && (
          <Card className="border border-border/50 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                Performance Heat Map
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Color intensity reflects day change magnitude. Tile size reflects relative market cap.</p>
            </CardHeader>
            <CardContent>
              <HeatMap stocks={stocks} />
            </CardContent>
          </Card>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Stock table + Market cap chart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Cap Comparison */}
            <Card className="border border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Market Cap Comparison ($T)
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marketCapData} barCategoryGap="20%">
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                        tickFormatter={(v) => `${v.toFixed(1)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `$${value.toFixed(2)}T`,
                          "Market Cap",
                        ]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {marketCapData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.change >= 0 ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))"}
                            opacity={0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Stock Table */}
            <Card className="border border-border/50">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Tech Stocks
                  </CardTitle>
                  {timestamp && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(timestamp.lastUpdated).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 pt-2 pb-1">
                  <span className="text-[10px] text-muted-foreground">Stock</span>
                  <span className="text-[10px] text-muted-foreground text-right">7D</span>
                  <span className="text-[10px] text-muted-foreground text-right">Price</span>
                  <span className="text-[10px] text-muted-foreground text-right min-w-[80px]">Change</span>
                  <span className="text-[10px] text-muted-foreground text-right hidden md:block">Mkt Cap</span>
                  <span className="text-[10px] text-muted-foreground text-right hidden lg:block">Volume</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {stocksLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : filteredStocks.length === 0 ? (
                  <div className="py-10 text-center">
                    <Search className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No stocks match "{searchQuery}"</p>
                  </div>
                ) : (
                  filteredStocks.map(stock => (
                    <StockRow
                      key={stock.symbol}
                      stock={stock}
                      sparkData={allHistories?.[stock.symbol] || []}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* AI Insights */}
            <AIInsightsCard
              analyses={aiAnalyses || []}
              isLoading={aiLoading || false}
              onGenerate={() => generateMutation.mutate()}
              isGenerating={generateMutation.isPending}
            />

            {/* Sector Breakdown */}
            {stocks && stocks.length > 0 && (
              <Card className="border border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-primary" />
                    Sector Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SectorBreakdown stocks={stocks} />
                </CardContent>
              </Card>
            )}

            {/* Top Movers */}
            <Card className="border border-border/50">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-semibold">Market Movers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="gainers">
                  <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-8 p-0">
                    <TabsTrigger value="gainers" className="flex-1 text-xs rounded-none h-8 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                      <TrendingUp className="w-3 h-3 mr-1" /> Gainers
                    </TabsTrigger>
                    <TabsTrigger value="losers" className="flex-1 text-xs rounded-none h-8 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                      <TrendingDown className="w-3 h-3 mr-1" /> Losers
                    </TabsTrigger>
                    <TabsTrigger value="active" className="flex-1 text-xs rounded-none h-8 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                      <Activity className="w-3 h-3 mr-1" /> Active
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="gainers" className="mt-0 px-3 py-2">
                    {gainers?.slice(0, 5).map((m, i) => <MoverRow key={m.symbol} mover={m} rank={i + 1} />)}
                  </TabsContent>
                  <TabsContent value="losers" className="mt-0 px-3 py-2">
                    {losers?.slice(0, 5).map((m, i) => <MoverRow key={m.symbol} mover={m} rank={i + 1} />)}
                  </TabsContent>
                  <TabsContent value="active" className="mt-0 px-3 py-2">
                    {mostActive?.slice(0, 5).map((m, i) => <MoverRow key={m.symbol} mover={m} rank={i + 1} />)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Analyst Price Targets */}
            {analystTargets && analystTargets.length > 0 && (
              <Card className="border border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Analyst Price Targets
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border/30">
                  {analystTargets.map(target => (
                    <AnalystTargetBar key={target.symbol} target={target} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Perplexity Attribution */}
            <div className="mt-8">
              <PerplexityAttribution />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
