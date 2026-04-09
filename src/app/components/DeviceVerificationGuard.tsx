import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DeviceVerificationGuardProps {
  children: ReactNode;
}

export function DeviceVerificationGuard({ children }: DeviceVerificationGuardProps) {
  const { signOut } = useAuth();
  const [isVerified, setIsVerified] = useState(() => {
    return localStorage.getItem('device_model_verified') === 'K0987';
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === 'K0987') {
      localStorage.setItem('device_model_verified', 'K0987');
      setIsVerified(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (isVerified) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center font-[family-name:var(--font-geist)] relative overflow-hidden">
      {/* Dynamic Backgrounds matching Aether vibe */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl max-w-md w-full mx-4"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Hardware Verification</h2>
          <p className="text-gray-400 text-sm">Please enter the Model Number of your Aira device to access operational telemetry.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input 
              type="text" 
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(false);
              }}
              placeholder="e.g. K0987"
              className={`w-full bg-black/40 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-4 text-white text-center text-xl tracking-widest outline-none focus:border-blue-500/50 transition-colors`}
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2 text-center">Invalid Model Number. Access Denied.</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Authenticate Link
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-white/10 pt-6">
           <button onClick={signOut} className="text-gray-500 hover:text-white transition-colors text-sm flex items-center justify-center gap-2 mx-auto">
             <LogOut className="w-4 h-4" /> Cancel & Sign Out
           </button>
        </div>
      </motion.div>
    </div>
  );
}
