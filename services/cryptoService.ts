import { OHLCData } from '../types';
import { TIMEFRAMES, CRYPTOCOMPARE_API_BASE, CRYPTOCOMPARE_API_KEY } from '../constants';

export const fetchOHLCData = async (
  baseSymbol: string,
  quoteSymbol: string,
  timeframeValue: string
): Promise<OHLCData[]> => {
  const tf = TIMEFRAMES.find(t => t.value === timeframeValue);
  if (!tf) throw new Error('Invalid timeframe');

  const endpoint = `${CRYPTOCOMPARE_API_BASE}/${tf.apiValue}`;
  const url = `${endpoint}?fsym=${baseSymbol}&tsym=${quoteSymbol}&limit=${tf.limit}&aggregate=${tf.aggregate}`;

  try {
    const response = await fetch(url, {
      headers: {
        'authorization': `Apikey ${CRYPTOCOMPARE_API_KEY}`
      }
    });

    const json = await response.json();

    if (json.Response === 'Error') {
      throw new Error(json.Message);
    }

    const data = json.Data.Data;

    // Map to our Interface
    return data.map((d: any) => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volumeto: d.volumeto // Volume in quote currency
    }));

  } catch (error) {
    console.error("Failed to fetch market data:", error);
    throw error;
  }
};

export const fetchCryptoNews = async (symbol: string): Promise<any[]> => {
  try {
    const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${symbol}`;
    const response = await fetch(url, {
      headers: {
        'authorization': `Apikey ${CRYPTOCOMPARE_API_KEY}`
      }
    });

    const json = await response.json();
    if (json.Response === 'Error') {
      throw new Error(json.Message);
    }

    return json.Data || [];
  } catch (error) {
    console.error("Failed to fetch crypto news:", error);
    return []; // Return empty array on failure so it doesn't break the whole flow
  }
};
