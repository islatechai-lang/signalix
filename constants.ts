import { CryptoPair } from './types';

// Read from environment variable (Vite prefix required) or fallback to the provided key
export const CRYPTOCOMPARE_API_KEY = (import.meta as any).env?.VITE_CRYPTOCOMPARE_API_KEY || '8a639309466b93ee7cbfafaae16279eb22cffe30d1c68a25d0047d2a77d43ab2';
export const CRYPTOCOMPARE_API_BASE = 'https://min-api.cryptocompare.com/data/v2';

export const SUPPORTED_PAIRS: CryptoPair[] = [
  // --- MAJORS ---
  { symbol: 'BTC/USDT', base: 'BTC', quote: 'USDT', name: 'Bitcoin', type: 'CRYPTO' },
  { symbol: 'ETH/USDT', base: 'ETH', quote: 'USDT', name: 'Ethereum', type: 'CRYPTO' },
  { symbol: 'BNB/USDT', base: 'BNB', quote: 'USDT', name: 'Binance Coin', type: 'CRYPTO' },
  { symbol: 'SOL/USDT', base: 'SOL', quote: 'USDT', name: 'Solana', type: 'CRYPTO' },
  { symbol: 'XRP/USDT', base: 'XRP', quote: 'USDT', name: 'Ripple', type: 'CRYPTO' },
  { symbol: 'ADA/USDT', base: 'ADA', quote: 'USDT', name: 'Cardano', type: 'CRYPTO' },
  { symbol: 'AVAX/USDT', base: 'AVAX', quote: 'USDT', name: 'Avalanche', type: 'CRYPTO' },
  { symbol: 'DOT/USDT', base: 'DOT', quote: 'USDT', name: 'Polkadot', type: 'CRYPTO' },
  { symbol: 'TRX/USDT', base: 'TRX', quote: 'USDT', name: 'Tron', type: 'CRYPTO' },
  { symbol: 'LINK/USDT', base: 'LINK', quote: 'USDT', name: 'Chainlink', type: 'CRYPTO' },

  // --- AI & DEPIN ---
  { symbol: 'TAO/USDT', base: 'TAO', quote: 'USDT', name: 'Bittensor', type: 'CRYPTO' },
  { symbol: 'FET/USDT', base: 'FET', quote: 'USDT', name: 'Fetch.ai', type: 'CRYPTO' },
  { symbol: 'RNDR/USDT', base: 'RNDR', quote: 'USDT', name: 'Render', type: 'CRYPTO' },
  { symbol: 'WLD/USDT', base: 'WLD', quote: 'USDT', name: 'Worldcoin', type: 'CRYPTO' },
  { symbol: 'GRT/USDT', base: 'GRT', quote: 'USDT', name: 'The Graph', type: 'CRYPTO' },
  
  // --- LAYER 1 & 2 ---
  { symbol: 'SUI/USDT', base: 'SUI', quote: 'USDT', name: 'Sui', type: 'CRYPTO' },
  { symbol: 'SEI/USDT', base: 'SEI', quote: 'USDT', name: 'Sei', type: 'CRYPTO' },
  { symbol: 'APT/USDT', base: 'APT', quote: 'USDT', name: 'Aptos', type: 'CRYPTO' },
  { symbol: 'OP/USDT', base: 'OP', quote: 'USDT', name: 'Optimism', type: 'CRYPTO' },
  { symbol: 'ARB/USDT', base: 'ARB', quote: 'USDT', name: 'Arbitrum', type: 'CRYPTO' },
  { symbol: 'MATIC/USDT', base: 'MATIC', quote: 'USDT', name: 'Polygon', type: 'CRYPTO' },
  { symbol: 'NEAR/USDT', base: 'NEAR', quote: 'USDT', name: 'Near Protocol', type: 'CRYPTO' },
  { symbol: 'INJ/USDT', base: 'INJ', quote: 'USDT', name: 'Injective', type: 'CRYPTO' },
  { symbol: 'TIA/USDT', base: 'TIA', quote: 'USDT', name: 'Celestia', type: 'CRYPTO' },
  { symbol: 'ATOM/USDT', base: 'ATOM', quote: 'USDT', name: 'Cosmos', type: 'CRYPTO' },
  { symbol: 'FTM/USDT', base: 'FTM', quote: 'USDT', name: 'Fantom', type: 'CRYPTO' },
  { symbol: 'ALGO/USDT', base: 'ALGO', quote: 'USDT', name: 'Algorand', type: 'CRYPTO' },
  { symbol: 'HBAR/USDT', base: 'HBAR', quote: 'USDT', name: 'Hedera', type: 'CRYPTO' },
  { symbol: 'EGLD/USDT', base: 'EGLD', quote: 'USDT', name: 'MultiversX', type: 'CRYPTO' },
  { symbol: 'ICP/USDT', base: 'ICP', quote: 'USDT', name: 'Internet Computer', type: 'CRYPTO' },
  { symbol: 'STX/USDT', base: 'STX', quote: 'USDT', name: 'Stacks', type: 'CRYPTO' },
  { symbol: 'IMX/USDT', base: 'IMX', quote: 'USDT', name: 'Immutable', type: 'CRYPTO' },

  // --- DEFI & UTILITY ---
  { symbol: 'UNI/USDT', base: 'UNI', quote: 'USDT', name: 'Uniswap', type: 'CRYPTO' },
  { symbol: 'AAVE/USDT', base: 'AAVE', quote: 'USDT', name: 'Aave', type: 'CRYPTO' },
  { symbol: 'MKR/USDT', base: 'MKR', quote: 'USDT', name: 'Maker', type: 'CRYPTO' },
  { symbol: 'SNX/USDT', base: 'SNX', quote: 'USDT', name: 'Synthetix', type: 'CRYPTO' },
  { symbol: 'LDO/USDT', base: 'LDO', quote: 'USDT', name: 'Lido DAO', type: 'CRYPTO' },
  { symbol: 'RUNE/USDT', base: 'RUNE', quote: 'USDT', name: 'THORChain', type: 'CRYPTO' },
  { symbol: 'JUP/USDT', base: 'JUP', quote: 'USDT', name: 'Jupiter', type: 'CRYPTO' },
  { symbol: 'PYTH/USDT', base: 'PYTH', quote: 'USDT', name: 'Pyth Network', type: 'CRYPTO' },
  { symbol: 'ONDO/USDT', base: 'ONDO', quote: 'USDT', name: 'Ondo', type: 'CRYPTO' },
  { symbol: 'ENA/USDT', base: 'ENA', quote: 'USDT', name: 'Ethena', type: 'CRYPTO' },
  { symbol: 'PENDLE/USDT', base: 'PENDLE', quote: 'USDT', name: 'Pendle', type: 'CRYPTO' },

  // --- MEME & SPECULATIVE ---
  { symbol: 'DOGE/USDT', base: 'DOGE', quote: 'USDT', name: 'Dogecoin', type: 'CRYPTO' },
  { symbol: 'SHIB/USDT', base: 'SHIB', quote: 'USDT', name: 'Shiba Inu', type: 'CRYPTO' },
  { symbol: 'PEPE/USDT', base: 'PEPE', quote: 'USDT', name: 'Pepe', type: 'CRYPTO' },
  { symbol: 'WIF/USDT', base: 'WIF', quote: 'USDT', name: 'dogwifhat', type: 'CRYPTO' },
  { symbol: 'BONK/USDT', base: 'BONK', quote: 'USDT', name: 'Bonk', type: 'CRYPTO' },
  { symbol: 'FLOKI/USDT', base: 'FLOKI', quote: 'USDT', name: 'Floki', type: 'CRYPTO' },
  { symbol: 'MEME/USDT', base: 'MEME', quote: 'USDT', name: 'Memecoin', type: 'CRYPTO' },
  { symbol: 'BOME/USDT', base: 'BOME', quote: 'USDT', name: 'Book of Meme', type: 'CRYPTO' },
  { symbol: 'ORDI/USDT', base: 'ORDI', quote: 'USDT', name: 'Ordinals', type: 'CRYPTO' },

  // --- LEGACY & PRIVACY ---
  { symbol: 'LTC/USDT', base: 'LTC', quote: 'USDT', name: 'Litecoin', type: 'CRYPTO' },
  { symbol: 'BCH/USDT', base: 'BCH', quote: 'USDT', name: 'Bitcoin Cash', type: 'CRYPTO' },
  { symbol: 'XLM/USDT', base: 'XLM', quote: 'USDT', name: 'Stellar', type: 'CRYPTO' },
  { symbol: 'ETC/USDT', base: 'ETC', quote: 'USDT', name: 'Ethereum Classic', type: 'CRYPTO' },
  { symbol: 'EOS/USDT', base: 'EOS', quote: 'USDT', name: 'EOS', type: 'CRYPTO' },
  { symbol: 'DASH/USDT', base: 'DASH', quote: 'USDT', name: 'Dash', type: 'CRYPTO' },

  // --- FOREX ---
  { symbol: 'EUR/USD', base: 'EUR', quote: 'USD', name: 'Euro', type: 'FOREX' },
  { symbol: 'GBP/USD', base: 'GBP', quote: 'USD', name: 'British Pound', type: 'FOREX' },
  { symbol: 'AUD/USD', base: 'AUD', quote: 'USD', name: 'Aus Dollar', type: 'FOREX' },
  { symbol: 'JPY/USD', base: 'JPY', quote: 'USD', name: 'Japanese Yen', type: 'FOREX' },
  { symbol: 'USD/CAD', base: 'USD', quote: 'CAD', name: 'Canadian Dollar', type: 'FOREX' },
  { symbol: 'USD/CHF', base: 'USD', quote: 'CHF', name: 'Swiss Franc', type: 'FOREX' },
];

export interface TimeframeConfig {
  label: string;
  value: string;
  limit: number;
  apiValue: 'histominute' | 'histohour' | 'histoday';
  aggregate: number;
  category: 'SCALP' | 'DAY' | 'SWING' | 'POSITION';
}

export const TIMEFRAMES: TimeframeConfig[] = [
  // Scalping (1m - 5m)
  { label: '30 Sec', value: '30s', limit: 60, apiValue: 'histominute', aggregate: 1, category: 'SCALP' }, // Simulating 30s with 1m data in UI
  { label: '1 Min', value: '1m', limit: 200, apiValue: 'histominute', aggregate: 1, category: 'SCALP' },
  { label: '3 Min', value: '3m', limit: 200, apiValue: 'histominute', aggregate: 3, category: 'SCALP' },
  { label: '5 Min', value: '5m', limit: 200, apiValue: 'histominute', aggregate: 5, category: 'SCALP' },
  
  // Day Trading (15m - 1h)
  { label: '15 Min', value: '15m', limit: 200, apiValue: 'histominute', aggregate: 15, category: 'DAY' },
  { label: '30 Min', value: '30m', limit: 200, apiValue: 'histominute', aggregate: 30, category: 'DAY' },
  { label: '1 Hour', value: '1h', limit: 200, apiValue: 'histohour', aggregate: 1, category: 'DAY' },
  
  // Swing Trading (2h - 1d)
  { label: '2 Hours', value: '2h', limit: 200, apiValue: 'histohour', aggregate: 2, category: 'SWING' },
  { label: '4 Hours', value: '4h', limit: 200, apiValue: 'histohour', aggregate: 4, category: 'SWING' },
  { label: '8 Hours', value: '8h', limit: 200, apiValue: 'histohour', aggregate: 8, category: 'SWING' },
  { label: '12 Hours', value: '12h', limit: 200, apiValue: 'histohour', aggregate: 12, category: 'SWING' },
  { label: '1 Day', value: '1d', limit: 200, apiValue: 'histoday', aggregate: 1, category: 'SWING' },
  
  // Position Trading (3d - 1w)
  { label: '3 Days', value: '3d', limit: 200, apiValue: 'histoday', aggregate: 3, category: 'POSITION' },
  { label: '1 Week', value: '1w', limit: 200, apiValue: 'histoday', aggregate: 7, category: 'POSITION' },
];

export const INITIAL_CREDITS = 3;
export const COST_PER_ANALYSIS = 1;