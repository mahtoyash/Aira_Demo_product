import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn();
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 60% 0%, #141416 0%, #0B0B0D 55%, #08080A 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Ambient glow orbs */}
      <div style={{
        position: 'absolute', top: '-10%', right: '10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-5%', left: '5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,132,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 420,
        margin: '0 16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: '48px 40px',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset, 0 1px 0 0 rgba(255,255,255,0.04) inset, 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(168,85,247,0.04)',
        backdropFilter: 'blur(20px)',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="white" opacity="0.9"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          </div>
          <div>
            <p style={{ color: '#E8E8EC', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Aira
            </p>
            <p style={{ color: '#A855F7', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase' as const }}>
              CO₂ Monitor
            </p>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            color: '#F1F5F9', fontSize: 26, fontWeight: 700,
            letterSpacing: '-0.03em', margin: '0 0 8px 0', lineHeight: 1.2,
          }}>
            Welcome back
          </h1>
          <p style={{ color: '#949499', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Sign in to access your air quality dashboard and room analytics.
          </p>
        </div>

        {/* Divider with label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ color: '#5A5A65', fontSize: 12, fontWeight: 500 }}>Continue with</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Google Sign-In Button */}
        <button
          id="google-signin-btn"
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '14px 20px',
            background: loading
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            color: '#E8E8EC',
            fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => {
            if (!loading) {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.08)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.3)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(168,85,247,0.08)';
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          {loading ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#A855F7" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Signing in...' : 'Google'}
        </button>

        {/* Footer note */}
        <p style={{
          color: '#3A3A42', fontSize: 12, textAlign: 'center',
          marginTop: 24, marginBottom: 0, lineHeight: 1.6,
        }}>
          Access is restricted to registered devices only.
          <br />Contact your administrator if you need access.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
