import Anthropic from "@anthropic-ai/sdk";
import type { StockQuote, AnalystTarget, AIAnalysis } from "@shared/schema";

const client = new Anthropic();

export async function generateAIAnalysis(
  stock: StockQuote,
  target?: AnalystTarget
): Promise<AIAnalysis> {
  const rangePos = stock.yearHigh !== stock.yearLow
    ? ((stock.price - stock.yearLow) / (stock.yearHigh - stock.yearLow) * 100).toFixed(1)
    : "50";

  const volumeRatio = stock.avgVolume > 0
    ? (stock.volume / stock.avgVolume * 100).toFixed(0)
    : "100";

  const prompt = `You are a professional stock analyst. Analyze the following tech stock and provide a BUY, SELL, or HOLD recommendation.

STOCK DATA (as of market close):
- Symbol: ${stock.symbol}
- Name: ${stock.name}
- Sector: ${stock.sector || "Technology"}
- Current Price: $${stock.price.toFixed(2)}
- Day Change: ${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)} (${stock.changesPercentage >= 0 ? "+" : ""}${stock.changesPercentage.toFixed(2)}%)
- Market Cap: $${(stock.marketCap / 1e9).toFixed(1)}B
- P/E Ratio: ${stock.pe > 0 ? stock.pe.toFixed(2) : "N/A (negative earnings)"}
- EPS: $${stock.eps.toFixed(2)}
- Volume: ${(stock.volume / 1e6).toFixed(1)}M (${volumeRatio}% of average)
- 52-Week Low: $${stock.yearLow.toFixed(2)}
- 52-Week High: $${stock.yearHigh.toFixed(2)}
- Position in 52-Week Range: ${rangePos}%
- Day Range: $${stock.dayLow.toFixed(2)} - $${stock.dayHigh.toFixed(2)}
${stock.dividendYieldTTM > 0 ? `- Dividend Yield: ${(stock.dividendYieldTTM * 100).toFixed(2)}%` : "- No dividend"}

${target ? `ANALYST CONSENSUS:
- Rating: ${target.consensusRating} (${target.totalRatings} analysts)
- Average Target: $${target.targetConsensus.toFixed(2)} (${target.upside >= 0 ? "+" : ""}${target.upside.toFixed(1)}% upside)
- Median Target: $${target.targetMedian.toFixed(2)}
- Target Range: $${target.targetLow} - $${target.targetHigh}
- Bulls: ${target.bullishPct}%, Neutral: ${target.neutralPct}%, Bears: ${target.bearishPct}%` : "No analyst data available."}

Respond in JSON only, no markdown. Use this exact structure:
{
  "signal": "BUY" or "SELL" or "HOLD",
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "summary": "2-3 sentence overview of the recommendation",
  "bullCase": "1-2 sentence bull case",
  "bearCase": "1-2 sentence bear case",
  "keyFactors": ["factor 1", "factor 2", "factor 3"]
}

Important guidelines:
- Base your analysis on the fundamentals provided (P/E, EPS, analyst targets, 52-week position, volume)
- Be specific about WHY -- reference actual numbers
- Keep each field concise (summary under 60 words, bull/bear cases under 40 words each)
- Key factors should be 3-5 short phrases (under 8 words each)
- This is NOT financial advice -- it's educational analysis
- Do not include any disclaimers in the JSON fields themselves`;

  const response = await client.messages.create({
    model: "claude_haiku_4_5",
    max_tokens: 512,
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
    signal: parsed.signal as "BUY" | "SELL" | "HOLD",
    confidence: parsed.confidence as "HIGH" | "MEDIUM" | "LOW",
    summary: parsed.summary,
    bullCase: parsed.bullCase,
    bearCase: parsed.bearCase,
    keyFactors: parsed.keyFactors,
    generatedAt: new Date().toISOString(),
  };
}
