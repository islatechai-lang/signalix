import React, { useEffect, useState } from 'react';
import { Activity, ArrowRight, Terminal, Cpu, Shield, Zap, Globe, Lock, BarChart3, TrendingUp, Network, Clock } from 'lucide-react';
import { ViewState } from '../App';
import logo from '../logo.png';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onNavigate: (view: ViewState) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onNavigate }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black text-gray-300 font-sans selection:bg-cyber-cyan selection:text-black overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 cyber-grid opacity-30"></div>
         <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-cyber-cyan/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${scrollY > 20 ? 'bg-cyber-black/90 backdrop-blur-md border-cyber-border' : 'bg-transparent border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
             <img src={logo} alt="SignalixAI" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg tracking-wider text-white font-mono">SIGNALIX<span className="text-cyber-cyan">_AI</span></span>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-8 text-xs font-mono text-gray-500 tracking-wider">
               <button onClick={() => scrollToSection('features')} className="hover:text-cyber-cyan cursor-pointer transition-colors uppercase">Features</button>
               <button onClick={() => scrollToSection('how-it-works')} className="hover:text-cyber-cyan cursor-pointer transition-colors uppercase">How it works</button>
            </div>
            <div className="flex items-center gap-6">
               <button onClick={onLogin} className="text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors uppercase">
                 [ Login ]
               </button>
               <button 
                 onClick={onGetStarted}
                 className="px-5 py-2.5 bg-cyber-cyan hover:bg-cyan-400 text-black font-bold text-xs font-mono uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] clip-path-polygon"
               >
                 Get Started
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-16 md:pt-48 md:pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-cyber-cyan/20 rounded-full bg-cyber-cyan/5 mb-10 backdrop-blur-sm">
             <div className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse"></div>
             <span className="text-[10px] font-mono text-cyber-cyan tracking-[0.2em] uppercase">System Online v2.8.0</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] text-white mb-8">
            SEE BEYOND CHARTS.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-white to-cyber-magenta text-glow">TRADE SMARTER.</span>
          </h1>
          
          {/* Subtext */}
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-light mb-12">
            Decrypt market noise with real-time neural analysis. We process the data, synthesize the indicators, and deliver the verdict.
          </p>
          
          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24">
            <button 
              onClick={onGetStarted}
              className="px-10 py-4 bg-white text-black font-bold text-sm font-mono uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
            >
              Start Terminal <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Terminal Visual (Centered & Floating) */}
          <div className="relative max-w-4xl mx-auto">
             <div className="absolute -inset-1 bg-gradient-to-b from-cyber-cyan/20 to-purple-600/20 rounded-xl blur-2xl opacity-40"></div>
             <div className="relative bg-[#0a0a0f] border border-gray-800 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                {/* Terminal Header */}
                <div className="h-9 bg-[#15151a] border-b border-gray-800 flex items-center justify-between px-4">
                   <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                   </div>
                   <span className="text-[10px] font-mono text-gray-500 opacity-60">signalix_core --instance=main</span>
                </div>
                {/* Terminal Body */}
                <div className="p-8 text-left font-mono text-xs md:text-sm h-[300px] md:h-[400px] overflow-hidden relative bg-[#050508]/80">
                   <div className="scanlines"></div>
                   <div className="space-y-3">
                      <div className="flex gap-3 text-gray-400">
                         <span className="text-green-500 font-bold">➜</span>
                         <span>initializing neural_engine...</span>
                      </div>
                      <div className="text-gray-500 pl-6">[OK] Modules loaded</div>
                      <div className="text-gray-500 pl-6">[OK] Exchange stream connected (wss://api.signalix.io)</div>
                      
                      <div className="pt-4 flex gap-3 text-gray-400">
                         <span className="text-green-500 font-bold">➜</span>
                         <span className="text-white">analyze --pair=BTC-USD --timeframe=1h</span>
                      </div>

                      <div className="pl-6 pt-2 space-y-2">
                         <div className="text-cyber-cyan/80">
                            <span className="text-purple-500">[PROCESSING]</span> RSI(14) = 32.5 (Oversold)
                         </div>
                         <div className="text-cyber-cyan/80">
                            <span className="text-purple-500">[PROCESSING]</span> MACD = Bullish Divergence
                         </div>
                         <div className="text-cyber-cyan/80">
                            <span className="text-purple-500">[PROCESSING]</span> Volume = +12.4% vs Avg
                         </div>
                      </div>
                      
                      <div className="mt-6 p-4 bg-white/5 border-l-2 border-cyber-cyan rounded-r">
                         <div className="text-cyber-cyan font-bold mb-2 tracking-wide text-sm">VERDICT: ACCUMULATE</div>
                         <div className="text-gray-400 leading-relaxed opacity-80 text-xs md:text-sm">
                            Market structure indicates a strong reversal zone. High probability of upward continuation. Risk/Reward ratio optimal.
                         </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                         <span className="text-green-500 font-bold">➜</span>
                         <span className="text-gray-500">awaiting_input<span className="text-cyber-cyan animate-blink">_</span></span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </section>

      {/* Static Market Pulse (No movement) */}
      <div className="border-y border-gray-900 bg-[#08080c] py-6 relative z-20">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            
            <div className="flex flex-col items-center md:items-start border-r border-gray-900/50 last:border-0">
               <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-1">Market Regime</span>
               <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" /> 
                  <span>VOLATILE <span className="text-gray-500 font-normal ml-1 text-xs hidden lg:inline">(Accumulation)</span></span>
               </span>
            </div>

            <div className="flex flex-col items-center md:items-start border-r border-gray-900/50 last:border-0">
               <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-1">Neural Accuracy</span>
               <span className="text-sm font-bold text-cyber-cyan flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> 94.2% <span className="text-gray-500 font-normal ml-1 text-xs hidden lg:inline">(Last 100)</span>
               </span>
            </div>

            <div className="flex flex-col items-center md:items-start border-r border-gray-900/50 last:border-0">
               <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-1">Live Signals</span>
               <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" /> 23 Active Setups
               </span>
            </div>

            <div className="flex flex-col items-center md:items-start">
               <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-1">System Latency</span>
               <span className="text-sm font-bold text-gray-300 flex items-center gap-2">
                  <Network className="w-4 h-4 text-green-500" /> 12ms <span className="text-gray-500 font-normal ml-1 text-xs hidden lg:inline">(Real-time)</span>
               </span>
            </div>

         </div>
      </div>

      {/* System Architecture Section */}
      <section id="how-it-works" className="py-32 px-6 relative">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
               <h2 className="text-xs font-mono text-cyber-cyan tracking-[0.2em] uppercase mb-4">Architecture</h2>
               <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">FROM CHAOS TO CLARITY</h3>
               <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
                  A transparent pipeline that turns raw market data into actionable trading intelligence.
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
               {/* Connecting Line (Desktop) */}
               <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-gray-800 via-cyber-cyan/30 to-gray-800 border-t border-dashed border-gray-800 z-0"></div>

               <ArchitectureCard 
                  step="01"
                  title="Ingestion"
                  desc="We aggregate real-time OHLCV data from top-tier exchanges to ensure zero-latency inputs."
                  icon={<Globe className="w-6 h-6 text-gray-300" />}
               />
               <ArchitectureCard 
                  step="02"
                  title="Processing"
                  desc="Our engine computes 30+ technical indicators and detects chart patterns instantly."
                  icon={<Cpu className="w-6 h-6 text-cyber-cyan" />}
                  active
               />
               <ArchitectureCard 
                  step="03"
                  title="Synthesis"
                  desc="Generative AI interprets the technical data to formulate a strategic verdict."
                  icon={<Terminal className="w-6 h-6 text-gray-300" />}
               />
            </div>
         </div>
      </section>

      {/* Features / Modules Section */}
      <section id="features" className="py-32 px-6 bg-[#08080c] border-t border-gray-900/50">
        <div className="max-w-7xl mx-auto">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div>
                 <h2 className="text-xs font-mono text-cyber-magenta tracking-[0.2em] uppercase mb-4">System Modules</h2>
                 <h3 className="text-3xl md:text-5xl font-bold text-white mb-8">INTELLIGENCE <br/> UNLOCKED.</h3>
                 <p className="text-gray-400 mb-10 leading-relaxed text-lg font-light">
                    Stop guessing. SignalixAI replaces intuition with raw computational power. 
                    Our neural engine doesn't just give you a signal; it explains the 
                    <span className="text-white font-medium"> why</span> behind every move.
                 </p>
                 <ul className="space-y-5">
                    <FeatureListItem text="Transparent reasoning logs" />
                    <FeatureListItem text="Institutional-grade risk management" />
                    <FeatureListItem text="Multi-timeframe analysis (Scalp to Swing)" />
                    <FeatureListItem text="Pro-active trend reversal detection" />
                 </ul>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <ModuleCard 
                    icon={<Terminal className="w-6 h-6 text-cyber-cyan" />}
                    title="Command Center"
                    desc="A unified terminal interface for all your market analysis needs."
                 />
                 <ModuleCard 
                    icon={<Zap className="w-6 h-6 text-yellow-400" />}
                    title="Instant Execution"
                    desc="Zero latency signal generation based on live price action."
                 />
                 <ModuleCard 
                    icon={<Shield className="w-6 h-6 text-green-400" />}
                    title="Risk Protocol"
                    desc="Dynamic stop-loss and take-profit zones calculated automatically."
                 />
                 <ModuleCard 
                    icon={<Lock className="w-6 h-6 text-purple-400" />}
                    title="Secure Core"
                    desc="Enterprise-grade encryption and privacy-first architecture."
                 />
              </div>
           </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-24 px-6 relative border-t border-gray-900 bg-[#050508] overflow-hidden">
         <div className="absolute inset-0 cyber-grid opacity-20"></div>
         
         <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter">
               READY TO <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-blue-600">UPGRADE?</span>
            </h2>
            <p className="text-gray-500 font-mono mb-12 text-sm tracking-widest">
               // JOIN THE ELITE TRADERS USING SIGNALIX_AI
            </p>
            <button 
               onClick={onGetStarted}
               className="px-12 py-5 bg-white text-black font-bold font-mono text-sm uppercase tracking-widest hover:bg-cyber-cyan transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(0,243,255,0.3)]"
            >
               Create Free Account
            </button>

            <div className="mt-24 border-t border-gray-900 pt-8">
               
               {/* Links Row */}
               <div className="flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-wider w-full mb-8">
                  <div className="mb-4 md:mb-0">© 2026 SIGNALIX_AI SYSTEMS</div>
                  <div className="flex gap-8">
                     <span onClick={() => onNavigate('terms')} className="hover:text-cyber-cyan cursor-pointer transition-colors">Terms</span>
                     <span onClick={() => onNavigate('privacy')} className="hover:text-cyber-cyan cursor-pointer transition-colors">Privacy</span>
                     <span onClick={() => onNavigate('risk')} className="hover:text-red-500 cursor-pointer transition-colors">Risk</span>
                  </div>
               </div>
               
               {/* Centered Disclaimer */}
               <div className="max-w-2xl mx-auto text-center">
                  <p className="text-[10px] text-gray-700 leading-relaxed font-sans opacity-70">
                     Trading involves substantial risk. SignalixAI is an algorithmic tool, not a financial advisor. 
                     Past performance does not guarantee future results.
                  </p>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

const ArchitectureCard = ({ step, title, desc, icon, active }: { step: string, title: string, desc: string, icon: React.ReactNode, active?: boolean }) => (
   <div className={`relative z-10 bg-[#0a0a0f] p-8 rounded-2xl border ${active ? 'border-cyber-cyan shadow-[0_0_30px_rgba(0,243,255,0.1)]' : 'border-gray-800'} transition-all hover:border-gray-600 group text-center md:text-left`}>
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-6 gap-4">
         <div className={`p-4 rounded-xl bg-white/5 ${active ? 'text-cyber-cyan' : 'text-gray-400'}`}>
            {icon}
         </div>
         <span className="text-5xl font-black text-gray-800 group-hover:text-gray-700 transition-colors">{step}</span>
      </div>
      <h4 className={`text-xl font-bold mb-3 ${active ? 'text-white' : 'text-gray-300'}`}>{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed font-light">{desc}</p>
   </div>
);

const FeatureListItem = ({ text }: { text: string }) => (
   <li className="flex items-center gap-4 text-gray-400 text-sm">
      <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full shrink-0 shadow-[0_0_10px_rgba(0,243,255,0.5)]"></div>
      {text}
   </li>
);

const ModuleCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
   <div className="p-8 bg-white/5 border border-white/5 hover:border-white/10 transition-colors hover:bg-white/10 cursor-default rounded-xl">
      <div className="mb-5">{icon}</div>
      <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">{title}</h4>
      <p className="text-xs text-gray-500 font-mono leading-relaxed">{desc}</p>
   </div>
);

export default LandingPage;