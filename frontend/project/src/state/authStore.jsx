import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../js/firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);

      // Auto-create profile if missing
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: "buyer",
          createdAt: serverTimestamp(),
        });

        setRole("buyer");
      } else {
        setRole(snap.data().role);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        logout,
        isFarmer: role === "farmer",
        isBuyer: role === "buyer",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
