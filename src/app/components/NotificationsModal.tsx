import { X, Bell, AlertTriangle, Info, CheckCircle2, Thermometer, Droplets, TrendingUp, Users, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../contexts/I18nContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: string[];
  // Live data from the current Dashboard room
  co2?: number;
  temperature?: number;
  humidity?: number;
  occupancy?: number;
  plants?: number;
  spikeAlert?: boolean;
  roomName?: string;
}

interface Notification {
  type: 'danger' | 'warning' | 'info' | 'success';
  room: string;
  message: string;
  icon: typeof AlertTriangle;
}

export function NotificationsModal({ isOpen, onClose, rooms, co2 = 0, temperature = 0, humidity = 0, occupancy = 0, plants = 0, spikeAlert, roomName }: NotificationsModalProps) {
  const { t } = useI18n();
  const room = roomName || 'Default';
  
  const getAdvisories = (): Notification[] => {
    const alerts: Notification[] = [];

    // CO2 spike
    if (spikeAlert) {
      alerts.push({ type: 'danger', room, message: `Rapid CO₂ spike to ${co2} ppm detected. Open windows and increase ventilation immediately.`, icon: TrendingUp });
    }

    // CO2 levels
    if (co2 >= 800) {
      alerts.push({ type: 'danger', room, message: `Critical CO₂ level at ${co2} ppm — far above safe limit of 700 ppm. Evacuate or ventilate.`, icon: Wind });
    } else if (co2 >= 700) {
      alerts.push({ type: 'warning', room, message: `CO₂ elevated at ${co2} ppm — approaching warning threshold. Increase ventilation.`, icon: Wind });
    }

    // Temperature
    if (temperature > 28) {
      alerts.push({ type: 'danger', room, message: `High temperature at ${temperature}°C — uncomfortably hot. Turn on AC immediately.`, icon: Thermometer });
    } else if (temperature > 25) {
      alerts.push({ type: 'warning', room, message: `Warm conditions at ${temperature}°C — consider cooling the room.`, icon: Thermometer });
    } else if (temperature > 0 && temperature < 18) {
      alerts.push({ type: 'warning', room, message: `Low temperature at ${temperature}°C — turn on heating.`, icon: Thermometer });
    }

    // Humidity
    if (humidity > 60) {
      alerts.push({ type: 'warning', room, message: `High humidity at ${humidity}% — use a dehumidifier to prevent mold.`, icon: Droplets });
    } else if (humidity > 50) {
      alerts.push({ type: 'info', room, message: `Humidity slightly elevated at ${humidity}% — above ideal range (35-50%).`, icon: Droplets });
    } else if (humidity > 0 && humidity < 30) {
      alerts.push({ type: 'info', room, message: `Low humidity at ${humidity}% — air is dry. Use a humidifier.`, icon: Droplets });
    }

    // Occupancy
    if (occupancy > 15 && plants < 3) {
      alerts.push({ type: 'info', room, message: `High occupancy (${occupancy} people) with only ${plants} plants. Add more greenery to improve air quality.`, icon: Users });
    }

    if (alerts.length === 0 && co2 > 0) {
      alerts.push({ type: 'success', room: 'System', message: `All environmental conditions in ${room} are currently optimal. CO₂ ${co2} ppm, ${temperature}°C, ${humidity}%.`, icon: CheckCircle2 });
    }

    if (alerts.length === 0) {
      alerts.push({ type: 'info', room: 'System', message: 'Waiting for sensor data from ESP32...', icon: Info });
    }

    return alerts;
  };

  const advisories = getAdvisories();

  const dangerCount = advisories.filter(a => a.type === 'danger').length;
  const warningCount = advisories.filter(a => a.type === 'warning').length;

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
            className="fixed top-1/2 left-1/2 w-full max-w-2xl z-[101] overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(20,20,22,0.85) 0%, rgba(11,11,13,0.90) 100%)',
              backdropFilter: 'blur(24px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
              border: '1px solid rgba(168,85,247,0.15)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.03), 0 24px 64px rgba(0,0,0,0.6), 0 0 60px rgba(168,85,247,0.08)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h2 className="text-xl font-bold text-[var(--dash-text)] flex items-center gap-3 tracking-tight">
                <Bell className="text-[var(--dash-violet)] w-5 h-5" />
                {t('system_notifications')}
                {dangerCount > 0 && (
                  <span className="text-[10px] font-bold bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20 animate-pulse">
                    {dangerCount} {t('critical')}
                  </span>
                )}
                {warningCount > 0 && dangerCount === 0 && (
                  <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {warningCount} {t('warning_label')}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t('live')}
                </div>
                <button onClick={onClose} className="text-[var(--dash-text-muted)] hover:text-[var(--dash-text)] transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="p-6 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="flex flex-col gap-3">
                {advisories.map((adv, i) => {
                  const Icon = adv.icon;
                  const colorMap = {
                    danger:  { bg: 'rgba(255,55,95,0.08)', border: 'rgba(255,55,95,0.2)', text: '#FF375F' },
                    warning: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', text: '#F97316' },
                    info:    { bg: 'rgba(10,132,255,0.08)', border: 'rgba(10,132,255,0.2)', text: '#0A84FF' },
                    success: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', text: '#34d399' },
                  };
                  const c = colorMap[adv.type];

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl flex items-start gap-4 group transition-all hover:scale-[1.01]"
                      style={{
                        background: c.bg,
                        border: `1px solid ${c.border}`,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.border}` }}>
                        <Icon className="w-5 h-5" style={{ color: c.text }} />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 text-[var(--dash-text)] text-sm flex items-center gap-2">
                          {adv.room}
                          {adv.type === 'danger' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
                        </h4>
                        <p className="text-[0.8125rem] leading-relaxed" style={{ color: c.text, opacity: 0.9 }}>{adv.message}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}