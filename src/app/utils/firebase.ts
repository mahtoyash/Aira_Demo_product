import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, get, query, limitToLast, orderByKey, startAfter } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCkA910fAJd2CbLLU3JzXI1ff2Xw4WM9Zs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "co2-monitor-effff.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://co2-monitor-effff-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "co2-monitor-effff",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "co2-monitor-effff.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1045222550408",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1045222550408:web:b9401d197d613b37de683d"
};

const app = initializeApp(firebaseConfig);

export const db       = getDatabase(app);
export const auth     = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { ref, onValue, push, set, get, query, limitToLast, orderByKey, startAfter };
