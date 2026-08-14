import React, { useEffect, useState } from "react";
import { UserProfile } from "../types";
import { getOrCreateUserProfile } from "../lib/dbService";
import { AuthContext } from "../lib/useAuth";

/**
 * Local session stand-in for Supabase Auth (docs/SRS.md §3.1, AD-01).
 *
 * There is no auth backend: the signed-in user lives in localStorage and any
 * email/password combination is accepted by AuthGateway. This is a development
 * placeholder — it authenticates nobody and must not reach production.
 */
const SESSION_KEY = "tcoolture_mock_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string, email: string, password?: string) => {
    try {
      setProfile(await getOrCreateUserProfile(uid, email, password));
    } catch (e) {
      console.error("Error fetching user profile:", e);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid, user.email || "");
  };

  useEffect(() => {
    const restore = async () => {
      setLoading(true);
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          await fetchProfile(parsed.uid, parsed.email || "");
        } catch {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setLoading(false);
    };
    restore();
  }, []);

  const loginAsMockUser = async (uid: string, email: string, password?: string) => {
    const mockUser = { uid, email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    await fetchProfile(uid, email, password);
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile, loginAsMockUser }}>
      {children}
    </AuthContext.Provider>
  );
}
