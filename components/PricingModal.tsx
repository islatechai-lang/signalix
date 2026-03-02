import React, { useState } from 'react';
import { X, Check, Zap, Loader2, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../types';
import { paymentService } from '../services/paymentService';
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { PRO_PLAN_PRICE, PRO_PLAN_CREDITS } from '../constants';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, user }) => {
  const [loading, setLoading] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const planId = await paymentService.startCheckout(user);
      setCheckoutPlanId(planId);
      // Wait for embed to load, keep loading state briefly
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("Failed to connect to payment provider. Please ensure the backend server is running.");
    }
  };

  const handleClose = () => {
    setCheckoutPlanId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 relative border border-cyber-cyan/30 shadow-[0_0_50px_rgba(0,243,255,0.1)]">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {checkoutPlanId ? (
          <div className="flex flex-col h-full min-h-[500px]">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setCheckoutPlanId(null)}
                className="text-gray-400 hover:text-white transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white">Complete Checkout</h2>
            </div>
            <div className="flex-1 bg-white rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <WhopCheckoutEmbed
                planId={checkoutPlanId}
                returnUrl={`${window.location.origin}?payment=success`}
                theme="light"
                prefill={{ email: user.email }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-cyber-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyber-cyan/50 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                <Zap className="w-6 h-6 text-cyber-cyan" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
              <p className="text-gray-400 text-sm">Unlock the full power of the Neural Engine.</p>
            </div>

            <div className="bg-gradient-to-b from-cyber-panel to-transparent p-6 rounded-xl border border-cyber-border mb-8">
              <div className="flex justify-center items-baseline mb-4">
                <span className="text-3xl font-bold text-white">${PRO_PLAN_PRICE}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  `${PRO_PLAN_CREDITS} AI Analysis / Month`,
                  "Access to Gemini 3.1 Pro",
                  "Real-time Indicator Calculations",
                  "Priority Processing Queue"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-cyber-cyan/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-cyber-cyan" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-3 bg-cyber-cyan hover:bg-cyan-400 text-black font-bold text-center rounded transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Preparing Checkout...
                  </>
                ) : (
                  "Subscribe via Whop"
                )}
              </button>
              <p className="text-center text-[10px] text-gray-500 mt-3">
                Secure payment via Whop Embedded Checkout.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PricingModal;