import { OHLCData, TechnicalIndicators, IndicatorValue } from '../types';

// Helper: Simple Moving Average
export const calculateSMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
};

// Helper: Exponential Moving Average
export const calculateEMA = (prices: number[], period: number): number => {
  if (prices.length < period) return calculateSMA(prices, period);
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
};

// --- MOMENTUM ---

export const calculateRSI = (prices: number[], period: number = 14): IndicatorValue => {
  if (prices.length < period + 1) return { value: 50, signal: 'NEUTRAL', description: 'Insufficient Data', strength: 0 };

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    if (difference >= 0) gains += difference;
    else losses -= difference;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  let rsi = 50;

  if (avgLoss !== 0) {
    const rs = avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
  }

  let signal: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
  let desc = 'Neutral range';
  let strength = 50;

  if (rsi > 70) {
    signal = 'DOWN'; // Reversal risk
    desc = 'Overbought - potential reversal';
    strength = 85;
  } else if (rsi < 30) {
    signal = 'UP'; // Reversal opportunity
    desc = 'Oversold - potential bounce';
    strength = 85;
  } else if (rsi > 55) {
    signal = 'UP';
    desc = 'Bullish momentum';
    strength = 60;
  } else if (rsi < 45) {
    signal = 'DOWN';
    desc = 'Bearish momentum';
    strength = 60;
  }

  return { value: rsi.toFixed(1), signal, description: desc, strength };
};

export const calculateStochastic = (data: OHLCData[], period: number = 14): { k: number, d: number, signal: 'UP' | 'DOWN' | 'NEUTRAL', strength: number } => {
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const closes = data.map(d => d.close);
  
  if (closes.length < period) return { k: 50, d: 50, signal: 'NEUTRAL', strength: 0 };

  const currentClose = closes[closes.length - 1];
  const lowestLow = Math.min(...lows.slice(-period));
  const highestHigh = Math.max(...highs.slice(-period));

  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  // Approximation for D (SMA of K)
  const d = k; // Simplified for single point, ideally needs history of Ks

  let signal: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
  if (k < 20) signal = 'UP';
  else if (k > 80) signal = 'DOWN';
  else if (k > 50) signal = 'UP';
  else signal = 'DOWN';

  return { k, d, signal, strength: Math.abs(k - 50) + 20 };
};

export const calculateROC = (prices: number[], period: number = 9): IndicatorValue => {
  if (prices.length < period) return { value: 0, signal: 'NEUTRAL', description: 'N/A', strength: 0 };
  
  const current = prices[prices.length - 1];
  const previous = prices[prices.length - 1 - period];
  const roc = ((current - previous) / previous) * 100;

  return {
    value: roc.toFixed(2) + '%',
    signal: roc > 0 ? 'UP' : roc < 0 ? 'DOWN' : 'NEUTRAL',
    description: roc > 0 ? 'Positive rate of change' : 'Negative rate of change',
    strength: Math.min(Math.abs(roc) * 20, 100)
  };
};

// --- TREND ---

export const calculateMACD = (prices: number[]) => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = macdLine * 0.9; // Simplified
  const hist = macdLine - signalLine;

  const signal: 'UP' | 'DOWN' | 'NEUTRAL' = hist > 0 ? 'UP' : 'DOWN';
  const strength = Math.min(Math.abs(hist) * 1000, 100);

  return {
    value: macdLine,
    signal,
    description: hist > 0 ? 'Bullish crossover detected' : 'Bearish divergence',
    strength
  };
};

export const calculateADX = (data: OHLCData[], period: number = 14): IndicatorValue => {
  // Simplified ADX/Trend Strength proxy
  // True ADX requires TR, +DM, -DM smoothing. We will use a volatility adjusted slope.
  const closes = data.map(d => d.close);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  
  const trendStrength = Math.abs((sma20 - sma50) / sma50) * 1000; // Proxy for trend strength
  const val = Math.min(trendStrength * 5, 100); // Scale to 0-100ish

  let description = "Weak trend";
  if (val > 25) description = "Strong trend";
  if (val > 50) description = "Very strong trend";

  return {
    value: val.toFixed(1),
    signal: 'NEUTRAL', // ADX is non-directional
    description,
    strength: val
  };
};

// --- VOLUME ---

export const calculateVolumeTrend = (data: OHLCData[]): IndicatorValue => {
  const volumes = data.map(d => d.volumeto);
  const currentVol = volumes[volumes.length - 1];
  const avgVol = calculateSMA(volumes, 20);
  
  const change = ((currentVol - avgVol) / avgVol) * 100;
  const signal = change > 0 ? 'UP' : 'NEUTRAL'; // Volume usually confirms trend
  
  return {
    value: (change > 0 ? '+' : '') + change.toFixed(1) + '%',
    signal,
    description: change > 20 ? 'Strong volume confirmation' : change < -20 ? 'Low volume' : 'Normal volume',
    strength: Math.min(Math.abs(change), 100)
  };
};


// --- MAIN ---

export const computeIndicators = (data: OHLCData[]): TechnicalIndicators => {
  const closePrices = data.map(d => d.close);
  
  // SMAs
  const sma20 = calculateSMA(closePrices, 20);
  const sma50 = calculateSMA(closePrices, 50);
  const sma200 = calculateSMA(closePrices, 200);

  // Bollinger
  const sma20Val = sma20;
  const slice = closePrices.slice(-20);
  const squaredDiffs = slice.map(p => Math.pow(p - sma20Val, 2));
  const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / 20);
  const upper = sma20Val + (2 * stdDev);
  const lower = sma20Val - (2 * stdDev);
  const width = ((upper - lower) / sma20Val) * 100;

  const currentPrice = closePrices[closePrices.length - 1];
  let trendSig: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
  let trendDesc = 'Sideways';
  if (currentPrice > sma50 && sma20 > sma50) {
    trendSig = 'UP';
    trendDesc = 'Price above SMA50 - Bullish';
  } else if (currentPrice < sma50 && sma20 < sma50) {
    trendSig = 'DOWN';
    trendDesc = 'Price below SMA50 - Bearish';
  }

  return {
    rsi: calculateRSI(closePrices),
    stochastic: calculateStochastic(data),
    momentum: {
       value: (currentPrice - closePrices[closePrices.length - 10]).toFixed(2),
       signal: currentPrice > closePrices[closePrices.length - 10] ? 'UP' : 'DOWN',
       description: '10-period Momentum',
       strength: 50
    },
    roc: calculateROC(closePrices),
    
    macd: calculateMACD(closePrices),
    adx: calculateADX(data),
    sma20,
    sma50,
    sma200,
    trendSignal: {
      signal: trendSig,
      description: trendDesc,
      strength: 67
    },

    bollinger: {
      upper,
      middle: sma20Val,
      lower,
      width,
      signal: width < 1 ? 'NEUTRAL' : 'UP', // High width = volatile
      strength: 50
    },

    volumeTrend: calculateVolumeTrend(data)
  };
};
