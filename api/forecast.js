import { fetchAllQuotes, fetchHistory, getCached, setCache } from "./_shared/yahoo.mjs";
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  if (req.method === "OPTIONS") return res.status(204).end();
  const sym = (req.query.symbol || "").toUpperCase();
  const ck = `forecast-${sym}`;
  const fc = getCached(ck);
  if (fc) return res.status(200).json(fc);
  try {
    const quotes = await fetchAllQuotes();
    const stock = quotes.find(s => s.symbol === sym);
    if (!stock) return res.status(404).json({ error: "Stock not found" });
    const history = await fetchHistory(sym);
    const prices = history.map(h => h.close);
    const cp = stock.price;
    const rets = []; for (let i = 1; i < prices.length; i++) rets.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    const avg = rets.length > 0 ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
    const v = rets.length > 0 ? Math.sqrt(rets.reduce((s, r) => s + (r - avg) ** 2, 0) / rets.length) : 0.02;
    const periods = [{ p: "1W", l: "1 Week", d: 5 }, { p: "1M", l: "1 Month", d: 22 }, { p: "3M", l: "3 Months", d: 66 }, { p: "6M", l: "6 Months", d: 132 }, { p: "1Y", l: "1 Year", d: 252 }];
    const forecasts = periods.map(({ p, l, d }) => {
      const er = avg * d, ev = v * Math.sqrt(d), mid = +(cp * (1 + er)).toFixed(2);
      return { period: p, label: l, low: +(cp * (1 + er - 1.5 * ev)).toFixed(2), mid, high: +(cp * (1 + er + 1.5 * ev)).toFixed(2),
        changePercent: +(((mid - cp) / cp) * 100).toFixed(2), confidence: d <= 5 ? "HIGH" : d <= 66 ? "MEDIUM" : "LOW" };
    });
    const result = {
      symbol: sym, currentPrice: cp, forecasts,
      methodology: "Statistical projection based on 3-month historical returns and volatility with 1.5σ confidence bands.",
      riskFactors: ["Past performance does not guarantee future results", "Market conditions may change", "Company-specific events not modeled"],
      outlook: avg > 0.001 ? "BULLISH" : avg < -0.001 ? "BEARISH" : "NEUTRAL", generatedAt: new Date().toISOString(),
    };
    setCache(ck, result);
    return res.status(200).json(result);
  } catch (err) { console.error("Forecast error:", err); return res.status(500).json({ error: "Forecast unavailable" }); }
}
