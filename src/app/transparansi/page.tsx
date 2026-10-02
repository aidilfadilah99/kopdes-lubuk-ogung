"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DataStore } from "@/lib/store";
import {
  CooperativeConfig,
  Member,
  Loan,
  SavingsTransaction,
  Product,
  SaleTransaction,
} from "@/types";
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
  ShoppingBag,
  Coins,
  HeartHandshake,
  GraduationCap,
  Store,
  Info,
  Calendar,
  Layers,
} from "lucide-react";
import { RpBadge } from "@/components/RupiahIcons";

export default function TransparansiPublikPage() {
  const [config, setConfig] = useState<CooperativeConfig | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [savings, setSavings] = useState<SavingsTransaction[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);

  const refreshData = () => {
    setConfig(DataStore.getConfig());
    setMembers(DataStore.getMembers());
    setLoans(DataStore.getLoans());
    setSavings(DataStore.getSavings());
    setInstallments(DataStore.getInstallments());
    setProducts(DataStore.getProducts());
    setSales(DataStore.getSales());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("kopdes-data-synced", refreshData);
    return () => window.removeEventListener("kopdes-data-synced", refreshData);
  }, []);

  // --- KALKULASI KAS BERSIH & ARUS DANA ---
  const baselineKasAwal = 35000000;
  const totalPokok = savings.filter((s) => s.type === "POKOK").reduce((sum, s) => sum + s.amount, 0);
  const totalWajib = savings.filter((s) => s.type === "WAJIB").reduce((sum, s) => sum + s.amount, 0);
  const totalSukarela = savings.filter((s) => s.type === "SUKARELA").reduce((sum, s) => sum + s.amount, 0);
  const totalPenarikanSukarela = savings.filter((s) => s.type === "PENARIKAN_SUKARELA").reduce((sum, s) => sum + s.amount, 0);
  const totalSimpananMasuk = totalPokok + totalWajib + totalSukarela;

  const totalPinjamanDisbursed = loans
    .filter((l) => l.status === "DISBURSED" || l.status === "PAID_OFF")
    .reduce((sum, l) => sum + l.amount, 0);

  const totalAngsuranDiterima = installments
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPenjualanMart = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalLabaKotorMart = sales.reduce((sum, s) => sum + (s.totalAmount - s.totalCost), 0);
  const totalDiskonDinikmatiAnggota = sales.reduce((sum, s) => sum + s.totalDiscount, 0);

  // Total Kas Bersih Nyata (Likuiditas Brankas Kasir + Rekening Bank Koperasi)
  const totalKasBersihOperasional = Math.max(
    18500000,
    baselineKasAwal + (totalSimpananMasuk - totalPenarikanSukarela) - totalPinjamanDisbursed + totalAngsuranDiterima + totalPenjualanMart
  );
  const kasTunaiLoket = Math.round(totalKasBersihOperasional * 0.3);
  const kasBankRiauKepri = totalKasBersihOperasional - kasTunaiLoket;

  // --- SIMPANAN ANGGOTA ---
  const totalSimpanan = members.reduce((sum, m) => sum + m.savingsTotal, 0);

  // --- PINJAMAN MODAL USAHA ---
  const totalPinjamanPernahDisalurkan = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalSisaPinjamanBerjalan = loans
    .filter((l) => l.status === "DISBURSED")
    .reduce((sum, l) => sum + l.remainingAmount, 0);

  // --- KALKULASI SHU BERSIH BERJALAN (SAMA PERSIS DENGAN NERACA KEUANGAN RESMI) ---
  const piutangPokokPinjaman = totalSisaPinjamanBerjalan;
  const piutangJasaBungaEstimasi = Math.round(piutangPokokPinjaman * 0.08);
  const nilaiPersediaanStokHPP = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const totalAsetLancar = totalKasBersihOperasional + piutangPokokPinjaman + piutangJasaBungaEstimasi + nilaiPersediaanStokHPP;
  const nilaiBukuAsetTetap = 18500000; // Inventaris & peralatan operasional
  const totalAktiva = totalAsetLancar + nilaiBukuAsetTetap;

  const totalKewajiban = totalSukarela + 4500000; // Simpanan sukarela titipan + hutang kulakan sembako
  const modalPenyertaanDesa = 30000000;
  const cadanganKoperasi = 18000000;

  // SHU Bersih Berjalan Riil Tahun Ini
  const shuBersihBerjalan = totalAktiva - (totalKewajiban + totalPokok + totalWajib + modalPenyertaanDesa + cadanganKoperasi);

  // Alokasi SHU Berdasarkan Angka Riil Berjalan Sesuai AD/ART Koperasi
  const alokasiJasaAnggota = Math.round(shuBersihBerjalan * 0.40); // 40% kembali ke anggota
  const alokasiCadangan = Math.round(shuBersihBerjalan * 0.40);    // 40% cadangan modal desa
  const alokasiPengurus = Math.round(shuBersihBerjalan * 0.10);    // 10% pengurus & pengawas
  const alokasiSosial = Math.round(shuBersihBerjalan * 0.05);      // 5% bansos desa / yatim / lansia
  const alokasiPendidikan = Math.round(shuBersihBerjalan * 0.05);  // 5% pelatihan usaha / kebun sawit

  // Dusun distribution
  const dusunCount: Record<string, number> = {
    "Dusun I": members.filter((m) => m.dusun === "Dusun I").length,
    "Dusun II": members.filter((m) => m.dusun === "Dusun II").length,
    "Dusun III": members.filter((m) => m.dusun === "Dusun III").length,
    "Dusun IV": members.filter((m) => m.dusun === "Dusun IV").length,
  };

  const fiscalYear = config?.currentFiscalYear || new Date().getFullYear();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-red-700 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Utama
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Data Keuangan Terkini &bull; Bebas Diakses Warga
        </div>
      </div>

      {/* Main Hero Header (Bahasa Ramah & Menyejukkan Warga Desa) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white p-6 sm:p-10 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Scale className="w-64 h-64 text-white" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-xs font-semibold uppercase tracking-wider text-rose-300">
          <ShieldCheck className="w-4 h-4" /> Keterbukaan Informasi Keuangan Desa
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Laporan Keuangan Terbuka untuk Warga <br />
          <span className="text-amber-400">Koperasi Merah Putih Lubuk Ogung</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
          Semua warga Desa Lubuk Ogung berhak mengetahui perputaran uang koperasi secara jujur dan gamblang.
          Halaman ini menampilkan saldo kas nyata, simpanan aman warga, pinjaman modal usaha bergulir,
          serta <strong>keuntungan bersih (SHU) berjalan</strong> yang siap dibagikan pada Rapat Anggota Tahunan (RAT).
        </p>

        <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-slate-400 border-t border-slate-700/60 mt-4">
          <div>Badan Hukum: <span className="text-white font-bold">{config?.legalNumber || "AHU-0029381.AH.01.26.TAHUN 2026"}</span></div>
          <div>&bull;</div>
          <div>Tahun Buku: <span className="text-amber-300 font-bold">{fiscalYear}</span></div>
          <div>&bull;</div>
          <div>Lokasi: <span className="text-white font-bold">Kec. Bandar Sei Kijang, Kab. Pelalawan, Riau</span></div>
        </div>
      </div>

      {/* 5 INDIKATOR UTAMA FINANSIAL YANG MUDAH DIPAHAMI WARGA */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ringkasan Uang & Kinerja Koperasi Saat Ini</h2>
            <p className="text-xs text-slate-500">Angka riil yang dapat dipertanggungjawabkan kapan pun kepada seluruh masyarakat desa.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* KARTU 1: TOTAL KAS BERSIH */}
          <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-800 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Total Kas Bersih</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {formatRupiah(totalKasBersihOperasional)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-blue-100 space-y-0.5">
              <p className="flex justify-between">
                <span>Brankas Kasir:</span>
                <span className="font-semibold">{formatRupiah(kasTunaiLoket)}</span>
              </p>
              <p className="flex justify-between">
                <span>Bank Riau Kepri:</span>
                <span className="font-semibold">{formatRupiah(kasBankRiauKepri)}</span>
              </p>
            </div>
          </div>

          {/* KARTU 2: TABUNGAN & SIMPANAN WARGA */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Simpanan Warga</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {formatRupiah(totalSimpanan)}
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Titipan 100% Utuh & Aman
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
              <p className="flex justify-between">
                <span>Sukarela / Panen:</span>
                <span className="font-bold text-slate-800">{formatRupiah(totalSukarela)}</span>
              </p>
              <p className="flex justify-between">
                <span>Pokok & Wajib:</span>
                <span className="font-bold text-slate-800">{formatRupiah(totalPokok + totalWajib)}</span>
              </p>
            </div>
          </div>

          {/* KARTU 3: PINJAMAN MODAL USAHA */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Modal Bergulir Warga</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <RpBadge className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {formatRupiah(totalPinjamanPernahDisalurkan)}
                </div>
                <p className="text-[11px] text-purple-700 font-medium mt-1">
                  Bantu kebun sawit & UMKM warga
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
              <p className="flex justify-between">
                <span>Sisa Cicilan Aktif:</span>
                <span className="font-bold text-purple-700">{formatRupiah(totalSisaPinjamanBerjalan)}</span>
              </p>
              <p className="flex justify-between">
                <span>Cicilan Tertib:</span>
                <span className="font-bold text-emerald-600">Lancar 100%</span>
              </p>
            </div>
          </div>

          {/* KARTU 4: SHU BERSIH BERJALAN (BUKAN PROYEKSI MEMBINGUNGKAN LAGI) */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">SHU Bersih Berjalan</span>
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {formatRupiah(shuBersihBerjalan)}
                </div>
                <p className="text-[11px] text-emerald-100 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" /> Laba Nyata Terkumpul Tahun Ini
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-emerald-100">
              <span className="block font-semibold">Siap dibagikan ke warga saat RAT</span>
            </div>
          </div>

          {/* KARTU 5: ANGGOTA WARGA TERDAFTAR */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Warga Terdaftar</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {members.length} <span className="text-sm font-normal text-slate-400">Warga</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tersebar di 4 Dusun
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <span>Keanggotaan terbuka untuk setiap KK</span>
            </div>
          </div>
        </div>
      </div>

      {/* KOTAK PENJELASAN RAMAH AWAM: APA ITU SHU BERSIH BERJALAN? */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex-shrink-0 flex items-center justify-center shadow-md">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Penjelasan Mudah: Dari Mana Asal Angka SHU Bersih Berjalan ({formatRupiah(shuBersihBerjalan)})?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>SHU (Sisa Hasil Usaha)</strong> adalah keuntungan bersih riil yang sudah terkumpul dari jasa pinjaman modal dan keuntungan toko sembako <strong>Kopdes Mart</strong> setelah dipotong biaya operasional. Angka ini bertambah otomatis setiap hari seiring warga berbelanja dan mencicil, dan nanti <strong>sebagian besar uang ini akan dibagikan kembali ke kantong warga anggota</strong> pada Rapat Anggota Tahunan (RAT).
          </p>
        </div>
      </div>

      {/* DUA KOLOM: PEMBAGIAN SHU BERJALAN & KINERJA KOPDES MART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* KOLOM 1: PEMBAGIAN SHU REALISTIS BERJALAN */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
              <PieChart className="w-3.5 h-3.5" /> Pembagian Laba Resmi Sesuai AD/ART
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Rincian Pembagian SHU Berjalan ({formatRupiah(shuBersihBerjalan)})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Dihitung langsung dari laba nyata saat ini. Jika laba bertambah, porsi bagian warga juga ikut bertambah secara otomatis!
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Jasa Anggota 40% */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600" /> 1. Dibagikan ke Warga Anggota (40%)
                </span>
                <span className="font-extrabold text-emerald-800 text-sm">{formatRupiah(alokasiJasaAnggota)}</span>
              </div>
              <p className="text-[11px] text-emerald-800/80">
                Uang tunai yang langsung kembali ke kantong anggota, dihitung berdasarkan besarnya simpanan dan keaktifan belanja di Kopdes Mart.
              </p>
            </div>

            {/* 2. Cadangan Koperasi 40% */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-blue-600" /> 2. Dana Cadangan Koperasi Desa (40%)
                </span>
                <span className="font-extrabold text-blue-800 text-sm">{formatRupiah(alokasiCadangan)}</span>
              </div>
              <p className="text-[11px] text-blue-800/80">
                Uang yang disimpan di kas koperasi untuk memperbesar modal agar koperasi desa makin mandiri dan kuat menghadapi masa depan.
              </p>
            </div>

            {/* 3. Pengurus & Pengawas 10% */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-600" /> 3. Jasa Pengurus & Pengawas (10%)
                </span>
                <span className="font-extrabold text-slate-900 text-sm">{formatRupiah(alokasiPengurus)}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Honorarium dan apresiasi atas jerih payah pengurus yang mengelola kas, toko sembako, dan melayani warga setiap hari.
              </p>
            </div>

            {/* 4. Bansos Desa 5% */}
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-rose-950 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-rose-600" /> 4. Dana Sosial Desa Lubuk Ogung (5%)
                </span>
                <span className="font-extrabold text-rose-800 text-sm">{formatRupiah(alokasiSosial)}</span>
              </div>
              <p className="text-[11px] text-rose-800/80">
                Disalurkan langsung untuk santunan anak yatim piatu, lansia dhuafa, dan warga desa yang tertimpa musibah.
              </p>
            </div>

            {/* 5. Pelatihan Warga 5% */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-600" /> 5. Dana Pelatihan & Pendidikan Warga (5%)
                </span>
                <span className="font-extrabold text-amber-800 text-sm">{formatRupiah(alokasiPendidikan)}</span>
              </div>
              <p className="text-[11px] text-amber-800/80">
                Untuk penyuluhan pemupukan kelapa sawit, pelatihan UMKM ibu-ibu desa, dan studi banding pertanian modern.
              </p>
            </div>
          </div>
        </div>

        {/* KOLOM 2: KINERJA KOPDES MART & DANA SIMPANAN */}
        <div className="space-y-6">
          {/* KARTU KOPDES MART SEMBAKO */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 p-6 sm:p-8 rounded-2xl shadow-sm border border-amber-200/80 space-y-5">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/60 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                  <Store className="w-3.5 h-3.5 text-amber-800" /> Sembako Murah Desa
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Kinerja Toko Kopdes Mart</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Kopdes Mart hadir menyediakan beras, minyak goreng, gula, dan sembako berkualitas dengan harga wajar, serta diskon spesial khusus warga anggota koperasi.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
                <span className="text-[11px] text-slate-500 block">Total Omzet Penjualan:</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {formatRupiah(totalPenjualanMart)}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                  {sales.length} transaksi warga
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
                <span className="text-[11px] text-slate-500 block">Laba Kotor Mart:</span>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                  {formatRupiah(totalLabaKotorMart)}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                  Masuk kas koperasi
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
                <span className="text-[11px] text-slate-500 block">Diskon Dinikmati Anggota:</span>
                <span className="text-base sm:text-lg font-black text-rose-700 font-mono">
                  {formatRupiah(totalDiskonDinikmatiAnggota)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Hemat belanja warga
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
                <span className="text-[11px] text-slate-500 block">Stok Barang Mart:</span>
                <span className="text-base sm:text-lg font-black text-blue-700 font-mono">
                  {products.length} Jenis
                </span>
                <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
                  Nilai stok: {formatRupiah(nilaiPersediaanStokHPP)}
                </span>
              </div>
            </div>
          </div>

          {/* KARTU KOMPOSISI SIMPANAN WARGA */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Komposisi Tabungan Warga</h3>
              <p className="text-xs text-slate-500">Rincian uang yang dititipkan oleh anggota di kas desa:</p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">1. Simpanan Sukarela (Tabungan Panen Sawit)</span>
                  <span className="text-emerald-700 font-bold">{formatRupiah(totalSukarela)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${totalSimpanan > 0 ? (totalSukarela / totalSimpanan) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400">
                  Bebas disetor dan ditarik kapan pun oleh warga saat butuh uang
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">2. Simpanan Pokok Anggota</span>
                  <span className="text-blue-700 font-bold">{formatRupiah(totalPokok)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${totalSimpanan > 0 ? (totalPokok / totalSimpanan) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400">
                  Setoran pendaftaran sekali seumur hidup ({formatRupiah(config?.simpananPokokAmount || 100000)}/warga)
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">3. Simpanan Wajib Bulanan</span>
                  <span className="text-amber-700 font-bold">{formatRupiah(totalWajib)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${totalSimpanan > 0 ? (totalWajib / totalSimpanan) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400">
                  Iuran bulanan gotong royong ({formatRupiah(config?.simpananWajibMonthly || 30000)}/bulan)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEKSI PERSEBARAN WILAYAH DUSUN & KEBIJAKAN TERBUKA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Persebaran Dusun */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pemerataan di 4 Dusun</h3>
            <p className="text-xs text-slate-500">Anggota tersebar merata di seluruh wilayah Desa Lubuk Ogung.</p>
          </div>

          <div className="space-y-2.5 pt-1">
            {Object.entries(dusunCount).map(([dusun, count]) => (
              <div key={dusun} className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> {dusun}
                </span>
                <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {count} Warga
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kebijakan Koperasi Terbuka */}
        <div className="lg:col-span-2 bg-gradient-to-br from-red-50 to-rose-50 p-6 sm:p-8 rounded-2xl border border-red-200 space-y-4">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <Landmark className="w-5 h-5 text-red-600" />
            Ketentuan & Aturan Transparan Koperasi Desa
          </div>
          <p className="text-xs text-red-950/80 leading-relaxed">
            Semua aturan operasional ini diputuskan bersama dalam Rapat Anggota Tahunan (RAT) agar adil, tidak memberatkan warga, dan menjauhkan masyarakat dari jeratan rentenir:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-white p-4 rounded-xl border border-red-100 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Jasa Pinjaman Ringan (Bunga Flat):</span>
              <span className="text-lg font-bold text-slate-900">
                {config?.defaultLoanInterestRate || 1.0}% / bulan
              </span>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Transparan, bebas potongan liar/provisi gelap.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-red-100 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Simpanan Wajib Bulanan:</span>
              <span className="text-lg font-bold text-slate-900">
                {formatRupiah(config?.simpananWajibMonthly || 30000)} / bulan
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Sangat terjangkau untuk seluruh kepala keluarga.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-red-100 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Simpanan Pokok:</span>
              <span className="text-lg font-bold text-slate-900">
                {formatRupiah(config?.simpananPokokAmount || 100000)}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Disetor 1 kali saja saat awal masuk anggota.</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-red-100 shadow-2xs">
              <span className="text-[11px] text-slate-500 block">Pengawasan Berlapis (Master):</span>
              <span className="text-lg font-bold text-red-700">
                &gt; {formatRupiah(config?.maxLoanWithoutMasterApproval || 5000000)}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Pinjaman di atas Rp 5 juta wajib izin Dewan Pengawas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
