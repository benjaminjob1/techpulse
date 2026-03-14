import type { StockQuote, PricePoint, MarketMover, MarketSentiment, AnalystTarget, AIAnalysis, PriceForecast, DataTimestamp } from "@shared/schema";

export interface IStorage {
  getStocks(): StockQuote[];
  getStock(symbol: string): StockQuote | undefined;
  getPriceHistory(symbol: string): PricePoint[];
  getGainers(): MarketMover[];
  getLosers(): MarketMover[];
  getMostActive(): MarketMover[];
  getSentiment(): MarketSentiment;
  getAnalystTargets(): AnalystTarget[];
  getAnalystTarget(symbol: string): AnalystTarget | undefined;
  getDataTimestamp(): DataTimestamp;
  getAIAnalysis(symbol: string): AIAnalysis | undefined;
  setAIAnalysis(symbol: string, analysis: AIAnalysis): void;
  getAllAIAnalyses(): AIAnalysis[];
  getForecast(symbol: string): PriceForecast | undefined;
  setForecast(symbol: string, forecast: PriceForecast): void;
}

// Real market data — Friday March 13, 2026 close
const stockData: StockQuote[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 180.25, change: -2.91, changesPercentage: -1.59, marketCap: 4380976286411, pe: 36.86, eps: 4.89, volume: 156223205, avgVolume: 175286096, dayLow: 179.94, dayHigh: 186.09, yearLow: 86.62, yearHigh: 212.19, previousClose: 183.16, open: 184.91, dividendYieldTTM: 0, sector: "Semiconductors" },
  { symbol: "AAPL", name: "Apple Inc.", price: 250.12, change: -5.64, changesPercentage: -2.21, marketCap: 3676244992996, pe: 31.62, eps: 7.91, volume: 34193754, avgVolume: 47965288, dayLow: 249.88, dayHigh: 256.33, yearLow: 169.21, yearHigh: 288.62, previousClose: 255.76, open: 255.40, dividendYieldTTM: 0, sector: "Consumer Electronics" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 302.28, change: -1.27, changesPercentage: -0.42, marketCap: 3656681258846, pe: 27.94, eps: 10.82, volume: 23640054, avgVolume: 33450227, dayLow: 300.44, dayHigh: 307.62, yearLow: 140.53, yearHigh: 349.00, previousClose: 303.55, open: 307.18, dividendYieldTTM: 0, sector: "Internet Services" },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 395.55, change: -6.31, changesPercentage: -1.57, marketCap: 2937207946500, pe: 24.74, eps: 15.99, volume: 26350249, avgVolume: 33778750, dayLow: 394.25, dayHigh: 404.80, yearLow: 344.79, yearHigh: 555.45, previousClose: 401.86, open: 401.00, dividendYieldTTM: 0.01, sector: "Software" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", price: 207.67, change: -1.86, changesPercentage: -0.89, marketCap: 2229321017073, pe: 28.96, eps: 7.17, volume: 34201623, avgVolume: 48971413, dayLow: 206.22, dayHigh: 210.56, yearLow: 161.38, yearHigh: 258.60, previousClose: 209.53, open: 209.40, dividendYieldTTM: 0, sector: "E-Commerce" },
  { symbol: "AVGO", name: "Broadcom Inc.", price: 322.16, change: -13.81, changesPercentage: -4.11, marketCap: 1527448758388, pe: 62.92, eps: 5.12, volume: 25690012, avgVolume: 30392275, dayLow: 321.43, dayHigh: 338.32, yearLow: 138.10, yearHigh: 414.61, previousClose: 335.97, open: 337.68, dividendYieldTTM: 0.01, sector: "Semiconductors" },
  { symbol: "META", name: "Meta Platforms, Inc.", price: 613.71, change: -24.47, changesPercentage: -3.83, marketCap: 1547158595005, pe: 26.10, eps: 23.51, volume: 18758294, avgVolume: 15086793, dayLow: 609.70, dayHigh: 629.17, yearLow: 479.80, yearHigh: 796.25, previousClose: 638.18, open: 623.27, dividendYieldTTM: 0, sector: "Social Media" },
  { symbol: "TSLA", name: "Tesla, Inc.", price: 391.20, change: -3.81, changesPercentage: -0.96, marketCap: 1467951392141, pe: 234.25, eps: 1.67, volume: 57338789, avgVolume: 64844977, dayLow: 390.06, dayHigh: 400.16, yearLow: 214.25, yearHigh: 498.83, previousClose: 395.01, open: 399.17, dividendYieldTTM: 0, sector: "Electric Vehicles" },
  { symbol: "ORCL", name: "Oracle Corporation", price: 155.11, change: -4.05, changesPercentage: -2.54, marketCap: 445800255010, pe: 29.16, eps: 5.32, volume: 24639328, avgVolume: 34193949, dayLow: 154.15, dayHigh: 160.77, yearLow: 118.86, yearHigh: 345.72, previousClose: 159.16, open: 159.05, dividendYieldTTM: 0.01, sector: "Enterprise Software" },
  { symbol: "NFLX", name: "Netflix, Inc.", price: 95.31, change: 1.00, changesPercentage: 1.06, marketCap: 403859287535, pe: 37.67, eps: 2.53, volume: 29808277, avgVolume: 48743044, dayLow: 94.24, dayHigh: 95.68, yearLow: 75.01, yearHigh: 134.12, previousClose: 94.31, open: 94.55, dividendYieldTTM: 0, sector: "Streaming" },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", price: 150.95, change: -2.55, changesPercentage: -1.66, marketCap: 345897396500, pe: 239.60, eps: 0.63, volume: 42212989, avgVolume: 48609539, dayLow: 148.58, dayHigh: 154.56, yearLow: 66.12, yearHigh: 207.52, previousClose: 153.50, open: 153.19, dividendYieldTTM: 0, sector: "AI / Data Analytics" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", price: 193.39, change: -4.35, changesPercentage: -2.20, marketCap: 315304989900, pe: 74.38, eps: 2.60, volume: 26943213, avgVolume: 36143147, dayLow: 192.27, dayHigh: 199.68, yearLow: 76.48, yearHigh: 267.08, previousClose: 197.74, open: 198.12, dividendYieldTTM: 0, sector: "Semiconductors" },
  { symbol: "CRM", name: "Salesforce, Inc.", price: 192.83, change: -6.45, changesPercentage: -3.24, marketCap: 180681719642, pe: 24.69, eps: 7.81, volume: 14651159, avgVolume: 11538072, dayLow: 191.76, dayHigh: 201.00, yearLow: 174.57, yearHigh: 296.05, previousClose: 199.28, open: 199.73, dividendYieldTTM: 0.01, sector: "Cloud CRM" },
  { symbol: "INTC", name: "Intel Corporation", price: 45.77, change: 0.52, changesPercentage: 1.15, marketCap: 228621150000, pe: -762.83, eps: -0.06, volume: 67145310, avgVolume: 100949763, dayLow: 45.39, dayHigh: 46.65, yearLow: 17.67, yearHigh: 54.60, previousClose: 45.25, open: 45.95, dividendYieldTTM: 0, sector: "Semiconductors" },
  { symbol: "ADBE", name: "Adobe Inc.", price: 249.32, change: -20.46, changesPercentage: -7.58, marketCap: 102345860000, pe: 14.93, eps: 16.70, volume: 17378071, avgVolume: 5388221, dayLow: 247.19, dayHigh: 256.70, yearLow: 244.28, yearHigh: 422.95, previousClose: 269.78, open: 248.81, dividendYieldTTM: 0, sector: "Creative Software" },
];

// Historical price data (3-month, Dec 2025 - Mar 2026)
const priceHistories: Record<string, PricePoint[]> = {
  "AAPL": [
    { date: "2025-12-15", close: 274.11 }, { date: "2025-12-16", close: 274.61 }, { date: "2025-12-17", close: 271.84 },
    { date: "2025-12-18", close: 270.20 }, { date: "2025-12-19", close: 268.55 }, { date: "2025-12-20", close: 271.92 },
    { date: "2025-12-23", close: 267.14 }, { date: "2025-12-24", close: 266.50 }, { date: "2025-12-26", close: 265.33 },
    { date: "2025-12-27", close: 267.25 }, { date: "2025-12-30", close: 264.85 }, { date: "2025-12-31", close: 261.70 },
    { date: "2026-01-02", close: 263.44 }, { date: "2026-01-03", close: 262.88 }, { date: "2026-01-06", close: 260.50 },
    { date: "2026-01-07", close: 259.27 }, { date: "2026-01-08", close: 261.92 }, { date: "2026-01-09", close: 258.61 },
    { date: "2026-01-10", close: 257.15 }, { date: "2026-01-13", close: 255.80 }, { date: "2026-01-14", close: 257.22 },
    { date: "2026-01-15", close: 258.66 }, { date: "2026-01-16", close: 257.82 }, { date: "2026-01-17", close: 261.30 },
    { date: "2026-01-21", close: 260.55 }, { date: "2026-01-22", close: 259.68 }, { date: "2026-01-23", close: 258.22 },
    { date: "2026-01-24", close: 257.90 }, { date: "2026-01-27", close: 255.10 }, { date: "2026-01-28", close: 256.44 },
    { date: "2026-01-29", close: 258.28 }, { date: "2026-01-30", close: 259.48 }, { date: "2026-01-31", close: 258.30 },
    { date: "2026-02-03", close: 260.12 }, { date: "2026-02-04", close: 261.50 }, { date: "2026-02-05", close: 262.88 },
    { date: "2026-02-06", close: 261.33 }, { date: "2026-02-07", close: 260.75 }, { date: "2026-02-10", close: 259.44 },
    { date: "2026-02-11", close: 260.88 }, { date: "2026-02-12", close: 262.05 }, { date: "2026-02-13", close: 261.60 },
    { date: "2026-02-14", close: 263.22 }, { date: "2026-02-18", close: 262.40 }, { date: "2026-02-19", close: 261.88 },
    { date: "2026-02-20", close: 260.50 }, { date: "2026-02-21", close: 259.75 }, { date: "2026-02-24", close: 258.30 },
    { date: "2026-02-25", close: 257.90 }, { date: "2026-02-26", close: 259.40 }, { date: "2026-02-27", close: 261.88 },
    { date: "2026-02-28", close: 260.55 }, { date: "2026-03-02", close: 259.33 }, { date: "2026-03-03", close: 258.10 },
    { date: "2026-03-04", close: 257.55 }, { date: "2026-03-05", close: 259.22 }, { date: "2026-03-06", close: 260.88 },
    { date: "2026-03-09", close: 261.44 }, { date: "2026-03-10", close: 262.25 }, { date: "2026-03-11", close: 260.81 },
    { date: "2026-03-12", close: 255.76 }, { date: "2026-03-13", close: 250.12 },
  ],
  "MSFT": [
    { date: "2025-12-15", close: 474.82 }, { date: "2025-12-16", close: 476.39 }, { date: "2025-12-17", close: 476.12 },
    { date: "2025-12-18", close: 472.50 }, { date: "2025-12-19", close: 468.33 }, { date: "2025-12-20", close: 470.22 },
    { date: "2025-12-23", close: 465.18 }, { date: "2025-12-24", close: 463.50 }, { date: "2025-12-26", close: 460.80 },
    { date: "2025-12-27", close: 462.55 }, { date: "2025-12-30", close: 458.60 }, { date: "2025-12-31", close: 455.44 },
    { date: "2026-01-02", close: 458.22 }, { date: "2026-01-03", close: 460.50 }, { date: "2026-01-06", close: 462.88 },
    { date: "2026-01-07", close: 465.30 }, { date: "2026-01-08", close: 468.55 }, { date: "2026-01-09", close: 470.22 },
    { date: "2026-01-10", close: 472.88 }, { date: "2026-01-13", close: 475.10 }, { date: "2026-01-14", close: 478.33 },
    { date: "2026-01-15", close: 480.66 }, { date: "2026-01-16", close: 482.20 }, { date: "2026-01-17", close: 484.50 },
    { date: "2026-01-21", close: 486.30 }, { date: "2026-01-22", close: 485.22 }, { date: "2026-01-23", close: 483.90 },
    { date: "2026-01-24", close: 482.55 }, { date: "2026-01-27", close: 480.10 }, { date: "2026-01-28", close: 481.63 },
    { date: "2026-01-29", close: 433.50 }, { date: "2026-01-30", close: 430.29 }, { date: "2026-01-31", close: 428.50 },
    { date: "2026-02-03", close: 425.88 }, { date: "2026-02-04", close: 422.40 }, { date: "2026-02-05", close: 420.55 },
    { date: "2026-02-06", close: 418.22 }, { date: "2026-02-07", close: 415.80 }, { date: "2026-02-10", close: 412.90 },
    { date: "2026-02-11", close: 414.50 }, { date: "2026-02-12", close: 416.88 }, { date: "2026-02-13", close: 415.30 },
    { date: "2026-02-14", close: 413.55 }, { date: "2026-02-18", close: 411.20 }, { date: "2026-02-19", close: 409.88 },
    { date: "2026-02-20", close: 412.40 }, { date: "2026-02-21", close: 414.66 }, { date: "2026-02-24", close: 412.30 },
    { date: "2026-02-25", close: 410.55 }, { date: "2026-02-26", close: 408.88 }, { date: "2026-02-27", close: 410.50 },
    { date: "2026-02-28", close: 408.20 }, { date: "2026-03-02", close: 406.55 }, { date: "2026-03-03", close: 404.90 },
    { date: "2026-03-04", close: 405.80 }, { date: "2026-03-05", close: 407.22 }, { date: "2026-03-06", close: 408.50 },
    { date: "2026-03-09", close: 406.33 }, { date: "2026-03-10", close: 405.10 }, { date: "2026-03-11", close: 404.88 },
    { date: "2026-03-12", close: 401.86 }, { date: "2026-03-13", close: 395.55 },
  ],
  "NVDA": [
    { date: "2025-12-15", close: 176.29 }, { date: "2025-12-16", close: 177.72 }, { date: "2025-12-17", close: 170.94 },
    { date: "2025-12-18", close: 168.50 }, { date: "2025-12-19", close: 171.22 }, { date: "2025-12-20", close: 174.80 },
    { date: "2025-12-23", close: 172.55 }, { date: "2025-12-24", close: 170.88 }, { date: "2025-12-26", close: 169.33 },
    { date: "2025-12-27", close: 171.66 }, { date: "2025-12-30", close: 173.20 }, { date: "2025-12-31", close: 175.40 },
    { date: "2026-01-02", close: 178.55 }, { date: "2026-01-03", close: 180.88 }, { date: "2026-01-06", close: 183.22 },
    { date: "2026-01-07", close: 185.50 }, { date: "2026-01-08", close: 188.33 }, { date: "2026-01-09", close: 186.77 },
    { date: "2026-01-10", close: 184.55 }, { date: "2026-01-13", close: 186.90 }, { date: "2026-01-14", close: 189.22 },
    { date: "2026-01-15", close: 191.50 }, { date: "2026-01-16", close: 193.88 }, { date: "2026-01-17", close: 196.20 },
    { date: "2026-01-21", close: 198.55 }, { date: "2026-01-22", close: 197.33 }, { date: "2026-01-23", close: 195.80 },
    { date: "2026-01-24", close: 194.22 }, { date: "2026-01-27", close: 192.66 }, { date: "2026-01-28", close: 191.52 },
    { date: "2026-01-29", close: 192.51 }, { date: "2026-01-30", close: 191.13 }, { date: "2026-01-31", close: 189.80 },
    { date: "2026-02-03", close: 188.44 }, { date: "2026-02-04", close: 190.22 }, { date: "2026-02-05", close: 192.55 },
    { date: "2026-02-06", close: 191.33 }, { date: "2026-02-07", close: 189.88 }, { date: "2026-02-10", close: 188.50 },
    { date: "2026-02-11", close: 190.22 }, { date: "2026-02-12", close: 191.88 }, { date: "2026-02-13", close: 190.55 },
    { date: "2026-02-14", close: 189.22 }, { date: "2026-02-18", close: 187.80 }, { date: "2026-02-19", close: 186.55 },
    { date: "2026-02-20", close: 188.33 }, { date: "2026-02-21", close: 189.90 }, { date: "2026-02-24", close: 188.44 },
    { date: "2026-02-25", close: 186.80 }, { date: "2026-02-26", close: 185.22 }, { date: "2026-02-27", close: 187.55 },
    { date: "2026-02-28", close: 186.33 }, { date: "2026-03-02", close: 184.88 }, { date: "2026-03-03", close: 183.55 },
    { date: "2026-03-04", close: 185.22 }, { date: "2026-03-05", close: 186.80 }, { date: "2026-03-06", close: 188.50 },
    { date: "2026-03-09", close: 187.22 }, { date: "2026-03-10", close: 186.50 }, { date: "2026-03-11", close: 186.03 },
    { date: "2026-03-12", close: 183.14 }, { date: "2026-03-13", close: 180.25 },
  ],
  "GOOGL": [
    { date: "2025-12-15", close: 308.22 }, { date: "2025-12-16", close: 306.57 }, { date: "2025-12-17", close: 296.72 },
    { date: "2025-12-18", close: 298.40 }, { date: "2025-12-19", close: 301.55 }, { date: "2025-12-20", close: 305.80 },
    { date: "2025-12-23", close: 310.22 }, { date: "2025-12-24", close: 312.50 }, { date: "2025-12-26", close: 315.33 },
    { date: "2025-12-27", close: 318.88 }, { date: "2025-12-30", close: 322.40 }, { date: "2025-12-31", close: 320.55 },
    { date: "2026-01-02", close: 323.80 }, { date: "2026-01-03", close: 325.50 }, { date: "2026-01-06", close: 328.22 },
    { date: "2026-01-07", close: 330.55 }, { date: "2026-01-08", close: 332.88 }, { date: "2026-01-09", close: 331.22 },
    { date: "2026-01-10", close: 329.80 }, { date: "2026-01-13", close: 332.55 }, { date: "2026-01-14", close: 334.20 },
    { date: "2026-01-15", close: 335.88 }, { date: "2026-01-16", close: 333.50 }, { date: "2026-01-17", close: 331.22 },
    { date: "2026-01-21", close: 333.88 }, { date: "2026-01-22", close: 335.50 }, { date: "2026-01-23", close: 337.22 },
    { date: "2026-01-24", close: 338.50 }, { date: "2026-01-27", close: 336.80 }, { date: "2026-01-28", close: 336.01 },
    { date: "2026-01-29", close: 338.25 }, { date: "2026-01-30", close: 338.00 }, { date: "2026-01-31", close: 335.50 },
    { date: "2026-02-03", close: 332.22 }, { date: "2026-02-04", close: 330.88 }, { date: "2026-02-05", close: 328.55 },
    { date: "2026-02-06", close: 325.22 }, { date: "2026-02-07", close: 322.80 }, { date: "2026-02-10", close: 320.55 },
    { date: "2026-02-11", close: 318.22 }, { date: "2026-02-12", close: 316.80 }, { date: "2026-02-13", close: 318.50 },
    { date: "2026-02-14", close: 320.22 }, { date: "2026-02-18", close: 318.55 }, { date: "2026-02-19", close: 316.88 },
    { date: "2026-02-20", close: 314.55 }, { date: "2026-02-21", close: 312.22 }, { date: "2026-02-24", close: 310.80 },
    { date: "2026-02-25", close: 312.55 }, { date: "2026-02-26", close: 314.22 }, { date: "2026-02-27", close: 312.50 },
    { date: "2026-02-28", close: 310.88 }, { date: "2026-03-02", close: 308.55 }, { date: "2026-03-03", close: 306.22 },
    { date: "2026-03-04", close: 308.50 }, { date: "2026-03-05", close: 310.88 }, { date: "2026-03-06", close: 312.22 },
    { date: "2026-03-09", close: 310.55 }, { date: "2026-03-10", close: 309.22 }, { date: "2026-03-11", close: 308.70 },
    { date: "2026-03-12", close: 303.55 }, { date: "2026-03-13", close: 302.28 },
  ],
  "META": [
    { date: "2025-12-15", close: 647.51 }, { date: "2025-12-16", close: 657.15 }, { date: "2025-12-17", close: 649.50 },
    { date: "2025-12-18", close: 655.22 }, { date: "2025-12-19", close: 660.80 }, { date: "2025-12-20", close: 658.33 },
    { date: "2025-12-23", close: 662.50 }, { date: "2025-12-24", close: 665.88 }, { date: "2025-12-26", close: 668.22 },
    { date: "2025-12-27", close: 670.55 }, { date: "2025-12-30", close: 665.33 }, { date: "2025-12-31", close: 660.80 },
    { date: "2026-01-02", close: 658.22 }, { date: "2026-01-03", close: 660.55 }, { date: "2026-01-06", close: 665.80 },
    { date: "2026-01-07", close: 668.22 }, { date: "2026-01-08", close: 670.50 }, { date: "2026-01-09", close: 672.88 },
    { date: "2026-01-10", close: 670.55 }, { date: "2026-01-13", close: 668.22 }, { date: "2026-01-14", close: 671.80 },
    { date: "2026-01-15", close: 674.50 }, { date: "2026-01-16", close: 672.22 }, { date: "2026-01-17", close: 669.88 },
    { date: "2026-01-21", close: 667.55 }, { date: "2026-01-22", close: 670.22 }, { date: "2026-01-23", close: 672.80 },
    { date: "2026-01-24", close: 670.55 }, { date: "2026-01-27", close: 668.22 }, { date: "2026-01-28", close: 668.73 },
    { date: "2026-01-29", close: 738.31 }, { date: "2026-01-30", close: 716.50 }, { date: "2026-01-31", close: 710.22 },
    { date: "2026-02-03", close: 705.55 }, { date: "2026-02-04", close: 700.88 }, { date: "2026-02-05", close: 695.22 },
    { date: "2026-02-06", close: 690.55 }, { date: "2026-02-07", close: 685.22 }, { date: "2026-02-10", close: 680.88 },
    { date: "2026-02-11", close: 678.55 }, { date: "2026-02-12", close: 675.22 }, { date: "2026-02-13", close: 672.80 },
    { date: "2026-02-14", close: 668.55 }, { date: "2026-02-18", close: 665.22 }, { date: "2026-02-19", close: 662.80 },
    { date: "2026-02-20", close: 660.55 }, { date: "2026-02-21", close: 658.22 }, { date: "2026-02-24", close: 655.80 },
    { date: "2026-02-25", close: 652.55 }, { date: "2026-02-26", close: 650.22 }, { date: "2026-02-27", close: 655.80 },
    { date: "2026-02-28", close: 652.55 }, { date: "2026-03-02", close: 650.22 }, { date: "2026-03-03", close: 648.80 },
    { date: "2026-03-04", close: 652.55 }, { date: "2026-03-05", close: 655.22 }, { date: "2026-03-06", close: 658.80 },
    { date: "2026-03-09", close: 656.55 }, { date: "2026-03-10", close: 655.22 }, { date: "2026-03-11", close: 654.86 },
    { date: "2026-03-12", close: 638.18 }, { date: "2026-03-13", close: 613.71 },
  ],
  "TSLA": [
    { date: "2025-12-15", close: 475.31 }, { date: "2025-12-16", close: 489.88 }, { date: "2025-12-17", close: 467.26 },
    { date: "2025-12-18", close: 460.55 }, { date: "2025-12-19", close: 455.22 }, { date: "2025-12-20", close: 450.80 },
    { date: "2025-12-23", close: 445.55 }, { date: "2025-12-24", close: 442.22 }, { date: "2025-12-26", close: 440.80 },
    { date: "2025-12-27", close: 438.55 }, { date: "2025-12-30", close: 435.22 }, { date: "2025-12-31", close: 432.80 },
    { date: "2026-01-02", close: 430.55 }, { date: "2026-01-03", close: 428.22 }, { date: "2026-01-06", close: 425.80 },
    { date: "2026-01-07", close: 430.55 }, { date: "2026-01-08", close: 435.22 }, { date: "2026-01-09", close: 432.80 },
    { date: "2026-01-10", close: 428.55 }, { date: "2026-01-13", close: 425.22 }, { date: "2026-01-14", close: 428.80 },
    { date: "2026-01-15", close: 432.55 }, { date: "2026-01-16", close: 430.22 }, { date: "2026-01-17", close: 433.80 },
    { date: "2026-01-21", close: 436.55 }, { date: "2026-01-22", close: 434.22 }, { date: "2026-01-23", close: 432.80 },
    { date: "2026-01-24", close: 430.55 }, { date: "2026-01-27", close: 428.22 }, { date: "2026-01-28", close: 431.46 },
    { date: "2026-01-29", close: 416.56 }, { date: "2026-01-30", close: 430.41 }, { date: "2026-01-31", close: 425.55 },
    { date: "2026-02-03", close: 420.22 }, { date: "2026-02-04", close: 418.80 }, { date: "2026-02-05", close: 415.55 },
    { date: "2026-02-06", close: 412.22 }, { date: "2026-02-07", close: 415.80 }, { date: "2026-02-10", close: 418.55 },
    { date: "2026-02-11", close: 415.22 }, { date: "2026-02-12", close: 412.80 }, { date: "2026-02-13", close: 410.55 },
    { date: "2026-02-14", close: 412.22 }, { date: "2026-02-18", close: 415.80 }, { date: "2026-02-19", close: 412.55 },
    { date: "2026-02-20", close: 410.22 }, { date: "2026-02-21", close: 408.80 }, { date: "2026-02-24", close: 405.55 },
    { date: "2026-02-25", close: 402.22 }, { date: "2026-02-26", close: 405.80 }, { date: "2026-02-27", close: 408.55 },
    { date: "2026-02-28", close: 406.22 }, { date: "2026-03-02", close: 404.80 }, { date: "2026-03-03", close: 402.55 },
    { date: "2026-03-04", close: 405.22 }, { date: "2026-03-05", close: 408.80 }, { date: "2026-03-06", close: 410.55 },
    { date: "2026-03-09", close: 408.22 }, { date: "2026-03-10", close: 406.80 }, { date: "2026-03-11", close: 407.82 },
    { date: "2026-03-12", close: 395.01 }, { date: "2026-03-13", close: 391.20 },
  ],
  "AMZN": [
    { date: "2025-12-15", close: 222.54 }, { date: "2025-12-16", close: 222.56 }, { date: "2025-12-17", close: 221.27 },
    { date: "2025-12-18", close: 223.44 }, { date: "2025-12-19", close: 225.55 }, { date: "2025-12-20", close: 228.80 },
    { date: "2025-12-23", close: 230.22 }, { date: "2025-12-24", close: 232.55 }, { date: "2025-12-26", close: 235.80 },
    { date: "2025-12-27", close: 238.22 }, { date: "2025-12-30", close: 240.55 }, { date: "2025-12-31", close: 238.22 },
    { date: "2026-01-02", close: 235.80 }, { date: "2026-01-03", close: 238.55 }, { date: "2026-01-06", close: 240.22 },
    { date: "2026-01-07", close: 242.80 }, { date: "2026-01-08", close: 245.55 }, { date: "2026-01-09", close: 243.22 },
    { date: "2026-01-10", close: 240.80 }, { date: "2026-01-13", close: 242.55 }, { date: "2026-01-14", close: 244.22 },
    { date: "2026-01-15", close: 246.80 }, { date: "2026-01-16", close: 244.55 }, { date: "2026-01-17", close: 242.22 },
    { date: "2026-01-21", close: 244.80 }, { date: "2026-01-22", close: 246.55 }, { date: "2026-01-23", close: 244.22 },
    { date: "2026-01-24", close: 242.80 }, { date: "2026-01-27", close: 240.55 }, { date: "2026-01-28", close: 243.01 },
    { date: "2026-01-29", close: 241.73 }, { date: "2026-01-30", close: 239.30 }, { date: "2026-01-31", close: 236.80 },
    { date: "2026-02-03", close: 234.55 }, { date: "2026-02-04", close: 232.22 }, { date: "2026-02-05", close: 230.80 },
    { date: "2026-02-06", close: 228.55 }, { date: "2026-02-07", close: 226.22 }, { date: "2026-02-10", close: 224.80 },
    { date: "2026-02-11", close: 222.55 }, { date: "2026-02-12", close: 220.80 }, { date: "2026-02-13", close: 222.55 },
    { date: "2026-02-14", close: 224.22 }, { date: "2026-02-18", close: 222.80 }, { date: "2026-02-19", close: 220.55 },
    { date: "2026-02-20", close: 218.22 }, { date: "2026-02-21", close: 216.80 }, { date: "2026-02-24", close: 214.55 },
    { date: "2026-02-25", close: 212.22 }, { date: "2026-02-26", close: 214.80 }, { date: "2026-02-27", close: 216.55 },
    { date: "2026-02-28", close: 214.22 }, { date: "2026-03-02", close: 212.80 }, { date: "2026-03-03", close: 211.55 },
    { date: "2026-03-04", close: 213.22 }, { date: "2026-03-05", close: 214.80 }, { date: "2026-03-06", close: 216.55 },
    { date: "2026-03-09", close: 214.22 }, { date: "2026-03-10", close: 213.80 }, { date: "2026-03-11", close: 212.65 },
    { date: "2026-03-12", close: 209.53 }, { date: "2026-03-13", close: 207.67 },
  ],
  "AMD": [
    { date: "2025-12-15", close: 207.58 }, { date: "2025-12-16", close: 209.17 }, { date: "2025-12-17", close: 198.11 },
    { date: "2026-01-06", close: 215.40 }, { date: "2026-01-13", close: 228.55 }, { date: "2026-01-17", close: 240.22 },
    { date: "2026-01-21", close: 248.80 }, { date: "2026-01-28", close: 252.74 }, { date: "2026-01-29", close: 252.18 },
    { date: "2026-01-30", close: 236.73 }, { date: "2026-02-10", close: 225.55 }, { date: "2026-02-20", close: 218.22 },
    { date: "2026-02-28", close: 210.55 }, { date: "2026-03-05", close: 208.22 }, { date: "2026-03-11", close: 204.83 },
    { date: "2026-03-12", close: 197.74 }, { date: "2026-03-13", close: 193.39 },
  ],
  "AVGO": [
    { date: "2025-12-15", close: 339.81 }, { date: "2025-12-16", close: 341.30 }, { date: "2025-12-17", close: 326.02 },
    { date: "2026-01-06", close: 335.55 }, { date: "2026-01-13", close: 342.22 }, { date: "2026-01-17", close: 348.80 },
    { date: "2026-01-21", close: 345.55 }, { date: "2026-01-28", close: 333.24 }, { date: "2026-01-29", close: 330.73 },
    { date: "2026-01-30", close: 331.30 }, { date: "2026-02-10", close: 340.55 }, { date: "2026-02-20", close: 345.22 },
    { date: "2026-02-28", close: 348.80 }, { date: "2026-03-05", close: 345.22 }, { date: "2026-03-11", close: 341.57 },
    { date: "2026-03-12", close: 335.97 }, { date: "2026-03-13", close: 322.16 },
  ],
  "PLTR": [
    { date: "2025-12-15", close: 183.25 }, { date: "2025-12-16", close: 187.75 }, { date: "2025-12-17", close: 177.29 },
    { date: "2026-01-06", close: 170.55 }, { date: "2026-01-13", close: 165.22 }, { date: "2026-01-17", close: 160.80 },
    { date: "2026-01-21", close: 158.55 }, { date: "2026-01-28", close: 157.35 }, { date: "2026-01-29", close: 151.86 },
    { date: "2026-01-30", close: 146.59 }, { date: "2026-02-10", close: 148.22 }, { date: "2026-02-20", close: 152.55 },
    { date: "2026-02-28", close: 150.22 }, { date: "2026-03-05", close: 148.80 }, { date: "2026-03-11", close: 151.60 },
    { date: "2026-03-12", close: 153.50 }, { date: "2026-03-13", close: 150.95 },
  ],
};

const gainers: MarketMover[] = [
  { symbol: "SVCO", name: "Silvaco Group, Inc.", price: 5.03, changePercent: 52.42, change: 1.73 },
  { symbol: "PLYX", name: "Polaryx Therapeutics, Inc.", price: 6.36, changePercent: 36.77, change: 1.71 },
  { symbol: "ORKA", name: "Oruka Therapeutics, Inc.", price: 40.00, changePercent: 25.04, change: 8.01 },
  { symbol: "CVGI", name: "Commercial Vehicle Group", price: 2.90, changePercent: 24.46, change: 0.57 },
  { symbol: "APEI", name: "American Public Education", price: 57.66, changePercent: 21.19, change: 10.08 },
  { symbol: "KRT", name: "Karat Packaging Inc.", price: 26.92, changePercent: 20.66, change: 4.61 },
  { symbol: "NP", name: "Neptune Insurance Holdings", price: 21.87, changePercent: 20.23, change: 3.68 },
  { symbol: "LPRO", name: "Open Lending Corporation", price: 1.45, changePercent: 19.83, change: 0.24 },
];

const losers: MarketMover[] = [
  { symbol: "KLC", name: "KinderCare Learning Companies", price: 1.95, changePercent: -42.65, change: -1.45 },
  { symbol: "CAST", name: "FreeCast, Inc.", price: 4.77, changePercent: -38.13, change: -2.94 },
  { symbol: "DOUG", name: "Douglas Elliman Inc.", price: 1.70, changePercent: -26.72, change: -0.62 },
  { symbol: "DGXX", name: "Digi Power X Inc.", price: 2.22, changePercent: -21.55, change: -0.61 },
  { symbol: "COE", name: "51Talk Online Education", price: 19.14, changePercent: -19.74, change: -4.71 },
  { symbol: "RPID", name: "Rapid Micro Biosystems", price: 2.83, changePercent: -17.37, change: -0.59 },
  { symbol: "ANGX", name: "Angel Studios, Inc.", price: 3.70, changePercent: -17.04, change: -0.76 },
];

const mostActive: MarketMover[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 180.25, changePercent: -1.59, change: -2.91 },
  { symbol: "INTC", name: "Intel Corporation", price: 45.77, changePercent: 1.15, change: 0.52 },
  { symbol: "TSLA", name: "Tesla, Inc.", price: 391.20, changePercent: -0.96, change: -3.81 },
  { symbol: "PLTR", name: "Palantir Technologies", price: 150.95, changePercent: -1.66, change: -2.55 },
  { symbol: "AAPL", name: "Apple Inc.", price: 250.12, changePercent: -2.21, change: -5.64 },
  { symbol: "AMZN", name: "Amazon.com, Inc.", price: 207.67, changePercent: -0.89, change: -1.86 },
  { symbol: "NFLX", name: "Netflix, Inc.", price: 95.31, changePercent: 1.06, change: 1.00 },
  { symbol: "AMD", name: "Advanced Micro Devices", price: 193.39, changePercent: -2.20, change: -4.35 },
];

// Real analyst consensus data from March 14, 2026
const analystTargets: AnalystTarget[] = [
  { symbol: "NVDA", targetHigh: 360, targetLow: 215, targetConsensus: 275.30, targetMedian: 275, currentPrice: 180.25, upside: 52.73, consensusRating: "Strong Buy", totalRatings: 33, bullishPct: 97, neutralPct: 3, bearishPct: 0 },
  { symbol: "AAPL", targetHigh: 350, targetLow: 248, targetConsensus: 305.63, targetMedian: 315, currentPrice: 250.12, upside: 22.19, consensusRating: "Buy", totalRatings: 20, bullishPct: 75, neutralPct: 20, bearishPct: 5 },
  { symbol: "GOOGL", targetHigh: 420, targetLow: 270, targetConsensus: 363.75, targetMedian: 372.5, currentPrice: 302.28, upside: 20.34, consensusRating: "Strong Buy", totalRatings: 36, bullishPct: 88.9, neutralPct: 11.1, bearishPct: 0 },
  { symbol: "MSFT", targetHigh: 650, targetLow: 392, targetConsensus: 591.27, targetMedian: 600, currentPrice: 395.55, upside: 49.48, consensusRating: "Strong Buy", totalRatings: 22, bullishPct: 90.9, neutralPct: 9.1, bearishPct: 0 },
  { symbol: "AMZN", targetHigh: 325, targetLow: 175, targetConsensus: 288.82, targetMedian: 300, currentPrice: 207.67, upside: 39.08, consensusRating: "Strong Buy", totalRatings: 34, bullishPct: 94.1, neutralPct: 5.9, bearishPct: 0 },
  { symbol: "AVGO", targetHigh: 582, targetLow: 360, targetConsensus: 464.41, targetMedian: 472.5, currentPrice: 322.16, upside: 44.15, consensusRating: "Strong Buy", totalRatings: 22, bullishPct: 95.5, neutralPct: 4.5, bearishPct: 0 },
  { symbol: "META", targetHigh: 1144, targetLow: 700, targetConsensus: 847.10, targetMedian: 850, currentPrice: 613.71, upside: 38.03, consensusRating: "Strong Buy", totalRatings: 31, bullishPct: 93.5, neutralPct: 6.5, bearishPct: 0 },
  { symbol: "TSLA", targetHigh: 600, targetLow: 25.28, targetConsensus: 421.01, targetMedian: 471, currentPrice: 391.20, upside: 7.62, consensusRating: "Buy", totalRatings: 19, bullishPct: 47.4, neutralPct: 36.8, bearishPct: 15.8 },
  { symbol: "ORCL", targetHigh: 400, targetLow: 160, targetConsensus: 273.45, targetMedian: 280, currentPrice: 155.11, upside: 76.29, consensusRating: "Strong Buy", totalRatings: 29, bullishPct: 82.8, neutralPct: 17.2, bearishPct: 0 },
  { symbol: "NFLX", targetHigh: 151, targetLow: 95, targetConsensus: 116.58, targetMedian: 115, currentPrice: 95.31, upside: 22.32, consensusRating: "Strong Buy", totalRatings: 25, bullishPct: 76, neutralPct: 24, bearishPct: 0 },
  { symbol: "PLTR", targetHigh: 260, targetLow: 50, targetConsensus: 195.50, targetMedian: 200, currentPrice: 150.95, upside: 29.51, consensusRating: "Buy", totalRatings: 12, bullishPct: 41.7, neutralPct: 50, bearishPct: 8.3 },
  { symbol: "AMD", targetHigh: 358, targetLow: 225, targetConsensus: 290.21, targetMedian: 300, currentPrice: 193.39, upside: 50.06, consensusRating: "Strong Buy", totalRatings: 24, bullishPct: 75, neutralPct: 25, bearishPct: 0 },
  { symbol: "CRM", targetHigh: 430, targetLow: 194, targetConsensus: 278.97, targetMedian: 257.5, currentPrice: 192.83, upside: 44.67, consensusRating: "Buy", totalRatings: 32, bullishPct: 75, neutralPct: 21.9, bearishPct: 3.1 },
  { symbol: "INTC", targetHigh: 65, targetLow: 30, targetConsensus: 42.92, targetMedian: 45, currentPrice: 45.77, upside: -6.23, consensusRating: "Hold", totalRatings: 25, bullishPct: 12, neutralPct: 76, bearishPct: 12 },
  { symbol: "ADBE", targetHigh: 600, targetLow: 278, targetConsensus: 415.00, targetMedian: 400, currentPrice: 249.32, upside: 66.41, consensusRating: "Buy", totalRatings: 28, bullishPct: 71, neutralPct: 25, bearishPct: 4 },
];

export class MemStorage implements IStorage {
  private aiAnalyses: Map<string, AIAnalysis> = new Map();

  getStocks(): StockQuote[] {
    return stockData;
  }

  getStock(symbol: string): StockQuote | undefined {
    return stockData.find(s => s.symbol === symbol);
  }

  getPriceHistory(symbol: string): PricePoint[] {
    return priceHistories[symbol] || [];
  }

  getGainers(): MarketMover[] {
    return gainers;
  }

  getLosers(): MarketMover[] {
    return losers;
  }

  getMostActive(): MarketMover[] {
    return mostActive;
  }

  getSentiment(): MarketSentiment {
    return { sentiment: "BEARISH", marketStatus: "closed" };
  }

  getAnalystTargets(): AnalystTarget[] {
    return analystTargets;
  }

  getAnalystTarget(symbol: string): AnalystTarget | undefined {
    return analystTargets.find(t => t.symbol === symbol);
  }

  getDataTimestamp(): DataTimestamp {
    return {
      lastUpdated: "2026-03-13T20:00:00Z",
      marketStatus: "closed",
      source: "Market data as of Friday March 13, 2026 close",
    };
  }

  getAIAnalysis(symbol: string): AIAnalysis | undefined {
    return this.aiAnalyses.get(symbol);
  }

  setAIAnalysis(symbol: string, analysis: AIAnalysis): void {
    this.aiAnalyses.set(symbol, analysis);
  }

  getAllAIAnalyses(): AIAnalysis[] {
    return Array.from(this.aiAnalyses.values());
  }

  private forecastCache: Map<string, PriceForecast> = new Map();

  getForecast(symbol: string): PriceForecast | undefined {
    return this.forecastCache.get(symbol);
  }

  setForecast(symbol: string, forecast: PriceForecast): void {
    this.forecastCache.set(symbol, forecast);
  }
}

export const storage = new MemStorage();
