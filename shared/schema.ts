import { z } from "zod";

// Stock quote data
export const stockQuoteSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  change: z.number(),
  changesPercentage: z.number(),
  marketCap: z.number(),
  pe: z.number(),
  eps: z.number(),
  volume: z.number(),
  avgVolume: z.number(),
  dayLow: z.number(),
  dayHigh: z.number(),
  yearLow: z.number(),
  yearHigh: z.number(),
  previousClose: z.number(),
  open: z.number(),
  dividendYieldTTM: z.number(),
  sector: z.string().optional(),
});

export type StockQuote = z.infer<typeof stockQuoteSchema>;

// Price history point
export const pricePointSchema = z.object({
  date: z.string(),
  close: z.number(),
});

export type PricePoint = z.infer<typeof pricePointSchema>;

// Market mover (gainer/loser)
export const marketMoverSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  changePercent: z.number(),
  change: z.number(),
});

export type MarketMover = z.infer<typeof marketMoverSchema>;

// Market sentiment
export const marketSentimentSchema = z.object({
  sentiment: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]),
  marketStatus: z.string(),
});

export type MarketSentiment = z.infer<typeof marketSentimentSchema>;

// Analyst target — updated with consensus data
export const analystTargetSchema = z.object({
  symbol: z.string(),
  targetHigh: z.number(),
  targetLow: z.number(),
  targetConsensus: z.number(),
  targetMedian: z.number(),
  currentPrice: z.number(),
  upside: z.number(),
  consensusRating: z.string(),
  totalRatings: z.number(),
  bullishPct: z.number(),
  neutralPct: z.number(),
  bearishPct: z.number(),
});

export type AnalystTarget = z.infer<typeof analystTargetSchema>;

// AI stock analysis
export const aiAnalysisSchema = z.object({
  symbol: z.string(),
  signal: z.enum(["BUY", "SELL", "HOLD"]),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  summary: z.string(),
  bullCase: z.string(),
  bearCase: z.string(),
  keyFactors: z.array(z.string()),
  generatedAt: z.string(),
});

export type AIAnalysis = z.infer<typeof aiAnalysisSchema>;

// AI price forecast
export const priceForecastSchema = z.object({
  symbol: z.string(),
  currentPrice: z.number(),
  forecasts: z.array(z.object({
    period: z.string(), // "1W", "1M", "3M", "6M", "1Y"
    label: z.string(), // "1 Week", "1 Month", etc.
    low: z.number(),
    mid: z.number(),
    high: z.number(),
    changePercent: z.number(), // mid vs current
    confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  })),
  methodology: z.string(),
  riskFactors: z.array(z.string()),
  outlook: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]),
  generatedAt: z.string(),
});

export type PriceForecast = z.infer<typeof priceForecastSchema>;

// Data timestamp
export const dataTimestampSchema = z.object({
  lastUpdated: z.string(),
  marketStatus: z.string(),
  source: z.string(),
});

export type DataTimestamp = z.infer<typeof dataTimestampSchema>;
