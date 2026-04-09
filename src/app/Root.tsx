import { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate } from 'react-router';
import { Sidebar } from './components/Sidebar';
import { NotificationsModal } from './components/NotificationsModal';
import { ProfileModal } from './components/ProfileModal';
import { db, ref, set, onValue, query, limitToLast, get } from './utils/firebase';
import { pushKeyToDate } from './utils/pushKeyTime';
import { useAuth } from './contexts/AuthContext';

import { DeviceVerificationGuard } from './components/DeviceVerificationGuard';

/** Hook: detect if viewport < given width */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

/** Per-room manual config */
export interface RoomConfig {
  plants: number;
  occupancy: number;
  occupancyManuallySet?: boolean; // true = user manually overrode, don't auto-seed from DB
}

/** Max credit value — credits are computed live from CO2 PPM, not stored */
export const CREDITS_MAX = 1000;

export function Root() {
  const { user, loading: authLoading, signOut } = useAuth();
  const isMobile = useIsMobile(768);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [rooms, setRooms] = useState<string[]>([]);

  // ── Independent room selections per page ──────────────────────────────────
  const [dashboardRoom, setDashboardRoomState] = useState('');   // Home / Dashboard
  const [analysisRoom, setAnalysisRoomState] = useState('');     // Room Analysis

  // ── The room the ESP32 is currently writing to (from Firebase) ───────────
  const [activeEspRoom, setActiveEspRoom] = useState<string>('');

  const [roomConfigs, setRoomConfigs] = useState<Record<string, RoomConfig>>({});
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  // ── Profile photo (global so sidebar + header can use it) ────────────
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // ── Live sensor data (for NotificationsModal) ────────────────────────
  const [liveData, setLiveData] = useState<{ co2: number; temperature: number; humidity: number; occupancy: number; plants: number; spikeAlert: boolean }>(
    { co2: 0, temperature: 0, humidity: 0, occupancy: 0, plants: 0, spikeAlert: false }
  );

  // Real display name from Google account
  const userName = user?.displayName ?? user?.email ?? 'User';

  // Credits are computed live from CO2 PPM in each page — no state needed here

  // ── Sync active ESP room from Firebase ───────────────────────────────────
  useEffect(() => {
    const unsub = onValue(ref(db, 'config/active_room'), snap => {
      setActiveEspRoom(snap.val() ?? '');
    });
    return () => unsub();
  }, []);

  // ── Load existing rooms from Firebase ────────────────────────────────────
  useEffect(() => {
    const unsub = onValue(ref(db, 'rooms'), snap => {
      if (snap.exists()) {
        const names = Object.keys(snap.val());
        setRooms(prev => Array.from(new Set([...prev, ...names])));
      }
    });
    return () => unsub();
  }, []);

  // ── Room config helpers ───────────────────────────────────────────────────
  const getRoomConfig = useCallback((roomId: string): RoomConfig => {
    return roomConfigs[roomId] ?? { plants: 0, occupancy: 0, occupancyManuallySet: false };
  }, [roomConfigs]);

  const updateRoomConfig = useCallback((roomId: string, updates: Partial<RoomConfig>) => {
    setRoomConfigs(prev => ({
      ...prev,
      [roomId]: { ...(prev[roomId] ?? { plants: 0, occupancy: 0 }), ...updates },
    }));
  }, []);

  /**
   * Seed occupancy from DB reading — only if the user has NOT manually overridden it yet.
   * Called when currentRecord arrives for a room.
   */
  const seedRoomConfig = useCallback((roomId: string, occupancy: number) => {
    setRoomConfigs(prev => {
      const existing = prev[roomId];
      if (existing?.occupancyManuallySet) return prev; // keep manual override
      return {
        ...prev,
        [roomId]: {
          plants: existing?.plants ?? 0,
          occupancy,
          occupancyManuallySet: false,
        },
      };
    });
  }, []);

  // ── Add a new room ────────────────────────────────────────────────────────
  const handleAddRoom = useCallback(async (roomName: string) => {
    if (!roomName.trim() || rooms.includes(roomName.trim())) return;
    const name = roomName.trim();
    await set(ref(db, `rooms/${name}/created`), Date.now());
    await set(ref(db, 'config/active_room'), name);
    setRooms(prev => [...prev, name]);
    setDashboardRoomState(name);
    setRoomConfigs(prev => ({
      ...prev,
      [name]: { plants: 0, occupancy: 0, occupancyManuallySet: false },
    }));
  }, [rooms]);

  // ── Dashboard room setter — also updates Firebase active_room (ESP32 target) ─
  const setDashboardRoom = useCallback(async (roomName: string) => {
    setDashboardRoomState(roomName);
    try {
      await set(ref(db, 'config/active_room'), roomName || null);
    } catch (e) {
      console.error('[Root] Failed to update active_room:', e);
    }
  }, []);

  // ── Analysis room setter — purely local, does NOT affect ESP32 ───────────
  const setAnalysisRoom = useCallback((roomName: string) => {
    setAnalysisRoomState(roomName);
  }, []);

  // ── DATA RELAY: copy new /readings entries → rooms/{activeEspRoom}/readings ─
  useEffect(() => {
    if (!activeEspRoom) return;

    let cancelled = false;
    let cleanupRef: (() => void) | null = null;

    // Start the relay ONLY after we know the last existing key in the room
    // to avoid re-relaying old readings that already exist in the room.
    (async () => {
      // Find the latest key already in the room (the destination)
      let lastKnownKey = '';
      try {
        const roomSnap = await get(query(ref(db, `rooms/${activeEspRoom}/readings`), limitToLast(1)));
        if (roomSnap.exists()) {
          const keys = Object.keys(roomSnap.val());
          lastKnownKey = keys[keys.length - 1] || '';
        }
      } catch { /* room may not exist yet */ }

      // Also check global /readings for the latest key (pick the greater of the two)
      try {
        const globalSnap = await get(query(ref(db, 'readings'), limitToLast(1)));
        if (globalSnap.exists()) {
          const keys = Object.keys(globalSnap.val());
          const globalLast = keys[keys.length - 1] || '';
          if (globalLast > lastKnownKey) lastKnownKey = globalLast;
        }
      } catch { /* ignore */ }

      if (cancelled) return;

      // Now start listening — only relay entries with keys AFTER lastKnownKey
      const readingsQuery = query(ref(db, 'readings'), limitToLast(3));
      const unsub = onValue(readingsQuery, snapshot => {
        if (!snapshot.exists() || !activeEspRoom) return;
        snapshot.forEach(childSnap => {
          const key = childSnap.key!;
          if (key > lastKnownKey) {
            const raw = childSnap.val();
            // Derive the REAL creation time from the Firebase push key.
            // Accurate even for readings that accumulated while dashboard was offline.
            const createdAt = pushKeyToDate(key);
            const patched = {
              ...raw,
              hour:        createdAt.getHours(),
              minute:      createdAt.getMinutes(),
              day_of_week: createdAt.getDay(),   // 0 = Sunday, matches tm_wday
            };
            set(ref(db, `rooms/${activeEspRoom}/readings/${key}`), patched);
            lastKnownKey = key;
          }
        });
      });

      // Store unsub so cleanup can call it
      if (!cancelled) {
        cleanupRef = unsub;
      } else {
        unsub();
      }
    })();
    return () => {
      cancelled = true;
      if (cleanupRef) cleanupRef();
    };
  }, [activeEspRoom]);

  // ── Auto-collapse sidebar on mobile ─────────────────────────────────────
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

  // ── Auth guards ───────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0B0B0D', fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(168,85,247,0.2)',
            borderTop: '3px solid #A855F7',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return (
    <DeviceVerificationGuard>
      <div
        className={`h-screen w-full flex flex-row overflow-hidden ${theme === 'light' ? 'light-theme' : 'dark'}`}
      style={{
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        userName={userName}
        isMobile={isMobile}
        profilePhoto={profilePhoto}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/[0.06] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/[0.1]">
        <div className={`max-w-[1800px] mx-auto h-full flex flex-col gap-4 md:gap-6 xl:gap-8 ${isMobile ? 'pt-12' : ''}`}>
          <Outlet context={{
            isSidebarOpen,
            isMobile,
            rooms,
            dashboardRoom,
            setDashboardRoom,
            analysisRoom,
            setAnalysisRoom,
            activeEspRoom,
            theme, setTheme,
            roomConfigs,
            getRoomConfig,
            updateRoomConfig,
            seedRoomConfig,
            handleAddRoom,
            CREDITS_MAX,
            profilePhoto,
            setProfilePhoto,
            liveData,
            setLiveData,
          }} />
        </div>
      </main>

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        rooms={rooms}
        co2={liveData.co2}
        temperature={liveData.temperature}
        humidity={liveData.humidity}
        occupancy={liveData.occupancy}
        plants={liveData.plants}
        spikeAlert={liveData.spikeAlert}
        roomName={dashboardRoom || 'Default'}
      />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userName={userName}
        setUserName={() => {}}
        profilePhoto={profilePhoto}
        onProfilePhotoChange={setProfilePhoto}
      />
    </div>
    </DeviceVerificationGuard>
  );
}