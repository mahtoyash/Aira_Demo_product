# Aira & Aether — AI-Powered Indoor CO2 Forecasting System

This repository contains the complete frontend architecture for the **Aether Landing Page** and the highly interactive **Aira CO2 Dashboard**. It actively features a live **Artificial Intelligence (LSTM) Machine Learning pipeline** capable of **Online Training natively inside the user's browser**.

## 🧠 Machine Learning Architecture (Line-by-Line Breakdown)

Aira uses a powerful predictive architecture that adapts specifically to however people use their rooms. Rather than relying on a generic algorithm, the system actively learns from hardware streaming telemetry.

### 1. The Base Weights (`base_weights.json`)
When the application starts for the very first time, it loads `base_weights.json` from the standard static `/public/model/` directory. 
* **When is it used?** It acts as the "General Intelligence" foundation. This was rigorously pre-trained offline in Python on generic room structures. 
* **Why do we need it?** It gives the AI an initial understanding of basic gas thermodynamics (i.e. if there are 2 humans in the room, CO2 will naturally rise) so the dashboard isn't completely "dumb" on day one.

### 2. Live Telemetry from Hardware (ESP32)
The physical Aira device (flashed via C++ Arduino) constantly reads data from its hardware sensors (SCD40, BME280) and executes continuous `POST` interactions via Wi-Fi to a dedicated Firebase Realtime Database. 
* **Nodes:** This live telemetry lands seamlessly in paths like `/readings` or `/rooms/{roomId}` in Firebase without requiring User Auth (thanks to exceptions in `firebase_rules.json`).

### 3. Online Training (The Worker Layer)
The magic happens when the dashboard user opens the application! 
* The React client polls this fresh ESP32 sequence stream from Firebase.
* Instead of lagging the UI thread during heavy math, React ships the data buffer transparently over to an isolated **Web Worker (`tf.worker.ts`)**.
* The worker dynamically leverages **TensorFlow.js**. It runs incremental `model.fit()` cycles directly on the user's laptop using the newly fetched ESP32 data.
* **Result:** It modifies the `base_weights` and physically *fine-tunes* them (transfer-learning). The model literally morphs to understand the specific geometry, ventilation limits, and unique behaviors of the **exact room the hardware is kept in**. 

### 4. How Weights Are Stored (Persistence)
Once the Web Worker finishes a successful epoch of online training, it transmits the updated neural tensors back to the main UI thread.
* **Local Caching:** These refined arrays are immediately dumped into the browser's `localStorage` (tagged logically as `co2_weights_{uid}_{roomId}`). This allows the exact trained state to boot instantly the next time you refresh.
* **Cloud Sync:** To prevent data loss if a user switches laptops, the `Co2ModelService` serializes the same precise arrays and executes a high-priority push straight up to the user's private Firebase path (`profiles/{uid}/rooms/{roomId}/model_weights`).
* **The Intelligence Loop:** The next time the user loads the dashboard—the system intercepts process 1 and completely skips the "dumb" `base_weights.json`. Instead, it forcefully injects the heavy Cloud Sync weights into TensorFlow, resulting in a model that is brilliantly adapted strictly to reality.

---

## 🛠 Features Summary
- **Unified Aether Landing & App Hub:** Flawless CSS animations and WebGL-simulated glassmorphism for a beautiful corporate standard.
- **Dynamic Routing Hash Architecture:** Utilizing `HashRouter` ensuring 100% compatibility across static hosts (GitHub Pages bypass constraint).
- **Secure Dashboard Authentication Gate:** Strictly guarded under Firebase Auth Context coupled with localized Device Validation `K0987` PIN protocol. 
- **Privacy Native:** Heavy proprietary `.mp4` and private `.env` data are excluded organically via a structured `.gitignore` pipeline. 

## 🚀 Deployment Operations
Currently bundled accurately with `vite build` pushing `dist` assets efficiently up to the `gh-pages` GitHub branch tracking environment variables via Vite's natively exposed `import.meta.env.BASE_URL`.


Future Development: 
1. additional of Google Fir so , Users can get notifications related to their own Health problems
