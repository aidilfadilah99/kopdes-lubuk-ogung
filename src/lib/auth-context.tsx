"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@/types";
import { DataStore } from "./store";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SESSION_KEY = "kopdes_session_v3";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_SESSION_KEY);
      if (saved) {
        const parsed: User = JSON.parse(saved);
        // Re-validate against current user store (in case user was deactivated)
        const users = DataStore.getUsers();
        const stillValid = users.find((u) => u.id === parsed.id && u.isActive !== false);
        if (stillValid) {
          setCurrentUser(stillValid);
        } else {
          localStorage.removeItem(AUTH_SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    const users = DataStore.getUsers();

    const user = users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() ||
        (u.nik && u.nik === username.trim())
    );

    if (!user) {
      return { success: false, message: "Username atau NIK tidak ditemukan di sistem." };
    }

    if (user.isActive === false) {
      return { success: false, message: "Akun Anda telah dinonaktifkan. Hubungi pengurus koperasi." };
    }

    if (user.password !== password) {
      return { success: false, message: "Password salah. Silakan coba lagi." };
    }

    // Strip password from session storage for security
    const sessionUser = { ...user };
    setCurrentUser(sessionUser);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));

    DataStore.addAuditLog(
      "LOGIN",
      `${user.name} (${user.role}) berhasil masuk ke sistem`,
      { id: user.id, name: user.name, role: user.role }
    );

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      DataStore.addAuditLog(
        "LOGOUT",
        `${currentUser.name} (${currentUser.role}) keluar dari sistem`,
        { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      );
    }
    setCurrentUser(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!currentUser) return false;
    if (Array.isArray(roles)) return roles.includes(currentUser.role);
    return currentUser.role === roles;
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
