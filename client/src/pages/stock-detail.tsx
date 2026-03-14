import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { useTheme } from "@/components/theme-provider";
import type { StockQuote, PricePoint, AnalystTarget, AIAnalysis, PriceForecast } from "@shared/schema";
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, Sun, Moon,
  TrendingUp, TrendingDown, BarChart3, Target, DollarSign,
  Activity, Layers, Brain, ThumbsUp, ThumbsDown, Pause,
  Sparkles, RefreshCw, Minus, Crosshair, AlertTriangle,
  ArrowUp, ArrowDown, Eye
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { queryClient } from "@/lib/queryClient";

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  return `$${(cap / 1e6).toFixed(1)}M`;
}

function formatVolume(vol: number): string {
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  return `${(vol / 1e3).toFixed(1)}K`;
}

function StatRow({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-sm font-medium tabular-nums">{value}</span>
        {subValue && <p className="text-[10px] text-muted-foreground">{subValue}</p>}
      </div>
    </div>
  );
}

function SignalBadge({ signal, confidence, size = "sm" }: { signal: string; confidence: string; size?: "sm" | "lg" }) {
  const config = {
    BUY: { color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", icon: ThumbsUp },
    SELL: { color: "text-red-400", bg: "bg-red-500/15 border-red-500/30", icon: ThumbsDown },
    HOLD: { color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30", icon: Pause },
  }[signal] || { color: "text-muted-foreground", bg: "bg-muted", icon: Minus };
  const Icon = config.icon;
  const sizeClasses = size === "lg" ? "px-4 py-2 gap-2" : "px-2.5 py-1 gap-1.5";
  return (
    <div className={`inline-flex items-center ${sizeClasses} rounded-md border ${config.bg}`}>
      <Icon className={`${size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5"} ${config.color}`} />
      <span className={`${size === "lg" ? "text-base" : "text-xs"} font-bold ${config.color}`}>{signal}</span>
      <span className={`${size === "lg" ? "text-xs" : "text-[10px]"} text-muted-foreground`}>({confidence})</span>
    </div>
  );
}

export default function StockDetail() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol?.toUpperCase() || "";
  const { theme, toggleTheme } = useTheme();
  const { data: stock, isLoading } = useQuery<StockQuote>({ queryKey: ["/api/stocks", symbol] });
  const { data: history } = useQuery<PricePoint[]>({ queryKey: ["/api/stocks", symbol, "history"] });
  const { data: allTargets } = useQuery<AnalystTarget[]>({ queryKey: ["/api/analyst/targets"] });
  const { data: aiAnalysis, isLoading: aiLoading } = useQuery<AIAnalysis>({ queryKey: ["/api/ai/analysis", symbol] });
  const { data: forecast, isLoading: forecastLoading } = useQuery<PriceForecast>({ queryKey: ["/api/forecast", symbol] });
  const target = allTargets?.find(t => t.symbol === symbol);
  const isPositive = stock ? stock.change >= 0 : false;
  const chartColor = isPositive ? "#10b981" : "#ef4444";
  const rangePos = stock ? ((stock.price - stock.yearLow) / (stock.yearHigh - stock.yearLow)) * 100 : 50;
  const volumeRatio = stock ? (stock.volume / stock.avgVolume) : 1;

  if (isLoading) {
    return (<div className="min-h-screen bg-background p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64 w-full mb-4" /><div className="grid grid-cols-2 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div></div>);
  }

  if (!stock) {
    return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><p className="text-lg font-semibold mb-2">Stock not found</p><Link href="/" className="text-sm text-primary hover:underline">Back to dashboard</Link></div></div>);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="back-link"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted/50 transition-colors" data-testid="theme-toggle-detail">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1"><h1 className="text-xl font-bold">{stock.symbol}</h1>{stock.sector && (<Badge variant="secondary" className="text-xs">{stock.sector}</Badge>)}</div>
              <p className="text-sm text-muted-foreground">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold tabular-nums" data-testid="stock-price">${stock.price.toFixed(2)}</p>
              <div className={`flex items-center justify-end gap-1 text-sm font-medium ${ isPositive ? "text-emerald-500" : "text-red-500" }`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span className="tabular-nums">{isPositive ? "+" : ""}{stock.change.toFixed(2)} ({isPositive ? "+" : ""}{stock.changesPercentage.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />3-Month Price History</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {history && history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chartColor} stopOpacity={0.2} /><stop offset="95%" stopColor={chartColor} stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(d) => { const date = new Date(d); return `${date.getDate()}/${date.getMonth() + 1}`; }} interval={Math.floor((history?.length || 60) / 8)} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={55} domain={["auto", "auto"]} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => [`$${value.toFixed(2)}`, "Close"]} labelFormatter={(label) => { const d = new Date(label); return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }} />
                        <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} fill="url(#colorPrice)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (<div className="h-full flex items-center justify-center text-sm text-muted-foreground">No historical data available</div>)}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-violet-500/20 bg-violet-500/[0.02]">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Crosshair className="w-4 h-4 text-violet-500" />Price Forecast - {stock.symbol}</CardTitle></CardHeader>
              <CardContent>
                {forecastLoading ? (
                  <div className="space-y-3"><Skeleton className="h-8 w-40" />{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-14 w-full" />))}</div>
                ) : forecast && forecast.forecasts ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border ${ forecast.outlook === "BULLISH" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : forecast.outlook === "BEARISH" ? "bg-red-500/15 border-red-500/30 text-red-400" : "bg-amber-500/15 border-amber-500/30 text-amber-400" }`}>
                        {forecast.outlook === "BULLISH" ? <TrendingUp className="w-4 h-4" /> : forecast.outlook === "BEARISH" ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        <span className="text-sm font-bold">{forecast.outlook}</span><span className="text-xs opacity-70">Outlook</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(forecast.generatedAt).toLocaleString()}</span>
                    </div>
                    <div className="space-y-2">
                      {forecast.forecasts.map((f) => {
                        const isUp = f.changePercent >= 0;
                        const rangeWidth = f.high - f.low;
                        const currentInRange = rangeWidth > 0 ? Math.min(Math.max(((forecast.currentPrice - f.low) / rangeWidth) * 100, 0), 100) : 50;
                        const midInRange = rangeWidth > 0 ? ((f.mid - f.low) / rangeWidth) * 100 : 50;
                        return (
                          <div key={f.period} className="p-3 rounded-lg bg-background/60 border border-border/40">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2"><span className="text-xs font-bold bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded">{f.label}</span><Badge variant="secondary" className="text-[10px] px-1.5 py-0">{f.confidence}</Badge></div>
                              <div className="text-right"><span className="text-sm font-bold tabular-nums">${f.mid.toFixed(2)}</span><span className={`ml-1.5 text-xs font-medium tabular-nums ${isUp ? "text-emerald-500" : "text-red-500"}`}>{isUp ? "+" : ""}{f.changePercent.toFixed(1)}%</span></div>
                            </div>
                            <div className="relative h-2 bg-muted rounded-full overflow-visible">
                              <div className="absolute h-full bg-gradient-to-r from-violet-500/30 to-violet-500/50 rounded-full" style={{ left: "0%", width: "100%" }} />
                              <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-foreground/70 rounded-full border border-background" style={{ left: `${Math.min(Math.max(currentInRange, 2), 98)}%` }} title={`Current: $${forecast.currentPrice.toFixed(2)}`} />
                              <div className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-violet-500 rounded-full" style={{ left: `${Math.min(Math.max(midInRange, 2), 98)}%` }} title={`Target: $${f.mid.toFixed(2)}`} />
                            </div>
                            <div className="flex justify-between mt-1"><span className="text-[10px] text-muted-foreground tabular-nums">${f.low.toFixed(0)} Low</span><span className="text-[10px] text-muted-foreground tabular-nums">High ${f.high.toFixed(0)}</span></div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/30"><div className="flex items-center gap-1.5 mb-1"><Eye className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Methodology</span></div><p className="text-xs text-muted-foreground leading-relaxed">{forecast.methodology}</p></div>
                    <div><div className="flex items-center gap-1.5 mb-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /><span className="text-xs font-medium text-amber-500">Risk Factors</span></div><div className="flex flex-wrap gap-1.5">{forecast.riskFactors.map((r, i) => (<span key={i} className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400/80 border border-amber-500/20">{r}</span>))}</div></div>
                  </div>
                ) : (<div className="text-center py-6"><Crosshair className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-xs text-muted-foreground">Price forecast will be generated automatically.</p></div>)}
              </CardContent>
            </Card>
            <Card className="border border-primary/20 bg-primary/[0.02]">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />AI Analysis - {stock.symbol}</CardTitle></CardHeader>
              <CardContent>
                {aiLoading ? (<div className="space-y-3"><Skeleton className="h-8 w-32" /><Skeleton className="h-16 w-full" /><div className="grid grid-cols-2 gap-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div></div>) : aiAnalysis && aiAnalysis.symbol ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between"><SignalBadge signal={aiAnalysis.signal} confidence={aiAnalysis.confidence} size="lg" /><span className="text-[10px] text-muted-foreground">{new Date(aiAnalysis.generatedAt).toLocaleString()}</span></div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{aiAnalysis.summary}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"><div className="flex items-center gap-1.5 mb-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /><span className="text-xs font-semibold text-emerald-500">Bull Case</span></div><p className="text-xs text-muted-foreground leading-relaxed">{aiAnalysis.bullCase}</p></div>
                      <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20"><div className="flex items-center gap-1.5 mb-1"><TrendingDown className="w-3.5 h-3.5 text-red-500" /><span className="text-xs font-semibold text-red-500">Bear Case</span></div><p className="text-xs text-muted-foreground leading-relaxed">{aiAnalysis.bearCase}</p></div>
                    </div>
                    <div><p className="text-xs text-muted-foreground mb-2 font-medium">Key Factors</p><div className="flex flex-wrap gap-1.5">{aiAnalysis.keyFactors.map((f, i) => (<span key={i} className="text-xs px-2 py-0.5 rounded-md bg-muted/80 text-foreground/80 border border-border/50">{f}</span>))}</div></div>
                  </div>
                ) : (<div className="text-center py-6"><Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-xs text-muted-foreground mb-3">AI analysis will be generated automatically when data is available.</p><p className="text-[10px] text-muted-foreground">Click "Generate" on the dashboard to create analyses for top stocks.</p></div>)}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="border border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />Key Statistics</CardTitle></CardHeader>
              <CardContent>
                <StatRow label="Market Cap" value={formatMarketCap(stock.marketCap)} />
                <StatRow label="P/E Ratio" value={stock.pe > 0 ? stock.pe.toFixed(2) : "N/A"} />
                <StatRow label="EPS" value={`$${stock.eps.toFixed(2)}`} />
                <StatRow label="Open" value={`$${stock.open.toFixed(2)}`} />
                <StatRow label="Previous Close" value={`$${stock.previousClose.toFixed(2)}`} />
                <StatRow label="Day Range" value={`$${stock.dayLow.toFixed(2)} - $${stock.dayHigh.toFixed(2)}`} />
                {stock.dividendYieldTTM > 0 && (<StatRow label="Div Yield" value={`${(stock.dividendYieldTTM * 100).toFixed(2)}%`} />)}
              </CardContent>
            </Card>
            <Card className="border border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />52-Week Range</CardTitle></CardHeader>
              <CardContent>
                <div className="relative h-2 bg-muted rounded-full mb-2"><div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background" style={{ left: `${Math.min(Math.max(rangePos, 3), 97)}%` }} /></div>
                <div className="flex justify-between"><div><p className="text-[10px] text-muted-foreground">Low</p><p className="text-xs font-medium tabular-nums">${stock.yearLow.toFixed(2)}</p></div><div className="text-center"><p className="text-[10px] text-muted-foreground">Current</p><p className="text-xs font-semibold tabular-nums text-primary">${stock.price.toFixed(2)}</p></div><div className="text-right"><p className="text-[10px] text-muted-foreground">High</p><p className="text-xs font-medium tabular-nums">${stock.yearHigh.toFixed(2)}</p></div></div>
                <p className="text-xs text-muted-foreground mt-2 text-center tabular-nums">{rangePos.toFixed(0)}% of 52-week range</p>
              </CardContent>
            </Card>
            <Card className="border border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Volume Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <StatRow label="Today's Volume" value={formatVolume(stock.volume)} />
                  <StatRow label="Avg Volume" value={formatVolume(stock.avgVolume)} />
                  <div className="pt-2">
                    <div className="flex justify-between mb-1"><span className="text-xs text-muted-foreground">Vol vs Avg</span><span className={`text-xs font-medium tabular-nums ${ volumeRatio > 1.2 ? "text-amber-500" : volumeRatio > 1 ? "text-emerald-500" : "text-muted-foreground" }`}>{(volumeRatio * 100).toFixed(0)}%</span></div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${ volumeRatio > 1.2 ? "bg-amber-500" : volumeRatio > 1 ? "bg-emerald-500" : "bg-muted-foreground/30" }`} style={{ width: `${Math.min(volumeRatio * 100, 100)}%` }} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {target && (
              <Card className="border border-border/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-primary" />Analyst Consensus</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-center mb-3"><Badge variant="secondary" className="text-xs mb-1">{target.consensusRating}</Badge><p className="text-lg font-bold tabular-nums">${target.targetConsensus.toFixed(0)}</p><p className={`text-xs font-medium ${ target.upside > 0 ? "text-emerald-500" : "text-red-500" }`}>{target.upside > 0 ? "+" : ""}{target.upside.toFixed(1)}% upside</p></div>
                  <StatRow label="Target High" value={`$${target.targetHigh.toFixed(0)}`} />
                  <StatRow label="Target Low" value={`$${target.targetLow.toFixed(0)}`} />
                  <StatRow label="Median Target" value={`$${target.targetMedian.toFixed(0)}`} />
                  <StatRow label="Analysts" value={`${target.totalRatings}`} />
                  <div className="mt-3 flex gap-1">
                    <div className="flex-1 h-1.5 rounded-full bg-emerald-500" style={{ flex: target.bullishPct }} title={`${target.bullishPct}% Bullish`} />
                    <div className="flex-1 h-1.5 rounded-full bg-amber-500" style={{ flex: target.neutralPct }} title={`${target.neutralPct}% Neutral`} />
                    <div className="flex-1 h-1.5 rounded-full bg-red-500" style={{ flex: target.bearishPct }} title={`${target.bearishPct}% Bearish`} />
                  </div>
                  <div className="flex justify-between mt-1"><span className="text-[10px] text-emerald-500">{target.bullishPct}% Bull</span><span className="text-[10px] text-amber-500">{target.neutralPct}% Neutral</span><span className="text-[10px] text-red-500">{target.bearishPct}% Bear</span></div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <div className="mt-8"><PerplexityAttribution /></div>
      </main>
    </div>
  );
}
