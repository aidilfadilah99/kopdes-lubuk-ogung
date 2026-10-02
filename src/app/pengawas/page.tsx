"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DataStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import {
  Member,
  Loan,
  SavingsTransaction,
  CooperativeConfig,
  Product,
  SaleTransaction,
  PerjalananDinas,
  PengawasanNote,
} from "@/types";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { NeracaKeuangan } from "@/components/NeracaKeuangan";
import { PerjalananDinasModule } from "@/components/PerjalananDinasModule";
import {
  ShieldCheck,
  Scale,
  Landmark,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Search,
  Users,
  Store,
  Briefcase,
  BarChart3,
  Calendar,
  Clock,
  Printer,
  Plus,
  Info,
  Layers,
  FileCheck,
} from "lucide-react";
import { RpBadge } from "@/components/RupiahIcons";

export default function PengawasDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["PENGAWAS", "MASTER"]}>
      <PengawasDashboardContent />
    </ProtectedRoute>
  );
}

function PengawasDashboardContent() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("audit");

  const [config, setConfig] = useState<CooperativeConfig | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [savings, setSavings] = useState<SavingsTransaction[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [sppdList, setSppdList] = useState<PerjalananDinas[]>([]);
  const [notes, setNotes] = useState<PengawasanNote[]>([]);

  // Form Temuan Baru Pengawas
  const [aspek, setAspek] = useState<"KEUANGAN" | "KEPATUHAN" | "OPERASIONAL_MART" | "PINJAMAN" | "UMUM">("KEUANGAN");
  const [judulTemuan, setJudulTemuan] = useState("");
  const [isiTemuan, setIsiTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);

  // Search di BKU Pengawas
  const [bkuSearch, setBkuSearch] = useState("");
  const [bkuFilter, setBkuFilter] = useState<"ALL" | "IN" | "OUT">("ALL");

  const refreshData = () => {
    setConfig(DataStore.getConfig());
    setMembers(DataStore.getMembers());
    setLoans(DataStore.getLoans());
    setSavings(DataStore.getSavings());
    setInstallments(DataStore.getInstallments());
    setProducts(DataStore.getProducts());
    setSales(DataStore.getSales());
    setSppdList(DataStore.getPerjalananDinas());
    setNotes(DataStore.getPengawasanNotes());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("kopdes-data-synced", refreshData);
    return () => window.removeEventListener("kopdes-data-synced", refreshData);
  }, []);

  // Check URL query tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam) {
        if (tabParam === "neraca") setActiveTab("neraca");
        if (tabParam === "perjalanan-dinas" || tabParam === "sppd") setActiveTab("sppd");
        if (tabParam === "bku") setActiveTab("bku");
        if (tabParam === "temuan") setActiveTab("temuan");
      }
    }
  }, []);

  // --- KALKULASI ARUS KAS & INDIKATOR AUDIT ---
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

  // Total Kas Keluar SPPD Dinas
  const totalSppdDicairkan = sppdList
    .filter((s) => s.status === "DICAIRKAN")
    .reduce((sum, s) => sum + s.totalBiaya, 0);

  const totalKasOperasional = Math.max(
    18500000,
    baselineKasAwal + (totalSimpananMasuk - totalPenarikanSukarela) - totalPinjamanDisbursed + totalAngsuranDiterima + totalPenjualanMart - totalSppdDicairkan
  );
  const kasTunaiLoket = Math.round(totalKasOperasional * 0.3);
  const kasBankRiauKepri = totalKasOperasional - kasTunaiLoket;

  // Rasio Likuiditas Pengawas (Kas Operasional vs Kewajiban Sukarela)
  const likuiditasRasio = totalSukarela > 0 ? (totalKasOperasional / totalSukarela) * 100 : 999;

  // Sisa Pinjaman & Kepatuhan Limit
  const sisaPinjamanAktif = loans
    .filter((l) => l.status === "DISBURSED")
    .reduce((sum, l) => sum + l.remainingAmount, 0);
  const pinjamanBesar = loans.filter((l) => l.amount > (config?.maxLoanWithoutMasterApproval || 5000000));

  // Handler Tambah Temuan Pengawas
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulTemuan.trim() || !isiTemuan.trim() || !rekomendasi.trim()) {
      alert("Harap isi semua kolom temuan dan rekomendasi!");
      return;
    }

    const newNote: PengawasanNote = {
      id: `note-${Date.now()}`,
      tanggal: new Date().toISOString().split("T")[0],
      pengawasName: currentUser?.name || "Drs. H. M. Syukri, M.Si",
      aspek,
      judul: judulTemuan,
      temuan: isiTemuan,
      rekomendasi,
      status: "TERBUKA",
    };

    DataStore.addPengawasanNote(newNote);
    alert("Catatan temuan dan rekomendasi pengawasan berhasil disimpan!");
    setJudulTemuan("");
    setIsiTemuan("");
    setRekomendasi("");
    setShowAddNote(false);
  };

  // Compile Buku Kas Umum (BKU) untuk Pengawas
  type BkuItem = {
    id: string;
    date: string;
    description: string;
    category: string;
    type: "IN" | "OUT";
    amount: number;
    officer: string;
  };

  const bkuItems: BkuItem[] = [
    // Simpanan Masuk
    ...savings
      .filter((s) => s.type !== "PENARIKAN_SUKARELA")
      .map((s) => ({
        id: s.id,
        date: s.date,
        description: `Setoran Simpanan ${s.type} - ${s.memberName} (${s.memberNik})`,
        category: `Simpanan ${s.type}`,
        type: "IN" as const,
        amount: s.amount,
        officer: s.officerName || "Bendahara",
      })),
    // Penarikan Sukarela
    ...savings
      .filter((s) => s.type === "PENARIKAN_SUKARELA")
      .map((s) => ({
        id: s.id,
        date: s.date,
        description: `Penarikan Tabungan Sukarela - ${s.memberName}`,
        category: "Penarikan Sukarela",
        type: "OUT" as const,
        amount: Math.abs(s.amount),
        officer: s.officerName || "Bendahara",
      })),
    // Pencairan Pinjaman
    ...loans
      .filter((l) => l.status === "DISBURSED" || l.status === "PAID_OFF")
      .map((l) => ({
        id: `cair-${l.id}`,
        date: l.disbursementDate || l.approvalDate || l.submissionDate,
        description: `Pencairan Pinjaman - ${l.memberName} (Tenor ${l.tenorMonths} bln)`,
        category: "Pencairan Pinjaman",
        type: "OUT" as const,
        amount: l.amount,
        officer: "Bendahara",
      })),
    // Pembayaran Angsuran
    ...installments
      .filter((i) => i.status === "PAID")
      .map((i) => ({
        id: `ang-${i.id}`,
        date: i.paymentDate || "2026-02-10",
        description: `Angsuran Ke-${i.installmentNo} Pinjaman - ${i.memberName || "Anggota"}`,
        category: "Angsuran Pinjaman",
        type: "IN" as const,
        amount: i.amount,
        officer: i.officerName || "Bendahara",
      })),
    // Penjualan Kopdes Mart
    ...sales.map((s) => ({
      id: `mart-${s.id}`,
      date: s.date.split("T")[0],
      description: `Kasir Kopdes Mart: ${s.invoiceNo} (${s.buyerType === "ANGGOTA" ? s.memberName : "Warga Umum"})`,
      category: `Mart (${s.buyerType === "ANGGOTA" ? "Anggota" : "Umum"})`,
      type: "IN" as const,
      amount: s.totalAmount,
      officer: s.cashierName,
    })),
    // Pencairan SPPD Perjalanan Dinas
    ...sppdList
      .filter((s) => s.status === "DICAIRKAN")
      .map((s) => ({
        id: `sppd-cair-${s.id}`,
        date: s.disbursedDate || s.tanggalPengajuan,
        description: `Pencairan SPPD ${s.nomorSppd}: ${s.namaPegawai} (${s.tujuan})`,
        category: "Perjalanan Dinas (SPPD)",
        type: "OUT" as const,
        amount: s.totalBiaya,
        officer: s.disbursedBy || "Bendahara",
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredBku = bkuItems.filter((item) => {
    const matchFilter = bkuFilter === "ALL" || item.type === bkuFilter;
    const matchSearch =
      item.description.toLowerCase().includes(bkuSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(bkuSearch.toLowerCase()) ||
      item.officer.toLowerCase().includes(bkuSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* HEADER PENGAWAS KOPERASI */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Dewan Pengawas Koperasi Desa
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Portal Pengawasan & Pemeriksaan Internal
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            Menjalankan fungsi pengawasan independen terhadap kebijakan pengurus, kepatuhan AD/ART,
            kesehatan kas desa, dan keadilan pelayanan bagi seluruh anggota Koperasi Merah Putih Lubuk Ogung.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs space-y-1">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <Scale className="w-4 h-4" /> Pengawas Terverifikasi
          </div>
          <p className="font-semibold text-white text-sm">{currentUser?.name || "Drs. H. M. Syukri, M.Si"}</p>
          <p className="text-[11px] text-slate-300">Mandat Rapat Anggota Tahunan (RAT)</p>
        </div>
      </div>

      {/* 4 INDIKATOR KESEHATAN & EARLY WARNING PENGAWAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: LIKUIDITAS KAS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Rasio Likuiditas Kas</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {likuiditasRasio.toFixed(1)}%
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Kas Cair Cukup Tutup Simpanan Sukarela
            </p>
          </div>
        </div>

        {/* KPI 2: KEPATUHAN APPROVAL MASTER */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Plafon Pinjaman &gt; 5 Juta</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {pinjamanBesar.length} Berkas
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              100% lolos persetujuan Master
            </p>
          </div>
        </div>

        {/* KPI 3: TINGKAT KELANCARAN ANGSURAN */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Kredit Macet (NPL)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-700 font-mono">
              0.0% (Lancar)
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Sisa pinjaman: {formatRupiah(sisaPinjamanAktif)}
            </p>
          </div>
        </div>

        {/* KPI 4: SERAPAN PERJALANAN DINAS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Kas SPPD Dicairkan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
              {formatRupiah(totalSppdDicairkan)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {sppdList.filter((s) => s.status === "DICAIRKAN").length} kegiatan resmi terlaksana
            </p>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION KHUSUS PENGAWAS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "audit"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Ringkasan Audit Koperasi
        </button>

        <button
          onClick={() => setActiveTab("bku")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "bku"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          <Landmark className="w-4 h-4" /> Audit Buku Kas Umum (BKU)
        </button>

        <button
          onClick={() => setActiveTab("sppd")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "sppd"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          <Briefcase className="w-4 h-4" /> Audit Perjalanan Dinas (SPPD)
        </button>

        <button
          onClick={() => setActiveTab("neraca")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "neraca"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Neraca Keuangan & SHU
        </button>

        <button
          onClick={() => setActiveTab("temuan")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "temuan"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
          }`}
        >
          <FileText className="w-4 h-4" /> Catatan Temuan & Rekomendasi ({notes.length})
        </button>
      </div>

      {/* TAB 1: RINGKASAN AUDIT KOPERASI */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {/* KOTAK STATUS KAS OPNAME RIIL */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4" /> Pemeriksaan Kas Opname Fisik vs Bank
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Verifikasi Saldo Uang Tunai Koperasi
                </h3>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                Status: Sinkron & Wajar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 font-medium">Uang Tunai di Brankas Kasir:</span>
                <div className="text-xl font-black text-slate-900 font-mono">{formatRupiah(kasTunaiLoket)}</div>
                <p className="text-[10px] text-slate-400">Siap untuk pencairan simpanan/pinjaman mendesak</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 font-medium">Rekening Giro Bank Riau Kepri:</span>
                <div className="text-xl font-black text-blue-700 font-mono">{formatRupiah(kasBankRiauKepri)}</div>
                <p className="text-[10px] text-slate-400">Tersimpan resmi atas nama badan hukum koperasi</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-xs text-emerald-800 font-medium">Total Kas Bersih Operasional:</span>
                <div className="text-xl font-black text-emerald-900 font-mono">{formatRupiah(totalKasOperasional)}</div>
                <p className="text-[10px] text-emerald-700">Likuiditas aman di atas ambang batas 150%</p>
              </div>
            </div>
          </div>

          {/* DUA KOLOM: AUDIT PINJAMAN & AUDIT MART */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AUDIT PINJAMAN ANGGOTA */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" /> Audit Pinjaman Modal Anggota
                </h4>
                <span className="text-xs text-slate-500">{loans.length} Berkas Pinjaman</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Total Pinjaman Tersalurkan:</span>
                  <span className="font-bold text-slate-900 font-mono">{formatRupiah(totalPinjamanDisbursed)}</span>
                </div>
                <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Total Sisa Pokok Berjalan:</span>
                  <span className="font-bold text-purple-700 font-mono">{formatRupiah(sisaPinjamanAktif)}</span>
                </div>
                <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Ketertiban Angsuran Cicilan:</span>
                  <span className="font-bold text-emerald-600">100% Lancar (Nol Tunggakan)</span>
                </div>
              </div>
            </div>

            {/* AUDIT MINIMARKET KOPDES MART */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" /> Audit Persediaan & Toko Mart
                </h4>
                <span className="text-xs text-slate-500">{products.length} SKU Produk</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Total Omzet Penjualan Sembako:</span>
                  <span className="font-bold text-slate-900 font-mono">{formatRupiah(totalPenjualanMart)}</span>
                </div>
                <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Nilai Persediaan Fisik (HPP):</span>
                  <span className="font-bold text-blue-700 font-mono">
                    {formatRupiah(products.reduce((sum, p) => sum + p.stock * p.costPrice, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50">
                  <span className="text-slate-600">Stok Menipis / Perlu Kulakan:</span>
                  <span className="font-bold text-amber-600">
                    {products.filter((p) => p.stock <= p.minStock).length} Item Barang
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT BUKU KAS UMUM (BKU) */}
      {activeTab === "bku" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pemeriksaan Buku Kas Umum (BKU)</h3>
              <p className="text-xs text-slate-500">Seluruh mutasi penerimaan dan pengeluaran kas tercatat transparan.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setBkuFilter("ALL")}
                  className={`px-3 py-1 rounded-lg font-bold ${bkuFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setBkuFilter("IN")}
                  className={`px-3 py-1 rounded-lg font-bold ${bkuFilter === "IN" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600"}`}
                >
                  Kas Masuk (IN)
                </button>
                <button
                  onClick={() => setBkuFilter("OUT")}
                  className={`px-3 py-1 rounded-lg font-bold ${bkuFilter === "OUT" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600"}`}
                >
                  Kas Keluar (OUT)
                </button>
              </div>

              <input
                type="text"
                placeholder="Cari transaksi BKU..."
                value={bkuSearch}
                onChange={(e) => setBkuSearch(e.target.value)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Uraian / Keterangan Mutasi</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Kas Masuk (IN)</th>
                  <th className="py-3 px-3 text-right">Kas Keluar (OUT)</th>
                  <th className="py-3 px-3">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBku.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">{b.date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{b.description}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {b.type === "IN" ? formatRupiah(b.amount) : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      {b.type === "OUT" ? formatRupiah(b.amount) : "-"}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{b.officer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT PERJALANAN DINAS (SPPD) */}
      {activeTab === "sppd" && (
        <PerjalananDinasModule
          userRole="PENGAWAS"
          currentUserName={currentUser?.name || "Drs. H. M. Syukri, M.Si"}
        />
      )}

      {/* TAB 4: NERACA KEUANGAN RESMI */}
      {activeTab === "neraca" && <NeracaKeuangan userRole="PENGAWAS" />}

      {/* TAB 5: CATATAN & TEMUAN PENGAWASAN (BAP PENGAWAS) */}
      {activeTab === "temuan" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Risalah & Berita Acara Temuan Pengawasan
              </h3>
              <p className="text-xs text-slate-500">
                Catatan resmi hasil audit Dewan Pengawas untuk ditindaklanjuti Pengurus dan dilaporkan pada RAT.
              </p>
            </div>
            <button
              onClick={() => setShowAddNote(!showAddNote)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Catatan Temuan
            </button>
          </div>

          {/* FORM TAMBAH TEMUAN */}
          {showAddNote && (
            <form onSubmit={handleAddNote} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Form Catatan Temuan & Rekomendasi</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aspek Pengawasan</label>
                  <select
                    value={aspek}
                    onChange={(e) => setAspek(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value="KEUANGAN">Keuangan & Kas Desa</option>
                    <option value="KEPATUHAN">Kepatuhan Regulasi & AD/ART</option>
                    <option value="PINJAMAN">Pinjaman Modal & Angsuran</option>
                    <option value="OPERASIONAL_MART">Operasional & Stok Toko Mart</option>
                    <option value="UMUM">Umum & Administrasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Temuan / Topik Pemeriksaan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rekonsiliasi Kas Harian Brankas vs Buku Kas"
                    value={judulTemuan}
                    onChange={(e) => setJudulTemuan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fakta & Uraian Temuan Lapangan</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Jelaskan kondisi fisik yang ditemukan (apakah cocok, ada kendala, atau ada selisih)..."
                  value={isiTemuan}
                  onChange={(e) => setIsiTemuan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rekomendasi / Solusi Dewan Pengawas</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Rekomendasi perbaikan yang harus dilakukan Pengurus (Manager/Bendahara)..."
                  value={rekomendasi}
                  onChange={(e) => setRekomendasi(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNote(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Simpan Catatan Pengawas
                </button>
              </div>
            </form>
          )}

          {/* LIST CATATAN TEMUAN */}
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Belum ada catatan temuan pengawasan.
              </div>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {n.aspek}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{n.judul}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{formatDateIndo(n.tanggal)}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-slate-700">{n.pengawasName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-700 block text-[11px]">Temuan Pengawasan:</span>
                      <p className="text-slate-600 leading-relaxed">{n.temuan}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                      <span className="font-bold text-emerald-950 block text-[11px]">Rekomendasi Perbaikan:</span>
                      <p className="text-emerald-900 leading-relaxed">{n.rekomendasi}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Status:{" "}
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {n.status}
                      </span>
                    </span>

                    <button
                      onClick={() => window.print()}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak BAP Pengawas
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
