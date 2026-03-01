import React, { useEffect, useRef } from 'react';
import { LogEntry, AnalysisStage } from '../types';
import { Loader2, CheckCircle2, AlertTriangle, Cpu, Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  logs: LogEntry[];
  stage: AnalysisStage;
}

const Terminal: React.FC<TerminalProps> = ({ logs, stage }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel rounded-lg flex flex-col h-[500px] w-full overflow-hidden border-cyber-border relative">
      <div className="bg-cyber-dark p-3 border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-cyber-cyan" />
          <span className="text-sm font-mono text-gray-300 font-bold tracking-wider">SIGNALIX_CORE_V1.0</span>
        </div>
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${stage === AnalysisStage.IDLE ? 'bg-gray-600' : 'bg-green-500 animate-pulse'}`}></div>
           <span className="text-xs text-gray-400 font-mono uppercase">{stage.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-3 bg-cyber-black/80 relative" ref={scrollRef}>
        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] opacity-20"></div>
        
        {logs.length === 0 && stage === AnalysisStage.IDLE && (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
            <Cpu className="w-16 h-16 mb-4 animate-pulse" />
            <p>SYSTEM READY</p>
            <p>AWAITING TARGET PAIR...</p>
          </div>
        )}

        {logs.map((log) => (
          <div key={log.id} className="relative z-10 flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-gray-600 text-xs mt-1 shrink-0">
              {(() => {
                const d = new Date(log.timestamp);
                return `${d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.${d.getMilliseconds().toString().padStart(3, '0')}`;
              })()}
            </span>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              {log.type === 'info' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
              {log.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-cyber-green" />}
              {log.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
              {log.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
              {log.type === 'ai' && <Cpu className="w-3.5 h-3.5 text-cyber-magenta animate-pulse" />}
            </div>
            <p className={`break-words flex-1 ${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'success' ? 'text-cyber-green' : 
              log.type === 'ai' ? 'text-cyber-magenta' : 'text-gray-300'
            }`}>
              {log.message}
            </p>
          </div>
        ))}
        
        {stage === AnalysisStage.AI_THINKING && (
          <div className="flex items-center gap-2 text-cyber-cyan animate-pulse mt-4 pl-24">
             <Loader2 className="w-4 h-4 animate-spin" />
             <span>NEURAL ENGINE PROCESSING...</span>
          </div>
        )}
      </div>
      
      {/* Decorative Bottom Bar */}
      <div className="h-6 bg-cyber-dark border-t border-cyber-border flex items-center px-4 justify-between text-[10px] text-gray-500 font-mono">
         <span>MEM: 64TB</span>
         <span>LATENCY: 12ms</span>
         <span>ENCRYPTION: ON</span>
      </div>
    </div>
  );
};

export default Terminal;