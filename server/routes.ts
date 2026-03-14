import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  fetchLiveQuotes,
  fetchLiveGainers,
  fetchLiveLosers,
  fetchLiveMostActive,
  fetchLiveSentiment,
  fetchLivePriceHistory,
  getCacheTimestamp,
  invalidateCache,
} from "./finance-api";
import { generateAIAnalysis } from "./ai-analysis";
import { generateForecast } from "./ai-forecast";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ── Stock quotes (live with fallback) ────────────────────────────
  app.get("/api/stocks", async (_req, res) => {
    try {
      const liveData = await fetchLiveQuotes();
      if (liveData.length > 0) {
        return res.json(liveData);
      }
    } catch (err) {
      console.error("[routes] Live quotes failed, using fallback:", err);
    }
    res.json(storage.getStocks());
  });

  app.get("/api/stocks/:symbol", async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    try {
      const liveData = await fetchLiveQuotes();
      const stock = liveData.find(s => s.symbol === symbol);
      if (stock) return res.json(stock);
    } catch (err) {
      console.error("[routes] Live quote failed for", symbol);
    }
    const stock = storage.getStock(symbol);
    if (!stock) return res.status(404).json({ error: "Stock not found" });
    res.json(stock);
  });

  // ── Price history (live with fallback) ───────────────────────────
  app.get("/api/stocks/:symbol/history", async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    try {
      const liveHistory = await fetchLivePriceHistory(symbol);
      if (liveHistory.length > 0) {
        return res.json(liveHistory);
      }
    } catch (err) {
      console.error("[routes] Live history failed for", symbol);
    }
    res.json(storage.getPriceHistory(symbol));
  });

  // ── Market movers (live with fallback) ───────────────────────────
  app.get("/api/market/gainers", async (_req, res) => {
    try {
      const live = await fetchLiveGainers();
      if (live.length > 0) return res.json(live);
    } catch (err) {
      console.error("[routes] Live gainers failed");
    }
    res.json(storage.getGainers());
  });

  app.get("/api/market/losers", async (_req, res) => {
    try {
      const live = await fetchLiveLosers();
      if (live.length > 0) return res.json(live);
    } catch (err) {
      console.error("[routes] Live losers failed");
    }
    res.json(storage.getLosers());
  });

  app.get("/api/market/active", async (_req, res) => {
    try {
      const live = await fetchLiveMostActive();
      if (live.length > 0) return res.json(live);
    } catch (err) {
      console.error("[routes] Live most active failed");
    }
    res.json(storage.getMostActive());
  });

  // ── Market sentiment (live with fallback) ────────────────────────
  app.get("/api/market/sentiment", async (_req, res) => {
    try {
      const live = await fetchLiveSentiment();
      if (live.sentiment !== "NEUTRAL" || live.marketStatus !== "unknown") {
        return res.json(live);
      }
    } catch (err) {
      console.error("[routes] Live sentiment failed");
    }
    res.json(storage.getSentiment());
  });

  // ── Analyst targets (from storage — updated with real consensus) ─
  app.get("/api/analyst/targets", async (_req, res) => {
    res.json(storage.getAnalystTargets());
  });

  // ── Data freshness timestamp ─────────────────────────────────────
  app.get("/api/data/timestamp", async (_req, res) => {
    const ts = getCacheTimestamp();
    const storageTs = storage.getDataTimestamp();
    res.json({
      ...ts,
      fallbackData: storageTs.lastUpdated,
      source: storageTs.source,
    });
  });

  // ── Force refresh ────────────────────────────────────────────────
  app.post("/api/data/refresh", async (_req, res) => {
    invalidateCache();
    try {
      const quotes = await fetchLiveQuotes();
      const sentiment = await fetchLiveSentiment();
      res.json({
        success: true,
        quotesCount: quotes.length,
        sentiment: sentiment.sentiment,
        refreshedAt: new Date().toISOString(),
      });
    } catch (err) {
      res.json({ success: false, error: "Refresh failed, using cached data" });
    }
  });

  // ── AI Analysis ──────────────────────────────────────────────────
  app.get("/api/ai/analysis/:symbol", async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();

    // Check cache first
    const cached = storage.getAIAnalysis(symbol);
    if (cached) {
      const age = Date.now() - new Date(cached.generatedAt).getTime();
      // Return cached if less than 30 minutes old
      if (age < 30 * 60 * 1000) {
        return res.json(cached);
      }
    }

    // Get stock data for AI analysis
    let stock;
    try {
      const liveData = await fetchLiveQuotes();
      stock = liveData.find(s => s.symbol === symbol);
    } catch {
      stock = storage.getStock(symbol);
    }

    if (!stock) {
      stock = storage.getStock(symbol);
    }

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    const target = storage.getAnalystTarget(symbol);

    try {
      const analysis = await generateAIAnalysis(stock, target);
      storage.setAIAnalysis(symbol, analysis);
      res.json(analysis);
    } catch (err) {
      console.error("[routes] AI analysis failed for", symbol, err);
      // Return cached even if stale
      if (cached) return res.json(cached);
      res.status(500).json({ error: "AI analysis temporarily unavailable" });
    }
  });

  // ── All AI analyses (for dashboard overview) ─────────────────────
  app.get("/api/ai/analyses", async (_req, res) => {
    const all = storage.getAllAIAnalyses();
    res.json(all);
  });

  // ── Price Forecasts ─────────────────────────────────────────────
  app.get("/api/forecast/:symbol", async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();

    // Check cache first (1 hour TTL for forecasts)
    const cached = storage.getForecast(symbol);
    if (cached) {
      const age = Date.now() - new Date(cached.generatedAt).getTime();
      if (age < 60 * 60 * 1000) {
        return res.json(cached);
      }
    }

    // Get stock data
    let stock;
    try {
      const liveData = await fetchLiveQuotes();
      stock = liveData.find(s => s.symbol === symbol);
    } catch {
      stock = storage.getStock(symbol);
    }
    if (!stock) stock = storage.getStock(symbol);
    if (!stock) return res.status(404).json({ error: "Stock not found" });

    const target = storage.getAnalystTarget(symbol);

    // Get price history for trend analysis
    let history;
    try {
      history = await fetchLivePriceHistory(symbol);
    } catch {
      history = storage.getPriceHistory(symbol);
    }
    if (!history || history.length === 0) {
      history = storage.getPriceHistory(symbol);
    }

    try {
      const forecast = await generateForecast(stock, target, history);
      storage.setForecast(symbol, forecast);
      res.json(forecast);
    } catch (err) {
      console.error("[routes] Forecast failed for", symbol, err);
      if (cached) return res.json(cached);
      res.status(500).json({ error: "Forecast temporarily unavailable" });
    }
  });

  // ── Generate batch AI analyses for top stocks ────────────────────
  app.post("/api/ai/analyze-all", async (_req, res) => {
    const topSymbols = ["NVDA", "AAPL", "GOOGL", "MSFT", "AMZN", "META", "TSLA", "AMD", "AVGO"];

    let stocks;
    try {
      stocks = await fetchLiveQuotes();
    } catch {
      stocks = storage.getStocks();
    }

    const results: Array<{ symbol: string; status: string }> = [];

    for (const symbol of topSymbols) {
      try {
        // Skip if we have a recent analysis
        const cached = storage.getAIAnalysis(symbol);
        if (cached) {
          const age = Date.now() - new Date(cached.generatedAt).getTime();
          if (age < 30 * 60 * 1000) {
            results.push({ symbol, status: "cached" });
            continue;
          }
        }

        const stock = stocks.find(s => s.symbol === symbol);
        if (!stock) {
          results.push({ symbol, status: "not_found" });
          continue;
        }

        const target = storage.getAnalystTarget(symbol);
        const analysis = await generateAIAnalysis(stock, target);
        storage.setAIAnalysis(symbol, analysis);
        results.push({ symbol, status: "generated" });
      } catch (err) {
        results.push({ symbol, status: "failed" });
      }
    }

    res.json({ results, generatedAt: new Date().toISOString() });
  });

  return httpServer;
}
