import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

export const TECH_STOCKS = [
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Semiconductors" },
  { symbol: "AAPL", name: "Apple Inc.", sector: "Consumer Electronics" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Internet Services" },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Software" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", sector: "E-Commerce" },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Semiconductors" },
  { symbol: "META", name: "Meta Platforms, Inc.", sector: "Social Media" },
  { symbol: "TSLA", name: "Tesla, Inc.", sector: "Electric Vehicles" },
  { symbol: "ORCL", name: "Oracle Corporation", sector: "Enterprise Software" },
  { symbol: "NFLX", name: "Netflix, Inc.", sector: "Streaming" },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", sector: "AI / Data Analytics" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", sector: "Semiconductors" },
  { symbol: "CRM", name: "Salesforce, Inc.", sector: "Cloud CRM" },
  { symbol: "INTC", name: "Intel Corporation", sector: "Semiconductors" },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Creative Software" },
];
export const SYMBOLS = TECH_STOCKS.map(s => s.symbol);

const cache = new Map();
const CACHE_TTL = 3 * 60 * 1000;
export function getCached(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.timestamp > CACHE_TTL) { cache.delete(key); return null; }
  return e.data;
}
export function setCache(key, data) { cache.set(key, { data, timestamp: Date.now() }); }

export async function fetchAllQuotes() {
  const cached = getCached("all-quotes");
  if (cached) return cached;
  const quotes = await Promise.allSettled(
    SYMBOLS.map(sym => yahooFinance.quote(sym, {}, { validateResult: false }))
  );
  const results = [];
  for (let i = 0; i < SYMBOLS.length; i++) {
    const r = quotes[i], meta = TECH_STOCKS[i];
    if (r.status === "fulfilled" && r.value) {
      const q = r.value;
      results.push({
        symbol: meta.symbol, name: q.longName || q.shortName || meta.name,
        price: q.regularMarketPrice || 0, change: q.regularMarketChange || 0,
        changesPercentage: q.regularMarketChangePercent || 0, marketCap: q.marketCap || 0,
        pe: q.trailingPE || 0, eps: q.epsTrailingTwelveMonths || 0,
        volume: q.regularMarketVolume || 0, avgVolume: q.averageDailyVolume3Month || 0,
        dayLow: q.regularMarketDayLow || 0, dayHigh: q.regularMarketDayHigh || 0,
        yearLow: q.fiftyTwoWeekLow || 0, yearHigh: q.fiftyTwoWeekHigh || 0,
        previousClose: q.regularMarketPreviousClose || 0, open: q.regularMarketOpen || 0,
        dividendYieldTTM: q.dividendYield || 0, sector: meta.sector,
      });
    }
  }
  setCache("all-quotes", results);
  return results;
}

export async function fetchHistory(symbol) {
  const cacheKey = `history-${symbol}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const start = new Date(); start.setMonth(start.getMonth() - 3);
  const result = await yahooFinance.chart(symbol, { period1: start, interval: "1d" });
  const points = (result.quotes || []).filter(q => q.close != null)
    .map(q => ({ date: new Date(q.date).toISOString().split("T")[0], close: +q.close.toFixed(2) }));
  setCache(cacheKey, points);
  return points;
}

export { yahooFinance };
