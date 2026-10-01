"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getRoleBadge } from "@/lib/utils";
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Wallet, 
  User, 
  LogOut, 
  Menu, 
  X,
  Layers,
  ChevronDown,
  Scale
} from "lucide-react";
import { UserRole } from "@/types";

export default function Header() {
  const { currentUser, quickLogin, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  if (!currentUser) return null;

  const roleBadge = getRoleBadge(currentUser.role);

  const navLinks = [
    { href: "/master", label: "Dashboard Master", role: "MASTER", icon: ShieldCheck },
    { href: "/admin", label: "Dashboard Admin", role: "ADMIN", icon: UserCheck },
    { href: "/bendahara", label: "Loket Bendahara", role: "BENDAHARA", icon: Wallet },
    { href: "/anggota", label: "Portal Anggota", role: "ANGGOTA", icon: User },
    { href: "/transparansi", label: "Transparansi Publik", role: "ALL", icon: Scale },
  ];

  const filteredLinks = navLinks.filter((link) => {
    if (link.role === "ALL") return true;
    if (currentUser.role === "MASTER") return true;
    if (currentUser.role === "ADMIN") return link.role !== "MASTER";
    if (currentUser.role === "BENDAHARA") return link.role === "BENDAHARA" || link.role === "ANGGOTA";
    return link.role === "ANGGOTA";
  });

  const availableRoles: { role: UserRole; label: string; desc: string; color: string }[] = [
    { role: "MASTER", label: "Master / Pengawas", desc: "Akses Superadmin & Keputusan Tertinggi", color: "text-red-600" },
    { role: "ADMIN", label: "Admin / Pengurus", desc: "Kelola Anggota & Review Pengajuan", color: "text-blue-600" },
    { role: "BENDAHARA", label: "Bendahara / Petugas", desc: "Setoran, Pencairan & Angsuran", color: "text-emerald-600" },
    { role: "ANGGOTA", label: "Warga / Anggota", desc: "Simpan Pinjam & Info SHU Pribadi", color: "text-amber-600" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      {/* Quick Role Switcher Banner */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-300">
            Sistem Koperasi Desa Merah Putih - Lubuk Ogung
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">
            Kec. Bandar Sei Kijang, Kab. Pelalawan
          </span>
        </div>

        {/* Quick Role Switch Buttons for rapid evaluation */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1 hidden md:inline">Ganti Peran:</span>
          {availableRoles.map((r) => {
            const isActive = currentUser.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => quickLogin(r.role)}
                title={r.desc}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  isActive
                    ? "bg-red-600 text-white shadow-sm ring-1 ring-white/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {r.role}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  KOPDES
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                  Merah Putih
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Desa Lubuk Ogung
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {filteredLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs uppercase">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 line-clamp-1 max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${roleBadge.className}`}
                    >
                      {currentUser.role}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400">Masuk Sebagai:</p>
                    <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-slate-500">{currentUser.email || currentUser.username}</p>
                  </div>

                  <div className="py-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1">
                      Ubah Akun Demo:
                    </p>
                    {availableRoles.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          quickLogin(r.role);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                          currentUser.role === r.role
                            ? "bg-red-50 text-red-900 font-semibold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 mt-0.5 text-slate-400" />
                        <div>
                          <div className="font-medium">{r.label}</div>
                          <div className="text-[10px] text-slate-400 leading-tight">{r.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar / Ganti Akun
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-red-50 text-red-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
