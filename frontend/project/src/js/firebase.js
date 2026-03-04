import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { APP_ENV } from "./env";

const firebaseConfig = {
  apiKey: APP_ENV.FIREBASE_API_KEY,
  authDomain: APP_ENV.FIREBASE_AUTH_DOMAIN,
  projectId: APP_ENV.FIREBASE_PROJECT_ID,
  storageBucket: APP_ENV.FIREBASE_STORAGE_BUCKET,
  appId: APP_ENV.FIREBASE_APP_ID,
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch(() => {
  // Do not block app startup if persistence fails.
});

export const db = getFirestore(app);
export const storage = getStorage(app);
