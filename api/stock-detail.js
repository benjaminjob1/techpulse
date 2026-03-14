import { fetchAllQuotes, fetchHistory } from "./_shared/yahoo.mjs";
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=300");
  if (req.method === "OPTIONS") return res.status(204).end();
  const { symbol, type } = req.query;
  const sym = (symbol || "").toUpperCase();
  try {
    if (type === "history") {
      const history = await fetchHistory(sym);
      return res.status(200).json(history);
    }
    const quotes = await fetchAllQuotes();
    const stock = quotes.find(s => s.symbol === sym);
    if (!stock) return res.status(404).json({ error: "Stock not found" });
    return res.status(200).json(stock);
  } catch (err) {
    console.error("Stock detail error:", err);
    return res.status(500).json({ error: "Failed to fetch stock data" });
  }
}
