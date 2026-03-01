import { AIAnalysisResult, OHLCData, TechnicalIndicators, HedgeFundAudit, SentimentAnalysis } from '../types';

export const analyzeMarket = async (
  pairName: string,
  timeframe: string,
  ohlc: OHLCData[],
  indicators: TechnicalIndicators,
  hedgeFund?: HedgeFundAudit,
  sentiment?: SentimentAnalysis
): Promise<AIAnalysisResult> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pairName,
        timeframe,
        ohlc,
        indicators,
        hedgeFund,
        sentiment
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server analysis failed');
    }

    const result = await response.json() as AIAnalysisResult;
    return result;

  } catch (error: any) {
    console.error("[Client] Analysis Error:", error.message);
    throw error;
  }
};