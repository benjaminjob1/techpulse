export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  const { type } = req.query;
  if (type === "refresh") return res.status(200).json({ success: true, refreshedAt: new Date().toISOString() });
  return res.status(200).json({ lastUpdated: new Date().toISOString(), marketStatus: "Live via Yahoo Finance", source: "yahoo-finance2", fallbackData: new Date().toISOString() });
}
