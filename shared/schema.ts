import { z } from "zod";

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

export const pricePointSchema = z.object({
  date: z.string(),
  close: z.number(),
});

export type PricePoint = z.infer<typeof pricePointSchema>;

export const marketMoverSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  changePercent: z.number(),
  change: z.number(),
});

export type MarketMover = z.infer<typeof marketMoverSchema>;

export const marketSentimentSchema = z.object({
  sentiment: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]),
  marketStatus: z.string(),
});

export type MarketSentiment = z.infer<typeof marketSentimentSchema>;

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

export const priceForecastSchema = z.object({
  symbol: z.string(),
  currentPrice: z.number(),
  forecasts: z.array(z.object({
    period: z.string(),
    label: z.string(),
    low: z.number(),
    mid: z.number(),
    high: z.number(),
    changePercent: z.number(),
    confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  })),
  methodology: z.string(),
  riskFactors: z.array(z.string()),
  outlook: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]),
  generatedAt: z.string(),
});

export type PriceForecast = z.infer<typeof priceForecastSchema>;

export const dataTimestampSchema = z.object({
  lastUpdated: z.string(),
  marketStatus: z.string(),
  source: z.string(),
});

export type DataTimestamp = z.infer<typeof dataTimestampSchema>;
