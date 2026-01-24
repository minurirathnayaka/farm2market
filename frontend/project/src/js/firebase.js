import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase frontend config
 * Keys are NOT secrets, but must be env-driven for safety.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Prevent double initialization in edge cases
 */
const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

export const auth = getAuth(app);

/**
 * Explicit auth persistence
 * Ensures consistent login behavior
 */
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Fallback silently – never block app
});

export const db = getFirestore(app);
