import { createContext, useContext } from "react";
import { UserProfile } from "../types";

/**
 * Auth context. Firebase Auth was removed on 2026-08-14; the target stack
 * (docs/SRS.md §3.1) uses Supabase Auth, which does not exist yet. Until then
 * AuthProvider backs this with a local session — see its file header.
 */
interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsMockUser?: (uid: string, email: string, password?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
  loginAsMockUser: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
