import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import RiskPage from './components/RiskPage';
import { userService } from './services/userService';
import { UserProfile } from './types';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export type ViewState = 'landing' | 'auth' | 'dashboard' | 'terms' | 'privacy' | 'risk';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await firebaseUser.reload();
        } catch (e) {
          // ignore reload error
        }

        if (firebaseUser.emailVerified) {
          // Only set loading if we aren't already loading to prevent flicker
          // But usually we want to ensure we block UI while fetching profile
          setLoading(true); 
          try {
            const params = new URLSearchParams(window.location.search);
            const paymentSuccess = params.get('payment') === 'success';

            if (paymentSuccess) {
              setProcessingPayment(true);
              const upgradedUser = await userService.upgradeToPro();
              setUser(upgradedUser);
              window.history.replaceState({}, '', window.location.pathname);
              setProcessingPayment(false);
            } else {
               const profile = await userService.getCurrentUserProfile();
               setUser(profile);
            }
            
            // Switch to dashboard using functional update to avoid dependency on currentView
            setCurrentView(prev => {
              if (prev === 'auth' || prev === 'landing') return 'dashboard';
              return prev;
            });

          } catch (e) {
            console.error("Error fetching user profile", e);
            setUser(null);
            setProcessingPayment(false);
          } finally {
            setLoading(false);
          }
        } else {
          setUser(null);
          setLoading(false); 
        }
      } else {
        setUser(null);
        // If user logs out or session invalid, go back to landing if we were on dashboard
        setCurrentView(prev => prev === 'dashboard' ? 'landing' : prev);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // Empty dependency array prevents re-running effect on view change

  const handleLoginSuccess = (userData: UserProfile) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await userService.logout();
    setCurrentView('landing'); 
  };

  if (loading || processingPayment) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col gap-4 items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
        {processingPayment && (
           <p className="text-gray-400 font-mono text-sm animate-pulse">Confirming Pro Subscription...</p>
        )}
      </div>
    );
  }

  return (
    <>
      {currentView === 'landing' && (
        <LandingPage 
          onGetStarted={() => {
             if (user) setCurrentView('dashboard');
             else {
               setAuthInitialMode('signup');
               setCurrentView('auth');
             }
          }}
          onLogin={() => {
             if (user) setCurrentView('dashboard');
             else {
               setAuthInitialMode('login');
               setCurrentView('auth');
             }
          }}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {currentView === 'auth' && (
        <AuthPage 
          initialMode={authInitialMode}
          onLoginSuccess={handleLoginSuccess}
          onBack={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'dashboard' && user && (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      )}

      {currentView === 'terms' && <TermsPage onBack={() => setCurrentView('landing')} />}
      {currentView === 'privacy' && <PrivacyPage onBack={() => setCurrentView('landing')} />}
      {currentView === 'risk' && <RiskPage onBack={() => setCurrentView('landing')} />}
    </>
  );
}