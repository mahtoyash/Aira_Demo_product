import { useState, useRef, useEffect } from 'react';
import { X, User, Upload, Mail, MapPin, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../contexts/I18nContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  setUserName: (name: string) => void;
  profilePhoto?: string | null;
  onProfilePhotoChange?: (photo: string | null) => void;
}

export function ProfileModal({ isOpen, onClose, userName, setUserName, profilePhoto, onProfilePhotoChange }: ProfileModalProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState('albert.wesker@umbrella.com');
  const [gender, setGender] = useState('Male');
  const [country, setCountry] = useState('United States');
  const [isSaved, setIsSaved] = useState(false);
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(userName);
    }
  }, [isOpen, userName]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onProfilePhotoChange?.(url);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    setUserName(name);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-50%' }}
            className="fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-xl z-[101] overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(20,20,22,0.85) 0%, rgba(11,11,13,0.90) 100%)',
              backdropFilter: 'blur(24px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
              border: '1px solid rgba(168,85,247,0.15)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.03), 0 24px 64px rgba(0,0,0,0.6), 0 0 60px rgba(168,85,247,0.08)',
            }}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h2 className="text-xl font-bold text-[var(--dash-text)] flex items-center gap-3 tracking-tight">
                <User className="text-[var(--dash-text-muted)] w-5 h-5" />
                {t('my_profile')}
              </h2>
              <button onClick={onClose} className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8">
              <div className="flex flex-col gap-8">
                
                {/* Avatar Upload */}
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full border-2 border-white/[0.06] shadow-[0_0_16px_rgba(168,85,247,0.15)] flex items-center justify-center overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-[var(--dash-text-muted)]" />
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity border border-white/10"
                    >
                      <Upload className="w-5 h-5 text-white mb-1" />
                      <span className="text-[0.65rem] text-white font-medium uppercase tracking-wider">{t('upload')}</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[var(--dash-text-muted)] text-sm font-medium ml-1">{t('full_name')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-[#64748b]" />
                      </div>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black/20 border border-[#475569]/50 rounded-xl py-2.5 pl-10 pr-4 text-[var(--dash-text)] placeholder-[#475569] focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/50 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[var(--dash-text-muted)] text-sm font-medium ml-1">{t('email_address')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-[#64748b]" />
                      </div>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/20 border border-[#475569]/50 rounded-xl py-2.5 pl-10 pr-4 text-[var(--dash-text)] placeholder-[#475569] focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/50 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[var(--dash-text-muted)] text-sm font-medium ml-1">{t('gender')}</label>
                    <div className="relative">
                      <select 
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-black/20 border border-white/[0.06] rounded-xl py-2.5 px-4 pr-10 text-[var(--dash-text)] appearance-none focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/50 transition-all [&>option]:bg-[var(--dash-card-solid)] [&>option]:text-[var(--dash-text)]"
                      >
                        <option value="Male">{t('male')}</option>
                        <option value="Female">{t('female')}</option>
                        <option value="Non-binary">{t('non_binary')}</option>
                        <option value="Prefer not to say">{t('prefer_not_to_say')}</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-[#64748b]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[var(--dash-text-muted)] text-sm font-medium ml-1">{t('country')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="w-4 h-4 text-[#64748b]" />
                      </div>
                      <select 
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-black/20 border border-white/[0.06] rounded-xl py-2.5 pl-10 pr-10 text-[var(--dash-text)] appearance-none focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/50 transition-all [&>option]:bg-[var(--dash-card-solid)] [&>option]:text-[var(--dash-text)]"
                      >
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="India">India</option>
                        <option value="Japan">Japan</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-[#64748b]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-white/5 transition-all"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaved}
                className="px-6 py-2.5 bg-[linear-gradient(135deg,#A855F7_0%,#7C3AED_100%)] text-white rounded-xl font-medium shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 disabled:scale-100"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" /> {t('saved')}
                  </>
                ) : (
                  t('save_profile')
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}