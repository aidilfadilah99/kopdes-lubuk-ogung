"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "@/types";
import { DataStore } from "./store";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  quickLogin: (role: UserRole) => void;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = "kopdes_session_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_USER_KEY);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      } else {
        // Default to Master on first load for easy demonstration, or null
        // Let's keep null or default to MASTER
        const users = DataStore.getUsers();
        const master = users.find((u) => u.role === "MASTER") || users[0];
        if (master) {
          setCurrentUser(master);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(master));
        }
      }
    } catch (e) {
      console.error("Auth restore error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string): Promise<{ success: boolean; message?: string }> => {
    const users = DataStore.getUsers();
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() ||
        (u.nik && u.nik === username.trim())
    );

    if (!user) {
      return { success: false, message: "Username atau NIK tidak ditemukan dalam sistem." };
    }

    setCurrentUser(user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    DataStore.addAuditLog("LOGIN", `User ${user.name} (${user.role}) berhasil masuk ke sistem`, {
      id: user.id,
      name: user.name,
      role: user.role,
    });

    return { success: true };
  };

  const quickLogin = (role: UserRole) => {
    const users = DataStore.getUsers();
    const user = users.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      DataStore.addAuditLog(
        "QUICK_SWITCH_ROLE",
        `Beralih ke akun peran ${role}: ${user.name}`,
        {
          id: user.id,
          name: user.name,
          role: user.role,
        }
      );
    }
  };

  const logout = () => {
    if (currentUser) {
      DataStore.addAuditLog(
        "LOGOUT",
        `User ${currentUser.name} (${currentUser.role}) keluar dari sistem`,
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        }
      );
    }
    setCurrentUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!currentUser) return false;
    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }
    return currentUser.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        quickLogin,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
