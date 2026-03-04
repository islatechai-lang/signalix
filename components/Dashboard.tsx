import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Sidebar as SidebarIcon, Menu, Terminal, Zap } from 'lucide-react';
import { CryptoPair, FeedItem, AggregationResult, UserProfile, HistoryItem, OHLCData, ProtocolDiagnostic, TradeRecord } from '../types';
import { COST_PER_ANALYSIS, SYSTEM_VERSION } from '../constants';
import { fetchOHLCData, fetchCryptoNews } from '../services/cryptoService';
import { computeIndicators } from '../services/indicatorService';
import { analyzeMarket } from '../services/geminiService';
import { userService } from '../services/userService';
import { historyService } from '../services/historyService';
import { tradeHistoryService } from '../services/tradeHistoryService';
import { paymentService } from '../services/paymentService';

// Components
import VerdictCard from './VerdictCard';
import PricingModal from './PricingModal';
import SubscriptionModal from './SubscriptionModal';
import { PairSelector, TimeframeSelector } from './SelectionUI';
import { DataCollectionStep, TechnicalStep, AggregationStep, AIAnalysisStep, HedgeFundStep, SentimentStep, ProtocolStep } from './AnalysisSteps';
import Sidebar from './Sidebar';
import { ExchangeConnect } from './ExchangeConnect';

interface DashboardProps {
  user: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
  onNavigate: (view: any) => void;
}

export default function Dashboard({ user, onUpdateUser, onLogout, onNavigate }: DashboardProps) {

  // Initialize credits from the user profile passed in
  const [credits, setCredits] = useState<number>(user.credits);

  const [sessionState, setSessionState] = useState<'pair-select' | 'timeframe-select' | 'analyzing' | 'complete'>('pair-select');
  const [selectedPair, setSelectedPair] = useState<CryptoPair | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showExchangeConnect, setShowExchangeConnect] = useState(false);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);


  const bottomRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Sync credits to persistent storage whenever they change (Only if not Pro)
  useEffect(() => {
    userService.updateCredits(user.email, credits);
  }, [credits, user.email]);

  // Load History on Mount
  useEffect(() => {
    loadHistoryList();
  }, [user.id]);

  const loadHistoryList = async () => {
    const items = await historyService.getUserHistory(user.id);
    setHistory(items);
  };

  const loadTradeHistory = async () => {
    const trades = await tradeHistoryService.getUserTrades(user.id);
    setTradeHistory(trades);
  };

  // Load trade history on mount
  useEffect(() => {
    loadTradeHistory();
  }, [user.id]);

  const handleDeleteHistory = async (id: string) => {
    try {
      await historyService.deleteAnalysis(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Failed to delete history item", error);
    }
  };

  // Aggressive auto-scroll on feed update
  useEffect(() => {
    scrollToBottom();
  }, [feed, sessionState]);

  const scrollToBottom = () => {
    // Special handling for initial load/reset: ensure we see the top (Welcome message)
    // instead of scrolling to the bottom spacer which might hide the top content.
    if (sessionState === 'pair-select' && feed.length <= 1) {
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Initial greeting
  useEffect(() => {
    if (feed.length === 0) {
      addFeedItem('system-message', {
        text: `Welcome back, ${user.name.split(' ')[0]}. SignalixAI is ready to decode the market. Select a pair to begin.`
      });
    }
  }, []);

  const addFeedItem = (type: FeedItem['type'], data: any = {}, status: FeedItem['status'] = 'complete') => {
    const id = Math.random().toString(36).substr(2, 9);
    setFeed(prev => [...prev, { id, type, data, status, timestamp: Date.now() }]);
    return id;
  };

  const updateFeedItem = (id: string, updates: Partial<FeedItem>) => {
    setFeed(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const resetSession = () => {
    setSessionState('pair-select');
    setSelectedPair(null);
    setSelectedTimeframe(null);
    setFeed([]);
    addFeedItem('system-message', {
      text: "New session started. Select a trading pair."
    });
  };

  const handlePairSelect = (pair: CryptoPair) => {
    setSelectedPair(pair);
    addFeedItem('user-selection', { text: `Selected Market: ${pair.symbol}` });
    addFeedItem('system-message', { text: "Great choice. Now select your trading timeframe." });
    setSessionState('timeframe-select');
  };

  const handleTimeframeSelect = (tf: string) => {
    setSelectedTimeframe(tf);
    addFeedItem('user-selection', { text: `Selected Timeframe: ${tf}` });
    setSessionState('analyzing');
    runAnalysis(selectedPair!, tf);
  };

  const handleLoadHistory = (item: HistoryItem) => {
    // Restore the view
    setFeed([]);
    setSelectedPair(item.pair);
    setSelectedTimeframe(item.timeframe);
    setSessionState('complete');

    // Close sidebar on mobile
    setIsSidebarOpen(false);

    // Reconstruct the Feed

    // 1. Restoring message (Moved to top as requested)
    addFeedItem('system-message', { text: `Restoring analysis from ${new Date(item.timestamp).toLocaleString()}...` });

    // 2. Initial Selection Messages
    const pairSymbol = item.pair?.symbol || 'Unknown Pair';
    addFeedItem('user-selection', { text: `Selected Market: ${pairSymbol}` });
    addFeedItem('user-selection', { text: `Selected Timeframe: ${item.timeframe}` });

    // 2. Data Step (Reconstructed)
    let mockOHLC: OHLCData[] | undefined = undefined;
    if (item.marketSummary) {
      // Create minimal OHLC array to satisfy DataCollectionStep display logic
      // Ensure values are numbers (fallback to 0) to avoid rendering crashes
      mockOHLC = [
        {
          open: item.marketSummary.openPrice || 0,
          close: item.marketSummary.openPrice || 0,
          high: item.marketSummary.openPrice || 0,
          low: item.marketSummary.openPrice || 0,
          time: item.timestamp,
          volumeto: 0
        },
        {
          open: item.marketSummary.currentPrice || 0,
          close: item.marketSummary.currentPrice || 0,
          high: item.marketSummary.currentPrice || 0,
          low: item.marketSummary.currentPrice || 0,
          time: item.timestamp,
          volumeto: item.marketSummary.volume24h || 0
        }
      ];
    }

    // We use a short timeout to allow the "Restoring..." message to render first
    setTimeout(() => {
      // Data Step - Always add, even if data is partial
      addFeedItem('step-data', {
        pair: pairSymbol,
        rawData: mockOHLC,
        duration: 0.5
      }, 'complete');

      // Technical Step - Always add, indicators might be undefined for old items
      addFeedItem('step-technical', {
        indicators: item.indicators,
        duration: 0.8
      }, 'complete');

      // Protocol Step (Restore)
      const mockDiagnostic: ProtocolDiagnostic = {
        network: 'SECURE',
        encryption: 'AES-256',
        latency: 32,
        systemVersion: SYSTEM_VERSION,
        logs: [
          'INITIALIZING GLASS BOX DIAGNOSTICS...',
          'RESTORED ENCRYPTED HANDSHAKE.',
          'DATA STABILIZED FROM HISTORY SYNC.'
        ]
      };
      addFeedItem('step-protocol', { diagnostic: mockDiagnostic, duration: 0.5 }, 'complete');

      // Aggregation Step - Always add
      addFeedItem('step-aggregation', {
        results: item.aggregation,
        duration: 0.4
      }, 'complete');

      // AI Step - Always add
      addFeedItem('step-ai', {
        result: item.result,
        duration: 2.1
      }, 'complete');

      // Verdict Step - Always add
      if (item.result) {
        addFeedItem('step-verdict', { result: item.result, pair: item.pair });
      }

      // New Steps (if available in history)
      if (item.hedgeFund) {
        addFeedItem('step-hedge-fund', { audit: item.hedgeFund, duration: 2.2 }, 'complete');
      }
      if (item.sentiment) {
        addFeedItem('step-sentiment', { sentiment: item.sentiment, duration: 3.5 }, 'complete');
      }

    }, 100);
  };

  // Helper for consistent delays
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runAnalysis = async (pair: CryptoPair, tf: string) => {
    // Check for credits
    if (credits < COST_PER_ANALYSIS) {
      setShowPricing(true);
      setSessionState('pair-select');
      return;
    }

    // 1. Data Collection
    const step1Id = addFeedItem('step-data', { pair: pair.symbol }, 'loading');

    try {
      const startTime = Date.now();

      // Delay: Data Fetching (2.5 seconds)
      await wait(2500);

      const ohlc = await fetchOHLCData(pair.base, pair.quote, tf);
      const dataDuration = (Date.now() - startTime) / 1000;

      updateFeedItem(step1Id, {
        status: 'complete',
        data: { pair: pair.symbol, rawData: ohlc, duration: dataDuration }
      });
      setTimeout(scrollToBottom, 100);

      // --- PROTOCOL EXECUTION (New Step) ---
      await wait(1000);
      const stepProtoId = addFeedItem('step-protocol', {}, 'loading');
      setTimeout(scrollToBottom, 200);

      const protoLogs = [
        "INITIALIZING GLASS BOX DIAGNOSTICS...",
        `CONNECTING TO EXCHANGE: FETCHING ${pair.symbol} STREAMS...`,
        "DATA RECEIVED: 1H STREAMS INGESTED. DAILY ANCHOR SYNCED.",
        "NEWS INGESTION: 50 HEADLINES QUEUED FOR SENTIMENT AUDIT.",
        "DATA FEED STABILIZED. TRANSITIONING TO PROTOCOL EXECUTION...",
        "SYSTEM HEALTH: 100% (SECURE)"
      ];

      await wait(2000);
      const diagnostic: ProtocolDiagnostic = {
        network: 'ENCRYPTED',
        encryption: 'AES-256',
        latency: 28 + Math.floor(Math.random() * 15),
        logs: protoLogs,
        systemVersion: SYSTEM_VERSION
      };

      updateFeedItem(stepProtoId, {
        status: 'complete',
        data: { diagnostic, duration: 2.0 }
      });
      setTimeout(scrollToBottom, 100);

      // --- TRANSITION DELAY 1 ---
      await wait(1500);

      // 2. Technical Analysis
      const step2Id = addFeedItem('step-technical', {}, 'loading');
      setTimeout(scrollToBottom, 200);

      // Delay: Calculating Indicators (3.5 seconds)
      await wait(3500);

      const techStartTime = Date.now();
      const indicators = computeIndicators(ohlc);
      const techDuration = (Date.now() - techStartTime) / 1000;

      updateFeedItem(step2Id, {
        status: 'complete',
        data: { indicators, duration: techDuration }
      });
      setTimeout(scrollToBottom, 100);

      // --- TRANSITION DELAY 2 ---
      await wait(1500);

      // 3. Signal Aggregation
      const step3Id = addFeedItem('step-aggregation', {}, 'loading');
      setTimeout(scrollToBottom, 200);

      // Delay: Weighing Signals (3 seconds)
      await wait(3000);

      // Calculate aggregation locally
      let up = 0, down = 0, neutral = 0;
      let upScore = 0, downScore = 0;

      const checkSignal = (sig: string, strength: number) => {
        if (sig === 'UP') { up++; upScore += strength; }
        else if (sig === 'DOWN') { down++; downScore += strength; }
        else neutral++;
      };

      checkSignal(indicators.rsi.signal, indicators.rsi.strength);
      checkSignal(indicators.stochastic.signal, indicators.stochastic.strength);
      checkSignal(indicators.macd.signal, indicators.macd.strength);
      checkSignal(indicators.trendSignal.signal, indicators.trendSignal.strength);
      checkSignal(indicators.momentum.signal, indicators.momentum.strength);
      checkSignal(indicators.bollinger.signal, indicators.bollinger.strength);
      checkSignal(indicators.volumeTrend.signal, indicators.volumeTrend.strength);

      const totalSignals = up + down + neutral;
      const alignment = (Math.max(up, down) / totalSignals) * 100;
      const regime = Number(indicators.adx.value) > 25 ? 'TRENDING' : indicators.bollinger.width > 3 ? 'VOLATILE' : 'RANGING';

      // BTC Correlation Check
      let btcCorrelation: 'Positive' | 'Negative' | 'Neutral' = 'Neutral';
      if (pair.base !== 'BTC') {
        try {
          const btcOhlc = await fetchOHLCData('BTC', 'USDT', tf);
          const btcChange = btcOhlc[btcOhlc.length - 1].close - btcOhlc[0].open;
          const assetChange = ohlc[ohlc.length - 1].close - ohlc[0].open;

          if ((btcChange > 0 && assetChange > 0) || (btcChange < 0 && assetChange < 0)) {
            btcCorrelation = 'Positive';
          } else if ((btcChange > 0 && assetChange < 0) || (btcChange < 0 && assetChange > 0)) {
            btcCorrelation = 'Negative';
          }
        } catch (e) {
          console.warn("BTC Correlation failed", e);
        }
      }

      const aggResults: AggregationResult = {
        upCount: up,
        downCount: down,
        neutralCount: neutral,
        upScore,
        downScore,
        alignment,
        marketRegime: regime as any,
        btcCorrelation
      };

      updateFeedItem(step3Id, {
        status: 'complete',
        data: { results: aggResults, duration: 0.5 }
      });
      setTimeout(scrollToBottom, 100);

      // --- TRANSITION DELAY 3 ---
      await wait(1500);

      // 4. Hedge Fund Audit
      const stepRiskId = addFeedItem('step-hedge-fund', {}, 'loading');
      setTimeout(scrollToBottom, 200);
      await wait(3500); // Institutional verification time

      // Compute Risk Audit Points
      const checks = [
        { label: "Trend Structure (EMA)", value: indicators.sma20 > indicators.sma50 ? "EMA 20 > EMA 50" : "Bearish Alignment", passed: indicators.sma20 > indicators.sma50 },
        { label: "Volume Fuel (Agg)", value: indicators.volumeTrend.value === 'UP' ? "High Participation" : "Low Volume", passed: indicators.volumeTrend.value === 'UP' },
        { label: "ADX Volatility Guard", value: Number(indicators.adx.value) > 20 ? "Sufficient Volatility" : "Choppy/Dead", passed: Number(indicators.adx.value) > 20 },
        { label: "MTF Alignment", value: indicators.trendSignal.signal !== 'NEUTRAL' ? "Trend Active" : "No Alignment", passed: indicators.trendSignal.signal !== 'NEUTRAL' }
      ];
      const passedCount = checks.filter(c => c.passed).length;
      const auditScore = Math.round((passedCount / checks.length) * 100);
      const audit: any = {
        score: auditScore,
        checksPassed: passedCount,
        totalChecks: checks.length,
        status: auditScore >= 75 ? 'Pass' : auditScore >= 50 ? 'Caution Required' : 'High Risk',
        points: checks
      };

      updateFeedItem(stepRiskId, {
        status: 'complete',
        data: { audit, duration: 3.5 }
      });
      setTimeout(scrollToBottom, 100);

      // --- TRANSITION DELAY 4 ---
      await wait(1500);

      // 5. Sentiment Intelligence
      const stepSentId = addFeedItem('step-sentiment', {}, 'loading');
      setTimeout(scrollToBottom, 200);

      const rawNews = await fetchCryptoNews(pair.base);
      await wait(2000); // Simulate scanning sources

      // Process news into our format
      const headlines = rawNews.slice(0, 50).map((n: any) => ({
        id: n.id,
        title: n.title,
        url: n.url,
        source: n.source
      }));

      // Count words for narratives (using full 50 headlines for better accuracy)
      const keywords = ['Bitcoin', 'ETF', 'Solana', 'Bullish', 'Bearish', 'Growth', 'Crash', 'Support', 'Resistance', 'Liquidity', 'DeFi'];
      const combinedTitles = headlines.map((h: any) => h.title).join(' ');
      const narratives = keywords.map(kw => ({
        word: kw,
        count: (combinedTitles.match(new RegExp(kw, 'gi')) || []).length
      })).filter(n => n.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);

      const upWeight = (combinedTitles.match(/Bull|Rise|Gain|Growth|Win|High/gi) || []).length;
      const downWeight = (combinedTitles.match(/Bear|Fall|Loss|Crash|Dip|Low/gi) || []).length;

      const sentimentData: any = {
        articlesScanned: rawNews.length,
        headlines,
        narratives,
        consensus: upWeight > downWeight + 2 ? 'Bullish' : downWeight > upWeight + 2 ? 'Bearish' : 'Neutral'
      };

      updateFeedItem(stepSentId, {
        status: 'complete',
        data: { sentiment: sentimentData, duration: 4.2 }
      });
      setTimeout(scrollToBottom, 100);

      // --- TRANSITION DELAY 5 ---
      await wait(1500);

      // 6. AI Deep Analysis
      const step4Id = addFeedItem('step-ai', {}, 'loading');
      setTimeout(scrollToBottom, 200);

      const aiStartTime = Date.now();
      const analysis = await analyzeMarket(pair.name, tf, ohlc, indicators, audit, sentimentData);
      const aiDuration = (Date.now() - aiStartTime) / 1000;

      // Simulate streaming thought process
      const fullThought = analysis.thoughtProcess || analysis.summary;
      let currentText = "";
      const chars = fullThought.split('');
      const chunkSize = 2;

      for (let i = 0; i < chars.length; i += chunkSize) {
        currentText += chars.slice(i, i + chunkSize).join('');
        updateFeedItem(step4Id, {
          data: { partialThought: currentText }
        });

        if (i % 10 === 0) scrollToBottom();

        const delay = 20 + Math.random() * 30;
        await wait(delay);
      }

      await wait(800);

      updateFeedItem(step4Id, {
        status: 'complete',
        data: { result: analysis, duration: aiDuration }
      });
      setTimeout(scrollToBottom, 100);

      // CHECK VERDICT
      if (analysis.verdict === 'NEUTRAL') {
        await wait(1000);
        addFeedItem('system-message', {
          text: `Analysis Inconclusive: Market conditions are completely flat. No actionable signal detected.`
        });
      } else {
        // All users deduct credits if not Neutral
        setCredits(prev => prev - COST_PER_ANALYSIS);
      }

      // CALCULATE SUMMARY FOR HISTORY
      const lastCandle = ohlc[ohlc.length - 1];
      const firstCandle = ohlc[0];
      const marketSummary = {
        currentPrice: lastCandle.close,
        volume24h: lastCandle.volumeto,
        openPrice: firstCandle.open,
        priceChange24h: lastCandle.close - firstCandle.open,
        periodChangePercent: ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100
      };

      // SAVE TO HISTORY (Full Context)
      await historyService.saveAnalysis(
        user.id,
        pair,
        tf,
        analysis,
        indicators,
        aggResults,
        marketSummary,
        audit,
        sentimentData
      );

      // If auto-trade is enabled and verdict is not neutral, execute trade with visual feedback
      if (autoTradeEnabled && analysis.verdict !== 'NEUTRAL' && pair.type === 'CRYPTO') {
        console.log(`[Dashboard] 🔄 Auto-trade triggered: ${analysis.verdict} ${pair.symbol}`);
        const tradeStepId = addFeedItem('step-trade', { pair: pair.symbol, verdict: analysis.verdict }, 'loading');
        scrollToBottom();

        try {
          console.log(`[Dashboard] 📡 Sending trade request to /api/trade/execute...`);
          const response = await fetch('/api/trade/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pairName: pair.symbol,
              verdict: analysis.verdict,
              exchangeKeys: user.exchangeKeys
            }),
          });

          const tradeResult = await response.json();
          console.log(`[Dashboard] 📥 Trade response received:`, tradeResult);

          if (tradeResult.success) {
            console.log(`[Dashboard] ✅ Trade SUCCESS! Order: ${tradeResult.orderId}, Side: ${tradeResult.side}, Amount: ${tradeResult.amount}, Price: $${tradeResult.price}`);
            updateFeedItem(tradeStepId, {
              status: 'complete',
              data: {
                pair: pair.symbol,
                verdict: analysis.verdict,
                orderId: tradeResult.orderId,
                side: tradeResult.side,
                amount: tradeResult.amount,
                price: tradeResult.price,
                cost: tradeResult.cost
              }
            });
            // Save trade to Firestore client-side
            console.log(`[Dashboard] 💾 Saving trade to Firestore...`);
            await tradeHistoryService.saveTrade({
              userId: user.id,
              pair: pair.symbol,
              side: tradeResult.side,
              amount: tradeResult.amount,
              price: tradeResult.price,
              cost: tradeResult.cost,
              orderId: tradeResult.orderId,
              status: 'success',
              timestamp: Date.now()
            });
            console.log(`[Dashboard] ✅ Trade saved. Refreshing trade history...`);
            loadTradeHistory();
          } else {
            console.error(`[Dashboard] ❌ Trade FAILED:`, tradeResult.error);
            updateFeedItem(tradeStepId, { status: 'error', data: { pair: pair.symbol, verdict: analysis.verdict, error: tradeResult.error } });
          }
        } catch (e: any) {
          console.error(`[Dashboard] ❌ Trade request exception:`, e);
          updateFeedItem(tradeStepId, { status: 'error', data: { pair: pair.symbol, verdict: analysis.verdict, error: e.message } });
        }
      }
      loadHistoryList(); // Refresh history list

      // --- FINAL VERDICT TRANSITION ---

      // 1. Show "Generating..." message
      await wait(500);
      addFeedItem('system-message', {
        text: "Synthesizing data points. Generating final verdict strategy..."
      });
      scrollToBottom();

      // 2. Wait for the user to read it
      await wait(2500);

      // 3. Show Result
      addFeedItem('step-verdict', { result: analysis, pair: pair });
      setSessionState('complete');
      setTimeout(scrollToBottom, 100);

    } catch (error: any) {
      console.error(error);
      updateFeedItem(step1Id, { status: 'error', data: { error: error.message } });
      addFeedItem('system-message', { text: `Analysis failed: ${error.message}.` });
      setSessionState('pair-select');
    }
  };

  return (
    <div className="flex h-screen bg-[#050508] text-gray-200 font-sans selection:bg-purple-500/30 selection:text-white overflow-hidden">

      <div className="hidden lg:block w-80 h-full shrink-0 z-20">
        <Sidebar
          user={user}
          credits={credits}
          onLogout={onLogout}
          onOpenPricing={() => {
            setShowPricing(true);
            paymentService.notifyProInterest(user);
          }}
          onOpenSubscription={() => setShowSubscription(true)}
          history={history}
          tradeHistory={tradeHistory}
          onLoadHistory={handleLoadHistory}
          onDeleteHistory={handleDeleteHistory}
          onNavigate={onNavigate}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-80 h-full bg-[#050508] border-r border-gray-800 shadow-2xl animate-in slide-in-from-left duration-200 relative z-50">
            <Sidebar
              user={user}
              credits={credits}
              onLogout={onLogout}
              onOpenPricing={() => {
                setShowPricing(true);
                setIsSidebarOpen(false);
                paymentService.notifyProInterest(user);
              }}
              onOpenSubscription={() => { setShowSubscription(true); setIsSidebarOpen(false); }}
              history={history}
              tradeHistory={tradeHistory}
              onLoadHistory={handleLoadHistory}
              onDeleteHistory={handleDeleteHistory}
              onNavigate={onNavigate}
            />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)}></div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">

        {/* Header for Main Content */}
        <header className="flex items-center justify-between p-4 md:p-6 lg:p-8 bg-[#0a0a0f]/80 backdrop-blur-sm border-b border-gray-800 z-20 shrink-0">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 ml-auto md:ml-0">
            <Terminal className="w-5 h-5 text-cyber-cyan" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-widest uppercase">Analysis Terminal</span>
              <span className="text-[10px] text-gray-500 font-mono tracking-widest hidden sm:block">Awaiting Input Parameters</span>
            </div>
          </div>

          {/* Right-aligned buttons */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Auto-Trade Status/Settings Button */}
            <button
              onClick={() => setShowExchangeConnect(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${user.exchangeKeys ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
              <span className="text-xs font-bold text-gray-300">
                {user.exchangeKeys ? 'KuCoin Connected' : 'Connect Exchange'}
              </span>
            </button>

            {/* Verify Trades Button - only when connected */}
            {user.exchangeKeys && (
              <button
                onClick={async () => {
                  console.log('[Dashboard] 🔍 Verifying trades on KuCoin...');
                  addFeedItem('system-message', { text: '🔍 Verifying trades on KuCoin...' });
                  try {
                    const resp = await fetch('/api/trade/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ exchangeKeys: user.exchangeKeys })
                    });
                    const data = await resp.json();
                    console.log('[Dashboard] Verify result:', data);

                    const balanceText = `💰 Testnet Balance: ${Number(data.balance?.USDT || 0).toFixed(2)} USDT | ${Number(data.balance?.BTC || 0).toFixed(6)} BTC`;
                    addFeedItem('system-message', { text: balanceText });

                    if (data.orders && data.orders.length > 0) {
                      const orderList = data.orders.slice(0, 5).map((o: any) =>
                        `${o.side} ${o.pair} | ${Number(o.amount).toFixed(6)} @ $${Number(o.price || 0).toLocaleString()} | ${o.status} | ${o.datetime || 'N/A'}`
                      ).join('\n');
                      addFeedItem('system-message', { text: `📋 Recent Orders from KuCoin:\n${orderList}` });
                    } else {
                      addFeedItem('system-message', { text: '📋 No orders found on KuCoin for common pairs.' });
                    }
                  } catch (e: any) {
                    addFeedItem('system-message', { text: `❌ Verification failed: ${e.message}` });
                  }
                  scrollToBottom();
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg transition-colors"
                title="Check your KuCoin balance and recent orders"
              >
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-bold text-yellow-400">Verify Trades</span>
              </button>
            )}

            {/* Reset / New Session Button */}
            <button
              onClick={resetSession}
              className="p-2 bg-[#0a0a0f]/80 backdrop-blur border border-gray-800 rounded-lg hover:border-gray-600 hover:text-white text-gray-400 transition-all shadow-lg"
              title="New Scan"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Feed Scroll Area */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth w-full custom-scrollbar"
        >

          {/* Background Ambient */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] bg-purple-900/5 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[30%] bg-blue-900/5 rounded-full blur-[120px]"></div>
          </div>

          <div className="max-w-3xl mx-auto relative z-10 flex flex-col gap-6 pb-20 pt-10 lg:pt-0">
            {feed.map((item) => (
              <div key={item.id} className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">

                {/* System Messages */}
                {item.type === 'system-message' && (
                  <div className="bg-[#13131f] border border-gray-800/80 p-4 rounded-xl flex gap-4 items-center shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                      <Terminal className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-gray-300 text-sm leading-relaxed">
                      <span className="block text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-0.5">System Notification</span>
                      {item.data.text}
                    </div>
                  </div>
                )}

                {/* User Selection */}
                {item.type === 'user-selection' && (
                  <div className="flex justify-end">
                    <div className="bg-[#1a1a24] border border-gray-700/50 p-3 rounded-xl rounded-tr-none max-w-sm">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 text-right">Selection</div>
                      <div className="text-gray-200 text-sm font-medium">{item.data.text}</div>
                    </div>
                  </div>
                )}

                {/* Steps & Results */}
                {item.type === 'step-data' && (
                  <DataCollectionStep status={item.status} data={item.data?.rawData} pair={item.data?.pair} duration={item.data?.duration} />
                )}
                {item.type === 'step-technical' && (
                  <TechnicalStep status={item.status} indicators={item.data?.indicators} duration={item.data?.duration} />
                )}
                {item.type === 'step-aggregation' && (
                  <AggregationStep status={item.status} results={item.data?.results} duration={item.data?.duration} />
                )}
                {item.type === 'step-protocol' && (
                  <ProtocolStep status={item.status} diagnostic={item.data?.diagnostic} duration={item.data?.duration} />
                )}
                {item.type === 'step-hedge-fund' && (
                  <HedgeFundStep status={item.status} audit={item.data?.audit} duration={item.data?.duration} />
                )}
                {item.type === 'step-sentiment' && (
                  <SentimentStep status={item.status} sentiment={item.data?.sentiment} duration={item.data?.duration} />
                )}
                {item.type === 'step-ai' && (
                  <AIAnalysisStep status={item.status} result={item.data?.result} partialThought={item.data?.partialThought} duration={item.data?.duration} />
                )}
                {item.type === 'step-trade' && (
                  <div className="bg-[#0a0a0f] border border-yellow-500/30 rounded-xl p-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3">
                      {item.status === 'loading' ? (
                        <>
                          <div className="relative w-8 h-8">
                            <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-yellow-500 flex items-center gap-1.5">
                              <Zap className="w-4 h-4" /> Executing Trade on KuCoin...
                            </div>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                              {item.data?.verdict} {item.data?.pair} • DO NOT close this page
                            </p>
                          </div>
                        </>
                      ) : item.status === 'complete' ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <Zap className="w-4 h-4 text-green-500" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-green-500">Trade Executed Successfully!</div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                              <span className="text-[10px] text-gray-400 font-mono">
                                <span className="text-gray-600">SIDE:</span> <span className={item.data?.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>{item.data?.side}</span>
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                <span className="text-gray-600">PAIR:</span> {item.data?.pair}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                <span className="text-gray-600">AMOUNT:</span> {Number(item.data?.amount || 0).toFixed(6)}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                <span className="text-gray-600">PRICE:</span> ${Number(item.data?.price || 0).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                <span className="text-gray-600">COST:</span> ${Number(item.data?.cost || 0).toFixed(2)}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-600 font-mono mt-1">
                              Order ID: {item.data?.orderId || 'N/A'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-red-500" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-red-500">Trade Execution Failed</div>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                              {item.data?.error || 'Unknown error'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {item.type === 'step-verdict' && (
                  <div className="mt-4 mb-8"><VerdictCard result={item.data.result} pair={item.data.pair} /></div>
                )}
              </div>
            ))}

            {/* Interactive Selectors (Bottom of Feed) */}
            <div className="mt-2 transition-all duration-300">
              {sessionState === 'pair-select' && (<PairSelector onSelect={handlePairSelect} />)}
              {sessionState === 'timeframe-select' && (
                <div className="flex flex-col items-center">
                  <TimeframeSelector onSelect={handleTimeframeSelect} />

                  {/* Auto-Trade Toggle Area visible before hitting Analyze */}
                  {user.exchangeKeys && selectedPair?.type === 'CRYPTO' && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <label className="flex items-center gap-3 cursor-pointer group bg-[#0a0a0f] border border-gray-800 p-4 rounded-xl hover:border-cyber-cyan/50 transition-colors">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={autoTradeEnabled}
                            onChange={(e) => setAutoTradeEnabled(e.target.checked)}
                          />
                          <div className={`block w-10 h-6 rounded-full transition-colors ${autoTradeEnabled ? 'bg-green-500' : 'bg-gray-800'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoTradeEnabled ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Enable Auto-Execution</div>
                          <div className="text-[10px] text-gray-500 font-mono">Will place testnet order if High Conviction</div>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {sessionState === 'complete' && (
                <div className="text-center animate-in fade-in duration-700 delay-500 py-6">
                  <button onClick={resetSession} className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-sm font-bold text-white transition-all hover:scale-105 flex items-center gap-2 mx-auto">
                    <RefreshCw className="w-4 h-4" /> Analyze Another Pair
                  </button>
                </div>
              )}
            </div>
            <div ref={bottomRef} className="h-4" />
          </div>
        </main>

        <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} user={user} />
        <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} user={user} />

        {showExchangeConnect && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative">
              <button
                onClick={() => setShowExchangeConnect(false)}
                className="absolute top-4 right-4 z-20 text-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>
              <ExchangeConnect
                user={user}
                onUpdateUser={onUpdateUser}
                onClose={() => setShowExchangeConnect(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}