import { useEffect, useState, createContext, useContext } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { UserProfile } from "../types";
import { getOrCreateUserProfile } from "./dbService";

interface AuthContextType {
  user: any; // Allow real User or mock user
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsMockUser?: (uid: string, email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
  loginAsMockUser: async () => {}
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
