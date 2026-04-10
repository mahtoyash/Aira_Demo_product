import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { LimelightNav } from './ui/limelight-nav';
import { useAuth } from '../contexts/AuthContext';
import RegistrationModal from './RegistrationModal';
import VisionModal from './VisionModal';
import MLModelModal from './MLModelModal';

export default function Hero() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showVision, setShowVision] = useState(false);
  const [showMLModel, setShowMLModel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = async () => {
    if (user) {
      navigate('/dashboard');
    } else {
      try {
        await signIn();
        navigate('/dashboard');
      } catch (err) {
        console.error('Login failed', err);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section className="relative min-h-[100dvh] flex items-start justify-center pt-[140px] sm:pt-[240px] md:pt-[300px] lg:pt-[360px] w-full overflow-hidden font-[family-name:var(--font-geist)]">
      {/* Background Video & Overlays */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover object-center"
        >
          <source
            src={import.meta.env.BASE_URL + "background.mp4"}
            type="video/mp4"
          />
        </video>
        
        {/* Fading White Gradient at the base so it seamlessly meets the next section */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 md:from-black/10 via-transparent to-white z-20" />
      </div>

      {/* Navigation Taskbar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-8 py-3 md:py-4 w-full backdrop-blur-md bg-white/50 border-b border-white/20 transition-all"
      >
        {/* Logo */}
        <div className="flex-1 flex items-center justify-start gap-2">
          <span className="text-[28px] sm:text-[36px] md:text-[42px] font-bold text-gray-900 tracking-tighter">Aira</span>
        </div>

        {/* Taskbar */}
        <div className="hidden xl:flex flex-none items-center justify-center py-3 px-4 xl:px-8">
          <LimelightNav 
            items={[
              { name: 'About us', menu: ['Team', 'Vision'] },
              { name: 'Our Product', menu: ['Features', 'Specs', 'ML Model'] },
              { name: 'Pricing', menu: ['Plans', 'Enterprise'] }
            ]}
            onSubItemClick={(e, subItem) => {
              if (subItem === 'Vision') {
                e.preventDefault();
                setShowVision(true);
              }
              if (subItem === 'ML Model') {
                e.preventDefault();
                setShowMLModel(true);
              }
            }}
          />
        </div>

        {/* Right Actions */}
        <div className="hidden xl:flex flex-1 items-center justify-end gap-4 xl:gap-6">
          {!user && (
            <button 
              onClick={() => setShowRegistration(true)}
              className="text-base lg:text-[22px] font-medium text-black hover:opacity-70 transition-opacity pointer-events-auto"
            >
              Sign Up
            </button>
          )}
          <button 
            onClick={handleAuthAction}
            className="px-5 lg:px-8 py-2.5 lg:py-3 rounded-full bg-black text-white text-base lg:text-[22px] font-medium shadow-sm hover:opacity-90 transition-opacity pointer-events-auto"
          >
            {user ? 'Open Dashboard' : 'Log In'}
          </button>
        </div>

        {/* Mobile Hamburger (Shows on tablet/iPad now too) */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="xl:hidden flex flex-col gap-1.5 p-2 pointer-events-auto"
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-gray-900 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-[65px] sm:top-[75px] left-0 right-0 z-40 backdrop-blur-xl bg-white/90 shadow-xl border-b border-gray-200 flex flex-col items-center gap-4 py-6 xl:hidden"
        >
          <button className="text-lg font-medium text-gray-900 hover:opacity-70" onClick={() => { setShowVision(true); setMobileMenuOpen(false); }}>About Us</button>
          <button className="text-lg font-medium text-gray-900 hover:opacity-70" onClick={() => { setShowMLModel(true); setMobileMenuOpen(false); }}>Our Product</button>
          <button className="text-lg font-medium text-gray-900 hover:opacity-70">Pricing</button>
          <div className="w-32 border-t border-gray-200 my-1" />
          {!user && (
            <button 
              onClick={() => { setShowRegistration(true); setMobileMenuOpen(false); }}
              className="text-lg font-medium text-gray-900 hover:opacity-70"
            >
              Sign Up
            </button>
          )}
          <button 
            onClick={() => { handleAuthAction(); setMobileMenuOpen(false); }}
            className="px-8 py-2.5 rounded-full bg-black text-white text-lg font-medium"
          >
            {user ? 'Open Dashboard' : 'Log In'}
          </button>
        </motion.div>
      )}

      {/* Content Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-30 w-full max-w-[1400px] px-4 sm:px-6 md:px-8 mx-auto flex flex-col items-center justify-center text-center gap-6 md:gap-8 pointer-events-auto"
      >
        {/* Main Heading positioned cleanly over the video again */}
        <motion.h1 
          variants={itemVariants} 
          className="text-white text-[32px] sm:text-[48px] md:text-[72px] lg:text-[96px] xl:text-[110px] font-semibold leading-[1.1] sm:leading-[1.05] tracking-[-0.03em] m-0 drop-shadow-2xl pb-6 md:pb-12"
        >
          Predicting the Unseen, <br /> Safeguarding your <span className="font-[family-name:var(--font-instrument)] font-normal italic text-[36px] sm:text-[54px] md:text-[80px] lg:text-[115px] xl:text-[130px] leading-[1]">Indoor Air</span>
        </motion.h1>
      </motion.div>

      <RegistrationModal 
        isOpen={showRegistration} 
        onClose={() => setShowRegistration(false)} 
      />
      <VisionModal 
        isOpen={showVision} 
        onClose={() => setShowVision(false)} 
      />
      <MLModelModal 
        isOpen={showMLModel} 
        onClose={() => setShowMLModel(false)} 
      />
    </section>
  );
}
