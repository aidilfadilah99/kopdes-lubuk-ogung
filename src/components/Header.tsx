"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DataStore } from "@/lib/store";
import { CooperativeConfig } from "@/types";
import { ProfileModal } from "@/components/ProfileModal";
import {
  LayoutDashboard,
  Users,
  Wallet,
  User,
  Scale,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  UserCog,
  Store,
  BarChart3,
  Briefcase,
  ShieldCheck,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  MASTER: "Master",
  PENGAWAS: "Pengawas",
  MANAGER: "Manager",
  ADMIN: "Admin",
  BENDAHARA: "Bendahara",
  ANGGOTA: "Anggota",
  KASIR: "Kasir Mart",
  GUDANG: "Gudang Mart",
};

const ROLE_COLORS: Record<string, string> = {
  MASTER: "bg-red-100 text-red-800",
  PENGAWAS: "bg-emerald-100 text-emerald-800",
  MANAGER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  BENDAHARA: "bg-green-100 text-green-800",
  ANGGOTA: "bg-yellow-100 text-yellow-800",
  KASIR: "bg-teal-100 text-teal-800",
  GUDANG: "bg-orange-100 text-orange-800",
};

export default function Header() {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [config, setConfig] = useState<CooperativeConfig | null>(null);

  useEffect(() => {
    setConfig(DataStore.getConfig());
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const navLinks = currentUser
    ? [
        ...(currentUser.role === "MASTER"
          ? [
              { href: "/master", label: "Dashboard Master", icon: LayoutDashboard },
              { href: "/master?tab=sppd", label: "SPPD Dinas", icon: Briefcase },
              { href: "/master?tab=neraca", label: "Neraca Keuangan", icon: BarChart3 },
            ]
          : []),
        ...(currentUser.role === "PENGAWAS"
          ? [
              { href: "/pengawas", label: "Dashboard Pengawas", icon: ShieldCheck },
              { href: "/pengawas?tab=sppd", label: "Audit SPPD", icon: Briefcase },
              { href: "/pengawas?tab=neraca", label: "Neraca Keuangan", icon: BarChart3 },
            ]
          : []),
        ...(currentUser.role === "MANAGER"
          ? [
              { href: "/admin", label: "Admin & Warga", icon: Users },
              { href: "/admin?tab=sppd", label: "SPPD Dinas", icon: Briefcase },
              { href: "/admin?tab=neraca", label: "Neraca Keuangan", icon: BarChart3 },
              { href: "/bendahara", label: "Loket Keuangan", icon: Wallet },
              { href: "/anggota", label: "Portal Anggota", icon: User },
            ]
          : []),
        ...(currentUser.role === "ADMIN"
          ? [{ href: "/admin", label: "Dashboard Admin", icon: Users }]
          : []),
        ...(currentUser.role === "BENDAHARA"
          ? [
              { href: "/bendahara", label: "Loket Keuangan", icon: Wallet },
              { href: "/bendahara?tab=sppd", label: "Pencairan SPPD", icon: Briefcase },
              { href: "/bendahara?tab=neraca", label: "Neraca Keuangan", icon: BarChart3 },
            ]
          : []),
        ...(currentUser.role === "ANGGOTA"
          ? [{ href: "/anggota", label: "Portal Saya", icon: User }]
          : []),
        ...(currentUser.role === "KASIR"
          ? [{ href: "/toko", label: "Kasir Toko (POS)", icon: Store }]
          : []),
        ...(currentUser.role === "GUDANG"
          ? [{ href: "/toko", label: "Gudang & Stok", icon: Store }]
          : []),
        ...(currentUser.role !== "KASIR" && currentUser.role !== "GUDANG" && currentUser.role !== "ADMIN"
          ? [{ href: "/toko", label: "Kopdes Mart", icon: Store }]
          : []),
        { href: "/transparansi", label: "Transparansi", icon: Scale },
      ]
    : [];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={
              currentUser
                ? currentUser.role === "MANAGER"
                  ? "/admin"
                  : currentUser.role === "PENGAWAS"
                  ? "/pengawas"
                  : currentUser.role === "KASIR" || currentUser.role === "GUDANG"
                  ? "/toko"
                  : `/${currentUser.role.toLowerCase()}`
                : "/"
            }
            className="flex items-center gap-3 min-w-0"
          >
            <div className="w-9 h-9 bg-red-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="font-bold text-gray-900 text-sm leading-tight truncate max-w-[220px]">
                {config?.coopName ?? "Kopdes Lubuk Ogung"}
              </p>
              <p className="text-xs text-gray-500 truncate">{config?.villageName}</p>
            </div>
          </Link>

          {/* Desktop nav */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-red-50 text-red-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right section */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-red-700">
                      {currentUser.name.charAt(0)}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-tight max-w-[140px] truncate">
                      {currentUser.name}
                    </p>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        ROLE_COLORS[currentUser.role] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ROLE_LABELS[currentUser.role] ?? currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          @{currentUser.username}
                        </p>
                      </div>
                      <button
                        onClick={() => { setProfileOpen(true); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <UserCog className="w-4 h-4" />
                        Edit Profil & Password
                      </button>
                      <div className="border-t border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar dari Sistem
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/transparansi"
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors hidden sm:flex items-center gap-1.5"
                >
                  <Scale className="w-4 h-4" />
                  Transparansi
                </Link>
                <Link
                  href="/login"
                  className="bg-red-700 hover:bg-red-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Masuk
                </Link>
              </div>
            )}

            {/* Mobile hamburger (only when logged in) */}
            {currentUser && (
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && currentUser && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-red-50 text-red-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-gray-100 mt-2">
            <button
              onClick={() => { setProfileOpen(true); setMobileOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 w-full transition-colors"
            >
              <UserCog className="w-4 h-4" />
              Edit Profil & Password
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar dari Sistem
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileOpen && currentUser && (
        <ProfileModal onClose={() => setProfileOpen(false)} />
      )}
    </header>
  );
}
