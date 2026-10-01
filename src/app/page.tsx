"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DataStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";
import {
  ShieldCheck,
  UserCheck,
  Wallet,
  User,
  ArrowRight,
  TrendingUp,
  Users,
  BadgeDollarSign,
  Building,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { UserRole } from "@/types";

export default function HomePage() {
  const { currentUser, quickLogin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    memberCount: 0,
    savingsTotal: 0,
    activeLoansTotal: 0,
    shuEstimate: 0,
  });

  useEffect(() => {
    const members = DataStore.getMembers();
    const config = DataStore.getConfig();
    const loans = DataStore.getLoans();

    const activeSavings = members.reduce((sum, m) => sum + m.savingsTotal, 0);
    const activeLoans = loans
      .filter((l) => l.status === "DISBURSED")
      .reduce((sum, l) => sum + l.remainingAmount, 0);

    setStats({
      memberCount: members.length,
      savingsTotal: activeSavings,
      activeLoansTotal: activeLoans,
      shuEstimate: config.shuEstimateTotal,
    });
  }, []);

  const handleRoleSelect = (role: UserRole, targetPath: string) => {
    quickLogin(role);
    router.push(targetPath);
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-600 via-red-700 to-rose-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold uppercase tracking-wider text-rose-100">
            <Building className="w-4 h-4" />
            Pemberdayaan Ekonomi Desa Lubuk Ogung
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Sistem Digital Koperasi Desa <br />
            <span className="text-amber-300">Merah Putih Lubuk Ogung</span>
          </h1>

          <p className="text-base sm:text-lg text-rose-100 max-w-3xl mx-auto font-normal leading-relaxed">
            Platform tata kelola koperasi desa yang transparan, akuntabel, dan berkeadilan 
            untuk melayani masyarakat Dusun I, Dusun II, Dusun III, dan Dusun IV Desa Lubuk Ogung, 
            Kecamatan Bandar Sei Kijang, Kabupaten Pelalawan.
          </p>

          {/* Current Logged In Info */}
          {currentUser && (
            <div className="pt-2">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-sm">
                <span>Saat ini Anda login sebagai:</span>
                <span className="font-bold text-amber-300">{currentUser.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-white text-rose-900 font-extrabold text-xs uppercase">
                  {currentUser.role}
                </span>
                <Link
                  href={
                    currentUser.role === "MASTER"
                      ? "/master"
                      : currentUser.role === "ADMIN"
                      ? "/admin"
                      : currentUser.role === "BENDAHARA"
                      ? "/bendahara"
                      : "/anggota"
                  }
                  className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:text-amber-200 ml-2"
                >
                  Buka Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Realtime KPI Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Anggota Terdaftar</p>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                {stats.memberCount} <span className="text-xs font-normal text-slate-400">Warga</span>
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Simpanan Warga</p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {formatRupiah(stats.savingsTotal)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <BadgeDollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Pinjaman Produktif Beredar</p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {formatRupiah(stats.activeLoansTotal)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Estimasi SHU Tahun 2026</p>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {formatRupiah(stats.shuEstimate)}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Pilih Akses Sesuai Peran Anda
          </h2>
          <p className="text-sm text-slate-600">
            Sistem memisahkan wewenang secara aman antara pimpinan pengawas, pengurus administrasi,
            bendahara simpan pinjam, dan warga anggota.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* MASTER CARD */}
          <div className="bg-white rounded-2xl border-2 border-red-200 hover:border-red-500 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  Tingkat Tertinggi
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  Master / Pengawas
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kepala Desa & Ketua Dewan Pengawas Koperasi
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Otorisasi pinjaman plafon tinggi (&gt; 5 Juta)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Kelola akun Admin & hak akses staf
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Audit log aktivitas & tutup buku SHU
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleSelect("MASTER", "/master")}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              Masuk Dashboard Master <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ADMIN CARD */}
          <div className="bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-500 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Operasional
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  Admin / Sekretaris
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manajemen Keanggotaan & Berkas Desa
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Pendaftaran anggota warga Dusun I - IV
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Verifikasi NIK, No KK, & status domisili
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Review kelayakan proposal pinjaman
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleSelect("ADMIN", "/admin")}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              Masuk Dashboard Admin <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* BENDAHARA CARD */}
          <div className="bg-white rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Kasir & Loket
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  Bendahara / Petugas
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Transaksi Keuangan & Kasir Koperasi
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Pencatatan setoran pokok, wajib, sukarela
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Pencairan pinjaman yang telah disetujui
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Penerimaan angsuran & cetak kwitansi
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleSelect("BENDAHARA", "/bendahara")}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              Masuk Loket Bendahara <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ANGGOTA CARD */}
          <div className="bg-white rounded-2xl border-2 border-amber-200 hover:border-amber-500 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Warga Desa
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  Warga / Anggota
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Portal Transparansi Layanan Mandiri
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Cek saldo tabungan & riwayat setoran
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Pantau sisa cicilan pinjaman & jatuh tempo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Pengajuan pinjaman usaha online & info SHU
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleSelect("ANGGOTA", "/anggota")}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              Masuk Portal Anggota <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Community Assurance Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
              Komitmen Transparansi untuk Masyarakat Banyak
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Membangun Kesejahteraan Bersama di Desa Lubuk Ogung
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Koperasi Desa Merah Putih didirikan atas asas kekeluargaan dan gotong royong. 
              Setiap rupiah simpanan warga dikelola secara terbuka dengan pelaporan waktu-nyata (*real-time*). 
              Sistem ini dirancang untuk memastikan petani sawit, pedagang pasar, dan pelaku UMKM 
              desa mendapatkan akses permodalan yang mudah, cepat, dan tanpa jeratan rentenir.
            </p>
            <div className="pt-4 flex flex-wrap gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Standar Akuntansi Koperasi
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Enkripsi & Keamanan Berlapis
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Terintegrasi Program Desa
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
