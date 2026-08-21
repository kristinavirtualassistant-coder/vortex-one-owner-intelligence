import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User } from '../lib/firebase';
import { LogIn, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

export const AuthWidget: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Firebase Auth Login Error:', err);
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
    <button
      onClick={handleLogin}
      disabled={loading}
      className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 text-xs font-bold shadow-xs transition-all"
    >
      <LogIn className="w-4 h-4 text-blue-600" />
      <span>{loading ? 'Connecting...' : 'Google Sign-In'}</span>
    </button>
  );
};
