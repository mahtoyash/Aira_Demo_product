import { Home, BarChart2, TrendingUp, Bell, User, Settings, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from 'react-router';
import { useI18n } from '../contexts/I18nContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  userName?: string;
  isMobile?: boolean;
  profilePhoto?: string | null;
}

export function Sidebar({ isOpen, setIsOpen, onOpenNotifications, onOpenProfile, userName = 'Albert Wesker', isMobile = false, profilePhoto }: SidebarProps) {
  const { t } = useI18n();

  // Mobile: full glassmorphic overlay
  if (isMobile) {
    return (
      <>
        {/* Hamburger button — z-30 so it doesn't fight with page z-50 dropdowns */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-[35] p-2.5 rounded-xl text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)] transition-colors shadow-lg md:hidden"
          style={{
            background: 'rgba(20,20,22,0.7)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Overlay */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              />
              <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 h-screen w-[280px] flex flex-col justify-between z-[65] shadow-2xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(20,20,22,0.88) 0%, rgba(11,11,13,0.92) 100%)',
                  backdropFilter: 'blur(24px) saturate(1.6)',
                  WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
                  borderRight: '1px solid rgba(168,85,247,0.10)',
                  boxShadow: '1px 0 32px rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.04)',
                }}
              >
                <div className="flex flex-col gap-4 overflow-hidden">
                  <div className="h-20 py-4 px-4 flex items-center justify-between border-b border-white/[0.04]">
                    <div className="flex items-center gap-3 pl-1">
                      <ProfileAvatar photo={profilePhoto} size={32} />
                      <h1 className="text-[var(--dash-text)] text-xl font-semibold tracking-tight leading-tight">
                        <span className="text-[var(--dash-text-secondary)] font-medium text-sm">{t('hey')}</span><br/>{userName}
                      </h1>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] rounded-xl transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <nav className="flex flex-col gap-1 px-3">
                    <NavItem icon={Home} label={t('home')} to="/dashboard" isOpen={true} />
                    <NavItem icon={BarChart2} label={t('room_analysis')} to="/dashboard/room-analysis" isOpen={true} />
                    <NavItem icon={TrendingUp} label={t('bivariate_analysis')} to="/dashboard/bivariate-analysis" isOpen={true} />
                  </nav>
                </div>
                <SidebarFooter isOpen={true} onOpenNotifications={onOpenNotifications} onOpenProfile={onOpenProfile} profilePhoto={profilePhoto} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: collapsible glassmorphic sidebar
  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 260 : 72 }}
      className="h-screen flex flex-col justify-between sticky top-0 z-[35] shrink-0 hidden md:flex"
      style={{
        background: 'linear-gradient(180deg, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.96) 100%)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '1px 0 24px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex flex-col gap-4 overflow-hidden">
        <div className={`h-20 py-4 flex items-center px-4 border-b border-white/[0.04] shrink-0 transition-all ${isOpen ? 'justify-between' : 'justify-center'}`}>
          <AnimatePresence mode="popLayout">
            {isOpen && (
              <motion.div
                key="sidebar-header"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                className="overflow-hidden whitespace-nowrap pl-1 flex items-center gap-3"
              >
                <ProfileAvatar photo={profilePhoto} size={32} />
                <h1 className="text-[var(--dash-text)] text-xl font-semibold tracking-tight truncate leading-tight">
                  <span className="text-[var(--dash-text-secondary)] font-medium text-sm">{t('hey')}</span><br/>{userName}
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] hover:bg-white/[0.04] rounded-xl transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          <NavItem icon={Home} label={t('home')} to="/dashboard" isOpen={isOpen} />
          <NavItem icon={BarChart2} label={t('room_analysis')} to="/dashboard/room-analysis" isOpen={isOpen} />
          <NavItem icon={TrendingUp} label={t('bivariate_analysis')} to="/dashboard/bivariate-analysis" isOpen={isOpen} />
        </nav>
      </div>

      <SidebarFooter isOpen={isOpen} onOpenNotifications={onOpenNotifications} onOpenProfile={onOpenProfile} profilePhoto={profilePhoto} />
    </motion.aside>
  );
}

// ── Profile avatar (photo or fallback icon) ──────────────────────────────────
function ProfileAvatar({ photo, size = 28 }: { photo?: string | null; size?: number }) {
  if (photo) {
    return (
      <img 
        src={photo} 
        alt="Profile" 
        className="rounded-full object-cover border border-white/[0.08] shadow-[0_0_8px_rgba(168,85,247,0.15)]" 
        style={{ width: size, height: size }} 
      />
    );
  }
  return (
    <div 
      className="rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0" 
      style={{ width: size, height: size }}
    >
      <User className="text-[var(--dash-text-muted)]" style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}

function SidebarFooter({ isOpen, onOpenNotifications, onOpenProfile, profilePhoto }: { isOpen: boolean; onOpenNotifications: () => void; onOpenProfile: () => void; profilePhoto?: string | null }) {
  const { t } = useI18n();
  return (
    <div className="p-3 border-t border-white/[0.04] flex flex-col gap-1">
      <button 
        onClick={onOpenNotifications}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm relative group text-[var(--dash-text-secondary)] hover:bg-white/[0.04] hover:text-[var(--dash-text)] ${!isOpen ? 'justify-center' : ''}`}
      >
        <Bell className="w-5 h-5 shrink-0 group-hover:text-[var(--dash-accent)] transition-colors" />
        {!isOpen && (
           <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[var(--dash-red)] rounded-full animate-pulse" />
        )}
        <AnimatePresence mode="popLayout">
          {isOpen && (
            <motion.div 
              key="nav-item-Notifications"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="whitespace-nowrap overflow-hidden text-sm text-left flex-1 flex justify-between items-center"
            >
              <span>{t('notifications')}</span>
              <span className="w-1.5 h-1.5 bg-[var(--dash-red)] rounded-full animate-pulse mr-2" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      
      <NavItem icon={Settings} label={t('settings')} to="/dashboard/settings" isOpen={isOpen} />
      
      <div className="mt-1 pt-1 border-t border-white/[0.04]">
        <button onClick={onOpenProfile} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-[var(--dash-text-secondary)] hover:bg-white/[0.04] hover:text-[var(--dash-text)] ${!isOpen && 'justify-center'}`}>
          <ProfileAvatar photo={profilePhoto} size={28} />
          <AnimatePresence mode="popLayout">
            {isOpen && (
              <motion.span 
                key="sidebar-profile-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden text-sm text-left flex-1"
              >
                {t('my_profile')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, to, isOpen, badge }: any) {
  return (
    <NavLink 
      to={to}
      title={!isOpen ? label : undefined}
      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm relative group ${
      isActive 
        ? 'bg-white/[0.06] text-[var(--dash-text)] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]' 
        : 'text-[var(--dash-text-secondary)] hover:bg-white/[0.04] hover:text-[var(--dash-text)]'
      } ${!isOpen ? 'justify-center' : ''}`}
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[var(--dash-accent)]' : 'text-[var(--dash-text-muted)] group-hover:text-[var(--dash-accent)]'} transition-colors`} />
          
          {badge && !isOpen && (
             <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[var(--dash-red)] rounded-full animate-pulse" />
          )}

          <AnimatePresence mode="popLayout">
            {isOpen && (
              <motion.div 
                key={`nav-item-${label}`}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden text-sm text-left flex-1 flex justify-between items-center"
              >
                <span>{label}</span>
                {badge && (
                  <span className="w-1.5 h-1.5 bg-[var(--dash-red)] rounded-full animate-pulse mr-2" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  );
}