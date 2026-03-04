import React, { useState } from 'react';
import { UserProfile } from '../types';
import { userService } from '../services/userService';
import { Settings, CheckCircle2, AlertCircle, Key, Lock, Loader2, ArrowRight } from 'lucide-react';

interface ExchangeConnectProps {
    user: UserProfile;
    onUpdateUser: (updates: Partial<UserProfile>) => void;
    onClose: () => void;
}

export const ExchangeConnect: React.FC<ExchangeConnectProps> = ({ user, onUpdateUser, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Check if they already have keys
    const isConnected = !!user.binanceKeys;

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!apiKey || !apiSecret) {
            setError('Both API Key and Secret are required.');
            return;
        }

        setLoading(true);

        try {
            // 1. Send raw keys to backend to be encrypted
            const response = await fetch('/api/keys/encrypt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey, apiSecret })
            });

            if (!response.ok) {
                throw new Error('Failed to secure keys. Server error.');
            }

            const { encryptedApiKey, encryptedApiSecret } = await response.json();

            if (!encryptedApiKey || !encryptedApiSecret) {
                throw new Error('Invalid response from server.');
            }

            // 2. Save encrypted keys to Firestore User Profile
            await userService.updateUserProfile(user.id, {
                binanceKeys: {
                    encryptedApiKey,
                    encryptedApiSecret
                }
            });

            // 3. Update local state
            onUpdateUser({
                binanceKeys: {
                    encryptedApiKey,
                    encryptedApiSecret
                }
            });

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred while connecting.');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm("Are you sure you want to disconnect your Binance Testnet keys?")) return;

        setLoading(true);
        try {
            // Remove keys from Firestore
            await userService.updateUserProfile(user.id, {
                binanceKeys: undefined
            });
            // Update local state
            onUpdateUser({
                binanceKeys: undefined
            });
            setApiKey('');
            setApiSecret('');
        } catch (err: any) {
            setError("Failed to disconnect: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#0a0a0f] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-yellow-500/10 blur-[50px] pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Auto-Trading Setup</h2>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">Binance Testnet Integration</p>
                    </div>
                </div>

                {isConnected && !success ? (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-bold text-green-500">Connected & Ready</span>
                        </div>
                        <p className="text-xs text-green-500/80 mb-4">Your Binance Testnet API keys are securely encrypted and stored. Signalix AI can now execute trades automatically.</p>
                        <button
                            onClick={handleDisconnect}
                            disabled={loading}
                            className="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 text-xs font-bold rounded-lg transition-colors"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect Keys'}
                        </button>
                    </div>
                ) : success ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
                        <h3 className="text-xl font-bold text-white mb-2">Keys Secured!</h3>
                        <p className="text-sm text-gray-400">Auto-trading is now unlocked.</p>
                    </div>
                ) : (
                    <form onSubmit={handleConnect} className="space-y-4">
                        <div className="p-4 bg-[#15151a] border border-gray-800 rounded-lg">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-cyber-cyan" />
                                Step 1: Create Account
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed mb-3">
                                To start auto-trading for free, you need a Binance Testnet account. It gives you risk-free virtual funds to use with our AI.
                            </p>
                            <a
                                href="https://testnet.binance.vision/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-cyber-cyan hover:text-white transition-colors"
                            >
                                Sign up via our Affiliate Link <ArrowRight className="w-3 h-3" />
                            </a>
                        </div>

                        <div className="p-4 bg-[#15151a] border border-gray-800 rounded-lg space-y-4">
                            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-yellow-500" />
                                Step 2: Connect Keys
                            </h3>

                            <div>
                                <label className="block text-[10px] text-gray-500 font-mono mb-1.5 uppercase">API Key</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full bg-[#0a0a0f] border border-gray-800 focus:border-yellow-500/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                                        placeholder="Paste Testnet API Key"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-gray-500 font-mono mb-1.5 uppercase">API Secret</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                    <input
                                        type="password"
                                        value={apiSecret}
                                        onChange={(e) => setApiSecret(e.target.value)}
                                        className="w-full bg-[#0a0a0f] border border-gray-800 focus:border-yellow-500/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                                        placeholder="Paste Testnet API Secret"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <p className="text-xs text-red-400 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !apiKey || !apiSecret}
                            className="w-full h-11 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure & Connect Keys'}
                        </button>
                        <p className="text-[10px] text-center text-gray-600 font-mono mt-2">
                            Keys are encrypted locally before database storage.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};
