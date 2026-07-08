import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { UserProfile } from "../types";
import { getOrCreateUserProfile } from "../lib/dbService";
import { AuthContext } from "../lib/useAuth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, email: string) => {
    try {
      const userProfile = await getOrCreateUserProfile(uid, email);
      setProfile(userProfile);
    } catch (e) {
      console.error("Error fetching user profile:", e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user.email || "");
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      setLoading(true);
      const storedMockUser = localStorage.getItem("tcoolture_mock_user");
      if (storedMockUser) {
        try {
          const parsedUser = JSON.parse(storedMockUser);
          setUser(parsedUser);
          await fetchProfile(parsedUser.uid, parsedUser.email || "");
          setLoading(false);
          return;
        } catch (e) {
          console.error("Error parsing stored mock user:", e);
          localStorage.removeItem("tcoolture_mock_user");
        }
      }

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          await fetchProfile(firebaseUser.uid, firebaseUser.email || "");
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loginAsMockUser = async (uid: string, email: string) => {
    setLoading(true);
    const mockUser = { uid, email, isMock: true };
    localStorage.setItem("tcoolture_mock_user", JSON.stringify(mockUser));
    setUser(mockUser);
    await fetchProfile(uid, email);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem("tcoolture_mock_user");
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase signOut error:", e);
    }
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile, loginAsMockUser }}>
      {children}
    </AuthContext.Provider>
  );
}
