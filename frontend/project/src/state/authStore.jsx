import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../js/firebase";

const AuthContext = createContext(null);

/* =========================
   CONFIG
========================= */

const PROFILE_TIMEOUT = 8000; // ms
const PROFILE_POLL_INTERVAL = 600; // ms

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Wait until the user profile exists OR timeout
 * Missing doc is NOT an error, we poll for it
 */
async function waitForUserProfile(uid, signal) {
  const start = Date.now();

  while (Date.now() - start < PROFILE_TIMEOUT) {
    if (signal.aborted) throw new Error("aborted");

    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        return snap;
      }
    } catch (err) {
      if (!navigator.onLine) {
        throw new Error("network");
      }
    }

    await sleep(PROFILE_POLL_INTERVAL);
  }

  throw new Error("timeout");
}

/* =========================
   PROVIDER
========================= */

export function AuthProvider({ children }) {
  const mountedRef = useRef(true);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI states
  const [setupState, setSetupState] = useState("idle");
  // idle | loading | timeout | network-error

  useEffect(() => {
    mountedRef.current = true;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mountedRef.current) return;

      /* SIGNED OUT */
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        setSetupState("idle");
        return;
      }

      /* AUTHENTICATED BUT ACCOUNT NOT READY */
      setUser(firebaseUser);
      setRole(null);
      setLoading(true);
      setSetupState("loading");

      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, PROFILE_TIMEOUT);

      try {
        const snap = await waitForUserProfile(
          firebaseUser.uid,
          controller.signal
        );

        if (!mountedRef.current) return;

        const storedRole = snap.data()?.role;

        if (
          storedRole === "buyer" ||
          storedRole === "farmer" ||
          storedRole === "transporter"
        ) {
          setRole(storedRole);
          setLoading(false);
          setSetupState("idle");
        } else {
          console.error("Invalid role detected:", storedRole);
          await signOut(auth);
          setUser(null);
          setRole(null);
          setLoading(false);
          setSetupState("idle");
        }
      } catch (err) {
        if (!mountedRef.current) return;

        if (err.message === "network") {
          setSetupState("network-error");
        } else {
          setSetupState("timeout");
        }

        setRole(null);
        setLoading(true);
      } finally {
        clearTimeout(timeout);
      }
    });

    return () => {
      mountedRef.current = false;
      unsub();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      if (mountedRef.current) {
        setUser(null);
        setRole(null);
        setLoading(false);
        setSetupState("idle");
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        setupState,
        logout,

        // helpers
        isBuyer: role === "buyer",
        isFarmer: role === "farmer",
        isTransporter: role === "transporter",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
