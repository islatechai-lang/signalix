import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Sidebar as SidebarIcon, Menu, Terminal } from 'lucide-react';
import { CryptoPair, FeedItem, AggregationResult, UserProfile, HistoryItem, OHLCData } from '../types';
import { COST_PER_ANALYSIS } from '../constants';
import { fetchOHLCData } from '../services/cryptoService';
import { computeIndicators } from '../services/indicatorService';
import { analyzeMarket } from '../services/geminiService';
import { userService } from '../services/userService';
import { historyService } from '../services/historyService';

// Components
import VerdictCard from './VerdictCard';
import PricingModal from './PricingModal';
import SubscriptionModal from './SubscriptionModal'; 
import { PairSelector, TimeframeSelector } from './SelectionUI';
import { DataCollectionStep, TechnicalStep, AggregationStep, AIAnalysisStep } from './AnalysisSteps';
import Sidebar from './Sidebar';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  // Initialize credits from the user profile passed in
  const [credits, setCredits] = useState<number>(user.credits);
  
  const [sessionState, setSessionState] = useState<'pair-select' | 'timeframe-select' | 'analyzing' | 'complete'>('pair-select');
  const [selectedPair, setSelectedPair] = useState<CryptoPair | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Sync credits to persistent storage whenever they change (Only if not Pro)
  useEffect(() => {
    if (!user.isPro) {
      userService.updateCredits(user.email, credits);
    }
  }, [credits, user.email, user.isPro]);

  // Load History on Mount
  useEffect(() => {
    loadHistoryList();
  }, [user.id]);

  const loadHistoryList = async () => {
    const items = await historyService.getUserHistory(user.id);
    setHistory(items);
  };

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

     }, 100);
  };

  // Helper for consistent delays
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runAnalysis = async (pair: CryptoPair, tf: string) => {
    // Pro users bypass credit check
    if (!user.isPro && credits < COST_PER_ANALYSIS) {
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

      const aggResults: AggregationResult = {
        upCount: up,
        downCount: down,
        neutralCount: neutral,
        upScore,
        downScore,
        alignment,
        marketRegime: regime as any
      };

      updateFeedItem(step3Id, {
        status: 'complete',
        data: { results: aggResults, duration: 0.5 }
      });
      setTimeout(scrollToBottom, 100);

      // --- TRANSITION DELAY 3 ---
      await wait(1500);

      // 4. AI Deep Analysis
      const step4Id = addFeedItem('step-ai', {}, 'loading');
      setTimeout(scrollToBottom, 200);
      
      const aiStartTime = Date.now();
      const analysis = await analyzeMarket(pair.name, tf, ohlc, indicators);
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
        setSessionState('complete');
        setTimeout(scrollToBottom, 100);
      } else {
        // Only deduct credits if NOT Pro
        if (!user.isPro) {
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
           marketSummary
        );
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
      }

    } catch (error: any) {
      console.error(error);
      updateFeedItem(step1Id, { status: 'error', data: { error: error.message } });
      addFeedItem('system-message', { text: `Analysis failed: ${error.message}.` });
      setSessionState('pair-select');
    }
  };

  return (
    <div className="flex h-screen bg-[#050508] text-gray-200 font-sans selection:bg-purple-500/30 selection:text-white overflow-hidden">
      
      {/* Sidebar (Desktop) - 25% width or 320px */}
      <div className="hidden lg:block w-80 h-full shrink-0 z-20">
         <Sidebar 
           user={user}
           credits={credits}
           onLogout={onLogout}
           onOpenPricing={() => setShowPricing(true)}
           onOpenSubscription={() => setShowSubscription(true)}
           history={history}
           onLoadHistory={handleLoadHistory}
           onDeleteHistory={handleDeleteHistory}
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
               onOpenPricing={() => { setShowPricing(true); setIsSidebarOpen(false); }}
               onOpenSubscription={() => { setShowSubscription(true); setIsSidebarOpen(false); }}
               history={history}
               onLoadHistory={handleLoadHistory}
               onDeleteHistory={handleDeleteHistory}
             />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)}></div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
        
        {/* Mobile Menu Button (Floating) */}
        <div className="lg:hidden absolute top-4 left-4 z-30">
           <button 
             onClick={() => setIsSidebarOpen(true)}
             className="p-2 bg-black/60 backdrop-blur border border-gray-700 rounded-lg text-white hover:bg-gray-800 transition-colors"
           >
              <Menu className="w-6 h-6" />
           </button>
        </div>

        {/* Reset / New Session Button (Desktop: Top Right Absolute) */}
        <div className="absolute top-4 right-4 z-30 hidden lg:block">
           <button 
             onClick={resetSession}
             className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0f]/80 backdrop-blur border border-gray-800 rounded-lg hover:border-gray-600 hover:text-white text-gray-400 text-xs font-mono uppercase tracking-wide transition-all"
           >
             <RefreshCw className="w-3 h-3" /> New Scan
           </button>
        </div>

        {/* Mobile Reset Button */}
        <div className="absolute top-4 right-4 z-30 lg:hidden">
            <button 
             onClick={resetSession}
             className="p-2 bg-black/60 backdrop-blur border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
           >
             <RefreshCw className="w-5 h-5" />
           </button>
        </div>

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
                {item.type === 'step-ai' && (
                  <AIAnalysisStep status={item.status} result={item.data?.result} partialThought={item.data?.partialThought} duration={item.data?.duration} />
                )}
                {item.type === 'step-verdict' && (
                  <div className="mt-4 mb-8"><VerdictCard result={item.data.result} pair={item.data.pair} /></div>
                )}
              </div>
            ))}

            {/* Interactive Selectors (Bottom of Feed) */}
            <div className="mt-2 transition-all duration-300">
               {sessionState === 'pair-select' && (<PairSelector onSelect={handlePairSelect} />)}
               {sessionState === 'timeframe-select' && (<TimeframeSelector onSelect={handleTimeframeSelect} />)}
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
      </div>
    </div>
  );
}