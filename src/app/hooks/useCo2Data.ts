import { useState, useEffect, useRef } from 'react';
import { db, ref, onValue, query, limitToLast, get, set } from '../utils/firebase';
import { resolveTemporalFields } from '../utils/pushKeyTime';

export interface Co2Reading {
  co2: number;
  temperature: number;
  humidity: number;
  occupancy: number;
  hour: number;
  minute: number;
  day_of_week: number;
}

/**
 * Firebase hook that reads from the correct path:
 * - If roomId is set → reads from rooms/{roomId}/readings
 * - If roomId is empty → reads from /readings (default ESP32 path)
 */
export function useCo2Data(roomId?: string) {
  const [history, setHistory] = useState<Co2Reading[]>([]);
  const [currentRecord, setCurrentRecord] = useState<Co2Reading | null>(null);
  const [spikeAlert, setSpikeAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const prevCo2Ref = useRef<number | null>(null);

  useEffect(() => {
    // Clear stale data immediately when room changes
    setHistory([]);
    setCurrentRecord(null);
    setSpikeAlert(false);
    setIsLoading(true);
    prevCo2Ref.current = null;

    // Determine the Firebase path based on room selection
    const dbPath = roomId ? `rooms/${roomId}/readings` : 'readings';
    const readingsQuery = query(ref(db, dbPath), limitToLast(500));

    console.log(`[useCo2Data] Listening to: /${dbPath}`);

    const unsub = onValue(readingsQuery, (snapshot) => {
      if (!snapshot.exists()) {
        console.warn(`[useCo2Data] No data at /${dbPath}`);
        setHistory([]);
        setCurrentRecord(null);
        setIsLoading(false);
        return;
      }


      const newHistory: Co2Reading[] = [];

      snapshot.forEach((childSnap) => {
        const raw = childSnap.val();
        if (!raw) return;

        // Resolve temporal fields — falls back to push-key timestamp
        // when ESP32 NTP has failed (all zeros).
        const { hour, minute, day_of_week } = resolveTemporalFields(raw, childSnap.key);

        const mapped: Co2Reading = {
          co2: Number(raw.CO2 ?? raw.co2 ?? raw.Co2) || 0,
          temperature: Number(raw.Temperature ?? raw.temperature ?? raw.temp) || 0,
          humidity: Number(raw.Humidity ?? raw.humidity ?? raw.hum) || 0,
          occupancy: Number(raw.Occupancy ?? raw.occupancy ?? raw.occ) || 0,
          day_of_week,
          hour,
          minute,
        };
        newHistory.push(mapped);
      });

      console.log(`[useCo2Data] Loaded ${newHistory.length} readings from /${dbPath}`);
      if (newHistory.length > 0) {
        const latest = newHistory[newHistory.length - 1];
        console.log(`[useCo2Data] Latest: CO2=${latest.co2}, T=${latest.temperature}, H=${latest.humidity}, Occ=${latest.occupancy}`);
      }

      setHistory(newHistory);

      const latest = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
      if (latest) {
        setCurrentRecord(latest);
        const prev = prevCo2Ref.current;
        if (prev !== null && (latest.co2 - prev) >= 200) {
          setSpikeAlert(true);
        } else {
          setSpikeAlert(false);
        }
        prevCo2Ref.current = latest.co2;
      }
      setIsLoading(false);
    }, (error) => {
      console.error('[useCo2Data] Firebase error:', error);
    });

    return () => unsub();
  }, [roomId]);

  // Write occupancy to:
  // 1. The last reading record (so ML model and history have correct value)
  // 2. config/manual_occupancy (so ESP32 can read it and show on OLED)
  const updateOccupancy = async (newOccupancy: number) => {
    try {
      const dbPath = roomId ? `rooms/${roomId}/readings` : 'readings';
      const q = query(ref(db, dbPath), limitToLast(1));
      const snap = await get(q);
      if (snap.exists()) {
        const obj = snap.val();
        const keys = Object.keys(obj);
        if (keys.length > 0) {
          const lastKey = keys[keys.length - 1];
          // Update the reading record (TitleCase matches ESP32 format)
          await set(ref(db, `${dbPath}/${lastKey}/Occupancy`), newOccupancy);
          console.log(`[useCo2Data] Occupancy updated in reading to ${newOccupancy}`);
        }
      }

      // Also write to a simple config path so the ESP32 can read it via REST API
      // ESP32 polls: GET https://<db>.firebaseio.com/config/manual_occupancy.json
      await set(ref(db, 'config/manual_occupancy'), newOccupancy);
      console.log(`[useCo2Data] config/manual_occupancy set to ${newOccupancy}`);
    } catch (err) {
      console.error('[useCo2Data] updateOccupancy failed:', err);
    }
  };

  return { history, currentRecord, spikeAlert, updateOccupancy, isLoading };
}

