import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { X, ArrowRight } from 'lucide-react';

export default function RegistrationModal({ isOpen, onClose }) {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ── Google OAuth → Firebase Auth → Dashboard redirect ─────────────────────
  // Uses the existing @react-oauth/google client (18485514397-...) which is
  // already configured. The access token is then exchanged for a Firebase
  // session via signInWithCredential so the dashboard auth guard works.
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const loginWithGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn();
      navigate('/dashboard');
    } catch (err) {
      console.error('[Auth] Firebase sign-in failed:', err);
      setError('Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    loginWithGoogle();
  };

  // ── Manual form redirect ───────────────────────────────────────────────────
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (name && email) {
      navigate('/dashboard');
    } else {
      setError('Please fill out all fields.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-white/20 font-[family-name:var(--font-geist)]"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden"
          >
            {/* Top decorative glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-emerald-500" />

            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-black tracking-tight mb-2">Join Aira</h2>
              <p className="text-zinc-500 text-sm">Create an account to monitor your environment's invisible telemetry.</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-5 py-4 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-5 py-4 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-zinc-400"
                />
              </div>
              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-between px-6 py-4 rounded-xl bg-black text-white hover:bg-zinc-800 transition-colors active:scale-[0.98]"
              >
                <span className="font-semibold text-sm">Continue to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Or</span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>

            {/* Google Sign-In — uses @react-oauth/google (existing client) then Firebase */}
            <button
              type="button"
              id="google-signin-landing"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 border-zinc-200 bg-white text-zinc-700 font-semibold hover:border-zinc-300 hover:bg-zinc-50 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <p className="text-center text-xs text-zinc-400 mt-5">
              By continuing, you agree to Aira's Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
