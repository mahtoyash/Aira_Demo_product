/**
 * Co2ModelService — Per-Room LSTM Weight Persistence + Online Learning natively off-threaded via Web Worker
 */

import { getAuth } from 'firebase/auth';
import { db } from '../utils/firebase';
import { ref as dbRef, set as dbSet, get as dbGet, query as dbQuery, orderByKey, startAfter, limitToLast } from 'firebase/database';

const BASE_WEIGHTS_URL = '/model/base_weights.json';

export interface PredictionResult {
  predict10: number;
  predict30: number;
  predict60: number;
}

export interface Co2Reading {
  co2: number; temperature: number; humidity: number;
  occupancy: number; hour: number; minute: number; day_of_week: number;
}

interface WeightEntry { data: number[]; shape: number[]; }

// ── Helpers ───────────────────────────────────────────────────────────────────
function getUid(): string {
  return getAuth().currentUser?.uid ?? 'anonymous';
}

function cacheKey(uid: string, roomId: string) {
  return `co2_weights_${uid}_${roomId}`;
}

// ── localStorage cache ────────────────────────────────────────────────────────
function saveCache(uid: string, roomId: string, entries: WeightEntry[]): void {
  try {
    const thisKey = cacheKey(uid, roomId);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('co2_weights_') && key !== thisKey) {
        localStorage.removeItem(key);
      }
    }
    localStorage.setItem(thisKey, JSON.stringify(entries));
    console.log(`[Model] ✓ Cached weights in localStorage for "${roomId}"`);
  } catch {
    console.warn('[Model] localStorage save failed — skipping cache');
  }
}

function loadCache(uid: string, roomId: string): WeightEntry[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid, roomId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    localStorage.removeItem(cacheKey(uid, roomId));
    return null;
  }
}

// ── Firebase Realtime Database (no CORS, WebSocket-based) ────────────────────
function rtdbPath(uid: string, roomId: string): string {
  const safe = roomId.replace(/[.#$\[\]]/g, '_');
  return `model_weights/${uid}/${safe}`;
}

async function uploadToRTDB(uid: string, roomId: string, entries: WeightEntry[]): Promise<void> {
  try {
    const path = rtdbPath(uid, roomId);
    console.log(`[Model] Uploading weights to RTDB: /${path}`);
    await dbSet(dbRef(db, path), JSON.stringify(entries));
    console.log(`[Model] ✓ Weights saved to RTDB for room "${roomId}"`);
  } catch (err: any) {
    console.error(`[Model] ✗ RTDB upload FAILED for room "${roomId}":`, err?.message || err);
  }
}

async function downloadFromRTDB(uid: string, roomId: string): Promise<WeightEntry[] | null> {
  try {
    const path = rtdbPath(uid, roomId);
    console.log(`[Model] Checking RTDB: /${path}`);
    const snap = await dbGet(dbRef(db, path));
    if (!snap.exists()) return null;
    const raw = snap.val();
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(data) || data.length === 0) return null;
    return data;
  } catch (err: any) {
    return null;
  }
}

async function getLastTrainKey(uid: string, roomId: string): Promise<string | null> {
  try {
    const safe = roomId.replace(/[.#$\[\]]/g, '_');
    const snap = await dbGet(dbRef(db, `model_weights/${uid}/${safe}_trainkey`));
    return snap.exists() ? String(snap.val()) : null;
  } catch {
    return null;
  }
}

async function setLastTrainKey(uid: string, roomId: string, key: string): Promise<void> {
  try {
    const safe = roomId.replace(/[.#$\[\]]/g, '_');
    await dbSet(dbRef(db, `model_weights/${uid}/${safe}_trainkey`), key);
  } catch {}
}

export async function getNewReadingsCount(
  roomId: string,
): Promise<{ newCount: number; lastKey: string | null }> {
  const uid = getUid();
  const lastKey = await getLastTrainKey(uid, roomId);
  const dbPath = roomId === 'default' ? 'readings' : `rooms/${roomId}/readings`;

  try {
    let snap;
    if (lastKey) {
      snap = await dbGet(dbQuery(dbRef(db, dbPath), orderByKey(), startAfter(lastKey)));
    } else {
      snap = await dbGet(dbQuery(dbRef(db, dbPath), orderByKey(), limitToLast(600)));
    }
    const newCount = snap.exists() ? Object.keys(snap.val()).length : 0;
    return { newCount, lastKey };
  } catch (err: any) {
    return { newCount: 0, lastKey };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Model Service using Web Worker to heavily prevent mobile UI freezes
// ─────────────────────────────────────────────────────────────────────────────

export class Co2ModelService {
  private worker: Worker | null = null;
  private reqId = 0;
  private currentRoom: string | null = null;
  private activePromises = new Map<number, { resolve: Function; reject: Function }>();
  private onProgressCallback: ((epoch: number, total: number, loss: number) => void) | null = null;

  private isReady = false;
  private isLoading = false;
  private isFinetuning = false;

  private activeWeights: WeightEntry[] | null = null; // cached locally for immediate saving

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (this.worker) return;
    this.worker = new Worker(new URL('./tf.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        this.onProgressCallback?.(e.data.epoch, e.data.total, e.data.loss);
        return;
      }
      const { id, success, result, error } = e.data;
      if (this.activePromises.has(id)) {
        const { resolve, reject } = this.activePromises.get(id)!;
        this.activePromises.delete(id);
        if (success) resolve(result);
        else reject(new Error(error));
      }
    };
  }

  private runTask(action: string, payload: any): Promise<any> {
    this.initWorker();
    return new Promise((resolve, reject) => {
      const id = ++this.reqId;
      this.activePromises.set(id, { resolve, reject });
      this.worker!.postMessage({ id, action, payload });
    });
  }

  async loadModel(roomId: string): Promise<void> {
    if (this.isReady && this.currentRoom === roomId) return;
    if (this.isFinetuning) {
      while (this.isFinetuning) await new Promise(r => setTimeout(r, 500));
    }
    this.isLoading = true;
    this.isReady = false;
    this.currentRoom = roomId;
    const uid = getUid();
    
    try {
      // Look for cached weights
      let weights = loadCache(uid, roomId);
      if (!weights) {
        weights = await downloadFromRTDB(uid, roomId);
        if (weights) saveCache(uid, roomId, weights);
      }

      // Delegate loading entirely to the non-blocking Worker
      const res = await this.runTask('initModel', { 
         weights, 
         useBaseWeightsFallback: !weights 
      });

      this.activeWeights = res.activeWeights;
      this.isReady = true;

      // Ensure that if it loaded fallback base_weights (or initialized random), we persist them to FTDB and Cache for next load
      if (!weights && this.activeWeights) {
          saveCache(uid, roomId, this.activeWeights);
          uploadToRTDB(uid, roomId, this.activeWeights);
      }

    } catch (e) {
      console.error('[Model Worker] Init failed', e);
    } finally {
      this.isLoading = false;
    }
  }

  async finetuneOnHistory(
    history: Co2Reading[],
    roomId: string,
    onProgress?: (epoch: number, total: number, loss: number) => void
  ): Promise<{ samplesUsed: number; finalLoss: number } | null> {
    if (!this.isReady || this.currentRoom !== roomId || this.isFinetuning) return null;
    if (history.length < 84) return null;

    this.isFinetuning = true;
    this.onProgressCallback = onProgress || null;

    try {
      const res = await this.runTask('train', { history });
      if (res && res.newWeights) {
        this.activeWeights = res.newWeights; // update local cache
        await this.saveWeights(roomId);
        return { samplesUsed: res.samplesUsed, finalLoss: res.finalLoss };
      }
      return null;
    } catch (e) {
      console.warn('[Model Worker] Train aborted or failed', e);
      return null;
    } finally {
      this.isFinetuning = false;
      this.onProgressCallback = null;
    }
  }

  async saveLastTrainKey(roomId: string, key: string): Promise<void> {
    await setLastTrainKey(getUid(), roomId, key);
  }

  async saveWeights(roomId: string): Promise<void> {
    if (!this.isReady || !this.activeWeights) return;
    const uid = getUid();
    saveCache(uid, roomId, this.activeWeights);
    await uploadToRTDB(uid, roomId, this.activeWeights);
  }

  async predict(history: Co2Reading[]): Promise<PredictionResult | null> {
    if (!this.isReady || history.length < 24) return null;
    try {
      return await this.runTask('predict', { history });
    } catch {
      return null;
    }
  }
}

export const co2ModelService = new Co2ModelService();
