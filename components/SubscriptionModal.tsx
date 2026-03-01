import React, { useEffect, useState } from 'react';
import { X, Calendar, CreditCard, AlertTriangle, CheckCircle2, Loader2, ShieldOff } from 'lucide-react';
import { paymentService, SubscriptionDetails } from '../services/paymentService';
import { UserProfile } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, user }) => {
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<SubscriptionDetails | null>(null);
  const [processingCancel, setProcessingCancel] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError('');
      paymentService.getSubscription(user.email)
        .then(data => setSub(data))
        .catch(err => setError("Could not load subscription details."))
        .finally(() => setLoading(false));
    }
  }, [isOpen, user.email]);

  const handleCancel = async () => {
    if (!sub?.id) return;
    if (!confirm("Are you sure you want to cancel? Your Pro access will remain valid until the end of the billing period.")) return;

    setProcessingCancel(true);
    try {
      await paymentService.cancelSubscription(sub.id);
      // Refresh
      const updated = await paymentService.getSubscription(user.email);
      setSub(updated);
    } catch (e) {
      setError("Cancellation failed. Please try again.");
    } finally {
      setProcessingCancel(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative border border-gray-800 shadow-[0_0_50px_rgba(100,100,100,0.1)]">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-gray-300" />
           </div>
           <div>
              <h2 className="text-xl font-bold text-white">Manage Subscription</h2>
              <p className="text-xs text-gray-500 font-mono">Plan Details & Billing</p>
           </div>
        </div>

        {loading ? (
           <div className="h-40 flex items-center justify-center text-gray-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Fetching Polar data...
           </div>
        ) : error ? (
           <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-400 text-sm rounded">
              {error}
           </div>
        ) : !sub || !sub.found ? (
           <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No active subscription found on Polar.</p>
              <button onClick={onClose} className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-sm text-white">Close</button>
           </div>
        ) : (
           <div className="space-y-6">
              {/* Status Card */}
              <div className={`p-4 rounded-xl border ${sub.status === 'active' && !sub.cancel_at_period_end ? 'bg-green-900/10 border-green-900/30' : 'bg-orange-900/10 border-orange-900/30'}`}>
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</span>
                    {sub.cancel_at_period_end ? (
                       <span className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-900/20 px-2 py-0.5 rounded-full border border-orange-900/30">
                          <AlertTriangle className="w-3 h-3" /> CANCELED
                       </span>
                    ) : (
                       <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full border border-green-900/30">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                       </span>
                    )}
                 </div>
                 <div className="text-2xl font-mono font-bold text-white">PRO TIER</div>
                 <div className="text-xs text-gray-400 mt-1">
                    {sub.cancel_at_period_end 
                       ? `Access ends on ${new Date(sub.current_period_end || '').toLocaleDateString()}` 
                       : `Renews on ${new Date(sub.current_period_end || '').toLocaleDateString()}`
                    }
                 </div>
              </div>

              {/* Actions */}
              {!sub.cancel_at_period_end && (
                 <div className="pt-2">
                    <button 
                       onClick={handleCancel}
                       disabled={processingCancel}
                       className="w-full py-3 rounded-lg border border-red-900/30 text-red-500 hover:bg-red-900/10 hover:border-red-900/50 transition-all flex items-center justify-center gap-2 text-sm font-bold"
                    >
                       {processingCancel ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                       Cancel Subscription
                    </button>
                    <p className="text-[10px] text-gray-600 text-center mt-3 max-w-xs mx-auto">
                       Cancellation takes effect at the end of the current billing cycle. You won't be charged again.
                    </p>
                 </div>
              )}
              
              {sub.cancel_at_period_end && (
                 <p className="text-center text-sm text-gray-400">
                    Your subscription is set to expire. You can renew it after it expires from the dashboard.
                 </p>
              )}
           </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionModal;