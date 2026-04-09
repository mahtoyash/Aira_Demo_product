import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Globe, Moon, Sun, Check } from 'lucide-react';
import { useI18n, type SupportedLanguage } from '../contexts/I18nContext';

export function Settings() {
  const { theme, setTheme } = useOutletContext<any>();
  const { language, setLanguage, t } = useI18n();
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 1500);
  };

  const languages: { code: SupportedLanguage; flag: string }[] = [
    { code: 'English', flag: '🇺🇸' },
    { code: 'Spanish', flag: '🇪🇸' },
    { code: 'French', flag: '🇫🇷' },
    { code: 'German', flag: '🇩🇪' },
  ];

  return (
    <>
      <div className="flex items-end justify-between shrink-0">
        <div>
          <h2 className="text-[var(--dash-text)] text-[1.75rem] font-semibold tracking-tight flex items-center">
            {t('settings')}
          </h2>
          <p className="text-[var(--dash-text-muted)] mt-1 text-[0.9375rem] font-normal">
            {t('settings_subtitle')}
          </p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[linear-gradient(135deg,#141416_0%,#0B0B0D_100%)] border border-[rgba(168,85,247,0.1)] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-full mt-4 backdrop-blur-xl"
      >
        <div className="p-6 md:p-8 flex flex-col gap-10 max-w-2xl">
          
          {/* Language Selection */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-[var(--dash-text-muted)]" />
              <h2 className="text-lg font-semibold text-[var(--dash-text)]">{t('language')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-no-invert="true">
              {languages.map(({ code, flag }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    language === code 
                      ? 'bg-[var(--dash-violet)]/10 border-[var(--dash-violet)]/50 text-[var(--dash-violet)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
                      : 'bg-black/20 border-[#475569]/50 text-[var(--dash-text-muted)] hover:border-[#64748b] hover:bg-black/30'
                  }`}
                >
                  <span className="font-medium flex items-center gap-2">
                    <span className="text-lg">{flag}</span>
                    {code}
                  </span>
                  {language === code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Theme Selection */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <Sun className={`w-5 h-5 absolute transition-opacity ${theme === 'light' ? 'opacity-100 text-[var(--dash-text-muted)]' : 'opacity-0'}`} />
                <Moon className={`w-5 h-5 transition-opacity ${theme === 'dark' ? 'opacity-100 text-[var(--dash-text-muted)]' : 'opacity-0'}`} />
              </div>
              <h2 className="text-lg font-semibold text-[var(--dash-text)]">{t('appearance')}</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-no-invert="true">
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col gap-4 p-4 rounded-2xl border transition-all ${
                  theme === 'dark'
                    ? 'bg-[#0B0B0D] border-[var(--dash-violet)]/50 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-[var(--dash-violet)]/20'
                    : 'bg-[var(--dash-card-solid)] border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className="w-full h-24 rounded-lg bg-[#01030e] border border-white/5 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(100,116,139,0.1)_0%,rgba(30,41,59,0.5)_45%,rgba(8,18,37,0.8)_100%)]"></div>
                  <Moon className="w-8 h-8 text-[var(--dash-violet)] relative z-10" />
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className={`font-medium ${theme === 'dark' ? 'text-[var(--dash-violet)]' : 'text-[var(--dash-text-muted)]'}`}>{t('dark_theme')}</span>
                  {theme === 'dark' && <Check className="w-4 h-4 text-[var(--dash-violet)]" />}
                </div>
              </button>

              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col gap-4 p-4 rounded-2xl border transition-all ${
                  theme === 'light'
                    ? 'bg-[var(--dash-card-solid)] border-[var(--dash-violet)]/50 shadow-[0_0_15px_rgba(168,85,247,0.15)] ring-1 ring-[var(--dash-violet)]/20'
                    : 'bg-[var(--dash-card-solid)] border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className="w-full h-24 rounded-lg bg-[#f8fafc] border border-black/5 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.8)_0%,rgba(241,245,249,0.9)_100%)]"></div>
                  <Sun className="w-8 h-8 text-amber-500 relative z-10" />
                </div>
                <div className="flex items-center justify-between w-full">
                  <span className={`font-medium ${theme === 'light' ? 'text-[var(--dash-violet)]' : 'text-[var(--dash-text-muted)]'}`}>{t('light_theme')}</span>
                  {theme === 'light' && <Check className="w-4 h-4 text-[var(--dash-violet)]" />}
                </div>
              </button>
            </div>
            <p className="text-xs text-[#64748b] mt-2">
              {t('light_theme_note')}
            </p>
          </div>
          
        </div>

        <div className="p-6 md:px-8 border-t border-white/5 bg-black/20 flex justify-end gap-3 mt-auto">
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
              t('save_settings')
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}