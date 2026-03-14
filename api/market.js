import { fetchAllQuotes, yahooFinance, getCached, setCache } from "./_shared/yahoo.mjs";
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=300");
  if (req.method === "OPTIONS") return res.status(204).end();
  const { type } = req.query;
  try {
    if (type === "gainers") {
      const cached = getCached("gainers");
      if (cached) return res.status(200).json(cached);
      try {
        const result = await yahooFinance.dailyGainers({}, { validateResult: false });
        const gainers = (result?.quotes || []).slice(0, 5).map(q => ({
          symbol: q.symbol || "", name: q.longName || q.shortName || q.symbol || "",
          price: q.regularMarketPrice || 0, changePercent: q.regularMarketChangePercent || 0, change: q.regularMarketChange || 0,
        }));
        setCache("gainers", gainers);
        return res.status(200).json(gainers);
      } catch { return res.status(200).json([]); }
    }
    const quotes = await fetchAllQuotes();
    if (type === "losers") {
      const losers = quotes.filter(q => q.changesPercentage < 0).sort((a, b) => a.changesPercentage - b.changesPercentage).slice(0, 5)
        .map(q => ({ symbol: q.symbol, name: q.name, price: q.price, changePercent: q.changesPercentage, change: q.change }));
      return res.status(200).json(losers);
    }
    if (type === "active") {
      const active = quotes.sort((a, b) => b.volume - a.volume).slice(0, 5)
        .map(q => ({ symbol: q.symbol, name: q.name, price: q.price, changePercent: q.changesPercentage, change: q.change }));
      return res.status(200).json(active);
    }
    if (type === "sentiment") {
      const up = quotes.filter(q => q.changesPercentage > 0).length;
      const down = quotes.filter(q => q.changesPercentage < 0).length;
      let sentiment = "NEUTRAL";
      if (up > down * 1.5) sentiment = "BULLISH";
      else if (down > up * 1.5) sentiment = "BEARISH";
      const h = new Date().getUTCHours(), d = new Date().getUTCDay();
      return res.status(200).json({ sentiment, marketStatus: (d >= 1 && d <= 5 && h >= 13 && h <= 20) ? "Market Open" : "Market Closed" });
    }
    return res.status(400).json({ error: "Unknown market type" });
  } catch (err) {
    console.error("Market error:", err);
    return res.status(500).json({ error: "Failed to fetch market data" });
  }
}
