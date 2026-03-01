import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, CheckCircle2, ArrowLeft, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { userService } from '../services/userService';
import { UserProfile } from '../types';
import logo from '../logo.png';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onBack: () => void;
  initialMode?: 'login' | 'signup';
}

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-sent';

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onBack, initialMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  
  // Separate loading states to prevent UI flicker
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Specific state for the "Email Unverified" scenario
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Helper to clear messages when switching modes
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setShowResend(false);
    setEmail('');
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setError('');
    setShowResend(false);
    
    try {
      const user = await userService.login(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setError('Email not verified yet.');
        setShowResend(true);
      } else {
        setError(err.message);
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setError('');

    try {
      await userService.register(email, undefined, password);
      setMode('verify-sent');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await userService.resendVerification(email, password);
      setSuccessMsg("Verification email resent! Please check your inbox and spam folder.");
      setShowResend(false);
      setError('');
    } catch (err: any) {
      if (err.message === 'ALREADY_VERIFIED') {
         setError('Account is already verified. Please try logging in.');
         setShowResend(false);
      } else {
         setError(err.message);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await userService.resetPassword(email);
      setSuccessMsg('If an account exists with this email, a reset link has been sent. Please check your inbox and spam folder.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const user = await userService.googleLogin();
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
       setIsGoogleLoading(false);
    }
  }

  const isLoading = isEmailLoading || isGoogleLoading;

  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center relative overflow-hidden p-6 font-sans">
      
      {/* Background Ambience (Matching Landing Page) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 cyber-grid opacity-30"></div>
         <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-cyber-cyan/5 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="flex justify-center mb-10 cursor-pointer group" onClick={onBack}>
          <div className="flex items-center gap-3">
             <img src={logo} alt="SignalixAI" className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(0,243,255,0.3)]" />
             <span className="font-bold text-2xl text-white font-mono tracking-wider">SIGNALIX<span className="text-cyber-cyan">_AI</span></span>
          </div>
        </div>

        {/* Main Card */}
        <div className="glass-panel p-8 rounded-xl border border-gray-800 bg-[#0a0a0f]/80 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-50"></div>
          
          {/* VERIFY SENT MODE */}
          {mode === 'verify-sent' && (
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                 <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-mono">CHECK INBOX</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                 We've sent a secure verification link to:
              </p>
              
              <div className="bg-black/40 border border-gray-800 rounded py-3 px-4 mb-6">
                 <span className="text-cyber-cyan font-mono text-sm tracking-wide">{email}</span>
              </div>

              <p className="text-xs text-gray-500 mb-8 font-mono">
                 Can't find it in your inbox? Check your spam folder.
              </p>
              
              <button 
                 onClick={() => switchMode('login')}
                 className="w-full py-4 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold font-mono uppercase text-xs tracking-widest transition-colors border border-gray-700 hover:border-gray-600"
              >
                 Return to Login
              </button>
            </div>
          )}

          {/* FORGOT PASSWORD MODE */}
          {mode === 'forgot-password' && (
            <div>
               <button onClick={() => switchMode('login')} className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-mono uppercase mb-8 transition-colors tracking-wide">
                  <ArrowLeft className="w-3 h-3" /> Back to Login
               </button>
               <h2 className="text-2xl font-bold text-white mb-2 font-mono uppercase tracking-tight">Reset Access</h2>
               <p className="text-gray-400 text-sm mb-8 font-light">Enter your email to receive recovery protocols.</p>

               {successMsg ? (
                 <div className="p-4 bg-green-900/10 border border-green-500/20 rounded text-green-400 text-sm text-center mb-4 leading-relaxed font-mono">
                    {successMsg}
                 </div>
               ) : (
                 <form onSubmit={handleForgotPassword} className="space-y-6">
                    {error && (
                      <div className="p-3 bg-red-900/10 border border-red-500/20 rounded text-red-400 text-xs text-center flex items-center justify-center gap-2 font-mono">
                        <AlertTriangle className="w-4 h-4" /> {error}
                      </div>
                    )}
                    <div>
                       <label className="block text-[10px] font-mono text-cyber-cyan/70 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                          <input 
                             type="email" 
                             required
                             value={email}
                             onChange={e => setEmail(e.target.value)}
                             className="w-full h-12 bg-[#050508] border border-gray-800 rounded focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/20 outline-none transition-all pl-11 pr-4 text-white text-sm font-mono placeholder-gray-700"
                             placeholder="user@signalix.io"
                          />
                       </div>
                    </div>
                    <button 
                       type="submit"
                       disabled={isEmailLoading}
                       className="w-full py-4 bg-cyber-cyan hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,243,255,0.2)] hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] flex items-center justify-center gap-2"
                    >
                       {isEmailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                    </button>
                 </form>
               )}
            </div>
          )}

          {/* LOGIN & SIGNUP MODES */}
          {(mode === 'login' || mode === 'signup') && (
            <>
               <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2 font-mono uppercase tracking-tight">
                      {mode === 'login' ? 'System Login' : 'Initialize Account'}
                  </h2>
                  <p className="text-gray-400 text-xs font-mono uppercase tracking-widest opacity-70">
                      {mode === 'login' ? 'Enter credentials to access terminal' : 'Create identity to begin analysis'}
                  </p>
               </div>

               <div className="space-y-5">
                  <button 
                     type="button"
                     onClick={handleGoogleLogin}
                     disabled={isLoading}
                     className="w-full h-12 rounded bg-white text-black font-bold font-mono text-xs uppercase tracking-wide flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
                  >
                     {isGoogleLoading ? (
                       <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                     ) : (
                       <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
                     )}
                     {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                  </button>

                  <div className="relative flex items-center py-2">
                     <div className="flex-grow border-t border-gray-800"></div>
                     <span className="flex-shrink-0 mx-4 text-gray-600 text-[10px] font-mono uppercase tracking-widest">Or using email</span>
                     <div className="flex-grow border-t border-gray-800"></div>
                  </div>

                  {successMsg && (
                    <div className="p-3 bg-green-900/10 border border-green-500/20 rounded text-green-400 text-xs text-center flex items-center justify-center gap-2 font-mono">
                      <CheckCircle2 className="w-4 h-4" /> {successMsg}
                    </div>
                  )}

                  <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-5">
                     {error && (
                       <div className="p-4 bg-red-900/10 border border-red-500/20 rounded flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in duration-300">
                         <div className="text-red-400 text-xs text-center flex items-center gap-2 font-bold font-mono">
                            <AlertTriangle className="w-4 h-4" /> {error.toUpperCase()}
                         </div>
                         {showResend && (
                            <div className="w-full pt-3 border-t border-red-500/20">
                               <button
                                 type="button"
                                 onClick={handleResendVerification}
                                 disabled={resendLoading}
                                 className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-[10px] font-mono uppercase tracking-wider rounded border border-red-500/20 flex items-center justify-center gap-2 transition-colors"
                               >
                                 {resendLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                 Resend Email
                               </button>
                            </div>
                         )}
                       </div>
                     )}
                     
                     <div>
                        <label className="block text-[10px] font-mono text-cyber-cyan/70 uppercase tracking-widest mb-2 ml-1">Email</label>
                        <div className="relative">
                           <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                           <input 
                              type="email" 
                              required
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              className="w-full h-12 bg-[#050508] border border-gray-800 rounded focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/20 outline-none transition-all pl-11 pr-4 text-white text-sm font-mono placeholder-gray-700"
                              placeholder="trader@signalix.io"
                           />
                        </div>
                     </div>
                     
                     <div>
                        <label className="block text-[10px] font-mono text-cyber-cyan/70 uppercase tracking-widest mb-2 ml-1">Password</label>
                        <div className="relative">
                           <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                           <input 
                              type="password" 
                              required
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              className="w-full h-12 bg-[#050508] border border-gray-800 rounded focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/20 outline-none transition-all pl-11 pr-4 text-white text-sm font-mono placeholder-gray-700"
                              placeholder="••••••••••••"
                           />
                        </div>
                     </div>

                     {mode === 'login' && (
                        <div className="flex justify-end">
                           <button 
                              type="button"
                              onClick={() => switchMode('forgot-password')}
                              className="text-[10px] font-mono uppercase tracking-wide text-gray-500 hover:text-cyber-cyan transition-colors"
                           >
                              Forgot Password?
                           </button>
                        </div>
                     )}

                     <button 
                        type="submit"
                        disabled={isEmailLoading}
                        className="w-full py-4 bg-cyber-cyan hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,243,255,0.2)] hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] flex items-center justify-center gap-2 clip-path-polygon"
                     >
                        {isEmailLoading ? (
                           <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                           <>
                              {mode === 'login' ? 'ACCESS TERMINAL' : 'INITIALIZE'} <ArrowRight className="w-4 h-4" />
                           </>
                        )}
                     </button>
                  </form>
               </div>

               <div className="mt-8 text-center pt-6 border-t border-gray-800/50">
                  <button 
                     onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                     className="text-xs font-mono text-gray-400 hover:text-white transition-colors uppercase tracking-wide"
                  >
                     {mode === 'login' ? "New User? Create Account" : "Existing User? Sign In"}
                  </button>
               </div>
            </>
          )}

        </div>
        
        <div className="mt-8 flex justify-center gap-2 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
           <Shield className="w-3 h-3" />
           <span>Secure 256-bit Encryption</span>
        </div>

      </div>
    </div>
  );
};

const Shield = ({ className }: { className?: string }) => (
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
   </svg>
);

export default AuthPage;