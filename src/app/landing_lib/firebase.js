// Shared Firebase project — same config as the Dashboard app
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithCredential } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCkA910fAJd2CbLLU3JzXI1ff2Xw4WM9Zs",
  authDomain: "co2-monitor-effff.firebaseapp.com",
  databaseURL: "https://co2-monitor-effff-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "co2-monitor-effff",
  storageBucket: "co2-monitor-effff.firebasestorage.app",
  messagingSenderId: "1045222550408",
  appId: "1:1045222550408:web:b9401d197d613b37de683d"
};

const app         = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Sign into Firebase using the access token from @react-oauth/google,
 * then redirect to the dashboard with the token in the URL so the
 * dashboard can auto-authenticate even across different localhost ports.
 *
 * The dashboard reads `?gat=<token>` from the URL and calls
 * signInWithCredential automatically.
 */
export async function signInWithGoogleToken(accessToken) {
  const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:5173";

  // Sign into Firebase on the landing page origin too
  try {
    const credential = GoogleAuthProvider.credential(null, accessToken);
    const result     = await signInWithCredential(auth, credential);
    console.log("[Auth] Firebase sign-in OK:", result.user.displayName);
  } catch (e) {
    console.warn("[Auth] Landing-page Firebase sign-in failed (non-fatal):", e);
  }

  // Pass the access token to the dashboard via URL so it can also sign in
  // (Firebase auth is per-origin — different ports need the token forwarded)
  const url = new URL(dashboardUrl);
  url.searchParams.set('gat', accessToken);

  setTimeout(() => {
    window.location.href = url.toString();
  }, 200);
}
