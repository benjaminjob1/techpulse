import { fetchAllQuotes } from "./_shared/yahoo.mjs";
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=300");
  if (req.method === "OPTIONS") return res.status(204).end();
  try {
    const quotes = await fetchAllQuotes();
    return res.status(200).json(quotes);
  } catch (err) {
    console.error("Stocks error:", err);
    return res.status(500).json({ error: "Failed to fetch stocks" });
  }
}
