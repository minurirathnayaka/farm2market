import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUGwGuGySnExxBt0voWfyAVzTDgR6InBk",
  authDomain: "farm2market-2026.firebaseapp.com",
  projectId: "farm2market-2026",
  appId: "1:51380182266:web:a854bfcbd11818ba913d43",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
