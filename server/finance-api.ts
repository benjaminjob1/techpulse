import { execSync } from "child_process";
import type { StockQuote, MarketMover, MarketSentiment, AnalystTarget, PricePoint } from "@shared/schema";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function callFinanceTool(toolName: string, args: Record<string, unknown>): { content: string; csv_files?: unknown[] } {
  const params = JSON.stringify({ source_id: "finance", tool_name: toolName, arguments: args });
  const escaped = params.replace(/'/g, "'\\''" );
  const result = execSync(`external-tool call '${escaped}'`, {
    timeout: 30000,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(result);
}

function parseMarkdownTable(content: string): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [];
  const lines = content.split("\n");
  let headers: string[] = [];
  let headerFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map(c => c.trim()).filter(c => c.length > 0);
    if (!headerFound) {
      headers = cells;
      headerFound = true;
      continue;
    }
    if (cells.every(c => /^[-:\s]+$/.test(c))) continue;
    if (cells.length >= headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = cells[idx] || ""; });
      rows.push(row);
    }
    if (cells.length < headers.length) {
      headerFound = false;
      headers = [];
    }
  }
  return rows;
}

function parseAllTables(content: string): Array<Record<string, string>> {
  const allRows: Array<Record<string, string>> = [];
  const sections = content.split(/^## /m).filter(Boolean);
  for (const section of sections) {
    const rows = parseMarkdownTable(section);
    allRows.push(...rows);
  }
  return allRows;
}

function parseNumber(val: string): number {
  if (!val || val === "N/A" || val === "-") return 0;
  return parseFloat(val.replace(/,/g, "")) || 0;
}

const SECTOR_MAP: Record<string, string> = {
  "NVDA": "Semiconductors", "AAPL": "Consumer Electronics", "GOOGL": "Internet Services",
  "MSFT": "Software", "AMZN": "E-Commerce", "AVGO": "Semiconductors",
  "META": "Social Media", "TSLA": "Electric Vehicles", "ORCL": "Enterprise Software",
  "NFLX": "Streaming", "PLTR": "AI / Data Analytics", "AMD": "Semiconductors",
  "CRM": "Cloud CRM", "INTC": "Semiconductors", "ADBE": "Creative Software",
};

const TECH_TICKERS = ["NVDA", "AAPL", "GOOGL", "MSFT", "AMZN", "AVGO", "META", "TSLA", "ORCL", "NFLX", "PLTR", "AMD", "CRM", "INTC", "ADBE"];

export async function fetchLiveQuotes(): Promise<StockQuote[]> {
  const cached = getCached<StockQuote[]>("quotes");
  if (cached) return cached;

  try {
    const result = callFinanceTool("finance_quotes", {
      ticker_symbols: TECH_TICKERS,
      fields: ["price", "change", "changesPercentage", "marketCap", "pe", "eps", "volume", "avgVolume", "dayLow", "dayHigh", "yearLow", "yearHigh", "previousClose", "open", "dividendYieldTTM"],
    });
    const rows = parseAllTables(result.content);
    const quotes: StockQuote[] = rows
      .filter(r => r.symbol && TECH_TICKERS.includes(r.symbol))
      .map(r => ({
        symbol: r.symbol, name: r.name || "",
        price: parseNumber(r.price), change: parseNumber(r.change),
        changesPercentage: parseNumber(r.changesPercentage), marketCap: parseNumber(r.marketCap),
        pe: parseNumber(r.pe), eps: parseNumber(r.eps),
        volume: parseNumber(r.volume), avgVolume: parseNumber(r.avgVolume),
        dayLow: parseNumber(r.dayLow), dayHigh: parseNumber(r.dayHigh),
        yearLow: parseNumber(r.yearLow), yearHigh: parseNumber(r.yearHigh),
        previousClose: parseNumber(r.previousClose), open: parseNumber(r.open),
        dividendYieldTTM: parseNumber(r.dividendYieldTTM),
        sector: SECTOR_MAP[r.symbol] || undefined,
      }));
    if (quotes.length > 0) {
      setCache("quotes", quotes);
      return quotes;
    }
  } catch (err) {
    console.error("[finance-api] Failed to fetch live quotes:", err);
  }
  return [];
}

export async function fetchLiveGainers(): Promise<MarketMover[]> {
  const cached = getCached<MarketMover[]>("gainers");
  if (cached) return cached;
  try {
    const result = callFinanceTool("finance_market_gainers", { query: "Top gaining stocks today", action: "Fetching top market gainers", limit: 8 });
    const rows = parseAllTables(result.content);
    const movers: MarketMover[] = rows.filter(r => r.symbol).slice(0, 8).map(r => ({
      symbol: r.symbol, name: r.name || r.companyName || "",
      price: parseNumber(r.price),
      changePercent: parseNumber(r.changesPercentage || r.changes_percentage),
      change: parseNumber(r.change || r.changes),
    }));
    if (movers.length > 0) { setCache("gainers", movers); return movers; }
  } catch (err) { console.error("[finance-api] Failed to fetch gainers:", err); }
  return [];
}

export async function fetchLiveLosers(): Promise<MarketMover[]> {
  const cached = getCached<MarketMover[]>("losers");
  if (cached) return cached;
  try {
    const result = callFinanceTool("finance_market_losers", { query: "Top losing stocks today", action: "Fetching top market losers", limit: 8 });
    const rows = parseAllTables(result.content);
    const movers: MarketMover[] = rows.filter(r => r.symbol).slice(0, 8).map(r => ({
      symbol: r.symbol, name: r.name || r.companyName || "",
      price: parseNumber(r.price),
      changePercent: parseNumber(r.changesPercentage || r.changes_percentage),
      change: parseNumber(r.change || r.changes),
    }));
    if (movers.length > 0) { setCache("losers", movers); return movers; }
  } catch (err) { console.error("[finance-api] Failed to fetch losers:", err); }
  return [];
}

export async function fetchLiveMostActive(): Promise<MarketMover[]> {
  const cached = getCached<MarketMover[]>("most_active");
  if (cached) return cached;
  try {
    const result = callFinanceTool("finance_market_most_active", { query: "Most actively traded stocks", action: "Fetching most active stocks", limit: 8 });
    const rows = parseAllTables(result.content);
    const movers: MarketMover[] = rows.filter(r => r.symbol).slice(0, 8).map(r => ({
      symbol: r.symbol, name: r.name || r.companyName || "",
      price: parseNumber(r.price),
      changePercent: parseNumber(r.changesPercentage || r.changes_percentage),
      change: parseNumber(r.change || r.changes),
    }));
    if (movers.length > 0) { setCache("most_active", movers); return movers; }
  } catch (err) { console.error("[finance-api] Failed to fetch most active:", err); }
  return [];
}

export async function fetchLiveSentiment(): Promise<MarketSentiment> {
  const cached = getCached<MarketSentiment>("sentiment");
  if (cached) return cached;
  try {
    const result = callFinanceTool("finance_market_sentiment", { query: "US stock market sentiment", action: "Analyzing US stock market sentiment" });
    const content = result.content.toUpperCase();
    let sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
    if (content.includes("BULLISH") && !content.includes("BEARISH")) sentiment = "BULLISH";
    else if (content.includes("BEARISH")) sentiment = "BEARISH";
    let marketStatus = "unknown";
    if (content.includes("OPEN")) marketStatus = "open";
    else if (content.includes("CLOSED") || content.includes("AFTER_HOURS") || content.includes("AFTER HOURS")) marketStatus = "closed";
    else if (content.includes("PRE")) marketStatus = "pre_market";
    const data: MarketSentiment = { sentiment, marketStatus };
    setCache("sentiment", data);
    return data;
  } catch (err) { console.error("[finance-api] Failed to fetch sentiment:", err); }
  return { sentiment: "NEUTRAL", marketStatus: "unknown" };
}

export async function fetchLivePriceHistory(symbol: string): Promise<PricePoint[]> {
  const cacheKey = `history_${symbol}`;
  const cached = getCached<PricePoint[]>(cacheKey);
  if (cached) return cached;
  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const result = callFinanceTool("finance_ohlcv_histories", {
      ticker_symbols: [symbol],
      start_date_yyyy_mm_dd: startDate,
      end_date_yyyy_mm_dd: endDate,
      fields: ["close"],
      query: `${symbol} 3-month price history`,
    });
    const rows = parseAllTables(result.content);
    const points: PricePoint[] = rows
      .filter(r => r.date && r.close)
      .map(r => ({ date: r.date, close: parseNumber(r.close) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (points.length > 0) { setCache(cacheKey, points); return points; }
  } catch (err) { console.error(`[finance-api] Failed to fetch history for ${symbol}:`, err); }
  return [];
}

export function getCacheTimestamp(): { lastUpdated: string; cacheAge: number } {
  const quotesEntry = cache.get("quotes");
  if (quotesEntry) {
    return {
      lastUpdated: new Date(quotesEntry.timestamp).toISOString(),
      cacheAge: Math.round((Date.now() - quotesEntry.timestamp) / 1000),
    };
  }
  return { lastUpdated: new Date().toISOString(), cacheAge: 0 };
}

export function invalidateCache(): void {
  cache.clear();
}
