import * as tfType from '@tensorflow/tfjs';

let tf: typeof tfType | null = null;
let model: any = null;

const SEQ_LEN = 24;
const FEATURE_MIN = [11.6, 21.8, 0.0, 400.0, 0.0, 0.0, 0.0];
const FEATURE_MAX = [25.6, 80.9, 29.0, 1368.0, 23.0, 6.0, 59.0];
const TARGET_MIN = 400.0;
const TARGET_MAX = 1368.0;

function scaleRow(row: number[]): number[] {
  return row.map((val, i) => {
    const range = FEATURE_MAX[i] - FEATURE_MIN[i];
    if (range === 0) return 0;
    return Math.max(-1, Math.min(2, (val - FEATURE_MIN[i]) / range));
  });
}

function scaleCo2(co2: number): number {
  return (co2 - TARGET_MIN) / (TARGET_MAX - TARGET_MIN);
}

function unscale(val: number): number {
  return val * (TARGET_MAX - TARGET_MIN) + TARGET_MIN;
}

// ── Build model architecture ──
async function buildModel() {
  if (!tf) tf = await import('@tensorflow/tfjs');
  
  if (model) {
    try { model.dispose(); } catch {}
  }
  const m = tf.sequential();
  m.add(tf.layers.lstm({ units: 128, returnSequences: true, inputShape: [SEQ_LEN, 7] }));
  m.add(tf.layers.lstm({ units: 128, returnSequences: false }));
  m.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  m.add(tf.layers.dropout({ rate: 0.2 }));
  m.add(tf.layers.dense({ units: 3 }));
  m.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
  const dummy = m.predict(tf.zeros([1, SEQ_LEN, 7])) as any;
  dummy.dispose();
  model = m;
}

// ── Base weights fallback ──
async function loadBaseWeights() {
  try {
    const resp = await fetch('/model/base_weights.json');
    if (!resp.ok) return null;
    const raw: any[] = await resp.json();
    const shapes: number[][] = (model.weights as any[]).map((w: any) => w.shape);
    if (raw.length !== shapes.length) return null;
    return raw.map((w: any, i: number) => ({
      data: (Array.isArray(w) ? w.flat(Infinity) : [w]) as number[],
      shape: shapes[i],
    }));
  } catch {
    return null;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { id, action, payload } = e.data;

  try {
    if (!tf) {
      tf = await import('@tensorflow/tfjs');
    }

    if (action === 'initModel') {
      await buildModel();
      let weights = payload.weights;
      
      if (!weights && payload.useBaseWeightsFallback) {
         weights = await loadBaseWeights();
      }

      if (weights) {
        const tensors = weights.map((w: any) => tf!.tensor(w.data, w.shape));
        model.setWeights(tensors);
        tensors.forEach((t: any) => t.dispose());
      }
      
      let finalWeights = weights;
      if (!finalWeights) {
         // return the initialized randomized weights if everything failed
         finalWeights = (model.getWeights() as any[]).map((t: any) => ({
            data: Array.from(t.dataSync() as Float32Array),
            shape: t.shape as number[],
         }));
      }

      self.postMessage({ id, success: true, result: { activeWeights: finalWeights } });
    } 
    else if (action === 'predict') {
      if (!model) throw new Error('Model not initialized in worker');
      const { history } = payload;
      const lastSeq = history.slice(-SEQ_LEN);
      const scaled = lastSeq.map((r: any) => {
        const dow = r.day_of_week === 0 ? 6 : r.day_of_week - 1;
        return scaleRow([r.temperature, r.humidity, r.occupancy, r.co2, r.hour, dow, r.minute]);
      });
      const input = tf.tensor3d([scaled], [1, SEQ_LEN, 7]);
      const output = model.predict(input) as any;
      const preds = Array.from(await output.data()) as number[];
      input.dispose(); output.dispose();
      
      self.postMessage({ 
        id, 
        success: true, 
        result: {
          predict10: Math.round(unscale(preds[0])),
          predict30: Math.round(unscale(preds[1])),
          predict60: Math.round(unscale(preds[2]))
        } 
      });
    }
    else if (action === 'train') {
      if (!model) throw new Error('Model not initialized in worker');
      const { history } = payload;
      const MIN_REQUIRED = SEQ_LEN + 60;
      
      model.compile({ optimizer: tf.train.adam(0.0003), loss: 'meanSquaredError' });

      const allXs: number[][][] = [];
      const allYs: number[][] = [];

      for (let i = 0; i <= history.length - MIN_REQUIRED; i++) {
        const win = history.slice(i, i + SEQ_LEN);
        const co2_10 = history[i + SEQ_LEN + 9]?.co2;
        const co2_30 = history[i + SEQ_LEN + 29]?.co2;
        const co2_60 = history[i + SEQ_LEN + 59]?.co2;

        if (!co2_10 || !co2_30 || !co2_60) continue;

        const inputRow = win.map((r: any) => {
          const dow = r.day_of_week === 0 ? 6 : r.day_of_week - 1;
          return scaleRow([r.temperature, r.humidity, r.occupancy, r.co2, r.hour, dow, r.minute]);
        });

        allXs.push(inputRow);
        allYs.push([scaleCo2(co2_10), scaleCo2(co2_30), scaleCo2(co2_60)]);
      }

      if (allXs.length < 5) {
        self.postMessage({ id, success: false, error: 'Not enough valid samples' });
        return;
      }

      const MAX_SAMPLES = 600;
      const xs = allXs.length > MAX_SAMPLES ? allXs.slice(-MAX_SAMPLES) : allXs;
      const ys = allYs.length > MAX_SAMPLES ? allYs.slice(-MAX_SAMPLES) : allYs;
      
      const xTrain = tf.tensor3d(xs);
      const yTrain = tf.tensor2d(ys);
      
      let finalLoss = 0;
      const result = await model.fit(xTrain, yTrain, {
        epochs: 5,
        batchSize: Math.min(32, xs.length),
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch: number, logs: any) => {
            finalLoss = logs?.loss ?? 0;
            self.postMessage({ type: 'progress', epoch: epoch + 1, total: 5, loss: finalLoss });
          }
        }
      });
      finalLoss = (result.history.loss as number[])[result.history.loss.length - 1] ?? finalLoss;
      
      xTrain.dispose(); yTrain.dispose();

      const entries = (model.getWeights() as any[]).map((t: any) => ({
        data: Array.from(t.dataSync() as Float32Array),
        shape: t.shape as number[],
      }));

      self.postMessage({ id, success: true, result: { samplesUsed: xs.length, finalLoss, newWeights: entries } });
    }
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err.message });
  }
};
