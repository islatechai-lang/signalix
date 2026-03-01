
export interface CryptoPair {
  symbol: string;
  base: string;
  quote: string;
  name: string;
  type: 'CRYPTO' | 'FOREX';
}

export interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeto: number;
}

export interface IndicatorValue {
  value: number | string;
  signal: 'UP' | 'DOWN' | 'NEUTRAL';
  description: string;
  strength: number; // 0-100
}

export interface TechnicalIndicators {
  // Momentum
  rsi: IndicatorValue;
  stochastic: {
    k: number;
    d: number;
    signal: 'UP' | 'DOWN' | 'NEUTRAL';
    strength: number;
  };
  momentum: IndicatorValue;
  roc: IndicatorValue; // Rate of Change

  // Trend
  macd: {
    value: number;
    signal: 'UP' | 'DOWN' | 'NEUTRAL';
    description: string;
    strength: number;
  };
  adx: IndicatorValue;
  sma20: number;
  sma50: number;
  sma200: number;
  trendSignal: {
    signal: 'UP' | 'DOWN' | 'NEUTRAL';
    description: string;
    strength: number;
  };

  // Volatility
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    width: number; // Percent width
    signal: 'UP' | 'DOWN' | 'NEUTRAL';
    strength: number;
  };

  // Volume
  volumeTrend: IndicatorValue;
}

export interface AggregationResult {
  upCount: number;
  downCount: number;
  neutralCount: number;
  upScore: number;
  downScore: number;
  alignment: number;
  marketRegime: 'TRENDING' | 'RANGING' | 'VOLATILE';
}

export interface AIAnalysisResult {
  verdict: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number;
  timeHorizon: string; // e.g. "Intraday"
  predictionDuration: string; // e.g. "Next 4 hours"
  summary: string;
  keyFactors: string[];
  riskWarnings: string[];
  entryZone?: string;
  targetZone?: string;
  stopLoss?: string;
  thoughtProcess?: string;
}

export interface MarketSummary {
  currentPrice: number;
  volume24h: number;
  priceChange24h: number;
  periodChangePercent: number;
  openPrice: number; // Used to reconstruct change calc
}

export interface HistoryItem {
  id: string;
  userId: string;
  pair: CryptoPair;
  timeframe: string;
  timestamp: number;
  result: AIAnalysisResult;
  // New fields for full restoration
  indicators?: TechnicalIndicators;
  aggregation?: AggregationResult;
  marketSummary?: MarketSummary;
}

export type FeedItemType = 
  | 'user-selection'
  | 'step-data'
  | 'step-technical'
  | 'step-aggregation'
  | 'step-ai'
  | 'step-verdict'
  | 'system-message';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  data?: any;
  status: 'loading' | 'complete' | 'error';
  timestamp: number;
}

export interface LogEntry {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ai';
  message: string;
  timestamp: number;
}

export const AnalysisStage = {
  IDLE: 'IDLE',
  AI_THINKING: 'AI_THINKING',
  COMPLETE: 'COMPLETE'
} as const;

export type AnalysisStage = typeof AnalysisStage[keyof typeof AnalysisStage];

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  credits: number;
  isPro: boolean;
  joinedAt: number;
}