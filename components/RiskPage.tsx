import React, { useEffect } from 'react';
import { ArrowLeft, AlertTriangle, ShieldAlert, TrendingDown, Zap, Scale, FileWarning } from 'lucide-react';

interface RiskPageProps {
  onBack: () => void;
}

const RiskPage: React.FC<RiskPageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cyber-black text-gray-300 font-sans selection:bg-cyber-cyan selection:text-black relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 cyber-grid opacity-20"></div>
         <div className="absolute top-[-20%] right-[20%] w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-24">
        
        {/* Navigation */}
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-10 font-mono text-xs uppercase tracking-widest group">
           <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Terminal
        </button>

        {/* Header */}
        <div className="border-b border-gray-800 pb-10 mb-12">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-red-900/10 rounded-xl flex items-center justify-center border border-red-900/30 shadow-[0_0_30px_rgba(220,38,38,0.1)]">
                 <ShieldAlert className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2">RISK DISCLOSURE</h1>
                <p className="text-gray-500 font-mono text-sm uppercase tracking-wide">Document Version 2.4 • Last Updated: October 2025</p>
              </div>
           </div>
           
           <div className="p-6 bg-red-950/20 border border-red-900/30 rounded-lg text-red-200/80 text-sm leading-relaxed font-medium">
              <strong className="text-red-400 block mb-2 uppercase tracking-wide text-xs">Critical Warning</strong>
              Trading cryptocurrencies, forex, and other financial instruments involves a high degree of risk and may not be suitable for all investors. You could lose some or all of your initial investment. Do not invest money that you cannot afford to lose.
           </div>
        </div>

        {/* Detailed Content */}
        <div className="space-y-16 text-sm leading-relaxed text-gray-400 font-light">
           
           {/* Section 1 */}
           <section>
              <div className="flex items-center gap-3 mb-4">
                 <Scale className="w-5 h-5 text-cyber-cyan" />
                 <h2 className="text-xl font-bold text-white tracking-tight">1. General Trading Risks</h2>
              </div>
              <p className="mb-4">
                 The valuation of cryptocurrencies and digital assets may fluctuate, and as a result, clients may lose all of their original investment. The highly volatile nature of the cryptocurency market means that prices can move rapidly in either direction, often without warning or clear fundamental reasons.
              </p>
              <p>
                 Leveraged trading (if applicable on your chosen exchange) amplifies both gains and losses. A small price movement against your position can result in the liquidation of your entire balance. SignalixAI is not responsible for margin calls or liquidations incurred on third-party platforms.
              </p>
           </section>

           {/* Section 2 */}
           <section>
              <div className="flex items-center gap-3 mb-4">
                 <Zap className="w-5 h-5 text-yellow-400" />
                 <h2 className="text-xl font-bold text-white tracking-tight">2. AI & Algorithmic Limitations</h2>
              </div>
              <div className="pl-4 border-l-2 border-yellow-500/20 space-y-4">
                 <p>
                    <strong>Probabilistic Nature:</strong> SignalixAI utilizes Large Language Models (LLMs) and statistical indicators to generate market analysis. These outputs are probabilistic, meaning they represent a likelihood based on historical data, not a certainty of future performance. An "89% Confidence Score" reflects the model's internal consistency, not a guarantee of profit.
                 </p>
                 <p>
                    <strong>Hallucinations & Errors:</strong> AI models can occasionally produce "hallucinations"—plausible-sounding but incorrect information. While we implement strict grounding layers, the user acknowledges that the software may misinterpret technical patterns or market context.
                 </p>
                 <p>
                    <strong>Black Swan Events:</strong> Our algorithms are trained on historical data. They cannot predict unprecedented market events ("Black Swans"), regulatory bans, exchange hacks, or geopolitical crises that may render technical analysis instantly invalid.
                 </p>
              </div>
           </section>

           {/* Section 3 */}
           <section>
              <div className="flex items-center gap-3 mb-4">
                 <FileWarning className="w-5 h-5 text-purple-400" />
                 <h2 className="text-xl font-bold text-white tracking-tight">3. No Financial Advice</h2>
              </div>
              <p className="mb-4">
                 SignalixAI is strictly a software-as-a-service (SaaS) data analysis tool. We are <strong>not</strong> a financial advisor, broker-dealer, or investment fund.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-400 marker:text-cyber-cyan">
                 <li>No content on this platform constitutes a recommendation to buy, sell, or hold any security or asset.</li>
                 <li>All "Verdicts", "Signals", and "Analysis" are for educational and informational purposes only.</li>
                 <li>You are solely responsible for your own trading decisions and the configuration of your own trades.</li>
              </ul>
           </section>

           {/* Section 4 */}
           <section>
              <div className="flex items-center gap-3 mb-4">
                 <AlertTriangle className="w-5 h-5 text-orange-400" />
                 <h2 className="text-xl font-bold text-white tracking-tight">4. Technical & System Risks</h2>
              </div>
              <p>
                 <strong>Latency:</strong> Real-time data feeds may experience latency due to internet connectivity issues, API rate limits, or third-party data provider outages (e.g., CryptoCompare, Gemini). A signal generated based on price data from 5 seconds ago may no longer be valid in a high-frequency trading environment.
              </p>
              <p className="mt-4">
                 <strong>Availability:</strong> We do not guarantee 100% uptime. Maintenance, updates, or DDoS attacks could temporarily render the platform inaccessible. SignalixAI accepts no liability for missed trading opportunities during downtime.
              </p>
           </section>

           <div className="pt-12 border-t border-gray-800">
              <p className="text-xs text-gray-500 font-mono uppercase tracking-widest text-center">
                 By using the SignalixAI platform, you acknowledge that you have read, understood, and accepted these risks.
              </p>
           </div>

        </div>
      </div>
    </div>
  );
};

export default RiskPage;