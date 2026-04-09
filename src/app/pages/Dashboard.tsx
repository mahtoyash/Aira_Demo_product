import { useState, useEffect, useRef, useMemo } from 'react';
import { Wind, Coins, Thermometer, Droplets, Users, Leaf, Brain } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { RoomEfficiencyCard } from '../components/RoomEfficiencyCard';
import { ChartSection } from '../components/ChartSection';
import { ActivityFeed } from '../components/ActivityFeed';
import { RoomSelector } from '../components/RoomSelector';
import { PredictionCard } from '../components/PredictionCard';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { useOutletContext } from 'react-router';
import { useCo2Data } from '../hooks/useCo2Data';
import { co2ModelService, getNewReadingsCount, type PredictionResult, type Co2Reading } from '../services/Co2ModelService';
import { db, ref, query, limitToLast, get, orderByKey, startAfter } from '../utils/firebase';
import { resolveTemporalFields } from '../utils/pushKeyTime';
import { useI18n } from '../contexts/I18nContext';

export function Dashboard() {
  const {
    isSidebarOpen,
    isMobile,
    rooms,
    dashboardRoom,
    setDashboardRoom,
    getRoomConfig,
    updateRoomConfig,
    seedRoomConfig,
    handleAddRoom,
    CREDITS_MAX,
    setLiveData,
  } = useOutletContext<any>();

  // Firebase data for the dashboard's selected room
  const { currentRecord, history, spikeAlert, updateOccupancy, isLoading } = useCo2Data(dashboardRoom || undefined);

  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  // ── Online learning state ─────────────────────────────────────────────────
  const [isTraining,   setIsTraining]  = useState(false);
  const [trainingInfo, setTrainingInfo] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TRAIN_THRESHOLD = 300;        // min new readings required
  const MAX_TRAIN_READINGS = 600;     // cap to avoid overfitting on stale data
  const CHECK_INTERVAL_MS = 300 * 60 * 1000; // 300 minutes

  const roomKey = dashboardRoom || '__default__';
  const config = getRoomConfig(roomKey);

  // ── Seed occupancy from DB on room change (only if not manually overridden) ─
  useEffect(() => {
    if (currentRecord && currentRecord.occupancy > 0) {
      seedRoomConfig(roomKey, currentRecord.occupancy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRecord?.occupancy, roomKey]);

  // Live sensor values
  const currentCo2  = currentRecord?.co2 ?? 0;
  const currentTemp = currentRecord?.temperature ?? 0;
  const currentHum  = currentRecord?.humidity ?? 0;

  // MANUAL DOMINATES: config.occupancy is always authoritative once set
  const currentOcc    = config.occupancy;
  const currentPlants = config.plants;

  // ── Credits computed LIVE from CO2 PPM (not stored — Firebase IS the storage) ─
  const co2Credits = useMemo(() => {
    if (currentCo2 === 0) return CREDITS_MAX;
    return Math.max(0, Math.min(CREDITS_MAX, Math.round(((1000 - currentCo2) / 600) * CREDITS_MAX)));
  }, [currentCo2, CREDITS_MAX]);

  // Push live sensor data up to Root for NotificationsModal
  useEffect(() => {
    if (setLiveData && currentCo2 > 0) {
      setLiveData({ co2: currentCo2, temperature: currentTemp, humidity: currentHum, occupancy: currentOcc, plants: currentPlants, spikeAlert });
    }
  }, [currentCo2, currentTemp, currentHum, currentOcc, currentPlants, spikeAlert, setLiveData]);

  // ── Core training function: checks new readings count & trains if ≥300 ────
  const checkAndTrain = async (modelRoom: string) => {
    if (!modelRoom || modelRoom === 'default') return;

    try {
      setTrainingInfo('Checking for new readings...');
      const { newCount } = await getNewReadingsCount(modelRoom);
      console.log(`[Training] Room "${modelRoom}": ${newCount} new readings since last training`);

      if (newCount < TRAIN_THRESHOLD) {
        console.log(`[Training] Only ${newCount} new readings (need ${TRAIN_THRESHOLD}) — skipping`);
        setTrainingInfo(`${newCount}/${TRAIN_THRESHOLD} new readings — not enough yet`);
        setTimeout(() => setTrainingInfo(''), 5000);
        return;
      }

      // Cap readings to avoid overfitting; prefer recent data
      const cappedNew = Math.min(newCount, MAX_TRAIN_READINGS);
      const dbPath = `rooms/${modelRoom}/readings`;
      const fetchCount = cappedNew + 84; // capped new readings + context window
      setIsTraining(true);
      setTrainingInfo(`Fetching ${fetchCount} readings (${cappedNew} new, capped from ${newCount})...`);

      const snap = await get(query(ref(db, dbPath), limitToLast(fetchCount)));
      if (!snap.exists()) {
        setIsTraining(false);
        setTrainingInfo('');
        return;
      }

      const rows: Co2Reading[] = [];
      let latestKey = '';
      snap.forEach((c: any) => {
        latestKey = c.key; // last key in chronological order
        const r = c.val();
        const { hour, minute, day_of_week } = resolveTemporalFields(r, c.key);
        rows.push({
          co2:         Number(r.CO2 ?? r.co2) || 0,
          temperature: Number(r.Temperature ?? r.temperature) || 0,
          humidity:    Number(r.Humidity ?? r.humidity) || 0,
          occupancy:   Number(r.Occupancy ?? r.occupancy) || 0,
          day_of_week,
          hour,
          minute,
        });
      });

      console.log(`[Training] Training on ${rows.length} readings (${cappedNew} capped from ${newCount} new + context)`);
      setTrainingInfo(`Training on ${rows.length} readings...`);

      const result = await co2ModelService.finetuneOnHistory(
        rows, modelRoom,
        (ep, tot, loss) => setTrainingInfo(`Epoch ${ep}/${tot} — loss: ${loss.toFixed(5)}`),
      );

      if (result) {
        // Save the last key so next time we only count readings after this point
        await co2ModelService.saveLastTrainKey(modelRoom, latestKey);
        console.log(`[Training] ✓ Done: ${result.samplesUsed} samples, loss=${result.finalLoss.toFixed(6)}`);
        setTrainingInfo(`✓ Trained on ${result.samplesUsed} samples (loss: ${result.finalLoss.toFixed(5)})`);
        setTimeout(() => setTrainingInfo(''), 8000);
      } else {
        setTrainingInfo('');
      }
    } catch (err) {
      console.error('[Training] Error:', err);
      setTrainingInfo('');
    } finally {
      setIsTraining(false);
    }
  };

  // ── Load model + immediate training check on room change ───────────────────
  useEffect(() => {
    // Only attempt to initialize the heavy ML model AFTER the real UI data has loaded.
    // This prevents the main thread from blocking (via tfjs bundle downloads or initial tf compilation)
    // while the user is simply trying to see the dashboard.
    if (isLoading) return;

    setModelLoaded(false);
    setPredictions(null);
    setIsTraining(false);
    setTrainingInfo('');

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const modelRoom = dashboardRoom || 'default';
    
    // Defer the heavy Tensorflow model initialisation until the browser is completely idle.
    // This effectively utilizes a non-blocking approach giving the user smooth screen access immediately.
    const timer = setTimeout(() => {
      const loadHeavyModelAndTrain = async () => {
        try {
          await co2ModelService.loadModel(modelRoom);
          setModelLoaded(true);

          // ── Immediate check: train if ≥300 new readings ──────────────────
          await checkAndTrain(modelRoom);

          // ── Set up periodic check every 300 minutes ──────────────────────
          if (modelRoom !== 'default') {
            intervalRef.current = setInterval(() => {
              console.log('[Training] Periodic check (every 300 min)...');
              checkAndTrain(modelRoom);
            }, CHECK_INTERVAL_MS);
          }
        } catch (error) {
          console.error('[Model Background Loader] Error:', error);
        }
      };

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => loadHeavyModelAndTrain(), { timeout: 4000 });
      } else {
        // Fallback for older Safari/browsers
        setTimeout(loadHeavyModelAndTrain, 500);
      }
    }, 2000); // Wait 2 seconds post-render before even enqueueing the ML bootup

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardRoom, isLoading]);

  // Expose training globally for browser console (window.trainNow("Hall"))
  useEffect(() => {
    (window as any).trainNow = async (room?: string) => {
      const target = room || dashboardRoom || 'default';
      const dbPath = target !== 'default' ? `rooms/${target}/readings` : 'readings';
      const snap   = await get(query(ref(db, dbPath), limitToLast(384)));
      if (!snap.exists()) { console.warn('[Console] No data found'); return; }
      const rows: Co2Reading[] = [];
      let latestKey = '';
      snap.forEach((c: any) => {
        latestKey = c.key;
        const r = c.val();
        const { hour, minute, day_of_week } = resolveTemporalFields(r, c.key);
        rows.push({
          co2:         Number(r.CO2 ?? r.co2) || 0,
          temperature: Number(r.Temperature ?? r.temperature) || 0,
          humidity:    Number(r.Humidity ?? r.humidity) || 0,
          occupancy:   Number(r.Occupancy ?? r.occupancy) || 0,
          day_of_week,
          hour,
          minute,
        });
      });
      const result = await co2ModelService.finetuneOnHistory(rows, target,
        (ep, tot, loss) => console.log(`Epoch ${ep}/${tot} loss=${loss.toFixed(6)}`));
      if (result && latestKey) {
        await co2ModelService.saveLastTrainKey(target, latestKey);
      }
      return result;
    };
    (window as any).checkTraining = async (room?: string) => {
      const target = room || dashboardRoom || 'default';
      const { newCount, lastKey } = await getNewReadingsCount(target);
      console.log(`[Console] Room "${target}": ${newCount} new readings since key "${lastKey}"`);
      return { newCount, lastKey, threshold: TRAIN_THRESHOLD };
    };
    (window as any).saveWeights = (room?: string) => {
      const target = room || dashboardRoom || 'default';
      return co2ModelService.saveWeights(target);
    };
    (window as any).co2ModelService = co2ModelService;
    return () => {
      delete (window as any).trainNow;
      delete (window as any).checkTraining;
      delete (window as any).saveWeights;
      delete (window as any).co2ModelService;
    };
  }, [dashboardRoom]);

  useEffect(() => {
    if (!modelLoaded || history.length < 24) return;
    co2ModelService.predict(history).then(result => {
      if (result) setPredictions(result);
    });
  }, [history, modelLoaded]);

  // ── Occupancy controls — manual dominates (credit = f(CO2), not occupancy) ─
  const handleOccupancyIncrement = async () => {
    const newVal = Math.min(currentOcc + 1, 100);
    updateRoomConfig(roomKey, { occupancy: newVal, occupancyManuallySet: true });
    await updateOccupancy(newVal);
  };

  const handleOccupancyDecrement = async () => {
    const newVal = Math.max(currentOcc - 1, 0);
    updateRoomConfig(roomKey, { occupancy: newVal, occupancyManuallySet: true });
    await updateOccupancy(newVal);
  };

  // ── Plants controls (local only) ─────────────────────────────────────────
  const handlePlantsIncrement = () =>
    updateRoomConfig(roomKey, { plants: Math.min(currentPlants + 1, 20) });
  const handlePlantsDecrement = () =>
    updateRoomConfig(roomKey, { plants: Math.max(currentPlants - 1, 0) });

  const isConnected = currentRecord !== null;

  // Skeleton loading state
  const [showSkeleton, setShowSkeleton] = useState(true);

  // i18n — must be above conditional returns (Rules of Hooks)
  const { t } = useI18n();
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowSkeleton(false), 400);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(true);
    }
  }, [isLoading]);

  if (showSkeleton) return <DashboardSkeleton />;

  const statGrid6 = (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 shrink-0">
      <StatCard title={t('current_co2')} value={`${currentCo2} ppm`} icon={Wind} showMeter meterValue={currentCo2} maxMeterValue={1000} />
      <StatCard
        title={t('credit_remaining')}
        value={`${co2Credits} CR`}
        icon={Coins}
        showHealthBar
        healthBarCurrent={co2Credits}
        healthBarMax={CREDITS_MAX}
      />
      <StatCard title={t('occupancy')} value={String(currentOcc)} icon={Users} showControls onIncrement={handleOccupancyIncrement} onDecrement={handleOccupancyDecrement} />
      <StatCard title={t('plants')}    value={String(currentPlants)} icon={Leaf} showControls onIncrement={handlePlantsIncrement} onDecrement={handlePlantsDecrement} />
      <StatCard title={t('humidity')}      value={`${currentHum}%`}  icon={Droplets} />
      <StatCard title={t('avg_temperature')} value={`${currentTemp}°C`} icon={Thermometer} />
    </div>
  );

  const statGrid7 = (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4 shrink-0">
      <StatCard title={t('current_co2')} value={`${currentCo2} ppm`} icon={Wind} showMeter meterValue={currentCo2} maxMeterValue={1000} />
      <RoomEfficiencyCard co2={currentCo2} occupancy={currentOcc} plants={currentPlants} ventilation={4} />
      <StatCard
        title={t('credit_remaining')}
        value={`${co2Credits} CR`}
        icon={Coins}
        showHealthBar
        healthBarCurrent={co2Credits}
        healthBarMax={CREDITS_MAX}
      />
      <StatCard title={t('occupancy')} value={String(currentOcc)} icon={Users} showControls onIncrement={handleOccupancyIncrement} onDecrement={handleOccupancyDecrement} />
      <StatCard title={t('plants')}    value={String(currentPlants)} icon={Leaf} showControls onIncrement={handlePlantsIncrement} onDecrement={handlePlantsDecrement} />
      <StatCard title={t('humidity')}      value={`${currentHum}%`}  icon={Droplets} />
      <StatCard title={t('avg_temperature')} value={`${currentTemp}°C`} icon={Thermometer} />
    </div>
  );

  const predCard = (
    <div className="relative">
      <PredictionCard
        currentValue={currentCo2}
        predict10={predictions?.predict10 ?? null}
        predict30={predictions?.predict30 ?? null}
        predict60={predictions?.predict60 ?? null}
      />
      {/* Training status badge */}
      {(isTraining || trainingInfo) && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          display: 'flex', alignItems: 'center', gap: 6,
          background: isTraining ? 'rgba(168,85,247,0.15)' : 'rgba(52,211,153,0.15)',
          border: `1px solid ${isTraining ? 'rgba(168,85,247,0.4)' : 'rgba(52,211,153,0.4)'}`,
          borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600,
          color: isTraining ? '#C4B5FD' : '#6ee7b7',
          backdropFilter: 'blur(8px)', zIndex: 10,
        }}>
          <Brain size={12} style={{ animation: isTraining ? 'spin 1.5s linear infinite' : 'none' }} />
          {isTraining ? trainingInfo || 'Training...' : trainingInfo}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between shrink-0 gap-3">
        <div>
          <h2 className="text-[var(--dash-text)] text-xl md:text-2xl font-semibold tracking-tight flex items-center flex-wrap gap-2">
            {t('system_overview')}
            <RoomSelector
              rooms={rooms}
              selectedRoom={dashboardRoom}
              setSelectedRoom={setDashboardRoom}
              handleAddRoom={handleAddRoom}
            />
          </h2>
          <p className="text-[var(--dash-text-muted)] mt-0.5 text-sm font-normal">{t('air_monitoring')}</p>
        </div>

        <div className="text-xs text-[var(--dash-text-secondary)] font-medium dash-card px-3 py-1.5 rounded-lg w-fit">
          {!isConnected ? (
            <span className="text-[var(--dash-violet)] font-bold">{t('connecting')}</span>
          ) : spikeAlert ? (
            <>{t('system_status')}: <span className="text-[var(--dash-red)] font-bold">{t('co2_spike')}</span></>
          ) : (
            <>{t('system_status')}: <span className="text-[var(--dash-accent)] font-bold">{t('optimal')}</span></>
          )}
        </div>
      </div>

      {isSidebarOpen && !isMobile ? (
        <>
          {statGrid6}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6 flex-1 min-h-0">
            <div className="xl:col-span-3 flex flex-col gap-4 md:gap-6 h-full">
              <div className="h-[350px] md:h-[400px] shrink-0">
                <ChartSection history={history} />
              </div>
              <div className="flex-1 min-h-[200px]">
                <ActivityFeed co2={currentCo2} temperature={currentTemp} humidity={currentHum} occupancy={currentOcc} plants={currentPlants} spikeAlert={spikeAlert} roomName={dashboardRoom || 'Default'} />
              </div>
            </div>
            <div className="flex flex-col gap-4 md:gap-6 h-full">
              <div className="h-[350px] md:h-[400px] shrink-0">
                <RoomEfficiencyCard co2={currentCo2} occupancy={currentOcc} plants={currentPlants} ventilation={4} />
              </div>
              <div className="flex-1 min-h-[200px]">{predCard}</div>
            </div>
          </div>
        </>
      ) : (
        <>
          {statGrid7}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6 min-h-0">
            <div className="xl:col-span-3 h-[350px] md:h-[450px]">
              <ChartSection history={history} />
            </div>
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="min-h-[320px]">{predCard}</div>
              <div className="min-h-[200px]"><ActivityFeed co2={currentCo2} temperature={currentTemp} humidity={currentHum} occupancy={currentOcc} plants={currentPlants} spikeAlert={spikeAlert} roomName={dashboardRoom || 'Default'} /></div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
