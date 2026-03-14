import { fetchAllQuotes, fetchHistory, getCached, setCache, TECH_STOCKS } from "./_shared/yahoo.mjs";

/**
 * Algorithmic AI analysis using Yahoo Finance data.
 * Generates BUY/SELL/HOLD signals from fundamentals, technicals, and analyst data.
 * No LLM required — pure quantitative scoring.
 */

function computeTechnicals(prices) {
  if (!prices || prices.length < 5) return null;
  const closes = prices.map(p => p.close);
  const n = closes.length;
  const current = closes[n - 1];

  // Simple Moving Averages
  const sma20 = n >= 20 ? closes.slice(-20).reduce((a, b) => a + b, 0) / 20 : current;
  const sma50 = n >= 50 ? closes.slice(-50).reduce((a, b) => a + b, 0) / 50 : current;

  // Returns and volatility
  const rets = [];
  for (let i = 1; i < n; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const avgRet = rets.length > 0 ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const vol = rets.length > 0 ? Math.sqrt(rets.reduce((s, r) => s + (r - avgRet) ** 2, 0) / rets.length) : 0.02;

  // RSI (14-day)
  let avgGain = 0, avgLoss = 0;
  const rsiPeriod = Math.min(14, rets.length);
  const recentRets = rets.slice(-rsiPeriod);
  for (const r of recentRets) {
    if (r > 0) avgGain += r;
    else avgLoss += Math.abs(r);
  }
  avgGain /= rsiPeriod;
  avgLoss /= rsiPeriod;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  // 3-month performance
  const threeMonthReturn = ((current - closes[0]) / closes[0]) * 100;

  // Momentum (5-day)
  const fiveDayReturn = n >= 5 ? ((current - closes[n - 5]) / closes[n - 5]) * 100 : 0;

  return { sma20, sma50, rsi, vol, avgRet, threeMonthReturn, fiveDayReturn, current };
}

function generateAnalysis(stock, technicals) {
  let score = 0; // -100 to +100 scale
  const factors = [];

  // 1. P/E valuation (weight: 15)
  if (stock.pe > 0) {
    if (stock.pe < 20) { score += 12; factors.push("Attractive P/E valuation"); }
    else if (stock.pe < 35) { score += 5; factors.push("Reasonable P/E ratio"); }
    else if (stock.pe < 60) { score -= 5; factors.push("Elevated P/E ratio"); }
    else { score -= 12; factors.push("Very high P/E multiple"); }
  } else {
    score -= 8; factors.push("Negative earnings");
  }

  // 2. 52-week range position (weight: 15)
  const rangeWidth = stock.yearHigh - stock.yearLow;
  const rangePos = rangeWidth > 0 ? ((stock.price - stock.yearLow) / rangeWidth) * 100 : 50;
  if (rangePos < 25) { score += 10; factors.push("Near 52-week low — potential value"); }
  else if (rangePos > 85) { score -= 8; factors.push("Near 52-week high"); }
  else if (rangePos > 50 && rangePos <= 75) { score += 5; }

  // 3. Volume signal (weight: 10)
  const volRatio = stock.avgVolume > 0 ? stock.volume / stock.avgVolume : 1;
  if (volRatio > 1.5 && stock.changesPercentage > 0) { score += 8; factors.push("High volume on green day"); }
  else if (volRatio > 1.5 && stock.changesPercentage < 0) { score -= 8; factors.push("High volume selling pressure"); }

  // 4. Day performance (weight: 10)
  if (stock.changesPercentage > 3) { score += 8; factors.push(`Strong +${stock.changesPercentage.toFixed(1)}% session`); }
  else if (stock.changesPercentage > 1) { score += 4; }
  else if (stock.changesPercentage < -3) { score -= 8; factors.push(`Weak ${stock.changesPercentage.toFixed(1)}% session`); }
  else if (stock.changesPercentage < -1) { score -= 4; }

  // 5. Technical indicators
  if (technicals) {
    // SMA trend (weight: 15)
    if (technicals.current > technicals.sma20 && technicals.sma20 > technicals.sma50) {
      score += 12; factors.push("Price above rising moving averages");
    } else if (technicals.current < technicals.sma20 && technicals.sma20 < technicals.sma50) {
      score -= 12; factors.push("Price below falling moving averages");
    } else if (technicals.current > technicals.sma20) {
      score += 5;
    } else {
      score -= 5;
    }

    // RSI (weight: 15)
    if (technicals.rsi > 70) { score -= 10; factors.push(`Overbought RSI (${technicals.rsi.toFixed(0)})`); }
    else if (technicals.rsi < 30) { score += 10; factors.push(`Oversold RSI (${technicals.rsi.toFixed(0)})`); }
    else if (technicals.rsi > 50 && technicals.rsi <= 65) { score += 5; }

    // 3-month momentum (weight: 10)
    if (technicals.threeMonthReturn > 15) { score += 8; factors.push(`Strong 3M momentum (+${technicals.threeMonthReturn.toFixed(1)}%)`); }
    else if (technicals.threeMonthReturn > 5) { score += 4; }
    else if (technicals.threeMonthReturn < -15) { score -= 8; factors.push(`Weak 3M momentum (${technicals.threeMonthReturn.toFixed(1)}%)`); }
    else if (technicals.threeMonthReturn < -5) { score -= 4; }

    // Volatility context
    if (technicals.vol > 0.03) { factors.push("High volatility — wider price swings expected"); }
  }

  // 6. Market cap stability (weight: 5)
  if (stock.marketCap > 1e12) { score += 3; }
  else if (stock.marketCap > 200e9) { score += 1; }

  // Determine signal
  let signal, confidence;
  if (score >= 20) { signal = "BUY"; confidence = score >= 35 ? "HIGH" : "MEDIUM"; }
  else if (score <= -20) { signal = "SELL"; confidence = score <= -35 ? "HIGH" : "MEDIUM"; }
  else { signal = "HOLD"; confidence = Math.abs(score) < 10 ? "LOW" : "MEDIUM"; }

  // Generate summary
  const priceStr = `$${stock.price.toFixed(2)}`;
  const changeStr = `${stock.changesPercentage >= 0 ? "+" : ""}${stock.changesPercentage.toFixed(2)}%`;
  const mcapStr = stock.marketCap >= 1e12 ? `$${(stock.marketCap / 1e12).toFixed(1)}T` : `$${(stock.marketCap / 1e9).toFixed(0)}B`;

  let summary;
  if (signal === "BUY") {
    summary = `${stock.symbol} at ${priceStr} (${changeStr}) shows favorable conditions with a ${mcapStr} market cap. Technical and fundamental indicators align for a bullish outlook.`;
  } else if (signal === "SELL") {
    summary = `${stock.symbol} at ${priceStr} (${changeStr}) faces headwinds. With a ${mcapStr} valuation, risk factors outweigh potential upside in the near term.`;
  } else {
    summary = `${stock.symbol} at ${priceStr} (${changeStr}) presents a mixed picture. The ${mcapStr} stock shows balanced bull and bear signals — wait for clearer direction.`;
  }

  // Bull/bear cases
  const bullPoints = [];
  const bearPoints = [];

  if (stock.pe > 0 && stock.pe < 30) bullPoints.push(`reasonable ${stock.pe.toFixed(1)}x earnings`);
  if (technicals && technicals.current > technicals.sma20) bullPoints.push("trading above 20-day SMA");
  if (technicals && technicals.threeMonthReturn > 0) bullPoints.push(`positive 3-month trend (+${technicals.threeMonthReturn.toFixed(1)}%)`);
  if (rangePos < 60) bullPoints.push("room to run toward 52-week high");
  if (stock.dividendYieldTTM > 0) bullPoints.push(`${(stock.dividendYieldTTM * 100).toFixed(2)}% dividend yield`);
  if (bullPoints.length === 0) bullPoints.push("large-cap stability and brand moat");

  if (stock.pe > 50) bearPoints.push(`stretched ${stock.pe.toFixed(0)}x P/E valuation`);
  if (technicals && technicals.rsi > 65) bearPoints.push(`RSI at ${technicals.rsi.toFixed(0)} signals overbought conditions`);
  if (technicals && technicals.vol > 0.025) bearPoints.push("elevated volatility increases downside risk");
  if (rangePos > 80) bearPoints.push("trading near 52-week highs limits upside");
  if (bearPoints.length === 0) bearPoints.push("broader macro uncertainty could weigh on tech sector");

  const bullCase = bullPoints.slice(0, 2).join(" and ").replace(/^./, c => c.toUpperCase()) + ".";
  const bearCase = bearPoints.slice(0, 2).join(" and ").replace(/^./, c => c.toUpperCase()) + ".";

  // Ensure we have 3-5 key factors
  while (factors.length < 3) factors.push("Monitor sector-wide sentiment");
  const keyFactors = factors.slice(0, 5);

  return { symbol: stock.symbol, signal, confidence, summary, bullCase, bearCase, keyFactors, generatedAt: new Date().toISOString() };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  if (req.method === "OPTIONS") return res.status(204).end();

  const { symbol, type } = req.query;

  // Batch analyze all top stocks
  if (type === "analyze-all") {
    const ck = "ai-all-analyses";
    const cached = getCached(ck);
    if (cached) return res.status(200).json(cached);

    try {
      const quotes = await fetchAllQuotes();
      const topSymbols = ["NVDA", "AAPL", "GOOGL", "MSFT", "AMZN", "META", "TSLA", "AMD", "AVGO"];
      const results = [];

      for (const sym of topSymbols) {
        const stock = quotes.find(s => s.symbol === sym);
        if (!stock) { results.push({ symbol: sym, status: "not_found" }); continue; }
        try {
          const history = await fetchHistory(sym);
          const technicals = computeTechnicals(history);
          const analysis = generateAnalysis(stock, technicals);
          setCache(`ai-analysis-${sym}`, analysis);
          results.push({ symbol: sym, status: "generated" });
        } catch { results.push({ symbol: sym, status: "failed" }); }
      }

      const result = { results, generatedAt: new Date().toISOString() };
      setCache(ck, result);
      return res.status(200).json(result);
    } catch (err) {
      console.error("Analyze-all error:", err);
      return res.status(500).json({ results: [], error: "Analysis unavailable" });
    }
  }

  // Return all cached analyses
  if (type === "analyses") {
    try {
      const quotes = await fetchAllQuotes();
      const analyses = [];
      for (const stock of quotes) {
        const ck = `ai-analysis-${stock.symbol}`;
        let cached = getCached(ck);
        if (!cached) {
          // Auto-generate for all tracked stocks
          try {
            const history = await fetchHistory(stock.symbol);
            const technicals = computeTechnicals(history);
            cached = generateAnalysis(stock, technicals);
            setCache(ck, cached);
          } catch { continue; }
        }
        analyses.push(cached);
      }
      return res.status(200).json(analyses);
    } catch (err) {
      console.error("Analyses error:", err);
      return res.status(200).json([]);
    }
  }

  // Single stock analysis
  const sym = (symbol || "").toUpperCase();
  if (!sym) return res.status(400).json({ error: "Symbol required" });

  const ck = `ai-analysis-${sym}`;
  const cached = getCached(ck);
  if (cached) return res.status(200).json(cached);

  try {
    const quotes = await fetchAllQuotes();
    const stock = quotes.find(s => s.symbol === sym);
    if (!stock) return res.status(404).json({ error: "Stock not found" });

    const history = await fetchHistory(sym);
    const technicals = computeTechnicals(history);
    const analysis = generateAnalysis(stock, technicals);
    setCache(ck, analysis);
    return res.status(200).json(analysis);
  } catch (err) {
    console.error("AI analysis error:", err);
    return res.status(500).json({ error: "Analysis unavailable" });
  }
}
