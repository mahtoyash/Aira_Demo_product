import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Cross-origin auth handoff from the landing page:
     * If the URL contains ?gat=<google_access_token>, the user just signed in
     * on the landing page (different port). We sign into Firebase here using
     * the forwarded token, then strip it from the URL.
     */
    const params      = new URLSearchParams(window.location.search);
    const googleToken = params.get('gat');

    if (googleToken) {
      console.log('[Auth] Cross-origin token detected — signing in...');
      const credential = GoogleAuthProvider.credential(null, googleToken);
      signInWithCredential(auth, credential)
        .then(result => {
          console.log('[Auth] ✓ Auto sign-in from landing page:', result.user.displayName);
        })
        .catch(err => {
          console.warn('[Auth] Auto sign-in failed:', err);
        })
        .finally(() => {
          // Always clean the token from the URL bar
          window.history.replaceState({}, '', window.location.pathname);
        });
    }

    // Listen for auth state changes (covers both auto sign-in and manual sign-in)
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('[Auth] Sign-in failed:', err);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('[Auth] Sign-out failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
