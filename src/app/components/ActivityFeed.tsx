import { AlertCircle, Activity, Thermometer, Droplets, Users, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface ActivityFeedProps {
  co2?: number;
  temperature?: number;
  humidity?: number;
  occupancy?: number;
  plants?: number;
  spikeAlert?: boolean;
  roomName?: string;
}

interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  icon: typeof AlertCircle;
  title: string;
  description: string;
  time: string;
  color: string;
}

function generateAlerts(props: ActivityFeedProps, t: (key: string, params?: Record<string, string | number>) => string): Alert[] {
  const { co2 = 0, temperature = 0, humidity = 0, occupancy = 0, plants = 0, spikeAlert, roomName } = props;
  const room = roomName || 'Default';
  const alerts: Alert[] = [];

  if (spikeAlert) {
    alerts.push({ id: 'spike', type: 'danger', icon: TrendingUp, title: t('co2_spike_detected'), description: t('rapid_co2_increase', { co2, room }), time: t('just_now'), color: '#FF375F' });
  }
  if (co2 >= 800) {
    alerts.push({ id: 'co2-high', type: 'danger', icon: AlertCircle, title: t('high_co2_warning'), description: t('co2_exceeds_limit', { room, co2 }), time: t('live'), color: '#FF375F' });
  } else if (co2 >= 700) {
    alerts.push({ id: 'co2-elevated', type: 'warning', icon: AlertTriangle, title: t('co2_elevated'), description: t('co2_approaching_threshold', { room, co2 }), time: t('live'), color: '#F97316' });
  }
  if (temperature > 28) {
    alerts.push({ id: 'temp-hot', type: 'warning', icon: Thermometer, title: t('high_temperature'), description: t('uncomfortably_warm', { room, temp: temperature }), time: t('live'), color: '#F97316' });
  } else if (temperature > 25) {
    alerts.push({ id: 'temp-warm', type: 'info', icon: Thermometer, title: t('warm_conditions'), description: t('consider_cooling', { room, temp: temperature }), time: t('live'), color: '#0A84FF' });
  } else if (temperature > 0 && temperature < 18) {
    alerts.push({ id: 'temp-cold', type: 'warning', icon: Thermometer, title: t('low_temperature'), description: t('heating_recommended', { room, temp: temperature }), time: t('live'), color: '#F97316' });
  }
  if (humidity > 60) {
    alerts.push({ id: 'hum-high', type: 'warning', icon: Droplets, title: t('high_humidity'), description: t('use_dehumidifier', { room, hum: humidity }), time: t('live'), color: '#0A84FF' });
  } else if (humidity > 50) {
    alerts.push({ id: 'hum-moderate', type: 'info', icon: Droplets, title: t('elevated_humidity'), description: t('slightly_above_ideal', { room, hum: humidity }), time: t('live'), color: '#0A84FF' });
  } else if (humidity > 0 && humidity < 30) {
    alerts.push({ id: 'hum-low', type: 'info', icon: Droplets, title: t('low_humidity'), description: t('air_is_dry', { room, hum: humidity }), time: t('live'), color: '#0A84FF' });
  }
  if (occupancy > 15 && plants < 3) {
    alerts.push({ id: 'occ-plants', type: 'info', icon: Users, title: t('occupancy_advisory'), description: t('add_more_greenery', { occ: occupancy, room, plants }), time: t('live'), color: '#A855F7' });
  }
  if (alerts.length === 0 && co2 > 0) {
    alerts.push({ id: 'all-clear', type: 'success', icon: CheckCircle2, title: t('all_systems_normal'), description: t('air_quality_optimal', { room, co2, temp: temperature, hum: humidity }), time: t('live'), color: '#34d399' });
  }
  if (alerts.length === 0) {
    alerts.push({ id: 'waiting', type: 'info', icon: Activity, title: t('awaiting_data'), description: t('waiting_for_sensor'), time: '—', color: '#5A5A65' });
  }
  return alerts;
}

export function ActivityFeed(props: ActivityFeedProps) {
  const { t } = useI18n();
  const alerts = generateAlerts(props, t);

  return (
    <div className="dash-card p-5 xl:p-6 h-full flex flex-col relative overflow-hidden">
      {/* Top highlight */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--dash-violet)]/10 to-transparent" />

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[var(--dash-text)] text-base font-semibold flex items-center gap-2">
          <span className="w-1.5 h-5 bg-[var(--dash-pink)] rounded-sm inline-block" />
          {t('system_alerts')}
          {alerts.length > 0 && alerts[0].type !== 'success' && alerts[0].id !== 'waiting' && (
            <span className="ml-2 text-[10px] font-bold bg-[var(--dash-red)]/15 text-[var(--dash-red)] px-2 py-0.5 rounded-full border border-[var(--dash-red)]/20 animate-pulse">
              {alerts.filter(a => a.type === 'danger').length || ''} {t('active')}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--dash-text-muted)] bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.04]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {t('live')}
        </div>
      </div>
      
      <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex gap-3 p-3 hover:bg-white/[0.02] border border-transparent hover:border-white/[0.04] rounded-xl transition-all group cursor-pointer">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all duration-300 bg-white/[0.03]"
              style={{ borderColor: `${alert.color}20` }}
            >
              <alert.icon className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: alert.color }} />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="text-[var(--dash-text)] font-medium text-sm">{alert.title}</div>
              <div className="text-[var(--dash-text-muted)] text-xs font-normal mt-0.5 truncate">{alert.description}</div>
            </div>
            <div className="text-[var(--dash-text-muted)] text-[10px] font-mono whitespace-nowrap pt-1 flex items-center gap-1">
              {alert.time === 'live' && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse inline-block" />}
              {alert.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}