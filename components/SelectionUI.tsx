import React, { useState } from 'react';
import { SUPPORTED_PAIRS, TIMEFRAMES } from '../constants';
import { CryptoPair } from '../types';
import { Search, Clock, TrendingUp, BarChart2, Globe } from 'lucide-react';

export const PairSelector: React.FC<{ onSelect: (pair: CryptoPair) => void }> = ({ onSelect }) => {
  const [search, setSearch] = useState('');
  
  const filteredPairs = SUPPORTED_PAIRS.filter(p => 
    p.symbol.toLowerCase().includes(search.toLowerCase()) || 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const crypto = filteredPairs.filter(p => p.type === 'CRYPTO');
  const forex = filteredPairs.filter(p => p.type === 'FOREX');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-[#0b0b10] p-6 rounded-xl border border-gray-800 w-full shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-mono uppercase text-gray-500 tracking-widest flex items-center gap-2">
           <span className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">1</span>
           Select Asset
        </h3>
        <div className="relative">
           <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-600" />
           <input 
             type="text" 
             placeholder="Search Pair..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="bg-black/40 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white focus:border-cyber-cyan outline-none w-48 transition-colors"
           />
        </div>
      </div>

      <div className="mt-2">
        {crypto.length > 0 && (
          <div className="mb-6">
            <h4 className="text-[10px] font-bold text-cyber-cyan uppercase mb-3 flex items-center gap-2 sticky top-0 bg-[#0b0b10] py-2 z-10 border-b border-gray-800/50">
               <TrendingUp className="w-3 h-3" /> Crypto Markets
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {crypto.map(pair => (
                <button
                  key={pair.symbol}
                  onClick={() => onSelect(pair)}
                  className="px-2 py-2.5 rounded bg-black/40 border border-gray-800 hover:border-cyber-cyan hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-all text-xs font-bold text-gray-300 flex items-center justify-center group"
                >
                  <span className="tracking-tight">{pair.base}</span>
                  <span className="text-gray-600 group-hover:text-cyber-cyan/60 transition-colors">/</span>
                  <span className="text-[10px] text-gray-500 group-hover:text-cyber-cyan/80 transition-colors font-mono">{pair.quote}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {forex.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold text-cyber-magenta uppercase mb-3 flex items-center gap-2 sticky top-0 bg-[#0b0b10] py-2 z-10 border-b border-gray-800/50">
               <Globe className="w-3 h-3" /> Forex Markets
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
               {forex.map(pair => (
                <button
                  key={pair.symbol}
                  onClick={() => onSelect(pair)}
                  className="px-2 py-2.5 rounded bg-black/40 border border-gray-800 hover:border-cyber-magenta hover:text-cyber-magenta hover:bg-cyber-magenta/10 transition-all text-xs font-bold text-gray-300 flex items-center justify-center group"
                >
                  <span className="tracking-tight">{pair.base}</span>
                  <span className="text-gray-600 group-hover:text-cyber-magenta/60 transition-colors">/</span>
                  <span className="text-[10px] text-gray-500 group-hover:text-cyber-magenta/80 transition-colors font-mono">{pair.quote}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {crypto.length === 0 && forex.length === 0 && (
           <div className="text-center py-12 text-gray-500 text-xs font-mono">No assets found matching "{search}"</div>
        )}
      </div>
    </div>
  );
};

export const TimeframeSelector: React.FC<{ onSelect: (tf: string) => void }> = ({ onSelect }) => {
  // Group timeframes
  const scalping = TIMEFRAMES.filter(t => t.category === 'SCALP');
  const day = TIMEFRAMES.filter(t => t.category === 'DAY');
  const swing = TIMEFRAMES.filter(t => t.category === 'SWING');
  const position = TIMEFRAMES.filter(t => t.category === 'POSITION');

  const renderGroup = (title: string, items: typeof TIMEFRAMES, colorClass: string) => (
    <div className="mb-4 last:mb-0">
       <h4 className={`text-[10px] font-bold uppercase mb-2 pl-1 ${colorClass}`}>{title}</h4>
       <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {items.map(tf => (
            <button
              key={tf.value}
              onClick={() => onSelect(tf.value)}
              className="flex flex-col items-center justify-center p-3 rounded bg-black/40 border border-gray-800 hover:border-white hover:bg-white/5 transition-all group"
            >
              <span className="text-sm font-bold text-gray-300 group-hover:text-white">{tf.value}</span>
              <span className="text-[9px] text-gray-600 hidden sm:block">{tf.label.replace(/\d+\s/, '')}</span>
            </button>
          ))}
       </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-[#0b0b10] p-6 rounded-xl border border-gray-800 w-full shadow-lg">
      <h3 className="text-sm font-mono uppercase text-gray-500 mb-6 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-[10px]">2</span>
        Select Strategy Timeframe
      </h3>
      
      <div className="space-y-6">
         {renderGroup("Scalping (High Frequency)", scalping, "text-cyber-cyan")}
         {renderGroup("Day Trading (Intraday)", day, "text-blue-400")}
         {renderGroup("Swing Trading (Multi-Day)", swing, "text-purple-400")}
         {renderGroup("Position Trading (Long Term)", position, "text-orange-400")}
      </div>
    </div>
  );
};