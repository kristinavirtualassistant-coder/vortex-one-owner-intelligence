import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from '../lib/firebase';
import { LogIn, LogOut, User as UserIcon, ShieldCheck, AlertCircle, X } from 'lucide-react';

export const AuthWidget: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const code = err?.code || '';
      // Normal user dismissals / cancel events: do not log as application errors
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      if (code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by browser. Please enable popups.');
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError('Domain not authorized for OAuth. Check Firebase console.');
      } else {
        setAuthError(err?.message || 'Authentication failed. Please try again.');
        console.warn('Firebase Auth notice:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase Auth Logout Error:', err);
    }
  };

  if (user) {
    return (
      <div className="flex items-center space-x-3 bg-blue-50/80 border border-blue-200 px-3 py-1.5 rounded-2xl shadow-xs">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-blue-300" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            <UserIcon className="w-4 h-4" />
          </div>
        )}

        <div className="hidden lg:block text-xs font-mono">
          <div className="font-bold text-slate-900">{user.displayName || user.email}</div>
          <div className="text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Authenticated</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 text-xs font-bold shadow-xs transition-all"
      >
        <LogIn className="w-4 h-4 text-blue-600" />
        <span>{loading ? 'Connecting...' : 'Google Sign-In'}</span>
      </button>

      {authError && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-rose-50 border border-rose-200 rounded-xl p-2.5 shadow-lg text-xs text-rose-800 flex items-start gap-2 min-w-56">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="flex-1 font-medium">{authError}</span>
          <button onClick={() => setAuthError(null)} className="text-rose-500 hover:text-rose-800 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

