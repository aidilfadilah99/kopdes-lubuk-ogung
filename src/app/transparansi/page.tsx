"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DataStore } from "@/lib/store";
import { CooperativeConfig, Member, Loan, SavingsTransaction } from "@/types";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import {
  Building2,
  Users,
  Wallet,
  TrendingUp,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  MapPin,
  FileText,
  Landmark,
  Scale,
  Sparkles,
} from "lucide-react";
import { RpBadge } from "@/components/RupiahIcons";

export default function TransparansiPublikPage() {
  const [config, setConfig] = useState<CooperativeConfig | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [savings, setSavings] = useState<SavingsTransaction[]>([]);

  useEffect(() => {
    setConfig(DataStore.getConfig());
    setMembers(DataStore.getMembers());
    setLoans(DataStore.getLoans());
    setSavings(DataStore.getSavings());
  }, []);

  // Calculations
  const totalSimpanan = members.reduce((sum, m) => sum + m.savingsTotal, 0);
  const totalPokok = savings.filter((s) => s.type === "POKOK").reduce((sum, s) => sum + s.amount, 0);
  const totalWajib = savings.filter((s) => s.type === "WAJIB").reduce((sum, s) => sum + s.amount, 0);
  const totalSukarela = savings.filter((s) => s.type === "SUKARELA").reduce((sum, s) => sum + s.amount, 0);

  const totalPinjamanDisalurkan = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalSisaPinjaman = loans
    .filter((l) => l.status === "DISBURSED")
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  // Dusun distribution
  const dusunCount: Record<string, number> = {
    "Dusun I": members.filter((m) => m.dusun === "Dusun I").length,
    "Dusun II": members.filter((m) => m.dusun === "Dusun II").length,
    "Dusun III": members.filter((m) => m.dusun === "Dusun III").length,
    "Dusun IV": members.filter((m) => m.dusun === "Dusun IV").length,
  };

  // Fiscal Year & SHU Allocations (Standard Indonesian Cooperative AD/ART)
  const fiscalYear = config?.currentFiscalYear || new Date().getFullYear();
  const shuTotal = config?.shuEstimateTotal || 48500000;
  const shuCadangan = Math.round(shuTotal * 0.40); // 40%
  const shuJasaAnggota = Math.round(shuTotal * 0.40); // 40%
  const shuPengurus = Math.round(shuTotal * 0.10); // 10%
  const shuPendidikan = Math.round(shuTotal * 0.05); // 5%
  const shuSosialDesa = Math.round(shuTotal * 0.05); // 5%

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Utama
        </Link>
        <span className="text-xs text-slate-400 font-medium">
          Laporan Real-Time Masyarakat &bull; Desa Lubuk Ogung
        </span>
      </div>

      {/* Main Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white p-8 sm:p-12 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Scale className="w-64 h-64 text-white" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-xs font-semibold uppercase tracking-wider text-rose-300">
          <ShieldCheck className="w-4 h-4" /> Keterbukaan Informasi Publik Desa
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Portal Transparansi Publik <br />
          <span className="text-amber-400">Koperasi Merah Putih Lubuk Ogung</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          Sebagai wujud akuntabilitas kepada seluruh masyarakat Desa Lubuk Ogung, 
          halaman ini dapat diakses secara bebas oleh siapa saja tanpa perlu login untuk memantau 
          kondisi keuangan, pemanfaatan pinjaman produktif warga, serta proyeksi pembagian Sisa Hasil Usaha (SHU).
        </p>

        <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
          <div>Badan Hukum: <span className="text-white font-bold">{config?.legalNumber || "-"}</span></div>
          <div>&bull;</div>
          <div>Tahun Buku: <span className="text-white font-bold">{fiscalYear}</span></div>
          <div>&bull;</div>
          <div>Wilayah: <span className="text-white font-bold">Kec. Bandar Sei Kijang, Kab. Pelalawan</span></div>
        </div>
      </div>

      {/* 4 Key Indicators Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-500 font-medium block">Total Anggota Terdaftar</span>
          <div className="text-2xl font-extrabold text-slate-900">
            {members.length} <span className="text-xs font-normal text-slate-400">Warga</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Tersebar di Dusun I - IV
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-500 font-medium block">Total Simpanan Terkumpul</span>
          <div className="text-xl font-extrabold text-slate-900">
            {formatRupiah(totalSimpanan)}
          </div>
          <p className="text-[11px] text-slate-400">
            Pokok, Wajib, & Sukarela
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <RpBadge className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-500 font-medium block">Pinjaman Modal Tersalurkan</span>
          <div className="text-xl font-extrabold text-slate-900">
            {formatRupiah(totalPinjamanDisalurkan)}
          </div>
          <p className="text-[11px] text-purple-700 font-medium">
            Sisa berjalan: {formatRupiah(totalSisaPinjaman)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-500 font-medium block">Proyeksi SHU Tahun {fiscalYear}</span>
          <div className="text-xl font-extrabold text-amber-700">
            {formatRupiah(shuTotal)}
          </div>
          <p className="text-[11px] text-slate-400">
            Akan dibagikan pada RAT tahunan
          </p>
        </div>
      </div>

      {/* Grid 2: Komposisi Simpanan & Pembagian SHU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Komposisi Simpanan Warga */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Komposisi Dana Simpanan Masyarakat</h3>
            <p className="text-xs text-slate-500">Rincian jenis simpanan warga yang tersimpan aman di kas koperasi.</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Simpanan Sukarela / Tabungan Panen</span>
                <span className="text-emerald-700 font-bold">{formatRupiah(totalSukarela)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full"
                  style={{ width: `${totalSimpanan > 0 ? (totalSukarela / totalSimpanan) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400">
                Tabungan bebas ditarik sewaktu-waktu oleh anggota
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Simpanan Pokok Anggota</span>
                <span className="text-blue-700 font-bold">{formatRupiah(totalPokok)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${totalSimpanan > 0 ? (totalPokok / totalSimpanan) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400">
                Setoran awal pendaftaran ({formatRupiah(config?.simpananPokokAmount || 100000)}/anggota)
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Simpanan Wajib Bulanan</span>
                <span className="text-amber-700 font-bold">{formatRupiah(totalWajib)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full"
                  style={{ width: `${totalSimpanan > 0 ? (totalWajib / totalSimpanan) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400">
                Iuran wajib ({formatRupiah(config?.simpananWajibMonthly || 30000)}/bulan)
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Alokasi Rencana Pembagian SHU */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Rencana Alokasi Pembagian SHU (AD/ART)</h3>
            <p className="text-xs text-slate-500">Transparansi persentase laba tahunan yang kembali ke masyarakat.</p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800">1. Jasa Anggota (Simpanan & Usaha)</span>
                <span className="text-[10px] text-slate-400 block">Dibagikan kembali ke anggota warga</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-emerald-700">{formatRupiah(shuJasaAnggota)}</span>
                <span className="text-[10px] text-slate-400 block font-bold">40%</span>
              </div>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800">2. Dana Cadangan Koperasi</span>
                <span className="text-[10px] text-slate-400 block">Penguatan modal & kestabilan koperasi desa</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-blue-700">{formatRupiah(shuCadangan)}</span>
                <span className="text-[10px] text-slate-400 block font-bold">40%</span>
              </div>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800">3. Dana Insentif Pengurus & Pengawas</span>
                <span className="text-[10px] text-slate-400 block">Apresiasi kinerja pengurus koperasi</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-slate-800">{formatRupiah(shuPengurus)}</span>
                <span className="text-[10px] text-slate-400 block font-bold">10%</span>
              </div>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800">4. Dana Sosial Desa Lubuk Ogung</span>
                <span className="text-[10px] text-slate-400 block">Bantuan warga kurang mampu, anak yatim & lansia</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-rose-700">{formatRupiah(shuSosialDesa)}</span>
                <span className="text-[10px] text-slate-400 block font-bold">5%</span>
              </div>
            </div>

            <div className="py-2.5 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800">5. Dana Pendidikan & Pelatihan Anggota</span>
                <span className="text-[10px] text-slate-400 block">Pelatihan budidaya sawit & manajemen UMKM</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-amber-700">{formatRupiah(shuPendidikan)}</span>
                <span className="text-[10px] text-slate-400 block font-bold">5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 3: Persebaran Anggota per Dusun & Kebijakan Dinamis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Persebaran Dusun */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Persebaran Wilayah Dusun</h3>
          <p className="text-xs text-slate-500">Pemerataan anggota di 4 dusun Desa Lubuk Ogung.</p>

          <div className="space-y-3 pt-2">
            {Object.entries(dusunCount).map(([dusun, count]) => (
              <div key={dusun} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> {dusun}
                </span>
                <span className="font-bold text-slate-900">{count} Anggota Warga</span>
              </div>
            ))}
          </div>
        </div>

        {/* Kebijakan Koperasi Terbuka */}
        <div className="lg:col-span-2 bg-gradient-to-br from-red-50 to-rose-50 p-6 sm:p-8 rounded-2xl border border-red-200 space-y-4">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <Landmark className="w-5 h-5 text-red-600" />
            Parameter & Kebijakan Koperasi Terbuka (Dinamis)
          </div>
          <p className="text-xs text-red-900/80 leading-relaxed">
            Semua parameter operasional ini diatur dan dapat disesuaikan secara dinamis oleh Dewan Pengawas (Master) 
            berdasarkan keputusan Rapat Anggota Tahunan (RAT) dan regulasi pemerintah:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-white p-4 rounded-xl border border-red-100">
              <span className="text-[11px] text-slate-400 block">Jasa Pinjaman (Bunga Flat):</span>
              <span className="text-lg font-bold text-slate-900">
                {config?.defaultLoanInterestRate || 1.0}% / bulan
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Transparan, tanpa biaya provisi gelap.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-red-100">
              <span className="text-[11px] text-slate-400 block">Simpanan Wajib Bulanan:</span>
              <span className="text-lg font-bold text-slate-900">
                {formatRupiah(config?.simpananWajibMonthly || 30000)} / bulan
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Terjangkau untuk seluruh lapisan warga.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-red-100">
              <span className="text-[11px] text-slate-400 block">Simpanan Pokok:</span>
              <span className="text-lg font-bold text-slate-900">
                {formatRupiah(config?.simpananPokokAmount || 100000)}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Dibayar 1 kali saat pendaftaran anggota.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-red-100">
              <span className="text-[11px] text-slate-400 block">Batas Otorisasi Master:</span>
              <span className="text-lg font-bold text-red-700">
                &gt; {formatRupiah(config?.maxLoanWithoutMasterApproval || 5000000)}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Wajib persetujuan Ketua Dewan Pengawas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
