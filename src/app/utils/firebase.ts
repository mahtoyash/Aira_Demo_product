import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, get, query, limitToLast, orderByKey, startAfter } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCkA910fAJd2CbLLU3JzXI1ff2Xw4WM9Zs",
  authDomain: "co2-monitor-effff.firebaseapp.com",
  databaseURL: "https://co2-monitor-effff-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "co2-monitor-effff",
  storageBucket: "co2-monitor-effff.firebasestorage.app",
  messagingSenderId: "1045222550408",
  appId: "1:1045222550408:web:b9401d197d613b37de683d"
};

const app = initializeApp(firebaseConfig);

export const db       = getDatabase(app);
export const auth     = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { ref, onValue, push, set, get, query, limitToLast, orderByKey, startAfter };
