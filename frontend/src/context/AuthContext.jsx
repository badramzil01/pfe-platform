import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onIdTokenChanged } from "firebase/auth";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const auth = getAuth();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 Écoute Firebase → refresh token auto
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const freshToken = await firebaseUser.getIdToken(true);

        const storedUser = JSON.parse(localStorage.getItem("user"));

        setUser(storedUser);
        setToken(freshToken);

        localStorage.setItem("token", freshToken);
      } else {
        setUser(null);
        setToken(null);
        localStorage.clear();
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // 🔄 Auto-refresh token every 50 minutes (Firebase tokens expire in 1 hour)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        try {
          const freshToken = await auth.currentUser.getIdToken(true);
          setToken(freshToken);
          localStorage.setItem("token", freshToken);
          console.log("Token refreshed automatically");
        } catch (error) {
          console.error("Failed to refresh token:", error);
        }
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(interval);
  }, [auth.currentUser]);

  // 🔐 Session normale
  const setSession = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  };

  // 🔑 Admin local
  const loginAsAdmin = ({ displayName }) => {
    const adminUser = {
      uid: "admin",
      email: "admin@platform.local",
      displayName: displayName || "Administrateur",
      role: "admin",
    };
    setSession(adminUser, "ADMIN_SESSION");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        setSession,
        loginAsAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
