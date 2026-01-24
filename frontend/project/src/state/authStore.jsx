import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../js/firebase";

const AuthContext = createContext(null);

/**
 * AuthProvider
 * - Single source of truth for auth + role
 * - Safe against race conditions
 * - Never leaves app in loading limbo
 */
export function AuthProvider({ children }) {
  const mountedRef = useRef(true);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mountedRef.current = true;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mountedRef.current) return;

      // Signed out
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        if (!mountedRef.current) return;

        // Auto-create profile if missing
        if (!snap.exists()) {
          const defaultRole = "buyer";

          await setDoc(ref, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: defaultRole,
            createdAt: serverTimestamp(),
          });

          if (mountedRef.current) {
            setRole(defaultRole);
          }
        } else {
          const storedRole = snap.data()?.role;

          // Defensive role validation
          if (
            storedRole === "buyer" ||
            storedRole === "farmer" ||
            storedRole === "transporter"
          ) {
            setRole(storedRole);
          } else {
            // Fallback if role is corrupted
            setRole("buyer");
          }
        }
      } catch (err) {
        // Firestore failure should never brick the app
        console.error("Auth profile load failed", err);
        if (mountedRef.current) {
          setRole("buyer");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
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
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        logout,

        // role helpers
        isBuyer: role === "buyer",
        isFarmer: role === "farmer",
        isTransporter: role === "transporter",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth
 * Defensive hook to prevent silent misuse
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
