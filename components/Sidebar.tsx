import React, { useState, useRef, useEffect } from 'react';
import { CryptoPair, HistoryItem, UserProfile } from '../types';
import logo from '../logo.png';
import { 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  LogOut, 
  Crown, 
  Zap, 
  CreditCard, 
  UserCircle2, 
  ChevronUp,
  LayoutGrid,
  Trash2
} from 'lucide-react';

interface SidebarProps {
  user: UserProfile;
  credits: number;
  onLogout: () => void;
  onOpenPricing: () => void;
  onOpenSubscription: () => void;
  history: HistoryItem[];
  onLoadHistory: (item: HistoryItem) => void;
  onDeleteHistory: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  credits,
  onLogout,
  onOpenPricing,
  onOpenSubscription,
  history,
  onLoadHistory,
  onDeleteHistory
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050508] border-r border-gray-800 relative overflow-hidden">
      
      {/* 1. Branding Header */}
      <div className="p-6 pb-4 shrink-0 bg-[#050508]/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <img src={logo} alt="SignalixAI" className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]" />
          <h1 className="text-xl font-bold tracking-tighter text-white font-mono">
            SIGNALIX<span className="text-cyber-cyan">_AI</span>
          </h1>
        </div>
        <div className="mt-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest pl-1">
          Terminal v2.4.0
        </div>
      </div>

      {/* 2. History List (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-2 relative z-0">
        <div className="flex items-center gap-2 mb-4 px-2 opacity-50">
           <Clock className="w-3 h-3 text-gray-400" />
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Analysis Logs</span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-lg bg-gray-900/20 mx-2">
            <LayoutGrid className="w-6 h-6 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-mono mb-1">No logs found</p>
            <p className="text-[10px] text-gray-700">Run a scan to generate history</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => onLoadHistory(item)}
                className="w-full group bg-[#0a0a0f] hover:bg-[#15151a] border border-gray-800/50 hover:border-gray-700 rounded-lg p-3 transition-all text-left relative overflow-hidden cursor-pointer"
              >
                {/* Result Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${
                   item.result.verdict === 'UP' ? 'bg-green-500' :
                   item.result.verdict === 'DOWN' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>

                <div className="flex justify-between items-start mb-1.5 pl-2">
                  <div className="flex items-center gap-2">
                     <span className="font-bold text-gray-200 text-sm">{item.pair.base}/{item.pair.quote}</span>
                     <span className="text-[10px] text-gray-500 font-mono bg-gray-900 px-1 rounded">{item.timeframe}</span>
                  </div>
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${
                      item.result.verdict === 'UP' ? 'text-green-400' :
                      item.result.verdict === 'DOWN' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                      {item.result.verdict === 'UP' && <ArrowUpRight className="w-3 h-3" />}
                      {item.result.verdict === 'DOWN' && <ArrowDownRight className="w-3 h-3" />}
                      {item.result.verdict === 'NEUTRAL' && <Minus className="w-3 h-3" />}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pl-2">
                   <span className="text-[10px] text-gray-600 font-mono">{formatTime(item.timestamp)}</span>
                   
                   {/* Delete Button (Visible on Hover) */}
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       if (window.confirm("Delete this analysis log?")) {
                         onDeleteHistory(item.id);
                       }
                     }}
                     className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-900/30 rounded text-gray-500 hover:text-red-400"
                     title="Delete Log"
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Footer Section (Fixed) */}
      <div className="shrink-0 p-4 border-t border-gray-800 bg-[#08080c] relative z-20">
        
        {/* Credits / Plan Status Display */}
        <div className="mb-4 bg-[#0f0f13] border border-gray-800 p-3 rounded-xl relative overflow-hidden group">
           
           <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-inner ${user.isPro ? 'bg-yellow-500/10 border-yellow-500/20 shadow-yellow-900/20' : 'bg-gray-800 border-gray-700 shadow-black/50'}`}>
                    {user.isPro ? <Crown className="w-5 h-5 text-yellow-500" /> : <Zap className="w-5 h-5 text-purple-400" />}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
                       {user.isPro ? 'Pro Member' : 'Balance'}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                       <span className={`text-lg font-mono font-bold leading-none ${user.isPro ? 'text-yellow-400' : 'text-white'}`}>
                          {user.isPro ? 'ACTIVE' : credits}
                       </span>
                       {!user.isPro && <span className="text-[10px] text-gray-600 font-mono">CR</span>}
                    </div>
                 </div>
              </div>

              {!user.isPro && (
                <button 
                  onClick={onOpenPricing}
                  className="h-8 px-3 text-[10px] font-bold bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/30 text-cyber-cyan rounded-lg transition-all flex items-center gap-1.5"
                >
                   GET PRO
                </button>
              )}
           </div>
        </div>

        {/* User Profile Dropdown Area */}
        <div className="relative" ref={profileRef}>
          {isProfileOpen && (
            <div className="absolute bottom-full left-0 w-full mb-3 bg-[#0a0a0f] border border-gray-800 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.7)] overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">
               <div className="p-3 border-b border-gray-800/50 bg-white/5">
                  <p className="text-white text-xs font-bold truncate">{user.name}</p>
                  <p className="text-[10px] text-gray-500 truncate font-mono">{user.email}</p>
               </div>
               <div className="p-1 space-y-0.5">
                 {user.isPro && (
                   <button
                     onClick={() => {
                        setIsProfileOpen(false);
                        onOpenSubscription();
                     }}
                     className="w-full text-left px-3 py-2.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-2.5"
                   >
                     <CreditCard className="w-3.5 h-3.5 text-gray-400" /> Manage Subscription
                   </button>
                 )}
                 <button 
                   onClick={onLogout}
                   className="w-full text-left px-3 py-2.5 text-xs text-red-400 hover:bg-red-900/10 hover:text-red-300 rounded-lg transition-colors flex items-center gap-2.5"
                 >
                   <LogOut className="w-3.5 h-3.5 text-red-500/70" /> Sign Out
                 </button>
               </div>
            </div>
          )}

          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all duration-200 relative z-40 ${isProfileOpen ? 'bg-gray-800 border-gray-700' : 'bg-transparent border-transparent hover:bg-gray-800/50 hover:border-gray-800'}`}
          >
            <div className="relative">
               {user.photoURL ? (
                 <img src={user.photoURL} alt={user.name} className="w-9 h-9 rounded-full border border-gray-700 object-cover" />
               ) : (
                 <div className="w-9 h-9 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0">
                    <UserCircle2 className="w-5 h-5 text-gray-400" />
                 </div>
               )}
               <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#050508] rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0 text-left">
               <div className="text-xs font-bold text-gray-200 truncate">{user.name}</div>
               <div className="text-[10px] text-gray-500 truncate font-mono">User ID: {user.id.slice(0,6)}...</div>
            </div>

            <div className={`p-1 rounded hover:bg-white/10 transition-colors`}>
               <ChevronUp className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;