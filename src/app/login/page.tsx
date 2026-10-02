"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DataStore } from "@/lib/store";
import { CooperativeConfig } from "@/types";
import {
  LogIn,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const { login, currentUser, isLoading } = useAuth();
  const router = useRouter();

  const [config, setConfig] = useState<CooperativeConfig | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setConfig(DataStore.getConfig());
  }, []);

  // If already logged in, redirect to their dashboard
  useEffect(() => {
    if (!isLoading && currentUser) {
      const map: Record<string, string> = {
        MASTER: "/master",
        PENGAWAS: "/pengawas",
        MANAGER: "/admin",
        ADMIN: "/admin",
        BENDAHARA: "/bendahara",
        ANGGOTA: "/anggota",
        KASIR: "/toko",
        GUDANG: "/toko",
      };
      router.replace(map[currentUser.role] ?? "/");
    }
  }, [currentUser, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    const result = await login(username, password);
    if (result.success) {
      // redirect handled by useEffect above
    } else {
      setError(result.message ?? "Login gagal.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const demoAccounts = [
    { label: "Master", username: "aidil", password: "kopdes2026", color: "bg-red-50 border-red-200 text-red-700" },
    { label: "Admin", username: "rifaldo", password: "kopdes2026", color: "bg-blue-50 border-blue-200 text-blue-700" },
    { label: "Bendahara", username: "abil", password: "kopdes2026", color: "bg-green-50 border-green-200 text-green-700" },
    { label: "Pengawas", username: "pengawas", password: "kopdes2026", color: "bg-purple-50 border-purple-200 text-purple-700" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-800 via-red-700 to-red-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-700 to-red-800 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-9 h-9 text-red-700" />
            </div>
            <h1 className="text-white font-bold text-xl leading-tight">
              {config?.coopName ?? "Koperasi Desa Merah Putih"}
            </h1>
            <p className="text-red-200 text-sm mt-1">
              {config?.villageName}, {config?.subDistrict}
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-gray-800 font-semibold text-lg mb-6 text-center">
              Masuk ke Sistem
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="Masukkan username Anda"
                  autoComplete="username"
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Masukkan password Anda"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Belum punya akun? Hubungi pengurus koperasi untuk mendapatkan akses.{" "}
              <a href="/transparansi" className="text-red-600 hover:underline font-medium">
                Lihat Transparansi Publik
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-red-200 text-xs mt-6">
          © {config?.currentFiscalYear ?? new Date().getFullYear()} {config?.coopName ?? "Koperasi Desa"} — Sistem Manajemen Internal
        </p>
      </div>
    </div>
  );
}
