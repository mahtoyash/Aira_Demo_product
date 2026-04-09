/**
 * CO2 Background Training Worker
 * ================================
 * Runs as a background Node.js process — no browser needed.
 * Listens to Firebase RTDB for new readings in every room,
 * and auto-trains the LSTM model every 30 new readings.
 *
 * Usage:
 *   1. Place your service account key at training-worker/serviceAccountKey.json
 *   2. npm install
 *   3. npm start  (or: node worker.js)
 *
 * The worker will run forever, training whenever new data arrives.
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Firebase Admin Init ─────────────────────────────────────────────────────
const keyPath = join(__dirname, 'serviceAccountKey.json');
if (!existsSync(keyPath)) {
  console.error(`\n❌  Service account key not found at:\n   ${keyPath}\n`);
  console.error('Download it from Firebase Console:');
  console.error('  → Project Settings → Service Accounts → Generate New Private Key');
  console.error('  → Save the JSON file as "serviceAccountKey.json" in this folder\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))),
  databaseURL: 'https://co2-monitor-effff-default-rtdb.asia-southeast1.firebasedatabase.app',
});

const db = admin.database();
console.log('✓ Firebase Admin connected\n');

// ─── Model Constants (must match Co2ModelService.ts exactly) ─────────────────
const SEQ_LEN       = 24;
const FEATURE_MIN   = [11.6, 21.8, 0.0,   400.0,  0.0, 0.0, 0.0];
const FEATURE_MAX   = [25.6, 80.9, 29.0, 1368.0, 23.0, 6.0, 59.0];
const TARGET_MIN    = 400.0;
const TARGET_MAX    = 1368.0;
const MIN_REQUIRED  = SEQ_LEN + 60; // 84 readings needed for 1 training sample
const TRAIN_THRESHOLD = 300;        // only train when ≥300 NEW readings available
const CHECK_INTERVAL_MS = 300 * 60 * 1000; // check every 300 minutes

// ─── TF.js (lazy loaded) ────────────────────────────────────────────────────
let tf = null;
async function getTf() {
  if (!tf) {
    console.log('[TF] Loading TensorFlow.js...');
    tf = await import('@tensorflow/tfjs');
    await tf.ready();
    console.log(`[TF] ✓ Ready (backend: ${tf.getBackend()})\n`);
  }
  return tf;
}

// ─── Scaling helpers ─────────────────────────────────────────────────────────
function scaleRow(row) {
  return row.map((val, i) => {
    const range = FEATURE_MAX[i] - FEATURE_MIN[i];
    if (range === 0) return 0;
    return Math.max(-1, Math.min(2, (val - FEATURE_MIN[i]) / range));
  });
}

function scaleCo2(co2) {
  return (co2 - TARGET_MIN) / (TARGET_MAX - TARGET_MIN);
}

// ─── Build model architecture ────────────────────────────────────────────────
async function buildModel() {
  const tf = await getTf();
  const m = tf.sequential();
  m.add(tf.layers.lstm({ units: 128, returnSequences: true, inputShape: [SEQ_LEN, 7] }));
  m.add(tf.layers.lstm({ units: 128, returnSequences: false }));
  m.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  m.add(tf.layers.dropout({ rate: 0.2 }));
  m.add(tf.layers.dense({ units: 3 }));
  m.compile({ optimizer: tf.train.adam(0.0005), loss: 'meanSquaredError' });
  // Warm up
  const dummy = m.predict(tf.zeros([1, SEQ_LEN, 7]));
  dummy.dispose();
  return m;
}

// ─── Load weights from RTDB ─────────────────────────────────────────────────
async function loadWeightsFromRTDB(uid, roomId) {
  const safe = roomId.replace(/[.#$\[\]]/g, '_');
  const snap = await db.ref(`model_weights/${uid}/${safe}`).get();
  if (!snap.exists()) return null;
  try {
    const data = JSON.parse(snap.val());
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}

// ─── Save weights to RTDB ───────────────────────────────────────────────────
async function saveWeightsToRTDB(uid, roomId, entries) {
  const safe = roomId.replace(/[.#$\[\]]/g, '_');
  await db.ref(`model_weights/${uid}/${safe}`).set(JSON.stringify(entries));
}

// ─── Last train key persistence ─────────────────────────────────────────────
async function getLastTrainKey(uid, roomId) {
  const safe = roomId.replace(/[.#$\[\]]/g, '_');
  const snap = await db.ref(`model_weights/${uid}/${safe}_trainkey`).get();
  return snap.exists() ? String(snap.val()) : null;
}

async function setLastTrainKey(uid, roomId, key) {
  const safe = roomId.replace(/[.#$\[\]]/g, '_');
  await db.ref(`model_weights/${uid}/${safe}_trainkey`).set(key);
  console.log(`  ✓ Saved lastTrainKey for "${roomId}": ${key}`);
}

// ─── Count new readings since last training ─────────────────────────────────
async function countNewReadings(path, uid, roomId) {
  const lastKey = await getLastTrainKey(uid, roomId);
  let snap;
  if (lastKey) {
    snap = await db.ref(path).orderByKey().startAfter(lastKey).get();
  } else {
    // Never trained → cap at 600 to avoid massive first-run
    snap = await db.ref(path).orderByKey().limitToLast(600).get();
  }
  const newCount = snap.exists() ? Object.keys(snap.val()).length : 0;
  return { newCount, lastKey };
}

// ─── Apply weights to model ─────────────────────────────────────────────────
async function applyWeights(model, entries) {
  const tf = await getTf();
  try {
    const tensors = entries.map(w => tf.tensor(w.data, w.shape));
    model.setWeights(tensors);
    tensors.forEach(t => t.dispose());
    return true;
  } catch (err) {
    console.error('[Model] setWeights failed:', err.message);
    return false;
  }
}

// ─── Extract weights from model ──────────────────────────────────────────────
function extractWeights(model) {
  return model.getWeights().map(t => ({
    data: Array.from(t.dataSync()),
    shape: t.shape,
  }));
}

// ─── Load base weights from file ─────────────────────────────────────────────
function loadBaseWeights(model) {
  const basePath = join(__dirname, '..', 'public', 'model', 'base_weights.json');
  if (!existsSync(basePath)) {
    console.error(`[Model] base_weights.json not found at ${basePath}`);
    return null;
  }
  const raw = JSON.parse(readFileSync(basePath, 'utf8'));
  const shapes = model.weights.map(w => w.shape);
  if (raw.length !== shapes.length) {
    console.error(`[Model] Weight count mismatch: ${raw.length} vs ${shapes.length}`);
    return null;
  }
  return raw.map((w, i) => ({
    data: Array.isArray(w) ? w.flat(Infinity) : [w],
    shape: shapes[i],
  }));
}

// ─── Parse Firebase reading into standard format ────────────────────────────
function parseReading(r) {
  return {
    co2:         Number(r.CO2 ?? r.co2 ?? 0) || 0,
    temperature: Number(r.Temperature ?? r.temperature ?? 0) || 0,
    humidity:    Number(r.Humidity ?? r.humidity ?? 0) || 0,
    occupancy:   Number(r.Occupancy ?? r.occupancy ?? 0) || 0,
    day_of_week: Number(r.day_of_week ?? r.dayOfWeek ?? 0) || 0,
    hour:        Number(r.hour ?? 0) || 0,
    minute:      Number(r.minute ?? 0) || 0,
  };
}

// ─── Train on history ────────────────────────────────────────────────────────
async function trainOnHistory(model, history, roomId) {
  if (history.length < MIN_REQUIRED) {
    console.log(`  ⏭  Only ${history.length} readings (need ${MIN_REQUIRED}) — skipping`);
    return null;
  }

  const tf = await getTf();
  const EPOCHS = 3;
  const xs = [];
  const ys = [];

  for (let i = 0; i <= history.length - MIN_REQUIRED; i++) {
    const win = history.slice(i, i + SEQ_LEN);
    const co2_10 = history[i + SEQ_LEN + 9]?.co2;
    const co2_30 = history[i + SEQ_LEN + 29]?.co2;
    const co2_60 = history[i + SEQ_LEN + 59]?.co2;

    if (!co2_10 || !co2_30 || !co2_60) continue;

    const inputRow = win.map(r => {
      const dow = r.day_of_week === 0 ? 6 : r.day_of_week - 1;
      return scaleRow([r.temperature, r.humidity, r.occupancy, r.co2, r.hour, dow, r.minute]);
    });

    if (inputRow.some(row => row.some(v => isNaN(v) || !isFinite(v)))) continue;

    xs.push(inputRow);
    ys.push([scaleCo2(co2_10), scaleCo2(co2_30), scaleCo2(co2_60)]);
  }

  if (xs.length < 5) {
    console.log(`  ⏭  Only ${xs.length} valid samples — skipping`);
    return null;
  }

  console.log(`  🧠 Training on ${xs.length} samples × ${EPOCHS} epochs...`);
  const xTensor = tf.tensor3d(xs);
  const yTensor = tf.tensor2d(ys);
  let finalLoss = 0;

  try {
    const result = await model.fit(xTensor, yTensor, {
      epochs: EPOCHS,
      batchSize: Math.min(32, xs.length),
      shuffle: true,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          finalLoss = logs?.loss ?? 0;
          console.log(`     Epoch ${epoch + 1}/${EPOCHS} — loss: ${finalLoss.toFixed(6)}`);
        },
      },
    });
    finalLoss = result.history.loss[EPOCHS - 1] ?? finalLoss;
  } finally {
    xTensor.dispose();
    yTensor.dispose();
  }

  return { samplesUsed: xs.length, finalLoss };
}

// ─── Get all UIDs that have saved weights ───────────────────────────────────
async function getStoredUIDs() {
  const snap = await db.ref('model_weights').get();
  if (!snap.exists()) return [];
  return Object.keys(snap.val());
}

// ─── Train a single room (shared logic) ─────────────────────────────────────
async function trainRoom(model, uid, roomId, path) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`[${roomId}] Checking for new readings...`);

  const { newCount } = await countNewReadings(path, uid, roomId);
  console.log(`[${roomId}] ${newCount} new readings since last training`);

  if (newCount < TRAIN_THRESHOLD) {
    console.log(`[${roomId}] Only ${newCount}/${TRAIN_THRESHOLD} — skipping`);
    console.log(`${'─'.repeat(50)}\n`);
    return;
  }

  console.log(`[${roomId}] ≥${TRAIN_THRESHOLD} new readings — training triggered!`);

  try {
    const fetchCount = newCount + 84; // new + context window
    const histSnap = await db.ref(path).orderByKey().limitToLast(fetchCount).get();
    if (!histSnap.exists()) return;

    const history = [];
    let latestKey = '';
    histSnap.forEach(child => {
      latestKey = child.key;
      history.push(parseReading(child.val()));
    });
    console.log(`  📊 Fetched ${history.length} readings (${newCount} new + context)`);

    // Load existing weights for this room
    const existing = await loadWeightsFromRTDB(uid, roomId);
    if (existing) {
      const ok = await applyWeights(model, existing);
      if (ok) console.log(`  ✓ Loaded existing weights for "${roomId}"`);
      else {
        console.log(`  ⚠ Bad weights — using base model`);
        const base = loadBaseWeights(model);
        if (base) await applyWeights(model, base);
      }
    } else {
      console.log(`  ℹ No saved weights — using base model`);
      const base = loadBaseWeights(model);
      if (base) await applyWeights(model, base);
    }

    // Train
    const result = await trainOnHistory(model, history, roomId);

    if (result) {
      const entries = extractWeights(model);
      await saveWeightsToRTDB(uid, roomId, entries);
      await setLastTrainKey(uid, roomId, latestKey);
      console.log(`  ✓ Saved ${entries.length} weight tensors to RTDB`);
      console.log(`  ✓ Done — ${result.samplesUsed} samples, loss: ${result.finalLoss.toFixed(6)}`);
    }
  } catch (err) {
    console.error(`  ✗ Training error for "${roomId}":`, err.message);
  }

  console.log(`${'─'.repeat(50)}\n`);
}

// ─── Main: Periodic check + train ────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  CO2 Background Training Worker');
  console.log('  Checks every 300 min for ≥300 new readings,');
  console.log('  then trains the LSTM model.');
  console.log('═══════════════════════════════════════════════════\n');

  const tf = await getTf();
  let model = await buildModel();
  console.log('[Model] Architecture built\n');

  // Discover rooms
  console.log('[Worker] Scanning for rooms...');
  const roomsSnap = await db.ref('rooms').get();
  const rooms = roomsSnap.exists() ? Object.keys(roomsSnap.val()) : [];
  console.log(`[Worker] Found rooms: ${rooms.length > 0 ? rooms.join(', ') : '(none)'}`);

  const allPaths = [
    { roomId: 'default', path: 'readings' },
    ...rooms.map(r => ({ roomId: r, path: `rooms/${r}/readings` })),
  ];

  // Get UIDs for weight storage
  const uids = await getStoredUIDs();
  const uid = uids.length > 0 ? uids[0] : 'anonymous';
  console.log(`[Worker] Using UID: ${uid}\n`);

  // ── Run a full check across all rooms ─────────────────────────────────────
  async function fullCheck() {
    console.log(`\n[Worker] ═══ Full training check (${new Date().toLocaleTimeString()}) ═══`);

    // Re-discover rooms (new ones may have been added)
    const freshSnap = await db.ref('rooms').get();
    const freshRooms = freshSnap.exists() ? Object.keys(freshSnap.val()) : [];
    const paths = [
      { roomId: 'default', path: 'readings' },
      ...freshRooms.map(r => ({ roomId: r, path: `rooms/${r}/readings` })),
    ];

    for (const { roomId, path } of paths) {
      await trainRoom(model, uid, roomId, path);
    }

    console.log('[Worker] ═══ Check complete ═══\n');
  }

  // ── Immediate check on startup ────────────────────────────────────────────
  await fullCheck();

  // ── Periodic check every 300 minutes ──────────────────────────────────────
  setInterval(fullCheck, CHECK_INTERVAL_MS);

  console.log(`[Worker] ✓ Next check in ${TRAIN_THRESHOLD} minutes`);
  console.log('[Worker] Press Ctrl+C to stop\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
