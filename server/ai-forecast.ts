import Anthropic from "@anthropic-ai/sdk";
import type { StockQuote, AnalystTarget, PriceForecast, PricePoint } from "@shared/schema";

const client = new Anthropic();

export async function generateForecast(
  stock: StockQuote,
  target?: AnalystTarget,
  history?: PricePoint[]
): Promise<PriceForecast> {
  const rangePos = stock.yearHigh !== stock.yearLow
    ? ((stock.price - stock.yearLow) / (stock.yearHigh - stock.yearLow) * 100).toFixed(1)
    : "50";

  let trendInfo = "";
  if (history && history.length >= 20) {
    const recent = history.slice(-20);
    const sma20 = recent.reduce((s, p) => s + p.close, 0) / 20;
    const sma50 = history.length >= 50
      ? history.slice(-50).reduce((s, p) => s + p.close, 0) / 50
      : null;
    const threeMonthAgo = history[0]?.close || stock.price;
    const threeMonthChange = ((stock.price - threeMonthAgo) / threeMonthAgo * 100).toFixed(1);

    trendInfo = `
TREND DATA:
- 20-Day SMA: $${sma20.toFixed(2)} (price ${stock.price > sma20 ? "above" : "below"} SMA)
${sma50 ? `- 50-Day SMA: $${sma50.toFixed(2)} (price ${stock.price > sma50 ? "above" : "below"} SMA)` : ""}
- 3-Month Change: ${threeMonthChange}%
- Recent Trend: ${stock.price > sma20 ? "Uptrend" : "Downtrend"} (vs 20-day SMA)`;
  }

  const prompt = `You are a quantitative stock analyst. Generate price forecasts for different time horizons based on the data below.

STOCK DATA:
- Symbol: ${stock.symbol}
- Name: ${stock.name}
- Sector: ${stock.sector || "Technology"}
- Current Price: $${stock.price.toFixed(2)}
- Day Change: ${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)} (${stock.changesPercentage >= 0 ? "+" : ""}${stock.changesPercentage.toFixed(2)}%)
- Market Cap: $${(stock.marketCap / 1e9).toFixed(1)}B
- P/E Ratio: ${stock.pe > 0 ? stock.pe.toFixed(2) : "N/A (negative earnings)"}
- EPS: $${stock.eps.toFixed(2)}
- 52-Week Low: $${stock.yearLow.toFixed(2)}
- 52-Week High: $${stock.yearHigh.toFixed(2)}
- Position in 52-Week Range: ${rangePos}%
${stock.dividendYieldTTM > 0 ? `- Dividend Yield: ${(stock.dividendYieldTTM * 100).toFixed(2)}%` : ""}
${trendInfo}

${target ? `ANALYST CONSENSUS:
- Rating: ${target.consensusRating} (${target.totalRatings} analysts)
- Average Target: $${target.targetConsensus.toFixed(2)} (${target.upside >= 0 ? "+" : ""}${target.upside.toFixed(1)}% upside)
- Target Range: $${target.targetLow} - $${target.targetHigh}
- Bulls: ${target.bullishPct}%, Neutral: ${target.neutralPct}%, Bears: ${target.bearishPct}%` : ""}

Generate price forecasts for 5 time horizons. Be realistic -- use the analyst targets, fundamentals, trend data, and sector conditions.

Respond in JSON only, no markdown. Use this exact structure:
{
  "forecasts": [
    { "period": "1W", "label": "1 Week", "low": <number>, "mid": <number>, "high": <number>, "confidence": "HIGH" or "MEDIUM" or "LOW" },
    { "period": "1M", "label": "1 Month", "low": <number>, "mid": <number>, "high": <number>, "confidence": "HIGH" or "MEDIUM" or "LOW" },
    { "period": "3M", "label": "3 Months", "low": <number>, "mid": <number>, "high": <number>, "confidence": "MEDIUM" or "LOW" },
    { "period": "6M", "label": "6 Months", "low": <number>, "mid": <number>, "high": <number>, "confidence": "MEDIUM" or "LOW" },
    { "period": "1Y", "label": "1 Year", "low": <number>, "mid": <number>, "high": <number>, "confidence": "LOW" }
  ],
  "methodology": "1-2 sentence explanation of the forecasting approach used",
  "riskFactors": ["risk 1", "risk 2", "risk 3"],
  "outlook": "BULLISH" or "BEARISH" or "NEUTRAL"
}

Guidelines:
- 1W forecast should be close to current price (typical weekly moves are 1-5%)
- Wider ranges for longer horizons
- Analyst targets are typically 12-month targets
- low/mid/high are price targets in dollars (not percentages)
- Keep riskFactors concise (under 10 words each), 3-5 items
- Do NOT include disclaimers in the JSON fields`;

  const response = await client.messages.create({
    model: "claude_haiku_4_5",
    max_tokens: 768,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map(b => b.text)
    .join("");

  let jsonStr = text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr);

  return {
    symbol: stock.symbol,
    currentPrice: stock.price,
    forecasts: parsed.forecasts.map((f: { period: string; label: string; low: number; mid: number; high: number; confidence: string }) => ({
      ...f,
      changePercent: ((f.mid - stock.price) / stock.price) * 100,
    })),
    methodology: parsed.methodology,
    riskFactors: parsed.riskFactors,
    outlook: parsed.outlook as "BULLISH" | "BEARISH" | "NEUTRAL",
    generatedAt: new Date().toISOString(),
  };
}
