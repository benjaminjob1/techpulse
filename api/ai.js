export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  const { symbol, type } = req.query;
  if (type === "analyses") return res.status(200).json([]);
  if (type === "analyze-all") return res.status(200).json({ results: [], generatedAt: new Date().toISOString() });
  const sym = (symbol || "").toUpperCase();
  return res.status(200).json({
    symbol: sym, signal: "HOLD", confidence: "LOW",
    summary: "AI analysis available on the full TechPulse dashboard. This deployment provides live market data via Yahoo Finance.",
    bullCase: "Live pricing available.", bearCase: "Visit full dashboard for AI analysis.",
    keyFactors: ["Real-time prices", "Auto-refreshing data", "Full AI on main dashboard"],
    generatedAt: new Date().toISOString(),
  });
}
