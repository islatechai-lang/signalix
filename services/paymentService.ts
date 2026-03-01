import { UserProfile } from '../types';

export interface SubscriptionDetails {
  found: boolean;
  id?: string;
  status?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  amount?: number;
  currency?: string;
}

export const paymentService = {
  async startCheckout(user: UserProfile) {
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerEmail: user.email,
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate checkout');
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  },

  async getSubscription(email: string): Promise<SubscriptionDetails> {
    const res = await fetch(`/api/subscription?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error("Failed to fetch subscription");
    return await res.json();
  },

  async checkSubscriptionStatus(email: string): Promise<{ isPro: boolean }> {
    try {
      const res = await fetch('/api/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) return { isPro: false }; // Fail safe
      return await res.json();
    } catch (e) {
      console.error("Sync failed", e);
      return { isPro: false }; // Fail safe
    }
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const res = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId })
    });
    if (!res.ok) throw new Error("Failed to cancel subscription");
  }
};