import React, { useEffect } from 'react';
import { ArrowLeft, Lock, Eye } from 'lucide-react';

interface PrivacyPageProps {
  onBack: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-cyber-black text-gray-300 font-sans selection:bg-cyber-cyan selection:text-black relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 cyber-grid opacity-20"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-24">
        
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-cyber-cyan transition-colors mb-8 font-mono text-xs uppercase tracking-widest">
           <ArrowLeft className="w-4 h-4" /> Return to Terminal
        </button>

        <div className="border-b border-gray-800 pb-12 mb-12">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-800">
                 <Lock className="w-6 h-6 text-gray-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">PRIVACY POLICY</h1>
           </div>
           <p className="text-gray-500 font-mono text-sm">Last Updated: October 24, 2025</p>
        </div>

        <div className="space-y-12 text-sm leading-relaxed text-gray-400">
           
           <section>
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full"></div> 1. Data Collection
              </h3>
              <p className="mb-4">We collect minimal data necessary to provide our services:</p>
              <ul className="list-disc pl-5 space-y-2">
                 <li><strong>Identity Data:</strong> Email address and authentication tokens via Google Firebase.</li>
                 <li><strong>Usage Data:</strong> Analysis logs, trading pairs selected, and feature usage patterns.</li>
                 <li><strong>Payment Data:</strong> Subscription status and transaction history (processed securely via Polar).</li>
              </ul>
           </section>

           <section>
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full"></div> 2. How We Use Your Data
              </h3>
              <p>
                 We use your data solely to maintain your account, process payments, and improve the AI models. We do not sell your personal data to third-party advertisers or data brokers.
              </p>
           </section>

           <section>
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full"></div> 3. AI Processing
              </h3>
              <p>
                 When you request an analysis, market data (OHLCV) and technical indicators are sent to our AI provider (Google Gemini). This data is anonymized and does not contain your personal identifiers.
              </p>
           </section>

           <section>
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full"></div> 4. Data Security
              </h3>
              <div className="p-6 bg-[#0a0a0f] border border-gray-800 rounded-lg">
                 <p className="text-gray-300">
                    We employ industry-standard encryption (AES-256) for data at rest and TLS 1.3 for data in transit. Access to user databases is strictly limited to authorized engineering personnel.
                 </p>
              </div>
           </section>

           <section>
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-cyber-cyan rounded-full"></div> 5. Your Rights
              </h3>
              <p>
                 You have the right to request a copy of your data or request deletion of your account at any time. To exercise these rights, please contact support or delete your account via the user dashboard.
              </p>
           </section>

           <div className="pt-12 border-t border-gray-800 text-center">
              <p className="text-xs text-gray-600 font-mono">
                 Data Protection Officer: contact@realanima.online
              </p>
           </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;